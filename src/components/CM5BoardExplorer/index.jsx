import React, {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import Link from '@docusaurus/Link';
import Viewer from '../BoardExplorer/PhotoViewer';
import useBoardSelection from '../BoardExplorer/useBoardSelection';
import {VIEWS, PORTS, GUIDE, DAILY, DOCS} from './board-data';
import PortRegions from './PortRegions';
import ui from './inspector.module.css';

const GROUPS = ['核心板', '常用接口', '扩展接口'];
const MODES = {explore: '全部部件', guide: '连接与刷机', daily: '日常使用'};

export default function CM5BoardExplorer({embedded = false}) {
  const {selected, side, select, browseSide, pinnedId} = useBoardSelection({
    views: VIEWS, ports: PORTS, initialFilter: '全部',
  });
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('全部类别');
  const [mode, setMode] = useState('explore');
  const [viewResetKey, setViewResetKey] = useState(0);
  const explorerRef = useRef(null);
  const readoutRef = useRef(null);
  const [compact, setCompact] = useState(false);
  const [fullscreenHost, setFullscreenHost] = useState(null);
  useEffect(() => {
    const root = explorerRef.current;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width <= 680));
    const onFullscreen = () => setFullscreenHost(document.fullscreenElement === root ? root : null);
    observer.observe(root);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, []);
  const searchId = useId();
  const steps = mode === 'guide' ? GUIDE : DAILY;
  const currentStep = GUIDE.findIndex(item => item.port === pinnedId);
  const allowed = mode === 'explore' ? PORTS : PORTS.filter(port =>
    steps.some(item => (item.relatedPorts || [item.port]).includes(port.id)));
  const scoped = allowed.filter(port => groupFilter === '全部类别' || port.group === groupFilter);
  const onBoard = scoped.filter(port => port.side === side);
  const shown = PORTS.find(port => port.side === side && port.id === preview)
    ?? PORTS.find(port => port.side === side && port.id === pinnedId)
    ?? onBoard.find(port => mode === 'explore' && side === 'front' && port.id === VIEWS.front.defaultPort);
  const showingPin = Boolean(shown && shown.id === pinnedId);
  useEffect(() => {
    if (readoutRef.current) readoutRef.current.scrollTop = 0;
  }, [shown?.id]);
  const needle = query.trim().toLowerCase();
  const results = scoped.filter(port =>
    [port.name, port.designator || '', port.group, port.kind, port.id, port.note, VIEWS[port.side].label]
      .some(value => value.toLowerCase().includes(needle)));

  function locate(id) {
    setPreview(null);
    setViewResetKey(key => key + 1);
    select(id);
  }
  function browse(nextSide) {
    setPreview(null);
    browseSide(nextSide);
  }
  function switchMode(next) {
    setMode(next);
    setGroupFilter('全部类别');
    setQuery('');
    if (next === 'guide') locate(GUIDE[0].port);
    else browse('front');
  }

  const reference = showingPin && <div className={ui.reference}>
    <p>{shown.note}</p>
    {shown.supplies.length > 0 && <p>所需设备：{shown.supplies.join('、')}</p>}
    <Link to={shown.href}>{shown.link} ↗</Link>
  </div>;
  const readout = <aside ref={readoutRef} className={compact ? ui.mobileCard : ui.readout}
    data-pinned={showingPin} aria-label="部件说明">
    {shown ? <>
      <div className={ui.detailHeading}>
        <div><small>{showingPin ? '已固定 · ' : ''}{shown.kind}</small><h3>{shown.name}</h3></div>
        {showingPin && <button type="button" className={ui.close} onClick={() => browse(side)}
          title="关闭固定展示（Esc）" aria-label="关闭固定展示">×</button>}
      </div>
      <p>
        {shown.emphasizeDescription ? <strong>{shown.description}</strong> : shown.description}
        {shown.warning && <strong>{shown.warning}</strong>}
      </p>
      {compact && reference
        ? <details key={shown.id}><summary>更多说明与资料</summary>{reference}</details>
        : reference}
    </> : <div className={ui.idle}><strong>部件说明</strong>
      <span>将鼠标移到照片中的部件上，即可在这里查看用途。</span>
    </div>}
  </aside>;

  return <div ref={explorerRef} className={`${ui.explorer} ${embedded ? ui.embedded : ''}`}
    onKeyDown={event => {
      if (event.key === 'Escape' && pinnedId) {event.preventDefault();browse(side);}
    }}>
    <header className={ui.heading}>
      <div>{embedded ? <h2>DshanPI A1 <b>CM5</b></h2> : <h1>DshanPI A1 <b>CM5</b></h1>}
        <p>悬停查看器件功能，点击固定说明。</p>
      </div>
      {!embedded && <Link className={ui.headerLink} to={`${DOCS}/Reference/Hardware`}>硬件图纸 ↗</Link>}
    </header>

    <div className={ui.layout}>
      <Viewer selected={selected} onSelect={select} visible={onBoard.map(port => port.id)}
        views={VIEWS} ports={PORTS} boardName="DshanPI A1 CM5" side={side} embedded={embedded}
        onSideChange={next => {if (next !== side) {setMode('explore');setGroupFilter('全部类别');browse(next);}}}
        appearance={ui} viewResetKey={viewResetKey} photoFallback={VIEWS[side].photo}
        hint="放大后可拖动空白区域平移"
        overlay={<PortRegions key={side} ports={onBoard} crop={VIEWS[side].crop}
          activeId={shown?.id} pinnedId={pinnedId} onPreview={setPreview} onSelect={select}/>}
        fullscreenTarget={explorerRef}/>

      <div className={ui.rail}>
        {compact ? shown && (preview || pinnedId) && createPortal(readout, fullscreenHost || document.body) : readout}
        <aside className={ui.catalog} aria-label="部件目录">
          <div className={ui.catalogHeading}><h2>部件目录</h2>
            {mode === 'explore' && <select aria-label="按部件类别筛选" value={groupFilter}
              onChange={event => {browse(side);setGroupFilter(event.target.value);}}>
              {['全部类别', ...GROUPS].map(group => <option key={group}>{group}</option>)}
            </select>}
          </div>
          <div className={ui.modes} aria-label="浏览范围">
            {Object.entries(MODES).map(([id, label]) => <button type="button" key={id}
              aria-pressed={id === mode} onClick={() => switchMode(id)}>{label}</button>)}
          </div>
          <label className={ui.search} htmlFor={searchId}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>
            </svg>
            <input id={searchId} type="search" aria-label="搜索部件" placeholder="搜索部件、位号或型号" value={query} onChange={event => setQuery(event.target.value)}/>
          </label>
          {mode !== 'explore' && <div className={ui.steps}>{steps.map(item => <button type="button" key={item.port}
            onClick={() => locate(item.port)} aria-pressed={pinnedId === item.port}>{item.title}</button>)}
            {mode === 'guide' && currentStep >= 0 && currentStep < GUIDE.length - 1 && <button type="button" onClick={() => locate(GUIDE[currentStep + 1].port)}>下一步 →</button>}
          </div>}
          <div className={ui.catalogList}>
            {GROUPS.map(group => {
              const items = results.filter(port => port.group === group);
              if (!items.length) return null;
              return <section key={group}>
                <h3>{group}<span>{items.length}</span></h3>
                {items.map(port => <button type="button" key={port.id} aria-pressed={pinnedId === port.id}
                  onClick={() => locate(port.id)}>
                  <span>{port.name}</span><small>{port.kind}</small>
                </button>)}
              </section>;
            })}
            {!results.length && <p>没有匹配的部件。可尝试位号 U6 或 U10。</p>}
          </div>
        </aside>
      </div>
    </div>
  </div>;
}
