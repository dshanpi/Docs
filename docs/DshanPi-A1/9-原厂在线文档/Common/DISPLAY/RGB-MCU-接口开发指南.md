---
sidebar_position: 8
---

# RGB 和 MCU 接口开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_RGB_MCU_CN.pdf`（V1.5.0, 2024-08-27）整理，介绍 Rockchip 平台 RGB 和 MCU（8080）显示接口的调试方法。

:::info 适用范围
- **芯片平台**：RK1808 / RK312X / RK3288 / RK3308 / RK3326 / PX30 / RK3506 / RK3562 / RK3568 / RK3576 / RV1103 / RV1106 / RV1109 / RV1126
- **读者对象**：技术支持工程师、软件开发工程师、硬件开发工程师
:::

---

## 一、基础概念

### 1.1 RGB 接口（DPI 接口）

RGB 接口（Display Pixel Interface）使用同步信号：Vsync、Hsync、Den、DCLK。

#### DE Mode

仅由 DEN 信号决定数据是否有效，低电平有效。

#### SYNC Mode

由 Vsync 和 Hsync 信号同步数据扫描。

Rockchip 平台 RGB 输出时序同时兼容 DE Mode 和 SYNC Mode。

### 1.2 MCU 接口（DBI / 8080 接口）

MCU 接口支持双向通信，控制信号：
- **CSX/CSN** — 片选（低有效）
- **D/CX/RS** — 数据/命令选择（1=数据，0=命令）
- **WRX/WEN** — 写使能
- **RDX/REN** — 读使能

:::note 说明
RK 平台仅支持 MCU 接口的 TX（发送）功能，部分平台支持 Read 功能。
:::

#### Write Timing

CSX、D/CX、WRX 依次拉低，数据有效期间 WRX 从低变高。

#### Read Timing

CSX、D/CX、RDX 依次拉低，数据有效期间 RDX 从低变高。

Read 操作流程：
1. 先通过一次 write 传输寄存器地址
2. 第一次 read 返回的数据无效
3. 从第二次 read 开始是有效数据

**用途：** Panel 调试、区分 Panel ID 实现多屏兼容等。

#### Bypass 模式 vs Normal 模式

| 模式 | 说明 |
| :--- | :--- |
| **Bypass** | 指令传输模式（init/deinit 序列、frame write/read） |
| **Normal** | 正常图像传输模式，传输完 init 序列后进入 |

---

## 二、平台支持情况

| SOC | RGB | MCU | MCU Read | VOP 版本 | 支持 Output Mode |
| :--- | :---: | :---: | :---: | :--- | :--- |
| RK1808 | Y | Y | N | VOP 1.0 | RGB666/RGB565 |
| RK312X/PX3SE | Y | N | N | VOP 1.0 | RGB888/RGB666/RGB565 |
| RK3288 | Y | Y | N | VOP 1.0 | RGB888/RGB666/RGB565/RGB3x8 |
| RK3308B/BS | Y | Y | N | VOP 1.0 | RGB888/RGB666/RGB565/RGB3x8 |
| RK3326/PX30 | Y | Y | N | VOP 1.0 | RGB888/RGB666/RGB565 |
| RK3506 | Y | Y | Y | VOP 1.0 | RGB888/RGB666/RGB565/RGB3x8/RGB3x6/RGB2x8 |
| RK3562 | Y | N | N | VOP 2.0 | RGB888/RGB666/RGB565/RGB3x8 |
| RK3568 | Y | Y | N | VOP 2.0 | RGB888/RGB666/RGB565 |
| RK3576 | Y | Y | N | VOP 2.0 | RGB888/RGB666/RGB565/RGB3x8/RGB3x6/RGB2x8 |
| RV1103/1106 | Y | Y | N | VOP 1.0 | RGB888/RGB666/RGB565/RGB3x8 |
| RV1109/1126 | Y | Y | N | VOP 1.0 | RGB3x8 / RGB666/RGB565/RGB3x8 |

---

## 三、硬件连接

### 3.1 信号对应关系

| RGB888 | MCU | 引脚名 |
| :--- | :--- | :--- |
| DCLK | RS | VO_LCDC_CLK |
| VSYNC | CSN | VO_LCDC_VSYNC |
| HSYNC | WRN | VO_LCDC_HSYNC |
| DEN | RDN | VO_LCDC_DEN |
| R7~R0 / G7~G0 / B7~B0 | D23~D0 | VO_LCDC_D23~D0 |

### 3.2 RGB 接口数据线

24 根数据线（D23~D0）对应 RGB888（R7~R0, G7~G0, B7~B0）。

---

## 四、软件配置

### 4.1 显示通路

RGB/MCU 接口连接到 VOP 的 VP 上，需要配置 DTS 中的路由节点。

### 4.2 Panel 配置

#### SPI 初始化配置

部分 MCU 屏通过 SPI 接口发送初始化命令：

```dts
panel {
    compatible = "simple-panel-dsi";
    rockchip,cmd-type = "spi";    // 通过 SPI 发送命令
    panel-init-sequence = [...];  // 初始化序列
};
```

### 4.3 RGB 接口配置

```dts
&rgb {
    status = "okay";
};

panel {
    compatible = "simple-panel";
    bus-format = <MEDIA_BUS_FMT_RGB888_1X24>;
    display-timings { ... };
};
```

### 4.4 MCU 接口配置

#### MCU Bypass Timing 配置

MCU 时序参数：
- `mcu-pix-total` — 发送一次数据/命令需要的 DCLK 周期数
- `mcu-cs-pst / mcu-cs-pend` — 片选开始和结束位置
- `mcu-rw-pst / mcu-rw-pend` — 数据发送开始和结束位置

#### MCU Frame Write/Read

通过 Bypass 模式进行整帧数据的写入或读取。

---

## 五、调试流程

1. **确认硬件连接** — 数据线、控制信号、电源、背光
2. **确认供电时序** — 对照屏规格书检查上下电时序
3. **检查驱动加载** — DRM 驱动是否成功 probe
4. **检查时序配置** — clock、hactive、vactive、porch 等参数
5. **确认 bus-format** — 数据格式是否匹配
6. **输出测试图案** — 用彩条等图案验证显示通路

---

## 六、常见问题

### 6.1 屏幕有噪点或显示错位

可能原因：
1. **时序参数不匹配** — 对照规格书确认 hactive/vactive/porch 等参数
2. **数据线接错** — 检查硬件连接是否正确
3. **DE/SYNC 模式不匹配** — 确认屏使用的是 DE 模式还是 SYNC 模式
4. **像素时钟频率不准** — 调整 DCLK 频率
5. **bus-format 配置错误** — 尝试不同的数据格式

### 6.2 RGB/MCU 屏帧率计算

```
N = 每个像素需要的 cycle 数

RGB: fps = dclk / (htotal × vtotal × N)
MCU: fps = dclk / (htotal × vtotal × (mcu-pix-total + 1) × N)
```

| bus_format | N（cycle/pixel） |
| :--- | :---: |
| MEDIA_BUS_FMT_RGB888_1X24 | 1 |
| MEDIA_BUS_FMT_RGB666_1X18 | 3 |
| MEDIA_BUS_FMT_RGB565_1X16 | 4 |
| MEDIA_BUS_FMT_RGB888_3X8 | 1 |
| MEDIA_BUS_FMT_RGB888_DUMMY_4X8 | - |

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_RGB_MCU_CN.pdf` V1.5.0
- 《Rockchip_DRM_Panel_Porting_Guide.pdf》
- 《Rockchip_Developer_Guide_DRM_Display_Driver_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
