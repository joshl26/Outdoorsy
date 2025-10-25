require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const { logger, logEvents } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { basePath, buildPath, buildAssetPath } = require('./config/basePath');
const app = express();
const fs = require('fs');
const YAML = require('yaml');
const file = fs.readFileSync('./postman/schemas/index.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);
const swaggerUi = require('swagger-ui-express');

// Swagger UI Documentation
app.use(
  buildPath('api-docs'),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

const MongoDBStore = require('connect-mongo');

// MongoDB Connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// View Engine Setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(logger);
app.use(errorHandler);

// Database Connection Events
db.once('open', () => {
  console.log('Database connected');
  console.log(`Application base path: ${basePath}`);
});

db.on('error', (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    'mongoErrLog.log'
  );
});

var userProfile;

// Body Parser Middleware
app.use(express.urlencoded({ extended: true }));

// Method Override for PUT/DELETE in forms
app.use(methodOverride('_method'));

// Static Files - UPDATED with basePath
app.use(basePath, express.static(path.join(__dirname, 'public')));

// MongoDB Sanitization
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

const secret = process.env.MONGOOSE_SECRET || 'thisshouldbeabettersecret';

// Session Store Configuration
const store = new MongoDBStore({
  mongoUrl: process.env.DB_URL,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on('error', function (e) {
  console.log('SESSION STORE ERROR', e);
});

// Session Configuration
const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true, // Enable in production with HTTPS
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// Helmet Security Headers
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// Content Security Policy Configuration
const scriptSrcUrls = [
  'https://stackpath.bootstrapcdn.com/',
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://kit.fontawesome.com/',
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net/',
  'https://static.cloudflareinsights.com/',
];

const styleSrcUrls = [
  'https://kit-free.fontawesome.com/',
  'https://stackpath.bootstrapcdn.com/',
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://use.fontawesome.com/',
  'https://cdn.jsdelivr.net/',
];

const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
];

const fontSrcUrls = [];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        process.env.CLOUDINARY || 'https://res.cloudinary.com/',
        'https://images.unsplash.com/',
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

// Passport Authentication Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Middleware - Make variables available to all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.basePath = basePath;
  res.locals.buildPath = buildPath;
  res.locals.buildAssetPath = buildAssetPath;
  next();
});

// Routes
app.use(buildPath(), userRoutes);
app.use(buildPath('campgrounds'), campgroundRoutes);
app.use(buildPath('campgrounds/:id/reviews'), reviewRoutes);

// Home Route
app.get(buildPath(), (req, res) => {
  res.render('home');
});

// Success Route (OAuth)
app.get(buildPath('success'), (req, res) => res.send(userProfile));

// Error Route (OAuth)
app.get(buildPath('error'), (req, res) => res.send('error logging in'));

// 404 Handler - Must be after all other routes
app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404));
});

// Error Handler - Must be last
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Oh No, Something Went Wrong!';
  res.status(statusCode).render('error', { err });
});

// Server Startup
const port = process.env.PORT || 3053;
app.listen(port, () => {
  console.log(`Serving on port ${port}`);
  console.log(`Access the application at: http://localhost:${port}${basePath}`);
});
