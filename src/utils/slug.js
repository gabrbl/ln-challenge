const slugify = require('slugify');

function generateSlug(text) {
  if (!text) return '';
  
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'es'
  });
}

module.exports = { generateSlug };
