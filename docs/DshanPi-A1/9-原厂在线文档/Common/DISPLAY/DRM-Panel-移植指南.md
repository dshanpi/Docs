---
sidebar_position: 2
---

# DRM Panel 移植指南

本文档基于瑞芯微官方文档 `Rockchip_DRM_Panel_Porting_Guide_V1.6_20190228.pdf`（V1.6, 2019-02-28）整理，介绍 Rockchip DRM 框架下各类显示面板的移植方法。

:::info 适用范围
- **芯片平台**：RK3128 / RK3288 / RK3326 / PX30 / RK3368 / RK3399 等
- **接口类型**：MIPI-DSI / eDP / LVDS / RGB / DP Alt Mode / MCU / RK618
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、显示通路概述

Rockchip 显示通路：`VOP → Display Interface → Panel`

| 层级 | 说明 |
| :--- | :--- |
| **VOP** | Video Output Processor，1~2 个，决定最大分辨率支持 |
| **Display Interface** | HDMI / MIPI-DSI / RGB / LVDS / eDP / DP 等接口驱动 |
| **Panel** | 屏驱动（嵌入式屏需单独驱动，外接显示器一般无需） |

:::note 说明
- **Embedded Connection**（嵌入式屏）：不支持 HPD，需手动配置上电时序和显示参数
- **Box-to-Box Connection**（外接显示器）：支持 HPD，自动识别显示信息
:::

---

## 二、Panel 通用配置

### 2.1 驱动文件

| 系统 | 文件路径 |
| :--- | :--- |
| **Kernel** | `drivers/gpu/drm/panel/panel-simple.c` |
| **Kernel DT Bindings** | `Documentation/devicetree/bindings/display/panel/simple-panel.txt` |
| **U-Boot** | `drivers/video/drm/rockchip_panel.c` |

### 2.2 DTS 通用属性

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `compatible` | string | `simple-panel` 或 `simple-panel-dsi` |
| `backlight` | phandle | 背光节点引用 |
| `power-supply` | phandle | 电源 regulator（可选） |
| `reset-gpios` | phandle | Reset GPIO（可选） |
| `enable-gpios` | phandle | Enable GPIO（可选） |
| `prepare-delay-ms` | u32 | prepare 延时（参考屏规格书） |
| `reset-delay-ms` | u32 | reset 延时 |
| `init-delay-ms` | u32 | 初始化延时 |
| `enable-delay-ms` | u32 | enable 延时 |
| `unprepare-delay-ms` | u32 | unprepare 延时 |
| `disable-delay-ms` | u32 | disable 延时 |
| `display-timings` | node | LCD 时序参数 |
| `width-mm` / `height-mm` | u32 | 物理尺寸 |

### 2.3 常见问题

1. **Reset/Enable 极性**：reset 脚默认 LOW 有效（驱动最后拉高），enable 脚默认 HIGH 有效（驱动最后拉高）。若相反，驱动会反向处理。

2. **DRM bind 失败（-EPROBE_DEFER）**：往往是 panel 驱动 probe 失败引起，检查 reset/enable GPIO 是否与其他模块冲突。

3. **Simple-panel 扩展性**：只是通用驱动，特殊需求需扩展或写专用驱动。

---

## 三、MIPI-DSI

### 3.1 驱动文件

| 系统 | 文件 |
| :--- | :--- |
| **Kernel Host** | `drivers/gpu/drm/rockchip/dw-mipi-dsi.c` |
| **Kernel PHY** | `drivers/phy/rockchip/phy-rockchip-inno-video-combo-phy.c` |
| **DT Bindings** | `Documentation/devicetree/bindings/display/rockchip/dw_mipi_dsi_rockchip.txt` |

**支持速率：**
- RK3128/RK3326/PX30/RK3368：1~4 lanes, 1Gbps/lane
- RK3288/RK3399：1~8 lanes, 1.5Gbps/lane

### 3.2 工作模式

#### Single-channel 单通道
```
VOP → MIPI-DSI → Panel (1~4 lanes)
```

#### Dual-channel 双通道（RK3288/RK3399）
- 模式①：标准 dual-channel 屏（单个屏，5~8 lanes）
- 模式②：两个相同屏，左右半屏分别显示

#### Dual-link 双链路（RK3399）
两个独立 MIPI-DSI 接不同屏，共用一个 PLL（需同 lane-rate 工作）

### 3.3 Host DTS 配置

| 属性 | 说明 |
| :--- | :--- |
| `rockchip,lane-rate` | DATA_LANE 速率（Mbps/lane），CLK 为其一半。不配则自动计算 |
| `rockchip,dual-channel` | 使能 dual-channel 模式 |

### 3.4 Panel DTS 配置（simple-panel-dsi）

| 属性 | 值 | 说明 |
| :--- | :--- | :--- |
| `compatible` | `simple-panel-dsi` | MIPI DSI 屏驱动 |
| `reg` | 0 | virtual channel |
| `dsi,flags` | bitmask | 模式标志 |
| `dsi,format` | `MIPI_DSI_FMT_RGB888` | 像素格式 |
| `dsi,lanes` | 1~8 | lane 数（&gt;4 为 dual-channel） |
| `panel-init-sequence` | - | 上电初始化序列 |
| `panel-exit-sequence` | - | 下电序列 |

**dsi,flags 常用标志：**
- `MIPI_DSI_MODE_VIDEO` — Video 模式
- `MIPI_DSI_MODE_VIDEO_BURST` — Video Burst 模式
- `MIPI_DSI_MODE_LPM` — 默认 LP 模式发送初始化序列
- `MIPI_DSI_MODE_EOT_PACKET` — 关闭 EOTP 特性
- `MIPI_DSI_CLOCK_NON_CONTINUOUS` — 非连续时钟

### 3.5 初始化命令格式

命令序列格式：头部 3 字节（Data Type + Delay + Payload Length），之后为 Payload。

#### Data Type 分类

**DCS Write：**
| n 参数数 | Data Type | 包类型 |
| :---: | :---: | :--- |
| 0 | 0x05 | DCS Short Write, no parameters |
| 1 | 0x15 | DCS Short Write, 1 parameter |
| ≥2 | 0x39 | DCS Long Write |

**Generic Write：**
| n 参数数 | Data Type | 包类型 |
| :---: | :---: | :--- |
| 0 | 0x03 | Generic Short Write, no parameters |
| 1 | 0x13 | Generic Short Write, 1 parameter |
| 2 | 0x23 | Generic Short Write, 2 parameters |
| ≥3 | 0x29 | Generic Long Write |

#### 示例

```
0x39 0x00 0x04 0xb9 0xff 0x83 0x94
```
- Data Type: 0x39 (DCS Long Write)
- Delay: 0x00 (0ms)
- Length: 0x04 (4 Bytes)
- Payload: 0xb9 0xff 0x83 0x94

### 3.6 常见问题

1. **MIPI-DSI 外设读写**：使用 `drm_mipi_dsi.c/h` 提供的 API

2. **判断外设是否工作**：读取 `MIPI_DCS_GET_POWER_MODE` (0x0A)
   - mode=0x08：OFF 状态
   - mode=0x9c：ON 状态

3. **DCS 背光**：设备支持标准 DCS 背光且驱动实现了 DCS 背光驱动时可使能

4. **EOTP 特性**：flags 中配置 `MIPI_DSI_MODE_EOT_PACKET` 表示**关闭** EOTP

5. **非连续时钟**：flags 中配置 `MIPI_DSI_CLOCK_NON_CONTINUOUS`

---

## 四、eDP

### 4.1 支持情况

| 芯片 | lanes | link rate |
| :--- | :---: | :--- |
| RK3288 / RK3368 | 1/2/4 | 1.62Gbps / 2.7Gbps |
| RK3399 | 1/2/4 | 1.62Gbps / 2.7Gbps / 5.4Gbps |

### 4.2 驱动文件

```
drivers/gpu/drm/bridge/analogix/analogix_dp_core.c
drivers/gpu/drm/bridge/analogix/analogix_dp_reg.c
drivers/gpu/drm/rockchip/analogix_dp-rockchip.c
drivers/phy/rockchip/phy-rockchip-dp.c
```

### 4.3 DTS 配置

**Host 属性：**
| 属性 | 说明 |
| :--- | :--- |
| `force-hpd` | 嵌入式屏使用，强制 HPD（不需要实际 HPD 信号） |
| `hpd-gpios` | Box-to-box 模式使用，HPD GPIO |

**Panel 属性：**
| 属性 | 值 | 说明 |
| :--- | :--- | :--- |
| `bpc` | 6 或 8 | Bit per component |
| `bus-format` | `MEDIA_BUS_FMT_RGB666_1X18` / `MEDIA_BUS_FMT_RGB888_1X24` | 总线格式 |

### 4.4 常见问题

**Aux Transaction fail：**
```
Rx Max Link Rate is abnormal :c0 !
Rx Max Lane count is abnormal :0 !
AUX CH command reply failed!
```
原因：设备端未正常工作或屏线问题 → 检查供电和排线。

---

## 五、LVDS

### 5.1 支持情况

- RK3128 / PX30 / RK3326 / RK3368：single-channel
- RK3288：single-channel / dual-channel

### 5.2 驱动文件

```
drivers/gpu/drm/rockchip/rockchip_lvds.c
drivers/phy/rockchip/phy-rockchip-inno-video-combo-phy.c
```

### 5.3 DTS 配置

**Host 属性：**
| 属性 | 说明 |
| :--- | :--- |
| `dual-channel` | 使能双通道模式 |
| `rockchip,data-swap` | 双通道下奇偶像素互换 |

**Panel bus-format：**

| 值 | 对应模式 |
| :--- | :--- |
| `MEDIA_BUS_FMT_RGB666_1X7X3_SPWG` | vesa-18 |
| `MEDIA_BUS_FMT_RGB888_1X7X4_SPWG` | vesa-24 |
| `MEDIA_BUS_FMT_RGB888_1X7X4_JEIDA` | jeida-24 |
| `MEDIA_BUS_FMT_RGB666_1X7X3_JEIDA` | jeida-18 |

### 5.4 Data Mapping

支持 **VESA** 和 **JEIDA** 两种数据映射格式，6bit 和 8bit 输出模式。

---

## 六、RGB

### 6.1 支持平台

RK3128 / RK3326 / PX30 / RK3288 / RK3368

### 6.2 驱动文件

```
drivers/gpu/drm/rockchip/rockchip_rgb.c
drivers/phy/rockchip/phy-rockchip-inno-video-combo-phy.c
```

### 6.3 Panel bus-format

| 值 | 对应模式 |
| :--- | :--- |
| `MEDIA_BUS_FMT_RBG888_1X24` | OUT_P888 |
| `MEDIA_BUS_FMT_RGB666_1X24_CPADHI` | OUT_D888_P666 |
| `MEDIA_BUS_FMT_RGB666_1X18` | OUT_P666 |

---

## 七、DP Alt Mode

### 7.1 驱动文件

```
drivers/gpu/drm/rockchip/cdn-dp-core.c
drivers/gpu/drm/rockchip/cdn-dp-reg.c
drivers/gpu/drm/rockchip/cdn-dp-link-training.c
drivers/phy/rockchip/phy-rockchip-typec.c
```

### 7.2 DTS 配置节点

- **DP_TX** — DisplayPort 发送端
- **USB Type-C PHY** — Type-C PHY 配置
- **USB PD** — PD 控制器
- **VOP Routing** — VOP 路由（一般选 VOPB，支持 4K）

---

## 八、RK618 显示转换芯片

RK616/RK618 是 Rockchip 配套显示转换芯片。

### 8.1 芯片特性

| 接口 | 说明 |
| :--- | :--- |
| **LCD0 / LCD1** | 两个 RGB 输入接口，可双屏异显 |
| **RGB 输出** | 与 LVDS 输出复用 |
| **LVDS 输出** | 与 RGB 输出复用，RK618 支持 dual-channel |
| **MIPI-DSI 输出** | RK618 支持，RK616 不支持 |
| **HDMI 输出** | 两个芯片都支持 |

### 8.2 驱动文件

```
drivers/mfd/rk618.c
drivers/clk/rockchip/rk618/clk-rk618.c
drivers/gpu/drm/rockchip/rk618/rk618_hdmi.c
drivers/gpu/drm/rockchip/rk618/rk618_lvds.c
drivers/gpu/drm/rockchip/rk618/rk618_rgb.c
drivers/gpu/drm/rockchip/rk618/rk618_dsi.c
drivers/gpu/drm/rockchip/rk618/rk618_scaler.c
```

### 8.3 RK618 节点配置

| 属性 | 说明 |
| :--- | :--- |
| `pinctrl-names` / `pinctrl-0` | CLKIN 引脚复用 |
| `clocks` / `clock-names` | 输入时钟 CLKIN |
| `assigned-clocks` / `assigned-clock-rates` | CLKIN 默认 12MHz |
| `reset-gpios` | Reset 引脚（可选） |
| `enable-gpios` | Enable 引脚（可选） |
| `power-supply` | 电源 regulator（可选） |

### 8.4 各接口配置

- **HDMI**：RGB 输入 → HDMI 输出，需配置 interrupt
- **LVDS**：RGB 输入 → LVDS 输出，支持 dual-channel（RK618）
- **RGB**：RGB 输入 → RGB 输出
- **MIPI-DSI**：RGB 输入 → MIPI-DSI 输出（RK618）

### 8.5 Clone Mode

HDMI 与 LVDS 同显模式：
```
VOP → RGB → VIF → HDMI
               → SCALER → LVDS → Panel
```
SCALER 模块按 LCD 分辨率缩放，建议使用横屏 LCD。

### 8.6 调试步骤

1. **确认 RK618 工作正常**：读取寄存器节点，若值为 XXXXXXXX 说明未正常工作 → 检查供电、复位、CLKIN（12MHz）
2. **单屏调试**：先分别调通 HDMI 和单屏
3. **双屏同显**：单屏都通后再配置同显

**参考 DTS：**
| 模式 | 文件 |
| :--- | :--- |
| Single LVDS | `px30-ad-r35-mb-rk618-lvds.dts` |
| Dual LVDS | `px30-ad-r35-mb-rk618-dual-lvds.dts` |
| HDMI | `px30-ad-r35-mb-rk618-hdmi.dts` |
| DSI | `px30-z7-a0-rk618-dsi.dts` |
| Clone (HDMI+LVDS) | `px30-ad-r35-mb-rk618-hdmi-lvds.dts` |

---

## 九、MCU/CPU 屏

### 9.1 接口特性

基于 i80 总线协议：
- **控制信号**：CS（片选，低有效）、RS（数据/命令区分）、RD（读写控制）、WR（写使能，上升沿有效）
- **数据线**：8/16/18/24 位
- **优点**：控制简单，无需同步信号和时钟
- **缺点**：需内置 GRAM，成本高，分辨率受限

**支持平台：** RK3188 / RK3308 / RK3326 / PX30

### 9.2 Panel 特殊属性

| 属性 | 值 | 说明 |
| :--- | :--- | :--- |
| `rgb-mode` | p888 / p666 / p565 / s888 / s888_dummy | 数据接口类型 |
| `rockchip,cmd-type` | `spi` / `mcu` | 初始化命令发送接口 |

### 9.3 MCU 时序参数

- `mcu-pix-total`：发送一次数据/命令需要的 DCLK 周期数
- `mcu-cs-pst/mcu-cs-pend`：片选开始和结束位置
- `mcu-rw-pst/mcu-rw-pend`：数据发送开始和结束位置

---

## 十、双屏显示（Dual-Display）

### 10.1 主副屏属性配置

```
sys.hwc.device.primary=eDP
sys.hwc.device.extend=HDMI-A
```

### 10.2 关闭 AFBC

VOPL 不支持 AFBC，需关闭：
```
hardware/rockchip/libgralloc/Android.mk
-DUSE_AFBC_LAYER=0
```

### 10.3 DCLK 父时钟配置

RK3399 + rkdevelop U-Boot 需调整 VOP DCLK 父时钟，避免时钟切换影响。

### 10.4 关闭 DDR 变频

RK3326/PX30 带宽不足导致 VOP 报错时，`auto-freq-en` 设为 0。

---

## 十一、Debug

1. **确认驱动加载**：DRM 驱动可能多次 -EPROBE_DEFER，最终 bound 成功即可
2. **查看当前显示信息**：`cat /sys/kernel/debug/dri/0/summary`
3. **查看 connector 状态**：连接状态、使能状态、支持的显示模式
4. **手动开关屏：**
   ```bash
   echo off &gt; /sys/class/drm/card0-eDP-1/status
   echo on &gt; /sys/class/drm/card0-eDP-1/status
   ```

---

## 参考资料

- 原始文档：`Rockchip_DRM_Panel_Porting_Guide_V1.6_20190228.pdf` V1.6
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
