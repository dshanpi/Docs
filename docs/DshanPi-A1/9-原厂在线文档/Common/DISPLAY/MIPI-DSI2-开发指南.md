---
sidebar_position: 12
---

# MIPI DSI2 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_MIPI_DSI2_CN.pdf`（V2.2.0, 2024-06-12）整理，介绍 Rockchip RK3576/RK3588 平台 MIPI DSI-2 显示接口的特性、配置与调试方法。

:::info 适用范围
- **芯片平台**：RK3576 / RK3588
- **内核版本**：Linux Kernel 5.10 / 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

DSI-2 是 MIPI 联盟定义的通信协议，DWC-MIPI-DSI2 是实现 MIPI-DSI2 规范所有功能的数字核控制器，兼容 **D-PHY** 和 **C-PHY** 物理接口，支持 **DSC（Display Stream Compression）** 数据传输。

MIPI DSI 基于差分信号传输，特点：
- 引脚数量少，硬件设计简单
- 低功耗、低 EMI
- 硬件兼容性好

---

## 二、功能特性

| 功能 | RK3576 | RK3588 |
| :--- | :--- | :--- |
| Dual channel | Not support | Support |
| Max resolution | 2560x1600@60Hz | 4096x2304@60Hz |
| Data lanes | 1/2/4 lanes (D-PHY) | 1/2/4/8 lanes (D-PHY) |
| Max lane rate (D-PHY) | 2.5Gbps/lane | 4.5Gbps/lane |
| Max lane rate (C-PHY) | 1.7Gsps/lane | 2.0Gsps/lane |
| Color Format | RGB | RGB |
| Max Color Depth | 10 bit | 10 bit |
| DSC | Not support | VESA DSC 1.1/1.2a |
| C-PHY | Support | Support |

**MIPI DSI-2 vs MIPI DSI Host：**
DSI-2 兼容 DSI 所有协议功能，还增加支持 MIPI C-PHY。

---

## 三、驱动代码说明

### 3.1 U-Boot 驱动

**位置：**
```
drivers/video/drm/dw_mipi_dsi2.c
drivers/video/drm/samsung_mipi_dcphy.c
```

**配置：**
```
CONFIG_DRM_ROCKCHIP_DW_MIPI_DSI2=y
CONFIG_DRM_ROCKCHIP_SAMSUNG_MIPI_DCPHY=y
```

### 3.2 Kernel 驱动

**位置：**
```
# MIPI DSI-2 host controller
drivers/gpu/drm/rockchip/dw-mipi-dsi2-rockchip.c

# MIPI DCPHY
drivers/phy/rockchip/phy-rockchip-samsung-dcphy.c
```

**配置：**
```
CONFIG_ROCKCHIP_DW_MIPI_DSI=y
CONFIG_PHY_ROCKCHIP_SAMSUNG_DCPHY=y
```

**参考 DTS：**
- `rk3588-evb.dtsi` / `rk3588-evb1-lp4.dtsi` / `rk3588-evb2-lp4.dtsi` / `rk3588-evb3-lp5.dtsi` / `rk3588-evb4-lp4.dtsi`
- `rk3588s-evb.dtsi` / `rk3588s-evb1-lp4x.dtsi` / `rk3588s-evb2-lp5.dtsi` / `rk3588s-evb4-lp4x.dtsi`

---

## 四、DTS 配置

### 4.1 DSI 控制器配置

```dts
&dsi0 {
    status = "okay";
    //rockchip,lane-rate = <1000>;     // 手动指定 lane 速率
    //auto-calculation-mode;             // 使能 AutoCalculation 模式
    //disable-hold-mode;                  // 不配置 TE 也能刷帧
    //support-psr;                        // 使能 PSR 功能
};
```

### 4.2 Panel 配置

```dts
&dsi0_panel {
    status = "okay";
    compatible = "simple-panel-dsi";
    reg = <0>;
    power-supply = <&vcc3v3_lcd_n>;
    backlight = <&backlight>;
    reset-gpios = <&gpio2 RK_PB4 GPIO_ACTIVE_LOW>;
    reset-delay-ms = <10>;
    enable-delay-ms = <10>;
    prepare-delay-ms = <10>;
    unprepare-delay-ms = <10>;
    disable-delay-ms = <60>;

    dsi,flags = <(MIPI_DSI_MODE_VIDEO | MIPI_DSI_MODE_VIDEO_BURST |
                  MIPI_DSI_MODE_LPM | MIPI_DSI_MODE_EOT_PACKET)>;
    dsi,format = <MIPI_DSI_FMT_RGB888>;
    dsi,lanes = <4>;

    //phy-c-option;                       // C-PHY 屏
    //compressed-data;                    // DSC 压缩屏
    //slice-width = <720>;               // DSC slice 宽
    //slice-height = <65>;               // DSC slice 高
    //version-major = <1>;               // DSC 版本
    //version-minor = <1>;

    panel-init-sequence = [
        05 78 01 11      // DCS Short, 延迟 120ms, 0x11 (Sleep Out)
        05 00 01 29      // DCS Short, 无延迟, 0x29 (Display On)
    ];

    panel-exit-sequence = [
        05 00 01 28      // Display Off
        05 00 01 10      // Sleep In
    ];

    display-timings {
        native-mode = <&dsi0_timing0>;
        dsi0_timing0: timing0 {
            clock-frequency = <132000000>;
            hactive = <1080>;
            vactive = <1920>;
            hfront-porch = <15>;
            hsync-len = <4>;
            hback-porch = <30>;
            vfront-porch = <15>;
            vsync-len = <2>;
            vback-porch = <15>;
            hsync-active = <0>;
            vsync-active = <0>;
            de-active = <0>;
            pixelclk-active = <0>;
        };
    };
};
```

---

## 五、配置说明

### 5.1 通用配置项

| Property | Description |
| :--- | :--- |
| `rockchip,lane-rate` | 手动指定 MIPI 通道速率（D-PHY: Mbps/Kbps；C-PHY: Msps/Ksps） |
| `auto-calculation-mode` | 使能 Auto-Calculation 工作模式 |
| `disable-hold-mode` | 不配置 TE 也能刷帧 |
| `support-psr` | 使能 PSR 功能 |
| `compatible` | `simple-panel-dsi` |
| `power-supply` | 屏端供电 |
| `backlight` | 背光控制 |
| `enable-gpios` | 屏使能 GPIO |
| `reset-gpios` | 屏复位 GPIO |
| `reset-delay-ms` / `enable-delay-ms` / `prepare-delay-ms` 等 | Panel 上下电时序延时 |
| `dsi,flags` | DSI 工作模式配置 |
| `dsi,format` | 像素数据格式（RGB888 / RGB666 / RGB666_PACKED / RGB565） |
| `dsi,lanes` | MIPI data 通道数（D-PHY: 1/2/4/8；C-PHY: 1/2/3/6 trios） |
| `phy-c-option` | C-PHY 屏标识 |
| `compressed-data` | 带 DSC 压缩屏标识 |
| `slice-width` / `slice-height` | DSC slice 尺寸 |
| `version-major` / `version-minor` | DSC 版本 |
| `panel-init-sequence` | 屏上电初始化序列 |
| `panel-exit-sequence` | 屏下电序列 |

### 5.2 dsi,flags 说明

#### 5.2.1 CLK Type（时钟模式）

- **连续时钟模式（默认）** — 时钟通道始终工作，主从都支持
- **非连续时钟模式** — 节省功耗，需外设支持，配置 `MIPI_DSI_CLOCK_NON_CONTINUOUS`

#### 5.2.2 Eotp（End of Transmission Packet）

Eotp 是一个短包，用于指示高速传输结束，增强高速通信稳健性。
- DSI V1.0 及更早版本不支持
- RK3588/RK3576 DSI 版本为 V2.0
- 通过 `MIPI_DSI_MODE_EOT_PACKET` 开关控制

Eotp 固定格式：
- Data Type = 0b001000
- Virtual Channel = 0b00
- Payload = 0x0F0F
- ECC = 0x01

#### 5.2.3 BLANK_HS_EN

部分显示模组或转接芯片不支持 Hblank 阶段有两个 LP-11，可配置：
- `BLK_HFP_HS_EN` — HFP 以高速形式存在
- `BLK_HBP_HS_EN` — HBP 以高速形式存在

### 5.3 初始化序列常见数据类型

| data type | description |
| :---: | :--- |
| 0x03 | Generic Short WRITE, no parameters |
| 0x13 | Generic Short WRITE, 1 parameter |
| 0x23 | Generic Short WRITE, 2 parameters |
| 0x29 | Generic long WRITE |
| 0x05 | DCS Short WRITE, no parameters |
| 0x15 | DCS Short WRITE, 1 parameter |
| 0x07 | DCS Short WRITE, 1 parameter, DSC EN |
| 0x0a | DCS long WRITE, PPS, 128 bytes |

**格式：** `data_type delay_ms payload_length payload...`

---

## 六、带宽计算

MIPI DSI 带宽需满足：
```
有效带宽 = Lane数 × Lane速率 × 0.8 (8b/10b 编码)
像素比特率 = 像素时钟 × bpp
有效带宽 > 像素比特率
```

---

## 七、DSC（Display Stream Compression）

### 7.1 Slice

DSC 将图像划分为多个 slice 进行压缩。

### 7.2 DSC Encode

DSC 编码由 VOP2 中的 DSC 模块完成。

### 7.3 DSC Bandwidth

DSC 压缩后带宽显著降低，可支持更高分辨率。

### 7.4 PPS（Picture Parameter Set）

128 字节的 PPS 数据描述 DSC 编码参数，通过 DSI 发送给屏端。

### 7.5 实例

#### 7.5.1 何时启用 DSC

当原始数据带宽超过 MIPI 接口最大带宽时，需要启用 DSC 压缩。

#### 7.5.2 双通道 MIPI 如何启用 DSC

在 DTS 中配置 `compressed-data`、`slice-width`、`slice-height`、`version-major/minor` 等属性。

---

## 八、显示通路（Display Route）

### 8.1 MIPI with DSC

VOP → DSC 编码 → DSI Host → D-PHY/C-PHY → Panel

### 8.2 MIPI with DSC Bypass

不使用 DSC 压缩，直接输出。

---

## 九、DSI Host 配置

### 9.1 单 DSI

#### DSI0 / DSI1

每个 DSI 控制器独立驱动一个屏。

### 9.2 双通道 DSI（Dual Channel）

两个 DSI 通道驱动一个双通道屏，左右半屏合并输出（仅 RK3588 支持）。

### 9.3 Dual-link DSI

### 9.4 DSI 应用场景

#### DSI + SerDes 方案
通过串行器/解串器延长 MIPI 传输距离。

#### 多屏拼接方案
多个 DSI 接口驱动多个屏，实现拼接显示。

---

## 十、DC-PHY

### 10.1 D-PHY

标准 MIPI D-PHY，差分信号对。

### 10.2 C-PHY

MIPI C-PHY，使用 3 线制 trio，更高的带宽效率。

---

## 十一、动态变帧

支持通过调整 VFP、HFP 或 dclk rate 实现动态帧率调整（VRR）。详细可参考《RK3588 Vsync 调整说明》。

---

## 十二、PSR（Panel Self Refresh）

面板自刷新模式，降低功耗。配置 `support-psr` 属性使能。

---

## 十三、协议分析

### 13.1 DSI 分层定义

### 13.2 Lane 状态和线路电平

- **LP（Low Power）模式** — 低功耗，控制信号传输
- **HS（High Speed）模式** — 高速，数据传输

### 13.3 操作模式

- **Escape Modes** — 包含 Escape Commands、LPDT、ULPS
- **HSDT（High-Speed Data Transmission）** — 高速数据传输
- **BTA（Bus Turn Around）** — 总线转向

### 13.4 Video Mode 时序

#### Non-Burst Mode with Sync Pulses
#### Burst Mode

---

## 十四、常见问题

### 14.1 查看 VOP timing 和 Connector 信息

```bash
cat /sys/kernel/debug/dri/0/summary
```

### 14.2 查看 DSI2 相关 clk tree

```bash
cat /sys/kernel/debug/clk/clk_summary | grep dsi
```

### 14.3 查看指定 DSI lane 速率

```bash
cat /sys/kernel/debug/clk/clk_summary | grep dphy
```

### 14.4 VOP 输出 Color Bar 测试

MIPI DSI2 HOST 没有自己的 color bar 功能，通过 VOP2 投显：

**RK3588：**
```bash
echo colorbar > /sys/class/drm/card0-DSI-1/debug
```

**RK3576：**
```bash
# VOP 自测模式
```

### 14.5 判断 DSI2 与 panel 通信是否正常

通过读取 `get_power_mode`（0x0A 命令）判断：
- 未下发 0x11、0x29 时，正常返回 0x08
- 已下发 0x11、0x29 时，正常返回 0x9c

### 14.6 DRM 驱动没有 bind 起来

- 检查 DTS 配置是否正确
- 检查供电和复位时序
- 检查初始化序列是否正确

### 14.7 Backlight 驱动 probe 失败

- 检查背光 PWM 引脚配置
- 检查背光电源

### 14.8 Command Mode 显示模组如何配置 TE

#### 硬件 TE
通过 TE 引脚触发帧同步。

#### 软件 TE
通过软件方式同步。

### 14.9 双通道 MIPI 切换主从顺序

### 14.10 调试节点

#### Patch
#### 驱动强度
#### 共模电压
#### Cap Peaking
#### 信号 Timing（Tlpx、Ths_prepare、Ths_zero、Ths_trail、Ths_exit 等）
#### High-Speed Driver Up/Down Resistor Control

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_MIPI_DSI2_CN.pdf` V2.2.0
- 《Rockchip_RK3588_Developer_Guide_MIPI_DSI2_CN.pdf》V2.0.0
- 《Rockchip_DRM_Panel_Porting_Guide.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
