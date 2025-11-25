# GStreamer与OpenCV

## 1.简介

​	过去，我们谈“摄像头”往往意味着一段繁琐的驱动、格式协商与帧缓冲拷贝；谈“算法”则立刻联想到解码后的 Mat 矩阵、色彩空间转换和 CPU 飙高的 while 循环。两者之间的“最后一公里”——把原始码流无损、低延时地送进 CV 的 imshow 或 DNN 推理管线——却常被忽视，成为拖垮帧率与体验的最大暗礁。

​	GStreamer 用管道（pipeline）思维把“采集→解码→色彩转换→同步→投递”抽象成可插拔的乐高积木；OpenCV 则用 cv::Mat 一行代码接管了“图像即内存”的哲学。当两条看似平行的河流被同一根 appsink/appsrc 的细管接通时，奇迹发生了：

​	这场“管道 + 矩阵”的联姻，不仅把我们从重复造轮子的泥潭里解放出来，更揭示了一种新的研发范式：媒体层与算法层不再割裂，而是共享同一块内存、同一套时钟、同一个事件循环。



## 2.安装依赖

进入系统终端，执行如下命令，安装基础依赖：

```
sudo apt update
sudo apt install -y build-essential cmake git pkg-config \
    libjpeg-dev libpng-dev libtiff-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev \
    libxvidcore-dev libx264-dev libgtk-3-dev \
    python3-dev python3-numpy
```

安装gstreamer依赖库：

```
sudo apt-get install libgstreamer1.0-dev \
                     libgstreamer-plugins-base1.0-dev \
                     gstreamer1.0-tools \
                     gstreamer1.0-plugins-base \
                     gstreamer1.0-plugins-good \
                     gstreamer1.0-plugins-bad \
                     gstreamer1.0-plugins-ugly
```



## 3.本地编译OpenCV

1.下载OpenCV包（以4.12为例）

```
wget https://github.com/opencv/opencv/archive/refs/tags/4.12.0.zip
```

如果无法下载可访问OpenCV官网资源下载：[https://opencv.org/releases/](https://opencv.org/releases/)

![image-20250813161203024](${images}/image-20250813161203024.png)

2.解压OpenCV库

```
unzip 4.12.0.zip
```

3.下载[opencv_contrib](https://github.com/opencv/opencv_contrib)拓展模块

```
git clone -b 4.12.0 https://github.com/opencv/opencv_contrib.git
```

> 注意：请确保opencv-4.12.0库和opencv_contrib拓展库在同一目录下。
>
> baiwen@dshanpi-a1:~$ tree -L 1
>
> ├── Desktop
>
> ├── Documents
>
> ├── Downloads
>
> ├── Music
>
> ├── opencv-4.12.0
>
> ├── opencv_contrib

4.进入OpenCV库目录创建

```
cd opencv-4.12.0
mkdir -p build && cd build
```

5.创建编译规则增加GStreamer支持

```
cmake -D CMAKE_BUILD_TYPE=Release \
    -D CMAKE_INSTALL_PREFIX=/usr/local \
    -D WITH_GSTREAMER=ON \
    -D WITH_FFMPEG=ON \
    -D OPENCV_GENERATE_PKGCONFIG=ON \
    -D BUILD_EXAMPLES=OFF \
    -D BUILD_TESTS=OFF \
    -D BUILD_opencv_python3=ON \
    -D OPENCV_EXTRA_MODULES_PATH=../../opencv_contrib/modules \
    -D PYTHON3_EXECUTABLE=$(which python3) \
    -D PYTHON3_INCLUDE_DIR=$(python3 -c "import sysconfig; print(sysconfig.get_paths()['include'])") \
    -D PYTHON3_PACKAGES_PATH=$(python3 -c "import site; print(site.getsitepackages()[0])") \
    ..
```

6.编译OpenCV

```
make
```

7.安装OpenCV

> 注意：如果之前安装过OpenCV库需要先卸载：
>
> sudo apt-get remove python3-opencv
>
> pip3 uninstall opencv-python opencv-contrib-python -y

```
sudo make install
sudo ldconfig
```

8.验证OpenCV是否支持GStreamer

```
python3 -c "import cv2; print(cv2.getBuildInformation())" | grep GStreamer
```

正常输出内容为：

```
baiwen@dshanpi-a1:~$ python3 -c "import cv2; print(cv2.getBuildInformation())" | grep GStreamer
    GStreamer:                   YES (1.24.2)
```

## 4.使用python程序测试

> 注意：运行示例时硬件必须接入HMDI IN！

![image-20250829111514696](${images}/image-20250829111514696.png)

### 4.1 拍摄图像

新建`test.py`程序文件，填入下面内容：

```
import cv2
gst_str = (
    "v4l2src device=/dev/video0 ! "
    "video/x-raw,format=NV12,width=1920,height=1080 ! "
    "videoconvert ! "                   # NV12 → RGB
    "appsink"
)
cap = cv2.VideoCapture(gst_str, cv2.CAP_GSTREAMER)

if not cap.isOpened():
    print("无法打开摄像头")
    exit()

ret, frame = cap.read()
if ret:
    cv2.imwrite("frame.jpg", frame)
    print("保存 frame.jpg 成功")
else:
    print("读取失败")

cap.release()
```

运行程序：

```
python3 test.py
```

运行完成后，可以在当前目录下看到`frame.jpg`图像文件。



### 4.2 实时预览

新建`camera.py`程序文件，填入下面内容：

```
import cv2

gst_str = (
    "v4l2src device=/dev/video0 ! "
    "video/x-raw,format=NV12,width=1920,height=1080 ! "
    "videoconvert ! "                   # NV12 → RGB
    "appsink"
)

cap = cv2.VideoCapture(gst_str, cv2.CAP_GSTREAMER)
if not cap.isOpened():
    print("无法打开摄像头")
    exit()

print("按 q 退出预览")
while True:
    ret, frame = cap.read()
    if not ret:
        print("读取失败")
        break
    cv2.imshow("Camera Preview", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

运行程序：

```
python3 camera.py
```

运行完成后，可以看到HDMI IN的实时预览画面。

![image-20250910174040666](${images}/image-20250910174040666.png)