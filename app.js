require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const app = express();
const fs = require("fs");
const YAML = require("yaml");
const file = fs.readFileSync("./postman/schemas/index.yaml", "utf8");
const swaggerDocument = YAML.parse(file);
const swaggerUi = require("swagger-ui-express");

//  configures the Express.js application to use the Swagger UI middleware for displaying a Swagger
//  document. The '/api-docs' route is used as an endpoint for accessing the Swagger UI.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// creates a session store using MongoDB as the backend storage. This allows users to save their
// sessions in MongoDB, providing a secure and persistent way for them to access their data even
// after they have closed the browser window. The MongoDBStore also provides an easy way to manage
// user sessions across multiple applications or servers.
const MongoDBStore = require("connect-mongo")(session);

//  used to connect a Mongoose application to a MongoDB database. It takes the URL of the database
//  (process.env.DB_URL) as an argument and sets several options that are needed for proper connection and operation.
//  The useNewUrlParser option ensures that the parser uses current Node.js driver behavior, while
//  useCreateIndex creates any indexes defined in your model schemas when connecting to the database.
//  The useUnifiedTopology option allows Mongoose to take advantage of new features in MongoDB drivers,
//  while useFindAndModify prevents findOneAndUpdate() from returning deprecated values.
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;

//  sets up the Express web application to use EJS as its view engine. This means that when a route
//  is requested, the server will look for an associated EJS file in the views folder and render it.
//  The ejsMate variable contains configuration options for how EJS should be rendered.
app.engine("ejs", ejsMate);

//  sets the view engine for the Express app to EJS. This allows the server to render dynamic HTML
//  pages using embedded JavaScript (EJS) templates.
app.set("view engine", "ejs");

//  sets the views directory for an Express app. It uses path.join() to join the current directory
// (__dirname) with the string "views", and then passes that as an argument into app.set(). This tells
// Express where to look for view files when it needs them, such as templates or partials.
app.set("views", path.join(__dirname, "views"));

app.use(logger);
app.use(errorHandler);

db.once("open", () => {
  console.log("Database connected");
});

db.on("error", (err) => {
  // console.error.bind(console, "connection error:");
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});

var userProfile;

//  configure Express.js middleware to parse incoming request bodies in a middleware before your
//  handlers, available under the req.body property. It parses data sent with POST and PUT requests
//  and makes it easier to extract relevant information from the request body for use within an
//  application.
app.use(express.urlencoded({ extended: true }));

//  using the Express.js methodOverride middleware to allow for overriding HTTP verbs, such as POST
//  and PUT. This allows clients to send requests with custom headers that specify which HTTP verb
//  they should be routed through, instead of being restricted to just GET and POST requests.
app.use(methodOverride("_method"));

//  configures Express to serve static files from the public directory. This allows users to access
//  files such as images, CSS and JavaScript that are stored in this directory when they visit the
//  website.
app.use(express.static(path.join(__dirname, "public")));

//  using the mongoSanitize middleware to protect against malicious MongoDB operations. The
//  "replaceWith" option specifies what character should replace any potentially unsafe characters,
//  such as "$". This helps prevent attacks like NoSQL injection.
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

const secret = process.env.MONGOOSE_SECRET;

//  creates a MongoDBStore object that is used to store session data. It takes in an url, secret
// and touchAfter parameter. The url specifies the location of the database where the session data
// will be stored, while the secret is used for signing and encrypting cookies. Finally, touchAfter
// defines how long a given session should remain valid before it needs to be renewed or updated.
const store = new MongoDBStore({
  url: process.env.DB_URL,
  secret,
  touchAfter: 24 * 60 * 60,
});

//  setting up an error handler for a session store. It will listen for any errors that occur and
//  log them to the console when they do.
store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

//  sets up a session configuration object for use in an application. It includes settings such as
//  the store to be used, the name of the session, a secret key, resave and saveUninitialized boolean
//  values, and cookie options such as httpOnly status and expiration time. This configuration is
//  necessary for applications that require user authentication or other forms of secure data storage.
const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

//  setting up the Express.js middleware 'flash' which allows for passing temporary messages
//  between requests. This is often used to display success or error messages after a form
//  submission, for example.
app.use(flash());
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
];
const connectSrcUrls = [
  "https://outdors.ca/",
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        process.env.CLOUDINARY, //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

//  configures the Express application to use Passport. It initializes the Passport middleware,
//  which allows authentication strategies (such as OAuth) to be used with an Express application.
app.use(passport.initialize());

//  sets up authentication for a web application. It requires the Passport middleware, which is used
//  to authenticate requests. It then initializes passport and creates a session so that subsequent
//  requests can be authenticated. Finally, it tells Express to use passport's session functionality,
//  allowing users to remain logged in between page visits.
app.use(passport.session());

//  sets up a LocalStrategy for authentication using the User.authenticate() method. This strategy is
//  used to authenticate users by verifying their username and password against stored credentials in
//  a database. It also allows for secure access to protected resources on the server side, such as
//  user profiles and account information.
passport.use(new LocalStrategy(User.authenticate()));

//  configure the passport authentication system. The serializeUser method takes a user object and
//  creates an identifier for it that will be stored in the session. This identifier can then be used
//  to retrieve the user object from the database when needed.
passport.serializeUser(User.serializeUser());

//  configures Passport.js to use the User model defined in the application. The serializeUser()
//  function is used to store user information in a session, while deserializeUser() retrieves that
//  information from the session and converts it back into a usable object for use within the
//  application.
passport.deserializeUser(User.deserializeUser());

//  used to set up middleware on the Express application. It sets up a "currentUser" variable in the
//  response locals, so that it can be accessed from any view template. Additionally, it uses flash
//  messages for success and error notifications which are accessible through res.locals.success and
//  res.locals.error respectively. Finally, the next() function is called to move onto the next piece
//  of middleware if there is one available (or proceed with handling the request).
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

//  a route handler for an HTTP GET request to the "/success" endpoint. When this route is accessed,
//  it will send back the content of the userProfile variable as a response.
app.get("/success", (req, res) => res.send(userProfile));
app.get("/error", (req, res) => res.send("error logging in"));

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
