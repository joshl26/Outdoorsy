const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const users = require("../controllers/users");

router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

router
  .route("/login")
  .get(users.renderLogin)

  //  sets up an endpoint for a POST request to the '/login' route. It uses passport's "local"
  //  authentication strategy to authenticate the user with their credentials passed in the request
  //  body. If authentication fails, it will flash an error message and redirect back to the login
  //  page. If authentication is successful, it will call users.login which is a function that handles
  //  setting up session data and redirecting them to their profile page.
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

router.get("/logout", users.logout);

module.exports = router;
