---
title: 社交应用安装指南
sidebar_position: 6
slug: /DshanPi-A1_CM5/SystemConfig/Social
description: 在 Armbian GNOME 桌面上安装 ARM64 版微信或 QQ。
---

在 **DshanPI A1 CM5 GNOME 桌面版**上操作。微信和 QQ 的安装方法相同，下载需要的应用即可。

## 下载安装包

| 应用 | 官网入口 | 选择的安装包 |
| --- | --- | --- |
| 微信 | [微信 Linux 版](https://linux.weixin.qq.com/) | ARM64 DEB 包 `WeChatLinux_arm64.deb` |
| QQ | [QQ Linux 版](https://im.qq.com/linuxqq/index.shtml) | **ARM 版下载 → deb** |

<details>
<summary>对照微信和 QQ 的安装包下载选项</summary>

<img src={require('./figures/wechat-arm64-deb.png').default} width="600" alt="微信 Linux 下载页中的 ARM64 和 DEB 选项" />

<img src={require('./figures/qq-arm-deb.png').default} width="600" alt="QQ Linux 下载页中 ARM 版的 deb 选项" />

</details>

## 安装并登录

1. 在 DshanPI A1 CM5 的文件管理器中打开下载目录，在空白处右键选择**在终端中打开**。运行 `ls *.deb`，找到刚下载的文件。
2. 以下以微信为例，将文件名替换为实际名称。安装 QQ 时也使用相同步骤。

   **查看安装包架构。** 确认输出为 `arm64` 后再安装。

   ```bash
   dpkg-deb -f ./WeChatLinux_arm64.deb Architecture
   ```

   **安装刚检查过的软件包。**

   ```bash
   sudo apt install ./WeChatLinux_arm64.deb
   ```

3. 按 **Super**，搜索并打开 **微信** 或 **QQ**，按客户端提示使用手机确认登录。若提示缺少依赖，先运行 `sudo apt update`，再重新执行安装命令。

**DshanPI A1 CM5 实测结果**　微信 ARM64 4.1.13.29 已打开登录窗口。2026 年 11 月 21 日测试 QQ 时，官网的 ARM64 DEB 下载返回 HTTP 403，板端安装与启动仍待验证。
