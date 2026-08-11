---
sidebar_position: 1
---

# FLEXBUS 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_FLEXBUS_CN.pdf`（V1.0.0, 2024-06-11）整理，介绍 Rockchip FLEXBUS 模块的总体架构和基础配置方法。

:::info 适用范围
- **芯片平台**：RK3576
- **内核版本**：Linux 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、FLEXBUS 概述

FLEXBUS（Flexible Bus，灵活总线）模块分为 **FLEXBUS0** 和 **FLEXBUS1** 两部分：

| 模块 | 方向 | 支持模式 |
| :--- | :--- | :--- |
| **FLEXBUS0** | TX（发送），部分模式支持 TX then RX | 1. 高速并行 DAC<br/>2. 模拟 SPI（Single/Quad SPI，外接 SPI Flash、QSPI 屏） |
| **FLEXBUS1** | RX（接收） | 1. 高速并行 ADC<br/>2. DVP |

**硬件资源：**
- FLEXBUS0 和 FLEXBUS1 各有：1 根 CLK、1 根 CSn、16 根 data 线
- 实际可用引脚数取决于具体平台和 IOMUX 配置
- FLEXBUS0、FLEXBUS1 分别只能对接一个外设
- 可以同时使用两者，也可以只使用其中一个

---

## 二、FLEXBUS 的使用

### 2.1 内核配置

```
Device Drivers ->
  Multifunction device drivers ->
    Rockchip Flexbus
```

### 2.2 dtsi 配置

#### 控制器节点（rk3576.dtsi）

```dts
flexbus: flexbus@2a2f0000 {
    compatible = "rockchip,rk3576-flexbus";
    reg = <0x0 0x2a2f0000 0x0 0x200>;
    interrupts = <GIC_SPI 369 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&cru CLK_HSGPIO_TX>,
             <&cru CLK_HSGPIO_RX>,
             <&cru ACLK_HSGPIO>,
             <&cru HCLK_HSGPIO>;
    clock-names = "tx_clk_flexbus", "rx_clk_flexbus",
                  "aclk_flexbus", "hclk_flexbus";
    rockchip,grf = <&ioc_grf>;     // FLEXBUS 需要配置 GRF
    status = "disabled";

    flexbus_adc: adc {
        ...
    };

    flexbus_dac: dac {
        ...
    };
};
```

#### 板级配置（以 FLEXBUS0=DAC、FLEXBUS1=ADC 为例）

```dts
&flexbus {
    rockchip,flexbus0-opmode = <ROCKCHIP_FLEXBUS0_OPMODE_DAC>;  // DAC 模式
    rockchip,flexbus1-opmode = <ROCKCHIP_FLEXBUS1_OPMODE_ADC>;  // ADC 模式
    status = "okay";
};

&flexbus_adc {
    pinctrl-names = "default";
    pinctrl-0 = <&flexbus1m4_csn &flexbus1_clk
                 &flexbus1_d0 &flexbus1_d1 &flexbus1_d2 &flexbus1_d3
                 &flexbus1_d4 &flexbus1_d5 &flexbus1_d6 &flexbus1_d7
                 &flexbus1_d8 &flexbus1_d9 &flexbus1_d10 &flexbus1_d11
                 &flexbus1m1_d12 &flexbus1m1_d13 &flexbus1m1_d14 &flexbus1m1_d15>;
    status = "okay";
};

&flexbus_dac {
    pinctrl-names = "default";
    pinctrl-0 = <&flexbus0m4_csn &flexbus0_clk
                 &flexbus0_d0 &flexbus0_d1 &flexbus0_d2 &flexbus0_d3
                 &flexbus0_d4 &flexbus0_d5 &flexbus0_d6 &flexbus0_d7
                 &flexbus0_d8 &flexbus0_d9 &flexbus0_d10 &flexbus0_d11
                 &flexbus0_d12 &flexbus0m0_d13 &flexbus0m0_d14 &flexbus0m0_d15>;
    status = "okay";
};
```

**模式配置说明：**
- `rockchip,flexbus0-opmode` — FLEXBUS0 工作模式
- `rockchip,flexbus1-opmode` — FLEXBUS1 工作模式
- 模式定义在 `include/dt-bindings/mfd/rockchip-flexbus.h`
- 未使用的配置为 `ROCKCHIP_FLEXBUS0_OPMODE_NULL` 或 `ROCKCHIP_FLEXBUS1_OPMODE_NULL`

### 2.3 驱动文件

| 文件路径 | 说明 |
| :--- | :--- |
| `drivers/mfd/rockchip-flexbus.c` | 核心驱动（寄存器读写、初始化等基本操作） |

各模式的具体代码位于对应的子系统框架中：
- ADC 模式 → `drivers/iio/adc/rockchip-flexbus-adc.c`
- DAC 模式 → 对应 DAC 驱动
- FSPI 模式 → `drivers/spi/spi-rockchip-flexbus-fspi.c`

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_FLEXBUS_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_Linux_FLEXBUS_ADC_and_DAC_MODE_CN.pdf》
- 《Rockchip_Developer_Guide_Linux_FLEXBUS_FSPI_MODE_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
