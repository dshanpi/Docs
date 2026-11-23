---
title: MIPI 摄像头图像采集
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppDev/Camera
---

本例使用连接到 DshanPI A1 CM5 的 OV13850。传感器经过 ISP 转换后，应用可读取 NV12 图像。底板的 HDMI 接口用于显示输出，采集外部 HDMI 信号需要另配采集设备。

## 识别采集端并选择帧格式

V4L2 把采集设备暴露为 `/dev/video*`。USB 摄像头通常由 UVC 驱动提供节点。MIPI 摄像头则经过传感器、CSI 接收端和 ISP，同一设备可能出现多个节点。先列出设备，再对采集节点查询支持的尺寸、像素格式和帧率。

~~~bash
v4l2-ctl --list-devices
~~~

单帧原始数据没有文件头。把它转换为 PNG 时，FFmpeg 需要知道像素格式和尺寸。连续采集多帧后，还需要指定帧率，才能按正确速度播放视频。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 找到摄像头节点

在 DshanPI A1 CM5 终端执行。

**列出开发板识别到的视频设备。** 先安装查询工具，再查看设备名和节点。

```bash
sudo apt install v4l-utils
v4l2-ctl --list-devices
```

**查找 OV13850 与 ISP 的连接。** 整段复制，查看输出中的 `ov13850` 和 `rkisp_mainpath`。

```bash
for graph in /dev/media*; do
    echo "$graph"; media-ctl -p -d "$graph" | grep -E -A 1 'ov13850|rkisp_mainpath' | head -8
done
```

在输出中找 `ov13850` 和 `rkisp_mainpath`。本次分别出现在 `/dev/media1` 和 `/dev/media4`，主通道下方的设备节点为 `/dev/video42`。如果编号不同，下一步替换为自己的主通道节点。

### 采集并查看图像

**查看摄像头当前格式。** 以下命令以本板的 `/dev/video42` 为例。

```bash
v4l2-ctl -d /dev/video42 --get-fmt-video
```

**采集一帧并核对大小。** 把原始数据写入 `frame.nv12`，再读取字节数。

```bash
v4l2-ctl -d /dev/video42 --stream-mmap=4 --stream-count=1 --stream-to=frame.nv12
wc -c frame.nv12
```

**生成可直接打开的图片。** 用 GStreamer 从摄像头再取一帧并转换。

```bash
gst-launch-1.0 -q v4l2src device=/dev/video42 num-buffers=1 ! video/x-raw,format=NV12 ! videoconvert ! videoscale ! video/x-raw,width=640,height=480 ! jpegenc ! filesink location=cm5-camera.jpg
```

本板格式为 **2112 × 1568、NV12**，原始帧为 **4,967,424 字节**。用文件管理器打开 `cm5-camera.jpg` 查看画面。使用 USB 摄像头时，在 `v4l2-ctl --list-devices` 的 USB 设备下找采集节点，再用 `--list-formats-ext` 查看它支持的格式。

### 把摄像头画面交给 NPU

先采集三帧作为输入，后续检测结果就能与同一批原图对照。运行以下命令前，先关闭其他占用相机的程序。

```bash
mkdir -p ~/cm5-frames
gst-launch-1.0 -q v4l2src device=/dev/video42 num-buffers=3 ! video/x-raw,format=NV12 ! videoconvert ! videoscale ! video/x-raw,width=640,height=480 ! jpegenc ! multifilesink location="$HOME/cm5-frames/frame-%02d.jpg"
```

例如，完成 [YOLOv8 部署](../RKNN/YOLOv8.md) 后，在板上逐帧推理，并给每帧结果单独命名。

**在板上进入 YOLOv8 目录。** 让程序能找到示例自带的运行库。

```bash
cd ~/rknn_yolov8_demo
export LD_LIBRARY_PATH="$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

**逐张检测。** 整段复制循环，每张输入图都会得到独立的结果图。

```bash
for frame in "$HOME"/cm5-frames/frame-*.jpg; do
    ./rknn_yolov8_demo model/yolov8.rknn "$frame" || break
    cp out.png "${frame%.jpg}-result.png"
done
```

本板的 RetinaFace、YOLOv8 检测、姿态、分割和 PP-OCR 程序均对三帧相机图像完成了推理。画面中的物体会随镜头朝向变化。

### 从 OV13850 采集并转换 100 帧

接好 OV13850，按上文确认采集节点。以下以本板的 `/dev/video42` 为例，在空目录中先采集一帧保存为 PNG，再采集 100 帧生成视频。

**采集原始画面。** 第一条保存单帧，第二条保存 100 帧，两条命令均包含续行。

```bash
v4l2-ctl -d /dev/video42 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 \
  --stream-mmap --stream-count=1 --stream-to=one.nv12
v4l2-ctl -d /dev/video42 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 \
  --stream-mmap --stream-count=100 --stream-to=clip.nv12
```

**核对采集长度。** 比较两个文件的字节数。

```bash
wc -c one.nv12
wc -c clip.nv12
```

**转换为便于查看的格式。** 分别生成 PNG 图片和 MP4 视频。

```bash
ffmpeg -v error -f rawvideo -pix_fmt nv12 -s 1920x1080 -r 30 -i one.nv12 -frames:v 1 -pix_fmt rgb24 frame.png
ffmpeg -v error -f rawvideo -pix_fmt nv12 -s 1920x1080 -r 30 -i clip.nv12 -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p clip.mp4
```

**查看视频信息。** 在输出中核对编码、宽高和帧数。

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames -of default=nw=1 clip.mp4
```

```text
3110400 one.nv12
311040000 clip.nv12
codec_name=h264
width=1920
height=1080
nb_frames=100
```

**外接硬件**　本次接入 MIPI CSI 摄像头 OV13850。DshanPI A1 CM5 的 HDMI 接口用于显示；若要采集外部 HDMI 信号，还需另接采集设备。使用 USB 摄像头时，接入 UVC 设备后用 `v4l2-ctl --list-devices` 查找它的采集节点。
