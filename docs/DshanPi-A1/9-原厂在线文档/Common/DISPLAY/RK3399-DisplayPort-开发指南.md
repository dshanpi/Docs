---
sidebar_position: 17
---

# RK3399 DisplayPort 开发指南

本文档基于瑞芯微官方文档 `Rockchip_RK3399_Developer_Guide_DisplayPort_CN.pdf`（V1.0.0, 2024-06-25）整理，介绍 RK3399 平台 DisplayPort 接口的使用与调试方法。

:::info 适用范围
- **芯片平台**：RK3399
- **内核版本**：Linux kernel 4.4 及以上
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、RK3399 平台 DP 简介

### 1.1 功能简介

| 功能 | RK3399 |
| :--- | :--- |
| Version | 1.2 |
| SST | Support |
| MST | Not Support |
| DSC | Not support |
| Max resolution | 4K@60Hz |
| Main-Link lanes | 1/2/4 lanes |
| Main-Link rate | 5.4/2.7/1.62 Gbps/lane |
| AUX_CH | 1M |
| Color Format | RGB/YUV444/YUV422 |
| Color Depth | 8/10 bit |
| Type-C support | Support |
| I2S | Support |
| SPDIF | Support |

### 1.2 DP 与 VOP 和 PHY 的连接关系

RK3399 有两个 VOP：**VOPB**（大）和 **VOPL**（小），DP 可选择其中一个作为输入源：

| VOP | 最大分辨率 |
| :--- | :--- |
| VOPB | 4096x2160@60Hz |
| VOPL | 2650x1600@60Hz |

DP 输出 PHY 有两个可选：**UPHY0** 和 **UPHY1**，同一时间只能使用一个。

### 1.3 代码路径

**Kernel 驱动代码：**
```
# Controller
drivers/gpu/drm/rockchip/cdn-dp-core.c
drivers/gpu/drm/rockchip/cdn-dp-core.h
drivers/gpu/drm/rockchip/cdn-dp-link-training.c
drivers/gpu/drm/rockchip/cdn-dp-reg.c
drivers/gpu/drm/rockchip/cdn-dp-reg.h

# PHY
drivers/phy/rockchip/phy-rockchip-typec.c
```

**参考 DTS：**
```
arch/arm64/boot/dts/rockchip/rk3399-evb-ind.dtsi
```

### 1.4 驱动加载

RK3399 DP 内部有一个微控制器，工作前需加载固件：

```
固件位置：/lib/firmware/rockchip/dptx.bin
```

**加载成功日志：**
```
rockchip-drm display-subsystem: bound fec00000.dp (ops cdn_dp_component_ops)
```

---

## 二、功能配置

DP 和 USB3.0 共用 Type-C PHY，有两种配置模式：
- **DP Alt Mode（Type-C）** — 通过 PD 协商
- **Legacy Mode（DP 标准口）** — 固定配置

### 2.1 DP Alt Mode（Type-C）

#### 2.1.1 TCPM 架构配置

基于 TCPM（Type-C Port Manager）架构的 PD 芯片驱动，通过回调函数把 HPD 信息通知到 PHY 驱动和 DP 控制器驱动。

#### 2.1.2 EXTCON 机制配置

通过 extcon 框架传递 Type-C 状态。

### 2.2 Legacy Mode（DP 标准口）

#### 2.2.1 DP Lane 映射

Type-C PHY Lane 与 Pin 对应关系：

| PHY Lanes/Module Pins | TypeC Receptacle Pins |
| :--- | :--- |
| Lane0 (tx_p/m_ln_0) | TX1+/TX1- (pins A2/A3) |
| Lane1 (tx_rx_p/m_ln_1) | RX1+/RX1- (pins B11/B10) |
| Lane2 (tx_rx_p/m_ln_2) | RX2+/RX2- (pins A11/A10) |
| Lane3 (tx_p/m_ln_3) | TX2+/TX2- (pins B2/B3) |

**DP Alt Mode 映射（Normal）：**

| PHY Lanes | C | D | E |
| :--- | :--- | :--- | :--- |
| 0 | ML2 | SSTX | ML2 |
| 1 | ML3 | SSRX | ML3 |
| 2 | ML0 | ML0 | ML0 |
| 3 | ML1 | ML1 | ML1 |

**Flip 映射：**

| PHY Lanes | ... |
| :--- | :--- |
| 0 | ... |
| 1 | ... |
| 2 | ... |
| 3 | ... |

#### 2.2.2 HPD 通知补丁

DP 标准口通过虚拟 PD 驱动把 HPD Pin 的检测信息通知到 PHY 和 DP 控制器。

#### 2.2.3 DTS 配置

##### Kernel 5.10 及以上版本
##### Kernel 4.19 及以下版本

### 2.3 DP 开机 Logo

---

## 三、常用 DEBUG 方法

### 3.1 查看 connector 状态

```bash
cat /sys/kernel/debug/dri/0/summary
```

### 3.2 强制使能/禁用 DP

```bash
echo on > /sys/class/drm/card0-DP-1/status
echo off > /sys/class/drm/card0-DP-1/status
```

### 3.3 DPCD 读写

通过 debugfs 节点读取 DPCD 寄存器。

### 3.4 Type-C 接口 Debug

- 检查 PD 协商状态
- 检查 orientation switch
- 检查 lane 映射

### 3.5 查看 VOP 状态

```bash
cat /sys/kernel/debug/dri/0/summary
```

### 3.6 调整 DRM log 等级

```bash
echo 0x1f > /sys/module/drm/parameters/debug
```

---

## 四、PHY 信号调整

### 4.1 电压幅值寄存器
### 4.2 加重寄存器
### 4.3 boost 寄存器
### 4.4 scale 寄存器
### 4.5 调试方法
### 4.6 代码配置

---

## 五、FAQ

### 5.1 I2C-over-AUX 支持

---

## 参考资料

- 原始文档：`Rockchip_RK3399_Developer_Guide_DisplayPort_CN.pdf` V1.0.0
- 《Rockchip_Developer_Guide_DisplayPort_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
