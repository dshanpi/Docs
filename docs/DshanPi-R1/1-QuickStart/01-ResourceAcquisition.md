---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 资源下载汇总

本章节为大家提供系统镜像、烧录工具/驱动、原理图等相关资料下载链接。

## 系统镜像

:::tip 下载提示
按住 `Ctrl` 键，鼠标 `左键` 点击下载链接，即可直接下载。
:::

<Tabs>
  <TabItem value="openwrt" label="OpenWrt 系统" default>
    
    :::info 系统说明
    **OpenWrt** 是 DshanPi-R1+ 的默认出厂系统，我们将长期维护更新。
    :::

    | 项目 | 详细信息 |
    | :--- | :--- |
    | **支持功能/亮点** | 默认出厂系统，功能完善，长期维护 |
    | **默认用户名/密码** | 无 (默认登录即可) |
    | **系统镜像 V1.0** | [点击下载 (img.gz)](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/openwrt/immortalwrt-rockchip-armv8-100ask_dshanpi-r1-ext4-sysupgrade.img.gz) |
    | **引导固件 (Loader)** | [点击下载 (.bin)](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/openwrt/rk356x_spl_loader_v1.16.112.bin) |
    | **刷写步骤** | [参考教程](/docs/DshanPi-R1/QuickStart/ResourceAcquisition) |

  </TabItem>
  
  <TabItem value="buildroot" label="Buildroot 系统">

    | 项目 | 详细信息 |
    | :--- | :--- |
    | **支持功能/亮点** | 轻量级嵌入式 Linux 系统，适合开发调试 |
    | **默认用户名/密码** | 无 (默认登录即可) |
    | **系统镜像 V1.0** | [点击下载 (.zip)](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/Buildroot/DShanPi-R1_Buildroot_Default.zip) |
    | **刷写步骤** | [参考教程](../4-RockChip-SDK/05-2_BurnBuildroot.md) |

  </TabItem>
  
  <TabItem value="armbian" label="Armbian 系统">
    
    :::info 硬件支持
    支持 DshanPI-R1+ 的双千兆网口、HDMI OUT、耳机接口、MIC、SPK 喇叭、USB3.0、USB TYPE-C OTG、PCI-e WIFI (配套 rtl8852ce)。
    :::

    | 项目 | 详细信息 |
    | :--- | :--- |
    | **默认用户名/密码** | 用户名: `root`<br/>密码: `100ask`<br/>*(首次启动需连接显示器自行设置)* |
    | **ArmbianOS 带桌面版** | [点击下载 (V1.0)](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/armbian/100ASK_Armbian_25.11.0-trunk_Dshanpi-r1_trixie_vendor_6.1.115_xfce_desktop.img.7z) |
    | **ArmbianOS 无桌面版** | [点击下载 (V1.0)](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/armbian/Armbian_community_25.11.0-trunk.413_Dshanpi-r1_trixie_vendor_6.1.115_minimal.img.xz) |
    | **引导固件 (Loader)** | [点击下载 (.bin)](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/armbian/rk356x_spl_loader_v1.16.112.bin) |
    | **刷写步骤** | [参考教程](/docs/DshanPi-R1/QuickStart/ResourceAcquisition) |

  </TabItem>
</Tabs>

## 相关工具

| 工具名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **DriverAssitant** | 驱动安装工具包 (v5.1.1) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Tools/DriverAssitant_v5.1.1.zip) |
| **RKDevTool** | 瑞芯微烧录工具 (v3.32) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Tools/RKDevTool_Release_v3.32.zip) |
| **MobaXterm** | 终端工具便捷包 (Portable v25.2) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Tools/MobaXterm_Portable_v25.2.zip) |

## 硬件资料

<Tabs>
  <TabItem value="schematic" label="原理图" default>
    :::note 状态：待更新
    原理图资料正在整理中，敬请期待...
    :::
  </TabItem>
  <TabItem value="case" label="外壳文件">
    :::note 状态：待更新
    外壳 3D 打印文件正在整理中，敬请期待...
    :::
  </TabItem>
  <TabItem value="dimension" label="尺寸图">
    :::note 状态：待更新
    PCB 尺寸图正在整理中，敬请期待...
    :::
  </TabItem>
</Tabs>

