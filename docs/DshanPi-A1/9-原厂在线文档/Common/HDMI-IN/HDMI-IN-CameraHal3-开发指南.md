---
sidebar_position: 1
---

# HDMI-IN 基于 CameraHal3 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_HDMI_IN_Based_On_CameraHal3_CN.pdf`（V1.1.0, 2021-06-02）整理，介绍基于 RK628D 转换芯片在 Android 平台实现 HDMI IN 功能的开发方法。

:::info 适用范围
- **芯片平台**：RK3288 / RK3326 / RK3368 / RK3399 / RK3566 / RK3568
- **内核版本**：Linux 4.4 / Linux 4.19
- **Android 版本**：Android 9 / 10 / 11
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、HDMI IN 相关驱动代码说明

### 1.1 基于 RK628D 实现 HDMI IN 功能

RK628D 作为 MFD 设备，包含 MFD 设备驱动和各个接口功能模块驱动。**RK628D HDMI RX To MIPI CSI** 用于 HDMI IN 应用场景，将 RK628D 作为类 camera 设备使用，基于 V4L2 框架实现相关驱动。

与显示 DRM 框架不同，除 **COMBRXPHY**、**COMBTXPHY** 驱动复用外，**HDMI RX Controller**、**Post Process** 和 **MIPI CSI TX** 等功能模块均在 V4L2 驱动框架中重新实现。

**相关驱动代码：**
```
drivers/mfd/rk628.c
drivers/gpu/drm/rockchip/rk628/rk628_combrxphy.c
drivers/gpu/drm/rockchip/rk628/rk628_combtxphy.c
drivers/media/i2c/rk628_csi.c
```

**Kernel Config 配置：**
```
CONFIG_MFD_RK628=y
CONFIG_VIDEO_RK628_CSI=y
CONFIG_DRM_ROCKCHIP_RK628=y
```

### 1.2 基于其他转换芯片实现 HDMI IN 功能

其他转换芯片（如 TC358743 / TC358749 / LT6911UXC）未使用 MFD 设备驱动，仅在 V4L2 框架基础上实现 I2C 设备驱动。

**相关驱动代码：**
```
drivers/media/i2c/tc35874x.c
drivers/media/i2c/lt6911uxc.c
```

**Kernel Config 配置：**
```
CONFIG_VIDEO_TC35874X=y
CONFIG_VIDEO_LT6911UXC=y
```

---

## 二、HDMI IN VIDEO 框架说明

HDMI IN video 部分的软件实现方案是将 RK628D 模拟成一个 MIPI SOC camera 设备，通过 camera 框架接收 video 数据并在 APK 进行显示，同时基于 HDMI IN 的应用场景需要，增加 HDMI IN 热拔插和 HDMI IN 分辨率自适应支持。

### 2.1 HDMI IN APK 工作流程

APK 通过 ioctl 的方式访问 RK628D 设备节点，获取当前的连接状态和分辨率，然后通过 CameraHal3 框架取流并显示。

### 2.2 RK628D 驱动架构

RK628D 驱动需要重点关注的三个部分：
1. **初始化** — 模块上电、复位、I2C 通信建立
2. **热拔插中断处理** — 检测 HDMI 插拔动作，触发状态切换
3. **分辨率切换中断处理** — 检测输入分辨率变化，重新配置链路

---

## 三、配置方法说明

### 3.1 SDK 代码版本要求

kernel/ 代码需要包含 RK628 DRM 和 media 驱动相关提交。
hardware/rockchip/camera/ 和 device/rockchip/common/ 需要对应版本。

参考 dts：`arch/arm/boot/dts/rk3288-evb-rk628-hdmi2csi-avb.dts`

### 3.2 板级配置说明

#### 3.2.1 功能模块配置

实现 RK628D HDMI IN 功能需要使用 **COMBRXPHY**、**COMBTXPHY**、**CSI** 功能模块：

```dts
&rk628_combrxphy {
    status = "okay";
};

&rk628_combtxphy {
    status = "okay";
};

&rk628_csi {
    status = "okay";
    // ...
};
```

:::caution 注意
`rk628_post_process`、`rk628_hdmi`、`rk628_hdmirx` 是用于 RK628D 点屏等显示通路时使用，在 HDMI IN 场景中不需要使能。
:::

#### 3.2.2 硬件连接配置

RK628D 是 I2C 设备，需要配置在对应的 I2C 总线下：

```dts
&i2c1 {
    clock-frequency = <400000>;
    status = "okay";

    rk628: rk628@50 {
        reg = <0x50>;
        interrupt-parent = <&gpio7>;
        interrupts = <15 IRQ_TYPE_LEVEL_HIGH>;
        enable-gpios = <&gpio5 RK_PC2 GPIO_ACTIVE_HIGH>;
        reset-gpios = <&gpio7 RK_PB6 GPIO_ACTIVE_LOW>;
        status = "okay";
    };
};
```

| 配置项 | 说明 |
| :--- | :--- |
| `reg` | I2C 地址（RK628D 典型 7bit 地址为 0x50，多片时可通过 GPIO 改变） |
| `interrupt-parent/interrupts` | RK628D 中断 GPIO 引脚 |
| `enable-gpios` | RK628D 供电控制 GPIO（常供电可不配） |
| `reset-gpios` | RK628D 复位控制 GPIO |

**RK628_CSI 功能模块硬件连接配置：**

```dts
&rk628_csi {
    status = "okay";
    /* hpd-output-inverted; */
    plugin-det-gpios = <&gpio0 13 GPIO_ACTIVE_HIGH>;
    power-gpios = <&gpio0 17 GPIO_ACTIVE_HIGH>;
    // ...
};
```

| 配置项 | 说明 |
| :--- | :--- |
| `hpd-output-inverted` | HPD 输出取反配置（电路上做了取反时使能） |
| `plugin-det-gpios` | HDMI 插入检测 GPIO，注意有效电平配置 |
| `power-gpios` | RK 主控端 MIPI RX 电源域供电控制 GPIO（常供电可不配） |

#### 3.2.3 图像接收链路 dts 配置

将 RK628D 等转换芯片作为类 camera 设备开发，数据链路配置方法与 MIPI SOC Sensor 一致。

**以 RK3288 rk628 + isp1 链路为例：**

```dts
&rk628_csi {
    status = "okay";
    plugin-det-gpios = <&gpio0 13 GPIO_ACTIVE_HIGH>;
    power-gpios = <&gpio0 17 GPIO_ACTIVE_HIGH>;
    rockchip,camera-module-index = <0>;
    rockchip,camera-module-facing = "back";
    rockchip,camera-module-name = "RK628-CSI";
    rockchip,camera-module-lens-name = "NC";

    port {
        hdmiin_out0: endpoint {
            remote-endpoint = <&mipi_in>;
            data-lanes = <1 2 3 4>;
        };
    };
};

&mipi_phy_rx0 {
    status = "okay";
    ports {
        port@0 {
            mipi_in: endpoint@1 {
                reg = <1>;
                remote-endpoint = <&hdmiin_out0>;
                data-lanes = <1 2 3 4>;
            };
        };
        port@1 {
            dphy_rx_out: endpoint@0 {
                reg = <0>;
                remote-endpoint = <&isp_mipi_in>;
            };
        };
    };
};

&rkisp1 {
    status = "okay";
    port {
        isp_mipi_in: endpoint@0 {
            reg = <0>;
            remote-endpoint = <&dphy_rx_out>;
        };
    };
};

&isp_mmu { status = "okay"; };
```

**以 RK356x rk628 + isp2 链路为例：** 使用 `&csi2_dphy_hw`、`&csi2_dphy0`、`&rkisp`、`&rkisp_vir0` 节点配置。

**以 RK356x rk628 + vicap 链路为例：** 使用 `&mipi_csi2`、`&rkcif`、`&rkcif_mipi_lvds` 节点配置。

### 3.3 camera3_profiles.xml 配置文件说明

配置文件路径：`hardware/rockchip/camera/etc/camera/camera3_profiles_rk3xxx.xml`

主要配置注意事项：
- **name**：需要与驱动名称一致，有大小写区别
- **moduleId**：需要与驱动 dts 中配置的 index 一致
- **scaler.availableStreamConfigurations / scaler.availableMinFrameDurations / scaler.availableStallDurations**：需要正确配置驱动支持的分辨率和最小帧间隔时间
- **sensor.orientation**：图像旋转角度，支持 0、90、180、270

### 3.4 不同芯片平台的接收能力

| 芯片平台 | 接收控制器 | 支持最大分辨率 |
| :--- | :--- | :--- |
| RK3288 / RK3326 / RK3368 | isp | 1920x1080P60 |
| RK3399 | isp | 3840x2160P30（需 ISP 超频） |
| RK3566 / RK3568 | vicap / isp | 3840x2160P30 |

#### 3.4.1 RK3399 ISP 超频的方法

配置 PLL_NPLL 为 650M：
```dts
// rk3399-vop-clk-set.dtsi
<650000000>, <200000000>,  // 原为 <600000000>, <200000000>
```

修改 ISP 最大支持频率：
```c
// drivers/media/platform/rockchip/isp1/dev.c
static const unsigned int rk3399_isp_clk_rate[] = {
    300, 400, 650   // 原为 600
};
```

转换芯片驱动中配置 isp 频率：`RK628_CSI_PIXEL_RATE_HIGH 600000000`

:::note
ISP 驱动中会对配置的频率再加 25% 的余量，所以驱动中配置适当的频率即可。
:::

#### 3.4.2 配置 ISP 使用 CMA 内存的方法

部分平台 HDMI IN 接收图像数据时，可能存在带宽不足导致丢帧或 MIPI 接收异常等问题。异常 log：
```
rkisp1: MIPI mis error: 0x00800000
rkisp1: CIF_ISP_PIC_SIZE_ERROR
```

此时需要提高 DDR 频率，若仍无改善，可给 ISP 预留使用 CMA 内存：

**kernel config 预留 CMA 128MB：**
```
CONFIG_CMA=y
CONFIG_CMA_SIZE_MBYTES=128
```

**dts 配置 ISP 关闭 IOMMU，使用 CMA 内存：**
```dts
&isp_mmu {
    status = "disabled";
};
```

### 3.5 EDID 的配置方法

RK628D 支持 EDID 配置，默认支持分辨率：
- 3840x2160P30
- 1920x1080P60 / P30
- 1280x720P60
- 720x576P50
- 720x480P60

如需修改，直接修改驱动代码中的 EDID 数组：
```c
// drivers/media/i2c/rk628_csi.c
static u8 edid_init_data[] = { ... };
```

---

## 四、HDMI IN APK 适配方法

### 4.1 获取和编译 APK 源码

APK 源码路径：`RKDocs/common/hdmi-in/apk/rkCamera2_based_on_CameraHal3_V1.3.tar.gz`

解压到 `packages/apps/` 目录。在 device 目录增加 rkCamera2 APK 编译：

```makefile
PRODUCT_PACKAGES += \
    Launcher3 \
    rkCamera2
```

### 4.2 APK 源码的适配

APK 通过 ioctl 访问 RK628D 设备节点，获取连接状态和分辨率。设备节点在 isp1/isp2/vicap 链路上可能有差异，需根据实际情况修改 `rkCamera2/jni/native.cpp`。

:::note
确认 selinux 是否关闭：`getenforce` 命令查看。
:::

### 4.3 APK 调试前的准备

1. 先完成驱动调试
2. 确认 camera 设备正确注册到 CameraHal
3. 检查 camera3_profiles.xml 配置

---

## 五、驱动调试方法

驱动调试方法与 SOC Sensor 一致，使用 `media-ctl` 和 `v4l2-ctl` 工具。

工具路径：`hardware/rockchip/camera/etc/tools/`

### 5.1 调试命令举例（以 RK3288 + RK628D 1920x1080P 为例）

**查看链路拓扑结构：**
```bash
media-ctl -d /dev/media0 -p
```

**配置链路连接：**
```bash
media-ctl -d /dev/media0 -l \
  '"m00_b_rk628-csi rk628-csi":0->"rockchip-mipi-dphy-rx":0 [1]'
media-ctl -d /dev/media0 -l \
  '"rockchip-mipi-dphy-rx":1->"rkisp1-isp-subdev":0 [1]'
```

**配置分辨率：**
```bash
media-ctl -d /dev/media0 \
  --set-v4l2 '"rkisp1-isp-subdev":0[fmt:UYVY2X8/1920x1080]'
media-ctl -d /dev/media0 \
  --set-v4l2 '"rkisp1-isp-subdev":0[crop:(0,0)/1920x1080]'
```

**获取图像数据流：**
```bash
v4l2-ctl --verbose -d /dev/video0 \
  --set-fmt-video=width=1920,height=1080,pixelformat='NV12' \
  --stream-mmap=4 \
  --set-selection=target=crop,flags=0,top=0,left=0,width=1920,height=1080
```

**抓取图像 YUV 文件：**
```bash
v4l2-ctl --verbose -d /dev/video0 \
  --set-fmt-video=width=1920,height=1080,pixelformat='NV12' \
  --stream-mmap=4 --stream-skip=5 --stream-count=10 \
  --stream-to=/data/rk628_1920x1080.yuv --stream-poll
```

可用 7yuv 等工具查看抓取的 YUV 文件。

---

## 六、常见问题排查方法

### 6.1 打开 log 开关

驱动 debug log 开关可通过模块参数或 sysfs 节点控制。

### 6.2 寄存器读写

通过 i2c 工具或驱动提供的 sysfs 节点读写 RK628D 寄存器。

### 6.3 MFD 设备报错排除

检查 I2C 通信、电源、复位时序。

### 6.4 Clk det 异常

检查时钟配置、PLL 锁定状态。

### 6.5 HDMI RX 正常的判断方法

- 信号是否锁定
- 分辨率是否正确识别
- 是否有正常数据流输出

### 6.6 Open subdev 权限异常

检查 selinux 权限配置。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_HDMI_IN_Based_On_CameraHal3_CN.pdf` V1.1.0
- 《Rockchip_Developer_Guide_RK628D_DRM_Porting_Guide_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
