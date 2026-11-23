import React from 'react';

export default function CM5ClickTarget({src, alt, width, viewBox, target, targets = [target]}) {
  return (
    <svg role="img" aria-label={alt} viewBox={viewBox} width={width}
      style={{display: 'block', maxWidth: '100%', height: 'auto'}}>
      <image href={src} />
      {targets.map(([x, y, boxWidth, boxHeight], index) => (
        <g key={index}>
          <rect x={x} y={y} width={boxWidth} height={boxHeight} rx="4"
            fill="none" stroke="#5b21b6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {targets.length > 1 && (
            <g transform={`translate(${x - 22} ${y + boxHeight / 2})`}>
              <circle r="20" fill="#5b21b6" />
              <text textAnchor="middle" dy=".35em" fill="white" fontSize="28" fontWeight="bold">{index + 1}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
