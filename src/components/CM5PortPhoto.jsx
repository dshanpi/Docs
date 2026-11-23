import React from 'react';
import styles from '@site/docs/DshanPi-A1_CM5/1-QuickStart/wiring/dsi.module.css';

export default function CM5PortPhoto({src, alt, label, box, tip}) {
  const [x, y, width] = box;
  const [tx, ty] = tip;
  const cx = x + width / 2;
  const cy = y + 20;
  const angle = Math.atan2(ty - cy, tx - cx) * 180 / Math.PI;
  return <div className={`${styles.annotated} ${styles.single}`}>
    <img src={src} alt={alt} width="540" loading="lazy" />
    <svg viewBox="0 0 625 500" aria-hidden="true">
      <path className={styles.pointer} d={`M${cx} ${cy} L${tx} ${ty}`} />
      <path className={styles.pointer} transform={`translate(${tx} ${ty}) rotate(${angle})`} d="M-14 -7 L0 0 L-14 7" />
      <rect x={x} y={y} width={width} height="40" rx="7" />
      <text x={cx} y={cy + 8} textAnchor="middle">{label}</text>
    </svg>
  </div>;
}
