---
sidebar_position: 6
---

# 在 Linux 下烧录 Armbian 系统

:::tip 提示
本章节将详细讲解如何在 **Linux 环境**（如 Ubuntu 虚拟机或实体机）下，将 Armbian OS 系统镜像烧录至 DshanPi-A1 开发板。
如果您使用的是 Windows 系统，请参考上一章节 [烧录系统至 eMMC](./5_Flash2eMMC.md)。
:::

## 1. 准备工作

### 1.1 硬件准备

进行烧录操作前，请准备以下硬件设备：

1.  **DshanPi-A1 开发板**
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

请在 PC 端（或直接在 Linux 环境中）下载以下必要的软件工具和系统镜像：

| 资源名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **Armbian OS 镜像** | 系统镜像文件 (.img.7z) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/100ASK_Armbian_25.11.0-trunk_Dshanpi-a1_noble_vendor_6.1.115_gnome_desktop.img.7z) |
| **FlashDownload_Tool** | Linux 烧录工具包 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/FlashDownload_Tool.tar.gz) |
| **SPL Loader** | 引导固件 (MiniLoader) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |

:::info 注意
下载完成后，请解压 `FlashDownload_Tool.tar.gz` 工具包，并解压系统镜像 `.7z` 文件得到 `.img` 文件。
:::

## 2. 进入烧录模式 (MASKROM)

DshanPi-A1 需要进入 **MASKROM** 模式才能进行底层的系统烧录。请严格按照以下顺序操作：

1.  **连接数据线**：将 USB Type-C 线的一端连接电脑的 **USB 3.0 接口**（通常为蓝色），另一端连接开发板的 **Type-C OTG 接口**。
2.  **按住按键**：按住开发板上的 **`MASKROM`** 按键，**保持不松手**。
3.  **连接电源**：接入 PD 电源适配器给开发板上电。
4.  **松开按键**：等待约 2-3 秒后，松开 `MASKROM` 按键。此时开发板应已进入 MASKROM 模式。

<img src={require('./images/image-20250815154004776.png').default} alt="进入烧录模式示意图" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 3. 在 Linux 下执行烧录

### 3.1 确认设备连接

如果您使用的是虚拟机（如 Ubuntu 24），请确保 USB 设备已挂载到虚拟机中。
在终端输入 `lsusb` 命令，应该能看到 Rockchip 设备。

<img src={require('./images/image-20251114113035188.png').default} alt="虚拟机连接设备" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 3.2 运行烧录脚本

进入解压后的 `FlashDownload_Tool` 目录，赋予脚本执行权限并运行：

```bash
cd FlashDownload_Tool/
sudo chmod +x JerryTech_RockArmbian_Flasher.sh
sudo ./JerryTech_RockArmbian_Flasher.sh
```

:::warning 权限提示
运行烧录工具通常需要 `sudo` 权限，以访问 USB 设备。
:::

### 3.3 烧录流程

1.  **确认进入 Maskrom 模式**：
    脚本启动后会提示是否进入了 Maskrom 模式，确认已连接好设备后，点击界面上的确认或按提示操作。
    <img src={require('./images/image-20251114113517947.png').default} alt="烧录工具启动" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

2.  **选择 Loader 文件**：
    在弹出的文件选择框中，找到并选择下载好的引导固件 `rk3576_spl_loader_v1.09.107.bin`。
    <img src={require('./images/image-20251114113624856.png').default} alt="选择 Loader" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
    等待 Loader 烧录完成。
    <img src={require('./images/image-20251114113814324.png').default} alt="Loader 烧录完成" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

3.  **选择系统镜像**：
    Loader 烧录完成后，点击确定。系统会提示选择 Image 文件。
    <img src={require('./images/image-20251114113934036.png').default} alt="选择 Image 提示" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
    在文件选择框中，找到并选择解压后的 Armbian 系统镜像 `100ASK_xxx.img`。
    <img src={require('./images/image-20251114114125295.png').default} alt="选择系统镜像" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

4.  **等待烧录完成**：
    工具会自动开始下载系统镜像。请耐心等待进度条走完，期间 **切勿断开电源或数据线**。
    当弹出 "Download Image OK" 或类似成功提示时，表示烧录结束。
    <img src={require('./images/image-20251114114918392.png').default} alt="烧录完成提示" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

5.  **重启设备**：
    点击确定关闭提示框，最后点击工具界面上的 **重启设备** (Reboot Device) 按钮，或手动断电重启板子。
    <img src={require('./images/image-20251114114956102.png').default} alt="重启设备" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::success 成功
重启后，DshanPi-A1 将启动进入新烧录的 Armbian 系统。
:::
