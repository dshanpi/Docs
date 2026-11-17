import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function PortDetails({port, views, count, label = '接口说明', noteIcon, linkIcon, children}) {
  return (
    <aside className={styles.detail} aria-label={label}>
      <div className={styles.detailTop}>
        <span className={styles.kind}>{port.kind}</span>
        <span className={styles.portNumber}>{views[port.side].label} · {port.number} / {count}</span>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <h2>{port.name}</h2><p className={styles.description}>{port.description}</p>
      </div>
      {port.supplies.length > 0 && <div className={styles.supplies}>
        <h3>你需要准备</h3><ul>{port.supplies.map(item => <li key={item}>{item}</li>)}</ul>
      </div>}
      <div className={styles.portNote}>{noteIcon}<p>{port.note}</p></div>
      <div className={styles.detailBottom}>
        <Link to={port.href} className={styles.primaryLink}>{port.link}{linkIcon}</Link>
        {children}
      </div>
    </aside>
  );
}
