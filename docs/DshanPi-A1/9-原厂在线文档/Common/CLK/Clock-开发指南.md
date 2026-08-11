---
sidebar_position: 1
---

# Clock 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Clock_CN.pdf`（V1.2.0, 2024-08-02）整理，介绍 Rockchip 平台时钟子系统的框架、配置方法和常见问题分析。

:::info 适用范围
- **芯片平台**：RK303X / RK312X / RK322X / RK3288X / RK3328 / RK3368 / RK3399 / RV1108 / PX30 / RV1126 / RK356X / RK3588 / RK3576 / RV1103B / RK3506
- **内核版本**：Linux 4.4 / 4.19 / 5.10 / 6.1
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 方案概述

### 概述

时钟子系统是给 SOC 各组件提供时钟的树状框架。和其他模块一样，CLOCK 也有框架用以适配不同平台：

- **适配层之上**：各模块（USB 等外设）的驱动
- **适配层之下**：具体 SOC 平台的时钟操作细节

### 重要概念

**时钟树结构**：可运行 Linux 的主流处理器平台都有非常复杂的 CLOCK TREE，由各种 CLOCK 器件及其输出组成。

**相关器件**：

| 器件 | 作用 |
| :--- | :--- |
| Oscillator / Crystal | 有源/无源振荡器，产生初始时钟（24M 晶振） |
| PLL（锁相环） | 倍频，产生高频时钟 |
| Divider | 分频 |
| MUX | 多路选择，切换时钟源 |
| Gating | 时钟门控，开关时钟以降低功耗 |
| Consumer | 使用时钟的硬件模块 |

### 时钟方案

每个 SOC 都有自己的时钟分配方案，包括 PLL 设置、各 CLOCK 的父属性、DIV、MUX 等。芯片不同，时钟方案有差异。

### 总体流程

时钟配置的主要内容：

1. Enable / Disable CLOCK
2. 设置 CLOCK 的频率
3. 选择 CLOCK 的 Parent

### 代码结构

CLOCK 软件框架由三部分构成：

| 项目 | 功能 | 路径 |
| :--- | :--- | :--- |
| clk-rk3xxx.c | CLOCK 寄存器描述、树状关系描述 | `drivers/clk/rockchip/clk-rk3xxx.c` |
| rk3xxx-cru.h | CLOCK ID 定义，通过 ID 匹配 Name | `include/dt-bindings/clock/rk3xxx-cru.h` |
| RK 特殊处理 | PLL 时钟、LCDC/I2S 等特殊时钟 | `drivers/clk/rockchip/clk-xxx.c` |
| CLK API | 供 Driver 调用的接口 | `drivers/clk/clk-xxx.c` |

---

## CLOCK 开发指南

### 时钟的相关概念

#### PLL

锁相环，由 24M 晶振输入，内部锁相环输出相应频率。这是 SOC 所有 CLOCK 的时钟源。

RK 平台主要 PLL：

| PLL | 用途 | 备注 |
| :--- | :--- | :--- |
| APLL | CPU 时钟 | 一般只给 CPU 使用，CPU 变频时 APLL 跟随变化 |
| DPLL | DDR 时钟 | 一般只给 DDR 使用，DDR 变频时 DPLL 跟随变化 |
| GPLL | 总线、外设时钟 | 一般设 594M 或 1200M，保证 100/200/300/400M 输出 |
| CPLL | GMAC 或其他设备备份 | 可能 400/500/800/1000M，或给 LCDC 独占 |
| NPLL | 其他设备备份 | 可能 1188M，或给 LCDC 独占 |

#### 总线

SOC 的总线时钟包括：ACLK_PERI、HCLK_PERI、PCLK_PERI、ACLK_BUS、HCLK_BUS、PCLK_BUS 等。

- **ACLK**：用于数据传输
- **PCLK / HCLK**：一般用于寄存器读写

BUS 与 PERI 的区分（高速/低速）：

| 总线类型 | 频率范围 | 挂载设备 |
| :--- | :--- | :--- |
| ACLK | 100~300M | 高速数据传输 |
| HCLK | 37M~150M | 中等速度 |
| PCLK | 50M~150M | 寄存器访问 |

- **BUS** 下面主要是低速设备（I2C、I2S、SPI 等）
- **PERI** 下面一般是高速设备（EMMC、GMAC、USB 等）

对总线速度要求高的设备可能有独立 ACLK（如 ACLK_EMMC、ACLK_USB）。

:::note RK3399 设计
RK3399 将高速和低速总线彻底分开：
- 高速：ACLK_PERIHP、HCLK_PERIHP、PCLK_PERIHP
- 低速：ACLK_PERILP0/1、HCLK_PERILP0/1、PCLK_PERILP0/1

这样做是为了功耗最优，根据不同需求设置不同总线频率。
:::

#### GATING

时钟框架中有很多 GATING，主要用于降低功耗。设备关闭时关闭 GATING 节省功耗。

**特性**：

- 按树状结构组织，有父子属性
- 使用引用计数机制
- 打开子 CLOCK 时，会自动打开父 CLOCK
- 关闭子 CLOCK 时，父 CLOCK 只有在所有子 CLOCK 都关闭后才会关闭

例如：I2S2 使用时需要打开三级 GATING，但软件只需开最后一级，框架自动打开所有父级。

### 时钟配置

#### 时钟初始化配置

Linux 4.4 以后，时钟初始化使用 `of_clk_set_defaults`，解析 DTS 中的属性：

- `assigned-clocks`：获取 CLOCK ID 和 Name
- `assigned-clock-parents`：设置 PARENT
- `assigned-clock-rates`：设置频率

**DTS 示例**（RK3399）：

```dts
cru: clock-controller@ff760000 {
    compatible = "rockchip,rk3399-cru";
    reg = <0x0 0xff760000 0x0 0x1000>;
    #clock-cells = <1>;
    #reset-cells = <1>;
    assigned-clocks = <&cru ACLK_VOP0>, <&cru HCLK_VOP0>, ...;
    assigned-clock-rates = <400000000>, <200000000>, ...;
    assigned-clock-parents = <&cru VPLL>, <&cru VPLL>, ...;
};
```

:::caution 注意
assigned-clock-parents 和 assigned-clock-rates 的顺序需要与 assigned-clocks 一一对应。
:::

**Gating 初始化**：

对于没有默认 Enable 且设备没有引用去 Enable 的时钟，初始化完成后会被关闭。

**常开时钟配置方式**：

1. **Critical 配置**（clk-rk3xxx.c 中）：

```c
static const char *const rk3399_cru_critical_clocks[] __initconst = {
    "aclk_usb3_noc",
    "aclk_gmac_noc",
    ...
};
```

增加后计数加 1，此 CLOCK 将不能被关闭。

2. **CLK_IGNORE_UNUSED Flag**：

```c
GATE(PCLK_PMUGRF_PMU, "pclk_pmugrf_pmu", "pclk_pmu_src",
     CLK_IGNORE_UNUSED, RK3399_PMU_CLKGATE_CON(1), 1, GFLAGS),
```

Enable Cnt 显示为 0，但时钟实际是开启的。

3. **Kernel 6.1 以后**：

- 常开所有 clk：bootargs 添加 `clk_gate.always_on=1 pm_domains.always_on=1`
- 指定常开某一时钟：使用 `CLK_IS_CRITICAL` Flag

```c
GATE(CLK_OSC0_PMU1, "clk_osc0_pmu1", "xin24m",
     CLK_IS_CRITICAL, RK3576_PMU_CLKGATE_CON(7), 8, GFLAGS),
```

#### 时钟 ID

Linux 4.4 以上对 CLOCK 的操作都使用 CLOCK ID。在 `clk-rk3xxx.c` 中通过 Name 查找对应 ID。

#### 主要的 CLOCK 注册类型

| 类型 | 说明 |
| :--- | :--- |
| GATE | 描述 GATING，包括 CLOCK ID、寄存器偏移、BIT 位等 |
| MUX | 描述多路选择，包括 CLOCK ID、寄存器偏移、BIT 位等 |
| COMPOSITE | 描述同时有 MUX、DIV、GATING 的 CLK |

#### Driver 的时钟配置

**方式一：DTS 设备节点添加引用（推荐）**

```dts
clocks = <&cru SCLK_TSADC>, <&cru PCLK_TSADC>;
clock-names = "tsadc", "apb_pclk";
```

```c
dev->pclk = devm_clk_get(&pdev->dev, "tsadc");
dev->clk = devm_clk_get(&pdev->dev, "apb_pclk");
```

**方式二：DTS 未添加，直接用名称获取**

```c
dev->pclk = devm_clk_get(NULL, "g_p_saradc");
dev->clk = devm_clk_get(NULL, "clk_saradc");
```

### CLOCK API 接口

#### 主要 CLOCK API

**头文件**：

```c
#include <linux/clk.h>
```

**常用接口**：

| 接口 | 功能 |
| :--- | :--- |
| `clk_prepare` / `clk_unprepare` | 准备/取消准备（可能睡眠） |
| `clk_enable` / `clk_disable` | 开启/关闭（原子操作） |
| `clk_prepare_enable` / `clk_disable_unprepare` | 一站式准备并开启/关闭并取消准备 |
| `clk_get` / `clk_put` | 获取/释放 CLOCK 指针 |
| `devm_clk_get` / `devm_clk_put` | 设备管理版（自动释放，推荐） |
| `clk_get_rate` / `clk_set_rate` | 获取/设置频率 |
| `clk_round_rate` | 计算最接近的频率 |

**批量接口**：

| 接口 | 功能 |
| :--- | :--- |
| `devm_clk_bulk_get` | 整组获取 |
| `devm_clk_bulk_get_all` | 获取所有时钟 |
| `clk_bulk_prepare_enable` | 整组开启 |
| `clk_bulk_disable_unprepare` | 整组关闭 |

**API 说明**：

- `clk_enable/clk_disable`：原子操作，启动/停止时钟，不会睡眠
- `clk_prepare/clk_unprepare`：准备工作/善后工作，可能会睡眠
- 两套接口的设计目的是将 CLOCK 启动分为 Atomic 和 Non-atomic 两阶段
- `clk_prepare_enable` 封装了两者，在非原子上下文中可以直接使用

:::tip 为什么需要睡眠
例如 Enable PLL CLOCK 时，需要等待 PLL 稳定。PLL 稳定时间较长，这段时间 CPU 需要睡眠让出资源。
:::

#### 示例

**DTS 配置**：

```dts
tsadc: tsadc@ff260000 {
    compatible = "rockchip,rk3399-tsadc";
    reg = <0x0 0xff260000 0x0 0x100>;
    interrupts = <GIC_SPI 97 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&cru SCLK_TSADC>, <&cru PCLK_TSADC>;
    clock-names = "tsadc", "apb_pclk";
    assigned-clocks = <&cru SCLK_TSADC>;
    assigned-clock-rates = <750000>;
    ...
};
```

**Driver 代码**：

```c
static int rockchip_thermal_probe(struct platform_device *pdev)
{
    thermal->num_clks = devm_clk_bulk_get_all(&pdev->dev, &thermal->clks);
    error = clk_bulk_prepare_enable(thermal->num_clks, thermal->clks);
    ...
}

static int rockchip_thermal_remove(struct platform_device *pdev)
{
    clk_bulk_disable_unprepare(thermal->num_clks, thermal->clks);
    ...
}
```

### CLOCK 调试

#### 1. 打印当前时钟树结构

```bash
cat /sys/kernel/debug/clk/clk_summary
```

#### 2. 单个时钟调试节点

```bash
# 获取频率
cat /sys/kernel/debug/clk_saradc/clk_rate

# 设置频率
echo 24000000 > /sys/kernel/debug/clk_saradc/clk_rate

# 打开时钟
echo 1 > /sys/kernel/debug/clk_saradc/clk_enable_count

# 关闭时钟
echo 0 > /sys/kernel/debug/clk_saradc/clk_enable_count

# Kernel 6.1 打开/关闭时钟
echo 1 > /sys/kernel/debug/clk_saradc/clk_prepare_enable
echo 0 > /sys/kernel/debug/clk_saradc/clk_prepare_enable
```

#### 3. TEST_CLK_OUT

部分时钟可以输出到 `test_clk_out` 引脚，直接用示波器测试时钟频率，用于确认波形是否正常。

配置步骤（以 RK3399 为例）：

1. 设置 CLOCK MUX → `CRU_MISC_CON`（offset 0x050c）
2. 设置 CLOCK DIV → `CRU_CLKSEL58_CON`（offset 0x01e8）
3. 设置 CLOCK GATING → `CRU_CLKGATE13_CON`（offset 0x0334）

具体寄存器位定义请参考对应芯片 TRM。

---

## 常见问题分析

### PLL 设置

#### PLL 频率表格定义

PLL 频率表定义在驱动中（以 rk3399 为例）：

```c
static struct rockchip_pll_rate_table rk3399_pll_rates[] = {
    /* _mhz, _refdiv, _fbdiv, _postdiv1, _postdiv2, _dsmpd, _frac */
    RK3036_PLL_RATE(2208000000, 1, 92, 1, 1, 1, 0),
    RK3036_PLL_RATE(2184000000, 1, 91, 1, 1, 1, 0),
    RK3036_PLL_RATE(2160000000, 1, 90, 1, 1, 1, 0),
    // ...
    { /* sentinel */ },
};
```

#### PLL 计算公式

```
VCO  = 24M × FBDIV / REFDIV     （450M ~ 2200M）
FOUT = VCO / POSTDIV1 / POSTDIV2   （POSTDIV1 >= POSTDIV2）
```

示例：

```
VCO  = 24M × 99 / 2 = 1188M
FOUT = 1188M / 2 / 1 = 594M
```

**参数含义**：
- VCO 越大 → jitter 越小，但功耗越大
- REFDIV 越小 → PLL LOCK 时间越短

需要增加其他 PLL 频率时，按照公式补齐表格即可。

:::note 自动计算
有一种特殊的 PLL 类型不查表，会自动计算参数。但自动计算不能保证 VCO 尽量大，如果对 PLL 的 jitter 有要求不建议使用。
:::

### 部分特殊时钟的设置

#### LCDC 显示相关的时钟

LCDC 的 DCLK 根据屏幕分辨率决定，不同产品差异很大。因此 RK 平台上 LCDC 的 DCLK 一般**独占一个 PLL**。

**各平台显示 PLL 分配**：

| 芯片 | PLL 分配 |
| :--- | :--- |
| RK303X / RK312X / RK322X | CPLL 独占 |
| RK3288X | HDMIPHY PLL 独占 |
| RK3368 | NPLL 独占 |
| RK3399 | 支持双显，CPLL 和 VPLL 独占 |
| RK3568 | 3 个 port，HPLL 和 VPLL 独占 |
| RK3588 | 4 个 port，V0PLL 独占 + 2 个 HDMIPHYPLL |
| RK3576 | 3 个 port，VPLL 独占 + 1 个 HDMIPHYPLL |
| RK3506 | 1 个 port，就近分频 |

**RK3399 DTS 配置示例**：

```dts
/* VOP0 给 HDMI */
&vopb_rk_fb {
    assigned-clocks = <&cru DCLK_VOP0_DIV>;
    assigned-clock-parents = <&cru PLL_VPLL>;
};
&vopl_rk_fb {
    assigned-clocks = <&cru DCLK_VOP1_DIV>;
    assigned-clock-parents = <&cru PLL_CPLL>;
};

/* VOP1 给 HDMI */
&vopb_rk_fb {
    assigned-clocks = <&cru DCLK_VOP0_DIV>;
    assigned-clock-parents = <&cru PLL_CPLL>;
};
&vopl_rk_fb {
    assigned-clocks = <&cru DCLK_VOP1_DIV>;
    assigned-clock-parents = <&cru PLL_VPLL>;
};
```

#### 小数分频

I2S、UART 等模块有时钟小数分频。

**要求**：小数分频输出频率与父时钟必须满足 **20 倍关系**，否则输出的 CLOCK 会有较大的抖动及频偏。

#### 以太网时钟

以太网时钟要求精准：
- 百兆以太网 → 50M 精准频率
- 千兆以太网 → 125M 精准频率

有以太网需求的，PLL 也要能输出精准时钟。如果当前时钟方案不能出精准时钟，以太网需要使用外部时钟晶振。

#### PLL 参数时钟多路径输入

RK3576 / RK3506 的 PLL 参考时钟支持：
- 原晶振输入
- 新增 IO 输入

主要配合音频功能使用做同步，详细使用方法请联系 Rockchip 支持。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Clock_CN.pdf` V1.2.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
