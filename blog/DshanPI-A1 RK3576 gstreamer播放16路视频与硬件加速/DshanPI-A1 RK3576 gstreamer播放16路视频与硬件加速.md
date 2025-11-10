# DshanPI-A1 RK3576 gstreamer播放16路视频与硬件加速

## 演示视频

[https://www.bilibili.com/video/BV1m34VziE2s](https://www.bilibili.com/video/BV1m34VziE2s)

## 一、实验环境
| 类别     | 具体配置             |
| ------ | ---------------- |
| 板卡     | DshanPI-A1       |
| 主控芯片   | RK3576   |
| 操作系统   | Armbian          |
| 桌面系统   | GNOME            |
| 窗口系统   | Wayland          |
| GPU 驱动 | Panfrost |
### 核心硬件加速单元说明

RK3576 芯片集成三类关键硬件加速单元，分别负责不同环节的视频处理：



* **VPU（视频处理单元）**：负责视频解码（如 H.264 硬解），核心元件 `mppvideodec` 调用此单元；

* **RGA（图像加速单元）**：负责图像缩放、格式转换（如 NV12→RGBA），可通过 `mppvideodec` 参数启用；

* **GPU（图形处理单元）**：负责视频渲染、多画面拼接（如 `glvideomixer` 拼接画面），由 Panfrost 驱动管理。

## 二、GStreamer 工具与插件安装

执行以下命令安装全套 GStreamer 工具及 RK3576 硬件加速插件：



```
# 基础工具（gst-launch-1.0 等）
sudo apt install -y gstreamer1.0-tools

# 基础插件集（音频/视频基础功能）
sudo apt install -y gstreamer1.0-plugins-base
sudo apt install -y gstreamer1.0-plugins-good
sudo apt install -y gstreamer1.0-plugins-bad

# FFmpeg 集成插件（软解 fallback）
sudo apt install -y gstreamer1.0-libav

# RK3576 硬件加速插件（VPU/RGA 支持）
sudo apt install -y gstreamer1.0-rockchip1

# GPU 渲染依赖（glvideomixer 等）
sudo apt install -y libgstreamer-gl1.0-0
```

## 三、基础硬解码播放实践

### 1. 最简硬解码命令



```
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec ! waylandsink
```

#### 命令链路解析



| 元件            | 功能说明                                                 |
| ------------- | ---------------------------------------------------- |
| `filesrc`     | 读取本地视频文件（需替换为实际路径，如 `/root/bad_apple.mp4`） |
| `qtdemux`     | 解封装 MP4 文件，分离视频流与音频流（MP4 属于 QuickTime 容器格式）          |
| `h264parse`   | 解析 H.264 码流，将 MP4 中的 AVCC 格式转为解码器支持的 Annex B 裸流      |
| `mppvideodec` | 调用 RK3576 VPU 硬解码，输出 NV12 格式图像（硬件解码默认格式）             |
| `waylandsink` | 调用 GPU 渲染，在 Wayland 窗口显示视频（自动将 NV12 转为 RGB 格式）       |

### 2. 关键环节补充说明

#### （1）解封装与码流解析



* MP4 文件是「容器」，需通过 `qtdemux` 分离出内部的视频流（H.264）和音频流；

* H.264 流有两种格式：MP4 中默认是 **AVCC 格式**，而硬件解码器仅支持 **Annex B 裸流**，因此必须通过 `h264parse` 转换。

#### （2）解码
* h264解码得到nv12图像;
在没有硬解码的系统中，可以使用元件 avdec_h264 代替 ;
avdec_h264 就是调用ffmpeg的软件解码器;
也可以用来对比硬解软解的性能差距。

#### （3）渲染（Wayland vs X11）
*  wayland窗口系统中，可以直接传入nv12图像，自动调用gpu转成rgb渲染显示出来;
x11窗口系统中，需要额外元件将nv12图像转成rgb才能渲染;
这里因为用的wayland窗口系统，所以渲染元件是waylandsink;
如果是x11 则要用xvimagesink或者glimagesink。


| 窗口系统    | 渲染元件          | 支持输入格式             | 额外说明                  |
| ------- | ------------- | ------------------ | --------------------- |
| Wayland | `waylandsink` | NV12、RGBA/BGRA     | 自动用 GPU 转 NV12→RGB 渲染 |
| X11     | `xvimagesink` | RGB/RGBA（不支持 NV12） | 需用 RGA/GPU 提前转格式      |
| X11     | `glimagesink` | RGB/RGBA（不支持 NV12） | 依赖 GPU 转格式，性能优于 XV    |

### 3. 硬件负载查看命令

通过以下命令实时监控 VPU/RGA/GPU 占用率（建议用 `tmux` 分屏同时查看）：

#### （1）查看 RGA 占用率



```
watch -n 1 cat /sys/kernel/debug/rkrga/load
```

#### （2）查看 GPU 占用率（Panfrost 驱动）



```
watch -n 1 cat /sys/class/devfreq/27800000.gpu/load
```

#### （3）查看 GPU 占用率（Mali 官方驱动，可选）



```
watch -n 1 cat /sys/devices/platform/fb000000.gpu/utilisation
```

## 四、RGA 硬件加速的应用场景

RGA 主要用于**图像缩放**和**格式转换**，可减轻 GPU 负载，尤其适合多视频播放场景。

### 1. RGA 实现视频缩放（全屏播放）

若视频分辨率为 720P，需全屏适配 1080P 屏幕，通过 `mppvideodec` 的 `width`/`height` 参数调用 RGA 缩放：



```
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec width=1920 height=1080 ! waylandsink
```

#### 对比：GPU 缩放方案

若不启用 RGA，仅通过 `waylandsink` 的 `fullscreen=true` 让 GPU 缩放，可对比两者负载差异：



```
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec ! waylandsink fullscreen=true
```

### 2. RGA 实现图像格式转换

Wayland 中 `waylandsink` 不支持 RGB/BGR 格式，仅支持 **RGBA/BGRA**（带透明度）；X11 中 `xvimagesink` 不支持 NV12，需转 RGB 格式。通过 `mppvideodec` 的 `format` 参数调用 RGA 转格式：



```
# Wayland 场景：NV12→RGBA（减轻 GPU 转格式负载）
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec format=RGBA ! waylandsink

# X11 场景：NV12→RGB（适配 xvimagesink）
gst-launch-1.0 filesrc location=/root/bad_apple.mp4 ! qtdemux ! h264parse ! mppvideodec format=RGB ! xvimagesink
```

### 3. RGA 与 GPU 选择原则



| 维度   | RGA              | GPU             |
| ---- | ---------------- | --------------- |
| 负载情况 | 低占用、波动小，多核心支持    | 高占用、波动大，易超 50%  |
| 功能侧重 | 图像缩放、格式转换（专用）    | 渲染、多画面拼接（通用）    |
| 适用场景 | 单视频缩放、格式转换       | 多视频拼接、3D 渲染     |
| 选择建议 | 能用 RGA 则优先用，平衡负载 | RGA 不支持的场景（如拼接） |

## 五、多画面拼接实践

多画面拼接依赖 `glvideomixer`（GPU 实现），需注意**多路流冲突处理**和**队列缓冲优化**。
实际上rga也可以拼接，但是gst的元件上没有实现 直接用rga编程是可以拼接的。
### 1. 2 路画面拼接（基础版）

多路视频需为 `qtdemux` 命名（避免冲突），通过 `xpos`/`ypos` 定义画面位置：



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! \
qtdemux name=demux_left ! h264parse ! \
mppvideodec format=RGBA width=960 height=1080 ! \
glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! \
qtdemux name=demux_right ! h264parse ! \
mppvideodec format=RGBA width=960 height=1080 ! \
glvideomixer.sink_1 \
glvideomixer name=glvideomixer \
sink_0::xpos=0 sink_0::ypos=0 \ 
sink_1::xpos=960 sink_1::ypos=0 ! \
waylandsink
```

### 2. 2 路画面拼接（优化版，增加队列）

多路视频处理耗时增加，需添加 `queue` 缓冲防止卡顿（每路流关键节点均需加队列）：



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! queue ! \
qtdemux name=demux_left ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=960 height=1080 ! queue ! \
glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! queue ! \
qtdemux name=demux_right ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=960 height=1080 ! queue ! \
glvideomixer.sink_1 \
glvideomixer name=glvideomixer \
sink_0::xpos=0 sink_0::ypos=0 \
sink_1::xpos=960 sink_1::ypos=0 ! queue ! \
waylandsink
```

### 3. 4 路画面拼接（2×2 网格）



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux1 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux2 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_1 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux3 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_2 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux4 ! queue ! h264parse ! \
mppvideodec format=RGBA width=960 height=540 ! queue ! glvideomixer.sink_3 \
glvideomixer name=glvideomixer \
sink_0::xpos=0    sink_0::ypos=0    sink_0::width=960 sink_0::height=540 \
sink_1::xpos=960  sink_1::ypos=0    sink_1::width=960 sink_1::height=540 \
sink_2::xpos=0    sink_2::ypos=540  sink_2::width=960 sink_2::height=540 \
sink_3::xpos=960  sink_3::ypos=540  sink_3::width=960 sink_3::height=540 ! queue ! \
waylandsink
```

### 4. 16 路画面拼接（4×4 网格，高负载场景）

#### （1）解决文件描述符上限问题

16 路视频会创建大量 DMA 缓冲区（占用 Linux 文件描述符 FD），需先提高 FD 上限：



```
ulimit -n 4096  # 临时生效，重启后需重新设置
```

#### （2）16 路拼接命令



```
gst-launch-1.0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux1 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_0 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux2 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_1 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux3 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_2 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux4 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_3 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux5 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_4 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux6 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_5 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux7 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_6 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux8 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_7 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux9 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_8 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux10 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_9 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux11 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_10 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux12 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_11 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux13 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_12 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux14 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_13 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux15 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_14 \
filesrc location=/root/bad_apple.mp4 ! qtdemux name=demux16 ! queue ! h264parse ! queue ! \
mppvideodec format=RGBA width=480 height=270 ! queue ! \
glvideomixer.sink_15 \
glvideomixer name=glvideomixer \
sink_0::xpos=0 sink_0::ypos=0 sink_0::width=480 sink_0::height=270 \
sink_1::xpos=480 sink_1::ypos=0 sink_1::width=480 sink_1::height=270 \
sink_2::xpos=960 sink_2::ypos=0 sink_2::width=480 sink_2::height=270 \
sink_3::xpos=1440 sink_3::ypos=0 sink_3::width=480 sink_3::height=270 \
sink_4::xpos=0 sink_4::ypos=270 sink_4::width=480 sink_4::height=270 \
sink_5::xpos=480 sink_5::ypos=270 sink_5::width=480 sink_5::height=270 \
sink_6::xpos=960 sink_6::ypos=270 sink_6::width=480 sink_6::height=270 \
sink_7::xpos=1440 sink_7::ypos=270 sink_7::width=480 sink_7::height=270 \
sink_8::xpos=0 sink_8::ypos=540 sink_8::width=480 sink_8::height=270 \
sink_9::xpos=480 sink_9::ypos=540 sink_9::width=480 sink_9::height=270 \
sink_10::xpos=960 sink_10::ypos=540 sink_10::width=480 sink_10::height=270 \
sink_11::xpos=1440 sink_11::ypos=540 sink_11::width=480 sink_11::height=270 \
sink_12::xpos=0 sink_12::ypos=810 sink_12::width=480 sink_12::height=270 \
sink_13::xpos=480 sink_13::ypos=810 sink_13::width=480 sink_13::height=270 \
sink_14::xpos=960 sink_14::ypos=810 sink_14::width=480 sink_14::height=270 \
sink_15::xpos=1440 sink_15::ypos=810 sink_15::width=480 sink_15::height=270 ! queue ! \
waylandsink
```
