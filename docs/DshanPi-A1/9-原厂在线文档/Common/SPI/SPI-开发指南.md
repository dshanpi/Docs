---
sidebar_position: 1
---

# SPI 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_SPI_CN.pdf`（V3.5.0, 2024-09-05）整理，介绍 Rockchip 系列芯片 Linux SPI 驱动的原理、配置和调试方法。

:::info 适用范围
| 芯片平台 | 内核版本 |
| :--- | :--- |
| Linux 4.4 系列 | Linux 4.4 |
| Linux 4.19 及以上系列 | Linux 4.19 / 5.10 / 6.1 |

**读者对象**：技术支持工程师、软件开发工程师
:::

---

## Rockchip SPI 功能特点

SPI（Serial Peripheral Interface）是串行外设接口。

**Linux 4.4 SPI 驱动特性**：

- 默认采用摩托罗拉 SPI 协议
- 支持 8 位和 16 位
- 软件可编程时钟频率
- 支持 SPI 4 种传输模式配置
- 每个 SPI 控制器支持 1~2 个片选
- 支持 SPI Slave 模式（仅 `SPI_CS0N` 作为 CS 输入脚）

**Linux 4.19 及以上新增特性**：

- 框架支持 Slave 和 Master 两种模式

### SPI 接口速率

| SOC | Master 最高速率 | Slave 最高速率 |
| :--- | :--- | :--- |
| RK3506 | 50MHz | 50MHz |
| RV1106B / RV1103B | 50MHz | 33MHz |
| RK3576 | 50MHz | 33MHz |
| RK3562 | 50MHz | 33MHz |
| RK3528 | 50MHz | 33MHz |
| RV1106 / RV1103 | 50MHz | 33MHz |
| RK3588 | 50MHz | 33MHz |
| RV1126 / RV1109 | 50MHz | 16MHz |
| RK3568 | 50MHz | 33MHz |
| RK1808 | 50MHz | 16MHz |
| RK3308 | 50MHz | 16MHz |
| 其他芯片平台 | 50MHz | 16MHz |

:::note 说明
- 接口最高速率为理论速率，受设备走线 PCB 质量影响，以实测为准
- 部分平台由于 PLL 策略原因无法准确分频到上限值，实际以最大分频值为准
:::

---

## 内核软件

### 代码路径

| 文件路径 | 说明 |
| :--- | :--- |
| `drivers/spi/spi.c` | SPI 驱动框架 |
| `drivers/spi/spi-rockchip.c` | RK SPI 各接口实现 |
| `drivers/spi/spi-rockchip-slave.c` | RK SPI Slave 各接口实现 |
| `drivers/spi/spidev.c` | 创建 SPI 设备节点，供用户态使用 |
| `drivers/spi/spi-rockchip-test.c` | SPI 测试驱动（需手动添加到 Makefile） |
| `Documentation/spi/spidev_test.c` | 用户态 SPI 测试工具（4.4） |
| `tools/spi/spidev_test.c` | 用户态 SPI 测试工具（4.19 及以后） |

### SPI 设备配置 —— Master 模式

**内核配置**：

```
Device Drivers --->
    [*] SPI support --->
        <*> Rockchip SPI controller driver
```

**DTS 节点配置**：

```dts
&spi1 {
    status = "okay";

    //assigned-clocks = <CLK_SPI1>;          // 默认不用配置
    //assigned-clock-rates = <200000000>;    // 默认不用配置
    //dma-names;                              // 关闭 DMA，仅 IRQ 传输
    //rockchip,poll-only;                     // 强制 CPU 传输（仅 master）
    //rx-sample-delay-ns = <10>;             // 读采样延时
    //rockchip,autosuspend-delay-ms = <500>;  // Runtime PM autosuspend 延时
    //rockchip,rt;                             // 放到 SCHED_FIFO 类，优先级 50

    spi_test@10 {
        compatible = "rockchip,spi_test_bus1_cs0";
        reg = <0>;                      // 片选 0 或 1
        spi-cpha;                       // CPHA = 1（不配置则为 0）
        spi-cpol;                       // CPOL = 1（不配置则为 0）
        spi-lsb-first;                  // IO 先传输 LSB
        spi-max-frequency = <24000000>; // SPI clk 输出频率（不超过 50M）
        status = "okay";
    };
};
```

**时钟频率配置说明**：

`spi-max-frequency` 是 SPI 的输出时钟，由 SPI 工作时钟 `spiclk` 内部分频后输出。由于内部至少 2 分频，关系为：

```
assigned-clock-rates >= 2 × spi-max-frequency
```

示例：需要 50MHz SPI IO 速率，可配置：

```
assigned-clock-rates = <100000000>;   // 工作时钟 100MHz
spi-max-frequency = <50000000>;       // 内部二分频输出 50MHz
```

:::caution 注意
`assigned-clock-rates` 不要低于 24M，否则可能有问题。
:::

### SPI 设备配置 —— Slave 模式

**内核配置**：

```
Device Drivers --->
    [*] SPI support --->
        [*] SPI slave protocol handlers
        [*] Rockchip SPI Slave controller driver
```

**DTS 节点配置**：

```dts
&spi1 {
    compatible = "rockchip,spi-slave";   // 优先使用 SPI slave 专用驱动
    status = "okay";

    //ready-gpios = <&gpio1 RK_PD2 GPIO_ACTIVE_LOW>;  // 建议配置，传输完成信号
    //rockchip,cs-inactive-disable;                    // tod_cs 较长时开启

    slave {
        compatible = "rockchip,spi_test_bus1_cs0";
        reg = <0>;                      // 片选仅支持 0
        spi-cpha;
        spi-cpol;
        spi-lsb-first;
        status = "okay";
    };
};
```

:::note 说明
RK SPI 默认使能 DMA 传输，slave mode 不建议关闭 DMA。当一笔传输超过控制器缓存数量，软件会配置为 DMA 传输，避免中断传输响应不及时。
:::

### SPI Slave 须知

#### 建议设置 performance 模式

当 Master 速率超过一定频率后，建议传输过程设置 performance 模式，避免 DRAM 变频导致控制器缓存溢出：

| bits_per_word | 超过此速率建议设 performance |
| :--- | :--- |
| 8 bits | 5MHz |
| 16 bits | 10MHz |

参考代码：

```c
rockchip_set_system_status(SYS_STATUS_PERFORMANCE);
for (i = 0; i < times; i++)
    spi_read_slt(id, rxbuf, size);
rockchip_clear_system_status(SYS_STATUS_PERFORMANCE);
```

:::note 注意
- 建议所有 slave mode 传输行为都在 performance mode 下运行
- set/clear performance 接口有一定时间开销，建议业务上层设置，避免频繁调用
- 如果缓存溢出，slave 无法完成 DMA 传输会阻塞无法退出，通过打印 `SPI-&gt;SPI_RISR` 寄存器可确认
:::

#### 建议设置 16bits 宽度

最大限度利用 slave FIFO 容量，且最小 burst 为 2，能加速 slave 端的 DMA 传输速率，避免 FIFO 堆叠。

#### 其他须知

- SPI 做 slave 时，要**先启动 slave read，再启动 master write**
- Slave write / master read 也需要先启动 slave write
- 因为只有 master 送出 clk 后 slave 才会工作

### SPI 设备驱动介绍

**驱动注册框架**：

```c
#include <linux/spi/spi.h>

static int spi_test_probe(struct spi_device *spi) {
    int ret;
    spi->bits_per_word = 8;
    ret = spi_setup(spi);
    if (ret < 0) {
        dev_err(&spi->dev, "ERR: fail to setup spi\n");
        return -1;
    }
    return ret;
}

static const struct of_device_id spi_test_dt_match[] = {
    { .compatible = "rockchip,spi_test_bus1_cs0", },
    { .compatible = "rockchip,spi_test_bus1_cs1", },
    {},
};

static struct spi_driver spi_test_driver = {
    .driver = {
        .name = "spi_test",
        .of_match_table = of_match_ptr(spi_test_dt_match),
    },
    .probe = spi_test_probe,
    .remove = spi_test_remove,
};
```

**常用读写接口**（参考 `include/linux/spi/spi.h`）：

```c
static inline int spi_write(struct spi_device *spi, const void *buf, size_t len);
static inline int spi_read(struct spi_device *spi, void *buf, size_t len);
static inline int spi_write_and_read(struct spi_device *spi, const void *tx_buf, void *rx_buf, size_t len);
```

### User mode SPI device 配置

用户空间直接操作 SPI 接口，方便外设驱动跑在用户空间。

**内核配置**：

```
Device Drivers --->
    [*] SPI support --->
        [*] User mode SPI device driver support
```

**DTS 配置**：

```dts
&spi0 {
    status = "okay";
    max-freq = <50000000>;

    spi_test@0 {
        compatible = "rockchip,spidev";
        reg = <0>;
        spi-max-frequency = <5000000>;
    };
};
```

驱动加载后会出现设备节点：`/dev/spidev1.1`

应用程序参考内核源码 `Documentation/spi/spidev_test.c`（4.4）或 `tools/spi/spidev_test.c`（4.19+）。

### cs-gpios 支持

通过 `cs-gpios` 属性实现 GPIO 模拟 CS，扩展 SPI 片选信号。

#### Linux 4.19 及以上配置

1. 设置 cs-gpio 引脚并在 SPI 节点中引用 pinctrl
2. SPI 节点通过 `cs-gpios` 属性重新指定 CS 脚

```dts
&spi1 {
    status = "okay";
    max-freq = <48000000>;
    cs-gpios = <&gpio0 RK_PC2 GPIO_ACTIVE_LOW>,
               <&gpio0 RK_PC3 GPIO_ACTIVE_LOW>,
               <&gpio0 RK_PC4 GPIO_ACTIVE_LOW>;

    spi_test@0 {
        compatible = "rockchip,spi_test_bus1_cs0";
        reg = <0>;
        ...
    };

    spi_test@2 {
        compatible = "rockchip,spi_test_bus1_cs2";
        reg = <0x2>;
        spi-max-frequency = <16000000>;
    };
};
```

:::caution 注意
如果要扩展 cs-gpio，则所有 CS 都要转为 GPIO function，用 cs-gpios 扩展来支持。
:::

---

## 内核测试软件

### 代码路径

```
drivers/spi/spi-rockchip-test.c
```

需要手动添加到 Makefile 编译：

```makefile
# drivers/spi/Makefile
obj-y += spi-rockchip-test.o
```

### SPI 测试设备配置

```dts
&spi0 {
    status = "okay";

    spi_test@0 {
        compatible = "rockchip,spi_test_bus0_cs0";
        id = <0>;       // 区分不同从设备
        reg = <0>;      // chip select 0
        spi-max-frequency = <24000000>;
    };

    spi_test@1 {
        compatible = "rockchip,spi_test_bus0_cs1";
        id = <1>;
        reg = <1>;      // chip select 1
        spi-max-frequency = <24000000>;
    };
};
```

驱动加载成功日志：

```
rockchip_spi_test_probe:name=spi_test_bus0_cs0,bus_num=0,cs=0,mode=11,speed=16000000
rockchip_spi_test_probe:name=spi_test_bus0_cs1,bus_num=0,cs=1,mode=11,speed=16000000
```

### 测试命令

```bash
# 写测试：id=0, 循环10次, 长度255字节
echo write 0 10 255 > /dev/spi_misc_test

# 写测试（从文件读取数据）
echo write 0 10 255 init.rc > /dev/spi_misc_test

# 读测试
echo read 0 10 255 > /dev/spi_misc_test

# 回环测试
echo loop 0 10 255 > /dev/spi_misc_test

# 设置速率
echo setspeed 0 1000000 > /dev/spi_misc_test
```

格式：
```
echo <类型> <id> <循环次数> <传输长度> > /dev/spi_misc_test
echo setspeed <id> <频率Hz> > /dev/spi_misc_test
```

---

## 内核 SPI Slave 软件

### 简介

SPI 主从之间传输通常遵循特定协议。RK SPI Slave 作为设备端也应遵循特定协议。由于协议无范式，RK 提供自定义的传输协议和设备驱动供参考。

**Linux SPI slave 驱动框架限制**：
- 使用传输队列，受调度影响不能完全保证实时性

**RK SPI slave mode 限制**：
- 每次传输需重新发起 SPI 控制器配置
- 需增加 side-band 信号（ready-gpios）做 ready 状态位

**传输协议基本流程**：

1. Slave 主动发起 `spi_sync`
2. Slave ready，使能 `GPIO_SLV_READY` 信号
3. Master 确认 slave ready 后发起传输
4. Slave 接收来自 master 的 clk 后完成传输
5. Slave idle，释放 `GPIO_SLV_READY` 信号

**包类型**：
- **Ctrl packet**：2B cmd + 2B addr + 4B data（通常指定 data 包传输长度）
- **Data packet**：数据内容

**传输类型**：
- Ctrl 传输：仅包含 1 个 ctrl packet
- Data 传输：包含 1 个 ctrl packet + 1 个 data packet

**驱动源码**：

| 文件 | 说明 |
| :--- | :--- |
| `drivers/spi/spidev-rkslv.c` | SPI Slave 设备驱动（注册 misc device 测试接口） |
| `drivers/spi/spidev-rkmst.c` | SPI Master 端参考驱动（注册 misc device 测试接口） |

### SPI Slave 测试设备配置

**defconfig 配置**：

```
CONFIG_SPI_SLAVE_ROCKCHIP_OBJ=y
```

**RK SPI Slave 端 DTS**：

```dts
&spi1 {
    compatible = "rockchip,spi-slave";
    status = "okay";
    rockchip,cs-inactive-disable;         // Linux SPI master tod_cs 较长时使用
    ready-gpios = <&gpio1 RK_PD3 GPIO_ACTIVE_LOW>;

    slave {
        compatible = "rockchip,spi-obj-slave";
        reg = <0x0>;
        spi-cpha;
        spi-cpol;
        spi-lsb-first;
        spi-max-frequency = <50000000>;
    };
};
```

**RK SPI Master 端 DTS**：

```dts
&spi0 {
    status = "okay";

    spi_test@00 {
        compatible = "rockchip,spi-obj-master";
        reg = <0x0>;
        spi-cpha;
        spi-cpol;
        spi-lsb-first;
        spi-max-frequency = <16000000>;
        ready-gpios = <&gpio1 RK_PD2 GPIO_ACTIVE_LOW>;
    };
};
```

### 测试命令

**Master 发起单包数据传输**：

```bash
echo <cmd> <addr> <length> > /dev/spidev_rkmst_misc
```

| 参数 | 说明 |
| :--- | :--- |
| `cmd` | 支持 `read` / `write` / `duplex` |
| `addr` | 对端 slave application buffer 偏移（Bytes，十进制） |
| `length` | data packet 长度（Bytes，十进制） |

示例：

```bash
echo write 128 128 > /dev/spidev_rkmst_misc
echo read 128 128 > /dev/spidev_rkmst_misc
echo duplex 128 128 > /dev/spidev_rkmst_misc
```

**Master 发起自动化测试**：

```bash
echo autotest <length> <loops> <compare> > /dev/spidev_rkmst_misc
```

| 参数 | 说明 |
| :--- | :--- |
| `length` | data packet 长度（Bytes） |
| `loops` | 压测循环次数 |
| `compare` | 1=开启数据校验，0=关闭数据校验 |

示例：

```bash
echo autotest 1024 64 1 > /dev/spidev_rkmst_misc
```

**Slave 端调试**：

```bash
# 打印 application buffer 数据
echo appmem 0 256 > /dev/spidev_rkslv_misc

# 开启/关闭 debug log
echo verbose 1 > /dev/spidev_rkslv_misc
echo verbose 0 > /dev/spidev_rkslv_misc
```

---

## 常见问题

### SPI 无信号

排查步骤：

1. 确认驱动已加载运行
2. 确保 SPI 4 个引脚的 IOMUX 配置无误
3. TX 发送时，确认 TX 引脚有正常波形，CLK 有正常时钟信号，CS 有拉低
4. 如果 clk 频率较高，可考虑提高驱动强度改善信号
5. 确认 DMA 是否使能：若无以下打印则 DMA 使能成功

```
Failed to request TX DMA channel
Failed to request RX DMA channel
```

### 如何编写 SPI 应用代码

根据目标选择合适的接口：

- **自定义 SPI 设备驱动**：参考「SPI 设备驱动介绍」编写，例如 `drivers/spi/spi-rockchip-test.c`
- **基于 spidev 标准设备节点**：参考「User mode SPI device 配置」章节

### 延时采样时钟配置方案

SPI IO 速率较高时，正常 SPI mode 可能无法匹配外接器件输出延时，RK SPI master read 可能采不到有效数据，需要启用 **RSD（Read Sample Delay）** 逻辑。

RSD 控制逻辑特性：
- 可配值为 0、1、2、3
- 延时单位为 1 个 spi_clk cycle（即控制器工作时钟）
- 实际延时取与 dts 设定值最接近的有效值

示例：spi_clk 为 200MHz（周期 5ns），可配延迟为 0/5ns/10ns/15ns。若 `rx-sample-delay-ns` 设为 12ns，最接近 10ns，最终为 10ns 延时。

### SPI 传输方式说明

**默认传输模式**：

| 模式 | Master 支持 | Slave 支持 |
| :--- | :--- | :--- |
| IRQ 传输 | ✓ | ✓ |
| DMA 传输 | ✓ | ✓ |
| CPU 传输 | ✓ | ✗ |

默认使用 **IRQ/DMA 组合**：
- 传输长度 &lt; FIFO 深度 → IRQ 传输（4.19+ FIFO 深度为 64）
- 传输长度 &gt;= FIFO 深度 → DMA 传输

**IRQ 传输特性**：
- 数据 &lt; FIFO 深度时，一次传输触发 1 个中断
- 数据 &gt;= FIFO 深度时，FIFO 水线设为半 FIFO（约 32 item），一次传输触发约 items/32 次中断

**DMA 传输特性**：
- 不触发 SPI 控制器中断，使用 DMA 传输完成回调

### SPI 传输速率及 CPU 占用率高优化方向

常见原因：SPI 传输粒度小、次数多，频繁发起传输导致调度开销大（SPI 线程调度、中断调度、CPU idle 调度）。

**优化方向**：

1. **开启 auto runtime**，延时设为 500ms（以实测为准）。DTS 添加：
   ```dts
   rockchip,autosuspend-delay-ms = &lt;500&gt;;
   ```

2. **改用 IRQ 传输**：降低 CPU 负载，相对 DMA 可能有优势。DTS 中添加：
   ```dts
   dma-names;   // 删除 DMA 配置
   ```

3. **修改 SPI 水线**：DMA 传输时，修改 TX DMA 水线降低 CPU 在 DMA 回调中等待 FIFO 完成的时间。

修改示例（`drivers/spi/spi-rockchip.c`）：

```c
// writel_relaxed(rs->fifo_len / 2 - 1, rs->regs + ROCKCHIP_SPI_DMATDLR);
writel_relaxed(11, rs->regs + ROCKCHIP_SPI_DMATDLR);
```

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_SPI_CN.pdf` V3.5.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
