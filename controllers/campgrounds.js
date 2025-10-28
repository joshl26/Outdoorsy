// Controller for managing campground-related operations
// file: controllers/campgrounds.js

const Campground = require('../models/campground');
const Review = require('../models/review');
const User = require('../models/user');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { basePath } = require('../config/basePath');
const mapBoxToken = process.env.MAPBOX_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN; // tolerate either var
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const NotFoundError = require('../utils/errors/NotFoundError');
const AppError = require('../utils/errors/AppError');

// Optional caching (enabled if utils/cache exists and OUTDOORSY_CACHE !== '0')
let cacheGetOrSet = null;
const enableCache = process.env.OUTDOORSY_CACHE !== '0';
if (enableCache) {
  try {
    // provide ../utils/cache.js with getOrSet(key, ttlSeconds, fetchFn)
    cacheGetOrSet = require('../utils/cache').getOrSet;
  } catch {
    cacheGetOrSet = null;
  }
}

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
    if (!mapBoxToken) {
      throw new AppError(
        'Geocoding is not configured. Missing MAPBOX_TOKEN.',
        500
      );
    }

    const location = req.body?.campground?.location || '';

    const geocodeFetch = async () => {
      return await geocoder
        .forwardGeocode({ query: location, limit: 1 })
        .send();
    };
    const geoData = cacheGetOrSet
      ? await cacheGetOrSet(`geo:${location}`, 86400, geocodeFetch)
      : await geocodeFetch();

    if (!geoData?.body?.features?.length) {
      throw new AppError('Invalid location provided', 400);
    }

    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = (req.files || []).map((f) => ({
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

/**
 * Display campgrounds with filters and pagination.
 * Filters:
 * - q: text search across title, description, location (regex-based)
 * - minPrice, maxPrice: numeric range
 * - lat, lng, radiusKm: geo radius in kilometers (requires 2dsphere index)
 * Pagination:
 * - page, limit
 */
module.exports.index = async (req, res, next) => {
  try {
    // Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // Filters
    const filter = {};

    // Helpers for robust parsing
    const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
    const parseNum = (val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    // Text search (regex OR). For large scale, consider MongoDB text index.
    const q = (req.query.q || '').trim();
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
      ];
    }

    // Price range
    const minPrice = parseNum(req.query.minPrice);
    const maxPrice = parseNum(req.query.maxPrice);
    if (isFiniteNum(minPrice) || isFiniteNum(maxPrice)) {
      filter.price = {};
      if (isFiniteNum(minPrice)) filter.price.$gte = minPrice;
      if (isFiniteNum(maxPrice)) filter.price.$lte = maxPrice;
    }

    // Geo radius (Point [lng, lat])
    const lat = parseNum(req.query.lat);
    const lng = parseNum(req.query.lng);
    const radiusKm = parseNum(req.query.radiusKm);
    if (
      isFiniteNum(lat) &&
      isFiniteNum(lng) &&
      isFiniteNum(radiusKm) &&
      radiusKm > 0
    ) {
      const earthRadiusKm = 6378.1;
      const radiusRadians = Math.min(radiusKm, 500) / earthRadiusKm; // cap to 500km
      filter.geometry = {
        $geoWithin: { $centerSphere: [[lng, lat], radiusRadians] },
      };
    }

    const projection = {
      title: 1,
      price: 1,
      location: 1,
      'images.url': 1,
      'images.filename': 1,
      geometry: 1,
      createdAt: 1,
      author: 1,
      description: 1,
    };
    const sort = { createdAt: -1 };

    // Optional caching
    const keyParts = [
      `p${page}`,
      `l${limit}`,
      q ? `q:${q}` : '',
      Number.isFinite(minPrice) ? `min:${minPrice}` : '',
      Number.isFinite(maxPrice) ? `max:${maxPrice}` : '',
      Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radiusKm)
        ? `geo:${lat},${lng},${radiusKm}`
        : '',
    ].filter(Boolean);
    const cacheKey = `cg:index:v3:${keyParts.join(':')}`;

    const fetchIndex = async () => {
      const [campgrounds, total] = await Promise.all([
        Campground.find(filter, projection)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Campground.countDocuments(filter),
      ]);
      return { campgrounds, total };
    };

    const data = cacheGetOrSet
      ? await cacheGetOrSet(cacheKey, 60, fetchIndex)
      : await fetchIndex();
    const totalPages = Math.ceil(data.total / limit);

    // Favorites for current user to pre-highlight hearts
    let favorites = [];
    if (req.user) {
      if (Array.isArray(req.user.favorites)) {
        favorites = req.user.favorites.map(String);
      } else {
        const userDoc = await User.findById(req.user._id)
          .select('favorites')
          .lean();
        favorites = (userDoc?.favorites || []).map(String);
      }
    }

    res.render('campgrounds/index', {
      campgrounds: data.campgrounds,
      page,
      totalPages,
      total: data.total,
      // Echo filters for form/UI (undefined -> '')
      q,
      minPrice: minPrice ?? '',
      maxPrice: maxPrice ?? '',
      lat: lat ?? '',
      lng: lng ?? '',
      radiusKm: radiusKm ?? '',
      favorites,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Nearby: closest-first using $geoNear (separate page from index).
 * Requires: lat, lng, radiusKm
 * Optional: q, minPrice, maxPrice, sort
 * Pagination: page, limit
 */
module.exports.nearby = async (req, res, next) => {
  try {
    // Helpers
    const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
    const parseNum = (val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    // Required geo inputs
    const lat = parseNum(req.query.lat);
    const lng = parseNum(req.query.lng);
    const radiusKm = parseNum(req.query.radiusKm);

    // If no valid geo params provided, render empty state (initial page load)
    if (lat === undefined && lng === undefined && radiusKm === undefined) {
      // favorites for logged-in users (empty grid still needs heart state if we show examples later)
      let favorites = [];
      if (req.user?.favorites) {
        favorites = req.user.favorites.map(String);
      }
      return res.render('campgrounds/nearby', {
        campgrounds: [],
        page: 1,
        totalPages: 0,
        total: 0,
        q: '',
        minPrice: '',
        maxPrice: '',
        lat: '',
        lng: '',
        radiusKm: 25, // default radius
        sort: 'distance', // default sort
        favorites,
      });
    }

    // If params provided but invalid, throw error
    if (
      !isFiniteNum(lat) ||
      !isFiniteNum(lng) ||
      !isFiniteNum(radiusKm) ||
      radiusKm <= 0
    ) {
      const err = new Error(
        'lat, lng, and radiusKm are required for Nearby search'
      );
      err.status = 400;
      throw err;
    }

    // Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // Optional filters
    const q = (req.query.q || '').trim();
    const minPrice = parseNum(req.query.minPrice);
    const maxPrice = parseNum(req.query.maxPrice);
    const sort = req.query.sort || 'distance';

    const nonGeoMatch = {};
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      nonGeoMatch.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
      ];
    }
    if (isFiniteNum(minPrice) || isFiniteNum(maxPrice)) {
      nonGeoMatch.price = {};
      if (isFiniteNum(minPrice)) nonGeoMatch.price.$gte = minPrice;
      if (isFiniteNum(maxPrice)) nonGeoMatch.price.$lte = maxPrice;
    }

    // Geo stage
    const radiusMeters = Math.min(radiusKm, 500) * 1000;
    const geoNearStage = {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance', // in meters
        maxDistance: radiusMeters,
        spherical: true,
        key: 'geometry',
      },
    };

    const projectStage = {
      $project: {
        title: 1,
        price: 1,
        location: 1,
        'images.url': 1,
        'images.filename': 1,
        geometry: 1,
        createdAt: 1,
        author: 1,
        description: 1,
        distance: 1,
      },
    };

    // Sort stage based on user selection
    let sortStage;
    if (sort === 'priceAsc') {
      sortStage = { $sort: { price: 1, distance: 1 } };
    } else if (sort === 'priceDesc') {
      sortStage = { $sort: { price: -1, distance: 1 } };
    } else {
      sortStage = { $sort: { distance: 1 } }; // default: closest first
    }

    // Build pipelines
    const dataPipeline = [geoNearStage];
    if (Object.keys(nonGeoMatch).length)
      dataPipeline.push({ $match: nonGeoMatch });
    dataPipeline.push(
      projectStage,
      sortStage,
      { $skip: skip },
      { $limit: limit }
    );

    const countPipeline = [geoNearStage];
    if (Object.keys(nonGeoMatch).length)
      countPipeline.push({ $match: nonGeoMatch });
    countPipeline.push({ $count: 'total' });

    // Execute (aggregation returns plain objects)
    const [campgrounds, countDoc] = await Promise.all([
      Campground.aggregate(dataPipeline),
      Campground.aggregate(countPipeline),
    ]);

    const total = countDoc[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Favorites for current user
    let favorites = [];
    if (req.user) {
      if (Array.isArray(req.user.favorites)) {
        favorites = req.user.favorites.map(String);
      } else {
        const userDoc = await User.findById(req.user._id)
          .select('favorites')
          .lean();
        favorites = (userDoc?.favorites || []).map(String);
      }
    }

    res.render('campgrounds/nearby', {
      campgrounds,
      page,
      totalPages,
      total,
      // Echo inputs
      q,
      minPrice: isFiniteNum(minPrice) ? minPrice : '',
      maxPrice: isFiniteNum(maxPrice) ? maxPrice : '',
      lat,
      lng,
      radiusKm,
      sort,
      favorites,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Show details for a specific campground.
 * - Paginated reviews via separate query for scalability
 * - Populate campground author
 * - SEO-friendly locals
 */
module.exports.showCampground = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Reviews pagination for show page
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const campground = await Campground.findById(id)
      .populate({ path: 'author', select: 'email username' })
      .lean();

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ campground: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'author', select: 'email username' })
        .lean(),
      Review.countDocuments({ campground: id }),
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    // Compute isFavorited for initial heart state
    let isFavorited = false;
    if (req.user) {
      const favs = Array.isArray(req.user.favorites)
        ? req.user.favorites.map(String)
        : (
            (await User.findById(req.user._id).select('favorites').lean())
              ?.favorites || []
          ).map(String);
      isFavorited = favs.includes(String(id));
    }

    // Ensure res.locals exists in test/middleware-less environments
    res.locals = res.locals || {};
    res.locals.pageTitle = `${campground.title} - Outdoorsy`;
    res.locals.pageDescription = campground.description
      ? campground.description.substring(0, 160)
      : `Explore ${campground.title} on Outdoorsy`;

    res.render('campgrounds/show', {
      campground,
      reviews,
      reviewsPage: page,
      reviewsTotalPages: totalPages,
      reviewsTotal: totalReviews,
      reviewsLimit: limit,
      isFavorited,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Render the edit form for a campground.
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
 * - Update fields
 * - Add new uploaded images
 * - Delete images if requested
 */
module.exports.updateCampground = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campground = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.campground },
      { new: true }
    );

    if (!campground) {
      throw new NotFoundError('Campground not found');
    }

    const imgs = (req.files || []).map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    if (imgs.length) {
      campground.images.push(...imgs);
      await campground.save();
    }

    if (req.body.deleteImages && req.body.deleteImages.length) {
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

/**
 * Toggle favorite for the current user.
 * POST /campgrounds/:id/favorite
 */
module.exports.toggleFavorite = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;

    const user = await User.findById(req.user._id).select('favorites');
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!Array.isArray(user.favorites)) user.favorites = [];

    const idx = user.favorites.findIndex((fid) => String(fid) === String(id));
    let status = 'added';
    if (idx >= 0) {
      user.favorites.splice(idx, 1);
      status = 'removed';
    } else {
      user.favorites.push(id);
    }
    await user.save();
    return res.json({ status });
  } catch (err) {
    next(err);
  }
};

/**
 * List favorites for the current user.
 * GET /campgrounds/favorites
 */
module.exports.listFavorites = async (req, res, next) => {
  try {
    if (!req.user) {
      req.flash('error', 'Please sign in to view favorites.');
      return res.redirect(`${basePath}/login`);
    }

    const user = await User.findById(req.user._id).select('favorites').lean();
    const favIds = user?.favorites || [];

    const campgrounds = await Campground.find({ _id: { $in: favIds } })
      .select('title price location images createdAt')
      .lean();

    res.render('campgrounds/favorites', {
      campgrounds,
      total: campgrounds.length,
    });
  } catch (err) {
    next(err);
  }
};
