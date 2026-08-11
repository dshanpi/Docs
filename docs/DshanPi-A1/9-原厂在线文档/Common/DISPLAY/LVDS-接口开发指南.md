---
sidebar_position: 7
---

# LVDS 接口开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_LVDS_CN.pdf`（V1.2.0, 2024-07-19）整理，介绍 Rockchip 平台 LVDS 显示接口的配置与调试方法。

:::info 适用范围
- **芯片平台**：RK3126 / RK3128 / RK3288 / RK3326 / PX30 / RK3368 / RK356X
- **内核版本**：Linux 4.4 / 4.19+
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、基础概念

LVDS（Low Voltage Differential Signaling，低电压差分信号）是一种高速串行数据传输技术。

**VESA 和 JEIDA** 组织规定了 LVDS 的数据链路传输方式。根据数据量和传输顺序分为：
- **JEIDA-18** — 18bit 位深，3 对数据线
- **JEIDA-24** — 24bit 位深，4 对数据线
- **VESA-24** — 24bit 位深，4 对数据线

**关键特性：** 一个时钟周期传输 7bit 数据。

### 1.1 JEIDA-18

3 对数据线（DATA0~DATA2），每时钟周期 7bit × 3 = 21bit：
- 6bit R + 6bit G + 6bit B + 3bit CTL = 21bit

### 1.2 JEIDA-24

4 对数据线（DATA0~DATA3），每时钟周期 7bit × 4 = 28bit：
- 8bit R + 8bit G + 8bit B + 4bit CTL = 28bit

### 1.3 VESA-24

同样 4 对数据线，但数据排列顺序与 JEIDA-24 不同。

---

## 二、电气特性

LVDS 使用差分信号传输，具有：
- 低电压摆幅（约 350mV）
- 低功耗
- 抗干扰能力强
- 支持高速传输

### RK356X 共模/差模电压配置

可通过 DTS 配置 LVDS PHY 的共模和差模电压以适应不同屏。

---

## 三、平台支持情况

| SOC | LVDS 通道 | 最大分辨率 | 数据格式 |
| :--- | :--- | :--- | :--- |
| RK3126 / RK3128 | 单通道 | 1280x800@60Hz | VESA / JEIDA |
| RK3288 | 单通道/双通道 | 单通道 1280x800 / 双通道 1920x1080 | VESA / JEIDA |
| RK3326 / PX30 | 单通道 | 1280x800@60Hz | VESA / JEIDA |
| RK3368 | 单通道 | 1280x800@60Hz | VESA / JEIDA |
| RK356X | - | - | - |

---

## 四、应用场景

### 4.1 单通道 LVDS

一个 VOP/VP 接一个单通道 LVDS 屏。

### 4.2 双通道 LVDS（Dual LVDS）

一个 VOP/VP 接一个双通道 LVDS 屏，左右半屏合并输出。

### 4.3 RK3288 Dual LVDS

RK3288 平台特有的双通道 LVDS 配置。

### 4.4 两个 VP 分别接独立单通道 LVDS

两个独立的 VP 各接一个 LVDS 屏，实现双屏异显。

### 4.5 一个 VP 接两个单通道 LVDS 屏

通过 connector-split 方式，一个 VP 驱动两个屏，各显示左右半屏。

### 4.6 Connector Mirror 模式

一个 VP 接两个相同的 LVDS 屏，输出相同内容（同显）。

---

## 五、配置示例

### 5.1 单通道 LVDS

```dts
&lvds {
    status = "okay";
};
```

Panel 节点配置 `bus-format`：
```dts
panel {
    compatible = "simple-panel";
    bus-format = <MEDIA_BUS_FMT_RGB888_1X7X4_JEIDA>;
    // ...
};
```

### 5.2 双通道 LVDS

```dts
&lvds {
    dual-channel;
    status = "okay";
};
```

| bus-format | 对应模式 |
| :--- | :--- |
| `MEDIA_BUS_FMT_RGB666_1X7X3_SPWG` | vesa-18 |
| `MEDIA_BUS_FMT_RGB888_1X7X4_SPWG` | vesa-24 |
| `MEDIA_BUS_FMT_RGB888_1X7X4_JEIDA` | jeida-24 |
| `MEDIA_BUS_FMT_RGB666_1X7X3_JEIDA` | jeida-18 |

---

## 六、调试方法

1. **检查驱动加载** — 确认 DRM 驱动是否正常 probe
2. **检查供电和复位** — 屏的上下电时序是否正确
3. **调整 bus-format** — 颜色异常时尝试不同的数据映射格式
4. **测量信号** — 用示波器测量 LVDS 差分信号
5. **确认时序参数** — 对照屏规格书确认时序

---

## 七、常见问题

### 7.1 LVDS1 通道无输出

- 检查 DTS 配置是否使能 dual-channel
- 确认硬件连接是否正常
- 检查 PHY 配置

### 7.2 Dual LVDS 输出内容模糊/有锯齿感

- 确认两个通道的同步是否正常
- 检查数据 swap 配置（`rockchip,data-swap`）
- 确认屏的左右通道是否接反

### 7.3 屏幕黑屏/白屏

- 检查供电和背光
- 检查复位时序
- 确认 link training 是否成功（如有）
- 互换 VESA/JEIDA 格式测试

### 7.4 修改 LVDS 共模/差模电压（RK356X）

在 DTS 中配置 PHY 相关属性，调整共模和差模电压参数。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_LVDS_CN.pdf` V1.2.0
- 《Rockchip_DRM_Panel_Porting_Guide.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
