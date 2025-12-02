---
sidebar_position: 2
---

# 烧录 Buildroot 系统

本章节将讲解如何把 Buildroot 系统镜像烧录至 DShanPi-R1 开发板。

## 准备工作

### 1. 硬件准备

烧录系统镜像，除了 DShanPi-R1 板子，还需要准备 **TypeC-3.2 10Gbps 速率 USB 线** 和 **30W PD 电源适配器**。

:::info 硬件建议
建议使用韦东山店铺购买的线材和电源，以确保兼容性和稳定性。
:::

<div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
  <div style={{ textAlign: 'center', width: '45%' }}>
    <p><strong>TypeC-3.2 10Gbps 速率 USB 线</strong></p>
    <img src={require("./images/DSC04505.JPG").default} alt="DSC04505" style={{ maxWidth: '100%', height: 'auto' }} />
  </div>
  <div style={{ textAlign: 'center', width: '45%' }}>
    <p><strong>30W PD 电源适配器</strong></p>
    <img src={require("./images/DSC04493.JPG").default} alt="DSC04493" style={{ maxWidth: '100%', height: 'auto' }} />
  </div>
</div>

### 2. 软件下载

我们需要在 PC 端下载 **系统镜像**、**烧录工具** 和 **驱动安装工具包**。

:::tip 下载提示
按住 `Ctrl` 键，鼠标 `左键` 点击下方链接，即可一键下载。
:::

| 软件名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **Buildroot 系统镜像** | DShanPi-R1 Buildroot 系统镜像<br/>MD5: `884412ab96fdfd6080e8961501b65aa4` | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Images/Buildroot/DShanPi-R1_Buildroot_Default.zip) |
| **RKDevTool** | 瑞芯微烧录工具 (v3.32) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Tools/RKDevTool_Release_v3.32.zip) |
| **DriverAssitant** | 驱动安装工具包 (v5.1.1) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3568-DshanPI-R1%2B/Tools/DriverAssitant_v5.1.1.zip) |

### 3. 烧录驱动安装

在烧录之前，我们需要先安装烧录驱动。

1.  解压前面下载的 **`DriverAssitant_vxxx.zip`**。
2.  运行 **`DriverInstall.exe`**。
3.  点击 **驱动安装** 按钮。

:::info 提示
如果之前已经安装过瑞芯微的驱动，这里可以选择跳过。
:::

![image-20250815172019920](images/image-20250815172019920.png)

## 烧录系统镜像

### 1. 进入 Maskrom 烧录模式

请严格按照以下步骤操作，使开发板进入 Maskrom 模式：

:::danger 关键步骤
**请务必按照顺序操作：**
1.  先连接 USB 数据线。
2.  **按住 MASKROM 按键不放**。
3.  再接上电源。
:::

1.  **连接数据线**：使用 USB3.0 OTG 线连接开发板和电脑的 USB3.0 接口（通常为蓝色）。
2.  **按住按键**：按住板子上的 **`MASKROM`** 按键，**不要松开**。
3.  **连接电源**：接上电源适配器。
4.  **确认状态**：此时开发板将进入 Maskrom 模式，RKDevTool 工具下方会显示发现 **MASKROM** 设备。

![image-20250815154004776](images/image-20250815154004776.png)

### 2. 使用工具烧录

打开 **RKDevTool** 烧录工具，参考下图进行配置：

![image-20251125175328765](images/image-20251125175328765.png)

1.  点击顶部标签页进入 **`升级固件`** 界面。
2.  点击 **`固件`** 按钮，选择之前下载并解压好的 **Buildroot 系统镜像** (`.img` 文件)。
3.  确保底部状态栏显示 **发现一个MASKROM设备**。
4.  点击 **`升级`** 按钮开始烧录。

:::note 烧录过程
开始烧录后，请耐心等待。烧录工具右侧会显示进度，直到出现 **下载固件成功** 字样，即表明烧录完成。
:::

![image-20251125175413847](images/image-20251125175413847.png)

烧录完成后，开发板会自动重启并进入系统。

## 常见问题与解决方案

<details>
<summary>执行烧录操作后，烧录工具没有显示 MASKROM 设备？</summary>

**解决方案：**

1.  **检查驱动**：确保已正确安装 DriverAssitant 驱动。
2.  **检查设备管理器**：查看设备管理器中是否出现瑞芯微的 USB 设备（如下图所示）。
3.  **重试连接**：
    *   尝试重新插拔 Type-C 数据线。
    *   尝试更换电脑的 USB 接口（建议使用后置 USB3.0 接口）。
    *   重启电脑后再次尝试。

![image-20250815174333674](images/image-20250815174333674.png)

</details>


