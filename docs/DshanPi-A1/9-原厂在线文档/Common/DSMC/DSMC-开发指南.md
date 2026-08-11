---
sidebar_position: 1
---

# DSMC 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_DSMC_CN.pdf`（V1.0.0, 2024-06-14）整理，介绍 Rockchip DSMC（Double Data Rate Serial Memory Controller，双倍速率串行存储器控制器）的驱动配置与使用方法。

:::info 适用范围
- **芯片平台**：RK3576
- **内核版本**：kernel 6.10
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、名称解释

| 缩写 | 全称 | 说明 |
| :--- | :--- | :--- |
| **DSMC** | Double Data Rate Serial Memory Controller | 双倍速率串行存储器控制器 |
| **PSRAM** | Pseudo Static Random Access Memory | 伪静态随机存储器 |
| **DPRAM** | Dual Port Random Access Memory | 双向端口随机存取存储器 |

---

## 二、概述

DSMC（双倍速率串行存储器控制器）通过命令、地址、数据线分时复用，数据上下沿传输，具有**少引脚数、高带宽**的特点。

**关键特性：**
- 数据线位宽支持 **x8、x16**
- 最多支持 **4 个 chip select**（CS0~CS3）
- 传输协议支持：
  - **Hyperbus PSRAM**
  - **Xccela PSRAM**
  - **Local bus**（从设备需使用 RK 开发的 slave 模型或协议相同）

**PSRAM 支持厂家：** Winbond、AP Memory、Cypress、ISSI 等。

---

## 三、DSMC 驱动

### 3.1 驱动文件

| 文件路径 | 说明 |
| :--- | :--- |
| `drivers/memory/rockchip/dsmc-host.c` | 主要驱动程序 |
| `drivers/memory/rockchip/dsmc-controller.c` | DSMC 控制器行为配置 |
| `drivers/memory/rockchip/dsmc-lb-device.c` | DSMC Local bus 设备 |

### 3.2 DTS 节点配置

#### 控制器节点

```dts
dsmc: dsmc@2a280000 {
    ...
    clock-frequency = <100000000>;      // DSMC 接口频率设置
    ...
    rockchip,ranges = <0x0 0x10000000 0x0 0x2000000>;
    rockchip,slave-dev = <&dsmc_slave>;

    dsmc_slave: dsmc_slave {
        compatible = "rockchip,dsmc-slave";
        rockchip,clk-mode = <0>;          // clk 模式，仅限 Local bus
        status = "disabled";

        // DQS DLL 延迟参数（4 个 CS，每个 CS 有 DQS0/DQS1）
        rockchip,dqs-dll = <0x20 0x20 0x20 0x20  0x20 0x20 0x20 0x20>;
        ...
    };
};
```

**rockchip,ranges 含义：**
- 配置从设备内存空间的基地址和大小
- 若外设是 PSRAM：每个 CS 分配对应大小的内存空间
- 若外设是 Local Bus：每个 region 分配对应大小的内存空间
- 不同 CS 内存空间大小不同时，配置最大的那个

#### PSRAM 从设备

```dts
psram {
    psram0 { status = "disabled"; };   // CS0 接 PSRAM 时设为 okay
    psram1 { status = "disabled"; };   // CS1 接 PSRAM 时设为 okay
    psram2 { status = "disabled"; };   // CS2 接 PSRAM 时设为 okay
    psram3 { status = "disabled"; };   // CS3 接 PSRAM 时设为 okay
};
```

驱动自动识别是 Hyperbus 还是 Xccela PSRAM。

#### Local Bus 从设备

每个从设备片选 CS 的访问空间可分成 1/2/4 个 region（均分）：

```dts
lb-slave {
    dsmc_lb_slave0: lb-slave0 {        // CS0 Local bus 设备
        status = "disabled";
        dsmc_p0_region: region {
            dsmc_p0_region0: region0 {
                rockchip,attribute = "Merged FIFO";  // FIFO 模式
                rockchip,ca-addr-width = <0>;        // 0: 32bit, 1: 16bit
                rockchip,dummy-clk-num = <1>;
                rockchip,cs0-be-ctrled = <0>;
                rockchip,cs0-ctrl = <0>;
                status = "disabled";
            };
            dsmc_p0_region1: region1 {
                rockchip,attribute = "No-Merge FIFO"; // 非合并 FIFO
                ...
                status = "disabled";
            };
            dsmc_p0_region2: region2 {
                rockchip,attribute = "DPRA";          // DPRAM 模式
                ...
                status = "disabled";
            };
            dsmc_p0_region3: region3 {
                rockchip,attribute = "Register";       // 寄存器模式
                ...
                status = "disabled";
            };
        };
    };
    // lb-slave1 / lb-slave2 / lb-slave3（CS1/2/3）...
};
```

**Region 属性类型：**

| 属性 | 说明 |
| :--- | :--- |
| `Merged FIFO` | 可合并 FIFO |
| `No-Merge FIFO` | 不可合并 FIFO |
| `DPRA` | 双端口 RAM |
| `Register` | 寄存器空间 |

**clk-mode 时钟行为：**

| 值 | 说明 |
| :--- | :--- |
| 0 | CS 拉高期间无时钟，拉低期间有时钟（默认） |
| 1 | 无论 CS 如何变化，时钟一直有（作为参考时钟）；无法跑高频且 AC timing 可调参数不可用 |
| 2 | CS 拉高和拉低期间都有时钟，但 CS 跳变沿前后会关闭几个时钟 |

### 3.3 内核配置

```
Symbol: ROCKCHIP_DSMC [=y]
Type  : bool
Prompt: Rockchip DSMC driver
Location:
  -> Device Drivers
    -> Memory Controller drivers (MEMORY [=y])
      -> Rockchip DSMC driver
```

---

## 四、内核态对 DSMC 从设备内存的访问

### 4.1 调用驱动接口

驱动提供的操作接口：

```c
struct rockchip_dsmc_device *rockchip_dsmc_find_dev(void);

static struct dsmc_ops rockchip_dsmc_ops = {
    .read            = dsmc_read,
    .write           = dsmc_write,
    .copy_from       = dsmc_copy_from,
    .copy_from_state = dsmc_copy_from_state,
    .copy_to         = dsmc_copy_to,
    .copy_to_state   = dsmc_copy_to_state,
};
```

**接口说明：**
- `read / write` — CPU 读写 DSMC 从设备内存
- `copy_from` — DMA 读取从设备内存，写入 host 端内存
- `copy_to` — DMA 从 host 端内存写入从设备内存

**使用示例：**
```c
static void test(void)
{
    u32 cs;
    struct rockchip_dsmc_device *dsmc_dev;

    dsmc_dev = rockchip_dsmc_find_device_by_compat(rockchip_dsmc_get_compat(0));
    if (!dsmc_dev) {
        printk("error: can not find dsmc device\n");
        return;
    }

    for (cs = 0; cs < DSMC_MAX_SLAVE_NUM; cs++) {
        if (dsmc_dev->dsmc.cfg.cs_cfg[i].device_type == DSMC_UNKNOWN_DEVICE)
            continue;
        dsmc_dev->ops->write(dsmc_dev, cs, 0, test_addr, test_data);
    }
}
```

### 4.2 直接访问

CPU 或 master 可直接访问 DSMC slave memory 空间：
- 支持 Byte、half-word、word 的随机地址访问
- 支持 cacheable、uncacheable、write combine 映射方式

---

## 五、用户态对 DSMC 的访问

### 5.1 通过特定节点访问

Local bus 使能时，驱动在 `/dev/dsmc/` 下创建设备节点：
```
/dev/dsmc/cs0/region0   # CS0 的 region0 (Merged FIFO)
/dev/dsmc/cs0/region1   # CS0 的 region1 (No-Merge FIFO)
/dev/dsmc/cs0/region2   # CS0 的 region2 (DPRAM)
/dev/dsmc/cs0/region3   # CS0 的 region3 (Register)
...
```

**访问步骤：**
1. `open()` 打开对应 region 设备节点
2. `mmap()` 将设备内存映射到进程地址空间
3. 读写设备内存
4. `munmap()` 解除映射
5. `close()` 关闭文件描述符

**代码示例：**
```c
const char *device_name = "/dev/dsmc/cs0/region0";
size_t wantbytes = 0x200000;

int memfd = open(device_name, O_RDWR | O_SYNC);
if (memfd == -1) {
    fprintf(stderr, "failed to open %s: %s\n", device_name, strerror(errno));
    exit(EXIT_FAILURE);
}

// O_SYNC + MAP_LOCKED = uncached 映射
void *buf = mmap(0, wantbytes, PROT_READ | PROT_WRITE,
                 MAP_SHARED | MAP_LOCKED, memfd, 0x0);
if (buf == MAP_FAILED) {
    fprintf(stderr, "failed to mmap: %s\n", strerror(errno));
    exit(EXIT_FAILURE);
}

// 读写 buf...
munmap(buf, wantbytes);
close(memfd);
```

### 5.2 直接访问

（通过物理地址映射等方式）

---

## 六、DSMC Slave 内存空间分配

### 6.1 PSRAM

外接 PSRAM 颗粒时，每个 CS 对应一片独立的 PSRAM 存储空间。

### 6.2 Local bus

Local bus 模式下，每个 CS 的空间分成多个 region，各 region 有独立属性。

---

## 七、DSMC Local Bus Host 与 Slave 的数据交互

### 7.1 FIFO

通过 FIFO 方式进行数据流传输，支持合并（Merged）和非合并（No-Merge）模式。

### 7.2 Register

通过寄存器读写进行控制和状态交互。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_DSMC_CN.pdf` V1.0.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
