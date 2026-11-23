import React from 'react';
import {useLocation} from '@docusaurus/router';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import styles from './CM5FirmwareTable.module.css';

export function FirmwareName({id, children}) {
  useBrokenLinks().collectAnchor(id);
  return <span id={id}>{children}</span>;
}

export default function FirmwareTable({children}) {
  const {hash} = useLocation();
  const id = 'armbian-files';
  useBrokenLinks().collectAnchor(id);
  return <div id={id} className={styles.table} data-focus={hash?.slice(1)}>{children}</div>;
}
