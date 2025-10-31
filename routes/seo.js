// routes/seo.js
const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');

const SITE_ROOT = 'https://joshlehman.ca';
const SUB_ROOT = `${SITE_ROOT}/outdoorsy`;

// Basic in-memory cache for sitemap body
let cached = { body: '', ts: 0 };
const TTL_MS = 5 * 60 * 1000; // 5 minutes

router.get('/robots.txt', (req, res) => {
  const robots = [
    'User-agent: *',
    'Allow: /outdoorsy/',
    'Disallow: /outdoorsy/login',
    'Disallow: /outdoorsy/register',
    'Sitemap: https://joshlehman.ca/outdoorsy/sitemap.xml',
    '',
  ].join('\n');
  res.type('text/plain').send(robots);
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const now = Date.now();
    if (cached.body && now - cached.ts < TTL_MS) {
      res.type('application/xml').send(cached.body);
      return;
    }

    const staticUrls = [
      `${SUB_ROOT}/`,
      `${SUB_ROOT}/campgrounds`,
      `${SUB_ROOT}/campgrounds/nearby`,
      `${SUB_ROOT}/campgrounds/favorites`,
    ];

    const campgrounds = await Campground.find({})
      .select('_id updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const urls = [
      ...staticUrls.map((loc) => ({
        loc,
        changefreq: 'weekly',
        priority: '0.7',
      })),
      ...campgrounds.map((c) => ({
        loc: `${SUB_ROOT}/campgrounds/${c._id}`,
        lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
        changefreq: 'weekly',
        priority: '0.8',
      })),
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((u) => {
        return [
          '<url>',
          `<loc>${u.loc}</loc>`,
          u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '',
          `<changefreq>${u.changefreq}</changefreq>`,
          `<priority>${u.priority}</priority>`,
          '</url>',
        ].join('');
      }),
      '</urlset>',
    ].join('');

    cached = { body: xml, ts: now };
    res.type('application/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
