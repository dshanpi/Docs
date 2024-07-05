---
sidebar_position: 10
---
# 使用 OpenCV 捕获摄像头并且输出到屏幕上

### 快速测试

这个 DEMO 也已经包含在 tina-bsp-tinyvision.tar.gz 中了，可以快速测试这个 DEMO

运行 `m menuconfig`

```
OpenCV  --->
	<*> opencv....................................................... opencv libs
	[*]   Enabel sunxi vin isp support
	<*> opencv_camera.............................opencv_camera and display image
```

### 源码详解

编写一个程序，使用 OpenCV 捕获摄像头输出并且显示到屏幕上，程序如下：

```c++
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <linux/fb.h>
#include <signal.h>
#include <stdint.h>
#include <sys/ioctl.h>

#include <opencv2/opencv.hpp>

#define DISPLAY_X 240
#define DISPLAY_Y 240

static cv::VideoCapture cap;

struct framebuffer_info {
    uint32_t bits_per_pixel;
    uint32_t xres_virtual;
};

struct framebuffer_info get_framebuffer_info(const char* framebuffer_device_path)
{
    struct framebuffer_info info;
    struct fb_var_screeninfo screen_info;
    int fd = -1;
    fd = open(framebuffer_device_path, O_RDWR);
    if (fd >= 0) {
        if (!ioctl(fd, FBIOGET_VSCREENINFO, &screen_info)) {
            info.xres_virtual = screen_info.xres_virtual;
            info.bits_per_pixel = screen_info.bits_per_pixel;
        }
    }
    return info;
};

/* Signal handler */
static void terminate(int sig_no)
{
    printf("Got signal %d, exiting ...\n", sig_no);
    cap.release();
    exit(1);
}

static void install_sig_handler(void)
{
    signal(SIGBUS, terminate);
    signal(SIGFPE, terminate);
    signal(SIGHUP, terminate);
    signal(SIGILL, terminate);
    signal(SIGINT, terminate);
    signal(SIGIOT, terminate);
    signal(SIGPIPE, terminate);
    signal(SIGQUIT, terminate);
    signal(SIGSEGV, terminate);
    signal(SIGSYS, terminate);
    signal(SIGTERM, terminate);
    signal(SIGTRAP, terminate);
    signal(SIGUSR1, terminate);
    signal(SIGUSR2, terminate);
}

int main(int, char**)
{
    const int frame_width = 480;
    const int frame_height = 480;
    const int frame_rate = 30;

    install_sig_handler();

    framebuffer_info fb_info = get_framebuffer_info("/dev/fb0");

    cap.open(0);

    if (!cap.isOpened()) {
        std::cerr << "Could not open video device." << std::endl;
        return 1;
    }

    std::cout << "Successfully opened video device." << std::endl;
    cap.set(cv::CAP_PROP_FRAME_WIDTH, frame_width);
    cap.set(cv::CAP_PROP_FRAME_HEIGHT, frame_height);
    cap.set(cv::CAP_PROP_FPS, frame_rate);

    std::ofstream ofs("/dev/fb0");

    cv::Mat frame;
    cv::Mat trams_temp_fream;
    cv::Mat yuv_frame;

    while (true) {
        cap >> frame;
        if (frame.depth() != CV_8U) {
            std::cerr << "Not 8 bits per pixel and channel." << std::endl;
        } else if (frame.channels() != 3) {
            std::cerr << "Not 3 channels." << std::endl;
        } else {
            cv::transpose(frame, frame);
            cv::flip(frame, frame, 0);
            cv::resize(frame, frame, cv::Size(DISPLAY_X, DISPLAY_Y));
            int framebuffer_width = fb_info.xres_virtual;
            int framebuffer_depth = fb_info.bits_per_pixel;
            cv::Size2f frame_size = frame.size();
            cv::Mat framebuffer_compat;
            switch (framebuffer_depth) {
            case 16:
                cv::cvtColor(frame, framebuffer_compat, cv::COLOR_BGR2BGR565);
                for (int y = 0; y < frame_size.height; y++) {
                    ofs.seekp(y * framebuffer_width * 2);
                    ofs.write(reinterpret_cast<char*>(framebuffer_compat.ptr(y)), frame_size.width * 2);
                }
                break;
            case 32: {
                std::vector<cv::Mat> split_bgr;
                cv::split(frame, split_bgr);
                split_bgr.push_back(cv::Mat(frame_size, CV_8UC1, cv::Scalar(255)));
                cv::merge(split_bgr, framebuffer_compat);
                for (int y = 0; y < frame_size.height; y++) {
                    ofs.seekp(y * framebuffer_width * 4);
                    ofs.write(reinterpret_cast<char*>(framebuffer_compat.ptr(y)), frame_size.width * 4);
                }
            } break;
            default:
                std::cerr << "Unsupported depth of framebuffer." << std::endl;
            }
        }
    }
}
```

第一部分，处理 frame_buffer 信息：

```c++
// 引入头文件
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <linux/fb.h>
#include <signal.h>
#include <stdint.h>
#include <sys/ioctl.h>

#include <opencv2/opencv.hpp>

// 定义显示屏宽度和高度
#define DISPLAY_X 240
#define DISPLAY_Y 240

static cv::VideoCapture cap; // 视频流捕获对象

// 帧缓冲信息结构体
struct framebuffer_info {
    uint32_t bits_per_pixel; // 每个像素的位数
    uint32_t xres_virtual; // 虚拟屏幕的宽度
};

// 获取帧缓冲信息函数
struct framebuffer_info get_framebuffer_info(const char* framebuffer_device_path)
{
    struct framebuffer_info info;
    struct fb_var_screeninfo screen_info;
    int fd = -1;

    // 打开帧缓冲设备文件
    fd = open(framebuffer_device_path, O_RDWR);
    if (fd >= 0) {
        // 通过 ioctl 获取屏幕信息
        if (!ioctl(fd, FBIOGET_VSCREENINFO, &screen_info)) {
            info.xres_virtual = screen_info.xres_virtual; // 虚拟屏幕的宽度
            info.bits_per_pixel = screen_info.bits_per_pixel; // 每个像素的位数
        }
    }
    return info;
}
```

这段代码定义了一些常量、全局变量以及两个函数，并给出了相应的注释说明。具体注释如下：

- `#define DISPLAY_X 240`：定义显示屏的宽度为240。
- `#define DISPLAY_Y 240`：定义显示屏的高度为240。
- `static cv::VideoCapture cap;`：定义一个静态的OpenCV视频流捕获对象，用于捕获视频流。
- `struct framebuffer_info`：定义了一个帧缓冲信息的结构体。
  - `uint32_t bits_per_pixel`：每个像素的位数。
  - `uint32_t xres_virtual`：虚拟屏幕的宽度。
- `struct framebuffer_info get_framebuffer_info(const char* framebuffer_device_path)`：获取帧缓冲信息的函数。
  - `const char* framebuffer_device_path`：帧缓冲设备文件的路径。
  - `int fd = -1;`：初始化文件描述符为-1。
  - `fd = open(framebuffer_device_path, O_RDWR);`：打开帧缓冲设备文件，并将文件描述符保存在变量`fd`中。
  - `if (fd >= 0)`：检查文件是否成功打开。
  - `if (!ioctl(fd, FBIOGET_VSCREENINFO, &screen_info))`：通过ioctl获取屏幕信息，并将信息保存在变量`screen_info`中。
    - `FBIOGET_VSCREENINFO`：控制命令，用于获取屏幕信息。
    - `&screen_info`：屏幕信息结构体的指针。
  - `info.xres_virtual = screen_info.xres_virtual;`：将屏幕的虚拟宽度保存在帧缓冲信息结构体的字段`xres_virtual`中。
  - `info.bits_per_pixel = screen_info.bits_per_pixel;`：将每个像素的位数保存在帧缓冲信息结构体的字段`bits_per_pixel`中。
  - `return info;`：返回帧缓冲信息结构体。

第二部分，注册信号处理函数，用于 `ctrl-c` 之后关闭摄像头，防止下一次使用摄像头出现摄像头仍被占用的情况。

```c++
/* Signal handler */
static void terminate(int sig_no)
{
    printf("Got signal %d, exiting ...\n", sig_no);
    cap.release();
    exit(1);
}

static void install_sig_handler(void)
{
    signal(SIGBUS, terminate); // 当程序访问一个不合法的内存地址时发送的信号
    signal(SIGFPE, terminate); // 浮点异常信号
    signal(SIGHUP, terminate); // 终端断开连接信号
    signal(SIGILL, terminate); // 非法指令信号
    signal(SIGINT, terminate); // 中断进程信号
    signal(SIGIOT, terminate); // IOT 陷阱信号
    signal(SIGPIPE, terminate); // 管道破裂信号
    signal(SIGQUIT, terminate); // 停止进程信号
    signal(SIGSEGV, terminate); // 无效的内存引用信号
    signal(SIGSYS, terminate); // 非法系统调用信号
    signal(SIGTERM, terminate); // 终止进程信号
    signal(SIGTRAP, terminate); // 跟踪/断点陷阱信号
    signal(SIGUSR1, terminate); // 用户定义信号1
    signal(SIGUSR2, terminate); // 用户定义信号2
}
```

这段代码定义了两个函数，并给出了相应的注释说明。具体注释如下：

- `static void terminate(int sig_no)`：信号处理函数。
  - `int sig_no`：接收到的信号编号。
  - `printf("Got signal %d, exiting ...\n", sig_no);`：打印接收到的信号编号。
  - `cap.release();`：释放视频流捕获对象。
  - `exit(1);`：退出程序。
- `static void install_sig_handler(void)`：安装信号处理函数。
  - `signal(SIGBUS, terminate);`：为SIGBUS信号安装信号处理函数。
  - `signal(SIGFPE, terminate);`：为SIGFPE信号安装信号处理函数。
  - `signal(SIGHUP, terminate);`：为SIGHUP信号安装信号处理函数。
  - `signal(SIGILL, terminate);`：为SIGILL信号安装信号处理函数。
  - `signal(SIGINT, terminate);`：为SIGINT信号安装信号处理函数。
  - `signal(SIGIOT, terminate);`：为SIGIOT信号安装信号处理函数。
  - `signal(SIGPIPE, terminate);`：为SIGPIPE信号安装信号处理函数。
  - `signal(SIGQUIT, terminate);`：为SIGQUIT信号安装信号处理函数。
  - `signal(SIGSEGV, terminate);`：为SIGSEGV信号安装信号处理函数。
  - `signal(SIGSYS, terminate);`：为SIGSYS信号安装信号处理函数。
  - `signal(SIGTERM, terminate);`：为SIGTERM信号安装信号处理函数。
  - `signal(SIGTRAP, terminate);`：为SIGTRAP信号安装信号处理函数。
  - `signal(SIGUSR1, terminate);`：为SIGUSR1信号安装信号处理函数。
  - `signal(SIGUSR2, terminate);`：为SIGUSR2信号安装信号处理函数。

这段代码的功能是安装信号处理函数，用于捕获和处理不同类型的信号。当程序接收到指定的信号时，会调用`terminate`函数进行处理。

具体而言，`terminate`函数会打印接收到的信号编号，并释放视频流捕获对象`cap`，然后调用`exit(1)`退出程序。

`install_sig_handler`函数用于为多个信号注册同一个信号处理函数`terminate`，使得当这些信号触发时，都会执行相同的处理逻辑。

第三部分，主函数：

```c++
int main(int, char**)
{
    const int frame_width = 480;
    const int frame_height = 480;
    const int frame_rate = 30;

    install_sig_handler(); // 安装信号处理函数

    framebuffer_info fb_info = get_framebuffer_info("/dev/fb0"); // 获取帧缓冲区信息

    cap.open(0); // 打开摄像头

    if (!cap.isOpened()) {
        std::cerr << "Could not open video device." << std::endl;
        return 1;
    }

    std::cout << "Successfully opened video device." << std::endl;
    cap.set(cv::CAP_PROP_FRAME_WIDTH, frame_width);
    cap.set(cv::CAP_PROP_FRAME_HEIGHT, frame_height);
    cap.set(cv::CAP_PROP_FPS, frame_rate);

    std::ofstream ofs("/dev/fb0"); // 打开帧缓冲区

    cv::Mat frame;
    cv::Mat trams_temp_fream;
    cv::Mat yuv_frame;

    while (true) {
        cap >> frame; // 读取一帧图像
        if (frame.depth() != CV_8U) { // 判断是否为8位每通道像素
            std::cerr << "Not 8 bits per pixel and channel." << std::endl;
        } else if (frame.channels() != 3) { // 判断是否为3通道
            std::cerr << "Not 3 channels." << std::endl;
        } else {
            cv::transpose(frame, frame); // 图像转置
            cv::flip(frame, frame, 0); // 图像翻转
            cv::resize(frame, frame, cv::Size(DISPLAY_X, DISPLAY_Y)); // 改变图像大小
            int framebuffer_width = fb_info.xres_virtual;
            int framebuffer_depth = fb_info.bits_per_pixel;
            cv::Size2f frame_size = frame.size();
            cv::Mat framebuffer_compat;
            switch (framebuffer_depth) {
            case 16:
                cv::cvtColor(frame, framebuffer_compat, cv::COLOR_BGR2BGR565);
                for (int y = 0; y < frame_size.height; y++) {
                    ofs.seekp(y * framebuffer_width * 2);
                    ofs.write(reinterpret_cast<char*>(framebuffer_compat.ptr(y)), frame_size.width * 2);
                }
                break;
            case 32: {
                std::vector<cv::Mat> split_bgr;
                cv::split(frame, split_bgr);
                split_bgr.push_back(cv::Mat(frame_size, CV_8UC1, cv::Scalar(255)));
                cv::merge(split_bgr, framebuffer_compat);
                for (int y = 0; y < frame_size.height; y++) {
                    ofs.seekp(y * framebuffer_width * 4);
                    ofs.write(reinterpret_cast<char*>(framebuffer_compat.ptr(y)), frame_size.width * 4);
                }
            } break;
            default:
                std::cerr << "Unsupported depth of framebuffer." << std::endl;
            }
        }
    }

    return 0;
}
```

这段代码主要实现了从摄像头获取图像并将其显示在帧缓冲区中。具体流程如下：

- 定义了常量`frame_width`、`frame_height`和`frame_rate`表示图像的宽度、高度和帧率。
- 调用`install_sig_handler()`函数安装信号处理函数。
- 调用`get_framebuffer_info("/dev/fb0")`函数获取帧缓冲区信息。
- 调用`cap.open(0)`打开摄像头，并进行错误检查。
- 调用`cap.set()`函数设置摄像头的参数。
- 调用`std::ofstream ofs("/dev/fb0")`打开帧缓冲区。
- 循环读取摄像头的每一帧图像，对其进行转置、翻转、缩放等操作，然后将其写入帧缓冲区中。

如果读取的图像不是8位每通道像素或者不是3通道，则会输出错误信息。如果帧缓冲区的深度不受支持，则也会输出错误信息。
