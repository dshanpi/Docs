---
sidebar_position: 18
---

# RK628 DRM 移植指南

本文档基于瑞芯微官方文档 `Rockchip_DRM_RK628_Porting_Guide_CN.pdf`（V1.7.0, 2021-05-31）整理，介绍 RK628 显示转换芯片在 DRM 框架下的移植与调试方法。

:::info 适用范围
- **芯片型号**：RK628D
- **驱动框架**：Linux DRM 框架（`drivers/gpu/drm/rockchip/rk628/`）
- **读者对象**：技术支持工程师、软件开发工程师
:::

:::note 说明
本文档描述的是基于 RK 平台 DRM 框架的 RK628 驱动。对于跨平台通用版本，请参考《RK628 显示转换芯片开发指南》（For-All 版本）。
:::

---

## 一、简介

RK628 是 Rockchip 的多功能显示转换芯片，支持多种视频输入输出格式转换。本文档描述其在 DRM 框架下的软件配置方法与调试手段。

**内核配置：**
```
CONFIG_MFD_RK628=y
CONFIG_DRM_ROCKCHIP_RK628=y
CONFIG_VIDEO_RK628CSI=y
```

**驱动文件：**
```
drivers/mfd/rk628.c
drivers/clk/rockchip/regmap/clk-rk628.c
drivers/pinctrl/pinctrl-rk628.c
drivers/gpu/drm/rockchip/rk628/*
drivers/media/i2c/rk628_csi.c
```

**参考设备树：**
```
arch/arm/boot/dts/rk3288-evb-rk628.dtsi
arch/arm/boot/dts/rk3288-evb-rk628-rgb2dsi-avb.dts
arch/arm/boot/dts/rk3288-evb-rk628-rgb2lvds-avb.dts
arch/arm/boot/dts/rk3288-evb-rk628-hdmi2csi-avb.dts
...
```

---

## 二、Core 配置

### 2.1 DTS 核心配置

`rk628.dtsi` 包含 RK628 相关模块的基础配置，一般不需要更改，只需在板级 dts 中 include。

板级 DTS 示例：
```dts
&i2c1 {
    clock-frequency = <400000>;
    status = "okay";

    rk628: rk628@50 {
        reg = <0x50>;
        interrupt-parent = <&gpio7>;
        interrupts = <15 IRQ_TYPE_LEVEL_HIGH>;
        enable-gpios = <&gpio5 RK_PC2 GPIO_ACTIVE_HIGH>;
        reset-gpios = <&gpio7 RK_PB6 GPIO_ACTIVE_LOW>;
        status = "okay";
    };
};
```

---

## 三、输入模块

### 3.1 RGB 输入

```dts
&rgb {
    status = "okay";
    ports {
        port@1 {
            reg = <1>;
            rgb_out_post_process: endpoint {
                remote-endpoint = <&post_process_in_rgb>;
            };
        };
    };
};
```

### 3.2 BT1120 输入

参考配置文件：`rk3568-evb6-ddr3-v10-rk628-bt1120-to-hdmi.dts`

```dts
&rgb {
    status = "okay";
    pinctrl-names = "default";
    pinctrl-0 = <&bt1120_pins>;
    ports {
        port@1 {
            reg = <1>;
            rgb_out_bt1120: endpoint {
                remote-endpoint = <&bt1120_in_rgb>;
            };
        };
    };
};
```

### 3.3 HDMI RX

#### 3.3.1 HDMI RX 板级直连模式
#### 3.3.2 HDMI RX 线缆连接模式
#### 3.3.3 HDMI RX AUDIO

---

## 四、输出模块

### 4.1 Post-Process（后处理）

#### 4.1.1 Scaler

RK628 内置 Scaler，支持图像缩放。

#### 4.1.2 极性配置

支持行场同步信号极性调整。

### 4.2 LVDS 输出

#### 4.2.1 RGB2LVDS

##### Single LVDS（单通道）
##### Dual LVDS（双通道）

#### 4.2.2 HDMI2LVDS

##### Single LVDS
##### Dual LVDS

### 4.3 DSI 输出

#### 4.3.1 RGB2DSI

##### Single DSI（单 DSI）
##### Dual DSI（双 DSI）

#### 4.3.2 HDMI2DSI

##### Single DSI

### 4.4 HDMI TX

#### 4.4.1 RGB2HDMI
#### 4.4.2 BT1120 → HDMI
#### 4.4.3 HDMI TX Audio

### 4.5 GVI 输出

#### 4.5.1 GVI 说明
GVI（General Video Interface）是 Rockchip 定义的通用视频接口。

#### 4.5.2 配置说明

### 4.6 MIPI CSI

#### 4.6.1 DTS 配置
#### 4.6.2 注意事项

---

## 五、DEBUG

### 5.1 I2C 通信异常

- 检查 I2C 地址和引脚配置
- 测量 I2C 信号波形
- 确认 RK628 供电和复位正常

### 5.2 RK628 PLL 锁定异常

- 检查输入时钟频率
- 确认 PLL 配置参数正确

### 5.3 寄存器读写

```bash
# 通过 regmap 访问寄存器
cat /sys/bus/i2c/devices/0-0050/regmap
```

### 5.4 输入输出信息

```bash
# 查看 DRM 状态
cat /d/dri/0/summary

# 查看时钟树
cat /d/clk/clk_summary
```

### 5.5 主副屏属性配置

### 5.6 自测模式

RK628 支持多种自测模式，可输出测试彩条：

- HDMITX color bar
- DSI color bar
- GVI color bar

### 5.7 行场解析

#### rk628_bt1120_rx

BT.1120 输入的行场信号解析调试。

---

## 参考资料

- 原始文档：`Rockchip_DRM_RK628_Porting_Guide_CN.pdf` V1.7.0
- 《Rockchip_Developer_Guide_RK628_For_All_Porting_CN.pdf》V2.6（推荐使用 For-All 版本）
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
