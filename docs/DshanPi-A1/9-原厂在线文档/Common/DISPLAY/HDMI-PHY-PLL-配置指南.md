---
sidebar_position: 15
---

# HDMI-PHY-PLL 配置指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_HDMI-PHY-PLL_Config_CN.pdf`（V1.1.0, 2020-04-09）整理，介绍 RK322X/RK3328 芯片 HDMI PHY PLL 的计算方法与新增配置步骤。

:::info 适用范围
- **芯片平台**：RK322X / RK3328
- **内核版本**：所有内核版本（3.10 / 4.4 / 4.19）
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

RK322X/RK3328 芯片的 HDMI PHY PLL 除供 HDMI PHY 使用外，还作为显示时钟源，供 HDMI/CVBS/VOP 使用。

当需要增加特殊分辨率支持时，需要新增 PHY PLL 配置，以便 PHY 能输出对应时钟频率。

---

## 二、PHY 配置计算说明

PLL 计算分为两部分：**PRE-PLL** 和 **POST-PLL**。

### 2.1 PRE-PLL 计算过程

参考时钟 F_REF 为 **24MHz**。

PRE-PLL 的 VCO 频率由以下参数控制：
- `pre-pll-pre-divider[5:0]` — 预分频
- `pre-pll-feedback-divider[11:0]` — 反馈分频
- `pre-pll-fractional-feedback-divider[23:0]` — 小数反馈分频（仅 RK3328 支持浮点运算）

**输出时钟：**

| 时钟 | 控制参数 | 说明 |
| :--- | :--- | :--- |
| F_TX3 (TMDS Clock) | `tmds-dividera[1:0]` + `tmds-dividerb[1:0]` | HDMI 输出的 TMDS 时钟 |
| F_pin_hdmi20_tmdsclk | `tmds-dividera[1:0]` + `tmds-dividerc[1:0]` | TMDS 时钟 |
| F_pin_hdmi20_prepclk | - | PIXEL 时钟的预分频 |
| F_pin_hdmi20_pclk | 1~10 倍分频 | PIXEL 时钟 |

**注意事项：**

1. `pin_hd20_pclk` 频率由 `pin_hd20_prepclk` 以 1~10 的倍数分频得到。no-repeating 模式下两者相等。
2. 8-bit 色深下 `pin_hd20_prepclk` 与 `pin_hd20_tmdsclk` 频率相等；10-bit 色深下 `pin_hd20_tmdsclk` = 1.25 × `pin_hd20_prepclk`。
3. 非 4K-YUV420 场景下 `pin_hd20_pclk` 与 `pin_hd20_prepclk` 相等；4K-YUV420 场景下 `pin_hd20_pclk` 是 `pin_hd20_prepclk` 的两倍。

### 2.2 POST-PLL 计算过程

POST-PLL 用来产生差分串行时钟，频率 F_diff-sclk 总是 `pin_hdmi20_tmdsclk` 的 **五倍**。

- 当 `post-pll-post-divider` 未使能时，F_diff-sclk 与 F_post-VCO 相等
- 否则按公式计算

**重要：**
- VCO 频率必须在 **1.4~3.0GHz** 之间（实际最大可放宽到 3.2GHz）
- Linux 4.4/4.19 内核的 `post_pll_cfg_table` 已包含所有场景，无需另行添加
- Linux 3.10 内核需要根据 TMDS CLOCK 区间和芯片版本选用对应配置

### 2.3 计算工具的使用

使用 `cal_innophy` 工具计算 PRE-PLL 配置（可通过 RK 技术支持窗口获取）。

```bash
cal_innophy <pixel_clock> <tmds_clock> <use_fractional>
```

**参数说明：**

| 参数 | 示例 | 说明 |
| :--- | :--- | :--- |
| pixel_clock | 148500000 | PIXEL CLOCK (Hz) |
| tmds_clock | 185625000 | TMDS CLOCK (Hz) |
| use_fractional | 0 或 1 | 是否使用浮点计算（RK322X 不支持，只能为 0） |

:::tip 建议
优先使用整数计算（参数为 0），整数计算不出时再设置为 1。
:::

**计算结果示例：**
```
148500000, 185625000, 4, 495, 0, 2, 2, 1, 3, 2, 2, 0, 0x816817
```

| 序号 | 值 | 含义 |
| :--- | :--- | :--- |
| 1 | 148500000 | pixel clock |
| 2 | 185625000 | tmds clock |
| 3 | 4 | pre-pll-pre-divider |
| 4 | 495 | pre-pll-feedback-divider |
| 5 | 0 | tmds-dividera |
| 6 | 2 | tmds-dividerb |
| 7 | 2 | tmds-dividerc |
| 8 | 1 | tmds-dividerd |
| 9 | 3 | pclk-dividera |
| 10 | 2 | pclk-dividerb |
| 11 | 2 | pclk-dividerc |
| 12 | 0 | pclk-dividerd |
| 13 | 0x816817 | pre-pll-fractional-feedback-divider |

:::note
本工具只计算 PRE-PLL 配置。POST-PLL 配置在驱动表中已包含。
:::

**POST-PLL 注意事项：**
- TMDS CLOCK ≤ 74.25MHz 时，RK322X 和 RK3328 早期样片配置一致
- RK3328 量产芯片配置有差异，需区分芯片版本

---

## 三、代码中新增 PHY 配置说明

PHY 配置保存在 TABLE 中，根据当前分辨率的 PIXEL CLOCK 和 TMDS CLOCK 选择对应配置。

:::caution 注意
相同分辨率的不同色深模式配置不同（TMDS CLOCK 不同），如需同时支持 8-bit 和 10-bit，需添加两项配置。
:::

### 3.1 Linux 3.10 内核

**驱动路径：**
```
kernel/drivers/video/rockchip/hdmi/rockchip-hdmiv2/rockchip_hdmiv2_hw.c
```

包含两个 TABLE：

| TABLE | 适用场景 |
| :--- | :--- |
| `RK322XH_V1_PLL_TABLE` | TMDS CLOCK ≤ 74.25MHz 且使用 RK3328 量产芯片 |
| `EXT_PLL_TABLE` | TMDS CLOCK &gt; 74.25MHz（RK3328 早期样片 + RK322X） |

### 3.2 Linux 4.4/4.19 内核

POST-PLL 配置已包含在 `post_pll_cfg_table` 中，驱动自动查找合适配置，无需另行添加。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_HDMI-PHY-PLL_Config_CN.pdf` V1.1.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
