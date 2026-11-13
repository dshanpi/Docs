---
title: 选择系统与下载镜像
sidebar_label: 选择系统与下载镜像
sidebar_position: 1
slug: /DshanPi-A1_CM5/QuickStart/Resources
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/01-Resources.md
---

# 选择系统与下载镜像

本章适用于 DshanPi A1 CM5 核心板与官方底板。第一次安装并希望使用图形桌面时，选择板名中带有 **Dshanpi-a1-cm5** 的 GNOME 桌面镜像；只通过终端或 SSH 使用时，可以选择 CLI 镜像。

## 先核对板型

`dshanpi-a1`、`dshanpi-a1-cm5`、`dshanpi-r1` 是不同产品标识。下载页即使都写 RK3576，也要继续核对完整板名。核心板型号与底板 PCB 版本分别记录，接线图须匹配底板版本。

阅读旧版资料时，留意其中是否沿用了 Education 或原 A1 的说明，不能只凭标题和图片确定 CM5 底板的接口位置。机械尺寸、原理图和位号图从 [CM5 资料帖](https://forums.100ask.net/t/topic/10577) 获取，并核对版本。仓库已有的 CM5 核心板图可在 [资料与版本关系](../5-Reference/01-ResourcesAndVersions.md) 中查看。

## 选择系统

| 系统或资源 | 适合做什么 | 本教程中的位置 |
| --- | --- | --- |
| Armbian Ubuntu GNOME | 图形桌面、浏览文件、联网、安装应用 | 首次使用主线 |
| Armbian Ubuntu CLI | SSH、终端工具、无桌面运行 | 与主线共用刷机和网络章节 |
| Buildroot 固件 | 固定功能设备、出厂测试、定制应用 | 独立进阶章节 |
| BuildrootSDK、ArmBianOS 源码、dshanpi-build | 修改驱动、构建与发行系统 | 普通用户无需先下载 |

Buildroot 通常不使用 Ubuntu 的 APT 软件包管理。两种系统的账号、启动配置和升级方法分别以自己的镜像说明为准。

## 本次核对的 CM5 镜像

基线为 [DShanPI A1 CM5 2026.10.10-1](https://github.com/dshanpi/ArmBianOS/releases/tag/dshanpi-a1-cm5-2026.10.10-1)，发布于 2026 年 10 月 14 日。2026 年 11 月 12 日核对时仍为预发布。

| 项目 | 值 |
| --- | --- |
| 系统 | Ubuntu 24.04 Noble，ARM64 |
| 内核版本标识 | 6.1.115，CM5 vendor 内核系列 |
| Armbian revision | `25.11.0-trunk.20261010.1` |
| 初始账号 | `root`，初始密码 `1234`；首次交互登录要求修改密码 |
| 桌面压缩文件大小 | 1,075,653,668 字节 |
| CLI 压缩文件大小 | 757,508,264 字节 |

桌面版文件名：

```text
Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115_gnome_desktop.img.xz
```

CLI 文件名：

```text
Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115.img.xz
```

在 Release 的 Assets 中下载所选镜像、`SHA256SUMS` 和 `release-provenance.json`。后者记录镜像来源及解压后的大小：桌面镜像 5,129,633,792 字节，CLI 镜像 3,779,067,904 字节。电脑需同时留出压缩包和解压镜像的空间，eMMC 实际容量须能容纳镜像并留有运行余量。

## 校验下载内容

在 Windows 下载目录打开 PowerShell，桌面版示例：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115_gnome_desktop.img.xz'
```

将结果与同一 Release 的 `SHA256SUMS` 中对应文件的一行逐字比较。大小写不影响十六进制校验值。此基线的压缩文件 SHA-256 为：

```text
桌面版 aa56598f3d74f17bac0a10ade39eddb59e178b4d291a4b1b45b9a5a7e7898afb
CLI版  c63e5876219239a4e7b16ed3bcaebf24286678abbe38c3b2c6148e648832c066
```

校验一致后，用支持 xz 的解压工具解压，得到 `.img`。不要通过重命名扩展名代替解压。校验不一致时重新下载，先不刷写。

## 准备刷机工具

Windows 使用 Rockchip USB 驱动和 RKDevTool。厂商现有 A1 文档提供的工具入口如下，它们可用于准备电脑端环境；CM5 配套 Loader 仍需单独核定。

| 文件 | 下载入口 | 用途 |
| --- | --- | --- |
| RKDevTool v3.32 | [工具包](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) | 通过 USB 向设备写入镜像 |
| DriverAssitant v5.1.1 | [驱动包](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) | 安装 Rockusb 驱动 |
| CM5 配套 Loader | 待补充已验证文件及 SHA-256 | 初始化下载所需的内存与存储访问 |

工具入口来源：[厂商 A1 eMMC 文档](https://github.com/dshanpi/Docs/blob/master/docs/DshanPi-A1/6-SystemDev/5_Flash2eMMC.md)。此处不将该文档中的 A1 镜像或 Loader 默认认定为 CM5 配套文件。

准备完成后阅读 [向 eMMC 烧录系统](02-FlashEMMC.md)。
