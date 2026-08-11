---
sidebar_position: 3
---

# FLEXBUS FSPI 模式开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_FLEXBUS_FSPI_MODE_CN.pdf`（V1.0.0, 2024-08-12）整理，介绍 Rockchip FLEXBUS FSPI（Flexible SPI）模式的配置与使用方法。

:::info 适用范围
- **芯片平台**：所有支持 FLEXBUS 模块的芯片
- **内核版本**：Linux 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、FLEXBUS FSPI 模式

### 1.1 概述

FLEXBUS FSPI 模式指通过 FLEXBUS 模拟 RK FSPI（Flexible Serial Peripheral Interface）来实现 SPI 功能。

**典型应用：**
- Single line output / Quad line input
- 满足 Linux MTD Quad SPI Flash 驱动的典型配置
- 外接 SPI Flash、QSPI 屏等 SPI 设备

**关键特性：**
- 时钟频率最高 **100MHz**
- 支持 SPI Nor/Nand Flash
- 基于标准 SPI 框架（spi-mem 结构）

### 1.2 配置

#### 1.2.1 内核配置

FLEXBUS FSPI 模式为标准 SPI 框架驱动实现，仅实现 spi-mem 结构：

```
CONFIG_SPI=y
CONFIG_SPI_ROCKCHIP_FLEXBUS_FSPI=y
```

#### 1.2.2 dts 配置

以外接 SPI Nor Flash 为例：

```dts
&flexbus {
    rockchip,flexbus0-opmode = <ROCKCHIP_FLEXBUS0_OPMODE_SPI>;
    rockchip,flexbus1-opmode = <ROCKCHIP_FLEXBUS1_OPMODE_NULL>;
    status = "okay";
};

&flexbus_fspi {
    pinctrl-names = "default";
    pinctrl-0 = <&flexbus0m1_pins
                 &flexbus0_clk_pins
                 &flexbus0_d0_pins
                 &flexbus0_d1_pins
                 &flexbus0_d2_pins
                 &flexbus0_d3_pins>;
    status = "okay";

    flash@0 {
        compatible = "jedec,spi-nor";
        reg = <0>;
        spi-max-frequency = <100000000>;
        spi-rx-bus-width = <4>;     // Quad RX
        spi-tx-bus-width = <1>;     // Single TX
    };
};
```

**说明：**
- `mode_bits` 支持 `SPI_RX_QUAD`，可配置 `spi-rx-bus-width = &lt;4&gt;`
- 默认配置为 **SPI mode 0**、**MSB mode**
- 相关参数 DTS 不可调，如需进一步开发请参考控制器手册

#### 1.2.3 驱动文件

| 文件路径 | 说明 |
| :--- | :--- |
| `drivers/spi/spi-rockchip-flexbus-fspi.c` | FLEXBUS FSPI 模式驱动 |

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_FLEXBUS_FSPI_MODE_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_Linux_FLEXBUS_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
