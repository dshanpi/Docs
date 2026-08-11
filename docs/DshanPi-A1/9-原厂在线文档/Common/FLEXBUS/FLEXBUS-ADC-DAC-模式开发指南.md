---
sidebar_position: 2
---

# FLEXBUS ADC 和 DAC 模式开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_FLEXBUS_ADC_and_DAC_MODE_CN.pdf`（V1.0.0, 2024-06-11）整理，介绍 Rockchip FLEXBUS ADC 和 DAC 模式的配置与使用方法。

:::info 适用范围
- **芯片平台**：RK3576
- **内核版本**：Linux 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、FLEXBUS ADC 模式

### 1.1 概述

FLEXBUS ADC 模式指的是 **FLEXBUS1 对接高速并行 ADC 器件**，例如：
- TI ADS6144（14bit ADC）
- ADI LTC2207（16bit ADC）

支持 SPI、I2C 等接口类型的 ADC 器件。

**关键特性：**
- 时钟频率最高 **100MHz**
- 分辨率最高 **16-Bit**

### 1.2 配置

#### 1.2.1 硬件配置

- **数据线连接**：ADC 器件的 LSB 必须连接到 FLEXBUS1_D0
  - 10-Bit ADC → FLEXBUS1_D[9:0]
  - 16-Bit ADC → FLEXBUS1_D[15:0]
- **时钟模式**：
  - **Slave 模式**：ADC 器件向 FLEXBUS1 提供 CLK
  - **Master 模式**：FLEXBUS1 向 ADC 器件提供 CLK

#### 1.2.2 内核配置

FLEXBUS ADC 模式依赖 IIO/ADC 框架：

```
Device Drivers ->
  Multifunction device drivers ->
    Rockchip Flexbus
Device Drivers ->
  Industrial I/O support ->
    Analog to digital converters ->
      Rockchip Flexbus ADC opmode driver
```

#### 1.2.3 dtsi 配置

**控制器节点：**

```dts
flexbus: flexbus@2a2f0000 {
    ...
    flexbus_adc: adc {
        compatible = "rockchip,flexbus-adc";
        #io-channel-cells = <0>;
        rockchip,slave-mode;        // slave 模式（不配置则为 master）
        rockchip,free-sclk;         // 时钟保持输出（仅 master 有效）
        rockchip,auto-pad;          // 默认配置
        rockchip,cpol;              // CPOL = 1（不配置则为 0）
        rockchip,cpha;              // CPHA = 1（不配置则为 0）
        rockchip,dfs = <16>;        // 数据位宽：4 / 8 / 16
        status = "disabled";
    };
};
```

**属性说明：**

| 属性 | 说明 |
| :--- | :--- |
| `rockchip,slave-mode` | 配置了为 slave 模式（器件提供时钟）；不配置为 master 模式 |
| `rockchip,free-sclk` | 时钟一直保持输出（仅 master 模式有效）；不配置则只在数据传输时输出 |
| `rockchip,cpol` / `rockchip,cpha` | 与 SPI 协议定义相同，对照器件时序图配置 |
| `rockchip,dfs` | 数据位宽，仅支持 4、8、16。不是这些值时向上取整（如 14bit 配 16） |

**板级配置：**

```dts
&flexbus {
    rockchip,flexbus1-opmode = <ROCKCHIP_FLEXBUS1_OPMODE_ADC>;
    status = "okay";
};

&flexbus_adc {
    pinctrl-names = "default";
    pinctrl-0 = <&flexbus1m4_csn &flexbus1_clk
                 &flexbus1_d0 ... &flexbus1_d15>;
    status = "okay";
};
```

#### 1.2.4 驱动文件

**驱动路径：** `drivers/iio/adc/rockchip-flexbus-adc.c`

**核心读取流程（`rockchip_flexbus_adc_read_block`）：**
1. 配置 RX 数据数量（单位 dfs）
2. 配置目标 buffer 物理地址
3. 配置目标 buffer 长度
4. 使能 RX 传输
5. 等待传输完成（中断方式，超时处理）
6. 关闭 RX 传输

**中断处理函数：** `rockchip_flexbus_adc_isr()`

### 1.3 常用接口

#### 1.3.1 确认 FLEXBUS ADC 对应的 device

```bash
cat /sys/bus/iio/devices/iio\:device0/name
# 输出：2a2f0000.flexbus:adc
```

#### 1.3.2 获取 ADC 值

```bash
cd /sys/bus/iio/devices/iio\:device0
cat in_voltage_raw
# 输出：33004
```

#### 1.3.3 获取和修改时钟频率

```bash
# 获取时钟频率
cat in_voltage_sampling_frequency
# 输出：99000000  (99MHz)

# 修改时钟频率
echo 25000000 > in_voltage_sampling_frequency
```

---

## 二、FLEXBUS DAC 模式

### 2.1 概述

FLEXBUS DAC 模式指的是 **FLEXBUS0 对接高速并行 DAC 器件**，用于数模转换输出。

**关键特性：**
- 时钟频率最高 **100MHz**
- 数据位宽最高 **16-Bit**

### 2.2 配置

#### 2.2.1 硬件配置

- 数据线：DAC 器件的 LSB 连接到 FLEXBUS0_D0
- 支持 Master/Slave 时钟模式

#### 2.2.2 内核配置

```
Device Drivers ->
  Multifunction device drivers ->
    Rockchip Flexbus
```

DAC 模式由对应的 DAC 驱动框架实现。

#### 2.2.3 dtsi 配置

```dts
flexbus_dac: dac {
    compatible = "rockchip,flexbus-dac";
    rockchip,slave-mode;        // 可选
    rockchip,cpol;              // 可选
    rockchip,cpha;              // 可选
    rockchip,dfs = <16>;        // 数据位宽
    status = "disabled";
};
```

板级配置与 ADC 类似，配置 pinctrl 和 status。

#### 2.2.4 驱动文件

DAC 模式驱动位于对应 DAC 框架中。

### 2.3 常用接口

#### 2.3.1 确认 FLEXBUS DAC 对应的 device

通过 sysfs 或 /dev 下的设备节点确认。

#### 2.3.2 向 DAC 发送数据

通过对应设备驱动的 write 接口发送数据。

#### 2.3.3 获取和修改时钟频率

通过 sysfs 或设备驱动接口配置时钟频率。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_FLEXBUS_ADC_and_DAC_MODE_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_Linux_FLEXBUS_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
