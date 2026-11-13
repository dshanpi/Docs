const defaultConfig = require('./config.cjs');
const defaultThumbnails = require('./thumbnails.json');

function validateConfig(config) {
  const unique = (values, label) => {
    if (values.some(value => !value) || new Set(values).size !== values.length) throw new Error(label + ' must be non-empty and unique.');
  };
  unique(config.categories.map(item => item.id), 'Category IDs');
  unique(config.series.map(item => item.id), 'Series IDs');
  const categoryIds = new Set(config.categories.map(item => item.id));
  if (!categoryIds.has(config.defaultCategory)) throw new Error('Unknown default category.');
  for (const category of Object.values(config.postCategories)) {
    if (!categoryIds.has(category)) throw new Error('Unknown post category: ' + category);
  }
  for (const item of config.series) unique(item.posts, 'Series posts: ' + item.id);
  for (const item of config.categories) unique(item.featured, 'Featured posts: ' + item.id);
  for (const rule of config.tagCategories) {
    if (!categoryIds.has(rule.category)) throw new Error('Unknown tag category: ' + rule.category);
    new RegExp(rule.pattern, 'i');
  }
}

function postId(metadata, config) {
  const legacy = config.legacyIds.find(item => metadata.source?.includes(item.sourceIncludes));
  return legacy?.id || String(metadata.frontMatter?.slug || metadata.permalink.split('/').filter(Boolean).pop()).replace(/^\/+|\/+$/g, '');
}

function categoryFor(metadata, id, config) {
  const explicit = metadata.frontMatter?.category;
  if (explicit) {
    if (!config.categories.some(item => item.id === explicit)) throw new Error('Unknown category for ' + id + ': ' + explicit);
    return explicit;
  }
  if (config.postCategories[id]) return config.postCategories[id];
  const labels = (metadata.tags || []).map(tag => tag.label).join(' ');
  return config.tagCategories.find(rule => new RegExp(rule.pattern, 'i').test(labels))?.category || config.defaultCategory;
}

function buildCatalog(blogPosts, locale = 'zh-Hans', config = defaultConfig, thumbnails = defaultThumbnails) {
  validateConfig(config);
  const lang = locale === 'en' ? 'en' : 'zh';
  const posts = blogPosts.filter(({metadata}) => !metadata.unlisted && !metadata.frontMatter?.unlisted && !metadata.frontMatter?.draft).map(({metadata}) => {
    const id = postId(metadata, config);
    const shortTitle = metadata.frontMatter?.display_title || config.titleOverrides[id]?.[lang] ||
      config.titleReplacements.reduce((title, rule) => title.replace(new RegExp(rule.pattern, rule.flags), rule.value), metadata.title);
    return {
      id, category: categoryFor(metadata, id, config), title: metadata.title, shortTitle,
      description: config.descriptionOverrides[id]?.[lang] || metadata.description,
      permalink: metadata.permalink,
      thumbnail: thumbnails[id]?.src || null,
      thumbnailFit: thumbnails[id]?.fit || 'cover',
      // File timestamps are not editorial publication dates.
      date: metadata.frontMatter?.date ? metadata.date : null,
      readingTime: metadata.readingTime,
      tags: (metadata.tags || []).map(({label, permalink}) => ({label, permalink})),
    };
  });
  const ids = new Set(posts.map(post => post.id));
  if (ids.size !== posts.length || new Set(posts.map(post => post.permalink)).size !== posts.length) {
    throw new Error('Public blog posts must have unique IDs and permalinks.');
  }
  posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return {
    posts,
    categories: config.categories.map(item => ({
      id: item.id, title: item.title[lang], description: item.description[lang],
      featured: item.featured, count: posts.filter(post => post.category === item.id).length,
    })),
    series: config.series.map(item => ({
      id: item.id, title: item.title[lang], description: item.description[lang],
      posts: item.posts.filter(id => ids.has(id)),
    })).filter(item => item.posts.length),
  };
}

module.exports = {buildCatalog, validateConfig};
