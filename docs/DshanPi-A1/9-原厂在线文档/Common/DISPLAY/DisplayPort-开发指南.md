---
sidebar_position: 10
---

# DisplayPort 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_DisplayPort_CN.pdf`（V1.2.0, 2024-03-25）整理，介绍 Rockchip RK3576/RK3588 平台 DisplayPort 显示接口的特性、配置与调试方法。

:::info 适用范围
- **芯片平台**：RK3576 / RK3588
- **内核版本**：Linux Kernel 5.10 / 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、功能特性

| 功能 | RK3576 | RK3588 |
| :--- | :--- | :--- |
| Version | 1.4a | 1.4a |
| SST | Support | Support |
| MST | Support | Not support |
| DSC | Not support | Not support |
| Max resolution | 4K@120Hz | 8K@30Hz |
| Main-Link lanes | 1/2/4 lanes | 1/2/4 lanes |
| Main-Link rate | 8.1/5.4/2.7/1.62 Gbps/lane | 8.1/5.4/2.7/1.62 Gbps/lane |
| AUX_CH | 1M | 1M |
| Color Format | RGB/YUV444/YUV422/YUV420 | RGB/YUV444/YUV422/YUV420 |
| Color Depth | 8/10bit（6bit 仅 RGB） | 8/10bit（6bit 仅 RGB） |
| Display Split Mode | Support | Support |
| HDCP | HDCP2.2/HDCP1.3 | HDCP2.2/HDCP1.3 |
| Type-C | DP Alternate Mode | DP Alternate Mode |
| I2S | Support | Support |
| SPDIF | Support | Support |
| HDR | Support | Support |

### RK3576 MST Stream 通道规格

RK3576 只有一个物理 DP 接口，MST 模式下内部支持 3 路显示数据流（Stream-0/1/2）：

| DP Stream | max width | max height | max pixel clock |
| :--- | :--- | :--- | :--- |
| Stream-0 | 4096 | 2160 | 1188MHz |
| Stream-1 | 2560 | 1440 | 300MHz |
| Stream-2 | 1920 | 1080 | 150MHz |

### MST 连接方式

- **菊花链串联**：MST 显示器串联，最后一台可为 SST 显示器
- **MST HUB 连接**：通过 MST HUB 扩展，可接 SST 或 MST 显示器

---

## 二、DP 与 VOP 连接关系

### RK3576
VOP 有 3 个 Video Port，一个 DP 控制器。MST 模式下 Stream-0/1/2 均可接收来自 VP0/1/2 的显示数据。
- SST 模式下：只能使用 Stream-0
- MST 模式下：Stream-0/1/2 都可使用

### RK3588
VOP 有 4 个 Video Port，两个 DP 控制器（DP0/DP1）。只有 VP0/1/2 可输出到 DP0/1。
不支持 MST，每个 DP 控制器仅接收一路显示数据流（Stream-0）。

---

## 三、代码路径

### U-Boot 驱动
```
drivers/video/drm/dw-dp.c
drivers/phy/phy-rockchip-usbdp.c
```

### Kernel 驱动
```
drivers/gpu/drm/rockchip/dw-dp.c
drivers/phy/rockchip/phy-rockchip-usbdp.c
```

### 参考 DTS 配置
- RK3576: `rk3576-evb1.dtsi`, `rk3576-test2.dtsi`
- RK3588: `rk3588-evb1-lp4.dtsi`, `rk3588-evb2-lp4.dtsi`, `rk3588-evb3-lp5.dtsi`

### 驱动加载日志

```bash
# RK3576
rockchip-drm display-subsystem: bound 27e40000.dp (ops ...)

# RK3588
rockchip-drm display-subsystem: bound fde50000.dp (ops dw_dp_component_ops)  // DP0
rockchip-drm display-subsystem: bound fde60000.dp (ops dw_dp_component_ops)  // DP1
```

---

## 四、功能配置

### 4.1 使能 DP

DP 和 USB3.0 共用 PHY，根据接口类型分两种配置方式：
- **DP Alt Mode（Type-C）** — 通过 PD 协商 lane 映射和 HPD
- **DP Legacy Mode** — 非 Type-C，固定 lane 配置

#### 不支持 MST 平台（RK3588）DTS 结构

```dts
dp0: dp@fde50000 {
    compatible = "rockchip,rk3588-dp";
    ...
    ports {
        port@0 {
            reg = <0>;
            dp0_in_vp0: endpoint@0 { reg = <0>; remote-endpoint = <&vp0_out_dp0>; status = "disabled"; };
            dp0_in_vp1: endpoint@1 { reg = <1>; remote-endpoint = <&vp1_out_dp0>; status = "disabled"; };
            dp0_in_vp2: endpoint@2 { reg = <2>; remote-endpoint = <&vp2_out_dp0>; status = "disabled"; };
        };
    };
};
```

#### 支持 MST 平台（RK3576）DTS 结构

```dts
dp: dp@27e40000 {
    compatible = "rockchip,rk3576-dp";
    ...
    dp0: dp0 {              // Stream-0
        ports { ... dp0_in_vp0/vp1/vp2 ... };
    };
    dp1: dp1 {              // Stream-1
        ports { ... dp1_in_vp0/vp1/vp2 ... };
    };
    dp2: dp2 {              // Stream-2
        ports { ... dp2_in_vp0/vp1/vp2 ... };
    };
};
```

:::note MST 平台注意事项
SST 模式下必须使用 DP Stream-0（dp0 节点必须使能）。dp1/dp2 按需配置。
:::

### 4.2 DP Alt Mode（Type-C）配置

#### RK3588 示例

```dts
&dp0 { status = "okay"; };
&dp0_in_vp2 { status = "okay"; };
```

#### RK3576 示例

```dts
&dp { status = "okay"; };
&dp0 { status = "okay"; };
&dp0_in_vp2 { status = "okay"; };
```

#### PHY 配置

```dts
&usbdp_phy0 {
    status = "okay";
    orientation-switch;
    svid = <0xff01>;
    sbu1-dc-gpios = <&gpio4 RK_PA6 GPIO_ACTIVE_HIGH>;
    sbu2-dc-gpios = <&gpio4 RK_PA7 GPIO_ACTIVE_HIGH>;
    port {
        ...
    };
};
```

**sbu1-dc-gpios / sbu2-dc-gpios 说明：**
- Type-C 的 SBU1/SBU2 与 DP 的 AUX_CH 复用
- 正插：AUX_CH_P → SBU1，AUX_CH_N → SBU2
- 反插：AUX_CH_P → SBU2，AUX_CH_N → SBU1
- AUX_CH_P 需要下拉，AUX_CH_N 需要上拉
- 两个 GPIO 分别控制 SBU1/SBU2 的上下拉状态，驱动根据正反插状态自动调整

**svid：** DP 固定值 `0xff01`

#### PD 芯片配置（fusb302 示例）

```dts
&i2c2 {
    usbc0: fusb302@22 {
        compatible = "fcs,fusb302";
        reg = <0x22>;
        ...
        usb_con: connector {
            compatible = "usb-c-connector";
            ...
            altmodes {
                altmode@0 {
                    reg = <0>;
                    svid = <0xff01>;
                    vdo = <0xffffffff>;
                };
            };
        };
    };
};
```

### 4.3 DP Legacy Mode

非 Type-C 接口，固定 lane 配置。

### 4.4 DP 接 Panel 外设

### 4.5 DP 开机 Logo

### 4.6 DP connector-split mode

### 4.7 HDR

### 4.8 HDCP

支持 HDCP 1.3 和 HDCP 2.2 内容保护。

---

## 五、常用 Debug 方法

### 5.1 查看 connector 状态

```bash
cat /sys/kernel/debug/dri/0/summary
```

### 5.2 强制使能/禁用 DP

```bash
# 强制使能
echo on > /sys/class/drm/cardX-DP-X/status
# 强制禁用
echo off > /sys/class/drm/cardX-DP-X/status
```

### 5.3 DPCD 读写

```bash
# 读 DPCD
cat /sys/kernel/debug/dri/0/dp_dpcd
# 或直接通过 debugfs 操作
```

### 5.4 Type-C 接口 Debug

- 检查 PD 协商状态
- 检查 orientation switch 状态
- 检查 SBU GPIO 电平

### 5.5 查看 DP 寄存器

```bash
cat /sys/kernel/debug/dri/0/dp_regs
```

### 5.6 查看 VOP 状态

```bash
cat /sys/kernel/debug/dri/0/summary
```

### 5.7 查看当前显示时钟

```bash
cat /sys/kernel/debug/clk/clk_summary | grep dclk
```

### 5.8 调整 DRM log 等级

```bash
echo 0x1f > /sys/module/drm/parameters/debug
```

### 5.9 DP MST 信息

#### 5.9.1 MST Port Info
#### 5.9.2 Atomic state info
#### 5.9.3 DPCD Info
#### 5.9.4 Connector Path Info

---

## 六、带宽计算

### 6.1 SST 模式带宽计算

**有效数据带宽：**
```
带宽 = Link速率 × Lane数量 × 0.8 (8b/10b 编码)
```

**像素比特率：**
```
比特率 = 像素时钟 × bpp
```

有效带宽需大于像素比特率。

### 6.2 MST 模式带宽计算

MST 模式下总带宽需满足所有 Stream 带宽之和。

---

## 七、FAQ

### 7.1 插入 DP 无显示或显示异常

#### 7.1.1 DP Link Training 成功

- 检查 VOP 状态是否正常
- 检查像素时钟是否正确
- 检查 color format 和 color depth 是否匹配

#### 7.1.2 DP connected 但无显示

- 检查 EDID 是否读取成功
- 检查 timing 是否支持
- 检查带宽是否足够

#### 7.1.3 DP disconnected

- 检查 HPD 信号
- 检查 AUX_CH 通信
- 检查供电是否正常

### 7.2 Type-C 接口连接异常

- 检查 PD 芯片驱动是否加载
- 检查 CC 引脚连接
- 检查正反插检测是否正常
- 检查 lane 映射是否正确

### 7.3 AUX_CH 异常

#### 7.3.1 aux16m clk 值异常
#### 7.3.2 phy power on/off 流程异常
#### 7.3.3 DP dual mode 转接线导致异常
#### 7.3.4 信号干扰导致异常
#### 7.3.5 硬件异常

### 7.4 4K 120Hz 输出配置

RK3576 支持 4K@120Hz，需确保：
- lane 数和速率足够（4 lanes × 8.1Gbps）
- VOP VP 支持对应像素时钟
- 显示器支持对应分辨率和刷新率

### 7.5 DP timing 限制

### 7.6 MST 模式使用限制

#### 7.6.1 能力限制
- RK3576 最多 3 路 Stream
- 各 Stream 有各自的最大分辨率和像素时钟限制

#### 7.6.2 分辨率过滤

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_DisplayPort_CN.pdf` V1.2.0
- 《Rockchip_Developer_Guide_DRM_Display_Driver_CN.pdf》
- 《Rockchip_RK3588_Developer_Guide_DisplayPort_CN.pdf》V1.0.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
