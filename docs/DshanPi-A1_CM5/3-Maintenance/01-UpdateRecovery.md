---
title: 系统更新与恢复
sidebar_label: 系统更新与恢复
sidebar_position: 1
slug: /DshanPi-A1_CM5/Maintenance/UpdateRecovery
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/3-Maintenance/01-UpdateRecovery.md
---

# 系统更新与恢复

CM5 Armbian 产品镜像使用 `dspi-config` 查看板型与版本、管理软件源、配置 Overlay，以及按发行版本安装配套软件包。正式命令名称是 **dspi-config**。

## 当前版本先核对更新条件

2026 年 11 月 12 日直接读取公开下载和 CM5 包索引时：

| 项目 | 观察结果 |
| --- | --- |
| GitHub CM5 镜像 Release | `2026.10.10-1`，预发布 |
| stable 的 CM5 arm64/all 索引 | 空 |
| testing 的 CM5 发行元包 | `2026.10.08-3`、`2026.10.09-1` |
| 镜像声明的 `25.11.0-trunk.20261010.1` headers 下载 | HTTP 404 |

这次检查说明公开镜像与包仓库尚未形成完整对应关系，不代表安装于镜像中的软件包必然缺失。对本基线，先完成首次使用和状态检查；不要把“刷机后立即升级/回滚”列为必做步骤。安装外部 DKMS 驱动前也要先恢复完全匹配的 headers 供应。

实际安装以板端 APT 验签后的可用版本和依赖结果为准；本文的 HTTP 索引观察不替代 APT 验签。

## 只读查看系统

在板端执行：

```bash
sudo dspi-config status
sudo dspi-config source show
sudo dspi-config overlay list
sudo dspi-config update list
```

`status` 显示系统发行元包版本和当前运行内核。`update list` 读取本地 APT 索引，不会自动刷新。需要刷新时执行 `sudo apt-get update`，遇到网络、签名或依赖错误，先保留并处理错误。

无参数执行 `sudo dspi-config` 可打开终端菜单。工具能力与命令参考：[dspi-config 使用说明](https://github.com/dshanpi/dspi-config/blob/main/README.md)。本教程所用子命令也已对照镜像锁定的 [工具源码版本](https://github.com/dshanpi/dspi-config/blob/69f441a1e7d01feaaf9c936cc5db6ac793805668/bin/dspi-config)。

## 区分下载镜像源和系统渠道

Ubuntu 下载速度慢，可在本板配套源正常的前提下选择下载镜像：

```bash
sudo dspi-config source mirror tuna
sudo dspi-config source show
```

可用预设还包括 `official` 和 `ustc`。这改变 Ubuntu Ports 的下载地址，不改变 CM5 板型和系统渠道。

`stable` 与 `testing` 是 DShanPI 软件包渠道，分别对应 `noble` 与 `noble-testing`。只有目标渠道确实包含适用于本板的配套发行时，才安排切换。当前 stable 空的观察结果不能当成“切回 stable 即恢复正常”的依据。

CM5 使用 `common` 与 `dshanpi-a1-cm5` components，不能添加 A1、R1 的 component 来凑依赖。签名密钥配置应由配套 repository 和 keyring 软件包提供。

## 有可用配套发行时再更新

以下流程用于后续已恢复完整发布、且确认目标版适用于本板的情况。更新前将个人文件和重要配置备份到另一台设备，保存当前 `status` 输出，确保供电和网络稳定。

```bash
sudo apt-get update
sudo dspi-config update list
read -r -p '输入已核实且列表可见的目标系统发行版本：' TARGET_VERSION
if [ -n "$TARGET_VERSION" ]; then
    sudo dspi-config update install "$TARGET_VERSION"
fi
```

工具先展示 APT 模拟结果，再请求安装确认。逐项检查升级、降级和删除内容；模拟失败时先解决原因，不强行删除本板元包。安装成功后，如果变更涉及内核、BSP 或驱动，保存工作并重启，再检查系统状态及受影响外设。

## 回滚的含义

`sudo dspi-config update rollback` 会从当时本地索引可见版本中选择低于当前版本的最高版本，再进入配套安装流程。它不是文件系统快照，也不保证回到上一次安装的版本。

需要恢复到指定版本时，优先在刷新索引后用 `update install` 指定可用旧版，并核对所有依赖是否可下载。切换渠道本身不会降级已安装的软件。系统无法启动时需要恢复启动配置或重新刷写已确认的镜像，不能靠板端升级命令处理。

## PCIe1 与 USB1 模式

根据 [CM5 适配说明](https://github.com/dshanpi/ArmBianOS/blob/main/docs/dshanpi-a1-cm5/README.md)，基础配置使用 USB1 路径，PCIe1 通过可选 Overlay 启用。启用 PCIe1 会关闭共享 USB1 DWC3/PHY 路径。

先确认 `overlay list` 存在 `pcie1`，对应 DTBO 可用，并且镜像使用 `/boot/armbianEnv.txt`。该工具不会自动修改 extlinux 启动配置。

确认共享接口不会影响当前操作后，可执行 `sudo dspi-config overlay enable pcie1`，保存工作并重启。恢复则执行 `sudo dspi-config overlay disable pcie1`，再次重启。重启后要用实际外设检验；配置显示 enabled 只表示启动文件已修改。

`armbianEnv.txt.dspi-config.bak` 只保留最近一次启动配置写入前的备份，不等同于完整系统备份。
