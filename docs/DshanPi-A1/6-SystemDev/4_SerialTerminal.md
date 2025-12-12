---
sidebar_position: 4
---

# 串口访问终端

:::tip 提示
本章节将指导您如何配置和使用 **MobaXterm** 串口终端工具，与 DshanPi-A1 建立稳定的串行通信连接。
:::

## 1. 准备工作

### 1.1 获取 MobaXterm

**MobaXterm** 是一款功能强大的全能型终端软件，支持 SSH、串口、VNC 等多种协议。
对于 Windows 用户，我们推荐下载 **Portable edition (便携版)**，无需安装，解压即用。

*   **官方下载地址**：[MobaXterm Home Edition](https://mobaxterm.mobatek.net/download-home-edition.html)

<img src={require('./images/image-20250808110010419.png').default} alt="MobaXterm下载页面" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::info macOS/Linux 用户
如果您使用的是 macOS 或 Linux 系统，推荐使用 **WindTerm** 或 **Minicom** 作为替代工具。
:::

### 1.2 确认串口设备

将 USB 转串口模块连接到电脑后，请打开 **设备管理器**，查看端口号。

1.  **打开设备管理器**：右键点击“开始”菜单 -> 设备管理器。
2.  **查看端口**：展开 **“端口 (COM 和 LPT)”** 列表。
3.  **确认端口号**：找到对应的 USB Serial 设备（如 `USB-SERIAL CH340`），并记下其端口号（例如 `COM144`）。

<img src={require('./images/image-20250808111937052.png').default} alt="设备管理器查看端口" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::warning 驱动安装提示
如果在设备管理器中未发现端口，或设备显示黄色感叹号：
1.  **检查连接**：确保 USB 线连接牢固。
2.  **安装驱动**：Windows 10/11 通常会自动安装驱动。如果未安装，请下载并安装 **CH340** 或 **CP2102** 驱动（根据您的模块型号）。
:::

## 2. 配置 MobaXterm

### 2.1 创建新会话

打开 MobaXterm，点击左上角的 **`Session` (会话)** 按钮，或者使用快捷键 `Ctrl + Shift + N`。

<img src={require('./images/image-20250808115942583.png').default} alt="创建新会话" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 2.2 设置串口参数

在弹出的会话设置窗口中，选择 **`Serial` (串口)** 标签页，并进行如下配置：

1.  **Serial port (串口号)**：选择在设备管理器中看到的端口号（如 `COM144`）。
2.  **Speed (波特率)**：设置为 **`1500000`** (1.5M)。
    *   *注意：DshanPi-A1 (RK3576) 的默认调试波特率为 1500000。*
3.  **Flow control (流控)**：点击 "Advanced Serial settings" (高级串口设置) 查看，通常默认为 **None**，无需更改。确保不要勾选 RTS/CTS 硬件流控。

<img src={require('./images/image-20250808144728518.png').default} alt="配置串口参数" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

设置完成后，点击 **`OK`** 即可打开串口终端窗口。

## 3. 常见问题排查

如果连接后无法正常通信，请对照下表进行检查：

| 现象 | 可能原因 | 解决方案 |
| :--- | :--- | :--- |
| **无显示 / 乱码** | 波特率不匹配 | 检查 MobaXterm 波特率是否为 **1500000**。 |
| | 接线错误 | 检查 **TX** 和 **RX** 是否接反（TX 接 RX，RX 接 TX）。 |
| | 地线未接 | 确保 USB 转串口模块与板子 **GND 共地**。 |
| **无法打开串口** | 端口被占用 | 关闭其他可能占用串口的软件（如串口助手、烧录工具）。 |
| | 驱动异常 | 检查设备管理器中是否有黄色感叹号，重装驱动。 |
| **只能收不能发** | TX 线断路 | 检查 PC 端 TX 到板子 RX 的连接是否正常。 |
| | 流控开启 | 确保 MobaXterm 中 Flow control 设置为 **None**。 |
| **无打印信息** | 系统已启动 | 如果上电很久后才打开串口，可能错过了启动日志。**按回车键** 看是否有 shell 提示符，或 **重新上电** 。 |

:::success 成功标志
当您在终端中看到类似 `root@localhost:~#` 的提示符，或者能看到系统启动滚动的日志信息，说明串口终端已成功连接！
:::
