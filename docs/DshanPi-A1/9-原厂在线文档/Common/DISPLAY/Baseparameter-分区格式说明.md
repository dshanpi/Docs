---
sidebar_position: 3
---

# Baseparameter 分区格式定义与使用说明

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Baseparameter_Format_Define_And_Use_CN.pdf`（V1.0.0, 2021-08-27）整理，介绍 Baseparameter 分区的格式定义、数据结构和使用方法。

:::info 适用范围
- **芯片平台**：所有 Rockchip 平台
- **内核版本**：Linux 4.19 / Linux 5.10
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

Baseparameter 分区用于存储 Rockchip 平台显示分辨率、显示效果调节等配置信息，确保：
- **关机重启后保持显示效果一致**
- **整个开机过程显示效果保持一致**

---

## 二、Baseparameter 分区结构

### 2.1 分区拓扑图

Baseparameter 分区包含主分区和备份分区，每个分区大小为 **512KB**。

### 2.2 总体结构

```c
struct baseparameter_info base_info {
    char head_flag[4];                     /* 头标识，"BASP" */
    u16 major_version;                     /* 大版本号 */
    u16 minor_version;                     /* 小版本号 */
    struct disp_header disp_header[8];     /* 8 个显示设备 header */
    struct disp_info disp_info[8];         /* 8 个显示设备信息 */
};
```

### 2.3 disp_header 结构

```c
struct disp_header {
    u32 connector_type;    /* 显示设备类型 */
    u32 connector_id;      /* 显示设备 id */
    u32 offset;            /* disp_info 偏移 */
};
```
**占用：** 12 Byte

### 2.4 disp_info 结构

```c
struct disp_info {
    char disp_head_flag[6];            /* disp 头标识 "DISP_N"（N=0~7） */
    struct screen_info screen_info[4]; /* 显示接口信息（热插拔设备可存4组） */
    struct bcsh_info bcsh_info;        /* 亮度/对比度/饱和度/色度 */
    struct overscan_info overscan_info;/* 过扫描信息 */
    struct gamma_lut_data gamma_lut_data;  /* gamma LUT */
    struct cubic_lut_data cubic_lut_data;  /* 3D LUT */
    struct framebuffer_info framebuffer_info; /* framebuffer 信息 */
    u32 reserved[244];                 /* 预留 */
    u32 crc;                           /* CRC 校验 */
};
```
**占用：** 36,972 Byte

### 2.5 总存储空间计算

| 结构 | 单组大小 | 数量 | 合计 |
| :--- | ---: | :---: | ---: |
| head_flag + version | 8 Byte | 1 | 8 Byte |
| disp_header | 12 Byte | 8 | 96 Byte |
| disp_info | 36,972 Byte | 8 | 295,776 Byte |
| **总计** | | | **~295,848 Byte** |

主分区和备份分区各 **512KB**，剩余空间预留。

---

## 三、基础结构详解

### 3.1 struct screen_info（72 Byte）

保存显示接口类型、分辨率时序等信息。

```c
struct screen_info {
    u32 type;                          /* connector 类型 */
    u32 id;                            /* 相同 type 的不同设备区分 */
    struct drm_display_mode resolution;/* 扫描时序（52 Byte） */
    enum output_format format;         /* 颜色格式 */
    enum output_depth depthc;          /* 色深 */
    u32 feature;                       /* 功能标志位 */
};
```

#### connector 类型定义

| 宏定义 | 值 | 说明 |
| :--- | :---: | :--- |
| `DRM_MODE_CONNECTOR_Unknown` | 0 | 未知 |
| `DRM_MODE_CONNECTOR_VGA` | 1 | VGA |
| `DRM_MODE_CONNECTOR_DVII` / `DVID` / `DVIA` | 2/3/4 | DVI |
| `DRM_MODE_CONNECTOR_Composite` | 5 | 复合视频 |
| `DRM_MODE_CONNECTOR_SVIDEO` | 6 | S-Video |
| `DRM_MODE_CONNECTOR_LVDS` | 7 | LVDS |
| `DRM_MODE_CONNECTOR_DisplayPort` | 10 | DP |
| `DRM_MODE_CONNECTOR_HDMIA` / `HDMIB` | 11/12 | HDMI |
| `DRM_MODE_CONNECTOR_TV` | 13 | TV |
| `DRM_MODE_CONNECTOR_eDP` | 14 | eDP |
| `DRM_MODE_CONNECTOR_DSI` | 16 | MIPI DSI |
| `DRM_MODE_CONNECTOR_DPI` | 17 | DPI (RGB) |

#### drm_display_mode 结构

```c
struct drm_display_mode {
    int clock;              /* kHz */
    int hdisplay;           /* 水平有效像素 */
    int hsync_start;
    int hsync_end;
    int htotal;             /* 水平总像素 */
    int vdisplay;           /* 垂直有效像素 */
    int vsync_start;
    int vsync_end;
    int vtotal;             /* 垂直总像素 */
    int vrefresh;           /* 刷新率 */
    int vscan;
    unsigned int flags;
    int picture_aspect_ratio;
};
```

#### output_format（颜色格式）

| 枚举值 | 说明 |
| :--- | :--- |
| `output_rgb=0` | RGB |
| `output_ycbcr444=1` | YCbCr 4:4:4 |
| `output_ycbcr422=2` | YCbCr 4:2:2 |
| `output_ycbcr420=3` | YCbCr 4:2:0 |
| `output_ycbcr_high_subsampling=4` | Auto（YCbCr444 &gt; YCbCr422 &gt; YCbCr420 &gt; RGB） |
| `output_ycbcr_low_subsampling=5` | Auto（RGB &gt; YCbCr420 &gt; YCbCr422 &gt; YCbCr444） |

#### output_depth（色深）

| 枚举值 | 说明 |
| :--- | :--- |
| `Automatic=0` | 自动 |
| `depth_24bit=8` | 24bit |
| `depth_30bit=10` | 30bit |

#### feature 标志位

| 标志 | 值 | 说明 |
| :--- | :---: | :--- |
| `RESOLUTION_AUTO` | `(1&lt;&lt;0)` | 分辨率自动模式 |
| `COLOR_AUTO` | `(1&lt;&lt;1)` | 颜色自动模式 |
| `HDCP1X_EN` | `(1&lt;&lt;2)` | 开启 HDCP 1.x |
| `RESOLUTION_WHITE_EN` | `(1&lt;&lt;3)` | 过滤分辨率白名单 |

### 3.2 struct bcsh_info（8 Byte）

亮度、对比度、饱和度、色度调节（取值 0~100，默认 50）。

```c
struct bcsh_info {
    unsigned short brightness;   /* 亮度 */
    unsigned short contrast;     /* 对比度 */
    unsigned short saturation;   /* 饱和度 */
    unsigned short hue;          /* 色度 */
};
```

### 3.3 struct overscan_info（12 Byte）

过扫描缩放系数。

```c
struct overscan_info {
    unsigned int maxvalue;       /* 最大值基准 */
    unsigned short leftscale;    /* 左边缩放 */
    unsigned short rightscale;   /* 右边缩放 */
    unsigned short topscale;     /* 上边缩放 */
    unsigned short bottomscale;  /* 下边缩放 */
};
```

### 3.4 struct gamma_lut_data（6,146 Byte）

Gamma LUT 数据，每个 RGB 通道最多 1024 个数据点。

```c
struct gamma_lut_data {
    u16 size;            /* LUT 数据点数（最大 1024） */
    u16 lred[1024];      /* Red 通道 */
    u16 lgreen[1024];    /* Green 通道 */
    u16 lblue[1024];     /* Blue 通道 */
};
```

### 3.5 struct cubic_lut_data（29,480 Byte）

3D LUT（Cubic LUT）数据，17×17×17 = 4913 个点。

```c
struct cubic_lut_data {
    u16 size;            /* LUT 数据点数（最大 4913） */
    u16 lred[4913];      /* Red 通道 */
    u16 lgreen[4913];    /* Green 通道 */
    u16 lblue[4913];     /* Blue 通道 */
};
```

### 3.6 struct framebuffer_info（12 Byte）

预设 framebuffer 信息。

```c
struct framebuffer_info {
    u32 framebuffer_width;   /* 宽度 */
    u32 framebuffer_height;  /* 高度 */
    u32 fps;                 /* 帧率 */
};
```

### 3.7 reserved[244]（976 Byte）

预留配置空间，用于未来扩展。

---

## 四、Baseparameter 备份分区

- Baseparameter 包含主分区和备份分区
- 正常时读取主分区
- 主分区校验失败时自动读取备份分区
- 两个分区独立存储，提高可靠性

---

## 五、读写 API

（具体 API 由各系统实现，Android 通过系统服务读写，Linux 可通过 sysfs 或 ioctl 接口操作。）

---

## 六、解析工具

Baseparameter 解析工具可用于：
- 查看分区内存储的显示配置
- 验证配置数据的完整性
- 调试显示相关问题

---

## 七、Android 软件配置流程

1. 系统启动时读取 Baseparameter 分区配置
2. 将配置应用到 DRM 显示驱动
3. 显示效果调节（亮度、对比度等）实时写入 Baseparameter
4. 关机时确保配置已持久化保存

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Baseparameter_Format_Define_And_Use_CN.pdf` V1.0.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
