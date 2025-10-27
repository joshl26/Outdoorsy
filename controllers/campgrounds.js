// controllers/campgrounds.js
const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { basePath } = require('../config/basePath');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const NotFoundError = require('../utils/errors/NotFoundError');
const AppError = require('../utils/errors/AppError');

module.exports.index = async (req, res, next) => {
  try {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
  } catch (err) {
    next(err);
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
  try {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();

    if (!geoData.body.features.length) {
      throw new AppError('Invalid location provided', 400);
    }

    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    campground.author = req.user._id;
    await campground.save();

    req.flash('success', 'Successfully created a new campground!');
    res.redirect(`${basePath}/campgrounds/${campground._id}`);
  } catch (err) {
    next(err);
  }
};

module.exports.showCampground = async (req, res, next) => {
  try {
    const campground = await Campground.findById(req.params.id)
      .populate({
        path: 'reviews',
        populate: { path: 'author' },
      })
      .populate('author');

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    res.locals.pageTitle = `${campground.title} - Outdoorsy`;
    res.locals.pageDescription = campground.description
      ? campground.description.substring(0, 160)
      : `Explore ${campground.title} on Outdoorsy`;

    res.render('campgrounds/show', { campground });
  } catch (err) {
    next(err);
  }
};

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

module.exports.updateCampground = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {
      ...req.body.campground,
    });

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();

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
