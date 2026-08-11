---
sidebar_position: 2
---

# SLAVE DSMC 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_SLAVE_DSMC_CN.pdf`（V1.0.0, 2024-09-10）整理，介绍 Rockchip SLAVE DSMC（DSMC 从设备端）的驱动配置与使用方法。

:::info 适用范围
- **芯片平台**：RK3506
- **内核版本**：kernel 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

Slave Double Data Rate Serial Memory Controller（**SLAVE DSMC**）作为 DSMC 的 slave 端，**仅支持 Local bus 协议**，需配合使用 RK 开发的 DSMC host 控制器（或传输协议相同的控制器）。

**典型应用场景：** 两块 RK3506 EVB 板对接，一块做 DSMC host，一块做 DSMC Local bus slave，实现芯片间高速数据传输。

---

## 二、SLAVE DSMC 驱动

### 2.1 驱动文件

| 文件路径 | 说明 |
| :--- | :--- |
| `drivers/memory/rockchip/dsmc-lb-slave.c` | DSMC Local bus slave 驱动程序 |

### 2.2 DTS 节点配置

```dts
&dsmc_lb_slave {
    memory-region = <&dsmc_lb_slave_mem>;  // slave 的内存空间
    status = "okay";
};

&reserved_memory {
    // DSMC local bus slave 的内存空间（占用 DDR 中一段连续空间）
    dsmc_lb_slave_mem: dsmc-lb-slave-mem@6000000 {
        compatible = "rockchip,dsmc-lb-slave-mem";
        reg = <0x6000000 0x2000000>;  // 起始地址，空间大小
    };
};
```

:::note 注意
DSMC Local bus slave 定义的内存空间，默认情况下作为 DSMC host 的 Merged FIFO 空间使用。
因此 slave 端的内存空间范围需要与 DSMC host 端 `rockchip,ranges` 属性配置一致。
:::

### 2.3 内核配置

```
Symbol: ROCKCHIP_DSMC_SLAVE [=y]
Type  : tristate
Prompt: Rockchip DSMC slave driver
Depends on: MEMORY [=y] && ARCH_ROCKCHIP
Location:
  -> Device Drivers
    -> Memory Controller drivers (MEMORY [=y])
      -> Rockchip DSMC slave driver
```

### 2.4 中断

DSMC slave 驱动注册了一个中断服务程序。

**中断流程：**
1. DSMC host 写入 DSMC slave 的 `LBC_CONx` 寄存器
2. 触发 SLAVE_DSMC 中断（host2slave 中断）
3. Slave 端 CPU 执行 `rockchip_dsmc_lb_slave_irq` 中断服务程序
4. 若 `LBC_CON15` 写入非零值，则通过写入 `APP_CON15` 触发 slave2host 中断
5. DSMC host 接收中断后自动发起一定数量的 DMA 硬件请求，触发 DMA 搬移

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_SLAVE_DSMC_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_DSMC_CN.pdf》（DSMC Host 端开发指南）
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
