---
sidebar_position: 2
---

# UART FAQ 排查指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_UART_FAQ_CN.pdf`（V1.1.0, 2021-12-29）整理，提供 UART 开发和维护过程中常见问题的解决方案。

:::info 适用范围
- **芯片平台**：所有采用 Linux 内核的 Rockchip 芯片
- **读者对象**：技术支持工程师、软件开发工程师
:::

:::tip 前置阅读
使用本文前，请先阅读 [UART 开发指南](./UART-开发指南.md)，确保对 Rockchip UART 的功能特点、使用方法、调试手段等内容理解充分。
:::

---

## 使用说明

### 相关文档

- [UART 开发指南](./UART-开发指南.md)：Rockchip Linux Kernel UART 开发指南
- U-Boot UART 开发指南：Rockchip_Developer_Guide_UBoot_Nextdev_CN 中的 UART 章节

:::note 提示
UART 根据使用场景和具体软硬件平台的不同，相同的问题在解决方案上会存在差异，请灵活处理。Rockchip 平台 SDK 中 UART 基础功能都是经过测试的。如果使用的 SDK 版本较早，请获取最新 SDK 源码并对比 UART 驱动代码。如有疑问，请通过 Rockchip Redmine 平台联系 FAE 获取技术支持。
:::

### 开机日志

根据开机日志中各个阶段启动的标志性打印，可以判断出 UART 问题出现的阶段。以 RK356x 为例，常见的开机日志阶段：

| 阶段 | 标志打印 |
| :--- | :--- |
| DDR 阶段（TPL） | `DDR Version <version>` |
| Miniloader 阶段（SPL） | `U-Boot SPL board init` / `U-Boot SPL <version>` |
| Trust 阶段（BL31） | `INFO: Preloader serial: 2` / `NOTICE: BL31: <version>` |
| OP-TEE 阶段（BL32） | `I/TC: Rockchip release version: 1.0` / `I/TC: OP-TEE version: <version>` |
| U-Boot 阶段 | `U-Boot <version>` / `Model: Rockchip RK3568 Evaluation Board` |
| Kernel earlycon | `Starting kernel ...` / `bootconsole [uart8250] enabled` |
| fiq_debugger | `console [ttyFIQ0] enabled` / `bootconsole [uart8250] disabled` |
| 普通 UART 初始化 | `Serial: 8250/16550 driver` / `fe650000.serial: ttyS1 at MMIO ... is a 16550A` |

### io 命令

Rockchip 平台中通常集成 `io` 命令用于直接读写寄存器。下面以 RK3568 UART5_M0 为例，说明常用调试操作。

**确保 UART5 pclk 打开**：

```bash
echo 1 > /sys/kernel/debug/clk/pclk_uart5/clk_enable_count
```

**查看 UART5 控制器全部寄存器**：

```bash
io -4 -l 0x100 0xFE690000
```

**查看 UART5 相关时钟**：

```bash
cat /sys/kernel/debug/clk/clk_summary | grep uart5          # UART5 相关时钟
cat /sys/kernel/debug/clk/sclk_uart5/clk_rate               # UART5 工作时钟频率
echo 24000000 > /sys/kernel/debug/clk/sclk_uart5/clk_rate   # 设置工作时钟
cat /sys/kernel/debug/clk/sclk_uart5/clk_enable_count       # UART5 工作时钟状态
echo 1 > /sys/kernel/debug/clk/sclk_uart5/clk_enable_count  # 使能工作时钟
```

**检查 IOMUX 配置**：

```bash
io -4 0xFDC60310    # uart5_iomux_sel，选择 iomux group 0 或 group 1
# fdc60310: 00000000  → bit 0 为 0，说明 UART5_M0 配置正确

io -4 0xFDC60020    # gpio2a1_sel 和 gpio2a2_sel，rx 和 tx 的 GPIO function
# fdc60020: 00001331  → bit 7:4 和 bit 11:8 均为 3，说明 UART5_M0 RX 和 TX 配置正确
```

**通过寄存器配置 UART 基础收发功能（115200 波特率）**：

```bash
io -4 0xFE690088 0x00000007   # SRR 寄存器，对 UART 和 FIFO 进行 reset
io -4 0xFE690010 0x00000010   # MCR 寄存器，配置为 loopback 模式
io -4 0xFE69000C 0x00000080   # LCR 寄存器，div_lat_access 置 1
io -4 0xFE690000 0x0000000D   # DLL 寄存器，配置波特率分频系数
io -4 0xFE690004 0x00000000   # DLH 寄存器，配置波特率分频系数
io -4 0xFE69000C 0x00000003   # LCR 寄存器，div_lat_access 清 0 并配置协议参数
io -4 0xFE690010 0x00000000   # MCR 寄存器，配置为一般模式
io -4 0xFE690004 0x00000001   # IER 寄存器，打开接收中断
io -4 0xFE690008 0x00000041   # FCR 寄存器，打开 FIFO，触发阈值配置为 1/4
io -4 0xFE69009C              # SRT 寄存器，读写 RX FIFO 触发阈值
io -4 0xFE6900A0              # STET 寄存器，读写 TX FIFO 触发阈值
io -4 0xFE690000 0x00000055   # THR 寄存器，发送 "U"（0x55）
io -4 0xFE690000              # RBR 寄存器，读取接收到的数据
```

:::caution 注意
配置 DLL 和 DLH 时，需要先将 LCR 寄存器的 bit 7（div_lat_access）置 1。在此操作前，需要先将 MCR 寄存器的 bit 4（loopback）置 1。如果 UART 不在 loopback 模式下，当配置 DLL/DLH 时 RX 引脚受到外部信号干扰，将会触发 UART busy 状态导致 LCR 的 bit 7 无法重新配置为 0。
:::

### 关闭其它打印干扰

调试过程中可以使用以下命令关闭其它打印干扰：

```bash
su
echo 0 > /proc/sysrq-trigger
```

---

## 波特率相关

UART 在某个波特率下能否正常工作，主要取决于：
1. UART 控制器内部分频（DLL 和 DLH 寄存器）
2. CRU 提供给 UART 控制器的工作时钟分频策略（uart_sclk）

**注意事项**：

- 请使用常见的波特率：115200、460800、921600、1.5M、3M、4M 等。Rockchip 对于非典型波特率的支持不做保证
- Rockchip UART IP 最高稳定支持 4M 波特率，更高波特率需要修改驱动框架层代码
- 工作时钟 uart_sclk 的后端约束频率 sign_off 值通常设计为 100MHz，特殊场景下也请不要超过 6M 波特率
- 如果 SDK 版本较为老旧，请联系 Rockchip 更新 UART 相关源码

### 时钟分频策略

在 Linux Kernel 4.19 中，主要关注以下驱动文件和函数：

| 文件 | 函数 |
| :--- | :--- |
| `drivers/tty/serial/8250/8250_dw.c` | `dw8250_set_termios` |
| `drivers/clk/clk-fractional-divider.c` | `clk_fd_set_rate` |
| `drivers/clk/rockchip/clk.c` | `rockchip_fractional_approximation` |

在 `dw8250_set_termios` 函数中：
- 波特率为 **115200 及以下**：时钟源选择 24M 晶振
- 波特率在 **115200 之上**：时钟源选择 PLL，由 CRU 控制

对于某些特殊波特率，CRU 分频后提供的工作时钟可能误差较大，可以通过再乘以 2（`sclk_rate = baud_rate × 16 × 2`）来改善。

为了减少 CRU 输入到 UART 控制器的工作时钟的 jitter，CRU 的小数分频器存在一个 **20 倍关系**的限制。解除 20 倍限制请查看 `rockchip_fractional_approximation` 函数中的标志 `CLK_FRAC_DIVIDER_NO_LIMIT`。

### 案例

#### 波特率测量方法错误

出现问题时，波特率测量**请一定使用示波器**。示波器抓取 UART TX 信号波形才能得到真实的波特率。逻辑分析仪、USB 转 UART 小板等方式的测量结果不一定可靠。

通常获取并对比以下三个值就能定位问题：
1. 示波器抓取 UART TX 实际输出波形的波特率
2. 打印对应 UART 的工作时钟频率
3. 根据时钟分频策略计算出的理论工作时钟频率

- 时钟频率正常、波特率异常 → 检查测量过程
- 理论值与实际值有差异 → 尝试修改时钟分频策略或更换其它波特率

#### 使用过程中出错，重启后正常

使用过程中一段时间后出现数据传输错误，请根据时钟分频策略检查时钟源。如果时钟源选择 CRU 提供的 PLL，查看出现问题前后 PLL 是否出现变化。

某些操作（如休眠唤醒、变频等）会导致 PLL 实际频率发生变化，进而影响 UART 波特率。

#### 波特率由高到低切换后异常

如果低→高正常，高→低异常，请查看 UART 工作时钟源是否在 CRU（PLL）和晶振之间切换正常。

通常 1.5M 及以下波特率选择 24MHz 晶振，1.5M 以上选择 CRU PLL。打印问题出现前后的 UART 工作时钟信息可以定位。

---

## 引脚复用相关

一个 UART 控制器的信号在引脚分配上通常有多个 iomux。配置 UART iomux 需要同时配置 GRF 中的两处寄存器：

1. **选择 GPIO 引脚的 function**：同一个引脚会与多个模块复用，需要确认已配置成 UART 对应功能
2. **选择 uart_iomux_sel 寄存器中的 group**：一个 UART 控制器需要整体配置 group 才能实现整体切换

### 案例

#### 不同 iomux 的 TX 可以同时使用但 RX 不能

同一个 UART 控制器只能选择一组 iomux group。iomux group 是否成功切换需要检查 **UART RX 功能**。

原因：UART M0 和 M1 两组 iomux 的 TX 引脚中并未加入选择开关，只要对应 GPIO 的 function 都配置成 UART 功能，两个 TX 都会有数据输出。但 RX 引脚中存在选择开关，不会出现两个 RX 都能接收的情况。

#### 开启其他模块后串口异常

由于引脚复用，某些模块开启后会重新配置 iomux 寄存器，导致串口传输错误。常见冲突功能：

- PWM（显示设备中使用的 PWM 背光）
- SDMMC（系统启动的存储位置）
- JTAG（force jtag 位需要保持关闭）

尤其是用于 console 的 UART 引脚，其 iomux function 涉及的模块使用时需要特别注意。出现此类问题时，请确认对应引脚的 iomux function 寄存器值。

---

## 引脚电平相关

UART 引脚电平配置错误会导致通讯失败。通常引脚 RX 和 TX 都会配置为内部上拉。

出现问题时，软件上需要检查：
1. kernel dts 中 UART RX 和 TX 对应引脚电平配置是否正确
2. 根据芯片 datasheet，检查电源域 io domain 配置（1v8 或 3v0）是否正确
3. 直接测量 UART RX 和 TX 引脚电平是否为高电平，电压值是否正确

### 案例

#### 硬件 PCB 设计错误

软件配置正确后仍无法解决问题，请检查硬件 PCB 设计：
- RX 和 TX 信号线接反、接到低电平或高电平
- UART 打开流控，CTS 引脚被外部电平强制拉高
- 外设实际电平不匹配、电压值错误、没有漏电保护等

#### 硬件设计与实际使用的芯片型号不一致

Rockchip 芯片通常按系列推出，同一系列存在不同型号细分。需要确认硬件参考设计使用的芯片手册是否是实际使用的型号。可以使用 Rockchip EVB 板进行相同测试对比。

#### 外设 TX 无法拉低主控 RX

出现外设 TX 无法拉低主控 RX 的问题时：
1. 先检查外设是否能拉低其它 GPIO 引脚
2. 检查外设和主控中间是否存在电平转换芯片
3. 检查外设引脚驱动能力是否足够

---

## 中断相关

UART 中断包括 TX 发送中断和 RX 接收中断。需要和 FIFO 配置结合分析。

主要关注寄存器组：

**IER 寄存器（中断使能寄存器）**：

| 位 | 名称 | 说明 |
| :--- | :--- | :--- |
| 0x80 | PTIME | 可编程 THRE 中断模式使能。TX FIFO 数据触发水线时提前产生 THRI 中断 |
| 0x08 | MSI | Modem 状态中断（第四优先级） |
| 0x04 | RLSI | 接收线路状态中断（最高优先级），包括 overrun/parity/framing errors 等 |
| 0x02 | THRI | 发送保持寄存器中断（第三优先级），TX FIFO 为空时触发 |
| 0x01 | RDI | 接收数据中断（第二优先级），RX FIFO 数据达到水线时触发；或超时触发 |

- **IIR 寄存器**：中断识别寄存器，读取触发中断的子中断号
- **FCR 寄存器**：FIFO 控制寄存器，控制 RX/TX FIFO 水线配置等

### 案例

#### 配置接收中断的触发水线

UART RX FIFO 通常为 64 Bytes 或 32 Bytes，可以配置为四种触发水线：

| 值 | 触发条件 |
| :--- | :--- |
| 2'b00 | 1 character in the FIFO |
| 2'b01 | FIFO 1/4 full |
| 2'b10 | FIFO 1/2 full |
| 2'b11 | FIFO 2 less than full |

- 触发水线越低 → 接收处理越及时，但中断多、CPU 消耗大
- 默认配置为 FIFO 1/2 full
- 修改位置：`drivers/tty/serial/8250/8250_port.c` 的 `serial8250_do_set_termios()` 函数中的 `UART_FCR_R_TRIG_10` 参数
- 如果出现接收数据错误，可以尝试将 RX FIFO 触发水线改为 2'b00（每收到一个字符就产生一次中断）

---

## DMA 相关

Rockchip 芯片平台的 DMA 控制器通常为 PL330，部分型号使用 DW 控制器。由于 UART 传输数据量不定长，UART 对 DMA 的配置策略比较特殊。

**注意事项**：

1. 默认配置 DMA 传输为 burst 模式，但 burst length 为 1（1 个 byte 触发一次 DMA 请求）。这是由 PL330 控制器特性决定的
2. 需要确认 FCR 寄存器中的 FIFO 水线已修改为 2'b00（1 个 byte 触发），与 DMA 配置匹配
3. 可以构造 burst length 对齐的传输数据来提高效率，但最后一笔数据需要补齐
4. 如果 burst length 和 FIFO 水线超过 1 个 byte，且最后一包数据没有补齐冗余数据，则最后一包数据会通过 Timeout 机制使用 CPU 中断接收，存在数据丢失风险
5. 使用 DW DMA 控制器不会出现以上问题，但为统一策略仍使用同种方案

**使用 DMA 时需要注意**：
- 确认每一笔 DMA 数据的开始和结束位置
- 确认下一笔 DMA 传输开始前，DMA 控制器的开关状态

### 案例

#### 不同版本 kernel 的 DMA 配置可能不同

升级系统版本、移植 DTS 中的 DMA 配置参数时，不能直接沿用之前的配置。

例如：
- kernel 4.4 中 burst 模式配置参数为 `peripherals-req-type-burst`
- kernel 4.19 中为 `arm,pl330-periph-burst`

#### 高波特率下 DMA 模式接收数据出现概率性丢失

高波特率下使用 DMA 接收数据时，RX buffer 采用循环覆盖方式。如果 RX buffer 较小，未收走的数据会被覆盖，出现概率性丢失。

**解决方法**：修改驱动代码 `drivers/tty/serial/8250/8250_dma.c` 中 `serial8250_request_dma` 函数的 `rx_size` 大小（一个 `PAGE_SIZE` 为 4K）。

---

## 硬件流控相关

建议在高波特率（1.5M 及以上）、大数据量的场景下使用硬件自动流控模式（四线 UART）。硬件流控增加 RTS 和 CTS 引脚，相比 DMA 模式传输可靠性更高。

:::caution 注意
在 Rockchip 平台上使用 UART，请**不要**使用软件流控。
:::

### 案例

#### 打开硬件流控后无法发送数据

此类问题通常是硬件问题，排查方向：
1. 开发板硬件设计错误、硬件故障等导致 CTS 引脚被强制拉高
2. 对方 RTS 引脚无法正常拉高或拉低，导致连接后一直将我方 CTS 引脚拉高

---

## 数据接收错误相关

UART 数据接收错误分为两类：**接收不到** 和 **接收乱码**。

排查方向：

| 层面 | 排查内容 |
| :--- | :--- |
| 硬件 | RX 引脚是否内部上拉、外围电路电压电流是否异常、芯片引脚电平是否正确、更换优质串口线 |
| 驱动 | 使用 io 命令关闭 IER 中断运行接收测试、检查 RFL 寄存器、确认 FCR 寄存器 RX FIFO 触发水线 |
| 应用 | 应用程序是否取走数据、是否有其它应用使用同一 UART、处理策略是否匹配水线、接收 buffer 是否足够 |

:::tip 提示
如果 SDK 版本较为老旧，请联系 Rockchip FAE 更新 UART 相关源码。
:::

### 案例

#### 对方数据发送错误

一定要确认是我方接收错误还是对方发送错误。可以使用示波器、USB 转 UART 小板等工具检测。如果我方测试均正常，请检查对方数据发送是否符合要求。

#### 一次接收大量数据会出现分段

请使用 UART 中断传输模式，并确认 FCR 寄存器中 FIFO 触发水线大小。

UART 中断接收机制中，通过 IIR 寄存器区分两种中断：
- 4'b0100：接收数据触发水线产生的中断
- 4'b1100：接收数据 Timeout 产生的中断

请查看驱动代码中数据上报逻辑：
- kernel 3.10：`drivers/tty/serial/rk_serial.c` 的 `receive_chars` 函数中的 `max_count`
- kernel 4.4/4.19：`drivers/tty/serial/8250/8250_port.c` 的 `serial8250_rx_chars` 函数中的 `max_count`

#### 应用层读取数据出现延迟

Linux Kernel 并非实时系统，UART 驱动通过 **Work Queue** 方式上报数据给应用层。如果 Work Queue 被阻塞，可能导致应用层读取延迟。

- **kernel 3.10**：UART 驱动框架提供中断上报方式，可以提高实时性。添加 `UPF_LOW_LATENCY` 标志：

```c
/* update recv data quickly instead of workqueue */
up->port.flags |= UPF_LOW_LATENCY;
```

- **kernel 4.4 / 4.19**：UART 驱动框架只支持 Work Queue 上报。对实时性有较高要求请使用 RTOS。

---

## 连接外设或其它控制器相关

UART 连接蓝牙、WIFI、NFC 等外设出现异常时，排查方向：

1. **确认是主控端还是设备端出错**：使用协议分析仪或两个 USB 转 UART 小板分别抓取主控端 RX 和 TX 数据
2. **确认错误数据是否存在规律**：分析错误数据的位置、数量和数值，推理可能原因
3. **多出数据**：检查是否有其他进程向该 UART 发送数据（特别是 console 切换为普通 UART 时）
4. **丢失数据**：检查是否有其他模块读走了数据、UART 配置是否正确（尤其是 DMA 模式）

### 案例

#### 蓝牙传输异常

高波特率（1.5M 及以上）、大数据量场景下，请选择带硬件流控的四线蓝牙。两线蓝牙即使使用 DMA 模式也可能出现播放卡顿，瓶颈主要在蓝牙模块端。

**注意事项**：
- 先确认蓝牙模块供应商提供的固件是否正确（系统版本升级时注意同步更新）
- **硬件流控模式**：四线蓝牙的 RTS 引脚 pinctrl 在蓝牙节点配置，CTS 引脚 pinctrl 在 UART 节点配置
- **DMA 模式**：两线蓝牙配置为 DMA 模式可能出现没有环形 buffer 的警告，需自行配置 DMA buffer

#### 使用 RS485 出现异常

Rockchip UART 模块原生不支持 RS485，仅支持 RS232。需要外接转换模块。出现异常时请检查硬件电路设计以及相关电平状态。

---

## 控制台打印相关

Rockchip 控制台打印使用 fiq_debugger。由于 fiq 会关闭全局中断，Rockchip 使用线程化打印（先写入内存，再打印出来）。配置中对应打开宏 `CONFIG_RK_CONSOLE_THREAD=y`。

**注意事项**：
- 每一级的打印波特率需要保持一致
- 如果需要打印大量数据，在驱动代码中增大 `FIFO_SIZE` 可以提高线程打印的缓存能力

### 案例

#### 使用控制台发送大量测试命令时出现 shell 卡死

通常出现在自动化压力测试场景，原因是安卓 shell 造成的。建议更换基于 busybox 的 shell 或者 bash。

#### 回车和换行的问题

控制台打印通常对回车 `\r`（0x0D）和换行 `\n`（0x0A）进行特殊处理：输出 `\n` 时，在此字符前增加输出 `\r`。检查 ASCII 码形式的 UART 传输数据时需要特别注意这两个值。

---

## 休眠唤醒和功耗相关

Rockchip UART 休眠唤醒的实现在 **trust** 中，kernel 中需要添加 wakeup source。所有 UART 唤醒源相关的问题都需要结合 trust 和 kernel 来排查。

**建议**：
- 更新 SDK 最新的 trust 固件
- 如果无法解决，联系负责 Rockchip Trust 的工程师
- 对于休眠功耗有严格要求的场景，作为唤醒源的 UART 需要使用晶振作为工作时钟输入，以节省 CRU 小数分频器的功耗

---

## 关闭所有打印或切换所有打印到其他 UART

Rockchip UART 打印包括：DDR 阶段 → Miniloader → TF-A → OP-TEE → U-Boot → Kernel 等阶段。

两种做法：
1. **每一级均使用特殊固件**：早期平台的方式，联系 Rockchip 获取
2. **使用传参机制**：只需修改 DDR Loader 的 UART 打印参数，前级所有阶段生效。Kernel 阶段需单独修改

### DDR Loader 修改方法

修改 `rkbin/tools/ddrbin_param.txt` 中的参数：

```
uart id=       # UART 控制器 id，配置为 0xf 为关闭打印
uart iomux=    # 复用的 IOMUX 引脚
uart baudrate= # 115200 or 1500000
```

修改完成后重新生成 ddr.bin：

```bash
./ddrbin_tool ddrbin_param.txt path/to/ddr.bin
```

### U-Boot 修改方法

**关闭打印**：在 menuconfig 中打开 `CONFIG_DISABLE_CONSOLE`：

```
console --->
    disable console in&out
```

**切换打印**：由传参机制决定，不需要额外修改。相关代码在 `arch/arm/mach-rockchip/board.c` 的 `board_init_f_init_serial()` 函数中。

### Kernel 修改方法

#### Kernel 中关闭打印

1. 在 menuconfig 中关闭 `CONFIG_SERIAL_8250_CONSOLE`：

```
Device Drivers --->
    Character devices --->
        Serial drivers --->
            [ ] Console on 8250/16550 and compatible serial port
```

2. 在 dts 中去掉 UART 基地址和 console 相关配置：

```dts
chosen: chosen {
    bootargs = "earlycon=uart8250,mmio";
};
```

3. 修改 fiq-debugger 节点，`serial-id` 改为 `0xffffffff`，去掉引脚复用配置：

```dts
fiq-debugger {
    compatible = "rockchip,fiq-debugger";
    rockchip,serial-id = <0xffffffff>;
    rockchip,wake-irq = <0>;
    rockchip,irq-mode-enable = <1>;
    rockchip,baudrate = <1500000>;
    interrupts = <GIC_SPI 252 IRQ_TYPE_LEVEL_LOW>;
    status = "okay";
};
```

:::note 注意
需要保持 fiq-debugger 节点使能，保持 fiq-debugger 流程系统才能正常启动。
:::

#### Kernel 中切换打印

例如从 UART2 切换到 UART3：

1. 修改 chosen 节点中的 earlycon 地址：

```dts
chosen: chosen {
    bootargs = "earlycon=uart8250,mmio32,0xfe670000 console=ttyFIQ0";
};
```

2. 修改 fiq-debugger 节点的 `serial-id` 和引脚配置：

```dts
fiq-debugger {
    compatible = "rockchip,fiq-debugger";
    rockchip,serial-id = <3>;
    rockchip,wake-irq = <0>;
    rockchip,irq-mode-enable = <1>;
    rockchip,baudrate = <1500000>;
    interrupts = <GIC_SPI 252 IRQ_TYPE_LEVEL_LOW>;
    pinctrl-names = "default";
    pinctrl-0 = <&uart3m0_xfer>;
    status = "okay";
};
```

3. 同时将切换为打印串口的 UART3 普通串口节点禁用。

#### 将原控制台 UART 作为普通 UART 使用

进行完关闭或切换控制台 UART 后，需要重新将该 UART 作为普通 UART 使能。注意：一定是**先关闭/切换控制台，释放后再作为普通 UART 使能**。

### Android 修改方法

安卓需要去掉 recovery 中对 console 的使用，否则恢复出厂设置时会卡住。

修改文件 `android/device/rockchip/common/recovery/etc/init.rc`，注释掉 console：

```
service recovery /sbin/recovery
    #console
    seclabel u:r:recovery:s0
```

### 案例

#### 由打印串口切换成普通串口后出现的问题

使用由打印串口切换成的普通串口出现问题时，先使用另一个 UART 进行相同测试。如果其它 UART 不会出现同样问题，请联系 Rockchip 获取直接在源码中关闭 UART 打印的特殊固件再进行排查。

特殊情况下（如 DDR 变频等前级操作）会导致由打印串口切换成的普通串口出现数据增加或丢失。

---

## 其它问题

### 案例

#### 使用某些上位机时 Kernel 无法正常启动

某些上位机串口调试软件（如 MobaXterm、Putty 等）默认开启 UART 软件流控（Xon/Xoff）。

系统启动时，在 DDR 变频等操作下会发送大量打印数据，当数据量超过上位机接收 buffer 时会触发软件流控，向 RX 发送 Xoff（Control+S 字符）。Rockchip 平台在系统启动过程中接收到 Control+S 字符会触发 U-Boot Debug 模式，导致无法正常开机。

**解决方法**：检查上位机串口工具配置，关闭软件流控。

#### 更换 UART 设备节点号

以 ttyS3 和 ttyS4 交换为例，在 dts 中修改：

```dts
aliases {
    serial3 = &uart4;
    serial4 = &uart3;
};
```

如果是控制台 UART 和普通 UART 交换节点号，请直接修改 `drivers/tty/tty_io.c` 中的 `tty_line_name()` 函数。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_UART_FAQ_CN.pdf` V1.1.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
