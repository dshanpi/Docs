---
title: 常用系统操作
sidebar_position: 9
slug: /DshanPi-A1_CM5/SystemConfig/CommonOperations
description: 在 DshanPI A1 CM5 上安装 ARM64 软件、使用 U 盘、查看系统负载与温度。
---

以下操作适用于 DshanPI A1 CM5 Armbian Ubuntu。在 GNOME 桌面按 **Super**（Windows 徽标键），搜索 `terminal` 并回车即可打开终端。CLI 版登录后可直接输入命令。

## 安装常用软件

联网后，在终端更新软件包索引，再安装需要的工具。例如，`htop` 可查看哪些进程占用 CPU 和内存。

```bash
sudo apt-get update
sudo apt-get install htop nano curl
```

确认安装前，查看 APT 列出的变更。如果提示移除板级支持包或更换内核，先取消并核对依赖。[系统更新与恢复](../3-Maintenance/01-UpdateRecovery.md)

<details>
<summary>安装单独下载的 .deb 软件包</summary>

从软件发布方下载 ARM64 安装包。在终端运行以下命令，按提示输入文件的绝对路径。

**查看开发板的软件包架构。** 记下输出的架构名称。

```bash
dpkg --print-architecture
```

**检查下载的安装包。** 输入文件路径后，对照输出中的架构、软件名和版本。

```bash
read -r -p '输入 .deb 文件的绝对路径：' DEB_FILE
dpkg-deb -f "$DEB_FILE" Package Version Architecture
```

确认系统架构为 `arm64`，软件包的 `Architecture` 为 `arm64` 或 `all` 后，在同一终端安装。

```bash
sudo apt-get install "$DEB_FILE"
```

</details>

## 使用 U 盘和移动存储

1. 将 U 盘插入底板的 USB Type-A 接口，在桌面打开 **文件**，从侧栏选择对应卷。TF 卡用作移动存储时，也可在这里查看。
2. 核对容量和挂载位置后再复制文件。需要从终端确认时，运行以下命令，查看目标分区的 `SIZE` 和 `MOUNTPOINTS`。挂载点为空表示该分区尚未挂载。

   ```bash
   lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL
   df -h
   ```

3. 文件复制完成后，点击卷名旁的 **弹出**。等该卷卸载后再拔出。

如果 U 盘没有出现，先核对接口模式。底板正面的两个 USB 2.0 Type-A 接口需要使用 **USB 模式**，启用 PCIe1 会关闭这两个接口的数据传输。Type-C 下载口使用独立的 OTG0。如果系统已识别分区但未自动挂载，可检查文件系统类型和系统日志。[切换 PCIe1 与 USB 模式](../3-Maintenance/01-UpdateRecovery.md#pcie1-与-usb1-模式)

## 查看负载与温度

在终端运行以下命令，依次查看系统负载、内存、磁盘空间和进程。按 **q** 退出 `htop`。

**查看系统负载和内存。** `uptime` 显示运行时间及负载，`free -h` 显示内存用量。

```bash
uptime
free -h
```

**查看磁盘剩余空间。** 在 `Avail` 列找到对应挂载点的可用空间。

```bash
df -h
```

**查看实时进程。** 按 **q** 退出。

```bash
htop
```

需要查看温度时，运行以下命令。每行先显示传感器名称，再显示温度读数。以千分之一摄氏度计的传感器读数 `45000` 表示 45 °C。持续高负载时，可同时检查散热器和风扇。

```bash
for zone in /sys/class/thermal/thermal_zone*; do
    [ -r "$zone/type" ] && [ -r "$zone/temp" ] || continue
    printf '%s ' "$(cat "$zone/type")"
    cat "$zone/temp"
done
```
