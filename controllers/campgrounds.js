// Controller for managing campground-related operations
// file: controllers/campgrounds.js

const Campground = require('../models/campground');
const Review = require('../models/review');
const User = require('../models/user');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { basePath } = require('../config/basePath');
const mapBoxToken = process.env.MAPBOX_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

const NotFoundError = require('../utils/errors/NotFoundError');
const AppError = require('../utils/errors/AppError');
const catchAsync = require('../utils/catchAsync');

// Optional caching (enabled if utils/cache exists and OUTDOORSY_CACHE !== '0')
let cacheGetOrSet = null;
const enableCache = process.env.OUTDOORSY_CACHE !== '0';
if (enableCache) {
  try {
    cacheGetOrSet = require('../utils/cache').getOrSet;
  } catch {
    cacheGetOrSet = null;
  }
}

// SEO constants
const SITE_ROOT = 'https://joshlehman.ca';
const SUB_ROOT = `${SITE_ROOT}/outdoorsy`;

// Helpers
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
const parseNum = (val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
};
const clampStr = (s, n) => (s ? String(s).slice(0, n) : '');

/**
 * Build a full URL from the current request with optional overrides
 * (used for rel="prev"/rel="next" pagination links)
 */
const buildUrlWithParams = (req, overrideParams = {}) => {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  const params = url.searchParams;
  Object.entries(overrideParams).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') {
      params.delete(k);
    } else {
      params.set(k, String(v));
    }
  });
  url.search = params.toString();
  return url.toString();
};

/**
 * Render the form to create a new campground.
 */
module.exports.renderNewForm = (req, res) => {
  res.render('campgrounds/new', {
    pageTitle: 'Add New Campground | Outdoorsy',
    pageDescription:
      'Create a new campground listing on Outdoorsy and share your favorite outdoor spots with the community.',
    currentUrl: req.originalUrl,
    breadcrumbTrail: [
      { name: 'Campgrounds', url: `${SUB_ROOT}/campgrounds` },
      { name: 'New', url: `${SUB_ROOT}/campgrounds/new` },
    ],
  });
};

/**
 * Create a new campground.
 */
module.exports.createCampground = async (req, res, next) => {
  try {
    if (!mapBoxToken) throw new AppError('Missing MAPBOX_TOKEN.', 500);

    const location = req.body?.campground?.location || '';

    const geocodeFetch = async () =>
      await geocoder.forwardGeocode({ query: location, limit: 1 }).send();

    const geoData = cacheGetOrSet
      ? await cacheGetOrSet(`geo:${location}`, 86400, geocodeFetch)
      : await geocodeFetch();

    if (!geoData?.body?.features?.length)
      throw new AppError('Invalid location provided', 400);

    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = (req.files || []).map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    campground.author = req.user._id;

    await campground.save();
    req.flash('success', 'Successfully created campground!');
    res.redirect(`${basePath}/campgrounds/${campground._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Index – main campgrounds listing.
 */
module.exports.index = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    const q = (req.query.q || '').trim();
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
      ];
    }

    const minPrice = parseNum(req.query.minPrice);
    const maxPrice = parseNum(req.query.maxPrice);
    if (isFiniteNum(minPrice) || isFiniteNum(maxPrice)) {
      filter.price = {};
      if (isFiniteNum(minPrice)) filter.price.$gte = minPrice;
      if (isFiniteNum(maxPrice)) filter.price.$lte = maxPrice;
    }

    const lat = parseNum(req.query.lat);
    const lng = parseNum(req.query.lng);
    const radiusKm = parseNum(req.query.radiusKm);
    if (
      isFiniteNum(lat) &&
      isFiniteNum(lng) &&
      isFiniteNum(radiusKm) &&
      radiusKm > 0
    ) {
      const rads = Math.min(radiusKm, 500) / 6378.1;
      filter.geometry = { $geoWithin: { $centerSphere: [[lng, lat], rads] } };
    }

    const projection = {
      title: 1,
      price: 1,
      location: 1,
      'images.url': 1,
      geometry: 1,
      description: 1,
    };

    const fetchIndex = async () => {
      const [campgrounds, total] = await Promise.all([
        Campground.find(filter, projection)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Campground.countDocuments(filter),
      ]);
      return { campgrounds, total };
    };

    const data = cacheGetOrSet
      ? await cacheGetOrSet(`cg:index:${page}:${q}`, 60, fetchIndex)
      : await fetchIndex();

    const totalPages = Math.ceil(data.total / limit);

    // Pagination link hints
    let prevUrl = null;
    let nextUrl = null;
    if (page > 1) prevUrl = buildUrlWithParams(req, { page: page - 1 });
    if (page < totalPages)
      nextUrl = buildUrlWithParams(req, { page: page + 1 });

    const favorites =
      req.user?.favorites?.map(String) ||
      (
        (await User.findById(req.user?._id).select('favorites').lean())
          ?.favorites || []
      ).map(String);

    const pageUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    res.render('campgrounds/index', {
      campgrounds: data.campgrounds,
      page,
      totalPages,
      total: data.total,
      q,
      minPrice: minPrice ?? '',
      maxPrice: maxPrice ?? '',
      lat: lat ?? '',
      lng: lng ?? '',
      radiusKm: radiusKm ?? '',
      favorites,
      // SEO
      pageTitle: 'Top Campgrounds Near You | Outdoorsy',
      pageDescription:
        'Browse top-rated campgrounds near you. Filter by amenities, read reviews, and plan your perfect outdoor stay with Outdoorsy.',
      currentUrl: req.originalUrl,
      canonical: pageUrl,
      prevUrl,
      nextUrl,
      breadcrumbTrail: [
        { name: 'Campgrounds', url: `${SUB_ROOT}/campgrounds` },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        name: 'Campgrounds Listing | Outdoorsy',
        description: 'Browse and discover top-rated campgrounds on Outdoorsy.',
        isPartOf: { '@id': 'https://joshlehman.ca/#website' },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Nearby – geo search.
 */
// controllers/campgrounds.js
module.exports.nearby = catchAsync(async (req, res) => {
  if (res.headersSent) return;

  const {
    q = '',
    minPrice,
    maxPrice,
    lat,
    lng,
    radiusKm: radiusKmRaw,
    sort = 'distance',
    page: pageRaw = 1,
  } = req.query;
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const limit = 12;

  const radiusKm = radiusKmRaw
    ? Math.max(1, Math.min(500, Number(radiusKmRaw)))
    : undefined;
  const latNum = lat ? Number(lat) : undefined;
  const lngNum = lng ? Number(lng) : undefined;
  const haveAllGeo =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    Number.isFinite(radiusKm);

  const baseLocals = {
    title: 'Nearby Campgrounds',
    q,
    minPrice: minPrice ?? '',
    maxPrice: maxPrice ?? '',
    lat: Number.isFinite(latNum) ? latNum : '',
    lng: Number.isFinite(lngNum) ? lngNum : '',
    radiusKm: Number.isFinite(radiusKm) ? radiusKm : '',
    sort,
    page,
    favorites: res.locals?.favorites || [],
    currentUser: req.user || null,
  };

  if (!haveAllGeo) {
    return res.render('campgrounds/nearby', {
      ...baseLocals,
      campgrounds: [],
      total: 0,
      totalPages: 0,
      inlineNotice:
        'Enter a location and radius, or use your current location.',
    });
  }

  const meters = radiusKm * 1000;
  const Campground = require('../models/campground');

  // Build aggregation pipeline
  const pipeline = [];

  // Stage 1: $geoNear (must be first, no query allowed with text search)
  pipeline.push({
    $geoNear: {
      near: { type: 'Point', coordinates: [lngNum, latNum] },
      distanceField: 'distance',
      maxDistance: meters,
      spherical: true,
    },
  });

  // Stage 2: Text search via $match with regex (after $geoNear)
  if (q) {
    const searchRegex = new RegExp(q.split(/\s+/).join('|'), 'i');
    pipeline.push({
      $match: {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { location: searchRegex },
        ],
      },
    });
  }

  // Stage 3: Price filter
  const hasMin = minPrice !== '' && typeof minPrice !== 'undefined';
  const hasMax = maxPrice !== '' && typeof maxPrice !== 'undefined';
  if (hasMin || hasMax) {
    const priceMatch = {};
    if (hasMin) priceMatch.$gte = Number(minPrice);
    if (hasMax) priceMatch.$lte = Number(maxPrice);
    pipeline.push({ $match: { price: priceMatch } });
  }

  // Stage 4: Sort
  const sortStage = {};
  if (sort === 'priceAsc') {
    sortStage.price = 1;
  } else if (sort === 'priceDesc') {
    sortStage.price = -1;
  } else {
    sortStage.distance = 1;
  }
  pipeline.push({ $sort: sortStage });

  // Count total (before pagination)
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Campground.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Stage 5: Pagination
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: limit });

  // Execute
  const campgrounds = await Campground.aggregate(pipeline);

  return res.render('campgrounds/nearby', {
    ...baseLocals,
    campgrounds,
    total,
    totalPages,
  });
});
/**
 * Show details for a specific campground.
 * - Paginated reviews via separate query for scalability
 * - Populate campground author
 * - SEO-friendly locals + JSON-LD
 */
module.exports.showCampground = async (req, res, next) => {
  const { id } = req.params; // can be slug or ObjectId

  try {
    // Try slug first, fallback to _id for backward compatibility
    let campground = await Campground.findOne({ slug: id }).populate('author');

    // Fallback: try as ObjectId if slug lookup failed
    if (!campground && id.match(/^[0-9a-fA-F]{24}$/)) {
      campground = await Campground.findById(id).populate('author');

      // 301 redirect old ID URLs to canonical slug URL
      if (campground && campground.slug) {
        return res.redirect(301, `/outdoorsy/campgrounds/${campground.slug}`);
      }
    }

    if (!campground) {
      req.flash('error', 'Campground not found');
      return res.redirect('/outdoorsy/campgrounds');
    }

    // Reviews pagination params
    const reviewsLimit = 5;
    const reviewsPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (reviewsPage - 1) * reviewsLimit;

    // Fetch paginated reviews with author populated
    const reviews = await Review.find({ campground: campground._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(reviewsLimit)
      .populate('author')
      .lean();

    const reviewsCount = await Review.countDocuments({
      campground: campground._id,
    });
    const reviewsTotalPages = Math.ceil(reviewsCount / reviewsLimit);

    // Use slug in canonical URL
    const canonical = `/outdoorsy/campgrounds/${campground.slug}`;
    const currentUrl = canonical;

    res.render('campgrounds/show', {
      campground,
      reviews,
      reviewsPage,
      reviewsLimit,
      reviewsTotalPages,
      canonical,
      currentUrl,
      pageTitle: `${campground.title} — Outdoorsy`,
      pageDescription:
        campground.description?.substring(0, 155) ||
        `Discover ${campground.title}`,
      socialImageUrl: campground.images?.[0]?.url || '',
      breadcrumbTrail: [
        { name: 'Home', url: '/outdoorsy' },
        { name: 'Campgrounds', url: '/outdoorsy/campgrounds' },
        { name: campground.title, url: canonical },
      ],
      mapboxToken: process.env.MAPBOX_TOKEN || '',
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

    res.render('campgrounds/edit', {
      campground,
      pageTitle: `Edit ${campground.title} | Outdoorsy`,
      pageDescription: `Edit campground details for ${campground.title}`,
      currentUrl: req.originalUrl,
      robots: 'noindex, nofollow',
    });
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
      pageTitle: 'Your Favorite Campgrounds | Outdoorsy',
      pageDescription:
        'View and manage your favorite outdoor destinations and campgrounds.',
      currentUrl: req.originalUrl,
      breadcrumbTrail: [
        { name: 'Favorites', url: `${SUB_ROOT}/campgrounds/favorites` },
      ],
    });
  } catch (err) {
    next(err);
  }
};
