import React from 'react';
import Layout from '@theme/Layout';
import CM5BoardExplorer from '@site/src/components/CM5BoardExplorer';

export default function CM5ExplorerPage() {
  return <Layout title="CM5 交互认识主板" description="在实物照片和核心板背面位号图上定位元器件，悬停高亮，点击固定功能说明。">
    <main><CM5BoardExplorer/></main>
  </Layout>;
}
