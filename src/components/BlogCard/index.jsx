import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useBlogDateFormatter} from '@site/src/utils/blog';

export default function BlogCard({metadata}) {
  const {i18n} = useDocusaurusContext();
  const isEn = i18n.currentLocale === 'en';
  const formatDate = useBlogDateFormatter();
  const {title, description, permalink, date, readingTime, tags} = metadata;

  return (
    <Link to={permalink} className="blog-card">
      <div className="blog-card__body">
        {tags && tags.length > 0 && (
          <div className="blog-card__tags">
            {tags.slice(0, 3).map((t) => (
              <span key={t.permalink} className="blog-tag">
                #{t.label}
              </span>
            ))}
          </div>
        )}
        <h3 className="blog-card__title">{title}</h3>
        {description && <p className="blog-card__desc">{description}</p>}
        <div className="blog-card__meta">
          <span>📅 {formatDate(date, {month: 'short'})}</span>
          {typeof readingTime !== 'undefined' && (
            <span>
              {' · ⏱ '}
              {Math.ceil(readingTime)}
              {isEn ? ' min' : ' 分钟'}
            </span>
          )}
        </div>
        <div className="blog-card__more">
          {isEn ? 'Read more ->' : '阅读全文 ->'}
        </div>
      </div>
    </Link>
  );
}
