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

/**
 * @swagger
 * /register/:
 *   get:
 *     tags:
 *     - Users
 *
 */

/**
 * @swagger
 * /register/:
 *   get:
 *     summary: Register new user form
 *     description: Register new user form
 *     responses:
 *       200:
 *         description: update campground listing contents
 */

/**
 * @swagger
 * /register/:
 *   post:
 *     tags:
 *     - Users
 *
 */

/**
 * @swagger
 * /register/:
 *   post:
 *     summary: Register new user
 *     description: Register new user
 *     responses:
 *       201:
 *         description: register new user
 */
router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

/**
 * @swagger
 * /login/:
 *   get:
 *     tags:
 *     - Users
 *
 */

/**
 * @swagger
 * /login/:
 *   get:
 *     summary: login user form
 *     description: login user form
 *     responses:
 *       200:
 *         description: update campground listing contents
 */

/**
 * @swagger
 * /login/:
 *   post:
 *     tags:
 *     - Users
 *
 */

/**
 * @swagger
 * /login/:
 *   post:
 *     summary: login user
 *     description: login user
 *     responses:
 *       201:
 *         description: login user
 */
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

/**
 * @swagger
 * /logout/:
 *   get:
 *     tags:
 *     - Users
 *
 */

/**
 * @swagger
 * /logout/:
 *   get:
 *     summary: logout user
 *     description: logout user
 *     responses:
 *       200:
 *         description: update campground listing contents
 */

router.get("/logout", users.logout);

module.exports = router;
