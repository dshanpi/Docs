---
sidebar_position: 2
---

# GMAC 模式配置指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_GMAC_Mode_Configuration_CN.pdf`（V1.4.0, 2024-04-26）整理，介绍 Rockchip 各平台以太网 GMAC 在不同模式下的配置方法。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片（含 RK3576/RK3588/RK3568 等）
- **内核版本**：所有版本
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、RGMII 模式

一般使用主控 PLL 输出时钟（output 方式），PHY 提供 125M 时钟（input 方式）为备选方案。

### 1.1 PLL output 125M for TX_CLK, Crystal 25M for PHY

- 主控 PLL 提供 TX_CLK 所需 125M 时钟
- PHY 25M 时钟由外部晶振提供

### 1.2 PLL output 125M for TX_CLK, PLL 25M for PHY

- 主控 PLL 提供 TX_CLK 125M
- PHY 25M 时钟也由主控 PLL 输出

### 1.3 125M TX_CLK input from PHY, PLL 25M for PHY

- TX_CLK 由 PHY 提供（125M）
- PHY 25M 时钟由主控提供

### 1.4 125M TX_CLK input from PHY, Crystal 25M for PHY

- TX_CLK 由 PHY 提供（125M）
- PHY 25M 时钟由外部晶振提供

---

## 二、RMII 模式

### 2.1 RMII Clock Output

主控提供 RMII 所需 50M 时钟。

### 2.2 RMII Clock Input

PHY 提供 RMII 所需 50M 时钟。

:::note
RMII 模式下，PHY 的 25M 晶振也可以由主控输出 25M 替代。
:::

---

## 三、各芯片模式配置

不同模式配置包含 phy-mode、clock 和 pinctrl 三部分，必须同时配置。

### 3.1 RK3588 / RK3576

#### 3.12.1 RMII Clock Output
#### 3.12.2 RMII Clock Input
#### 3.12.3 RGMII PLL output 25M for PHY, PLL output 125M for TX_CLK
#### 3.12.4 RGMII PLL output 25M for PHY, RGMII_CLK input 125M for TX_CLK
#### 3.12.5 RGMII Crystal 25M for PHY, PLL output 125M for TX_CLK
#### 3.12.6 RGMII Crystal 25M for PHY, RGMII_CLK input 125M for TX_CLK

### 3.2 RK3568

| 模式 | 说明 |
| :--- | :--- |
| RMII Clock Output | RMII 时钟输出 |
| RMII Clock Input | RMII 时钟输入 |
| RGMII (多种时钟方案) | RGMII 各种时钟配置 |
| SGMII | SGMII 模式 |
| QSGMII | QSGMII 模式 |

### 3.3 其他芯片

本文档还详细列出了以下芯片的各种模式配置：
- PX30 / RK1808 / RK3128 / RK3228 / RK3288 / RK3328 / RK3368 / RK3399
- RK3528 / RK3562
- RV1108 / RV1126

**配置通用模板（RMII Clock Output 为例）：**

```dts
&gmac {
    phy-supply = <&vcc_phy>;
    clock_in_out = "output";
    assigned-clocks = <&cru SCLK_MAC>;
    assigned-clock-rates = <50000000>;
    snps,reset-gpio = <&gpio2 13 GPIO_ACTIVE_LOW>;
    snps,reset-active-low;
    snps,reset-delays-us = <0 50000 50000>;
    pinctrl-names = "default";
    pinctrl-0 = <&rmii_pins &mac_refclk_12ma>;
    status = "okay";
};
```

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_GMAC_Mode_Configuration_CN.pdf` V1.4.0
- 《Rockchip_Developer_Guide_Linux_GMAC_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
