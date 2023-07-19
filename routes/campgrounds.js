const express = require("express");
const router = express.Router();
const campgrounds = require("../controllers/campgrounds");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const Campground = require("../models/campground");

/**
 * @swagger
 *  components:
 *   schemas:
 *    Campgrounds:
 *      type: object
 *      required:
 *      - title
 *      - location
 *      - price
 *      - description
 *      properties:
 *          _id:
 *              type: string
 *              format: uuid
 *              description: The id auto generated by mongoose for the campsite
 *          geometry:
 *              type: array
 *              description: Array of geometry objects
 *              items:
 *                  type: object
 *                  properties:
 *                      point:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  co-ordinate:
 *                                      type: number
 *                                      format: float
 *          title:
 *              type: string
 *              description: The title of the campsite
 *          location:
 *              type: string
 *              description: The location of the campsite
 *          price:
 *              type: number
 *              format: float
 *              description: The price for the campsite
 *          description:
 *              type: string
 *              description: The description of the campsite
 *          images:
 *              type: array
 *              description: Array of image objects
 *              items:
 *                  type: object
 *                  properties:
 *                      _id:
 *                          type: string
 *                          format: uuid
 *                          description: The id auto generated by mongoose for the campground
 *                      url:
 *                          type: string
 *                          format: uri
 *                          description: The url of the image
 *                      filename:
 *                          type: string
 *                          description: The filename of the image
 *          reviews:
 *              type: array
 *              description: Array of objects review ID's
 *              items:
 *                  type: object
 *                  properties:
 *                      _id:
 *                          type: string
 *                          format: uuid
 *                          description: The id auto generated by mongoose for the review
 *          author:
 *              type: string
 *              format: uuid
 *              description: ID of person that created the review
 *          __v:
 *              type: number
 *              format: int32
 *              description: Version of the campsite review, starting at 0 and incremented by +1 with each change saved
 *
 */

/**
 * @swagger
 * /campgrounds/:
 *   post:
 *     tags:
 *     - Campgrounds
 *
 */

/**
 * @swagger
 * /campgrounds/:
 *   post:
 *     summary: Create new campground
 *     description: Create new campground
 *     parameters:
 *       - in: body
 *         name: campground
 *         description: The campground to create
 *         schema:
 *           $ref: '#/components/schemas/Campgrounds'
 *     responses:
 *         201:
 *           description: campground created
 */

/**
 * @swagger
 * /campgrounds/:
 *   get:
 *     tags:
 *     - Campgrounds
 *
 */

/**
 * @swagger
 * /campgrounds/:
 *   get:
 *     summary: Get list of campgrounds
 *     description: Get list of campgrounds
 *     responses:
 *         201:
 *           description: campground created
 *     parameters:
 *       - in: body
 *         name: campground
 *         description: List of sites
 *         schema:
 *           $ref: '#/components/schemas/Campgrounds'
 */

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

/**
 * @swagger
 * /campgrounds/new:
 *   get:
 *     tags:
 *     - Campgrounds
 *
 */

/**
 * @swagger
 * /campgrounds/new:
 *  get:
 *      description: Create new campground
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: campground
 *          description: The campground to create
 *          schema:
 *            $ref: '#/components/schemas/Campgrounds'
 *      responses:
 *          201:
 *              description: campground created
 */
router.get("/new", isLoggedIn, campgrounds.renderNewForm);

/**
 * @swagger
 * /campgrounds/{id}:
 *   get:
 *     tags:
 *     - Campgrounds
 *
 */

/**
 * @swagger
 * /campgrounds/{id}:
 *   get:
 *     summary: Get campground details
 *     description: Get campground details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the Campground record to edit
 *         example: 646d919387d1d5003b83728c
 *         schema:
 *            type: string
 *     responses:
 *       200:
 *         description: Edit campground listing contents
 */

router
  .route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

/**
 * @swagger
 * /campgrounds/{id}/edit:
 *   get:
 *     tags:
 *     - Campgrounds
 *     summary: Edit a campground listing
 *     description: Return the form to edit a campground listing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the Campground record to edit
 *         example: 646d919387d1d5003b83728c
 *         schema:
 *            type: string
 *     responses:
 *       200:
 *         description: Edit campground listing contents
 */
router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
