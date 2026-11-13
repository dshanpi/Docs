---
title: 日常使用
sidebar_label: 日常使用
sidebar_position: 1
slug: /DshanPi-A1_CM5/Usage/DailyUse
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/2-Usage/01-DailyUse.md
---

# 日常使用

本章适用于已完成首次初始化的 CM5 Armbian Ubuntu 系统。先掌握联网、软件安装、文件和基本外设；摄像头调校、NPU 和内核开发另设专题。

## 连接 Wi-Fi

GNOME 桌面可从右上角系统菜单进入网络设置，开启 Wi-Fi，选择自己的网络并输入密码。无线天线和模块安装方式以本板配套说明为准。

使用终端时，先确认 NetworkManager 和无线接口可用：

```bash
command -v nmcli
nmcli device status
rfkill list
nmcli device wifi list
```

列表中应出现实际无线接口与附近网络。使用交互方式输入密码，避免将密码直接写进命令历史：

```bash
read -r -p '输入 Wi-Fi 名称：' WIFI_SSID
nmcli --ask device wifi connect "$WIFI_SSID"
```

连接成功后用 `ip -br addr` 和 `ip route` 核对地址及路由。没有无线接口和连接密码错误是不同问题：前者检查模块、驱动与固件，后者检查网络设置。`nmcli` 不存在时先使用桌面网络设置或有线连接，不把接口名固定成 `wlan0`。

## 安装常用软件

CM5 为 ARM64 平台，先查看包管理器识别的架构：

```bash
dpkg --print-architecture
```

预期为 `arm64`。优先从镜像已配置的可信 Ubuntu 软件源安装应用，例如：

```bash
sudo apt-get update
sudo apt-get install htop nano curl
```

安装前阅读 APT 列出的变更；若只是安装应用却要求移除本板发行元包或替换大量内核/BSP 包，先取消并检查依赖。

厂商提供独立 DEB 时选择 ARM64 版本。可以先检查，再让 APT 处理本地包依赖：

```bash
read -r -p '输入 DEB 的绝对路径：' DEB_FILE
dpkg-deb -f "$DEB_FILE" Package Version Architecture
sudo apt-get install "$DEB_FILE"
```

下载到的 x86_64、amd64 包不能当作 ARM64 本机包安装。系统发行升级与普通应用安装的处理不同，见 [系统更新与恢复](../3-Maintenance/01-UpdateRecovery.md)。

## 调整显示和音频

桌面显示设置中先使用显示器支持的分辨率与刷新率。HDMI 输出、HDMI 输入和 Type-C DP 的用途不同，接线须依据 CM5 官方底板的接口标注。

声音设置中选择与实际连接一致的输出设备，例如 HDMI、耳机或板载音频；先用低音量播放一段已知正常的音频，再确认左右声道。多个声卡同时存在时，“音量不为零”不代表选择了正确输出。

需要记录设备情况时：

```bash
cat /proc/asound/cards
```

若已安装 ALSA 工具，还可以使用 `aplay -l` 和 `arecord -l` 查看播放、录音设备。不要把某个示例中的声卡序号直接用于另一套镜像。

## 使用 U 盘和移动存储

插入后，在桌面文件管理器中打开对应卷。终端可查看：

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL
df -h
```

核对设备容量和挂载位置后再复制文件。使用完成，在文件管理器中弹出或卸载，等待完成后拔出。设备没有自动挂载时先查看文件系统和日志，不以格式化作为第一步。

USB 接口可用性与镜像、底板及 Overlay 模式相关。CM5 的 PCIe1 模式会影响共享 USB1 路径，不将两个模式写成同时可用；切换方式见下一章。

## 查看负载与温度

```bash
uptime
free -h
df -h
htop
```

按 `q` 退出 htop。持续高负载时同时检查散热器和风扇。温度节点与传感器对应关系可以这样查看：

```bash
for zone in /sys/class/thermal/thermal_zone*; do
    [ -r "$zone/type" ] && [ -r "$zone/temp" ] || continue
    printf '%s ' "$(cat "$zone/type")"
    cat "$zone/temp"
done
```

这些温度节点通常以千分之一摄氏度输出，例如 `45000` 表示 45°C；以对应驱动约定为准。单次空闲温度不能替代高负载稳定性测试。

## 管理蓝牙与其他外设

桌面蓝牙设置中打开蓝牙，将对端设为可发现，再执行配对。发现设备、配对成功和实际音频或文件传输分别验证。没有蓝牙控制器时可收集 `rfkill list`、`systemctl status bluetooth --no-pager`，再检查本板驱动与固件。

显示、触摸、摄像头、音频、双网口和无线的具体支持状态，应绑定到实际镜像与板卡版本。仓库中已有适配代码不能替代这块板上的功能验证。
