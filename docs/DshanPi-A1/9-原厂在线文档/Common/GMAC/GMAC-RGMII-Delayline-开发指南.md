---
sidebar_position: 3
---

# GMAC RGMII Delayline 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_GMAC_RGMII_Delayline_CN.pdf`（V1.2.0, 2021-12-28）整理，介绍 Rockchip 平台 RGMII 接口 Delayline 的调试方法。

:::info 适用范围
- **芯片平台**：所有支持千兆以太网的 Rockchip 芯片
- **内核版本**：所有版本
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

Rockchip 芯片千兆以太网使用 RGMII 接口，为兼容不同硬件带来的信号差异，芯片内置了 **TX/RX RGMII delayline** 可调功能。

只要硬件有差别，都需要重新配置 delayline，否则会影响千兆性能甚至导致网络无法正常工作。

---

## 二、RGMII Delayline 获取步骤

### 2.1 代码确认

驱动实现位于：`drivers/net/ethernet/stmicro/stmmac/dwmac-rk-tool.c`

| 内核版本 | 说明 |
| :--- | :--- |
| Kernel 4.19+ | 代码已包含，无需补丁 |
| Kernel 4.4 | 需打补丁 `Rockchip_RGMII_Delayline_Kernel4.4.tar.gz` |
| Kernel 3.10 | 需打补丁 `Rockchip_RGMII_Delayline_Kernel3.10.tar.gz` |

### 2.2 节点确认

编译烧写后，在 `/sys/devices/platform/xxxxx.ethernet/` 目录下可以看到相关 sysfs 节点。

### 2.3 使用方法

:::caution 注意
使用 RTL8211E PHY 时，测试前需要拔掉网线。
:::

#### 2.3.1 扫描 delayline 窗口

通过 phy_lb_scan 节点扫描（PHY 回环模式）：

```bash
# 千兆扫描
echo 1000 > phy_lb_scan

# 百兆扫描
echo 100 > phy_lb_scan
```

**结果说明：**
- 横轴：TX 方向 delayline（范围 0x00 ~ 0x7f）
- 纵轴：RX 方向 delayline（范围 0x00 ~ 0x7f）
- "O" 表示该点 pass，空白表示 fail
- 最后会打印中心点坐标

百兆窗口通常很大（对信号要求低），以千兆扫描结果为准。

#### 2.3.2 测试扫描出来的中间值

```bash
# 配置 delayline
echo <tx_delay> <rx_delay> > rgmii_delayline

# 确认配置
cat rgmii_delayline

# PHY 回环测试
echo 1000 > phy_lb
```

测试 pass 后，将值填入 DTS：

```dts
&gmac {
    phy-supply = <&vcc_lan>;
    clock_in_out = "output";
    phy-mode = "rgmii";
    tx_delay = <0x2e>;    // 填入扫描到的 TX 延时
    rx_delay = <0x0f>;    // 填入扫描到的 RX 延时
    status = "okay";
};
```

重新烧入固件后，继续 ping 或 iperf 性能测试验证。

#### 2.3.3 自动扫描

如果一组 delayline 无法适配所有板子（窗口太小、硬件一致性差），可打开自动扫描功能：

```
Device Drivers →
  Network device support →
    Ethernet driver support →
      [*] Auto search rgmii delayline
      (CONFIG_DWMAC_RK_AUTO_DELAYLINE)
```

**工作原理：**
- 仅在第一次开机时探测一次
- 探测结果存储到 vendor storage
- 后续开机直接从 vendor storage 读取，覆盖 DTS 配置
- vendor storage 被擦除后才会重新探测

**日志：**
```
# 第一次开机
[ 23.532138] Find suitable tx_delay = 0x2f, rx_delay = 0x10

# 之后开机
[ 23.092358] damac rk read rgmii dl from vendor tx: 0x2f, rx: 0x10
```

:::note
如果窗口太小，打开自动扫描也不能完全解决问题，建议先优化硬件。
:::

### 2.4 rgmii-rxid 模式

当硬件启用了 PHY 端的 RX delay（如 RTL8211F），需要关闭主控的 RX delay：

```dts
&gmac0 {
    phy-mode = "rgmii-rxid";     // RX delay 由 PHY 提供
    clock_in_out = "output";
    tx_delay = <0x43>;           // 只配置 TX delay
    /* rx_delay = <0x42>; */     // 注释掉 RX delay
    status = "okay";
};
```

扫描方法相同，但此时只扫描 TX delay，RX delay 由 PHY 硬件固定（一般 2ns）。

---

## 三、硬件

### 3.1 测试 RGMII 接口的指标

按照 RGMII 协议，需满足时序要求。测量时注意：
- 在靠近**接收端**测量（发送端反射严重，波形不能反映实际质量）
- 测量信号：MAC_CLK、TX_CLK、RX_CLK
- 关注指标：占空比、幅度、上升下降时间
- 示波器带宽：大于 125M 的 5 倍
- 推荐差分探头；单端探头注意接地回路尽量短
- 占空比应控制在 **45% ~ 55%** 之间
- 信号应为方波而非正弦波

#### 3.1.1 RX_CLK / MAC_CLK

MAC_CLK / RX_CLK 由 PHY 提供。若信号完整性有问题：
- 发送端串高频电感改善边沿过缓（需满足带宽）
- 发送端电阻分压降低幅值调整占空比

#### 3.1.2 TX_CLK

TX_CLK 有问题时：
- 检查 IO 驱动强度是否调至最大
- 串高频电感改善边沿
- 增大 22ohm 串联电阻
- 占空比问题：分压 MAC_CLK 幅度调整 TX_CLK 占空比（串 100ohm + 下地电阻，阻值因板而异）
- 条件允许时，将 IO 电源从 3.3V 改为 1.8V（1.8V 信号指标更好，**推荐使用 1.8V IO**）

---

## 四、FAQ

### 4.1 窗口大小

窗口越大越好，表明硬件信号好、冗余度大。
扫描不到窗口或窗口太小，一般是硬件问题，参考硬件章节优化。

### 4.2 PHY 的选型

- 无特殊要求，符合 RGMII 协议即可
- **建议 RTL8211E 换成 RTL8211F 或其他 PHY**（信号质量更好）
- PHY 没有 loopback 功能时，需用示波器测量相位来调试：
  - TX：用大于 125M 5 倍带宽的示波器，在 PHY 端测 TXC 与 TXD 相位差，调整到 1.5~2ns
  - RX：在 tx_delay 确定后，通过吞吐量判断 rx_delay，从 0x10 开始以 5 步进调整，找到 900M+ 区间后取中间值

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_GMAC_RGMII_Delayline_CN.pdf` V1.2.0
- 《Rockchip_Developer_Guide_Linux_GMAC_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
