// Campgrounds routes
// file: routes/campgrounds.js

const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

/**
 * Route for listing all campgrounds and creating a new campground.
 * POST route requires authentication, image upload, and validation.
 */
router
  .route('/')
  .get(catchAsync(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

/**
 * Route to render form for creating a new campground.
 * Requires user to be logged in.
 */
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

/**
 * Route for nearby campgrounds (closest-first using $geoNear).
 * Must come before /:id routes to avoid treating "nearby" as an id.
 */
router.get('/nearby', catchAsync(campgrounds.nearby));

/**
 * Favorites routes.
 * - GET /campgrounds/favorites: list the user's favorite campgrounds
 * - POST /campgrounds/:id/favorite: toggle favorite on/off
 * Place these above the '/:id' routes to avoid conflicts.
 */
router.get('/favorites', isLoggedIn, catchAsync(campgrounds.listFavorites));
router.post(
  '/:id/favorite',
  isLoggedIn,
  catchAsync(campgrounds.toggleFavorite)
);

/**
 * Routes for showing, updating, and deleting a specific campground.
 * PUT and DELETE require authentication and authorization.
 */
router
  .route('/:id')
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array('image'),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

/**
 * Route to render edit form for a campground.
 * Requires authentication and authorization.
 */
router.get(
  '/:id/edit',
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
