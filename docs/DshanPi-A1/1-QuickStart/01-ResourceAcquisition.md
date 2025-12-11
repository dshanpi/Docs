---
sidebar_position: 1
---

# 资源下载汇总

本章节汇总了 **DshanPi-A1** 的系统镜像、开发工具及硬件资料，方便开发者快速获取所需资源。

## 系统镜像下载

:::info 说明
**ArmbianOS** 是 DshanPi-A1 的官方推荐系统，我们将对其进行长期维护和更新。
:::

### 官方推荐系统 (ArmbianOS)

| 版本 | 描述 | 下载 |
| :--- | :--- | :--- |
| **ArmbianOS V1.0** | **基于 Ubuntu Noble (24.04)**<br/>集成 HDMI IN/OUT、双千兆网口、USB3.0、PCIe WiFi (rtl8852ae)、NPU 等驱动。<br/>**默认账户**: `root` / `100ask` (首次启动需连接显示器设置用户) | [点击下载 (img.7z)](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/100ASK_Armbian_25.11.0-trunk_Dshanpi-a1_noble_vendor_6.1.115_gnome_desktop.img.7z)<br/>MD5: `02af1bb5fabc18b5aea7e8cc4352f10f` |
| **引导固件 (Loader)** | 烧录 Armbian 系统时需配套使用的引导文件。 | [点击下载 (.bin)](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |

### 其他系统镜像

以下系统镜像由社区或原厂提供，欢迎尝鲜体验。

| 系统名称 | 版本 | 默认账户 (用户/密码) | 镜像下载 | 引导固件 |
| :--- | :--- | :--- | :--- | :--- |
| **OpenWrt** | V1.0 | `root` / `password` | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/openwrt-lede/openwrt-rockchip-armv8-100ask_dshanpia1-squashfs-sysupgrade.img.gz) | [下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |
| **ArchLinux** | V1.0 | `alarm` / `alarm` | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/ArchLinux/ArchLinuxARM-100Ask-DShanPi-A1-20250925202048.7z) | [下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |
| **OpenEuler** | V1.0 | `root` / `openeuler` | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/openEuler/openEuler-22.03-LTS-SP3-DShanPi-A1-aarch64-alpha1.img.xz) | [下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |
| **Fedora** | V1.0 | `root` / `aarch64` | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/Fedora/Fedora-Minimal-42-20251015101536.aarch64.Rockchip-RK3576.DshanPi-A1.raw.gz) | [下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |
| **Buildroot** | V1.0 | 无密码 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DshanPi-A1_Default_Buildroot.7z) | - |

## 开发工具

| 工具名称 | 描述 | 下载链接 |
| :--- | :--- | :--- |
| **DriverAssitant** | 瑞芯微 USB 驱动助手 (v5.1.1) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) |
| **RKDevTool** | 瑞芯微开发板烧录工具 (v3.32) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) |
| **MobaXterm** | 串口/SSH 终端工具 (Portable v25.2) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/MobaXterm_Portable_v25.2.zip) |

## 硬件资料

| 资料名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **硬件原理图** | DshanPi-A1 电路原理图 (PDF) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DshanPi-A1-RK3576-SCH_V1.1.pdf) |
| **3D 外壳模型** | 适配外壳 STL 打印文件 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DshanPi-A1-3DPrint-Shell.STL) |
| **3D 顶盖模型** | 适配顶盖 3MF 打印文件 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DshanPi-A1-3DPrint-Top.3MF) |
| **尺寸图** | 机械结构尺寸图 (PNG) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DshanPi-A1-StructureDiagram.png) |
