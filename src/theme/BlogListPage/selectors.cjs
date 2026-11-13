function parseSelection(search, categories, series) {
  const params = new URLSearchParams(search);
  return {
    category: categories.some(item => item.id === params.get('category')) ? params.get('category') : 'all',
    series: series.some(item => item.id === params.get('series')) ? params.get('series') : null,
    latest: params.get('view') === 'latest',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
  };
}

function sortPosts(posts, sort) {
  return [...posts].sort((a, b) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
    return sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
}

function getBlogView({posts, categories, series, selection, legacyItems}) {
  const byId = new Map(posts.map(post => [post.id, post]));
  const activeSeries = series.find(item => item.id === selection.series);
  const activeCategory = categories.find(item => item.id === selection.category);
  let resultPosts;
  if (legacyItems) {
    const byPermalink = new Map(posts.map(post => [post.permalink, post]));
    resultPosts = legacyItems.map(({content}) => byPermalink.get(content.metadata.permalink) || content.metadata);
  } else if (activeSeries) {
    resultPosts = activeSeries.posts.map(id => byId.get(id)).filter(Boolean);
  } else {
    resultPosts = sortPosts(activeCategory ? posts.filter(post => post.category === activeCategory.id) : posts, selection.sort);
  }
  return {
    activeSeries, activeCategory, resultPosts,
    overview: !legacyItems && !activeSeries && !activeCategory && !selection.latest,
  };
}

function getCategoryPreview(posts, category, limit = 3) {
  const available = posts.filter(post => post.category === category.id);
  const byId = new Map(available.map(post => [post.id, post]));
  const featured = category.featured.map(id => byId.get(id)).filter(Boolean);
  const ids = new Set(featured.map(post => post.id));
  return [...featured, ...available.filter(post => !ids.has(post.id))].slice(0, limit);
}

module.exports = {parseSelection, sortPosts, getBlogView, getCategoryPreview};
