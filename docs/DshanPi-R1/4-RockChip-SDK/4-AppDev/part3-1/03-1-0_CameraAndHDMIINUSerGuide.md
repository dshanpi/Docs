---
sidebar_position: 1
---
# HDMI IN与摄像头

## 0.前言

在发行版系统中安装v4l-utils库，执行如下命令安装：

```
sudo apt install v4l-utils
```



由于获取的图像是原始文件，为了方便查看可以使用FFMPEG库将原始文件封装成PNG或MP4文件

```
sudo apt install ffmpeg
```



## 1.HDMI IN

- **HDMI OUT**（输出）：把画面/声音 **发送给** 电视、显示器。
- **HDMI IN**（输入）：把外部设备（如电脑、游戏机、相机）的画面/声音 **接入到本设备**。

| 设备类型                         | HDMI IN 用途                                        |
| -------------------------------- | --------------------------------------------------- |
| **采集卡（Video Capture Card）** | 把相机/电脑的 HDMI 信号输入到电脑，用于直播、录制。 |
| **电视/显示器**                  | 接收来自电脑、机顶盒、PS5 的 HDMI 信号并显示。      |
| **KVM 切换器**                   | 多台电脑共用一台显示器，通过 HDMI IN 切换输入源。   |
| **嵌入式板卡（如 RK3576）**      | 把 HDMI 信号输入到板卡，进行图像处理或 AI 分析。    |

问：那么我该怎么使用HDMI IN? 

答：与摄像头使用方式一样。也就是直接访问`/dev/video0`节点即可获取数据。



将电脑输出的画面使用HDMI OUT设备 数据线 接入开发板的HDMI IN接口。

![image-20250829111514696](${images}/image-20250829111514696.png)

### 1.1  拍摄图像

使用v4l-utils库，访问摄像头节点即可获取一张图像：

```
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 --stream-mmap --stream-to=camera.nv12 --stream-count=1
```

使用ffmpeg封装成PNG图片

```
ffmpeg -f rawvideo -pix_fmt nv12 -s 1920x1080 -i camera.nv12 -frames:v 1 -pix_fmt rgb24 camera.png
```

使用ffplay查看PNG图片

```
ffplay camera.png
```



### 1.2 拍摄视频

使用v4l-utils库，访问摄像头节点即可获取100帧图像：

```
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 --stream-mmap --stream-to=camera.nv12 --stream-count=100
```

使用ffmpeg封装成MP4视频

```
ffmpeg -f rawvideo -pix_fmt nv12 -s 1920x1080 -r 30 -i camera.nv12 -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p camera.mp4
```

使用ffplay查看MP4视频

```
ffplay camera.mp4
```



## 2.Camera

### 2.1 USB Camera

​	USB Camera（USB 摄像头）是一类通过 **USB 接口** 与主机（PC、嵌入式板卡、手机、平板等）相连的 **即插即用视频采集设备**。它内部集成了 **镜头、图像传感器（CMOS/CCD）、ISP 处理单元、USB 控制器和 UVC 协议固件**，把光学信号直接转成 USB 视频数据流，供操作系统或 App 调用。



使用v4l-utils库，访问摄像头节点(以video11为例)即可获取一张图像：

> 注意：这里可通过拔插USB摄像头，查看`ls /dev/video*`了解USB摄像头的节点号

```
v4l2-ctl -d /dev/video11 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 --stream-mmap --stream-to=camera.nv12 --stream-count=1
```

使用ffmpeg封装成PNG图片

```
ffmpeg -f rawvideo -pix_fmt nv12 -s 1920x1080 -i camera.nv12 -frames:v 1 -pix_fmt rgb24 camera.png
```

使用ffplay查看PNG图片

```
ffplay camera.png
```



使用v4l-utils库，访问摄像头节点即可获取100帧图像：	

```
v4l2-ctl -d /dev/video11 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 --stream-mmap --stream-to=camera.nv12 --stream-count=100
```

使用ffmpeg封装成MP4视频

```
ffmpeg -f rawvideo -pix_fmt nv12 -s 1920x1080 -r 30 -i camera.nv12 -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p camera.mp4
```

使用ffplay查看MP4视频

```
ffplay camera.mp4
```



### 2.2 MIPI Camera（待更新）

