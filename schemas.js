// Joi schema validation with HTML sanitization
// file: schemas.js

const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

/**
 * Joi extension to add a custom string rule 'escapeHTML'.
 * - Sanitizes input to remove any HTML tags and attributes.
 * - Throws a validation error if input contains HTML.
 */
const extension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.escapeHTML': '{{#label}} must not include HTML!',
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        // Sanitize input by removing all HTML tags and attributes
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        // If sanitized value differs, input contained HTML - throw error
        if (clean !== value)
          return helpers.error('string.escapeHTML', { value });
        return clean;
      },
    },
  },
});

// Extend Joi with the custom escapeHTML rule
const Joi = BaseJoi.extend(extension);

/**
 * Joi schema for validating campground data.
 * - campground object is required.
 * - title, location, description: required strings with no HTML.
 * - price: required number, minimum 0.
 */
module.exports.campgroundSchema = Joi.object({
  campground: Joi.object({
    title: Joi.string().required().escapeHTML(),
    price: Joi.number().required().min(0),
    location: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
  }).required(),
  // deleteImages: Joi.array() // Uncomment if you want to validate image deletions
});

/**
 * Joi schema for validating review data.
 * - review object is required.
 * - rating: required number between 1 and 5.
 * - body: required string with no HTML.
 */
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required().escapeHTML(),
  }).required(),
});
