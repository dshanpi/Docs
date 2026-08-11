---
sidebar_position: 2
---

# CAN FD 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_CAN_FD_CN.pdf`（V1.2.0, 2024-07-22）整理，介绍 Rockchip RK3576 / RK3506 系列芯片 CAN FD 总线的驱动配置、使用方法和常见问题排查。

:::info 适用范围
| 芯片平台 | 内核版本 |
| :--- | :--- |
| RK3576 | Linux 6.1 |
| RK3506 | Linux 6.1 |

**读者对象**：技术支持工程师、软件开发工程师
:::

---

## CAN FD 驱动

### 驱动文件

驱动文件位置：

```
drivers/net/can/rockchip/rk3576_canfd.c
```

### DTS 节点配置

**主要参数说明**：

| 参数 | 说明 |
| :--- | :--- |
| `interrupts` | 中断配置，转换完成后产生中断信号 |
| `clocks` / `clock-names` | 时钟源：`baudclk`（波特率时钟）和 `apb_pclk`（总线时钟） |
| `resets` / `reset-names` | 复位信号：`can` 和 `can-apb`，用于每次复位总线 |
| `assigned-clocks` / `assigned-clock-rates` | 时钟频率配置 |
| `pinctrl` | 引脚复用配置 |
| `rockchip,rx-max-data` | RX 接收最大数据字节数配置 |
| `dmas` / `dma-names` | DMA 配置（RX 方向） |

**完整 DTS 配置示例**：

```dts
&can0 {
    assigned-clocks = <&cru CLK_CAN0>;
    assigned-clock-rates = <200000000>;
    pinctrl-names = "default";
    pinctrl-0 = <&can0m0_pins>;
    status = "okay";
};
```

#### RX FIFO 深度配置

`rockchip,rx-max-data` 可配置 RX 接收字节数，影响 RX FIFO 深度：

| 配置值 | RX byte 支持 | RX FIFO 深度 | 适用场景 |
| :--- | :--- | :--- | :--- |
| `&lt;4&gt;` | 8 bytes | 64 帧 | 仅 CAN 帧 |
| `&lt;18&gt;` | 64 bytes | 14 帧 | CAN FD 帧 |

```dts
&can0 {
    rockchip,rx-max-data = <4>;
};
```

#### DMA 配置

RX 支持 DMA 功能，不需要 DMA 可以删除该属性：

```dts
&can0 {
    dmas = <&dmac0 20>;
    dma-names = "rx";
};
```

### 内核配置

```
CONFIG_CAN=y
CONFIG_CANFD_RK3576=y
```

---

## CAN FD 通信测试工具

`canutils` 是常用的 CAN 通信测试工具包，包含 5 个独立程序：

| 工具 | 功能 |
| :--- | :--- |
| `canconfig` | 配置 CAN 总线接口参数（波特率、模式等） |
| `candump` | 从 CAN 总线接收数据并以十六进制打印，可输出到文件 |
| `canecho` | 把接收到的所有数据重新发送回总线 |
| `cansend` | 往指定接口发送指定数据 |
| `cansequence` | 自动重复递增数字发送/接收校验 |

`ip` 命令（iproute2 版本）用于配置 CAN 波特率和功能。

:::caution 注意
busybox 里的 ip 工具是阉割版本，不支持 CAN FD 操作。请使用完整的 iproute2 版本。
:::

**Buildroot 开启配置**：

```
BR2_PACKAGE_CAN_UTILS=y
BR2_PACKAGE_IPROUTE2=y
```

---

## CAN FD 常用命令

### 查询网络设备

```bash
ifconfig -a
```

### 启动 CAN FD

```bash
# 关闭 CAN
ip link set can0 down

# 设置仲裁段 1M 波特率，数据段 3M 波特率
ip link set can0 type can bitrate 1000000 dbitrate 3000000 fd on

# 打印 can0 详细信息
ip -details link show can0

# 启动 CAN
ip link set can0 up
```

### CAN FD 发送

```bash
# 标准帧 + 数据帧，ID: 123，数据: DEADBEEF
cansend can0 123##1DEADBEEF

# 扩展帧 + 数据帧，ID: 00000123，数据: DEADBEEF
cansend can0 00000123##1DEADBEEF
```

### CAN FD 接收

```bash
# 开启打印，等待接收
candump can0 &
```

### 完整配置示例

```bash
ip link set can0 down
ip link set can0 type can bitrate 500000 sample-point 0.8 dbitrate 2000000 sample-point 0.8 fd on
ip -details -statistics link show can0
ip link set can0 up
echo 4096 > /sys/class/net/can0/tx_queue_len
candump can0 &
```

### cangen 测试命令汇总

**CAN 经典帧**：

```bash
# 扩展帧
cangen can0 -g 1 -e -I i -L i -D r

# 标准帧
cangen can0 -g 1 -I i -L i -D r

# 远程帧 标准帧
cangen can0 -g 1 -R -I i -L i -D r

# 远程帧 扩展帧
cangen can0 -g 1 -e -R -I i -L i -D r
```

**CAN FD 不变速**：

```bash
# 扩展帧
cangen can0 -g 1 -e -f -I i -L i -D i
cangen can0 -g 1 -e -f -I r -L i -D r

# 标准帧
cangen can0 -g 1 -f -I i -L i -D i
cangen can0 -g 1 -f -I r -L i -D r
```

**CAN FD BRS（变速）**：

```bash
# 扩展帧
cangen can0 -g 1 -e -f -b -I i -L i -D i
cangen can0 -g 1 -e -f -b -I r -L i -D r

# 标准帧
cangen can0 -g 1 -f -b -I i -L i -D i
cangen can0 -g 1 -f -b -I r -L i -D r
```

---

## CAN FD 常见问题排查

### 无法收发

先使用**回环模式**测试，确认控制器本身是否正常：

```bash
ip link set can0 down
ip link set can0 type can bitrate 500000 sample-point 0.8 dbitrate 2000000 sample-point 0.8 fd on loopback on
ip -details -statistics link show can0
ip link set can0 up
echo 4096 > /sys/class/net/can0/tx_queue_len
candump can0 &
```

回环模式下 `cansend` 后 `candump` 可以接收，说明控制器工作正常。此时检查以下硬件相关内容：

- IOMUX 配置是否正确
- 硬件连接是否正确
- 终端 120 欧姆电阻有没有接入
- CAN 转换芯片是否正常

### 概率性不能收发

**1. 确认比特率是否精准**：

```bash
ip -details -statistics link show can0
```

如果比特率有偏差会造成收发异常，需要根据比特率调整输入时钟。

**2. 调整采样点**：

尽量保证同一网络中采样点一致，可以保障收发稳定性。参考上一节的 `sample-point` 配置方法。

---

## CAN FD 比特率和采样点计算

CAN FD 架构根据输入频率和比特率自动计算参数。采样点规则按照 **CiA 标准协议**：

```c
/* Use CiA recommended sample points */
if (bt->sample_point) {
    sample_point_nominal = bt->sample_point;
} else {
    if (bt->bitrate > 800000)
        sample_point_nominal = 750;     // 75.0%
    else if (bt->bitrate > 500000)
        sample_point_nominal = 800;     // 80.0%
    else
        sample_point_nominal = 875;     // 87.5%
}
```

**比特率计算公式**：

```
BitRate = clk_can / (2 * (brp + 1)) / ((tseg2 + 1) + (tseg1 + 1) + 1)
```

**采样点计算公式**：

```
Sample = (1 + (tseg1 + 1)) / (1 + (tseg1 + 1) + (tseg2 + 1))
```

其中 `brp`、`tseg1`、`tseg2` 见 CAN TRM 中的 `BITTIMING` 寄存器。

---

## CAN FD 变速

对于超过 5M 的变速，可能会出现不稳定，此时需要先测试**环路延时**，然后根据环路延时配置 **TDC（Transmitter Delay Compensation）**。

### 环路延时测试

操作步骤：

```bash
# 使能测试模式
io -4 0x2ac00108 0x80

# 发送一帧数据
cansend can0 001#aaaaaaaa

# 读取环路延时值
io -4 0x2ac00110
```

读回来的 `0x2ac00110` 寄存器的值就是 loop delay。

### TDC 配置

测试好 loop delay 后，配置 TDC：

```bash
io -4 0x2ac00108 0x19
```

- `tdc_offset` 配置成 loop delay 的一半
- 使能 `tdc_enable`

详细配置见 TRM CAN FD 章节的 `RKCAN_FD_TDC` 寄存器。

最终 TDC 配置需要代码化，写到 `rk3576_canfd_set_bittiming()` 函数的 TDC 配置中去。

:::tip 注意
CAN FD 变速网络上的**采样点必须一致**，否则 BRS 位接收可能会有异常。

采样点设置示例：
```bash
ip link set can0 type can bitrate 500000 sample-point 0.8 dbitrate 2000000 sample-point 0.8 fd on
```
:::

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_CAN_FD_CN.pdf` V1.2.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
