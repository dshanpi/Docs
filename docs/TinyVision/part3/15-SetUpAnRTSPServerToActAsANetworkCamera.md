---
sidebar_position: 15
---
# 搭建 RTSP 服务作为网络摄像头

> 来自：使用tinyvision制作简单的网络摄像机IPC https://bbs.aw-ol.com/topic/5484/share/1

用v4l2读取摄像头图像 然后用硬件编码器把图像编码 最后把编码数据传给rtsp服务器 这样外部就可以直接拉流播放了

提供的系统里有个摄像头测试程序camerademo 能用v4l2读取摄像头图像 sdk里有源码 把源码简单修改一下接口对接

提供的系统里有个硬件编码器测试程序encodertest 能把图像编码成h264数据 直接运行是不能使用的 它的参数解析有问题 需要修改源码的长宽和文件输入输出路径 重新编译才能使用
注意 sdk里面有多个编码器操作例子 只看到一个是接口符合sdk里面的编码器操作接口 其他都是不能用的老接口
能用的encodertest源码路径

`openwrt/package/allwinner/multimedia/tina_multimedia_demo/encodertest/mpp_src`

rtsp部分是网上找的一个编程实现的简单的rtsp服务器 相当于推流加服务器 外部直接拉流就行

源码附件：[使用tinyvision制作简单的网络摄像机IPC附件.zip](https://bbs.aw-ol.com/assets/uploads/files/1718389213264-使用tinyvision制作简单的网络摄像机ipc附件.zip)

下载后有三个文件：包括应用程序，测试工具，个源码工程

![image-20240615123304934](assets/post/README/image-20240615123304934.png)

### 使用预编译的程序测试 RTSP

先用adb把程序传进板子

```
adb push tinyvisionIpcV1 /root
```

使用命令添加执行权限

```
chmod +x tinyvisionIpcV1
```

使用ifconfig配网

```
ifconfig eth0 192.168.2.17 broadcast 192.168.2.255 netmask 255.255.255.0 up
ifconfig lo 127.0.0.1 up
route add default gw 192.168.2.1
```

仅支持一种参数格式 参数为 长 宽 帧率，执行例子

```
./tinyvisionIpcV1 640 480 30
```

执行时不加参数时默认参数为 640 480 30

当参数不支持时v4l2会打印出不同的参数 不会自动调整为相近的适合参数

v4l2打印的帧率有时候不对 以程序每秒打印的摄像头帧率为准

验证过的参数：

```
1920 1080 20
1280 720 30
640 480 30
```

摄像头读图像帧使用v4l2框架 输出格式是NV21 参数不支持基本上是摄像头不支持导致的

默认操作设备/dev/video0 使用前检查有没这个设备 接了摄像头 摄像头驱动加载成功基本都会有这个设备
可以使用系统自带的camerademo排查操作摄像头有没问题

编码器是用的sdk提供的硬编码 输入NV21输出H264

程序运行时会每秒打印编码帧率 这个帧率不是编码器最大帧率 是工作时的帧率 摄像头帧率低会导致编码器帧率低
可以使用系统自带的encodertest排查编码器有没问题

rtsp是网上找的一个编程实现的简单的rtsp服务器 相当于推流加服务器 外部直接拉流就行

```
```

rtsp端口为554 路径为/live
拉流流例子 ip要换成板子的ip
rtsp://192.168.2.17/live

```
```

ffmpeg拉流使用方法

在pc上解压ffmpeg压缩包 用cmd进入ffmpeg bin目录执行命令 记得换ip

```
ffplay.exe -rtsp_transport tcp  rtsp://192.168.2.17/live
```

参数-rtsp_transport tcp的意思是以tcp的方式建立rtsp链接 不写默认是udp 用tcp可以减少丢包花屏情况

### 自行编译

工程使用cmake构建

需要安装cmake

```
apt-get install cmake
```

需要修改CMakeLists.txt里指定的编译器路径和头文件库文件路径

然后在CMakeLists.txt所在路径执行一次命令

```
cmake .
```

产生makefile 然后执行

```
make
```

注意 sdk的gcc使用时要求导出变量STAGING_DIR

```
export STAGING_DIR="/root/tina-v853-open/out/v851se/tinyvision/openwrt/staging_dir/"
```
