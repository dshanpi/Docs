---
sidebar_position: 1
---

# DRM Display Driver 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_DRM_Display_Driver_CN.pdf`（V4.5.0, 2024-09-10）整理，介绍 Rockchip 平台 DRM 显示驱动框架、VOP 特性、各显示接口以及常见问题分析。

:::info 适用范围
- **芯片平台**：全系列 Rockchip 芯片（RK3036 ~ RK3576/RK3506）
- **内核版本**：Linux kernel 4.4 / 4.19 / 5.10 / 6.1
- **读者对象**：技术支持工程师、软件开发工程师、硬件开发工程师
:::

---

## 一、显示子系统（DSS）概述

显示子系统（DSS）是 Rockchip 平台显示输出相关软硬件系统的统称，包括：
- **VOP**（Video Output Processor，老平台叫 LCDC）
- **显示接口**：RGB、BT1120、BT656、I8080（MCU）、LVDS、MIPI DSI、eDP、DP、HDMI 等
- **图形加速模块**：RGA（2D 加速）、GPU（3D 渲染）、VPU（视频解码）

### VOP 1.0 vs VOP 2.0 架构

| 架构 | 多显方式 | 代表芯片 |
| :--- | :--- | :--- |
| **VOP 1.0** | 多个独立 VOP，每个 VOP 输出一路时序 | RK3288、RK3399、PX30 |
| **VOP 2.0** | 统一架构，单个 VOP + 多路 Video Port（VP） | RK356X、RK3588、RK3576、RK3528、RK3562 |

**数据流**：GPU/RGA/VPU 处理 → DDR 内存 → VOP 读取（Alpha 叠加、CSC、Gamma、HDR）→ 显示接口（HDMI/DP/DSI/RGB/LVDS）→ 屏幕

---

## 二、DRM 概述

DRM（Direct Rendering Manager）负责显示输出管理、buffer 分配、帧缓冲。用户空间库为 **libdrm**，设备节点为 `/dev/dri/cardX`。

:::note 注意
Rockchip 平台上显示子系统和 NPU 驱动都使用 DRM 框架，会有两个 card 节点（`card0` 和 `card1`），编号与驱动加载顺序有关。
:::

### 2.1 基本概念

| DRM 概念 | Rockchip 对应 | 说明 |
| :--- | :--- | :--- |
| **CRTC** | VOP / Video Port | 显示控制器 |
| **Plane** | VOP win 图层 | 图层（支持多种格式和缩放） |
| **Encoder** | RGB/LVDS/DSI/eDP/DP/HDMI 等 | 输出转换器 |
| **Connector** | 屏连接接口 | encoder 与 panel 之间的接口 |
| **Bridge** | 转换芯片（如 DSI2HDMI） | 桥接设备 |
| **Panel** | 各种 LCD 屏 | 显示设备抽象 |
| **GEM** | DRM buffer 分配 | 类似 ION/DMA BUFFER |

### 2.2 如何准确打开 DRM 显示设备

1. 使用 `drmIsKMS(int fd)` 检查设备是否支持显示功能（NPU 设备不支持）
2. 使用 `drmOpen("rockchip", NULL)` 强制指定打开 rockchip DRM 驱动

---

## 三、软件驱动

### 3.1 U-Boot 驱动

U-Boot 显示驱动主要功能：
- **开机 Logo 显示**（U-Boot Logo + Kernel Logo 两阶段）
- **充电界面显示**

#### 驱动目录
```
drivers/video/drm/
```

#### 主要 API

| 函数 | 功能 |
| :--- | :--- |
| `rockchip_show_logo()` | 显示 U-Boot logo |
| `rockchip_show_bmp(const char *bmp)` | 显示指定 bmp 图片（充电 logo） |
| `rockchip_display_fixup(void *blob)` | 传递显示参数给内核（logo 地址、时序等） |

#### 开启 U-Boot Logo

在板级 dts 中找到对应接口的 `route_xxx` 节点，设置 `status = "okay"`：

```dts
&route_dsi0 {
    status = "okay";
    connect = <&vp3_out_dsi0>;
};
```

**Logo 图片要求：**
- U-Boot logo 和 Kernel logo 分辨率必须相同，且为偶数
- 支持 8bit/16bit/24bit/32bit BMP 格式
- 两张图必须同时提供（`logo.bmp` 和 `logo_kernel.bmp`）
- 默认居中（center）显示，可配置 `logo,mode = "fullscreen"` 全屏

#### 启动 log 确认

正常启动会有类似 log：
```
Rockchip UBOOT DRM driver version: v1.0.1
VOP update mode to: 1920x1080p0, type: HDMI0 for VP0
VOP VP0 enable Esmart0[654x270->654x270@633x405] fmt[2] addr[0xedf04000]
```

#### U-Boot → Kernel Logo 闪屏问题排查

1. **DRM 驱动加载问题** — 确认最终出现 `fb0: rockchipdrmfb frame buffer device`
2. **DDR 变频** — 关闭 `&dmc` 或设置 `vop-dclk-mode = &lt;1&gt;`
3. **clk tree 变化** — U-Boot 与内核 clk 策略不一致
4. **时钟被关闭** — bootargs 加 `clk_ignore_unused`
5. **logo 图片大小不一致** — 确认 `logo.bmp` 和 `logo_kernel.bmp` 分辨率一致
6. **电源 GPIO 冲突** — 检查显示相关 GPIO 是否被其他模块复用
7. **VOP 优先级** — 总线被其他 IP 抢占

---

### 3.2 Kernel 驱动

#### 驱动目录

```
drivers/gpu/drm/rockchip/      # 核心驱动
drivers/gpu/drm/bridge/         # 桥接芯片驱动
drivers/phy/rockchip/           # PHY 驱动
```

#### 主要驱动文件

| 模块 | 文件 |
| :--- | :--- |
| **Driver Core** | rockchip_drm_drv.c, rockchip_drm_fb.c, rockchip_drm_gem.c, rockchip_drm_logo.c |
| **VOP** | rockchip_drm_vop.c, rockchip_vop_reg.c, rockchip_drm_vop2.c, rockchip_vop2_reg.c |
| **RGB** | rockchip_rgb.c |
| **LVDS** | rockchip_lvds.c |
| **MIPI-DSI** | dw-mipi-dsi.c, dw-mipi-dsi2-rockchip.c |
| **eDP** | analogix_dp_core.c, analogix_dp-rockchip.c |
| **DP** | cdn-dp-core.c, dw-dp.c |
| **HDMI** | inno_hdmi.c, dw-hdmi.c, dw_hdmi-rockchip.c, dw-hdmi-qp.c |
| **TVE/CVBS** | rockchip_drm_tve.c |

#### 驱动加载流程

DRM 驱动利用 Linux 的 **deferred probe** 机制处理模块依赖。当依赖资源未就绪时返回 `-EPROBE_DEFER`，内核稍后重试。

成功加载标志：
```
[2.532850] [drm] Initialized rockchip 3.0.0 20140818 for display-subsystem on minor 0
```

---

### 3.3 DTS 配置

#### 3.3.1 基础配置

**display_subsystem 节点** 控制整个 DRM 驱动：

```dts
display_subsystem: display-subsystem {
    compatible = "rockchip,display-subsystem";
    memory-region = <&drm_logo>, <&drm_cubic_lut>;
    memory-region-names = "drm-logo", "drm-cubic-lut";
    ports = <&vop_out>;
    devfreq = <&dmc>;

    route {
        route_hdmi: route-hdmi {
            status = "disabled";
            logo,uboot = "logo.bmp";
            logo,kernel = "logo_kernel.bmp";
            logo,mode = "center";
            charge_logo,mode = "center";
            connect = <&vp1_out_hdmi>;
        };
        // ... 其他接口 route 节点
    };
};
```

**route_xxx 节点属性：**
- `logo,uboot` / `logo,kernel` — U-Boot/Kernel 阶段 logo 文件名
- `logo,mode` — 显示模式：`center`（居中）或 `fullscreen`（全屏）
- `connect` — 连接到 VOP 的哪个 VP

#### 3.3.2 VOP 与显示接口连接

VOP 的 `vop_out: ports` 节点描述 VP 与显示接口的连接关系。每个 VP 下有多个 endpoint，通过 `remote-endpoint` 与接口互连。

**典型配置（HDMI 连接到 VP0）：**
```dts
&hdmi {
    status = "okay";
};

&hdmi_in_vp0 {
    status = "okay";
};

&hdmi_in_vp1 {
    status = "disabled";
};

&route_hdmi {
    status = "okay";
    connect = <&vp0_out_hdmi>;
};
```

:::note 注意
一个显示接口同一时刻只能与一个 VP 连接。
:::

#### 3.3.3 图层分配策略

VOP2 采用统一显示架构，各 VP 共享所有图层资源。图层需排他性使用。

**DTS 配置：**
```dts
#include <dt-bindings/display/rockchip_vop.h>

&vp0 {
    rockchip,plane-mask = <(1 << ROCKCHIP_VOP2_CLUSTER1 | 1 << ROCKCHIP_VOP2_SMART1)>;
    rockchip,primary-plane = <ROCKCHIP_VOP2_SMART1>;
};

&vp1 {
    rockchip,plane-mask = <(1 << ROCKCHIP_VOP2_CLUSTER0 | 1 << ROCKCHIP_VOP2_ESMART0 |
                            1 << ROCKCHIP_VOP2_SMART0)>;
    rockchip,primary-plane = <ROCKCHIP_VOP2_SMART0>;
};
```

**分配原则：**
- 所有图层平均分配给各 VP
- Cluster / Esmart / Smart 各类型图层搭配分配
- 主屏尽量分配 3 个以上图层
- 未使用的 VP 一般不分配图层

**图层类型：**
| 类型 | 特点 |
| :--- | :--- |
| **Cluster** | 高性能，支持最大分辨率、AFBC、多格式 |
| **Esmart** | 中等性能，支持缩放、YUV/RGB |
| **Smart** | 基础图层，支持简单缩放 |

**RK3566 特殊说明：**
RK3566 有主图层和镜像图层的区别（Cluster1 从 Cluster0 地址取数），需保证主图层优先使用。

#### 3.3.4 鼠标层配置

Linux 系统（非 Android）可设置 cursor 图层：
```dts
&vp0 {
    cursor-win-id = <ROCKCHIP_VOP2_CLUSTER0>;
};
```

**图层与 VP 连接关系（RK3576）：**

| VP | 可连接图层 |
| :--- | :--- |
| VP0 | Cluster0、Cluster1、Esmart0、Esmart2 |
| VP1 | Cluster0、Cluster1、Esmart1、Esmart3 |
| VP2 | Esmart0、Esmart1、Esmart2、Esmart3 |

#### 3.3.5 Esmart 图层分割

RK3528 和 RK3576 的 esmart 图层共享 linebuffer，可通过配置调整图层数量和性能。

**RK3576 配置：**
```dts
&vop {
    esmart_lb_mode = /bits/ 8 <4>;   // 模式 4：3 个 4K esmart
};
```

| 模式值 | 模式名 | 图层配置 |
| :---: | :--- | :--- |
| 4 | VOP3_ESMART_4K_4K_4K_MODE | cluster0[4k]、cluster1[4k]、esmart0[4k]、esmart1[4k]、esmart2[4k] |
| 5 | VOP3_ESMART_4K_4K_2K_2K_MODE | cluster0[4k]、cluster1[4k]、esmart0[4k]、esmart1[4k]、esmart2[2k]、esmart3[2k] |

**RK3528 配置：**
| 模式值 | 模式名 | 图层配置 |
| :---: | :--- | :--- |
| 1 | VOP3_ESMART_4K_4K_MODE | cluster[4k]、esmart0[4k]、esmart2[4k] |
| 2 | VOP3_ESMART_4K_2K_2K_MODE | cluster[4k]、esmart0[4k]、esmart2[2k]、esmart3[2k] |
| 3 | VOP3_ESMART_2K_2K_2K_2K_MODE | cluster[4k]、esmart0[2k]、esmart1[2k]、esmart2[2k]、esmart3[2k] |

#### 3.3.6 禁止图层迁移

```dts
&vop {
    disable-win-move;
};
```

设置后每个 CRTC 的图层唯一独占，不在 CRTC 之间迁移。

---

## 四、Display Feature

### 4.1 各平台 VOP 基础特性

| SOC | VOP 版本 | 主要特性 |
| :--- | :---: | :--- |
| RK3288 / RK3399 | V1.0 | 双 VOP，最高 4K |
| RK356X | V2.0 | 3 VP，6 图层（2C+2E+2S），AFBC |
| RK3588 | V2.0 | 4 VP，8 图层（2C+2E+2S+2E），8K 支持，DSC |
| RK3528 | V3.0 | 2 VP，4K，HDR |
| RK3562 | V3.0 | 3 VP，4K，HDR |
| RK3576 | V3.0 | 3 VP，2 Cluster + 4 Esmart，4K |
| RK3506 | V1.0 | 低功耗平台 |

### 4.2 各平台显示接口最大分辨率

| 平台 | 接口 | 最大输出分辨率 | 协议标准 |
| :--- | :--- | :--- | :--- |
| **RK3588** | HDMI | 4096x2160@60Hz | HDMI 2.1 |
| | DP | 7680x4320@30Hz | DP 1.4 |
| | MIPI | 3840x2160@60Hz | DSI v1.1, DPHY v2.0, CPHY v1.1 |
| | eDP | 3840x2160@60Hz | DP1.2a / eDP1.3 |
| **RK3576** | HDMI | 4096x2160@120Hz | HDMI 2.1 |
| | DP | 4096x2160@120Hz | DP 1.4 |
| | MIPI | 2560x1600@60Hz | DSI v1.1, DPHY v2.0 |
| | eDP | 4096x2160@60Hz | DP1.2 / eDP1.3 |
| **RK356X** | HDMI | 4096x2160@60Hz | HDMI 2.0 |
| | MIPI | 1920x1080@60Hz 单通道 / 2560x1600@60Hz 双通道 | DSI v1.1 |
| | eDP | 2560x1600@60Hz | DP1.2a / eDP1.3 |
| **RK3528** | HDMI | 4096x2160@60Hz | HDMI 2.0 |
| | MIPI | 2048x1080@60Hz | DSI v1.1 |
| **RK3506** | RGB | 1280x720@60Hz | - |

:::note 注意
在 RK3576/RK3588 上，eDP 和 HDMI 的 PHY 是 combo 的，即 HDMI0 与 eDP0 不能同时使用，HDMI1 与 eDP1 同理。
:::

### 4.3 VOP2 平台显示通路

**RK3588 8K 输出注意：** 8K 模式下一个显示接口需要同时占用 VP0 和 VP1，此时 VP1 不能接其他显示接口。

---

## 五、多屏显示

### 5.1 Connector-mirror

一个 VP 同时驱动多路显示接口，输出相同时序和内容。

**配置方式：** 将两个显示接口挂接在同一个 VP 上。

```dts
&hdmi0 { status = "okay"; };
&hdmi1 { status = "okay"; };
&hdmi0_in_vp0 { status = "okay"; };
&hdmi1_in_vp0 { status = "okay"; };
```

- NVR SDK 默认支持
- Android 需要 hwc 1.4.15+ 版本支持

### 5.2 Connector-split

一个 VP 输出按水平方向平分为左右两路，驱动两个显示接口，时序相同、内容独立。

**支持平台：** RK3588 / RK3576

#### 相同接口 split（rockchip,split-mode）

- 2 个相同接口 / 相同时序屏
- 左右半屏分别显示
- 软件注册 **1 个** connector
- MIPI 双通道类似的使用方式

```dts
&hdmi0 { status = "okay"; };
&hdmi1 { status = "okay"; rockchip,split-mode; };
&hdmi0_in_vp0 { status = "okay"; };
&hdmi1_in_vp0 { status = "okay"; };
```

#### 不同接口 split（rockchip,dual-connector-split）

- 2 个不同接口 / 相同时序屏
- 左右半屏分别显示
- 软件注册 **2 个** connector

```dts
&hdmi0 {
    status = "okay";
    rockchip,dual-connector-split;
    rockchip,left-display;     // 标记为左屏
};
&dp0 {
    status = "okay";
    rockchip,dual-connector-split;
};
```

---

## 六、硬件相关

### 6.1 RGB 输出 / TTL 模式

VOP 2.0 及之后的 RGB 接口支持多种 display mode index 配置。

### 6.2 BT.656 / BT.1120 硬件连接

颜色不对时可调整 `bus_format`：

**BT.656（8bit 双通道）：**
```c
MEDIA_BUS_FMT_UYVY8_2X8   // 0x2006
MEDIA_BUS_FMT_VYUY8_2X8   // 0x2007
MEDIA_BUS_FMT_YUYV8_2X8   // 0x2008
MEDIA_BUS_FMT_YVYU8_2X8   // 0x2009
```

**BT.1120（16bit 单通道）：**
```c
MEDIA_BUS_FMT_UYVY8_1X16  // 0x200f
MEDIA_BUS_FMT_VYUY8_1X16  // 0x2010
MEDIA_BUS_FMT_YUYV8_1X16  // 0x2011
MEDIA_BUS_FMT_YVYU8_1X16  // 0x2012
```

### 6.3 LVDS Data Mapping

支持 VESA 和 JEIDA 两种数据格式。

---

## 七、扫描时序

### 7.1 时序参数

```
      ← htotal →
┌───────────────────────┐  ↑
│ hfp │ hsync │ hbp │ active │ vtotal
└───────────────────────┘  ↓
       ↑ vfp ↑ vsync ↑ vbp ↑
```

**DTS 配置中的时序参数：**
- `hactive` / `vactive` — 有效像素
- `hfront-porch` / `vfront-porch` — 前沿
- `hsync-len` / `vsync-len` — 同步脉宽
- `hback-porch` / `vback-porch` — 后沿
- `clock` — DCLK 频率（Hz）
- `htotal = hactive + hfp + hsync + hbp`
- `vtotal = vactive + vfp + vsync + vbp`

### 7.2 查看当前时序

通过 `modetest` 或 `/sys/kernel/debug/dri/0/summary` 查看。

---

## 八、带宽计算

### 8.1 图像带宽

以 1080P ARGB 格式 60fps 为例：
```
单帧大小 = 1920 × 1080 × 4Byte = 8,100 KB
带宽 = 8,100 KB × 60fps = 474.6 MB/s
```

NV12 格式（1.5 Byte/pixel）：
```
带宽 = 1920 × 1080 × 1.5 × 60 = 178 MB/s
```

### 8.2 显示接口带宽

**DCLK 计算：**
```
dclk = htotal × vtotal × fps
```

**MIPI 接口每 lane 速率（以 1080x1920 4-lane 为例）：**
```
dclk = 1127 × 1952 × 60 = 131,994,240 Hz ≈ 132 MHz
每 lane 速率 = 132M × 3(RGB) × 8(bpc) / 4(lane) / 0.9(效率) ≈ 880 Mbps
```

---

## 九、常用 Debug 手段

### 9.1 Dump 显示状态

```bash
cat /sys/kernel/debug/dri/0/summary
```

输出包含：
- VOP/Video Port 信息
- Connector 信息（接口类型、连接状态）
- 显示模式（分辨率、DCLK、帧率）
- 图层信息（图层类型、大小、格式、src/dst 位置）
- HDR/CSC 状态信息

:::note 依赖
需要开启 `CONFIG_DEBUG_FS` 并挂载 debugfs：`mount -t debugfs none /sys/kernel/debug`
:::

### 9.2 Dump VOP 寄存器配置

```bash
# 正在工作的模块寄存器
cat /sys/kernel/debug/dri/0/active_regs

# 所有子模块寄存器
cat /sys/kernel/debug/dri/0/regs
```

Linux 6.1+ 默认支持，5.10/4.19 需更新版本。也可使用 `vop2_dump.sh` 脚本。

### 9.3 Dump 显示 Buffer

```bash
# 使能 CONFIG_ROCKCHIP_DRM_DEBUG

# dump 一帧
echo dump > /sys/kernel/debug/dri/0/video_port0/dump

# 连续 dump n 帧
echo dumpn > /sys/kernel/debug/dri/0/video_port0/dump
```

文件保存在 `/data/vop_buf/`，可用 **7yuv** 软件查看。

### 9.4 DRM 打印 Log 等级

```bash
echo 0xff > /sys/module/drm/parameters/debug
```

各 bit 定义：
| Bit | 掩码 | 类别 |
| :---: | :---: | :--- |
| 0 | 0x01 | CORE |
| 1 | 0x02 | DRIVER |
| 2 | 0x04 | KMS (modesetting) |
| 3 | 0x08 | PRIME |
| 4 | 0x10 | ATOMIC |
| 5 | 0x20 | VBL（打印量大，默认不开） |
| 7 | 0x80 | LEASE |
| 8 | 0x100 | DP |

:::tip 提示
打开调试开关后，完整 log 需要通过 `dmesg` 查看，串口终端可能只显示部分。
:::

### 9.5 查看显示时钟

```bash
# 整个时钟树
cat /sys/kernel/debug/clk/clk_summary

# 仅 VOP 相关
cat /sys/kernel/debug/clk/clk_summary | grep vop
```

### 9.6 强制开关显示设备

```bash
# 关 LVDS
echo off > /sys/class/drm/card0-LVDS-1/status

# 开 LVDS
echo on > /sys/class/drm/card0-LVDS-1/status
```

### 9.7 查看 DRM Buffer 使用情况

```bash
cat /sys/kernel/debug/dri/0/mm_dump
```

### 9.8 查看 GPIO 状态

```bash
cat /sys/kernel/debug/gpio
```

### 9.9 modetest 使用

```bash
# 查看 DRM 系统状态
modetest -M rockchip

# 在指定 connector 上输出彩条
modetest -M rockchip -s <connector_id>@<crtc_id>:<resolution>
```

### 9.10 xrandr 使用（X11 环境）

```bash
xrandr          # 查看显示信息
xrandr --output HDMI-1 --mode 1920x1080    # 设置分辨率
```

### 9.11 暂停/恢复显示进程

```bash
# Android SurfaceFlinger
kill -STOP `pgrep surfaceflinger`
kill -CONT `pgrep surfaceflinger`

# Linux Weston
kill -STOP `pgrep weston`
kill -CONT `pgrep weston`

# Linux Xserver
kill -STOP `pgrep Xorg`
kill -CONT `pgrep Xorg`
```

### 9.12 获取 EDID 信息

```bash
cat /sys/class/drm/card0-HDMI-A-1/edid > /data/edid.bin
```

### 9.13 查看 HDMI 状态

```bash
cat /sys/kernel/debug/dw-hdmi/status
```

---

## 十、FAQ

### 10.1 VOP POST_BUF_EMPTY

可能原因及解决方法：
1. **带宽不够** — 固定 DDR 最高频率 / 加长消隐期
2. **IOMMU 出错** — 更新代码，提交 redmine
3. **Logic 电压太低** — 提高 100mV 测试
4. **AFBDC/IFBDC 对齐问题** — 分辨率非 16pixel 对齐时关闭该功能

### 10.2 显示效果调节

VOP BCSH 模块支持亮度、对比度、饱和度、色度调节。

**Android 命令（9.0+）：**
```bash
setprop persist.vendor.brightness.main <val>
setprop persist.vendor.contrast.main <val>
setprop persist.vendor.saturation.main <val>
setprop persist.vendor.hue.main <val>
```

### 10.3 屏无法点亮/不显示问题排查

1. 确认背光是否正常
2. 确认屏电源及复位控制
3. 确认上下电时序是否符合规格书
4. 检查 DTS 配置
5. 检查时钟配置

### 10.4 RK3308/RV1106/RV1103 开启显示功能

这些平台默认关闭显示，需要：
- U-Boot：使用 display.config 配置编译
- Kernel：开启 CMA 并调整大小（默认 16M 可能不够）
- RV1106/RV1103：使用 rv1106-evb.config

### 10.5 关闭 IOMMU

关闭 VOP IOMMU 后，DRM buffer 从 CMA 分配，需调整 CMA 大小。

### 10.6 RGB/MCU 屏帧率计算

```
N — 每个像素需要的 cycle 数

RGB: fps = dclk / (htotal × vtotal × N)
MCU: fps = dclk / (htotal × vtotal × (mcu-pix-total + 1) × N)
```

### 10.7 第三方转换芯片驱动

参考 DRM bridge 接口，以 SII902X（RGB2HDMI）为例：
```
drivers/gpu/drm/bridge/sii902x.c
```

### 10.8 RK3588 DSC 支持

| DSC | 所属接口 | slice 数 | 最大 slice_width |
| :--- | :--- | :--- | :--- |
| DSC0 (DSC_8K) | HDMI0 / DSI0 | 1、2、4、8 | 7680 |
| DSC1 (DSC_4K) | HDMI1 / DSI1 | 1、2 | 4096 |

### 10.9 超 4K@60Hz 对 ACLK 的要求

超过 4KP60 的分辨率（4KP120 / 8KP30 / 8KP60）需要将 ACLK 设为 800MHz：

```dts
&vop {
    assigned-clocks = <&cru ACLK_VOP>;
    assigned-clock-rates = <800000000>;
};
```

### 10.10 RK3588 VOP DCLK 分配策略

#### DCLK 时钟源

| 时钟源 | 特点 |
| :--- | :--- |
| **V0PLL** | VOP 独占，支持任意频率，默认与 VP2 绑定 |
| **CPLL/GPLL/AUPLL** | 与其他 IP 共享，整数分频，VP0/1/3 默认 GPLL |
| **hdmi_phy0/1_pll** | 任意分频，HDMI 不工作时 VOP 独占，工作时共享 |

#### 静态分配

通过 DTS 绑定：
```dts
&vp0 {
    assigned-clocks = <&cru DCLK_VOP0>;
    assigned-clock-parents = <&hdptxphy_hdmi_clk0>;
};
```

#### 动态分配

在 `display_subsystem` 节点配置：
```dts
&display_subsystem {
    clocks = <&hdptxphy_hdmi_clk0>, <&hdptxphy_hdmi_clk1>;
    clock-names = "hdmi0_phy_pll", "hdmi1_phy_pll";
};
```

**建议：**
- HDMI0 和 HDMI1 尽量不要挂在 VP2 上
- HDMI0 和 HDMI1 尽量不要挂在同一个 VP 上

### 10.11 默认开启 X 方向镜像

仅 VOP V2.0+ 支持：
```dts
&vp1 {
    xmirror-enable;
};
```

### 10.12 支持 4K 分辨率 Logo

4K BI_RGB 24bpp BMP 约 24MB，超出默认 8MB 限制。需修改：
- `MAX_IMAGE_BYTES` 改为 32MB
- `CONFIG_SYS_MALLOC_LEN` 翻倍
- `CONFIG_DRM_MEM_RESERVED_SIZE_MBYTES` 改为 64MB

:::tip 提示
不建议使用太大的 BMP logo，推荐使用 BI_RLE4/BI_RLE8 压缩格式。
:::

### 10.13 RV1106/RV1103 小分辨率显示异常

GPLL（1188MHz）和 CPLL（1000MHz）的 dclk 最小分频为 37.125kHz / 31.25kHz。若屏 pixel clock 低于此值，需修改 PLL 频率：

```dts
&vop {
    assigned-clocks = <&cru PLL_GPLL>;
    assigned-clock-rates = <594000000>;
};
```

---

## 十一、问题定位方法

1. 查看内核 log 和应用层 log，寻找异常提示
2. 根据异常 log 搜索驱动代码，理解判断逻辑
3. 确认问题是概率性还是必现
4. 对于 HDMI/DP，确认是特定分辨率/显示器还是全部出现
5. 兼容性问题用第三方设备做对比测试
6. 视频场景问题确认是特定视频/APP 还是通用
7. 用二分法和控制变量法定位引入版本

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_DRM_Display_Driver_CN.pdf` V4.5.0
- 《Rockchip_DRM_Panel_Porting_Guide.pdf》
- 《Rockchip_Developer_Guide_HDMI_CN.pdf》
- 《RK3588_MIPI_DSI2_Developer_Guide_CN.pdf》
- 《Rockchip_BT656_TX_AND_BT1120_TX_Developer_Guide_CN.pdf》
- Linux DRM Developer's Guide
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
