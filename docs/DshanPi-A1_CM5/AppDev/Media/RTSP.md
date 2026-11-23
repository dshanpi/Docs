---
title: RTSP 视频推流
sidebar_position: 2
slug: /DshanPi-A1_CM5/AppDev/RTSP
---

GStreamer 将视频源、编码器和 RTP 打包器连成管线，RTSP 服务负责让客户端取得视频。本例在 DshanPI A1 CM5 上打开两个终端，先用测试图验证整个链路。

## 顺着视频源、服务器和播放器检查推流

GStreamer 用 `!` 连接管线中的元素。采集端提供帧，编码器压缩图像，RTSP 服务端发布流地址，播放器连接该地址后解码。服务监听地址、端口和挂载路径必须与客户端填写的 URL 一致。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在终端一启动服务

**在开发板的第一个终端安装服务所需的软件包。**

```bash
sudo apt install python3-gi gir1.2-gst-rtsp-server-1.0 gstreamer1.0-tools gstreamer1.0-plugins-good
```

**创建测试服务。** 整段复制到终端，最后一行 `PY` 结束文件写入。

```bash
cat > cm5-rtsp.py <<'PY'
import gi
gi.require_version("Gst", "1.0")
gi.require_version("GstRtspServer", "1.0")
from gi.repository import GLib, Gst, GstRtspServer
Gst.init(None)
server = GstRtspServer.RTSPServer()
server.set_address("127.0.0.1")
server.set_service("18554")
factory = GstRtspServer.RTSPMediaFactory()
factory.set_launch("( videotestsrc is-live=true ! video/x-raw,format=I420,width=320,height=240,framerate=10/1 ! jpegenc ! rtpjpegpay name=pay0 pt=26 )")
factory.set_shared(True)
server.get_mount_points().add_factory("/cm5", factory)
assert server.attach(None)
GLib.MainLoop().run()
PY
```

**启动服务。** 保持这个终端运行，再到第二个终端接收视频。

```bash
/usr/bin/python3 cm5-rtsp.py
```

保持这个终端运行。服务监听本机 `18554` 端口，挂载路径为 `/cm5`。

### 在终端二接收并解码

```bash
gst-launch-1.0 -q rtspsrc location=rtsp://127.0.0.1:18554/cm5 protocols=tcp latency=100 ! rtpjpegdepay ! jpegdec ! identity eos-after=11 ! fakesink && echo "RTSP OK"
```

本板打印 `RTSP OK`，表示已收到并解码测试帧。在 GNOME 桌面上，将 `identity eos-after=11 ! fakesink` 换成 `autovideosink` 可打开预览。验证结束后，在服务终端按 **Ctrl+C**。

需要同一局域网的电脑观看时，将程序的监听地址改为 DshanPI A1 CM5 的局域网地址并重启服务，在 VLC 的“打开网络串流”中填写 `rtsp://开发板地址:18554/cm5`。

### 推送 OV13850 的实时画面

先按 [摄像头采集](../Vision/Camera.md) 找到 ISP 主通道，停止测试图服务。在 `cm5-rtsp.py` 中将 `factory.set_launch(...)` 这一行替换为下方内容，重新运行服务和终端二的客户端。

```python
factory.set_launch("( v4l2src device=/dev/video42 ! videoconvert ! videoscale ! videorate ! video/x-raw,format=I420,width=320,height=240,framerate=10/1 ! jpegenc ! rtpjpegpay name=pay0 pt=26 )")
```

本次连接 OV13850 后，同一客户端再次打印 `RTSP OK`。

### 用 MediaMTX 推送并解码 HEVC 视频

按上文解压 MediaMTX v1.14.0。在 DshanPI A1 CM5 桌面打开三个终端，分别启动服务、推送视频和读取视频。本例只在板内回环地址监听。

**在终端一写入服务配置。** 整段复制到 MediaMTX 程序所在目录的终端。

```bash
# 终端一，在 mediamtx 程序目录中运行
cat > cm5-local.yml <<'EOF'
rtspAddress: 127.0.0.1:18555
rtspTransports: [tcp]
rtmp: no
hls: no
webrtc: no
srt: no
paths:
  live:
    source: publisher
EOF
```

**启动 MediaMTX。** 让这个终端保持运行。

```bash
./mediamtx cm5-local.yml
```

```bash
# 终端二，推送 OV13850 的 HEVC 视频
gst-launch-1.0 -e v4l2src device=/dev/video42 ! videoconvert ! videoscale ! \
  video/x-raw,format=NV12,width=640,height=480 ! queue ! mpph265enc ! h265parse ! \
  rtspclientsink protocols=tcp location=rtsp://127.0.0.1:18555/live
```

**在终端三检查视频流。** 先设置地址，再查看编码格式和画面尺寸。

```bash
# 终端三，查看视频格式，再解码五帧
url=rtsp://127.0.0.1:18555/live
ffprobe -v error -rtsp_transport tcp -show_entries stream=codec_name,width,height -of default=nw=1 "$url"
```

**试解码五帧。** 等待终端打印 `decoded frames: 5`。

```bash
ffmpeg -v error -rtsp_transport tcp -i "$url" -frames:v 5 -f null - && echo 'decoded frames: 5'
```

```text
codec_name=hevc
width=640
height=480
decoded frames: 5
```

核对后在前两个终端按 `Ctrl+C`。本板 VLC 3.0.20 直接访问该 TCP 流时返回 `Failed to setup RTSP session`；上面的解码结果来自 FFmpeg。若系统缺少 `rtspclientsink` 或 `ffprobe`，安装 `gstreamer1.0-rtsp` 和 `ffmpeg`。

**外接硬件**　本次用已连接的 OV13850 推流，在本板上解码。跨设备播放还需让服务监听局域网地址，并在另一台电脑上打开对应的 RTSP 地址。
