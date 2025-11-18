---
sidebar_position: 6
---

# AI 视频播放器

参考链接：

- [Sknp1006/rk-rtsp: A component for hardware decoding of RTSP on the Rockchip platform.Currently supports RK3588.](https://github.com/Sknp1006/rk-rtsp)

​	本项目旨在在 Rockchip 平台上构建一套**轻量、低延迟的“AI 视频播放器”**：从 RTSP 等网络视频源拉流，经 FFmpeg（启用 `rkmpp`）完成解复用与硬件解码，使用 MPP 将 H.264/H.265 等码流直接在 NPU/CPU 之外解码为 NV12，再通过高效的颜色空间转换输出到 **OpenCV** 与 **SDL2**——既能实时显示，也能把帧无缝送入后续的 **AI 推理（如 RKNN/YOLO）** 管线。该方案充分利用 Rockchip 的硬件编解码能力，显著降低 CPU 占用，适合在边缘端长时间稳定运行。

## 1.安装第三方依赖

### 1.1 安装FFMPEG

- 参考源码工程链接: https://pan.baidu.com/s/16E1abDys1uTY2HQCJ7DNNw?pwd=89zc 提取码: 89zc。使用其中的`jellyfin-ffmpeg.tar.gz`。

下载ffmpeg源码：

```
git clone -b v7.1.2-3 https://github.com/jellyfin/jellyfin-ffmpeg.git
cd jellyfin-ffmpeg
```

配置编译项：

```
./configure --enable-rkmpp --enable-version3 --enable-libdrm --enable-static --disable-shared --enable-pthreads --enable-zlib --disable-doc --disable-debug --disable-lzma --disable-vaapi --disable-vdpau --enable-shared

make -j4
sudo make install
```



### 1.2 安装OpenCV

参考《应用开发》->《摄像头与显示应用》->《OpenCV》文档，安装OpenCV库。

### 1.3 安装SDL2

使用apt安装：

```
sudo apt install libsdl2-dev
```

### 1.4 安装spdlog库

使用apt安装：

```
sudo apt install libspdlog-dev
```

### 1.5 安装rockchip_mpp 

参考《应用开发》->《多媒体应用》->《视频编解码》文档，安装RK MPP库。



## 2.编译源码

参考源码： https://github.com/Sknp1006/rk-rtsp.git

DshanPI-A1源码链接: https://pan.baidu.com/s/16E1abDys1uTY2HQCJ7DNNw?pwd=89zc 提取码: 89zc 

### 2.1 获取源码

下载源码：https://pan.baidu.com/s/16E1abDys1uTY2HQCJ7DNNw?pwd=89zc 提取码: 89zc 。使用其中的`rk-rtsp.tar.gz`。

在Home目录将下载`rk-rtsp`源码传输至该目录下：

```
baiwen@dshanpi-a1:~$ ls
rk-rtsp.tar.gz
```

解压源码：

```
tar -xzvf rk-rtsp.tar.gz
```

### 2.2 编译源码

1.进入源码目录：

```
cd rk-rtsp
```

2.编译程序：

```
./build.sh
```

编译完成后可以看到编译工作目录`build`和编译生成目录`install`。如下所示：

```
baiwen@dshanpi-a1:~/rk-rtsp$ tree -L 2
.
├── build
│   └── build_linux_aarch64 #编译工作目录
├── build.sh
├── CMakeLists.txt
├── install	#程序安装目录
│   ├── bin	#可执行文件目录
│   ├── include
│   ├── lib
│   └── test
├── LICENSE
├── README.md
├── rtsp
│   ├── CMakeLists.txt
│   ├── MatQueue.cpp
│   ├── MatQueue.h
│   ├── PacketIterator.cpp
│   ├── PacketIterator.h
│   ├── PacketQueue.cpp
│   ├── PacketQueue.h
│   ├── rkrtsp.cpp
│   ├── rkrtsp.h
│   ├── rtspHandle.cpp
│   ├── rtspHandle.h
│   ├── VideoDecoder.cpp
│   ├── VideoDecoder.h
│   ├── VideoImageConverter.cpp
│   └── VideoImageConverter.h
├── test
│   ├── 3rdparty
│   ├── CMakeLists.txt
│   ├── include
│   ├── logger.h
│   ├── main.cpp
│   ├── model
│   ├── palace.gif
│   ├── postprocess.cc
│   ├── preprocess.cc
│   ├── rknn.h
│   └── runtime
└── utils
    ├── CMakeLists.txt
    ├── test
    ├── utils_time.cpp
    └── utils_time.h

16 directories, 29 files
```



### 2.3 运行程序

1.创建启动脚本，进入可执行文件目录：

```
cd install/bin/
```

新建`run.sh`脚本，内容如下：

```
#!/bin/bash
set -e

# 获取绝对路径
ROOT_PWD=$( cd "$( dirname $0 )" && cd -P "$( dirname "$SOURCE" )" && pwd )
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:${ROOT_PWD}/../lib
cd ${ROOT_PWD}

./test $1
```

2.增加可执行权限：

```
chmod +x run.sh
```

3.导入环境

**单次：**

```
export LD_LIBRARY_PATH=/usr/local/lib:/usr/lib/aarch64-linux-gnu:$PWD/../lib:$LD_LIBRARY_PATH
```

**永久：**

```
echo "/usr/local/lib" | sudo tee /etc/ld.so.conf.d/ffmpeg.conf
sudo ldconfig
```

4.启动脚本运行程序：

```
sudo ./run.sh "rtsp://your_rtsp_url:port/stream"
```



例如，参考《应用开发》->《多媒体应用》->《GStreamer视频推流》，启动RTSP推流。

终端1，执行RTSP推流：

![image-20251031141656498](./AIVideoPlayer.assets/image-20251031141656498.png)

终端2,执行拉流和AI推理：

```
#访问DshanPI AI IP拉流
sudo ./run.sh "rtsp://192.168.1.59:8554/live"

#本地回环拉流
sudo ./run.sh "rtsp://127.0.0.1:8554/live"
```

![image-20251030182604723](./AIVideoPlayer.assets/image-20251030182604723.png)
