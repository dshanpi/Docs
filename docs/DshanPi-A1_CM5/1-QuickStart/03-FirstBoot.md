---
title: 首次启动与登录
sidebar_label: 首次启动与登录
sidebar_position: 3
slug: /DshanPi-A1_CM5/QuickStart/FirstBoot
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/03-FirstBoot.md
---

# 首次启动与登录

本章针对已经成功刷入 CM5 Armbian Ubuntu 镜像的设备。账号信息绑定 `dshanpi-a1-cm5-2026.10.10-1`，其他镜像请查看自己的发行说明。以下是按发行说明和 Ubuntu 常规操作整理的步骤，实板界面截图待补齐。

## 完成首次登录

桌面版连接显示器和有线键鼠，选择显示器上正确的输入源。CLI 版可使用已确认接线的串口或可达的 SSH。首次上电保持供电，等待初始化完成，不在初始化过程中反复拔电。

此版 [Release](https://github.com/dshanpi/ArmBianOS/releases/tag/dshanpi-a1-cm5-2026.10.10-1) 的初始用户名为 `root`，密码为 `1234`。首次交互登录要求修改 root 密码；随后按实际向导设置普通用户、语言和时区。后续日常操作使用具有 sudo 权限的普通用户。

不要将构建服务器账号当成板端默认账号。若屏幕先显示创建用户向导，按向导完成，不必强行寻找固定的图形 root 登录界面。

## 确认运行的是哪套系统

在开发板终端执行：

```bash
cat /etc/os-release
uname -m
uname -r
cat /etc/armbian-release
sudo dspi-config status
```

应核对 Ubuntu Noble、`aarch64` 和 `BOARD=dshanpi-a1-cm5`。具体内核后缀以实际输出为准；系统发行号、Armbian revision 和运行内核版本是不同字段。

如果 `dspi-config` 不存在，先记录镜像来源和版本。不要为了让命令可执行，直接套用其他板型的软件源。

## 确认根文件系统位于 eMMC

```bash
findmnt -n -o SOURCE /
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL
for device in /sys/class/block/mmcblk[0-9]; do
    [ -r "$device/device/type" ] || continue
    printf '%s: ' "${device##*/}"
    cat "$device/device/type"
done
```

先找到 `/` 所在分区，再对应到其父磁盘。MMC 类型为 `MMC` 通常对应 eMMC，`SD` 对应 TF/SD 卡；结合实际硬件和容量核对。不要预先把 `mmcblk0` 或 `mmcblk1` 写死为 eMMC。若根设备经过映射，再沿 `lsblk` 的父子关系判断。

## 先使用一个有线网口

将一个网口接入提供 DHCP 的路由器。首次联网先使用单网口，便于区分地址和路由。

```bash
ip -br link
ip -br addr
ip route
```

记录已连接网口的实际接口名和局域网地址，不复制他人的固定 IP。也可以在路由器 DHCP 列表中查找设备。连接电脑与开发板的网络应允许彼此通信，访客网络的隔离功能可能阻止 SSH。

已获得地址但不能访问网络时，先检查是否有默认路由，再检查域名解析：

```bash
getent hosts ports.ubuntu.com
timedatectl status
```

时间明显不正确时，在桌面设置中校准时区与自动时间。HTTPS 和软件源访问依赖正确时间。

## 从 Windows 使用 SSH

先在板端查看 SSH 服务：

```bash
systemctl status ssh --no-pager
```

若镜像没有安装 SSH 服务，且软件源工作正常，可安装并启动：

```bash
sudo apt-get update
sudo apt-get install openssh-server
sudo systemctl enable --now ssh
```

在 Windows PowerShell 中输入实际信息：

```powershell
$BoardIP = Read-Host '输入开发板的实际 IP'
$BoardUser = Read-Host '输入首次启动时创建的用户名'
ssh "$BoardUser@$BoardIP"
```

首次连接核对主机指纹。板端可使用 `sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` 查看 ED25519 指纹。刷机后 SSH 提示主机密钥变化时，先确认仍是自己的板，再更新对应旧记录。

## 传输文件与正常关机

在 Windows PowerShell 中，沿用上面的变量，传送一个自己选择的文件：

```powershell
$LocalFile = Read-Host '输入要上传的本地文件完整路径'
scp "$LocalFile" "${BoardUser}@${BoardIP}:~/"
```

板端用 `ls -lh ~` 查看文件。也可以使用支持 SFTP 的客户端，填写相同 IP、用户名和 SSH 端口。

结束使用时在板端执行 `sudo poweroff`，待关机完成、存储活动停止后再断电。需要重启时执行 `sudo reboot`。

本章通过标志：普通用户能登录；板型与镜像一致；根分区位于预期 eMMC；网络和 SSH 可用；正常关机后再次启动成功。
