---
sidebar_position: 4
---

# DRM Direct Show 使用指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_DRM_Direct_Show_CN.pdf`（V1.0.0, 2022-03-01）整理，介绍基于 Rockchip DRM 显示驱动框架的内核态直接显示接口。

:::info 适用范围
- **芯片平台**：RK356X / RK3588
- **内核版本**：Linux kernel 5.10 及以上
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

DRM Direct Show 是 Rockchip DRM 驱动提供的**内核态直接送显示**接口，主要用于：
- **快速影像显示**
- **Kernel Logo 显示**
- **自动测试**场景

:::note 默认关闭
该功能默认关闭，需通过内核配置开启。
:::

---

## 二、内核配置

开启 Direct Show 功能：

```diff
 CONFIG_DRM_ROCKCHIP=y
+CONFIG_ROCKCHIP_DRM_DIRECT_SHOW=y
```

开启自动测试（可选）：

```diff
 CONFIG_ROCKCHIP_DRM_DIRECT_SHOW=y
+CONFIG_ROCKCHIP_DRM_SELF_TEST=y
```

---

## 三、API 说明

### 3.1 获取 DRM 设备

```c
struct drm_device *rockchip_drm_get_dev(void);
```

获取 DRM 设备实例，后续所有操作都需要用到。

### 3.2 申请内存

```c
int rockchip_drm_direct_show_alloc_buffer(
    struct drm_device *drm,
    struct rockchip_drm_direct_show_buffer *buffer
);
```

**输入参数：**

| 变量 | 说明 |
| :--- | :--- |
| `width` | buffer 宽度（Pixel） |
| `height` | buffer 高度（Pixel） |
| `pixel_format` | 像素格式（参考 `drm_fourcc.h`） |
| `flag` | 内存类型：0=离散非连续，`ROCKCHIP_BO_CONTIG`=连续内存 |

**输出参数：**

| 变量 | 说明 |
| :--- | :--- |
| `bpp` | 每像素 bit 数 |
| `pitch[3]` | 虚宽（按格式对齐） |
| `vir_addr[3]` | 内核态虚拟地址 |
| `phy_addr[3]` | 物理地址 |
| `rk_gem_obj` | DRM GEM 对象 |
| `fb` | DRM framebuffer 对象 |
| `dmabuf_fd` | export 出来的 dmabuf fd |

:::note 多 plane 说明
- RGB 格式使用 `pitch[0]` / `vir_addr[0]` / `phy_addr[0]`
- NV12 格式（2 plane）使用 `[0]` 和 `[1]`
- 3 plane 格式使用 `[0]`、`[1]`、`[2]`
:::

### 3.3 获取 CRTC

```c
struct drm_crtc *rockchip_drm_direct_show_get_crtc(struct drm_device *drm);
```

获取当前正在使用的 CRTC（即 Video Port）。

### 3.4 获取 Plane

```c
struct drm_plane *rockchip_drm_direct_show_get_plane(
    struct drm_device *drm,
    char *name
);
```

根据名称获取指定图层（plane），如：

```c
plane = rockchip_drm_direct_show_get_plane(drm_dev, "Esmart0-win0");
```

### 3.5 提交显示

```c
int rockchip_drm_direct_show_commit(
    struct drm_device *drm,
    struct rockchip_drm_direct_show_commit_info *commit_info
);
```

**commit_info 参数：**

| 变量 | 说明 |
| :--- | :--- |
| `crtc` | 指定的 CRTC |
| `plane` | 指定的 Plane |
| `buffer` | 显示 buffer |
| `top_zpos` | false=默认配置，true=设定最顶层 |
| `src_x/src_y/src_w/src_h` | buffer 中显示区域的偏移和大小 |
| `dst_x/dst_y/dst_w/dst_h` | 屏幕上显示的位置和大小 |

### 3.6 关闭图层

```c
int rockchip_drm_direct_show_disable_plane(
    struct drm_device *drm,
    struct drm_plane *plane
);
```

关闭指定图层的显示。

### 3.7 释放内存

```c
void rockchip_drm_direct_show_free_buffer(
    struct drm_device *drm,
    struct rockchip_drm_direct_show_buffer *buffer
);
```

释放 buffer 内存资源。

---

## 四、使用流程

```
1. 获取 DRM 设备
      ↓
2. 申请 buffer（指定格式和大小）
      ↓
3. 向 buffer 中绘制图像
      ↓
4. 获取 CRTC 和 Plane
      ↓
5. 提交显示（commit）
      ↓
6. （可选）关闭图层
      ↓
7. 释放内存
```

---

## 五、自动测试用例

开启 `CONFIG_ROCKCHIP_DRM_SELF_TEST` 后，内核会加载 DRM 自动测试程序：

- 作为开发者使用 Direct Show 的参考示例
- 作为 DRM 驱动的自动测试程序
- 可输出各种测试图案验证显示通路

---

## 六、Kernel Logo 显示方案

部分产品没有使用官方 U-Boot 或无法开启 U-Boot logo，但需要 Kernel Logo 显示，可通过修改 Direct Show 自测试程序实现：

### 6.1 修改步骤

1. **准备 Logo 图片** — 使用 `bmp2hex` 工具将 BMP 文件转为 C 数组，保存为 `kernel_logo_img.h`

2. **修改自测试代码** `rockchip_drm_self_test.c`：

```diff
-#define USE_BUFFER_NUM 2
+#define USE_BUFFER_NUM 1
 #define BUFFER_WIDTH  652
 #define BUFFER_HEIGHT 268
 #define BUFFER_FORMAT DRM_FORMAT_RGB565
```

```diff
-#if 1   /* for self test pattern */
+#if 0   /* for self test pattern */
```

3. **调整参数** — 根据实际图片修改 `BUFFER_WIDTH`、`BUFFER_HEIGHT`、`BUFFER_FORMAT`

### 6.2 bmp2hex 工具

可从 Rockchip Redmine 搜索 `bmp2hex` 获取：
[https://redmine.rock-chips.com/documents/97](https://redmine.rock-chips.com/documents/97)

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_DRM_Direct_Show_CN.pdf` V1.0.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
