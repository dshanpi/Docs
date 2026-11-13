import React, {useId, useState} from 'react';
import Link from '@docusaurus/Link';
import Viewer from '../BoardExplorer/PhotoViewer';
import PortDetails from '../BoardExplorer/PortDetails';
import PortDirectory from '../BoardExplorer/PortDirectory';
import useBoardSelection from '../BoardExplorer/useBoardSelection';
import {getVisiblePorts} from '../BoardExplorer/board-state.cjs';
import {VIEWS, PORTS, GUIDE, DAILY, DOCS} from './board-data';
import styles from '../BoardExplorer/styles.module.css';

function Icon({name, size=18}) {
  const paths = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
    photo: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 18 5-5 4 4 3-4 5 5"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function CM5BoardExplorer({embedded=false}) {
  const [tab,setTab]=useState('explore');
  const {selected,current,side,filter,setFilter,select,changeSide,changeFilter,visiblePorts}=useBoardSelection({views:VIEWS,ports:PORTS});
  const panelId=useId();
  const step=GUIDE.findIndex(item=>item.port===selected);
  const tabs=[['explore','01','认识主板'],['guide','02','连接与刷机'],['daily','03','日常使用']];
  const switchSide=value=> {if(value!==side) {setTab('explore');changeSide(value);}};
  const switchTab=value=> {
    setTab(value);
    if(value==='guide') select(GUIDE[0].port);
    else {setFilter('常用接口');select(VIEWS.front.defaultPort);}
  };
  const changeStep=index=> {if(GUIDE[index]) select(GUIDE[index].port);};
  const allowed=tab==='guide'?GUIDE.map(item=>item.port):tab==='daily'?DAILY.flatMap(item=>item.relatedPorts || [item.port]):null;
  const displayedPorts=allowed?getVisiblePorts(PORTS,side,filter,selected,allowed):visiblePorts;
  const onTabKeyDown=(event,index)=> {
    const offsets={ArrowRight:1,ArrowLeft:-1,Home:-index,End:tabs.length-1-index};
    if(!(event.key in offsets)) return;
    event.preventDefault();
    const next=(index+offsets[event.key]+tabs.length)%tabs.length;
    switchTab(tabs[next][0]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
  };

  return <div className={`${styles.explorer} ${embedded?styles.embedded:''}`}>
    <div className={styles.breadcrumb}><Link to={`${DOCS}/intro`}>CM5 使用指南</Link><span>/</span><span>交互认识主板</span></div>
    <header className={styles.heading}>
      <div><p className={styles.eyebrow}>DSHANPI · BOARD EXPLORER</p><h1>认识你的 CM5<span>Base ver1.2</span></h1>
      <p className={styles.subtitle}>从接口开始，找到连接方法与下一步教程。</p></div>
      <div className={styles.engineBadge}><Icon name="photo" size={22}/><div>正反面交互导览<small>实物照片 · 接口说明</small></div></div>
    </header>
    <div className={styles.tabs} role="tablist" aria-label="学习场景">
      {tabs.map(([id,n,label],index)=>
        <button key={id} type="button" role="tab" id={panelId+id} tabIndex={tab===id?0:-1} aria-selected={tab===id} aria-controls={panelId} onKeyDown={event=>onTabKeyDown(event,index)} onClick={()=>switchTab(id)}><span>{n}</span>{label}</button>)}
      <Link to={`${DOCS}/intro`} className={styles.returnLink}>全部教程 <Icon name="arrow" size={16}/></Link>
    </div>
    <div id={panelId} role="tabpanel" aria-labelledby={panelId+tab}>
      {tab==='guide' && <div className={styles.guideBar}>
        <div><strong>刷机前导览</strong><span>先认识位置，再阅读经过核对的操作步骤。</span></div>
        <div className={styles.guideSteps}>{GUIDE.map((item,index)=><button type="button" key={item.port} aria-pressed={step===index} onClick={()=>changeStep(index)}><span>{index+1}</span>{item.title}</button>)}</div>
      </div>}
      {tab==='daily' && <div className={styles.dailyBar}><span>今天想做什么？</span>{DAILY.map(item=><button type="button" key={item.port} aria-pressed={selected===item.port} onClick={()=>select(item.port)}>{item.title}<Icon name="arrow" size={15}/></button>)}</div>}
      <div className={styles.workspace}>
        <Viewer selected={selected} onSelect={select} visible={displayedPorts.map(port=>port.id)} views={VIEWS} ports={PORTS} boardName="CM5" side={side} onSideChange={switchSide} embedded={embedded}/>
        <PortDetails port={current} views={VIEWS} count={PORTS.length} noteIcon={<Icon name="info" size={17}/>} linkIcon={<Icon name="arrow"/>}>
          {tab==='guide' ? <div className={styles.stepNavigation}>
            <button type="button" disabled={step<=0} onClick={()=>changeStep(step-1)}>上一步</button>
            {step<GUIDE.length-1 ? <button type="button" onClick={()=>changeStep(step+1)}>下一个位置 →</button> : <span>导览结束 · 请核对操作条件</span>}
          </div> : <button type="button" className={styles.allPorts} onClick={()=>{setTab('explore');setFilter('全部');}}>查看全部接口 <Icon name="arrow" size={16}/></button>}
        </PortDetails>
      </div>
      <PortDirectory ports={displayedPorts} selected={selected} onSelect={select} filter={filter}
        onFilterChange={tab==='explore'?changeFilter:undefined} hint="选择名称，在主板上定位"/>
      <div className={styles.scopeNote}><Icon name="info"/><p>正反面均为实物照片。接口位置按照片标注；供电规格、针脚定义、PCIe 设备兼容性与刷机操作请以对应底板资料和实板验证为准。</p></div>
    </div>
  </div>;
}
