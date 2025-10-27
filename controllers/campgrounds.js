// controllers/campgrounds.js
const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { basePath } = require('../config/basePath');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
  // Page metadata is already set by middleware
  const campgrounds = await Campground.find({});
  res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  // Page metadata is already set by middleware
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

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('author');

  if (!campground) {
    req.flash('error', 'Campground not found');
    return res.redirect(`${basePath}/campgrounds`);
  }

  // Set page-specific metadata
  res.locals.pageTitle = `${campground.title} - Outdoorsy`;
  res.locals.pageDescription = campground.description
    ? campground.description.substring(0, 160)
    : `Explore ${campground.title} on Outdoorsy`;

  res.render('campgrounds/show', { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);

  if (!campground) {
    req.flash('error', 'Campground not found');
    return res.redirect(`${basePath}/campgrounds`);
  }

  // Set page-specific metadata
  res.locals.pageTitle = `Edit ${campground.title} - Outdoorsy`;

  res.render('campgrounds/edit', { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });

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
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash('success', 'Successfully deleted campground');
  res.redirect(`${basePath}/campgrounds`);
};
