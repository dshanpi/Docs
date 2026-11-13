import React from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useHistory,useLocation} from '@docusaurus/router';
import {PageMetadata,HtmlClassNameProvider,ThemeClassNames} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import {useBlogDateFormatter} from '@site/src/utils/blog';
import styles from './styles.module.css';
import {parseSelection, getBlogView, getCategoryPreview} from './selectors.cjs';

function Article({post,number,isEn,compact=false}) {
  const formatDate=useBlogDateFormatter();
  const thumbnailUrl=useBaseUrl(post.thumbnail || '/');
  return <li className={clsx(styles.article,compact && styles.compact)}>
    {number && <span className={styles.step} aria-hidden="true">{String(number).padStart(2,'0')}</span>}
    <div className={styles.articleBody}>
      <Link to={post.permalink} className={styles.articleTitle}>{post.shortTitle || post.title}</Link>
      {!compact && post.description && <p className={styles.description}>{post.description}</p>}
      <div className={styles.articleMeta}>
        {post.tags?.slice(0,2).map(tag=><Link key={tag.permalink} to={tag.permalink} className={styles.tag}>{tag.label}</Link>)}
        {!compact && post.date && <time dateTime={post.date}>{formatDate(post.date,{month:'short'})}</time>}
        {typeof post.readingTime==='number' && <span>{Math.ceil(post.readingTime)}{isEn?' min read':' 分钟阅读'}</span>}
      </div>
    </div>
    {post.thumbnail && <Link to={post.permalink} className={styles.thumbnail} tabIndex={-1} aria-hidden="true">
      <img src={thumbnailUrl} alt="" width="200" height="124" loading="lazy" decoding="async" style={{objectFit:post.thumbnailFit}}/>
    </Link>}
  </li>;
}

export default function BlogListPage(props) {
  const {metadata,items}=props;
  const {i18n}=useDocusaurusContext();
  const isEn=i18n.currentLocale==='en';
  const {posts,categories,series}=usePluginData('blog-catalog');
  const history=useHistory(), location=useLocation();
  const isBrowser=useIsBrowser();
  const selection=parseSelection(isBrowser?location.search:'',categories,series);
  const legacyPage=metadata.page>1;
  const blogPath=metadata.permalink.replace(/\/page\/\d+\/?$/,'');
  const choose=(key,value)=> {
    const params=new URLSearchParams(location.search);
    if (key!=='sort') ['category','series','view','sort'].forEach(name=>params.delete(name));
    if (value && value!=='all' && value!=='newest') params.set(key,value);
    else params.delete(key);
    history.push({pathname:blogPath,search:params.toString()?'?'+params:''});
  };
  const {activeSeries,activeCategory,overview,resultPosts}=getBlogView({posts,categories,series,selection,legacyItems:legacyPage?items:null});
  const title=activeSeries?.title || activeCategory?.title || (isEn?'All articles':'全部文章');

  return <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.blogPages,ThemeClassNames.page.blogListPage)}>
    <PageMetadata title={isEn?'Developer blog':'开发者博客'} description={metadata.blogDescription}/>
    <SearchMetadata tag="blog_posts_list"/>
    <BlogListPageStructuredData {...props}/>
    <Layout>
      <main className={clsx('container',styles.page)}>
        <header className={styles.heading}>
          <div><h1>{isEn?'Developer blog':'开发者博客'}</h1><p>{isEn?'Practical guides to systems, AI, multimedia and networking.':'系统搭建、AI 实战、音视频与网络服务。'}</p></div>
          <span className={styles.total}>{posts.length}{isEn?' articles · ':' 篇文章 · '}{categories.length}{isEn?' categories':' 个分类'}</span>
        </header>
        <nav className={styles.filters} aria-label={isEn?'Article categories':'文章分类'}>
          <div className={styles.categoryButtons}>
            <button type="button" aria-pressed={overview} onClick={()=>choose('category','all')}>{isEn?'Overview':'全部'}<span>{posts.length}</span></button>
            {categories.map(category=><button type="button" key={category.id} aria-pressed={!activeSeries && activeCategory?.id===category.id} onClick={()=>choose('category',category.id)}>{category.title}<span>{category.count}</span></button>)}
          </div>
          <button type="button" className={styles.chronological} aria-pressed={selection.latest && !activeSeries && !activeCategory} onClick={()=>choose('view','latest')}>{isEn?'By date':'按时间'}<span aria-hidden="true">↓</span></button>
        </nav>

        {overview ? <>
          <section className={styles.seriesSection} aria-labelledby="blog-series-title">
            <h2 id="blog-series-title">{isEn?'Article series':'系列专题'}</h2>
            <div className={styles.seriesGrid}>{series.map((item,index)=><Link key={item.id} to={blogPath+'?series='+item.id} className={styles.seriesCard}>
              <div className={styles.seriesMeta}><span>{isEn?'SERIES':'系列'} {String(index+1).padStart(2,'0')}</span><span>{item.posts.length}{isEn?' articles':' 篇'}</span></div>
              <h3>{item.title}</h3><p>{item.description}</p><span className={styles.seriesAction}>{isEn?'Read in order':'按顺序阅读'}</span>
            </Link>)}</div>
          </section>
          <div className={styles.categoryGrid}>{categories.map(category=> {
            const preview=getCategoryPreview(posts,category);
            return <section key={category.id} className={styles.categorySection} aria-labelledby={'category-'+category.id}>
              <div className={styles.sectionHeading}><h2 id={'category-'+category.id}>{category.title}<span>{category.count}{isEn?' articles':' 篇'}</span></h2><Link to={blogPath+'?category='+category.id} aria-label={(isEn?'View all ':'查看全部')+category.title+(isEn?' articles':'文章')}>{isEn?'View all':'查看全部'}</Link></div>
              <ul className={styles.articleList}>{preview.map(post=><Article key={post.permalink} post={post} isEn={isEn} compact/>)}</ul>
            </section>;
          })}</div>
        </> : <section className={styles.results} aria-labelledby="blog-results-title">
          <div className={styles.resultHeading}>
            <div><h2 id="blog-results-title" aria-live="polite">{title}<span>{resultPosts.length}{isEn?' articles':' 篇'}</span></h2><p>{activeSeries?.description || activeCategory?.description || (legacyPage?(isEn?'Archive · page '+metadata.page:'文章归档 · 第 '+metadata.page+' 页'):(isEn?'All published articles, sorted by date.':'全部文章，按发布时间排列。'))}</p></div>
            {!activeSeries && !legacyPage && <label className={styles.sort}>{isEn?'Sort':'排序'}<select value={selection.sort} onChange={event=>choose('sort',event.target.value)}><option value="newest">{isEn?'Newest first':'最新发布'}</option><option value="oldest">{isEn?'Oldest first':'最早发布'}</option></select></label>}
          </div>
          {activeSeries && <p className={styles.seriesHint}>{isEn?'Read from the first article to follow the complete project.':'建议从第 1 篇开始，按顺序完成整个项目。'}</p>}
          <ol className={styles.articleList}>{resultPosts.map((post,index)=><Article key={post.permalink} post={post} number={activeSeries?index+1:undefined} isEn={isEn}/>)}</ol>
          {!resultPosts.length && <p>{isEn?'No articles in this category yet.':'这个分类暂时还没有文章。'}</p>}
          {legacyPage && <BlogListPaginator metadata={metadata}/>}
        </section>}
        <footer className={styles.pageFooter}><Link to={blogPath+'/archive'}>{isEn?'Article archive':'文章归档'}</Link><Link to={blogPath+'/tags'}>{isEn?'Browse tags':'浏览全部标签'}</Link></footer>
      </main>
    </Layout>
  </HtmlClassNameProvider>;
}
