const {buildCatalog}=require('./catalog.cjs');
module.exports=function blogCatalog(context) {
  return {
    name:'blog-catalog',
    allContentLoaded({allContent,actions}) {
      const blog=allContent['docusaurus-plugin-content-blog']?.default;
      if (!blog) throw new Error('Blog catalog requires the default Docusaurus blog plugin.');
      actions.setGlobalData(buildCatalog(blog.blogPosts,context.i18n.currentLocale));
    },
  };
};
