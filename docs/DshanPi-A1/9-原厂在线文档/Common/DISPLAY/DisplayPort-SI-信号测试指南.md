---
sidebar_position: 16
---

# DisplayPort SI 信号测试指南

本文档基于瑞芯微官方文档 `Rockchip_DisplayPort_SI_Test_Guide_CN.pdf`（V1.0.0, 2024-05-31）整理，介绍 RK3576/RK3588 DP PHY 信号测试的寄存器配置与 Tuning 方法。

:::info 适用范围
- **芯片平台**：RK3576 / RK3588
- **内核版本**：Linux-5.10 / Linux-6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、DP PHY 简介

RK3576 和 RK3588 的 DP PHY 是 DP 和 USB 共用的 PHY（**USBDP PHY**）。

### USBDP PHY 基地址

| 平台 | PHY | 基地址 |
| :--- | :--- | :--- |
| RK3588 | USBDP PHY0 | 0xfed88000 |
| RK3588 | USBDP PHY1 | 0xfed98000 |
| RK3576 | USBDP PHY | 0x2b018000 |

寄存器地址 = PHY 基地址 + 寄存器偏移。

:::caution 注意
PHY 的一个寄存器通常用于多个功能配置。如需多个 Tuning 项联合调整，需先读出寄存器值，按新的 Tuning bits 做 OR/AND 操作后再写入，否则之前的 Tuning 会被覆盖。
:::

---

## 二、DP 信号 Tuning

本文以 RK3588 PHY0 Lane0 为例。Tuning 其他 Lane 修改寄存器偏移；Tuning PHY1 或 RK3576 PHY 修改基地址。

### 2.1 DP Amplitude Control（幅值控制）

#### 2.1.1 DP TX driver main-tap level（主抽头电平）

**调电压**，建议优先调此寄存器。

**寄存器偏移：**
- bit5 为使能位，default={0x0f}
- Lane0: `0x0810[5:0]`
- Lane1: `0x1010[5:0]`
- Lane2: `0x1810[5:0]`
- Lane3: `0x2010[5:0]`

**调整范围：**

| 配置值 | 幅值 |
| :--- | :--- |
| 4'b1010 | 1200mV (max) |
| 4'b1001 | - |
| 4'b1000 | - |
| 4'b0111 | - |
| 4'b0110 | - |
| 4'b0101 | - |
| 4'b0100 | - |
| 4'b0011 | - |
| 4'b0010 | - |
| 4'b0001 | - |
| 4'b0000 | 400mV (min) |

**命令示例（Lane0）：**
```bash
io -4 0xfed88810 0x2a   # 1010, max
io -4 0xfed88810 0x29
io -4 0xfed88810 0x28
io -4 0xfed88810 0x27
io -4 0xfed88810 0x26
io -4 0xfed88810 0x25
io -4 0xfed88810 0x24
io -4 0xfed88810 0x23
io -4 0xfed88810 0x22
io -4 0xfed88810 0x21
io -4 0xfed88810 0x20   # 0000, min
```

#### 2.1.2 DP TX pmos current control（PMOS 电流控制）

**调电流**，建议在调压不满足时再设置。

**寄存器偏移：**
- 使能位 bit[1:0]，default={0x1, 0xe7}
- 调整位 bit[7:5] = 3'b000 ~ 3'b111
- Lane0: 使能 `0x0818[1:0]`，调整 `0x081c[7:5]`
- Lane1: 使能 `0x1018[1:0]`，调整 `0x101c[7:5]`
- Lane2: 使能 `0x1818[1:0]`，调整 `0x181c[7:5]`
- Lane3: 使能 `0x2018[1:0]`，调整 `0x201c[7:5]`

**命令示例（Lane0）：**
```bash
io -4 0xfed88818 0x03   # 使能
io -4 0xfed8881c 0xe5   # 3'b111
io -4 0xfed8881c 0xc5   # 3'b110
io -4 0xfed8881c 0xa5   # 3'b101
io -4 0xfed8881c 0x85   # 3'b100
io -4 0xfed8881c 0x65   # 3'b011
io -4 0xfed8881c 0x45   # 3'b010
io -4 0xfed8881c 0x25   # 3'b001
io -4 0xfed8881c 0x05   # 3'b000
```

### 2.2 DP Equalization（均衡）

#### 2.2.1 DP TX De-emphasis（去加重）

#### 2.2.2 DP TX Preshoot Level（预冲）

### 2.3 DP TX Slew Rate（压摆率）

#### 2.3.1 DP Faster Slew Rate Control（更快压摆率）

#### 2.3.2 DP Slower Slew Rate Control（更慢压摆率）

### 2.4 DP TX SSC Control（展频控制）

#### 2.4.1 PLL SSC modulation deviation（调制偏差）

#### 2.4.2 PLL SSC modulation frequency（调制频率）

### 2.5 DP TX AUX Amplitude Control（AUX 幅值控制）

---

## 三、代码参数配置调整

在 DTS 或驱动代码中配置 PHY 参数，包括：
- voltage swing 等级表
- pre-emphasis 等级表
- SSC 参数
- 等

---

## 参考资料

- 原始文档：`Rockchip_DisplayPort_SI_Test_Guide_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_DisplayPort_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
