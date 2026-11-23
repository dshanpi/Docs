---
title: 浏览器使用指南
sidebar_position: 5
slug: /DshanPi-A1_CM5/SystemConfig/Browser
description: 从 GNOME 桌面打开浏览器，访问文档并保存书签。
---

在 **DshanPI A1 CM5 GNOME 桌面版**上操作。请先[连接网络](./01-NetworkConnectionGuide.md)。

1. **安装浏览器。** 在 DshanPI A1 CM5 桌面按 **Super**（Windows 徽标键），搜索 `terminal` 并打开终端，依次运行：

   ```bash
   sudo apt update
   sudo apt install epiphany-browser
   ```

2. **从桌面启动。** 按 **Super**，在概览顶部搜索 `Web`，选择 GNOME Web。也可在桌面终端运行 `epiphany`。

   <img src={require('../1-QuickStart/first-boot/gnome.png').default} width="620" alt="DshanPI A1 CM5 GNOME 桌面概览，顶部为应用搜索框" />

3. **打开 DshanPI A1 CM5 指南。** 按 **Ctrl + L** 选中地址栏，输入 `https://wiki.dshanpi.org/docs/DshanPi-A1_CM5/intro` 并回车。确认标题为 **DshanPI A1 CM5 使用指南**，从左侧目录进入所需章节。

   <img src={require('./figures/cm5-guide.png').default} width="650" alt="DshanPI A1 CM5 指南页面预览，显示页面标题及左侧快速开始目录" />

4. **保存书签。** 按 **Ctrl + D** 收藏当前页。从浏览器的书签列表再次打开，确认仍进入 DshanPI A1 CM5 指南。

DshanPI A1 CM5 实测使用 GNOME Web 46.5，已打开指南并保存书签。
