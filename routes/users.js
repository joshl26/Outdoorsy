const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const users = require("../controllers/users");

/**
 * @swagger
 *  components:
 *   schemas:
 *    Users:
 *      type: object
 *      required:
 *      - username
 *      - email
 *      properties:
 *          id:
 *              type: string
 *              description: The auto generated id of the user
 *          email:
 *              type: string
 *              description: The email adress of the user
 *          username:
 *              type: string
 *              description: The username of the user
 */
router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

router
  .route("/login")
  .get(users.renderLogin)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

router.get("/logout", users.logout);

module.exports = router;
