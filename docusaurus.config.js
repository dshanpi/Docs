// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '东山Π',
  tagline: 'DshanPI Linux Boards Docs.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://dshanpi.100ask.net',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: '100askTeam', // Usually your GitHub org/user name.
  projectName: 'linuxboard-docs', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/100askTeam/linuxboard-docs/tree/main/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/100askTeam/linuxboard-docs/tree/main/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: '东山Π',
        logo: {
          alt: '东山PI',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 't113s3Sidebar',
            position: 'left',
            label: 'T113s3-Industrial',
          },          
          {
            type: 'docSidebar',
            sidebarId: 'v851seSidebar',
            position: 'left',
            label: 'TinyVision',
          },
          {
            type: 'docSidebar',
            sidebarId: 'd1hdSidebar',
            position: 'left',
            label: 'D1h-DualDisplay',
          },
          {
            type: 'docSidebar',
            sidebarId: 'd213dkSidebar',
            position: 'left',
            label: 'D213-DevKit',
          },
          {
            type: 'docSidebar',
            sidebarId: 'mp135dkSidebar',
            position: 'left',
            label: 'MP135-DevKit',
          },
          {
            type: 'docSidebar',
            sidebarId: 'd1scvbsSidebar',
            position: 'left',
            label: 'D1s-CVBS',
          },
          {
            type: 'docSidebar',
            sidebarId: 't113iSidebar',
            position: 'left',
            label: 'T113i-Industrial',
          },          
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/100askTeam/linuxboard-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'DongshanPI',
                href: 'https://dongshanpi.com',
              },
              {
                label: 'Canaan-Docs',
                href: 'https://canaan-docs.100ask.net/',
              },
              {
                label: 'Renesas-Docs',
                href: 'https://renesas-docs.100ask.net/',
              },
              {
                label: 'RTOS',
                href: 'https://rtos.100ask.net/',
              },
              {
                label: 'TinaSDK-Docs',
                href: 'https://tina.100ask.net/',
              },
              {
                label: 'Allwinner-Docs',
                href: 'https://allwinner-docs.100ask.net/',
              },
              {
                label: 'R128-Docs',
                href: 'https://aw-r128.100ask.net/',
              },                                                                                    
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'BiliBili',
                href: 'https://space.bilibili.com/275908810',
              },              
              {
                label: 'Stack Overflow',
                href: 'https://forums.100ask.net',
              },
              {
                label: 'VideoCenter',
                href: 'https://video.100ask.net/',
              },              
              {
                label: 'Twitter',
                href: 'https://twitter.com/dongshanpi',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Coding',
                href: 'https://weidongshan.coding.net/public/',
              },              
              {
                label: 'GitHub',
                href: 'https://github.com/100askTeam',
              },
              {
                label: 'Gitee',
                href: 'https://gitee.com/weidongshan',
              },              
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} 100askTeam, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
