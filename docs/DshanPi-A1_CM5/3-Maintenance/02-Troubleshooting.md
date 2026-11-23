---
title: 常见问题排查
sidebar_label: 常见问题排查
sidebar_position: 2
slug: /DshanPi-A1_CM5/Maintenance/Troubleshooting
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/3-Maintenance/02-Troubleshooting.md
---

# 常见问题排查

先找到操作停止在哪一步，记下首次报错。刷机问题先看 Windows 电脑上的 RKDevTool；能登录 Armbian 后，再用开发板终端查看系统状态。

## 刷机与启动

| 现象 | 下一步检查 |
| --- | --- |
| RKDevTool 没发现设备 | 核对 12V 供电、Type-C 下载口和 USB 数据线，重新进入 MASKROM 模式。Windows 设备管理器应出现 **Rockusb Device**。[驱动安装与接线](../1-QuickStart/02-FlashEMMC.md#driver-setup) |
| 下载 Loader 失败 | 核对 Loader 文件名、校验值与核心板内存规格，检查供电和 USB 连接。保存首次失败位置和完整工具日志。 |
| 固件解析失败 | 先解压。Armbian 原始 `.img` 使用 **下载镜像** 页，Buildroot 打包固件使用 **升级固件** 页。[按系统选择烧录步骤](../1-QuickStart/02-FlashEMMC.md) |
| eMMC 写入或校验失败 | 复核镜像 SHA-256，检查 eMMC 识别、供电与线材，保留完整日志。 |
| 刷完仍进入旧系统 | 查看 TF 卡是否插入。能登录时，用 `findmnt -n -o SOURCE /` 找到根分区，再核对父设备类型。[判断根文件系统所在介质](../1-QuickStart/03-FirstBoot.md#确认根文件系统位于-emmc) |
| HDMI 黑屏 | 核对显示器输入源和底板 HDMI 接口，通过串口或网络确认系统是否已启动。已进入 GNOME 时核对主显示器。[设置桌面显示输出](../1-QuickStart/03-FirstBoot.md#display-output) |
| 调试串口乱码 | 核对接线、TTL 电平、流控及适配器支持的速率。Buildroot SDK 记录为 1,500,000 baud，其他镜像按各自说明设置；确认电平前请勿接适配器供电脚。 |

## 网络、登录与外设

| 现象 | 下一步检查 |
| --- | --- |
| SSH 连接超时 | 在开发板运行 `ip -br addr` 和 `ip route`，核对目标 IP、同网段连接、防火墙及路由器隔离设置。[网络连接指南](../SystemConfig/01-NetworkConnectionGuide.md) |
| SSH 提示 `Connection refused` | 在开发板运行 `systemctl status ssh.socket ssh.service --no-pager`，检查监听状态。[远程登录指南](../SystemConfig/02-RemoteConfig.md) |
| 密码不正确 | 核对镜像类型、登录账号及首次启动时设置的密码。[首次启动与登录](../1-QuickStart/03-FirstBoot.md) |
| 找不到 Wi-Fi 接口 | 运行 `nmcli device status` 与 `rfkill list`，检查无线接口和禁用状态，再查看内核日志中的驱动或固件报错。 |
| 启用 PCIe1 后两个 Type-A 口都不能用 | 若需要 USB 外设，切回 USB 模式并重启，再插入键盘或 U 盘测试。[PCIe1 与 USB1 模式](01-UpdateRecovery.md#pcie1-与-usb1-模式) |
| 摄像头有设备节点但没有图像 | 核对传感器型号、媒体拓扑、ISP 通道及 AIQ 服务，记录实际设备节点和采集报错。[摄像头采集教程](../AppDev/Vision/Camera.md) |

## 软件安装与更新

| 现象 | 下一步检查 |
| --- | --- |
| 安装包架构错误 | 用 `dpkg --print-architecture` 核对系统架构，再查看 DEB 包的 `Architecture` 字段。板端可安装 `arm64` 或 `all` 架构的软件包。[检查本地安装包](../SystemConfig/09-CommonOperations.md#安装常用软件) |
| APT 报签名错误或 404 | 核对系统时间、网络和 `sudo dspi-config source show` 的输出，记录报错的软件源及包版本。 |
| 目标版本未出现在列表 | 刷新索引后运行 `sudo dspi-config update list`，核对板型组件和渠道。[系统更新与恢复](01-UpdateRecovery.md) |

## 收集诊断信息

在能登录的 Armbian 开发板上，先记录系统、内核和本次启动的错误。网络、存储、更新问题再附上对应表格中所列的命令输出。

**记录系统和内核版本。** 反馈问题时附上这三条输出。

```bash
cat /etc/os-release
cat /etc/armbian-release
uname -a
```

**找出启动失败的服务。** 重点看服务名。

```bash
systemctl --failed --no-pager
```

**查看本次启动日志。** 保留与故障发生时间接近的警告和错误。

```bash
sudo journalctl -b -p warning --no-pager -n 100
```

Buildroot 使用镜像提供的启动日志和诊断工具。提交前请移除密码、令牌、私钥、无线凭据和需要保密的地址。

## 反馈模板

```text
核心板型号、内存/eMMC 规格、底板版本：
镜像完整文件名、下载地址、SHA-256：
供电与接线、是否插有 TF 卡：
操作步骤、预期结果：
实际现象、首次报错与相关日志：
```

刷机问题请附 RKDevTool 版本和 Loader 文件名；启动问题请说明串口是否有输出、能否登录。[硬件资料与讨论](https://forums.100ask.net/t/topic/10577)
