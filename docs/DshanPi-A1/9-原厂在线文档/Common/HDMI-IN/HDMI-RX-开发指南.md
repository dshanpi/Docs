---
sidebar_position: 2
---

# HDMI RX 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_HDMI_RX_CN.pdf`（V1.1.7, 2024-04-28）整理，介绍 RK3588/RK3576 平台内置 HDMI RX 模块实现 HDMI IN 功能的开发方法。

:::info 适用范围
- **芯片平台**：RK3588（含 RK3576 MIPI 方案）
- **内核版本**：Linux 5.10
- **Android 版本**：Android 12
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、HDMI IN 功能概述

### 1.1 HDMI RX 模块特性简介

- **HDMI 1.4b / 2.0 RX**：最高支持 4K@60fps
- **支持格式**：RGB888 / YUV420 / YUV422 / YUV444（8bit）
- **Pixel clock**：最高 600MHz
- **HDCP**：支持 HDCP1.4 / HDCP2.3
- **CEC**：硬件 CEC engine
- **EDID**：支持可配置 E-EDID
- **音频输出**：S/PDIF 2ch / I2S 2/4/6/8ch

:::note
RK3588S 不含 HDMI RX 模块。
:::

### 1.2 HDMI IN 功能框图

根据应用场景，HDMI RX 可适配两种框架：
- **TIF 框架** — 图像传输延时更低（约 20-30ms）
- **Camera 框架** — 使用标准 Camera API，方便录像、对接后端算法（延时约 100-120ms）

---

## 二、HDMI RX 驱动代码和 dts 配置

### 2.1 SDK 版本要求

建议升级到最新 SDK 版本，查询方法：
```bash
getprop | grep rksdk
# [ro.rksdk.version]: [ANDROID12_RKR9]
```

### 2.2 驱动代码和 Kernel 配置

**驱动代码：**
```
drivers/media/platform/rockchip/hdmirx/
```

**Kernel Config：**
```
CONFIG_VIDEO_ROCKCHIP_HDMIRX=y
```

### 2.3 dts 配置说明

参考：`arch/arm64/boot/dts/rockchip/rk3588-evb1-lp4.dtsi`

#### 2.3.1 HDMI RX 控制器配置

```dts
&hdmirx_ctrler {
    status = "okay";
    /* 触发 HPD 的有效电平：0-低电平，1-高电平 */
    hpd-trigger-level = <1>;
    hdmirx-det-gpios = <&gpio2 RK_PB5 GPIO_ACTIVE_LOW>;
    pinctrl-names = "default";
    pinctrl-0 = <&hdmim1_rx &hdmirx_det>;
};
```

**板级配置说明：**
- `hpd-trigger-level`：触发 HPD 的有效电平。`&lt;1&gt;` 表示 RK3588 控制引脚和 HDMI 端口 HPD 电平状态相同；`&lt;0&gt;` 表示相反。
- `hdmirx-det-gpios`：HDMI 插入检测引脚，需根据实际硬件配置 GPIO 和有效电平。低电平有效时，pinctrl 需配置为内部上拉。

```dts
hdmi {
    hdmirx_det: hdmirx-det {
        rockchip,pins = <2 RK_PB5 RK_FUNC_GPIO &pcfg_pull_up>;
    };
};
```

#### 2.3.2 预留内存

RK3588 HDMI RX 模块只能使用物理连续内存，需预留至少 **128MB** CMA 内存（按 3840x2160 + RGB888 + 4 个轮转 Buffer 计算）：

```dts
reserved-memory {
    #address-cells = <2>;
    #size-cells = <2>;
    ranges;

    cma {
        compatible = "shared-dma-pool";
        reusable;
        reg = <0x0 (256 * 0x100000) 0x0 (128 * 0x100000)>;
        linux,cma-default;
    };
};
```

:::tip TIF 方案建议
TIF 方式需要 5 块 buffer 轮转。支持 3840x2160 BGR888/RGB888/NV24 时，理论 CMA 大小为 3840×2160×3×5 ≈ 119M，建议分配 256M。
:::

#### 2.3.3 Audio 配置

**DTS 添加声卡配置：**

```dts
hdmiin_dc: hdmiin-dc {
    compatible = "rockchip,dummy-codec";
    #sound-dai-cells = <0>;
};

hdmiin-sound {
    compatible = "simple-audio-card";
    simple-audio-card,format = "i2s";
    simple-audio-card,name = "rockchip,hdmiin";
    simple-audio-card,bitclock-master = <&dailink0_master>;
    simple-audio-card,frame-master = <&dailink0_master>;
    status = "okay";

    simple-audio-card,cpu {
        sound-dai = <&i2s7_8ch>;
    };

    dailink0_master: simple-audio-card,codec {
        sound-dai = <&hdmiin_dc>;
    };
};

&i2s7_8ch {
    status = "okay";
};
```

**HAL 填写 HDMI IN 声卡信息：**
```c
// tinyalsa_hal/audio_hw.c
struct dev_proc_info HDMI_IN_NAME[] = {
    {"realtekrt5651co", "tc358749x-audio"},
    {"rockchiphdmiin", NULL},
    {NULL, NULL},
};
```

#### 2.3.4 HDCP 配置

RK3588 有两个 HDCP2.3 控制器（hdcp0 和 hdcp1），每个有 3 个 port：
- **hdcp0**：DPTX0、DPTX1
- **hdcp1**：HDMIRX、HDMITX0、HDMITX1

**单独支持 HDCP1.4：**
```dts
&hdmirx_ctrler {
    status = "okay";
    hdcp1x-enable;
};
```

**支持 HDCP2.3（默认兼容 HDCP1.4）：**
```dts
&hdcp1 {
    status = "okay";
};

&hdmirx_ctrler {
    status = "okay";
    hdcp2x-enable;
};
```

#### 2.3.5 CEC 配置

```dts
&hdmirx_ctrler {
    status = "okay";
    cec-enable;
};
```

### 2.4 EDID 配置方法

**驱动默认支持的分辨率：**
- 3840x2160 P60 / P50 / P30 / P25 / P24
- 1920x1080 P60 / P50 / P30 / i60 / i50
- 1600x900P60、1440x900P60、1280x800P60
- 1280x720 P60 / P50
- 1024x768P60、800x600P60、640x480P60
- 720x576 P50 / i50、720x480 P60 / i60

**支持输入格式：** RGB888、YUV420、YUV422、YUV444

**两组 EDID：**
- `edid_init_data_340M`：pixel clk &lt; 340M（HDMI 1.4 分辨率，含 4K60 YUV420）
- `edid_init_data_600M`：pixel clk 594M（支持 4K60 YUV422/YUV444/RGB888）

**修改方式：**
1. 直接修改驱动代码：`drivers/media/platform/rockchip/hdmirx/rk_hdmirx.c`
2. 通过 video 节点的 ioctl 接口动态配置（`vidioc_g_edid` / `vidioc_s_edid`）

---

## 三、HDMI IN Video 架构

### 3.1 HDMI IN Video 工作流程

HDMI RX 控制器接收 HDMI 信号 → DMA 传输到内存 → V4L2 video 节点 → 上层应用取流显示。

### 3.2 HDMI RX 主要驱动架构

重点关注以下几个中断和 delayed_work：

| 名称 | 类型 | 说明 |
| :--- | :--- | :--- |
| `hdmirx_5v_det_irq_handler` | 中断 | 5V 检测中断，由 GPIO 引脚 HDMIIRX_DET_L 触发，检测 HDMI 拔插 |
| `hdmirx_hdmi_irq_handler` | 中断 | HDMI RX 控制器中断，初始化配置 + 监测信号变化 |
| `hdmirx_dma_irq_handler` | 中断 | DMA 中断，图像预览过程中 Buffer 轮转使用 |
| `hdmirx_delayed_work_hotplug` | delayed_work | 热拔插对应 work，对 HDMI RX 模块进行配置处理 |
| `hdmirx_delayed_work_res_change` | delayed_work | 信号变化对应 work，重新配置控制器，等待信号锁定 |

### 3.3 图像 Buffer 轮转机制

- **QBuf / DQBuf**：用户通过 QBuf 传入空闲 buffer，通过 DQBuf 获取已填充数据的 buffer
- **Line flag irq**：配置固定行数产生中断（当前为 width/2 行，即半帧），提前更新 buffer 物理地址（下一个 vsync 才生效）
- **DMA idle irq**：DMA 空闲中断（frame end），一帧传输完成后将 buffer 加入 vb_done list
- **Stream on**：开流指令，初始 buffer 使用 curr_buf
- **Stream off**：关流指令，驱动等待中断后停止数据流，归还所有 buffer

### 3.4 图像传输延时

| 框架 | 延时 |
| :--- | :--- |
| TIF 框架 | 约 20-30ms |
| Camera 框架 | 约 100-120ms |

---

## 四、HDMI IN HDCP 功能

:::caution
HDCP1.4 或 HDCP2.3 KEY 都需要客户自行到 HDCP 官网购买，RK3588 没有内置 HDCP KEY。
:::

### 4.1 HDCP1.4

#### 4.1.1 dts 配置

参考 HDCP 配置章节，配置 `hdcp1x-enable`。

#### 4.1.2 Key 烧写

**工具获取：**
- Key 拆分转换工具：`RKTools/windows/Rockchip_HdcpKey_Writer_V1.0.1.7z`（KeyConvertor）
- Key 烧写工具：同上

**烧写步骤：**
1. 用 KeyConvertor 从原始 Key 文件中拆出部分 Key，转成 `.skf` 格式
2. 机器进入 Loader 模式
3. 烧写工具勾选 "hdcp1.4Hdmirx" 和 "RK3588" 选项
4. "Do AES" 可选（AES 加密更安全，默认只有 SEED 加密）
5. 导入 .skf 文件，点击写入

**HDCP1.4 Key 结构（308 Bytes）：**
- 8 Bytes KSV（5 Bytes KSV + 3 Bytes 0x0）
- 280 Bytes DPK
- 20 Bytes SHA

#### 4.1.3 HDCP1.4 状态查看

```bash
cat /sys/class/misc/hdmirx_hdcp/status
```

| 状态 | 说明 |
| :--- | :--- |
| HDCP Disable | hdcp1.4 没使能 |
| HDCP1.4: Authenticated start | 认证过程中 |
| HDCP1.4: Authenticated success | 认证成功 |
| HDCP1.4: Authenticated failed | 认证失败 |
| HDCP1.4: Unknown status | 未知状态 |

### 4.2 HDCP2.3

:::note
HDCP2.3 Firmware 打包工具需通过 Redmine 单独获取。
:::

#### 4.2.1 dts 配置

参考 HDCP 配置章节，配置 `hdcp2x-enable`，并使能 `&hdcp1`。

#### 4.2.2 打包 firmware 和启动服务

1. 解压 `WC_HDCP2_BASE_ESM_Firmware` 到 Linux 环境
2. 把 `hdcp_receivers.bin`（及可选的 `hdcp_transmitter.bin`）拷贝到根目录和 tools/ 目录
3. 执行打包脚本：
   ```bash
   ./build_rockchip_fw.sh
   ```
4. 选择固件类型（1 = HDMIRX + HDMITX）
5. 创建 RX KEY 数量（生成到 `./rxkeys/` 目录）
6. 可选打包成 .skf 文件（用于 RK 烧写工具）

**部署：**
- `hdcp2_hdmi.fw` 放到 `device/rockchip/rk3588/`，编译时拷贝到 `vendor/firmware/hdcp2_hdmi.fw`
- 用 RKDevInfoTool.exe 选择 HDCP2X_HDMIRX 导入 .skf，Loader 模式烧写（无需 AES 加密）

**hdcp2_rx_tx 服务**：开机自动加载，认证异常时 `logcat | grep HDCP2` 查看 log。

#### 4.2.3 HDCP2.3 状态查看

```bash
cat /sys/class/misc/hdmirx_hdcp/status
```

| 状态 | 说明 |
| :--- | :--- |
| HDCP Disable | HDCP 没使能 |
| HDCP2.3: Authenticated success | 认证成功 |
| HDCP2.3: Authenticated failed | 认证失败 |
| HDCP2.3: No decrypted | 源端没有开启 HDCP2.x |

### 4.3 HDCP KEY 烧写

**两种方式：**
1. **用 RK 提供的工具烧写**（SDK 的 RKTools/windows/ 目录）
2. **自行写应用烧写** — 使用 `libhdcp.so` 库接口：

```c
enum HDCP_KEY_ID {
    HDCP1X_KEY_HDMITX_RK33 = 0,
    HDCP1X_KEY_HDMITX_RK3588,
    HDCP1X_KEY_HDMIRX_RK3588,
    HDCP1X_KEY_HDMIRX_RK628,
    HDCP1X_KEY_DP_RK3588,
    HDCP2X_KEY_HDMIRX_RK3588,
};

// 加密 Key（不写入 vendor）
int hdcp_key_process(enum HDCP_KEY_ID id, uint8_t *keyin, int keyin_size,
                     uint8_t *keyout, int keyout_size);

// 加密并写入 vendor
int hdcp_key_process_and_write(enum HDCP_KEY_ID id, uint8_t *keyin, int keyin_size);

// 直接写入 vendor
int hdcp_key_write(enum HDCP_KEY_ID id, uint8_t *key, int size);

// 从 vendor 读取
int hdcp_key_read(enum HDCP_KEY_ID id, uint8_t *key, int *len);
```

---

## 五、HDMI IN CEC 功能

RX 端 `ro.hdmi.device_type=0`（TV），TX 端为 4（Playback）。

`device/rockchip/common` 配置修改：
```makefile
PRODUCT_PROPERTY_OVERRIDES += ro.hdmi.device_type=0
PRODUCT_PACKAGES += hdmi_cec.$(TARGET_BOARD_PLATFORM)
DEVICE_MANIFEST_FILE += device/rockchip/common/manifests/android.hardware.tv.cec@1.0-service.xml
```

---

## 六、HDMI IN APK 适配方法

### 6.1 APK 源码路径

- `packages/apps/TV/partner_support/samples` — TV 源数据服务（开机运行隐藏服务，桌面无图标）
- `packages/apps/rkCamera2` — 预览 APK（桌面图标名为 HdmiIn）
- `hardware/rockchip/tv_input` — HAL 层代码（开关流、热拔插、分辨率切换与驱动交互）

**使能 HDMI IN：**
```makefile
# device/rockchip/rk3588/BoardConfig.mk
BOARD_HDMI_IN_SUPPORT := true
```

:::note
开启后默认配置 `vendor.hwc.enable_sideband_stream_2_mode` 为 1，开机后 `getprop` 检查。
:::

### 6.2 HdmiIn 预览 APK 说明

**MainActivity 主界面** — TIF 预览方式，支持 HDMI TO MIPI 和 HDMI RX 通路。

```java
String INPUT_ID = "com.example.partnersupportsampletvinput/.SampleTvInputService/HW0";
Uri channelUri = TvContract.buildChannelUriForPassthroughInput(INPUT_ID);
// tvinput.hdmiin.type: 0=HDMI RX, 1=HDMI TO MIPI
// SystemProperties.set("tvinput.hdmiin.type", "1");
tvView.tune(INPUT_ID, channelUri);
```

:::caution RK3576 注意
如果产品没有 HDMI RX（如 RK3576），需要配置 `tvinput.hdmiin.type=1`，否则 TIF 方案会黑屏。
:::

**TIF 预览需开启 vtunnel 配置：**

```dts
&rkvtunnel {
    status = "okay";
};
```

```dts
// rk3588.dtsi
rkvtunnel: rkvtunnel {
    compatible = "rockchip,video-tunnel";
    status = "disabled";
};
```

```
CONFIG_ROCKCHIP_VIDEO_TUNNEL=y
```

**CMA 内存不足问题：** TIF 需要 5 块 buffer 轮转。若 log 显示 `cma: Out of memory` 且已申请 buffer 少于 5 块，需增大 CMA 预留内存。

**RockchipCamera2 界面** — Camera 预览方式，支持 HDMI TO MIPI 与 HDMI RX 通路。

启用方式：
```makefile
# BoardConfig.mk
CAMERA_SUPPORT_HDMI := true
```
配置 `persist.sys.hdmiinmode=2`，点击 HdmiIn 应用启动 camera 方式预览，也可用系统自带 camera 预览。

### 6.3 TIF 与 Camera 预览方式差异

| | 优点 | 缺点 |
| :--- | :--- | :--- |
| **TIF** | 延迟低 | 不支持屏幕旋转、分屏、画中画、异显；app 拿不到预览 buffer；不支持 screencap 截图 |
| **Camera** | app 能拿到预览数据进行后处理 | 延迟高于 TIF |

**补充说明：**
1. TIF 不支持画中画，可切换到 camera 方案（MainActivity 中 "PIP" 按钮）
2. TIF 支持 MediaProjectionManager 虚拟屏录像/截图，支持 screenrecord 录屏。需要配置：
   ```
   debug.sf.enable_hwc_vds=true
   ```
3. TIF 不支持 adb screencap 命令截图

---

## 七、驱动调试方法

### 7.1 调试工具获取

使用 `v4l2-ctl` 工具，SDK 编译时自动集成，路径：`hardware/rockchip/camera/etc/tools/`

### 7.2 调试命令举例

#### 7.2.1 查看 HDMIRX 的 video 节点

```bash
grep -H hdmirx /sys/class/video4linux/video*/name
```

#### 7.2.2 查找 rk_hdmirx 设备

```bash
v4l2-ctl -d /dev/video17 -D
# Driver name: rk_hdmirx
```

#### 7.2.3 获取驱动 timings 信息

```bash
v4l2-ctl -d /dev/video17 --get-dv-timings
```

#### 7.2.4 实时查询 timings 信息

```bash
v4l2-ctl -d /dev/video17 --query-dv-timings
```

debug 等级为 2 时，dmesg 打印详细信息：
```
hdmirx_get_pix_fmt: pix_fmt: YUV422
hdmirx_get_colordepth: color_depth: 24
act:3840x2160, total:4400x2250, fps:60, pixclk:594024000
hfp:172, hs:92, hbp:296, vfp:8, vs:10, vbp:72
tmds_clk:594024000
```

#### 7.2.5 查询分辨率和图像格式

```bash
v4l2-ctl -d /dev/video17 --get-fmt-video
# Pixel Format: 'NV16'
```

#### 7.2.6 开启图像数据流

```bash
v4l2-ctl -d /dev/video17 --stream-mmap=4 --stream-poll
```

#### 7.2.7 抓取图像文件

```bash
v4l2-ctl -d /dev/video17 \
  --set-fmt-video=width=3840,height=2160,pixelformat='NV16' \
  --stream-mmap=4 --stream-skip=5 --stream-count=10 \
  --stream-to=/data/hdmirx_3840x2160.yuv --stream-poll
```

#### 7.2.8 正常取流 log

正常情况下 v4l2-ctl 会持续打印帧率信息。

---

## 八、常见问题调试方法

### 8.1 打开 log 开关

通过驱动模块参数或 sysfs 节点打开 debug log。

### 8.2 通过 io 命令读写寄存器

使用 `busybox devmem` 或 `io` 工具读写 HDMI RX 寄存器。

### 8.3 HDMI RX 状态查询

通过 `/sys/class/misc/hdmirx_*` 相关节点查询状态。

### 8.4 HDMI IN 信号不锁定问题

- 检查源端输出是否正常
- 检查 HDMI 线是否良好
- 检查 EDID 配置
- 检查 TMDS 时钟是否在支持范围

### 8.5 HDMI IN 不出图、黑屏问题

- 确认信号是否锁定
- 确认驱动是否正常 probe
- 检查 CMA 内存是否足够
- 检查 buffer 轮转是否正常

### 8.6 信号不稳定失锁问题

- 检查信号源稳定性
- 检查线缆质量
- 检查 PCB 布线和阻抗匹配

### 8.7 源端切分辨率失败

- 检查分辨率切换中断是否触发
- 检查 EDID 是否包含目标分辨率

### 8.8 驱动统计 TMDSCLK 错误

检查寄存器配置是否正确，时钟是否稳定。

### 8.9 源端特殊场景闪黑屏

- 检查 buffer 轮转机制
- 检查 vsync 时序

---

## 九、典型日志说明

| 日志类型 | 说明 |
| :--- | :--- |
| 拔插日志 | 5V 检测中断 → hotplug work → 信号锁定/失锁 |
| 切换分辨率日志 | res_change work → 重新配置 → 等待信号锁定 |
| 信号未锁定异常日志 | 超时未锁定，打印状态寄存器 |
| 驱动开关流日志 | stream on/off 流程，buffer 初始化/释放 |
| HDMI IN 数据流打印 | DMA 中断频率、帧率信息 |
| 信号锁定后失锁 | 运行中异常失锁，可能是信号质量问题 |
| TMDSCLK 统计错误 | TMDS 时钟统计偏差 |
| 热拔插或切分辨率重启 | 相关补丁说明 |

---

## 十、重启问题相关补丁说明

热拔插或切分辨率时可能触发重启问题，需对应补丁修复。详见 V1.1.7 版本新增的补丁说明章节。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_HDMI_RX_CN.pdf` V1.1.7
- 《Rockchip_Developer_Guide_HDMI_IN_Based_On_CameraHal3_CN.pdf》
- 《Android12+ 版本 HDMIIN 桥接芯片开发指南》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
