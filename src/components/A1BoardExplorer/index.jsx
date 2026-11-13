import React from 'react';
import BoardExplorer from '../BoardExplorer';
import {VIEWS, PORTS} from './board-data';

export default function A1BoardExplorer() {
  return <BoardExplorer
    name="A1"
    title="认识 A1 的每个接口"
    description="切换正反面，点击热点查看用途与操作教程。"
    views={VIEWS}
    ports={PORTS}
    scopeNote="接口位置依据本页 A1 产品图标注。具体电气参数、外设兼容性和系统支持范围请查看对应教程与原理图。"
  />;
}
