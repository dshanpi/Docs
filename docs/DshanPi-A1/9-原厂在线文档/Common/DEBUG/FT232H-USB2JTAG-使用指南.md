---
sidebar_position: 2
---

# FT232H USB2JTAG 使用指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_FT232H_USB2JTAG.pdf`（V2.0.0, 2021-06-10）整理，介绍 Rockchip FT232H USB 转 JTAG 小板的使用方法。

:::info 适用范围
- **芯片平台**：全系列
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## FT232H 芯片简介

FT232H 是 FTDI（Future Technology Devices International Ltd）公司的一款 USB 转各种接口的芯片。本文主要使用其 **USB 转 JTAG/SWD** 功能。

---

## Rockchip FT232H 小板

小板硬件说明：

| 组件 | 说明 |
| :--- | :--- |
| **LED 指示灯** | LED1：电源指示灯；LED2：灭=未连接，闪=连接；LED3：未定义 |
| **USB 接口** | TYPEC 接口或 mini USB 接口两种 |
| **ARM 20PIN JTAG 接口** | 标准 ARM JTAG 座 |
| **拨码开关** | 切换 SWD / JTAG 模式 |
| **飞线排针** | VCC、TCS、TCK、GND，可与板子飞线连接 |
| **电压选择排针** | 3.3V、VCCIO、1.8V，需用跳帽连接 VCCIO 到对应电压 |

### 拨码开关配置

| 模式 | 开关 1/3/5 | 开关 2/4/6 |
| :--- | :---: | :---: |
| **SWD 模式** | off | on |
| **JTAG 模式** | on | off |

:::caution 重要
VCCIO 一定要接（3.3V 或 1.8V），不然 JTAG 通讯会失败。
:::

---

## 驱动安装（Windows）

不同软件使用 FT232H 时驱动不同，需要根据需求修改 USB 驱动。以下以 OpenOCD 使用 FT232H 为例。

### 步骤 1：运行 zadig 工具

运行 `RK\tools\zadig-2.5.exe`，点击 **Options → List All Devices**。

### 步骤 2：替换为 WinUSB 驱动

1. 选择 `Single RS232-HS` 设备
2. 确认 USB ID 为 `0403 6014`
3. 选择 **WinUSB** 驱动
4. 点击安装

### 步骤 3：验证安装

安装成功后，可用 OpenOCD 测试驱动是否正常工作。

:::note 注意
- 安装时请保持设备插入状态
- 安装成功后如无法使用，请重新拔插
- 安装完 WinUSB 驱动后，若要用 FT_Prog.exe 配置，需要先在设备管理器中卸载该设备的驱动
:::

---

## Windows 环境下配置 FT232H EEPROM 信息（可选）

### 步骤 1：安装 EEPROM 编程工具

运行 `RK\tools\FTDI\FT_Prog_v3.8.128.448 Installer.exe` 安装。

也可从官网下载：
[https://www.ftdichip.com/Support/Utilities.htm#FT_PROG](https://www.ftdichip.com/Support/Utilities.htm#FT_PROG)

### 步骤 2：扫描设备

运行 `FT_Prog.exe`，点击 **DEVICES 菜单 → 扫描设备**。

### 步骤 3：配置驱动属性

1. 点击展开 **Hardware Specific**
2. 点击展开 **Port A**
3. 选中 **Driver**
4. 选择 **D2XX Direct**

### 步骤 4：配置 JTAG/SWD 驱动强度

1. 点开 **IO Pins**
2. 选中 **Group AD**
3. **Drive** 选择 **8mA**（可改善 TCK 30MHz 波形）

### 步骤 5：开始编程

点击闪电按钮 → 开始编程 → 查看编程结果。

---

## Windows 上 Jlink 适用 OpenOCD

参照 FT232H 的方式，将 Jlink 驱动替换成 WinUSB 驱动即可。

:::caution 注意
如果其他软件要用 JLink，需要回退 WinUSB 驱动。
:::

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_FT232H_USB2JTAG.pdf` V2.0.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
