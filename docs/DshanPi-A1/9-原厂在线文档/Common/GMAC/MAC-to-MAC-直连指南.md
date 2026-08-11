---
sidebar_position: 5
---

# MAC to MAC 直连指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_MAC_TO_MAC_CN.pdf`（V1.0.0, 2020-09-21）整理，介绍两个 MAC 直连（无需 PHY）的方案。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：所有版本
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

MAC to MAC 直连方案适用于：
- 两个 AP 之间通过 MAC 直接相连
- AP 的 MAC 与 SWITCH 的 MAC 相连

**优势：** 节省两个 PHY 的成本。

分为 **RMII** 和 **RGMII** 两种连接方式。

---

## 二、RMII 直连

### 2.1 硬件连接

```
MAC0                        MAC1
TXD[1:0]  ----------------  RXD[1:0]
TX_EN     ----------------  RX_DV
REF_CLK   ----------------  REF_CLK
RXD[1:0]  ----------------  TXD[1:0]
RX_DV     ----------------  TX_EN
RX_ERR    ----------------  GND
GND       ----------------  RX_ERR
```

**注意：** RX_ERR 需要接地。

### 2.2 软件配置

一端配置为时钟输出（提供 50M），另一端配置为时钟输入。

**示例：RV1126 输出 50M，PX30 输入模式**

**RV1126（时钟输出端）：**
```dts
&gmac {
    phy-mode = "rmii";
    clock_in_out = "output";
    // ...
};
```

**PX30（时钟输入端）：**
```dts
&gmac {
    phy-mode = "rmii";
    clock_in_out = "input";
    // ...
};
```

### 2.3 测试结果

#### 2.3.1 TCP 测试
#### 2.3.2 UDP 测试
#### 2.3.3 PING 测试

---

## 三、RGMII 直连

### 3.1 硬件连接

RGMII 直连需要交叉连接 TX/RX 信号和时钟。

### 3.2 软件配置

两端均配置为 `rgmii` 模式，一端输出时钟，一端输入时钟。

### 3.3 Delayline 配置

RGMII 直连也需要配置 delayline，参考《GMAC RGMII Delayline 开发指南》进行调试。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_MAC_TO_MAC_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_Linux_GMAC_CN.pdf》
- 《Rockchip_Developer_Guide_Linux_GMAC_RGMII_Delayline_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
