import React from 'react';

export default function CM5PromptImage({src, alt, width}) {
  return <img src={src} alt={alt} width={width} loading="lazy"
    style={{display: 'block', maxWidth: '100%', height: 'auto', background: '#000',
      boxSizing: 'border-box', padding: '6px 8px', borderRadius: 4}} />;
}
