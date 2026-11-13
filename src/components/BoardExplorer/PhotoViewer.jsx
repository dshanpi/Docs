import React, {useEffect, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

export default function PhotoViewer({selected, onSelect, visible, side, onSideChange, embedded,
  views, ports, boardName}) {
  const view=views[side], crop=view.crop;
  const photoUrl=useBaseUrl(view.photo);
  const frame=useRef(null), board=useRef(null), drag=useRef(null);
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [fullscreen,setFullscreen]=useState(false);
  const [message,setMessage]=useState('');
  const [failed,setFailed]=useState(false);
  const current=ports.find(port=>port.id===selected);

  const reset=()=> {setZoom(1);setPan({x:0,y:0});};
  useEffect(()=> {reset();setMessage('');setFailed(false);},[side,photoUrl]);
  // Interface selection always brings the whole photograph back into view.
  useEffect(()=> {reset();},[selected]);
  useEffect(()=> {
    const update=()=> {setFullscreen(document.fullscreenElement===frame.current);reset();};
    document.addEventListener('fullscreenchange',update);
    return ()=>document.removeEventListener('fullscreenchange',update);
  },[]);
  const changeZoom=delta=> {setZoom(value=>Math.min(2.5,Math.max(1,Math.round((value+delta)*100)/100)));setPan({x:0,y:0});};
  const toggleFullscreen=async()=> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen();
      else setMessage('当前浏览器不支持全屏，可使用放大按钮查看。');
    } catch {setMessage('浏览器未开启全屏，仍可使用放大按钮。');}
  };
  const startDrag=event=> {
    if (zoom<=1 || event.button!==0 || event.target.closest('button')) return;
    drag.current={x:event.clientX,y:event.clientY,pan};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag=event=> {
    if (!drag.current || !board.current) return;
    const maxX=board.current.clientWidth*(zoom-1)/2;
    const maxY=board.current.clientHeight*(zoom-1)/2;
    const clamp=(value,max)=>Math.min(max,Math.max(-max,value));
    setPan({x:clamp(drag.current.pan.x+event.clientX-drag.current.x,maxX),
      y:clamp(drag.current.pan.y+event.clientY-drag.current.y,maxY)});
  };
  const endDrag=()=> {drag.current=null;};

  return <section className={styles.viewer} ref={frame} aria-label={`${boardName} 主板展示区`}>
    <div className={styles.viewerHeader}>
      <span className={styles.viewLabel}><span className={styles.liveDot}/>主板{view.label}</span>
      <div className={styles.viewToggle} aria-label="主板正反面">
        {Object.entries(views).map(([id,item])=><button type="button" key={id} aria-pressed={side===id} onClick={()=>onSideChange(id)}>{item.label}</button>)}
      </div>
    </div>
    <div className={styles.scene} style={{'--board-ratio':crop.width/crop.height,'--photo-zoom':zoom}}>
      <div className={styles.photoWrap} onPointerDown={startDrag} onPointerMove={moveDrag}
        onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
        style={{touchAction:zoom>1?'none':'pan-y',cursor:zoom>1?'grab':'default'}}>
        <div className={styles.photoCrop} ref={board} style={{aspectRatio:`${crop.width}/${crop.height}`,transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}}>
          <div className={styles.photoImage}>
            <img src={photoUrl} alt={`${boardName} 主板${view.label}实物照片`} draggable="false" onError={()=>setFailed(true)}
              onLoad={()=>setFailed(false)} style={{width:`${view.imageWidth/crop.width*100}%`,left:`${-crop.x/crop.width*100}%`,top:`${-crop.y/crop.height*100}%`}}/>
          </div>
          {!failed && current.side===side && <div className={styles.photoHighlight} style={{left:`${(current.rect[0]-crop.x)/crop.width*100}%`,top:`${(current.rect[1]-crop.y)/crop.height*100}%`,width:`${current.rect[2]/crop.width*100}%`,height:`${current.rect[3]/crop.height*100}%`}}/>}
          {!failed && ports.filter(port=>port.side===side && visible.includes(port.id)).map(port=> {
            const [x,y,w,h]=port.rect;
            const relativeX=(x+w/2-crop.x)/crop.width;
            const relativeY=(y+h/2-crop.y)/crop.height;
            const labelStyle={
              ...(relativeX<0.2?{left:0,transform:'none'}:
                relativeX>0.8?{left:'auto',right:0,transform:'none'}:{}),
              ...(relativeY<0.15?{bottom:'auto',top:'46px'}:{}),
            };
            return <button type="button" key={port.id} className={`${styles.hotspot} ${selected===port.id?styles.hotspotSelected:''}`}
              style={{left:`${relativeX*100}%`,top:`${relativeY*100}%`}}
              aria-label={`查看 ${port.name}`} aria-pressed={selected===port.id} title={port.name} onClick={()=>onSelect(port.id)}>
              <span>{port.number}</span><strong style={labelStyle}>{port.name}</strong>
            </button>;
          })}
        </div>
      </div>
      {failed && <div className={styles.imageError} role="status">图片暂时无法加载，请使用下方接口索引查看说明。</div>}
      <span className={styles.sceneCaption}>DSHANPI {boardName}<span>{view.label}实物图</span></span>
    </div>
    <div className={styles.viewerControls}>
      <div className={styles.cameraControls}>
        <button type="button" disabled={zoom<=1} aria-label="缩小" onClick={()=>changeZoom(-0.25)}>−</button>
        <output aria-label="图片缩放比例">{Math.round(zoom*100)}%</output>
        <button type="button" disabled={zoom>=2.5} aria-label="放大" onClick={()=>changeZoom(0.25)}>+</button>
        <span className={styles.controlDivider}/>
        <button type="button" onClick={reset}>复位视图</button>
      </div>
      {!embedded && <button type="button" className={styles.fullscreen} onClick={toggleFullscreen}>{fullscreen?'退出全屏':'全屏查看'}</button>}
    </div>
    <div className={styles.viewerFootnote} role="status">
      {message || (zoom>1?'拖动平移图片 · 点击热点查看接口':'切换正反面 · 点击热点查看接口')}
      <span>实物照片 · {ports.filter(port=>port.side===side).length} 个标注位置</span>
    </div>
  </section>;
}
