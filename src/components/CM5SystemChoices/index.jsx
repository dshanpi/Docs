import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const choices = [
  {image: 'desktop', task: '接显示器，用图形桌面', system: 'Armbian GNOME 桌面版',
    description: '接上键盘和鼠标，在 Ubuntu 24.04 桌面中打开文件、运行应用，通过 APT 安装软件。', target: '#armbian'},
  {image: 'cli', task: '通过 SSH 管理设备', system: 'Armbian CLI 命令行版',
    description: '从电脑远程登录 DshanPI A1 CM5，在终端执行命令、部署服务。系统同样基于 Ubuntu 24.04，支持 APT。', target: '#armbian'},
  {image: 'buildroot', task: '为专用设备定制固件', system: 'Buildroot 系统',
    description: '例如制作工业控制器。用 SDK 选择所需的应用和驱动，构建固件后写入 DshanPI A1 CM5。', target: '#buildroot'},
];

export default function CM5SystemChoices() {
  const imgBase = useBaseUrl('/img/cm5-systems/');
  return <div className={styles.choices}>
    {choices.map(({image, task, system, description, target}) =>
      <div key={image} className={styles.choice}>
        <img src={imgBase + image + '.webp'} alt="" className={styles.scene} />
        <div className={styles.body}>
          <strong>{task}</strong>
          <p>{description}</p>
          <Link to={target}>{system}<span aria-hidden="true"> ↓</span></Link>
        </div>
      </div>
    )}
  </div>;
}
