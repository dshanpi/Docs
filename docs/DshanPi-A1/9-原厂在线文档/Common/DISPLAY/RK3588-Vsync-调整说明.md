---
sidebar_position: 11
---

# RK3588 Vsync 调整说明

本文档基于瑞芯微官方文档 `Rockchip_RK3588_Developer_Guide_Vsync_Adjust_CN.pdf`（V1.2.0, 2024-06-12）整理，介绍 RK3588 平台 VRR（可变刷新率）相关的 Vsync 周期调整方法。

:::info 适用范围
- **芯片平台**：RK3588
- **内核版本**：Linux Kernel 5.10
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、扫描时序说明

标准显示扫描时序：
- **行参数**：HSYNC + HBP + HACT + HFP → Htotal
- **帧参数**：VSYNC + VBP + VACT + VFP → Vtotal
- **帧率公式**：`fps = pixel_clk / (htotal × vtotal)`

调整 Vsync 周期（即调整 fps）的三种方式：
1. **调整 VFP（vfront porch）** — 调整 vbank，最常用
2. **调整 HFP（hfront porch）** — 调整 hbank
3. **调整 dclk rate（像素时钟）** — 调整时钟频率

:::note 说明
对于固定分辨率，hactive 和 vactive 不变。实际可调整的是 hbank 和 vbank。目前大多数屏调整 VFP 或 HFP。
:::

---

## 二、显示通路说明

RK3588 显示通路支持 HDMI、DSI、DP、eDP 等接口输出。
- HDMI 和 DSI 可能使用 DSC 压缩
- 评估 Vsync 调整时需分别考虑使能/不使能 DSC 的场景

---

## 三、VOP 调整说明

VOP 支持调整 VFP、HFP 和 dclk rate：

| 调整方式 | 生效方式 |
| :--- | :--- |
| VFP 调整 | 立即生效 / 帧生效（可配置） |
| HFP 调整 | 只能帧生效 |
| dclk rate 调整 | 只能帧生效 |

### dclk rate 调整限制

1. **只有 VP0 和 VP2 支持切换 dclk 源**来改变 Vsync 周期
2. VP0 可在 dclk0 和 dclk1 之间切换
3. VP2 可在 dclk2 和 dclk1 之间切换

### 120/60fps 变频示例（DSI 挂 VP2）

示例配置（3024x2016p120）：
```
Video Port2: ACTIVE
Connector: DSI-1
Display mode: 3024x2016p120 clk[1187744]
Variable refresh rate info:
  Min refresh rate: 60
  Max refresh rate: 120
  Current refresh rate: 60
  Type: DCLK
  Current pixel clock: 593872
```

时钟关系（dclk1 和 dclk2 同挂 v0pll，2 倍频关系）：
```
pll_v0pll      → 1187743988 Hz
dclk_vop2_src  → 296935997 Hz  (120fps)
dclk_vop1_src  → 148467999 Hz  (60fps)
```

---

## 四、DSC 模块调整说明

- DSC 模块支持调整 **VFP 和 HFP**，均为**立即生效**
- DSC 模式也支持 VOP 通过调整 dclk 后送来的 timing

---

## 五、DSI 接口调整说明

DSI 有两种工作模式：**Manual** 和 **Auto-Calculation**。

**Auto-Calculation 模式**：DSI 控制器自动从 IPI 和 PPI 接口提取时序参数，适应帧时序变化，无需手动配置 DSI 寄存器。

### 5.1 VFP 调整说明

#### Manual 模式
Vsync 中断到来时，同时改变 VOP、DSC（如有）、DSI 的 VFP 寄存器，立即生效。

- **DSI VFP 最大 1023** — 受 DSI 寄存器限制
- 若需要更大 VFP，可只调整 VOP/DSC 的 VFP 寄存器，但会缺少同步包，可能显示异常，**不建议**

#### Auto-Calculation 模式
Vsync 中断到来时，只需改变 VOP、DSC（如有）的 VFP，DSI 自动适应。

- VFP 同样最大只能到 1023

### 5.2 HFP 调整说明

#### DSC 模式下调整 HFP 的风险
DSC 时序寄存器是**立即生效**，而 VOP 是**帧生效**，机制不同步可能导致：
- 帧尾改变 DSC 配置会破坏当前帧时序
- DSC 内部 Buffer 溢出
- 显示异常（MIPI DPHY 无数据下发）

#### Manual 模式
**不支持**通过调整 HFP 改变 Vsync。DSC 模式下调整 HFP 显示异常。

#### Auto-Calculation 模式
- **不使能 DSC 时**：支持调整 HFP（只调整 VOP 的 HFP）
- **使能 DSC 时**：不支持调整 HFP（VOP 和 DSC 无法保证同一行起效）

### 5.3 dclk rate 调整说明

#### Manual 模式
**不支持** VOP 调整 dclk rate 来改变 Vsync 周期。

#### Auto-Calculation 模式
无论是否使能 DSC，**都支持**使用 dclk rate 调整 Vsync 周期，DSI 控制器自动调整输出。

#### 5.3.1 dclk rate 调整的变帧细节

dclk 变帧为**帧生效**。屏端 IC 内部解析 HSYNC 信息，通过统计 VFP 行数和 VBP+VSA 行数判断变帧切换。

#### 5.3.2 120 帧转 60 帧
#### 5.3.3 60 帧转 120 帧

---

## 六、eDP/DP 接口调整说明

eDP/DP 对 VRR（Variable Refresh Rate）的支持也称为 **Adaptive-Sync**。
除了控制器本身支持，还需要 DPCD/EDID 相关描述支持。

### 6.1 DPCD VRR 支持说明

MSA（Main Stream Attribute）数据包包含 timing 信息，用于 Sink 端重建时序。但 MSA 是为静态时序设计的，动态时序下 Sink 端不能使用 MSA 中的 timing。

**Source 端判断 Sink 是否支持 VRR：**
- 读取 `DOWN_STREAM_PORT_COUNT` 寄存器的 `MSA_TIMING_PAR_IGNORED` 位
- DPCD Address: `00006h`, bit6

**Source 端使能 VRR：**
- 写入 `DOWNSPREAD_CTRL` 寄存器的 `MSA_TIMING_PAR_IGNORE_EN` 位
- DPCD Address: `00107h`, bit7
- Sink 端将忽略 MSA 中的 timing 参数

### 6.2 EDID VRR 支持说明

EDID 中的 **Display Range Limit Descriptor** 描述了 VRR 支持范围。

:::caution 注意
EDID 中定义的 timing 对应的是 **vblank 和 hblank 的最小值**。
- 若 EDID VRR 范围为 30~100Hz，对于 60Hz 的 timing，实际 VRR 范围为 **30~60Hz**
- 对于 24Hz 的 timing，则不支持 VRR
- 要获取更低帧率，需要拓展 vbank
:::

### 6.3 eDP 接口 VRR 调整说明

eDP 接口支持通过**调整 VFP**调整 Vsync。

**配置方式：**
- 只需调整 VOP 的 VFP
- DTS 中配置 `analogix,force-stream-valid` 属性
- eDP 自动根据 VOP 送出的 timing 进行调整

**不支持 EDID 的屏：**
- VRR 支持范围需在 DTS 中定义

---

## 参考资料

- 原始文档：`Rockchip_RK3588_Developer_Guide_Vsync_Adjust_CN.pdf` V1.2.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
