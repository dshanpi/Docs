import React from 'react';

const files = {
  desktop: {label: 'Armbian GNOME 桌面版', suffix: '_gnome_desktop.img.xz'},
  cli: {label: 'Armbian CLI 命令行版', suffix: '_6.1.115.img.xz'},
  buildroot: {label: 'Buildroot 系统', suffix: 'DshanPI_A1_CM5-buildroot.zip'},
};

export default function CM5FirmwareLink({version}) {
  const {label, suffix} = files[version];

  function highlight(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Let the native anchor navigate to the share section before adjusting for the file.
    requestAnimationFrame(() => {
      const directory = document.getElementById('cm5-share-directory');
      const share = document.querySelector('#cm5-share-entry a');
      if (!directory || !share) return;
      const rows = Array.from(directory.querySelectorAll('.token-line'));
      const file = rows.find(row => row.textContent.trimEnd().endsWith(suffix));
      if (!file) return;

      file.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
      for (const element of [share, ...rows]) {
        element.getAnimations().filter(a => a.id === 'cm5-firmware').forEach(a => a.cancel());
      }
      const active = {backgroundColor: 'var(--ifm-color-success-contrast-background)', boxShadow: 'inset 0 -2px var(--ifm-color-success)'};
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const element of [share, file]) {
        element.animate(still ? [active, active] : [active, active, {backgroundColor: 'transparent', boxShadow: 'none'}], {
          id: 'cm5-firmware', duration: still ? 2700 : 900, iterations: still ? 1 : 3,
        });
      }
    });
  }

  return <a href="#baidu-download" aria-label={label + '：百度网盘'} onClick={highlight}>百度网盘</a>;
}
