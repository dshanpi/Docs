import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Returns a locale-aware date formatter for blog posts.
 *
 * Usage:
 *   const formatDate = useBlogDateFormatter();
 *   formatDate(date);                 // default: long month
 *   formatDate(date, {month: 'short'});
 *
 * @returns {(date: string, options?: object) => string}
 */
export function useBlogDateFormatter() {
  const {i18n} = useDocusaurusContext();
  const locale = i18n.currentLocale === 'en' ? 'en-US' : 'zh-CN';
  return (date, options = {}) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
        ...options,
      }).format(new Date(date));
    } catch {
      return date;
    }
  };
}
