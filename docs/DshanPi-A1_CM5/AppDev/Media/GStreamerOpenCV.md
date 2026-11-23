---
title: OpenCV 读取 GStreamer 视频帧
sidebar_position: 3
slug: /DshanPi-A1_CM5/AppDev/GStreamerOpenCV
---

GStreamer 负责采集、解码和色彩转换，`appsink` 将结果交给 OpenCV。让管线输出 BGR，Python 就能直接保存或处理图像。

## 把采集管线连接到 OpenCV

`v4l2src` 采集一帧，`videoconvert` 做颜色转换，`appsink` 把帧交给应用。Python 用 `cv2.VideoCapture(管线, cv2.CAP_GSTREAMER)` 打开它，再调用 `read()`。若 `isOpened()` 为假，先检查当前 Python 使用的 OpenCV 是否启用了 GStreamer。

~~~bash
/usr/bin/python3 -c 'import cv2; print(cv2.getBuildInformation())' | grep GStreamer
~~~

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 读取五帧测试画面

**在板上安装依赖。**

```bash
sudo apt install python3-opencv gstreamer1.0-plugins-base
```

**读取五帧测试画面。** 将整段命令复制到终端，程序会打开测试管线并读取画面。

```bash
/usr/bin/python3 - <<'PY'
import cv2
cap = cv2.VideoCapture("videotestsrc num-buffers=5 ! video/x-raw,width=320,height=240 ! videoconvert ! video/x-raw,format=BGR ! appsink", cv2.CAP_GSTREAMER)
assert cap.isOpened()
count = 0
while True:
    ok, frame = cap.read()
    if not ok: break
    if count == 0:
        assert cv2.imwrite("cm5-frame.png", frame)
        print(cap.getBackendName(), frame.shape)
    count += 1
cap.release()
print("frames:", count)
assert count == 5
PY
```

本板打印 `GSTREAMER (240, 320, 3)` 和 `frames: 5`。括号里依次是高度、宽度与通道数，第一帧保存在 `cm5-frame.png`。

![DshanPI A1 CM5 从 GStreamer 收到的第一帧](../figures/cm5-frame.png)

### 使用摄像头

先按 [摄像头采集](../Vision/Camera.md) 确认采集节点。将测试源替换为 `v4l2src device=/dev/video42 num-buffers=5`，根据摄像头的实际尺寸，在 `videoconvert` 后接 `videoscale` 和目标宽高。

### 用 OV13850 拍照并预览三帧

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。接好 OV13850，在 DshanPI A1 CM5 桌面终端运行。`snapshot.py` 保存第一帧，`preview.py` 连续显示三帧后退出。

**选择摄像头。** 在示例目录中把 `CM5_CAMERA` 设为已确认的采集节点。

```bash
cd ~/cm5-examples
export CM5_CAMERA=/dev/video42
```

**保存一帧。**

```bash
/usr/bin/python3 snapshot.py
```

**在桌面预览。** 脚本连续读取三帧后退出。

```bash
/usr/bin/python3 preview.py
```

```text
保存 frame.jpg 成功
processed: (480, 640, 3)
```

预览程序连续打印三次相同尺寸，对应三帧 640 × 480 的 BGR 图像。

**外接硬件**　已接 OV13850。其他摄像头请将 `CM5_CAMERA` 改为实际采集节点。
