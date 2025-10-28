/* eslint-disable no-console */
// Migration: Normalize images array {url, filename, alt?} and remove dead Cloudinary refs

const Campground = require('../../models/campground');
const { cloudinary } = require('../../cloudinary');

async function isCloudinaryPublicIdAlive(publicId) {
  try {
    // Admin API not usually enabled; we attempt fetch via explicit method if available.
    // If you don’t have Admin API, set this to true or skip dead check.
    if (!cloudinary?.api?.resource) return true;
    await cloudinary.api.resource(publicId);
    return true;
  } catch {
    return false;
  }
}

async function up() {
  console.log(
    'Normalizing campground images and removing dead Cloudinary references...'
  );
  const cursor = Campground.find({}).cursor();
  let scanned = 0,
    normalized = 0,
    removed = 0;

  for (
    let camp = await cursor.next();
    camp != null;
    camp = await cursor.next()
  ) {
    scanned++;
    if (!Array.isArray(camp.images) || !camp.images.length) continue;

    let changed = false;
    const newImages = [];
    for (const img of camp.images) {
      // Normalize shape
      const url = img?.url;
      const filename =
        img?.filename || (typeof img === 'string' ? img : undefined);
      if (!url && !filename) continue; // skip invalid

      // Optional: verify cloudinary resource exists by filename (publicId)
      let alive = true;
      if (filename) alive = await isCloudinaryPublicIdAlive(filename);

      if (!alive) {
        removed++;
        changed = true;
        continue;
      }

      const normalizedImg = {
        url:
          url ||
          (filename
            ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${filename}`
            : undefined),
        filename: filename || (url ? url.split('/').slice(-1)[0] : undefined),
        alt: img?.alt || null,
      };

      newImages.push(normalizedImg);
    }

    // Deduplicate by filename
    const seen = new Set();
    const deduped = newImages.filter((img) => {
      const key = img.filename || img.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length !== camp.images.length || changed) {
      camp.images = deduped;
      await camp.save();
      normalized++;
    }

    if (scanned % 100 === 0) {
      console.log(
        `Scanned ${scanned}, normalized ${normalized}, removed ${removed}`
      );
    }
  }

  console.log(
    `Done. Scanned=${scanned}, normalized=${normalized}, removed=${removed}`
  );
}

async function down() {
  console.log(
    'No rollback: normalization is non-destructive and dead refs won’t be restored.'
  );
}

module.exports = { up, down };
