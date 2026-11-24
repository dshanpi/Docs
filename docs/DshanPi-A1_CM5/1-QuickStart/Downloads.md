---
title: 资料下载
sidebar_label: 资料下载
sidebar_position: 1
slug: /DshanPi-A1_CM5/QuickStart/Downloads
description: 下载 DshanPI A1 CM5 核心板图纸与封装、底板图纸与 PCB 工程、系统镜像和 Windows 刷机工具。
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/Downloads.md
---

import CM5FirmwareLink from '@site/src/components/CM5FirmwareLink';

# 资料下载

:::tip 备用下载方式
如果下方链接无法打开或下载失败，可前往页末查看提取码和资料目录。[百度网盘备用入口](#baidu-download)
:::

## 硬件资料

### 核心板 {#core-board}

| 资料 | 查看与下载 | 用途 |
| --- | --- | --- |
| 核心板原理图 | [原理图 V1（PDF）](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/DshanPI-A1%28CM5%29_Core_SCH_V1.pdf) | 查阅核心板电路、信号名称及连接关系 |
| 核心板尺寸图 | [尺寸图 V1（DXF）](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/DshanPI-A1%28CM5%29_Core_dxf_V1.dxf) | 在 CAD 软件中核对核心板外形与机械尺寸 |
| 核心板封装库 | [Allegro 封装（DRA）](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/DshanPI-A1%28CM5%29_Core_allegro.dra) | 在 Cadence Allegro 中查看核心板封装，用于配套底板设计 |
| 核心板位号图 | [位号图 V1.1（PDF）](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/DshanPI-A1_CM5_Core_BitMap_V1.1.pdf) | 按原理图上的器件位号查找其在核心板上的位置 |

### 底板 {#carrier-board}

| 资料 | 查看与下载 | 用途 |
| --- | --- | --- |
| 底板原理图（PDF，14 页） | [打开原理图](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/SCH_DshanPI-A1-CM5-Base.pdf) | 查看接口针脚、信号连接、电源网络与器件电路 |
| 底板位号图（PDF，2 页） | [打开位号图](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/RDM_DshanPI-A1-CM5-Base.pdf) | 根据原理图中的器件位号，在 PCB 上定位连接器、芯片、电阻和电容 |
| 开源底板 PCB 工程 | [打开立创开源硬件项目](https://oshwhub.com/linux-s/project_ldbdxdhg?jlc_vid=FVINBVNeTlkIV1BfRAQKBFMCRgdcAVxTEVlbUVZSR1IxVlNfQ1lWVlBVRVVdUztWKAkaExQVTU5BCBcOAAkbBUoFGAw=) | 查看 PCB 布局与布线，获取项目提供的设计资料 |

底板图纸对应的板名为 `A1-CM5-Base-V1.2`。查阅版本说明、核心板正反面 PCB 图和核心板资料入口，请打开 [硬件资料](../5-Reference/00-Hardware.md)。

## 软件资料

### 系统固件 {#system-firmware}

按用途下载 DshanPI A1 CM5 的系统固件。两个 Armbian 版本均基于 Ubuntu 24.04，发布版本为 `2026.10.10-1`。

:::tip 固件下载提示
系统固件文件较大。如下载较慢或中断，可前往[页末的百度网盘](#baidu-download)获取 **Armbian 桌面版、Armbian CLI 版或 Buildroot 固件**。
:::

| 系统版本 | 适用场景 | 获取链接 |
| --- | --- | --- |
| **Armbian GNOME 桌面版** | 连接显示器、键盘和鼠标，使用图形桌面 | [下载桌面镜像（.img.xz）](https://github.com/dshanpi/ArmBianOS/releases/download/dshanpi-a1-cm5-2026.10.10-1/Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115_gnome_desktop.img.xz) · <CM5FirmwareLink version="desktop" /> |
| **Armbian CLI 命令行版** | 通过终端或 SSH 管理设备、部署服务 | [下载 CLI 镜像（.img.xz）](https://github.com/dshanpi/ArmBianOS/releases/download/dshanpi-a1-cm5-2026.10.10-1/Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115.img.xz) · <CM5FirmwareLink version="cli" /> |
| **Buildroot 系统** | 运行嵌入式应用，测试面向专用设备的固件 | <CM5FirmwareLink version="buildroot" /> |

下载 Armbian 后，使用同一发布版本的 [SHA256SUMS](https://github.com/dshanpi/ArmBianOS/releases/download/dshanpi-a1-cm5-2026.10.10-1/SHA256SUMS) 校验压缩包。下载 Buildroot 时，在网盘的 `03_系统固件/02_Buildroot系统/` 目录选择 `DshanPI_A1_CM5-buildroot.zip`。

### Windows 刷机资料 {#flash-tools}

| 资源 | 下载入口 | 用途 |
| --- | --- | --- |
| RK3576 SPL Loader v1.09.107 | [rk3576_spl_loader_v1.09.107.bin](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) | RKDevTool 的 Loader 文件，用于初始化下载所需的内存与存储访问 |
| RKDevTool v3.32 | [Windows 刷机工具](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) | 在 Windows 上向设备写入镜像 |
| DriverAssitant v5.1.1 | [Windows USB 驱动](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) | 让 Windows 识别 Rockusb 设备 |

Loader 文件大小为 **774,649 字节**，SHA-256 为 `9aee33d44ecc4b30e76241a6aa6993e433edb42c4d92909aa55b81c21c142a9e`。在 Windows 下载目录中可运行以下命令核对文件。

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\rk3576_spl_loader_v1.09.107.bin'
```

镜像校验见 [选择系统与下载镜像](01-Resources.md)，刷写流程见 [向 eMMC 烧录系统](02-FlashEMMC.md)。

## 百度网盘备用下载 {#baidu-download}

打开<span id="cm5-share-entry">[百度网盘分享链接](https://pan.baidu.com/s/1Xo342SQDyKZb5xRiNAD-Dw?pwd=jevb)</span>，按提示输入提取码 **`jevb`**。也可复制完整地址到浏览器打开：

```text
https://pan.baidu.com/s/1Xo342SQDyKZb5xRiNAD-Dw?pwd=jevb
```

编译 Buildroot 固件时，进入 `115_DshanPI-A1-CM5资料/05_SDK源码/01_Buildroot系统/`，按需选择：

- **使用配好的编译环境**：打开 `搭建Ubuntu环境的VMware虚拟机(包含SDK)` 文件夹，下载含 SDK 的虚拟机。
- **使用自己的 Ubuntu 环境**：下载源码包 `100ask-rk3576_SDK-cm5-baseline-20261123.tar.gz`（网盘显示 8.33 GB）。[查看编译指南](../4-Development/01-BuildrootSDK.md)

:::tip 区分 Armbian 桌面版与 CLI 版
目录中的【】标注了 Armbian 版本。实际下载时看文件名末尾：带 `_gnome_desktop.img.xz` 的是**桌面版**，以 `6.1.115.img.xz` 结尾的是 **CLI 命令行版**。
:::

<div id="cm5-share-directory">

```text
115_DshanPI-A1-CM5资料/
├── 01_学习网址/
│   └── 学习网址.txt
├── 02_开发工具/
│   ├── 【Windows】RKDevTool烧录工具/
│   │   └── RKDevTool_Release_v3.32.zip
│   └── 【Windows】Rockusb烧录驱动/
│       └── DriverAssitant_v5.1.1.zip
├── 03_系统固件/
│   ├── 00_loder引导文件/
│   │   └── rk3576_spl_loader_v1.09.107.bin
│   ├── 01_Armbian发行版系统(基于Ubuntu24.04)/
│   │   ├── 【CLI 命令行版】Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115.img.xz
│   │   └── 【GNOME 桌面版】Armbian-unofficial_25.11.0-trunk.20261010.1_Dshanpi-a1-cm5_noble_vendor_6.1.115_gnome_desktop.img.xz
│   └── 02_Buildroot系统/
│       └── DshanPI_A1_CM5-buildroot.zip
├── 04_硬件资料/
│   ├── 01_核心板硬件/
│   │   ├── DshanPI-A1(CM5)_Core_allegro.dra
│   │   ├── DshanPI-A1(CM5)_Core_dxf_V1.dxf
│   │   ├── DshanPI-A1(CM5)_Core_SCH_V1.pdf
│   │   └── DshanPI-A1_CM5_Core_BitMap_V1.1.pdf
│   └── 02_底板硬件资料/
│       ├── BitMap_DshanPI-A1-CM5-Base.pdf
│       └── SCH_DshanPI-A1-CM5-Base.pdf
└── 05_SDK源码/
    └── 01_Buildroot系统/
        ├── 搭建Ubuntu环境的VMware虚拟机(包含SDK)/
        └── 100ask-rk3576_SDK-cm5-baseline-20261123.tar.gz
```

</div>
