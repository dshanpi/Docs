---
sidebar_position: 1
---

# CAN 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Can_CN.pdf`（V1.2.0, 2024-03-26）整理，介绍 Rockchip 系列芯片 CAN 总线的驱动配置、使用方法和常见问题排查。

:::info 适用范围
| 芯片平台 | 内核版本 |
| :--- | :--- |
| RV1126 / RV1109 | Linux 4.4 & 4.19 |
| RK3568 | Linux 4.19 & 5.10 |
| RK3588 | Linux 5.10 |
| RK3562 | Linux 5.10 |

**读者对象**：技术支持工程师、软件开发工程师
:::

---

## CAN 驱动

### 驱动文件

| 芯片平台 | 驱动文件 |
| :--- | :--- |
| RV1126 / RV1109 | `drivers/net/can/rockchip/rockchip_can.c` |
| RK3568 / RK3588 | `drivers/net/can/rockchip/rockchip_canfd.c` |
| RK3562 | `drivers/net/can/rockchip/rk3562_canfd.c` |

### DTS 节点配置

**主要参数说明**：

| 参数 | 说明 |
| :--- | :--- |
| `interrupts` | 中断配置，转换完成后产生中断信号 |
| `assigned-clocks` / `assigned-clock-rates` | CAN 时钟配置 |
| `clocks` / `clock-names` | 时钟源：`baudclk`（波特率时钟）和 `apb_pclk`（总线时钟） |
| `compatible` | 兼容字符串，不同芯片不同 |
| `pinctrl` | 引脚复用配置 |

**时钟频率建议**：

- 比特率 1M 建议 CAN 时钟设为 300M，信号更稳定
- 低于 1M 比特率，时钟设置 200M 即可
- CAN 时钟最好设置成比特率的**偶数倍**，便于分出精准的比特率频率

**compatible 对应关系**：

| 芯片平台 | compatible 值 |
| :--- | :--- |
| RV1126 / RV1109 | `"rockchip,can-1.0"` |
| RK3568 | `"rockchip,rk3568-can-2.0"` |
| RK3588 | `"rockchip,can-2.0"` |
| RK3562 | `"rockchip,rk3562-can"` |

**DTS 配置示例**：

```dts
&can {
    pinctrl-names = "default";
    pinctrl-0 = <&canm0_pins>;
    status = "okay";
};
```

pinctrl 配置 `can_h` 和 `can_l` 的 iomux 为 CAN 功能。

### 内核配置

#### CAN_ROCKCHIP（CAN 控制器）

```
Symbol: CAN_ROCKCHIP [=y]
Type  : tristate
Prompt: Rockchip CAN controller
Location:
  -> Networking support (NET [=y])
    -> CAN bus subsystem support (CAN [=y])
      -> CAN Device Drivers
        -> Platform CAN drivers with Netlink support (CAN_DEV [=y])
```

#### CANFD_ROCKCHIP（CAN FD 控制器）

```
Symbol: CANFD_ROCKCHIP [=y]
Type  : tristate
Prompt: Rockchip CANFD controller
Location:
  -> Networking support (NET [=y])
    -> CAN bus subsystem support (CAN [=y])
      -> CAN Device Drivers
        -> Platform CAN drivers with Netlink support (CAN_DEV [=y])
```

#### RK3562 专用配置

```
CONFIG_CAN_RK3562=y
```

---

## CAN 通信测试工具

`canutils` 是常用的 CAN 通信测试工具包，内含 5 个独立程序：

| 工具 | 功能 |
| :--- | :--- |
| `canconfig` | 配置 CAN 总线接口参数（波特率、模式等） |
| `candump` | 从 CAN 总线接收数据并以十六进制打印，可输出到文件 |
| `canecho` | 把接收到的所有数据重新发送回总线 |
| `cansend` | 往指定接口发送指定数据 |
| `cansequence` | 自动重复递增数字发送/接收校验 |

`ip` 命令（iproute2 版本）用于配置 CAN 波特率和功能。

:::caution 注意
busybox 里的 ip 工具是阉割版本，不支持 CAN 操作。请使用完整的 iproute2 版本。
:::

**Buildroot 开启配置**：

```
BR2_PACKAGE_CAN_UTILS=y
BR2_PACKAGE_IPROUTE2=y
```

---

## CAN 常用命令

### 查询网络设备

```bash
ifconfig -a
```

### 启动/关闭 CAN

```bash
# 关闭 CAN
ip link set can0 down

# 设置比特率 500KHz
ip link set can0 type can bitrate 500000

# 打印 can0 详细信息
ip -details -statistics link show can0

# 启动 CAN
ip link set can0 up
```

### CAN 发送

```bash
# 标准帧 + 数据帧，ID: 123，数据: DEADBEEF
cansend can0 123#DEADBEEF

# 标准帧 + 远程帧，ID: 123
cansend can0 123#R

# 扩展帧 + 数据帧，ID: 00000123，数据: 12345678
cansend can0 00000123#12345678

# 扩展帧 + 远程帧，ID: 00000123
cansend can0 00000123#R
```

### CAN 接收

```bash
# 开启打印，等待接收
candump can0
```

---

## CAN 常见问题排查

### 无法收发

先使用**回环模式**测试，确认控制器本身是否正常：

```bash
# 启动 CAN 后，通过 io 命令开启回环自测
# 基地址根据实际 DTS 中 CAN 配置
io -4 0xfe580000 0x8415
```

回环模式下，`cansend` 后 `candump` 可以接收，说明控制器工作正常。此时只需要检查：

- IOMUX 配置是否正确
- 硬件连接是否正确
- 终端 120 欧姆电阻有没有接入
- CAN 转换芯片是否正常

### 概率性不能收发

**1. 确认比特率是否精准**：

```bash
ip -details -statistics link show can0
```

如果比特率有偏差会造成收发异常，需要根据比特率调整输入时钟，以分到精准的比特率。

**2. 调整采样点**：

上面的命令会打印当前配置的采样点。尽量保证同一网络中采样点一致，可以保障收发稳定性。

---

## CAN 比特率和采样点计算

CAN 架构根据输入频率和比特率自动计算参数。采样点规则按照 **CiA 标准协议**：

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

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Can_CN.pdf` V1.2.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
