---
sidebar_position: 1
---

# GMAC 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_GMAC_CN.pdf`（V1.0.0, 2021-01-16）整理，介绍 Rockchip 平台以太网 GMAC 接口的使用与调试方法。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：Linux 3.10 / 4.4 / 4.19
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、代码位置

以太网驱动包括 GMAC 控制器和 PHY 两部分：

| 模块 | 代码路径 | 说明 |
| :--- | :--- | :--- |
| GMAC 驱动 (Linux 3.10) | `driver/net/ethernet/rockchip/gmac/*` | RK 自研驱动 |
| GMAC 驱动 (4.4+) | `drivers/net/ethernet/stmicro/stmmac/*` | 通用 STMMAC 驱动 |
| PHY 驱动 | `drivers/net/phy/*` | 通用 PHY 驱动 |
| RK EPHY 驱动 | `drivers/net/phy/rockchip.c` | RK 内部 PHY |

:::note
RK322x/RK3328 自带一个百兆 PHY 芯片，使用 RK 内部 EPHY 驱动。
:::

---

## 二、DTS 配置

DTS 配置参考：`Documentation/devicetree/bindings/net/rockchip-dwmac.txt`

```dts
gmac: ethernet@ff290000 {
    compatible = "rockchip,rk3288-gmac";
    reg = <0xff290000 0x10000>;
    interrupts = <GIC_SPI 27 IRQ_TYPE_LEVEL_HIGH>;
    interrupt-names = "macirq";
    rockchip,grf = <&grf>;

    clocks = <&cru SCLK_MAC>, <&cru SCLK_MAC_RX>,
             <&cru SCLK_MAC_TX>, <&cru SCLK_MACREF>,
             <&cru SCLK_MACREF_OUT>, <&cru ACLK_GMAC>,
             <&cru PCLK_GMAC>;
    clock-names = "stmmaceth", "mac_clk_rx", "mac_clk_tx",
                  "clk_mac_ref", "clk_mac_refout",
                  "aclk_mac", "pclk_mac";

    phy-mode = "rgmii";              // 接口模式：rmii / rgmii
    clock_in_out = "input";          // 时钟方向：input / output

    pinctrl-names = "default";
    pinctrl-0 = <&rgmii_pins>;

    snps,reset-gpio = <&gpio4 7 0>;
    snps,reset-active-low;
    snps,reset-delays-us = <0 10000 1000000>;

    tx_delay = <0x30>;               // RGMII TX 延时
    rx_delay = <0x10>;               // RGMII RX 延时

    status = "okay";
};
```

### 板级配置关注项

| 配置项 | 说明 |
| :--- | :--- |
| `phy-mode` | 接口模式，主要分为 RMII 和 RGMII |
| `snps,reset-gpio` | PHY 硬件复位脚 |
| `snps,reset-delays-us` | 复位时序（三个时间分别对应复位不同阶段） |
| `phy-supply` | PHY 电源（常供可不配） |
| 时钟配置 | 参考 GMAC Mode Configuration 文档 |
| `pinctrl` | RGMII/RMII 引脚配置不同，时钟输出引脚驱动强度可能不同 |
| `tx_delay` / `rx_delay` | RGMII 模式下的延时线配置 |

---

## 三、PHY 寄存器读写调试

驱动提供了 sysfs 接口读写 PHY 寄存器，路径：`/sys/bus/mdio_bus/devices/stmmac-0:00`（`0:00` 表示 PHY 地址 0）。

### 3.1 Linux 3.10

**写寄存器：**
```bash
echo 0x00 > /sys/bus/mdio_bus/devices/stmmac-0:00/phy_reg
echo 0xabcd > /sys/bus/mdio_bus/devices/stmmac-0:00/phy_regValue
```

**读寄存器：**
```bash
echo 0x00 > /sys/bus/mdio_bus/devices/stmmac-0:00/phy_reg
cat /sys/bus/mdio_bus/devices/stmmac-0:00/phy_regValue
```

### 3.2 其他内核版本（4.4+）

**写寄存器：**
```bash
echo 0x00 0xabcd > /sys/bus/mdio_bus/devices/stmmac-0:00/phy_registers
```

**读寄存器：**
```bash
cat /sys/bus/mdio_bus/devices/stmmac-0:00/phy_registers
```
该命令读取 0~31 所有寄存器。

---

## 四、MAC 地址

MAC 地址读取策略（优先级从高到低）：

1. **DTB 中的 MAC 地址**（U-Boot 也会写入）
2. **IDB 或 Vendor Storage 中烧写的 MAC 地址**（若符合规范则使用）
3. **随机生成**（不符合规范或没有时使用）

**RK3399、RK3328/RK3228H 及以后版本：**
- 优先使用 IDB 或 Vendor Storage 中的 MAC 地址
- 若没有，随机生成并保存到 Vendor 分区，重启/恢复出厂不丢失

**烧写工具：** 参考《Rockchip_User_Guide_RKDevInfoWriteTool_CN.pdf》

---

## 五、回环测试

回环测试有两种：
- **PHY 回环（phy_lb）** — 在 PHY 层回环
- **MAC 回环（mac_lb）** — 在 MAC 层回环

具体参考《GMAC RGMII Delayline 开发指南》中的相关说明。

---

## 六、RGMII Delayline

RGMII 接口提供 TX 和 RX 的 delayline，用于调整时序。获取合适的 delayline 方法参考《GMAC RGMII Delayline 开发指南》。

---

## 七、LED 灯

PHY 有各自的 LED 控制方式：

**RK3228：** 需要打补丁 `kernel_4.4_rk322x_phy_led_control.patch`

**RK3328：** 通过 DTS 配置 iomux，例如用 RX 和 LINK 控制 LED：

```dts
phy: phy@0 {
    compatible = "ethernet-phy-id1234.d400", "ethernet-phy-ieee802.3-c22";
    reg = <0>;
    clocks = <&cru SCLK_MAC2PHY_OUT>;
    resets = <&cru SRST_MACPHY>;
    pinctrl-names = "default";
    pinctrl-0 = <&fephyled_rxm1 &fephyled_linkm1>;
    phy-is-integrated;
};
```

外部 PHY 请参考对应 datasheet。

---

## 八、WOL（Wake On Lan）

网络唤醒功能，不同 PHY 配置寄存器不同。目前收录补丁包含：
- RTL8211E/F
- RTL8201F

---

## 九、MAC To MAC 直连

参考《Rockchip_Developer_Guide_Linux_MAC_TO_MAC_CN.pdf》。

---

## 十、Jumbo Frame（巨帧）

从 RV1126/1109 芯片开始支持 9K Jumbo Frame，需将 MTU 配置为 9000。

测试示例：
```bash
ping -s 9000 192.168.1.100
```

---

## 十一、PTP1588

从 RV1126/1109 开始支持 PTP（Precision Time Protocol）1588。

使用 `ptp4l` 工具进行测试，支持 Master/Slave 模式。

---

## 十二、硬件信号测试

测试 RGMII 接口信号质量：
- RX_CLK / MAC_CLK
- TX_CLK
- 占空比、幅度、上升下降时间

---

## 十三、问题分析

### 13.1 DMA Initialization Failed

DMA 初始化失败，检查内存映射和时钟配置。

### 13.2 PHY 初始化失败

- 检查 PHY 复位时序
- 检查 PHY 地址是否正确
- 检查 MDIO 通信

### 13.3 Link 问题

- 检查网线是否插好
- 检查 PHY 自动协商是否完成
- 检查时钟配置

### 13.4 数据不通

#### TX（发送）
- 检查 TX descriptor
- 检查 DMA 是否正常

#### RX（接收）
- 检查 RX descriptor
- 检查中断是否正常

### 13.5 TX queue0 timeout

发送队列超时，通常与 DMA 或中断配置有关。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_GMAC_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_Linux_GMAC_Mode_Configuration_CN.pdf》
- 《Rockchip_Developer_Guide_Linux_GMAC_RGMII_Delayline_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
