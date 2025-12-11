---
sidebar_position: 5
---

# 烧录系统至 eMMC

:::tip 提示
本章节将详细讲解如何将 Armbian OS 系统镜像烧录至 DshanPi-A1 的板载 eMMC 存储中。
设备出厂时已预装 Armbian OS，但在开发过程中如果出现系统损坏、配置错乱或需要升级版本时，请参考本章步骤进行系统恢复。
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

请下载以下必要的软件工具和系统镜像：

| 资源名称 | 说明 | 下载链接 |
| :--- | :--- | :--- |
| **Armbian OS 镜像** | 系统镜像文件 (.img.7z) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/100ASK_Armbian_25.11.0-trunk_Dshanpi-a1_noble_vendor_6.1.115_gnome_desktop.img.7z) |
| **RKDevTool** | 瑞芯微开发工具 (烧录软件) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/RKDevTool_Release_v3.32.zip) |
| **DriverAssitant** | USB 驱动安装助手 | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/DriverAssitant_v5.1.1.zip) |
| **SPL Loader** | 引导固件 (MiniLoader) | [点击下载](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/rk3576_spl_loader_v1.09.107.bin) |

:::info 注意
下载完成后，请解压 **RKDevTool** 和 **DriverAssitant** 压缩包。系统镜像 **.7z** 文件也需要解压出 **.img** 文件备用。
:::

### 1.3 安装 USB 驱动

在首次连接设备前，必须安装 Rockchip USB 驱动：

1.  打开解压后的 `DriverAssitant` 文件夹。
2.  右键以管理员身份运行 **`DriverInstall.exe`**。
3.  点击 **"驱动安装" (Install Driver)** 按钮，等待安装完成。

<img src={require('./images/image-20250815172019920.png').default} alt="驱动安装界面" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 2. 进入烧录模式 (MASKROM)

DshanPi-A1 需要进入 **MASKROM** 模式才能进行底层的系统烧录。请严格按照以下顺序操作：

1.  **连接数据线**：将 USB Type-C 线的一端连接电脑的 **USB 3.0 接口**（通常为蓝色），另一端连接开发板的 **Type-C OTG 接口**。
2.  **按住按键**：按住开发板上的 **`MASKROM`** 按键，**保持不松手**。
3.  **连接电源**：接入 PD 电源适配器给开发板上电。
4.  **松开按键**：等待约 2-3 秒后，松开 `MASKROM` 按键。此时开发板应已进入 MASKROM 模式。

<img src={require('./images/image-20250815154004776.png').default} alt="进入烧录模式示意图" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 3. 执行烧录步骤

打开 **RKDevTool.exe**，如果设备成功进入模式，软件底部会显示 **"发现一个MASKROM设备"**。

### 3.1 配置烧录选项

请参考下图进行配置，确保每一步都正确无误：

<img src={require('./images/image-20250821092501879.png').default} alt="RKDevTool 配置界面" style={{display: 'block', margin: '20px auto', maxWidth: '90%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

**配置详解：**

1.  **勾选写入项**：勾选列表中的前两项（Loader 和 System）。
2.  **存储介质**：确保右上角的存储介质选择为 **`EMMC`**。
3.  **地址设置**：两项的地址均保持默认的 **`0x00000000`**。
4.  **选择文件路径**：
    *   **Loader**: 点击最右侧的单元格，选择下载的引导固件 `rk3576_spl_loader_v1.09.107.bin`。
    *   **System**: 点击最右侧的单元格，选择解压后的系统镜像文件 `100ASK_xxx.img`。
5.  **强制按地址写**：勾选 **"强制按地址写" (Write by Address)** 选项。

### 3.2 开始烧录

确认底部显示 **"发现一个MASKROM设备"** 后，点击 **"执行" (Run)** 按钮开始烧录。

*   右侧信息框会显示烧录进度（Download Boot -> Download Image -> Check Image）。
*   烧录完成后，设备会自动重启进入新系统。

<img src={require('./images/image-20250814181827639.png').default} alt="烧录成功界面" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 4. 常见问题排查

:::warning 常见问题：烧录工具未识别到设备？
如果在连接后，RKDevTool 底部没有显示 "发现一个MASKROM设备"，请尝试以下方案：
:::

1.  **检查驱动**：打开 Windows 设备管理器，查看是否有 `Rockusb Device` 或类似名称的设备。如果没有或显示黄色感叹号，请重新安装驱动。
    <img src={require('./images/image-20250815174333674.png').default} alt="设备管理器检查" style={{display: 'block', margin: '10px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
2.  **更换接口/线材**：尝试更换电脑的 USB 接口（优先使用机箱后置 USB 3.0 接口）或更换一根高质量的 Type-C 数据线。
3.  **重新进入模式**：拔掉电源和数据线，严格按照“按住键 -> 插电源 -> 松开键”的顺序重试。
4.  **管理员权限**：尝试以管理员身份运行 RKDevTool。
