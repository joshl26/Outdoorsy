/* eslint-disable */
// scripts/addSlugs.js
const mongoose = require('mongoose');
const Campground = require('../models/campground');

async function addSlugs() {
  try {
    await mongoose.connect(
      'mongodb+srv://Render_Mongo:tcenCjENTFVixgEd@cluster0.x6l9rxc.mongodb.net/Outdoorsy?retryWrites=true&w=majority'
    );
    console.log('✅ Connected to MongoDB');

    const camps = await Campground.find({ slug: { $exists: false } });
    console.log(`📦 Found ${camps.length} campgrounds without slugs`);

    for (const cg of camps) {
      await cg.save(); // triggers pre-save hook to generate slug
      console.log(`✅ ${cg.title} → ${cg.slug}`);
    }

    console.log('🎉 All slugs generated!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

addSlugs();
