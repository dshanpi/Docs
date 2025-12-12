---
sidebar_position: 1
---

# 烧录 Fedora 系统

:::tip 提示
本章节将讲解如何通过 **TF 卡** 启动 Fedora 系统。这需要将系统镜像烧录到 TF 卡，并将 U-Boot 引导固件烧录到板卡的 eMMC 中。
:::

## 1. Fedora 系统简介

**Fedora** 是一个由社区驱动的 Linux 发行版，由 Fedora 项目开发并获 Red Hat 公司赞助。它以集成最新开源技术、快速创新和对上游社区的贡献而闻名，是 Red Hat Enterprise Linux (RHEL) 的上游源。

## 2. 准备工作

### 2.1 硬件准备

进行烧录和启动操作前，请准备以下硬件设备：

1.  **DshanPi-A1 板卡**
2.  **MicroSD (TF) 卡**：容量建议 16GB 或以上，Class 10 及以上速率。
3.  **读卡器**：用于将 TF 卡连接至电脑。
4.  **Type-C 数据线**：用于连接电脑烧录 eMMC 引导固件。
5.  **电源适配器**：推荐使用 30W PD 电源适配器。

<div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
  <div style={{textAlign: 'center'}}>
    <img src={require('./images/image-20251013102017500.png').default} alt="Type-C 数据线" style={{borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '350px'}} />
    <p>Type-C 数据线</p>
  </div>
  <div style={{textAlign: 'center'}}>
    <img src={require('./images/image-20251013102118065.png').default} alt="30W PD 电源" style={{borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '350px'}} />
    <p>30W PD 电源适配器</p>
  </div>
</div>

### 2.2 软件资源下载

请在 Windows 电脑上下载以下必要的软件工具和系统镜像：

| 资源名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **Fedora 镜像** | 适用于 DshanPi-A1 的系统镜像 (.gz) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/Fedora/Fedora-Minimal-42-20251015101536.aarch64.Rockchip-RK3576.DshanPi-A1.raw.gz) |
| **U-Boot 固件** | 系统引导加载程序 (`u-boot.itb`) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/Fedora/u-boot.itb) |
| **SPL Loader** | 引导固件 (MiniLoader) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |
| **balenaEtcher** | TF 卡镜像烧录工具 | [点击下载](https://etcher.balena.io/) |
| **RKDevTool** | 瑞芯微开发工具 (eMMC 烧录工具) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) |
| **DriverAssistant** | USB 驱动安装助手 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) |

:::info 注意
Fedora 镜像下载后解压会得到 `.img` (或 `.raw`) 文件。`balenaEtcher` 可以直接识别压缩包，也可以识别解压后的镜像文件。
:::

### 2.3 安装 USB 驱动

如果尚未安装 Rockchip USB 驱动，请先解压 `DriverAssitant_v5.1.1.zip` 并运行 `DriverInstall.exe` 安装驱动。

## 3. 制作 TF 卡启动盘

DshanPi-A1 运行 Fedora 系统的主文件系统位于 TF 卡上。

1.  **连接 TF 卡**：将 TF 卡插入读卡器，并连接到电脑 USB 接口。
2.  **运行 Etcher**：打开 `balenaEtcher` 软件。
3.  **选择镜像**：点击 **"Flash from file"**，选择下载并解压好的 Fedora 镜像文件 (如 `sdcard.img` 或 `.raw` 文件)。
4.  **选择目标**：点击 **"Select target"**，选择您的 TF 卡/读卡器设备。
5.  **开始烧录**：点击 **"Flash!"** 按钮开始制作。

<img src={require('./images/image-20251112165955453.png').default} alt="Etcher界面" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

<img src={require('./images/image-20251112171521658.png').default} alt="Etcher烧录步骤" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 4. 烧录 U-Boot 到 eMMC

为了让板卡能够从 TF 卡引导启动，需要将配套的 U-Boot 固件烧录到板载 eMMC 中。

### 4.1 进入 MASKROM 模式

1.  连接 Type-C 数据线到电脑和板卡 OTG 接口。
2.  按住 `MASKROM` 按键不放。
3.  连接电源适配器。
4.  等待 2-3 秒后松开按键，确认 **RKDevTool** 显示 "发现一个MASKROM设备"。

### 4.2 配置并执行烧录

在 **RKDevTool** 中进行如下配置：

1.  **勾选选项**：勾选列表中的第 1 项 (Loader) 和第 3 项 (根据习惯通常用第3项，关键是地址和文件)。
2.  **设置 Loader**：
    *   点击第 1 行右侧 `...`，选择 `rk3576_spl_loader_v1.09.107.bin`。
3.  **设置 U-Boot**：
    *   点击第 3 行右侧 `...`，选择 `u-boot.itb`。
    *   **存储类型**：设置为 **`EMMC`**。
    *   **地址**：**必须**设置为 **`0x00004000`** (这是 U-Boot 在存储设备中的标准偏移地址)。
4.  **强制按地址写**：勾选右侧的 **"强制按地址写"**。
5.  **执行烧录**：点击 **"执行"** 按钮。

<img src={require('./images/image-20251112172841105.png').default} alt="RKDevTool配置U-Boot" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

等待日志显示烧录完成：

<img src={require('./images/image-20251112173635964.png').default} alt="U-Boot烧录完成" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::warning 重要提示：擦除 eMMC
如果您的 DshanPi-A1 eMMC 中之前已经烧录过 Android 或其他 Linux 系统，可能会导致引导冲突。
建议在烧录 U-Boot 前，在 MASKROM 模式下点击 RKDevTool 的 **"擦除所有" (Erase All)** 按钮，清空 eMMC，然后再执行上述烧录 U-Boot 的步骤。

<img src={require('./images/image-20251112175200289.png').default} alt="擦除Flash" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
:::

## 5. 系统启动与登录

1.  **断电**：拔掉板卡电源。
2.  **插入 TF 卡**：将制作好的 TF 卡插入板卡的 TF 卡槽。
3.  **上电启动**：重新连接电源。
4.  **查看串口日志**：通过串口终端查看启动信息。

<img src={require('./images/image-20251112174107220.png').default} alt="Fedora启动日志" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

系统启动后，使用以下默认账户登录：

*   **用户名**：`root`
*   **密码**：`aarch64`

<img src={require('./images/image-20251112174227687.png').default} alt="Fedora登录" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::info 网络连接说明
当前的 Fedora 镜像尚未适配 DshanPi-A1 的板载 WiFi 模块。如需连接网络，请使用 **网线** 连接路由器的 LAN 口。
:::

