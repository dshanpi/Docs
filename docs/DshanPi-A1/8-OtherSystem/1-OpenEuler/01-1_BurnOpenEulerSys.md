---
sidebar_position: 1
---

# 烧录 OpenEuler 系统

:::tip 提示
本章节将讲解如何将 **openEuler** 系统镜像烧录至 DshanPi-A1 板卡的 eMMC 存储中。
:::

## 1. openEuler 系统简介

**openEuler** 是一个面向数字基础设施的开源操作系统，内核基于 Linux。它由华为发起并捐赠给开放原子开源基金会，现由全球开发者共同维护。
openEuler 广泛支持服务器、云计算、边缘计算、嵌入式等多种应用场景，并特别注重对多样性计算架构（如鲲鹏、ARM、x86、RISC-V 等）的支持。

## 2. 准备工作

### 2.1 硬件准备

进行烧录操作前，请准备以下硬件设备：

1.  **DshanPi-A1 板卡**
2.  **Type-C 数据线**：须支持 USB 3.0 或以上协议（建议 10Gbps 速率），用于连接电脑传输数据。
3.  **电源适配器**：推荐使用 30W PD 电源适配器，确保供电稳定。

<div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
  <div style={{textAlign: 'center'}}>
    <img src={require('./images/image-20251013102017500.png').default} alt="Type-C 数据线" style={{borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '350px'}} />
    <p>Type-C 10Gbps 数据线</p>
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
| **OpenEuler 镜像** | 适用于 DshanPi-A1 的系统镜像 (.img.xz) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/images/openEuler/openEuler-22.03-LTS-SP3-DShanPi-A1-aarch64-alpha1.img.xz) |
| **SPL Loader** | 引导固件 (MiniLoader) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |
| **RKDevTool** | 瑞芯微开发工具 (烧录工具) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) |
| **DriverAssistant** | USB 驱动安装助手 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) |

:::info 注意
下载完成后，请解压 `openEuler-xxx.img.xz` 得到 `.img` 镜像文件。
:::

### 2.3 安装 USB 驱动

在进行烧录前，必须确保电脑已安装 Rockchip USB 驱动。

1.  解压 `DriverAssitant_v5.1.1.zip`。
2.  运行 **`DriverInstall.exe`**。
3.  点击 **“驱动安装”** (Install Driver) 按钮。

<img src={require('./images/image-20250815172019920.png').default} alt="驱动安装界面" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 3. 进入烧录模式 (MASKROM)

DshanPi-A1 需要进入 **MASKROM** 模式才能进行底层的系统烧录。请严格按照以下顺序操作：

1.  **连接数据线**：将 USB Type-C 线的一端连接电脑的 **USB 3.0 接口**（通常为蓝色），另一端连接板卡的 **Type-C OTG 接口**。
2.  **按住按键**：按住板卡上的 **`MASKROM`** 按键，**保持不松手**。
3.  **连接电源**：接入 PD 电源适配器给板卡上电。
4.  **松开按键**：等待约 2-3 秒后，松开 `MASKROM` 按键。此时板卡应已进入 MASKROM 模式。

<img src={require('./images/image-20250815154004776.png').default} alt="进入烧录模式示意图" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 4. 执行烧录步骤

打开解压后的 **RKDevTool** (瑞芯微开发工具)，按照以下配置进行烧录：

### 4.1 配置烧录选项

1.  **勾选选项**：勾选列表中的前两项（Loader 和 System）。
2.  **设置 Loader**：
    *   点击第一行右侧的 `...` 按钮，选择下载好的 `rk3576_spl_loader_v1.09.107.bin`。
3.  **设置 System**：
    *   点击第二行右侧的 `...` 按钮，选择解压后的 openEuler 镜像文件 (`.img`)。
    *   **存储类型**：确保第二行的存储类型选择为 **`EMMC`**。
    *   **地址**：通常默认为 `0x00000000`，如需修改请参考下图。
4.  **强制按地址写**：勾选右侧的 **"强制按地址写"** 选项。

<img src={require('./images/image-20250821092501879.png').default} alt="RKDevTool配置" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 4.2 开始烧录

1.  确认工具下方显示 **"发现一个MASKROM设备"**。
2.  点击 **"执行"** 按钮开始烧录。
3.  等待右侧日志显示 **"下载完成"**。

<img src={require('./images/image-20251113153831770.png').default} alt="烧录完成" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 5. 系统启动与登录

烧录完成后，设备会自动重启。您可以通过串口终端或 HDMI 查看系统启动日志。

*   **默认用户名**：`root`
*   **默认密码**：`openeuler`

<img src={require('./images/image-20251113160413747.png').default} alt="openEuler登录界面" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
