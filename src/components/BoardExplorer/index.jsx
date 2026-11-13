import React from 'react';
import PhotoViewer from './PhotoViewer';
import PortDetails from './PortDetails';
import PortDirectory from './PortDirectory';
import useBoardSelection from './useBoardSelection';
import styles from './styles.module.css';

export default function BoardExplorer({name, title, description, views, ports, scopeNote}) {
  const {selected, current, side, filter, setFilter, select, changeSide, changeFilter, visiblePorts} = useBoardSelection({views, ports});
  return (
    <section className={`${styles.explorer} ${styles.embedded} ${styles.productExplorer}`} aria-label={`${name} 正反面交互导览`}>
      <div className={styles.productHeading}>
        <div><p className={styles.eyebrow}>DSHANPI {name} · BOARD EXPLORER</p><h2>{title}</h2><p>{description}</p></div>
        <span>{Object.entries(views).map(([sideId, view]) => `${view.label} ${ports.filter(port => port.side === sideId).length}`).join(' · ')}</span>
      </div>
      <div className={styles.workspace}>
        <PhotoViewer selected={selected} onSelect={select} visible={visiblePorts.map(port => port.id)} side={side} onSideChange={changeSide} views={views} ports={ports} boardName={name}/>
        <PortDetails port={current} views={views} count={ports.length} label={`${name} 接口说明`} linkIcon={<span aria-hidden="true">→</span>}>
          <button type="button" className={styles.allPorts} onClick={() => setFilter('全部')}>查看本面全部接口 →</button>
        </PortDetails>
      </div>
      <PortDirectory title={views[side].label + '接口'} ports={visiblePorts} selected={selected} onSelect={select} filter={filter} onFilterChange={changeFilter}/>
      <div className={styles.scopeNote}><p>{scopeNote}</p></div>
    </section>
  );
}
