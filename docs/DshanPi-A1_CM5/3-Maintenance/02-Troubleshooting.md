---
title: 常见问题排查
sidebar_label: 常见问题排查
sidebar_position: 2
slug: /DshanPi-A1_CM5/Maintenance/Troubleshooting
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/3-Maintenance/02-Troubleshooting.md
---

# 常见问题排查

先确定故障发生在哪个阶段：电脑未识别设备、刷写中断、刷完无法启动、系统能启动但外设异常，或更新失败。不同阶段需要不同证据。

## 按现象检查

| 现象 | 先检查什么 | 应保留的信息 |
| --- | --- | --- |
| RKDevTool 没发现设备 | 数据线是否能传数据，是否接下载口，Rockusb 驱动与 MASKROM 操作 | 底板版本、接线照片、设备管理器状态 |
| 下载 Loader 失败 | Loader 是否匹配 RK3576、CM5 内存规格与此刷机流程，供电和 USB 是否稳定 | Loader 文件名/哈希、完整下载日志 |
| 镜像解析错误 | 原始 Armbian img 与 Rockchip update.img 是否选错页面，压缩包是否已解压 | 镜像来源、文件名、SHA-256、工具页面 |
| 写入或校验失败 | 文件校验、供电、线材、USB 连接与 eMMC 识别 | 完整日志与首次失败位置 |
| 刷完仍启动旧系统 | 是否插着 TF 卡，启动配置是否来自另一介质 | 串口启动日志、`findmnt`、`lsblk` |
| 显示器黑屏 | 显示器输入、HDMI OUT 接口、系统是否已在串口或网络启动 | 启动日志、显示器型号、接口与线材 |
| 串口乱码 | 调试口接线、电平、波特率、流控及适配器是否支持目标速率 | 适配器型号、串口参数和截图 |
| SSH 连接超时 | 板端实际 IP、路由器隔离、防火墙和是否同网段 | `ip -br addr`、`ip route`、客户端报错 |
| SSH connection refused | 板已可达但服务未监听，核对 ssh 服务状态 | `systemctl status ssh` |
| 登录密码不正确 | 镜像版本、是否首次登录后已改密、是否误用构建机账号 | 镜像文件名与登录方式，不提交密码 |
| 没有 Wi-Fi 接口 | 本板无线硬件、驱动模块、固件和 rfkill | `nmcli device status`、`rfkill list`、内核日志 |
| USB 接口启用 PCIe1 后不可用 | 是否切换了共享 USB1/PCIe1 路径 | Overlay 配置及实际接线 |
| 软件安装提示架构错误 | 包是否为 ARM64 | `dpkg --print-architecture`、包架构 |
| APT 提示签名或 404 | 系统时间、网络、本板源与版本是否完整公开 | 原始 APT 错误、`source show` |
| 系统版本没有出现在更新列表 | 索引是否刷新、渠道、本板元包和公开发布状态 | `status` 与 `update list` |
| 摄像头有节点但没图像 | 传感器、媒体拓扑、ISP/AIQ 服务和本镜像支持状态 | 镜像/底板/摄像头版本与相关日志 |

Buildroot SDK 记录中的调试串口为 1,500,000 baud；具体 Armbian 镜像和硬件接法仍以对应版本说明为准。确认 TTL 电平前不要连接串口适配器的供电脚。

## 收集最小诊断信息

在能够正常登录的 Armbian 板端逐条执行：

```bash
cat /etc/os-release
cat /etc/armbian-release
uname -a
sudo dspi-config status
sudo dspi-config source show
sudo dspi-config overlay list
findmnt -n -o SOURCE /
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL
ip -br addr
ip route
systemctl --failed --no-pager
sudo journalctl -b -p warning --no-pager -n 100
```

某条命令不存在时记录提示并继续其他项。Buildroot 不一定有 systemd、journalctl 和 dspi-config，应改用其镜像提供的日志工具。

提交反馈前检查输出，去掉密码、令牌、无线凭据和不希望公开的地址、设备序列号。不要上传整个 `/etc`、用户主目录或 SSH 私钥。

## 反馈模板

```text
核心板型号与内存/eMMC规格：
官方底板PCB版本：
镜像完整文件名与下载页面：
镜像SHA-256：
烧录工具版本与Loader文件名：
供电、下载口、显示器等接线：
复现步骤：
预期现象：
实际现象与首次报错：
是否插有TF卡：
能否串口登录或SSH：
附带的最小日志：
```

现有硬件资料讨论入口：[CM5 资料帖](https://forums.100ask.net/t/topic/10577)。报告问题时始终附上完整 CM5 型号和镜像版本，避免与原 A1 的问题混淆。
