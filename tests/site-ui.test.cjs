const {test} = require('node:test');
const assert = require('node:assert/strict');
const {buildCatalog} = require('../plugins/blog-catalog/catalog.cjs');
const config = require('../plugins/blog-catalog/config.cjs');
const {parseSelection, sortPosts, getBlogView, getCategoryPreview} = require('../src/theme/BlogListPage/selectors.cjs');
const {validateBoard, getVisiblePorts} = require('../src/components/BoardExplorer/board-state.cjs');

const article = (id, extra = {}) => ({metadata: {
  title: id, permalink: '/blog/' + id, tags: [], frontMatter: {slug: id}, ...extra,
}});

test('catalog includes all public posts and excludes drafts and unlisted posts', () => {
  const input = [
    ...Array.from({length: 25}, (_, i) => article('post-' + i)),
    article('draft', {frontMatter: {draft: true}}),
    article('private', {unlisted: true}),
  ];
  const result = buildCatalog(input);
  assert.equal(result.posts.length, 25);
  assert.equal(result.categories.reduce((sum, category) => sum + category.count, 0), 25);
});

test('category metadata overrides legacy mapping and invalid categories fail', () => {
  const result = buildCatalog([article('welcome', {frontMatter: {slug: 'welcome', category: 'ai'}})]);
  assert.equal(result.posts[0].category, 'ai');
  assert.throws(() => buildCatalog([article('oops', {frontMatter: {category: 'typo'}})]), /Unknown category/);
});

test('legacy IDs, editorial titles and missing publication dates retain their meaning', () => {
  const result = buildCatalog([
    article('legacy', {source: 'blog/buildroot下搭建RKNN环境/post.md', date: '2026-11-13'}),
    article('display', {title:'DshanPi-A1 RK3576 测评一：测试'}),
  ]);
  assert.equal(result.posts[0].id, 'buildroot-rknn-setup');
  assert.equal(result.posts[0].date, null);
  assert.equal(result.posts[0].permalink, '/blog/legacy');
  assert.equal(result.posts[1].shortTitle, '测试');
  assert.equal(buildCatalog([article('welcome')], 'en').posts[0].shortTitle, 'Introducing DshanPi-A1');
});

test('duplicate public post IDs fail instead of producing ambiguous series', () => {
  assert.throws(() => buildCatalog([article('same'), article('same')]), /unique IDs/);
});

test('query parsing accepts known filters and restores sort order', () => {
  const selection = parseSelection('?category=ai&sort=oldest', config.categories, config.series);
  assert.equal(selection.category, 'ai');
  assert.equal(selection.sort, 'oldest');
  assert.equal(parseSelection('?category=unknown&series=unknown', config.categories, config.series).category, 'all');
});

const posts = [
  {id:'a',category:'ai',permalink:'/blog/a',date:'2025-12-01'},
  {id:'b',category:'ai',permalink:'/blog/b',date:'2025-01-01'},
  {id:'c',category:'system',permalink:'/blog/c',date:null},
];

test('both date orders keep unknown dates last without mutating the catalog', () => {
  assert.deepEqual(sortPosts(posts, 'oldest').map(post => post.id), ['b','a','c']);
  assert.deepEqual(sortPosts(posts, 'newest').map(post => post.id), ['a','b','c']);
  assert.deepEqual(posts.map(post => post.id), ['a','b','c']);
});

test('series order overrides date order, while legacy pages retain their page contents', () => {
  const input = {posts, categories: [{id:'ai'}], series: [{id:'guide',posts:['b','a']}], selection:{series:'guide',sort:'newest'}};
  assert.deepEqual(getBlogView(input).resultPosts.map(post => post.id), ['b','a']);
  assert.deepEqual(getBlogView({...input,legacyItems:[{content:{metadata:posts[2]}}]}).resultPosts.map(post => post.id), ['c']);
});

test('overview uses explicit featured order without duplicate rows', () => {
  assert.deepEqual(getCategoryPreview(posts, {id:'ai',featured:['b','missing']}).map(post => post.id), ['b','a']);
});

const views = {front:{photo:'/front.jpg',imageWidth:100,crop:{x:0,y:0,width:100,height:80},defaultPort:'a'}};
const ports = [
  {id:'a',side:'front',name:'A',group:'常用接口',rect:[0,0,20,20],href:'/docs/a',supplies:[]},
  {id:'b',side:'front',name:'B',group:'扩展接口',rect:[30,0,20,20],href:'/docs/b',supplies:[]},
];

test('board schema rejects unknown defaults, duplicate ports and crop overflow', () => {
  assert.doesNotThrow(() => validateBoard(views, ports));
  assert.throws(() => validateBoard(views, [ports[0],ports[0]]), /unique/);
  assert.throws(() => validateBoard({...views,front:{...views.front,defaultPort:'missing'}}, ports), /Default port/);
  assert.throws(() => validateBoard(views, [{...ports[0],rect:[90,0,20,20]}]), /outside/);
});

test('selected ports remain visible when outside the active filter or scenario', () => {
  assert.deepEqual(getVisiblePorts(ports, 'front', '常用接口', 'b').map(port => port.id), ['a','b']);
  assert.deepEqual(getVisiblePorts(ports, 'front', '全部', 'a', ['b']).map(port => port.id), ['a','b']);
});
