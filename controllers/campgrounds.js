// Controller for managing campground-related operations
// file: controllers/campgrounds.js

const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { basePath } = require('../config/basePath');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const NotFoundError = require('../utils/errors/NotFoundError');
const AppError = require('../utils/errors/AppError');

/**
 * Render the form to create a new campground.
 */
module.exports.renderNewForm = (req, res) => {
  res.render('campgrounds/new');
};

/**
 * Create a new campground.
 * - Geocode the location string to get coordinates.
 * - Validate geocoding results.
 * - Save campground with images and author info.
 */
module.exports.createCampground = async (req, res, next) => {
  try {
    // Geocode the location string to get geographic coordinates
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();

    // If no geocoding results, throw a validation error
    if (!geoData.body.features.length) {
      throw new AppError('Invalid location provided', 400);
    }

    // Create new campground document with form data
    const campground = new Campground(req.body.campground);

    // Assign geometry coordinates from geocoding result
    campground.geometry = geoData.body.features[0].geometry;

    // Map uploaded files to image objects with url and filename
    campground.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));

    // Set the author to the currently logged-in user
    campground.author = req.user._id;

    // Save campground to database
    await campground.save();

    req.flash('success', 'Successfully created a new campground!');
    res.redirect(`${basePath}/campgrounds/${campground._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Display a list of all campgrounds.
 * Optimized with pagination, projections, and sorting.
 */
module.exports.index = async (req, res, next) => {
  try {
    // Parse pagination params with defaults and limits
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    const projection = {
      title: 1,
      price: 1,
      location: 1,
      'images.url': 1,
      geometry: 1,
      createdAt: 1,
      author: 1,
    };
    const sort = { createdAt: -1 };

    // Execute query and count in parallel for performance
    const [campgrounds, total] = await Promise.all([
      Campground.find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Campground.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('campgrounds/index', {
      campgrounds,
      page,
      totalPages,
      total,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Show details for a specific campground.
 * - Populate reviews and authors for display.
 * - Limit populated fields and number of reviews.
 * - Use lean for performance.
 * - Set SEO-friendly page title and description.
 */
module.exports.showCampground = async (req, res, next) => {
  try {
    const campground = await Campground.findById(req.params.id)
      .populate({
        path: 'reviews',
        select: 'rating body author createdAt',
        options: { sort: { createdAt: -1 }, limit: 20 },
        populate: { path: 'author', select: 'email username' },
      })
      .populate({ path: 'author', select: 'email username' })
      .lean();

    // If campground not found, throw 404 error
    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    // Set page title and description for SEO and display
    res.locals.pageTitle = `${campground.title} - Outdoorsy`;
    res.locals.pageDescription = campground.description
      ? campground.description.substring(0, 160)
      : `Explore ${campground.title} on Outdoorsy`;

    res.render('campgrounds/show', { campground });
  } catch (err) {
    next(err);
  }
};

/**
 * Render the edit form for a campground.
 * - Fetch campground by ID.
 * - Throw 404 if not found.
 */
module.exports.renderEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    res.locals.pageTitle = `Edit ${campground.title} - Outdoorsy`;

    res.render('campgrounds/edit', { campground });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a campground.
 * - Update campground fields from form data.
 * - Add new uploaded images.
 * - Delete images if requested (both from Cloudinary and DB).
 */
module.exports.updateCampground = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update campground with new data (return the doc for subsequent save)
    const campground = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.campground },
      { new: true }
    );

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    // Add new images uploaded in this request
    const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();

    // If images are marked for deletion, remove them from Cloudinary and DB
    if (req.body.deleteImages) {
      for (let filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
      await campground.updateOne({
        $pull: { images: { filename: { $in: req.body.deleteImages } } },
      });
    }

    req.flash('success', 'Successfully updated campground!');
    res.redirect(`${basePath}/campgrounds/${campground._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a campground by ID.
 * - Throw 404 if campground not found.
 */
module.exports.deleteCampground = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findByIdAndDelete(id);

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    req.flash('success', 'Successfully deleted campground');
    res.redirect(`${basePath}/campgrounds`);
  } catch (err) {
    next(err);
  }
};
