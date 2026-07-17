/**
 * Custom BlogListPage: Hero featured post (first item of first page) + card grid.
 * Overrides @theme/BlogListPage.
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import BlogCard from '@site/src/components/BlogCard';
import {useBlogDateFormatter} from '@site/src/utils/blog';

function BlogListPageMetadata(props) {
  const {metadata} = props;
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const title = isBlogOnlyMode ? siteTitle : blogTitle;
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function HeroPost({item}) {
  const {content: BlogPostContent} = item;
  const {metadata} = BlogPostContent;
  const {i18n} = useDocusaurusContext();
  const isEn = i18n.currentLocale === 'en';
  const formatDate = useBlogDateFormatter();
  const {title, description, permalink, date, readingTime, tags, authors} =
    metadata;

  return (
    <section className="blog-hero">
      <span className="blog-hero__badge">
        {isEn ? '★ Featured' : '★ 置顶推荐'}
      </span>
      <h1 className="blog-hero__title">
        <Link to={permalink}>{title}</Link>
      </h1>
      {description && <p className="blog-hero__desc">{description}</p>}
      <div className="blog-hero__meta">
        <span>📅 {formatDate(date)}</span>
        {typeof readingTime !== 'undefined' && (
          <span>
            {' · ⏱ '}
            {Math.ceil(readingTime)}
            {isEn ? ' min read' : ' 分钟阅读'}
          </span>
        )}
        {authors && authors.length > 0 && (
          <span>
            {' · 👤 '}
            {authors.map((a) => a.name).join(', ')}
          </span>
        )}
      </div>
      {tags && tags.length > 0 && (
        <div className="blog-hero__tags">
          {tags.map((t) => (
            <span key={t.permalink} className="blog-tag">
              #{t.label}
            </span>
          ))}
        </div>
      )}
      <Link
        to={permalink}
        className="button button--primary button--lg blog-hero__cta">
        {isEn ? 'Read article ->' : '阅读全文 ->'}
      </Link>
    </section>
  );
}

function BlogListPageContent(props) {
  const {metadata, items, sidebar} = props;
  // Only show the hero on the first page (metadata.page is 1-indexed).
  const isFirstPage = metadata.page === 1;
  const heroItem = isFirstPage && items.length > 0 ? items[0] : null;
  const gridItems = heroItem ? items.slice(1) : items;

  return (
    <BlogLayout sidebar={sidebar}>
      <div className="blog-list-container">
        {heroItem && <HeroPost item={heroItem} />}
        {gridItems.length > 0 && (
          <div className="blog-grid">
            {gridItems.map(({content: BlogPostContent}) => (
              <BlogCard
                key={BlogPostContent.metadata.permalink}
                metadata={BlogPostContent.metadata}
              />
            ))}
          </div>
        )}
      </div>
      <BlogListPaginator metadata={metadata} />
    </BlogLayout>
  );
}

export default function BlogListPage(props) {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
