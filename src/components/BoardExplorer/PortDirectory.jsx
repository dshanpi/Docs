import React from 'react';
import {FILTERS} from './board-state.cjs';
import styles from './styles.module.css';

export default function PortDirectory({title = '接口索引', ports, selected, onSelect, filter, onFilterChange, filters = FILTERS, hint}) {
  return (
    <div className={styles.interfaceDirectory}>
      <div className={styles.directoryTitle}>
        <h2>{title}</h2>
        {onFilterChange && <div className={styles.filters}>
          {filters.map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => onFilterChange(value)}>{value}</button>)}
        </div>}
        {hint && <span>{hint}</span>}
      </div>
      <div className={styles.portList}>
        {ports.map(port => <button key={port.id} type="button" aria-pressed={selected === port.id} onClick={() => onSelect(port.id)}>
          <span>{port.number}</span>{port.name}<span className={styles.portArrow}>↗</span>
        </button>)}
      </div>
    </div>
  );
}
