---
sidebar_position: 3
---

# PLL 展频功能说明

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Pll_Ssmod_Clock_CN.pdf`（V1.6.0, 2024-03-21）整理，介绍 Rockchip 平台 PLL 展频（Spread Spectrum Clock, SSC）功能的原理、配置方法和注意事项。

:::info 适用范围
- **芯片平台**：RK3399 / RK1808 / RK3328 / RK3308 / RV1126 / PX30 / RK356X / RK3588 / RK3528 / RK3562 / RK3576 / RK2118
- **内核版本**：Linux 4.4 及以上 / RTT
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 展频概念介绍

### 概念解释

随着数字信号时钟频率越来越高，EMI（电磁干扰）问题日益严重。时钟信号通常是电路中频率最高、边沿最陡的信号，多数 EMI 问题与时钟信号有关。

**降低 EMI 的方法**：
- 屏蔽（简单但成本高，不适合手持设备）
- 滤波（对低频有效，不适合高速信号）
- 信号边沿控制
- PCB 增加电源和 GND 层
- **展频（SSG / SSCG）**：通过频率调制将能量分散到宽频带范围，降低峰值能量

展频是一种 Active 且低成本的 EMI 解决方案，在保证时钟信号完整性的基础上应对更广频率范围的 EMI 问题。

### 工作原理

时钟展频通过特定方式调制原始时钟信号：
- **传统时钟**：能量集中在窄频带，表现为很高的峰值（高 Q 值）
- **展频时钟**：能量分散到宽频带，降低峰值（减小 Q 值）

**特点**：
- 不仅调制时钟源，所有同步于时钟源的数据、地址和控制信号也一并调制
- 整体 EMI 峰值都会减小——是系统级解决方案
- 用户可选择不同配置和调制范围

### 重要参数

时钟展频有两个主要控制参数：

**1. 调制速度（Modulation Rate）**

输出时钟频率在调制范围内的变化速度。

- 应远小于源时钟频率，以免引起时序问题
- 应高于人耳可听范围（20Hz~20KHz），以免产生噪音
- 一般选择 30KHz ~ 120KHz

**2. 调制深度（Modulation Depth）**

输出时钟频率偏移源时钟频率的大小，以百分比（%）表示。

- 调制深度越大 → EMI 峰值越低
- 需要根据系统可接受的频率调制范围合理选择

---

## 展频参数配置

### PLL 展频参数介绍

#### 普通 PLL（除 RK3588 外）

**1. 开启展频功能**

- 配置 `dsmpd` 为 0 → PLL 工作在小数模式（没有小数模式就不支持展频）
- 配置 `ssmod_reset` 为 0 → no reset modulator
- 配置 `ssmod_disable_sscg` 为 0 → no bypass SSMOD by module
- 配置 `ssmod_bp` 为 0 → no Bypass SSMOD by integration

**2. 配置展频幅度**

`ssmod_spread = n`，n 可取 0–1f，表示展频幅度 0.n%。

**3. 配置展频速率**

`ssmod_divval = n`，n 可取 0-f。

计算公式：
```
展频速率(Hz) = 24000000 / refdiv / 128 / n
```

refdiv 一般为 1。

**4. 配置 PLL 向量表**

仅 RK3399 需要配置此参数，其他平台使用默认内部向量表。

RK3399 配置向量表：
- `ssmod_sel_ext_wave = 1` → 选择外部表
- `ssmod_ext_maxaddr = ff` → 配置最大地址

:::note 注意
所有参数均可在对应芯片 TRM 中查询。
:::

#### RK3588（特殊 PLL）

**1. 开启展频功能**

配置 `sscg_en`：0=disable, 1=enable dithered mode

**2. 配置展频幅度**

`mrr = n`，n 可取 0–63，表示展频幅度 0.n%。

```
MR = mfr * mrr / m / 32
```

**3. 配置展频速率**

`mfr = n`，n 可取 0–255。

```
MF = Fin / p / mfr / 32
```

其中 `m` 和 `p` 是 PLL 参数，详见 datasheet。

**4. 配置展频模式**

`sel_pf` 配置展频模式：
- 0: down spread（下展频）
- 1: up spread（上展频）
- 1x: center spread（中心展频）

:::tip 建议
从 jitter 考虑，一般建议选择 **center spread（中心展频）**。
:::

### PLL 展频示例

以下示例均使用 `io` 命令直接操作寄存器，仅用于调试验证。正式使用请在代码中配置。

#### RK3399，GPLL 展频

```bash
io -4 0xff760094 0x00010001   # 选择外部表
io -4 0xff760090 0x1f000100   # 调节幅度 [0, 1f]
io -4 0xff760090 0x00f000f0   # 调节周期 [0, f]
io -4 0xff760094 0xff00ff00   # 调节 MAX_ADDR [0, ff]
io -4 0xff76008c 0x00080000   # 打开小数模式
io -4 0xff760090 0x00070000   # 打开展频功能
```

#### RK3328，CPLL 展频

```bash
io -4 0xff44004c 0x1f000800   # 设置幅度 0.8%
io -4 0xff44004c 0x00f00060   # 设置速率约 30kHz
io -4 0xff44004c 0x00080000   # 打开小数模式
io -4 0xff440050 0x00070000   # 打开展频功能
```

#### PX30，GPLL 展频

```bash
io -4 0xff2bc00c 0x1f000800   # 设置幅度
io -4 0xff2bc00c 0x00f00060   # 设置速率
io -4 0xff2bc004 0x10000000   # 打开小数模式
io -4 0xff2bc00c 0x00070000   # 打开展频功能
```

#### RK3308，VPLL0 展频

```bash
io -4 0xff50004c 0x1f000800   # 设置幅度
io -4 0xff50004c 0x00f00060   # 设置速率
io -4 0xff500044 0x10000000   # 打开小数模式
io -4 0xff50004c 0x00070000   # 打开展频功能
```

#### RV1126，HPLL 展频

```bash
io -4 0xff49006c 0x1f000800   # 设置幅度
io -4 0xff49006c 0x00f00060   # 设置速率
io -4 0xff490064 0x10000000   # 打开小数模式
io -4 0xff49006c 0x00070000   # 打开展频功能
```

#### RK1808，GPLL 展频

```bash
io -4 0xff35006c 0x1f000800   # 设置幅度
io -4 0xff35006c 0x00f00060   # 设置速率
io -4 0xff350064 0x10000000   # 打开小数模式
io -4 0xff35006c 0x00070000   # 打开展频功能
```

#### RK356X，GPLL 展频

```bash
io -4 0xfdd2004c 0x1f000800   # 设置幅度
io -4 0xfdd2004c 0x00f00060   # 设置速率
io -4 0xfdd20044 0x10000000   # 打开小数模式
io -4 0xfdd2004c 0x00070000   # 打开展频功能
```

#### RK3588，GPLL 展频

```bash
io -4 0xfd7c01cc 0x00ff000c   # 设置速率约 30kHz
io -4 0xfd7c01cc 0x3f000500   # 设置幅度 0.5%
io -4 0xfd7c01cc 0xc0008000   # 设置展频模式
io -4 0xfd7c01d0 0x00010001   # 打开展频功能
```

#### RK3528，GPLL 展频

```bash
io -4 0xff4a006c 0x1f000800   # 设置幅度
io -4 0xff4a006c 0x00f00060   # 设置速率
io -4 0xff4a006c 0x00080008   # 选择中心展频
io -4 0xff4a0064 0x10000000   # 打开小数模式
io -4 0xff4a006c 0x00070000   # 打开展频功能
```

#### RK3562，GPLL 展频

```bash
io -4 0xff10006c 0x1f000800   # 设置幅度
io -4 0xff10006c 0x00f00060   # 设置速率
io -4 0xff10006c 0x00080008   # 选择中心展频
io -4 0xff100064 0x10000000   # 打开小数模式
io -4 0xff10006c 0x00070000   # 打开展频功能
```

#### RK3576，GPLL 展频

```bash
io -4 0x272001cc 0x00ff000c   # 设置速率约 30kHz
io -4 0x272001cc 0x3f000500   # 设置幅度 0.5%
io -4 0x272001cc 0xc0008000   # 设置展频模式
io -4 0x272001d0 0x00010001   # 打开展频功能
```

#### RK2118，V0PLL 展频

```bash
io -4 0x50b1002c 0x1f000800   # 设置幅度
io -4 0x50b1002c 0x00f00060   # 设置速率
io -4 0x50b1002c 0x00080008   # 选择中心展频
io -4 0x50b10024 0x10000000   # 打开小数模式
io -4 0x50b1002c 0x00070000   # 打开展频功能
```

:::caution 注意
- **不支持展频的芯片**：RK3036 / RK312X / RK322X / RK3188 / RK3288 / RK3368
- 其他 PLL 类似处理，只需将基地址修改为对应 PLL 的地址
- 展频速率建议使用 30KHz
- 展频幅度没有固定参考值，需实验室实测，以 EMI 认证是否通过为准
:::

### PLL 展频代码修改

展频参数确定后需要在软件中配置，建议越早配置越好。以下给出 U-Boot 和 Kernel 两个位置的修改示例。

#### U-Boot（以 RK3399 DPLL 展频为例）

修改文件：`drivers/clk/rockchip/clk_rk3399.c`

```c
static int rk3399_clk_probe(struct udevice *dev)
{
    struct rk3399_clk_priv *priv = dev_get_priv(dev);

    /* 展频幅度 */
    writel(0x1f001f00, &priv->cru->dpll_con[4]);
    /* 展频周期 */
    writel(0x00f00060, &priv->cru->dpll_con[4]);
    writel(0x7f002700, &priv->cru->dpll_con[5]);
    writel(0x00080000, &priv->cru->dpll_con[3]);
    writel(0x00070000, &priv->cru->dpll_con[4]);
    writel(0x00010001, &priv->cru->dpll_con[5]);

    // ...
}
```

#### Kernel（以 RK3399 GPLL 和 VPLL 展频为例）

修改文件：`drivers/clk/rockchip/clk-rk3399.c`

```c
static void __init rk3399_clk_init(struct device_node *np)
{
    // ...

    /* GPLL 展频 */
    writel(0x00010001, 0xff760094);
    writel(0x1f000100, 0xff760090);
    writel(0x00f000f0, 0xff760090);
    writel(0x7f002700, 0xff760094);
    writel(0x00070000, 0xff760090);
    writel(0x00080000, 0xff76008c);

    /* VPLL 展频 */
    writel(0x00010001, 0xff7600d4);
    writel(0x1f000a00, 0xff7600d0);
    writel(0x00f00060, 0xff7600d0);
    writel(0x7f002700, 0xff7600d4);
    writel(0x00070000, 0xff7600d0);
    writel(0x00080000, 0xff7600cc);

    rockchip_clk_of_add_provider(np, ctx);
}
```

:::caution 重要
如果是 DDR（DPLL）展频，尽量放在 LOADER 阶段处理。在其他位置处理 DDR 时钟可能造成系统不稳定、死机等问题。
:::

---

## 展频注意事项

### 时钟抖动

展频**不能用于对时钟精度敏感的应用**，如以太网和 CAN 总线。

设计人员需特别注意展频引入的额外 Jitter，可能引起：
- 建立/保持时间问题
- 高误码率
- PLL 失锁

**好消息**：展频只引入非常小的周期间抖动。例如 30KHz~120KHz 调制速度的展频，源时钟频率至少是调制速率的 1000 倍，相邻周期间差别非常小。展频大约只引入低于 0.05% 的周期间抖动。

因此，展频非常适用于需要**低周期间抖动、低误码率、低 EMI** 的系统。

### 稳定性

由于是 PLL 展频，一旦 PLL 展频后，PLL 下面的**所有子时钟都工作在展频模式下**。对子时钟的影响很多是未知的，需要增加功能测试和稳定性测试。

### 共用性

同一个 PLL 下面挂了多个模块时（如 EMMC 和 SDIO 在同一 PLL 下），如果两者的 EMI 对展频参数要求不同，需要特别注意：尽量选择折中的展频参数，同时满足两个模块对 EMI 的要求。

**规范参考**：

- DDR、USB、SDIO、I2C、SPI、I2S、USB3.0、PCIE、eDP 等——规格书中有定义 SSC 的，按要求设置参数
- 规范中没有定义 SSC 的，且开 SSC 后导致部分指标测试失败的，需要做稳定性、兼容性测试

**原则**：只针对需求开 SSC，在 EMI 指标满足要求的情况下，SSC 幅度尽可能小。

:::note 示例
USB2.0 开 SSC 后频率测试项通常过不了。这要看 PHY 中弹性 buffer 的大小：buffer 越大对展频幅度适应性越强，兼容性越好；buffer 越小适应性越差，容易在展频到高频阶段导致 buffer 溢出。

展频有风险，每个项目展频后的现象会有差异，需要具体情况具体分析。
:::

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Pll_Ssmod_Clock_CN.pdf` V1.6.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
