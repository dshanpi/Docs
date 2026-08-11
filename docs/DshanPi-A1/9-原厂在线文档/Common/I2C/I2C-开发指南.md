---
sidebar_position: 1
---

# I2C 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_I2C_CN.pdf`（V2.2.0, 2021-12-29）整理，介绍 Rockchip 系列芯片 I2C 总线的使用方法和常见问题排查。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：所有版本
- **读者对象**：技术支持工程师、软件开发工程师
:::

Rockchip I2C 控制器兼容 I2C 与 SMBus 总线，仅支持主模式，软件可编程时钟频率最高可达 400kbps（部分芯片高达 1000kbps），支持 7 位和 10 位寻址模式。

---

## I2C 硬件连接

I2C 总线通过串行数据（SDA）线和串行时钟（SCL）线在连接到总线的器件间传递信息。每个器件都有唯一的地址识别，都可以作为发送器或接收器。

I2C 总线的硬件连接需要**上拉电阻**，改变上拉电阻大小可调节 I2C 总线的上拉强度。

---

## I2C 驱动说明

Rockchip I2C 在不同芯片、不同内核版本上的驱动不一样：

| 驱动文件 | 适用内核版本 |
| :--- | :--- |
| `i2c-rk3x.c` | Linux 4.4 及以上（主流驱动） |
| `i2c-rockchip.c` | Linux 3.10 内核 |

I2C 可以跑的最高频率一般为 1000K。

---

## I2C 传输流程

I2C 的流程在两个驱动上大致相同：

- **写操作**：单纯的 TX 模式（`I2C_CON[1:0] = 2'b00`）
- **读操作**：一般使用 TRX 混合模式（`I2C_CON[1:0] = 2'b01`）

I2C 控制器支持三种传输模式：

| 模式 | I2C_CON[1:0] | 说明 |
| :--- | :--- | :--- |
| Transmit only mode | 2'b00 | 纯发送模式 |
| Mix mode | 2'b01 或 2'b11 | 混合模式（先写后读） |
| Receive only mode | 2'b10 | 纯接收模式 |

详细实现请参考驱动代码。

---

## I2C 驱动参数配置

I2C 频率配置是最主要的参数。可配置的 I2C 频率除了与芯片有关外，主要由 **I2C SCL 上升沿时间**决定。I2C 协议标准对上升沿和下降沿时间有规定要求，特别是上升沿时间，如果超过了协议规定的最大值，则 I2C 通讯可能失败。

:::tip 测量方法
上升沿 Tr 和下降沿 Tf 需要用示波器测量。
:::

### i2c-rk3x.c 配置（DTS 配置）

配置都在设备树中，参考文档：`Documentation/devicetree/bindings/i2c/i2c-rk3x.txt`

**主要配置项**：

| 参数 | 说明 |
| :--- | :--- |
| `clock-frequency` | I2C 频率，默认 100k。最大可配置频率由 `i2c-scl-rising-time-ns` 决定。例如配置 400k：`&lt;400000&gt;` |
| `i2c-scl-rising-time-ns` | SCL 上升沿时间（ns），由硬件决定，改变上拉电阻可调节。需通过示波器测量。默认可不配置 |
| `i2c-scl-falling-time-ns` | SCL 下降沿时间（ns），一般不变。默认可不配置 |

**DTS 配置示例**：

```dts
&i2c1 {
    status = "okay";
    i2c-scl-rising-time-ns = <265>;
    i2c-scl-falling-time-ns = <11>;
    clock-frequency = <400000>;

    es8316: es8316@10 {
        #sound-dai-cells = <0>;
        compatible = "everest,es8316";
        reg = <0x10>;
        clocks = <&cru SCLK_I2S_8CH_OUT>;
        clock-names = "mclk";
        spk-con-gpio = <&gpio0 11 GPIO_ACTIVE_HIGH>;
        hp-det-gpio = <&gpio4 28 GPIO_ACTIVE_LOW>;
    };
};
```

### i2c-rockchip.c 配置（代码配置）

`i2c-rockchip.c` 驱动（kernel 3.10）的 I2C 频率在代码中配置，通过 `i2c_msg` 结构体的 `scl_rate` 成员设置，默认频率为 100k。

**示例**：

```c
struct i2c_msg xfer_msg;
xfer_msg[0].addr = client->addr;
xfer_msg[0].len = num;
xfer_msg[0].flags = client->flags;
xfer_msg[0].buf = buf;
xfer_msg[0].scl_rate = 200 * 1000;  /* 200K i2c clock frequency */
```

---

## I2C 使用

### 内核空间（Kernel space）

Rockchip I2C 的读写通信使用 Linux 标准接口，请参考内核文档：
`Documentation/i2c/writing-clients`（Sending and receiving 部分）

### 用户空间（User space）

可以通过 `/dev/i2c-%d` 接口从用户态访问 I2C 总线上的设备。详细说明请参考内核文档：
`Documentation/i2c/dev-interface`

---

## I2C Tools

`i2c-tools` 是一个开源工具，需自行下载并交叉编译。

**下载地址**：
- https://www.kernel.org/pub/software/utils/i2c-tools/
- `git clone git://git.kernel.org/pub/scm/utils/i2c-tools/i2c-tools.git`

编译后生成的工具：

| 工具 | 功能 |
| :--- | :--- |
| `i2cdetect` | 列举 I2C bus 和上面的所有设备 |
| `i2cdump` | 显示 I2C 设备所有寄存器的值 |
| `i2cget` | 读取 I2C 设备某个寄存器的值 |
| `i2cset` | 写入 I2C 设备某个寄存器的值 |

使用方法请参考工具的 README 与帮助说明。

---

## GPIO 模拟 I2C

内核已实现 GPIO 模拟 I2C 功能，参考文档：
`Documentation/devicetree/bindings/i2c/i2c-gpio.txt`

**DTS 配置示例**：

```dts
i2c@4 {
    compatible = "i2c-gpio";
    gpios = <&gpio5 9 GPIO_ACTIVE_HIGH>,  /* sda */
            <&gpio5 8 GPIO_ACTIVE_HIGH>;  /* scl */
    i2c-gpio,delay-us = <2>;              /* ~100 kHz */
    #address-cells = <1>;
    #size-cells = <0>;
    pinctrl-names = "default";
    pinctrl-0 = <&i2c4_gpio>;
    status = "okay";

    gt9xx: gt9xx@14 {
        compatible = "goodix,gt9xx";
        reg = <0x14>;
        touch-gpio = <&gpio5 11 IRQ_TYPE_LEVEL_LOW>;
        reset-gpio = <&gpio5 10 GPIO_ACTIVE_HIGH>;
        max-x = <1200>;
        max-y = <1900>;
        tp-size = <911>;
        tp-supply = <&vcc_tp>;
        status = "okay";
    };
};
```

:::caution 注意
一般不推荐使用 GPIO 模拟 I2C，效率不高。
:::

---

## I2C 常见问题

### i2c-rk3x.c 驱动

#### NACK 错误（返回值 -6 / -ENXIO）

调用 I2C 传输接口返回 `-ENXIO` 时，表示 NACK 错误（对方设备无应答响应）。常见原因：

- I2C 地址错误
- I2C slave 设备处于不正常工作状态（未上电、上电时序错误、设备异常等）
- I2C 时序不符合 slave 设备要求（例如 slave 需要 stop 信号而非 repeat start 信号）
- I2C 总线受外部干扰（可用示波器测量波形确认）

#### "timeout, ipd: 0x00, state: 1"

I2C 控制器工作异常，无法产生中断状态，start 时序无法发出。可能原因：

- I2C SCL 或 SDA 引脚 iomux 配置错误
- I2C 上拉电压不对（电压不够或上拉电源未开启）
- I2C 引脚被外设拉住，电压不对
- I2C 时钟未开启，或时钟源太小
- I2C 同时配置了 `CON_START` 和 `CON_STOP` 位

#### "timeout, ipd: 0x10, state: 1"

I2C 控制器工作正常，但 CPU 无法响应 I2C 中断。可能原因：

- CPU0 被阻塞（I2C 中断一般在 CPU0 上，可通过 `cat /proc/interrupts` 查看）
- I2C 中断位被关闭

#### "timeout, ipd: 0x80, state: 1"

SCL 被 slave 拉住。判断是哪个 slave 拉住的方法：

1. **排除法**：适用于外设不多、复现概率高的情况
2. **串电阻法**：在 SCL 总线上串入电阻，通过电阻两端压差判断。电压更低的那端外设就是拉低的 slave。电阻选取以上拉电阻的 1/20 以上为宜。可配合示波器抓取波形分析

**SDA 被拉低**的判断方法同上。

### i2c-rockchip.c 驱动

#### NACK 错误（返回值 -11 / -EAGAIN）

与 `i2c-rk3x.c` 驱动的 NACK 错误原因相同：

- I2C 地址错误
- I2C slave 设备工作不正常
- I2C 时序不符合要求
- I2C 总线受外部干扰

#### "timeout, ipd: 0x00 / 0x10 / 0x80"

与 `i2c-rk3x.c` 驱动同类错误的排查方法相同。ipd 为 0x80 时，也可能看到 "scl was hold by slave" 的打印。

#### "i2c is not in idle(state = ×)"

表示 I2C 总线至少一根线为低：

| state 值 | 含义 |
| :--- | :--- |
| state = 1 | SDA 为低 |
| state = 2 | SCL 为低 |
| state = 3 | SCL 和 SDA 都为低 |

解决方法参考上文 SCL/SDA 被拉低的排查方法。

### Debug：抓取 I2C 波形

如果以上情况都不是，最好的办法是**抓取 I2C 出错时的波形**，通过波形分析问题。大部分 I2C 问题都能通过波形分析出来。

方法：在出错的地方让 CPU 卡住（例如 `while(1)` 循环），不发起新的 I2C 任务，最后抓到的波形就是出错的波形。如果需要过滤，可以加入设备 I2C 地址的判断条件。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_I2C_CN.pdf` V2.2.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
