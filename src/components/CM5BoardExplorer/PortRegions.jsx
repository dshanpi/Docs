import React from 'react';
import styles from './inspector.module.css';

export default function PortRegions({ports, crop, activeId, pinnedId, onPreview, onSelect}) {
  return <div className={styles.field}>
    {ports.map(port => {
      const [x, y, width, height] = port.rect;
      return <button key={port.id} type="button" className={styles.region}
        style={{left: `${(x - crop.x) / crop.width * 100}%`, top: `${(y - crop.y) / crop.height * 100}%`,
          width: `${width / crop.width * 100}%`, height: `${height / crop.height * 100}%`}}
        data-port={port.id} data-active={activeId === port.id}
        aria-label={`查看 ${port.name}。 ${port.description}${port.warning ?? ''}`} aria-pressed={pinnedId === port.id}
        onPointerEnter={event => {if (event.pointerType !== 'touch') onPreview(port.id);}}
        onPointerLeave={() => onPreview(null)}
        onFocus={event => {if (event.currentTarget.matches(':focus-visible')) onPreview(port.id);}}
        onBlur={() => onPreview(null)}
        onClick={() => onSelect(port.id)} />;
    })}
  </div>;
}
