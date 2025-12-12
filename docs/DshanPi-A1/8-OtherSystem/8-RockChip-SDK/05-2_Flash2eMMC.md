---
sidebar_position: 2
---

# 烧录系统至 eMMC

:::tip 提示
本章节将讲解如何将构建好的 (或下载的) **Buildroot** 系统镜像烧录至 DshanPi-A1 板卡的 eMMC 存储中。
:::

## 1. 准备工作

### 1.1 硬件准备

进行烧录操作前，请准备以下硬件设备：

1.  **DshanPi-A1 板卡**
2.  **Type-C 数据线**：须支持 USB 3.0 或以上协议（建议 10Gbps 速率），用于连接电脑传输数据。
3.  **电源适配器**：推荐使用 30W PD 电源适配器，确保供电稳定。

<div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
  <div style={{textAlign: 'center'}}>
    <img src={require('./images/DSC04505.JPG').default} alt="Type-C 数据线" style={{borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '350px'}} />
    <p>Type-C 10Gbps 数据线</p>
  </div>
  <div style={{textAlign: 'center'}}>
    <img src={require('./images/DSC04493.JPG').default} alt="30W PD 电源" style={{borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', height: '350px'}} />
    <p>30W PD 电源适配器</p>
  </div>
</div>

### 1.2 软件资源下载

请在 Windows 电脑上下载以下必要的软件工具和系统镜像：

| 资源名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **Buildroot 系统镜像** | 官方提供的默认镜像 (.7z) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DshanPi-A1_Default_Buildroot.7z) |
| **RKDevTool** | 瑞芯微开发工具 (烧录工具) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) |
| **DriverAssistant** | USB 驱动安装助手 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) |

:::info 镜像说明
上述镜像为官方编译好的默认 Buildroot 镜像。如果您已自行编译 SDK，请使用您编译生成的 `update.img`。
:::

### 1.3 安装 USB 驱动

在进行烧录前，必须确保电脑已安装 Rockchip USB 驱动。

1.  解压 `DriverAssitant_v5.1.1.zip`。
2.  运行 **`DriverInstall.exe`**。
3.  点击 **“驱动安装”** (Install Driver) 按钮。

<img src={require('./images/image-20250815172019920.png').default} alt="驱动安装界面" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 2. 进入烧录模式 (MASKROM)

DshanPi-A1 需要进入 **MASKROM** 模式才能进行底层的系统烧录。请严格按照以下顺序操作：

1.  **连接数据线**：将 USB Type-C 线的一端连接电脑的 **USB 3.0 接口**（通常为蓝色），另一端连接板卡的 **Type-C OTG 接口**。
2.  **按住按键**：按住板卡上的 **`MASKROM`** 按键，**保持不松手**。
3.  **连接电源**：接入 PD 电源适配器给板卡上电。
4.  **松开按键**：等待约 2-3 秒后，松开 `MASKROM` 按键。此时板卡应已进入 MASKROM 模式。

<img src={require('./images/image-20250815154004776.png').default} alt="进入烧录模式示意图" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 3. 执行烧录步骤

打开解压后的 **RKDevTool** (瑞芯微开发工具)，按照以下步骤进行烧录：

1.  **确认设备状态**：工具界面下方应显示 **"发现一个MASKROM设备"**。
2.  **切换页面**：点击顶部的 **"升级固件"** 选项卡。
3.  **加载固件**：点击 **"固件"** 按钮，选择下载并解压得到的 Buildroot 镜像文件 (`.img`) 或自行编译的 `update.img`。
4.  **开始烧录**：点击 **"升级"** 按钮，开始烧录过程。

<img src={require('./images/image-20250910161039437.png').default} alt="RKDevTool配置" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

等待右侧日志显示 **"下载固件成功"**，烧录即完成。

<img src={require('./images/image-20250910161534056.png').default} alt="烧录成功" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::success 完成
烧录成功后，设备会自动重启并进入 Buildroot 系统。
:::

## 4. 常见问题排查

| 问题现象 | 解决方案 |
| :--- | :--- |
| **工具未发现 MASKROM 设备** | 1. 检查 USB 驱动是否已安装（设备管理器中应无黄色感叹号）。<br/>2. 确认使用的是 USB 3.0 数据线且连接牢固。<br/>3. 尝试更换电脑 USB 接口或重启电脑。<br/>4. 严格按照“先按键，后上电”的顺序操作。 |
| **设备管理器显示未知设备** | 重新运行 `DriverInstall.exe`，先点击“驱动卸载”，再点击“驱动安装”。 |
| **系统启动后无 WiFi 节点** | Buildroot 系统可能需要手动加载 WiFi 驱动模块。在串口终端执行以下命令：<br/>`insmod /lib/modules/6.1.75/kernel/drivers/net/wireless/realtek/rtw89/rtw89_core.ko`<br/>`insmod /lib/modules/6.1.75/kernel/drivers/net/wireless/realtek/rtw89/rtw89_pci.ko`<br/>`insmod /lib/modules/6.1.75/kernel/drivers/net/wireless/realtek/rtw89/rtw89_8852c.ko`<br/>`insmod /lib/modules/6.1.75/kernel/drivers/net/wireless/realtek/rtw89/rtw89_8852ce.ko`<br/>*(注：路径可能随内核版本变化，可用 `find / -name "rtw89_core.ko"` 查找)* |

:::warning WiFi 驱动说明
Buildroot 系统通常用于极简环境或底层开发，部分驱动可能未配置为自动加载，需要手动加载内核模块。
:::
