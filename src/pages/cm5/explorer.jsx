import React from 'react';
import Layout from '@theme/Layout';
import CM5BoardExplorer from '@site/src/components/CM5BoardExplorer';

export default function CM5ExplorerPage() {
  return <Layout title="CM5 交互认识主板" description="切换 DshanPi A1 CM5 主板正反面实物图，点击接口查看说明和对应教程。">
    <main><CM5BoardExplorer/></main>
  </Layout>;
}
