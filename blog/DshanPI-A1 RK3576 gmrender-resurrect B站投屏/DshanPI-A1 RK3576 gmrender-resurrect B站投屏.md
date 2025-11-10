# DshanPI-A1 RK3576 gmrender-resurrect B站投屏

## 演示效果

[https://www.bilibili.com/video/BV1Z646zhEBP](https://www.bilibili.com/video/BV1Z646zhEBP)

## 一、环境信息



| 类别     | 具体配置       |
| ------ | ---------- |
| 板卡     | DshanPI-A1 |
| 主控芯片   | RK3576     |
| 操作系统   | Armbian    |
| 桌面系统   | GNOME      |
| 窗口系统   | Wayland    |
| GPU 驱动 | Panfrost   |

## 二、实现原理



1. **核心组件**：`gmrender-resurrect` 是一款接收 DLNA 服务内容，并通过 GStreamer 播放的工具，可直接配置为 DLNA 客户端。

2. **硬件加速基础**：已提前实现 GStreamer 硬件加速播放视频，满足高清流解码需求。

3. **B 站投屏适配**：B 站 DLNA 投屏时，会发送 **FLV 封装的 H264 流**（类似直播流），通过 `gmrender-resurrect` 可直接调用硬件加速播放。

## 三、环境搭建（安装依赖）

### 1. 安装基础编译工具



```
sudo apt-get install build-essential \
            autoconf \
            automake \
            libtool \
            pkg-config
```

### 2. 安装 DLNA 与 GStreamer 核心依赖



```
# 更新软件源

sudo apt-get update

# 安装 DLNA 依赖与 GStreamer 组件（含编解码、输出插件）
sudo apt-get install libupnp-dev libgstreamer1.0-dev \
            gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
            gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly \
			gstreamer1.0-rockchip1 sudo apt install -y libgstreamer-gl1.0-0 \
            gstreamer1.0-libav

# 安装音频输出插件（PulseAudio + ALSA）
sudo apt install -y gstreamer1.0-pulseaudio
sudo apt-get install gstreamer1.0-alsa

# 安装 Git（用于拉取源码）
sudo apt-get install git
```

## 四、编译 gmrender-resurrect

### 1. 拉取源码



```
git clone https://github.com/hzeller/gmrender-resurrect.git
```

### 2. 编译与构建



```
# 进入源码目录
cd gmrender-resurrect

# 生成配置文件
./autogen.sh

# 配置编译参数
./configure

make
```

### 3. 复制 Logo 文件（避免启动报错）



```
# 复制图标到系统默认目录
cp data/grender-128x128.png /usr/local/share/gmediarender/
cp data/grender-64x64.png /usr/local/share/gmediarender/
```

## 五、启动 DLNA 投屏服务



```
# -f "DshanPI-A1"：设置设备在 DLNA 列表中的显示名称
# --gstout-videopipe：自定义视频输出 pipeline，强制 Wayland 全屏
./src/gmediarender  -f "DshanPI-A1" --gstout-videopipe "waylandsink fullscreen=true"
```

## 六、问题排查与解决（音频导致视频卡顿）

### 1. 问题现象



* 仅播放视频时正常，添加音频后视频直接卡住。

### 2. 排查步骤

#### 步骤 1：检查声卡状态（发现挂起）



```
# 查看所有音频输出设备状态
pactl list sinks short
```



* 输出显示所有声卡均处于 **SUSPENDED（挂起）** 状态，且执行 `suspend-sink` 后无法激活，说明 PulseAudio 与硬件连接异常。

#### 步骤 2：检查音频服务占用（发现冲突）



```
# 查看占用音频设备的进程
fuser -v /dev/snd/*
```



* 输出显示 **PulseAudio、WirePlumber、PipeWire** 三个音频服务同时占用设备，存在服务冲突（PipeWire 与 PulseAudio 功能重叠，争夺声卡控制权）。

### 3. 解决方案（屏蔽 PulseAudio 冲突服务）

#### 步骤 1：屏蔽 PulseAudio 自动启动（用户级）



```
# 屏蔽服务，阻止自动启动
systemctl --user mask pulseaudio
systemctl --user mask pulseaudio.socket
```

> 注：此操作会暂时让系统无法识别 PulseAudio 设备，需恢复时执行解除屏蔽命令。

#### 步骤 2：强制杀死残留 PulseAudio 进程



```
pkill -9 pulseaudio
```

### 4. 功能验证（确保音频 / 视频正常）

#### 验证 1：音频输出测试



```
# 播放 1000Hz 测试音，检查喇叭是否出声
gst-launch-1.0 audiotestsrc freq=1000 ! audioconvert ! pulsesink
```
* 屏蔽PulseAudio后 gst会用alsa来播放音频
* 可以通过alsamixer控制音量


* 正常出声音，说明音频链路恢复。

#### 验证 2：本地视频播放测试



```
# 播放本地视频，检查音画是否同步
gst-launch-1.0 playbin uri=file:///root/bad_apple.mp4
```



* 正常播放且有声音，说明音视频协同正常。

### 5. 重新启动 DLNA 服务



```
./src/gmediarender  -f "DshanPI-A1" --gstout-videopipe "waylandsink fullscreen=true"
```

## 七、补充：恢复 PulseAudio 服务（如需）

若后续需要使用 PulseAudio，执行以下命令解除屏蔽：



```
systemctl --user unmask pulseaudio
systemctl --user unmask pulseaudio.socket
```
