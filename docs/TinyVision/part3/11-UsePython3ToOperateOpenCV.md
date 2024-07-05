---
sidebar_position: 11
---
# 使用 Python3 操作 OpenCV

### 勾选 OpenCV-Python3 包

`m menuconfig` 进入软件包配置，勾选 

```
OpenCV  --->
	<*> opencv....................................................... opencv libs
	[*]   Enabel sunxi vin isp support
	[*]   Enabel opencv python3 binding support
```

![image-20240122202827423](assets/post/README/image-20240122202827423.png)

然后编译固件即可，请注意 Python3 编译非常慢，而且需要编译机有16G以上内存，需要耐心等待下。

编写一个 Python 脚本，执行上面的相同操作

```python
import cv2
import numpy as np

DISPLAY_X = 240
DISPLAY_Y = 240

frame_width = 480
frame_height = 480
frame_rate = 30

cap = cv2.VideoCapture(0) # 打开摄像头

if not cap.isOpened():
    print("Could not open video device.")
    exit(1)

print("Successfully opened video device.")
cap.set(cv2.CAP_PROP_FRAME_WIDTH, frame_width)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, frame_height)
cap.set(cv2.CAP_PROP_FPS, frame_rate)

ofs = open("/dev/fb0", "wb") # 打开帧缓冲区

while True:
    ret, frame = cap.read() # 读取一帧图像
    if frame.dtype != np.uint8 or frame.ndim != 3:
        print("Not 8 bits per pixel and channel.")
    elif frame.shape[2] != 3:
        print("Not 3 channels.")
    else:
        frame = cv2.transpose(frame) # 图像转置
        frame = cv2.flip(frame, 0) # 图像翻转
        frame = cv2.resize(frame, (DISPLAY_X, DISPLAY_Y)) # 改变图像大小
        framebuffer_width = DISPLAY_X
		_ = open("/sys/class/graphics/fb0/bits_per_pixel", "r")
		framebuffer_depth = int(_.read()[:2])
		_.close()
        frame_size = frame.shape
        framebuffer_compat = np.zeros(frame_size, dtype=np.uint8)
        if framebuffer_depth == 16:
            framebuffer_compat = cv2.cvtColor(frame, cv2.COLOR_BGR2BGR565)
            for y in range(frame_size[0]):
                ofs.seek(y * framebuffer_width * 2)
                ofs.write(framebuffer_compat[y].tobytes())
        elif framebuffer_depth == 32:
            split_bgr = cv2.split(frame)
            split_bgr.append(np.full((frame_size[0], frame_size[1]), 255, dtype=np.uint8))
            framebuffer_compat = cv2.merge(split_bgr)
            for y in range(frame_size[0]):
                ofs.seek(y * framebuffer_width * 4)
                ofs.write(framebuffer_compat[y].tobytes())
        else:
            print("Unsupported depth of framebuffer.")

cap.release()
ofs.close()

```
