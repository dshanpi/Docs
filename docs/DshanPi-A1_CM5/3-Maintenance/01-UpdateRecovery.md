---
title: 系统更新与恢复
sidebar_label: 系统更新与恢复
sidebar_position: 1
slug: /DshanPi-A1_CM5/Maintenance/UpdateRecovery
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/3-Maintenance/01-UpdateRecovery.md
---

# 系统更新与恢复

本页适用于 DshanPI A1 CM5 的 Armbian 系统。请在开发板终端操作。升级前先备份个人文件和配置，并确认目标发行版及其依赖都能从本板的软件源下载。

## 1. 查看当前版本与软件源

**查看当前系统和软件源。** 先记下已安装的版本和正在使用的源。

```bash
sudo dspi-config status
sudo dspi-config source show
```

**刷新软件包索引，再列出可更新版本。** 下一步要从这个列表中选取版本号。

```bash
sudo apt-get update
sudo dspi-config update list
```

记下 `status` 显示的发行元包版本和运行内核，在 `source show` 中核对渠道与板型组件。索引刷新成功后，再从 `update list` 中选目标版本。若刷新出现签名错误或 404，先解决软件源问题。[常见问题排查](02-Troubleshooting.md)

<details>
<summary>教程镜像的软件源核对记录（2026 年 11 月 12 日）</summary>

当时镜像 `2026.10.10-1` 标记为预发布，公开 stable 索引为空，testing 元包列出 `2026.10.08-3` 和 `2026.10.09-1`。`25.11.0-trunk.20261010.1` 的内核头文件链接返回 404。安装外部驱动前，应另行确认能取得与运行内核匹配的头文件。

</details>

### 按需更换 Ubuntu 下载镜像

下载较慢时，可用 `sudo dspi-config source mirror tuna` 切换 Ubuntu Ports 下载地址，再用 `sudo dspi-config source show` 核对。可选预设还有 `official` 和 `ustc`。

板级包由独立渠道提供。stable 对应 `noble`，testing 对应 `noble-testing`。核对组件为 `common` 与 `dshanpi-a1-cm5`，并使用配套 repository 和 keyring 包提供的签名配置。

## 2. 安装指定版本

更新期间保持供电和网络稳定。

**输入目标版本。** 照上一步的列表填写，在同一终端继续。

```bash
read -r -p '输入目标发行版本：' TARGET_VERSION
```

**安装选中的版本。** 整段复制，输入为空时会跳过安装。

```bash
if [ -n "$TARGET_VERSION" ]; then
    sudo dspi-config update install "$TARGET_VERSION"
fi
```

工具先显示 APT 模拟结果。核对将安装、降级或删除的包，再确认执行。如果模拟失败或提示移除板级元包，请退出并保留报错。涉及内核、BSP 或驱动的变更，安装完成后保存工作并重启，运行 `sudo dspi-config status` 核对版本，再测试受影响的外设。[工具命令说明](https://github.com/dshanpi/dspi-config/blob/69f441a1e7d01feaaf9c936cc5db6ac793805668/bin/dspi-config)

## 3. 恢复旧版系统

- **能登录，需恢复指定版本。** 刷新索引并确认所需旧版和依赖可下载，再按上一步指定该版本安装。
- **能登录，需退到最近的可用旧版。** `sudo dspi-config update rollback` 从本地索引中选择低于当前版本的最高版本。确认模拟结果后再安装。个人文件和配置需从备份恢复。
- **无法启动。** 若刚调整启动配置，优先恢复已知可用的配置。需要重刷时，先保存可读取的数据，再使用已核实的镜像。[向 eMMC 烧录系统](../1-QuickStart/02-FlashEMMC.md)

## PCIe1 与 USB1 模式

底板正面的两个 USB 2.0 Type-A 插座（USB2、USB3）经 CH334F 共用 USB2_OTG1。Armbian 默认启用 USB1。切换为 PCIe1 后，两个 Type-A 口都将停止数据传输，Type-C 下载口使用独立的 OTG0。[底板原理图第 4 页](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/SCH_DshanPI-A1-CM5-Base.pdf#page=4) · [核心板原理图第 11 页](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1-CM5/DshanPI-A1%28CM5%29_Core_SCH_V1.pdf#page=11)

1. 在板端运行 `sudo dspi-config overlay list`，确认有 `pcie1` 及对应的 DTBO 文件，且系统使用 `/boot/armbianEnv.txt` 启动。工具仅修改该启动配置。若当前依赖 Type-A 键鼠，请先准备好重启后的其他操作方式。
2. **使用 PCIe1** 时运行 `sudo dspi-config overlay enable pcie1`。**恢复 USB** 时运行 `sudo dspi-config overlay disable pcie1`。
3. 保存工作并重启。PCIe 模式下检查目标设备是否枚举成功，USB 模式下插入键盘或 U 盘验证能否使用。[板级适配说明](https://github.com/dshanpi/ArmBianOS/blob/main/docs/dshanpi-a1-cm5/README.md)

`armbianEnv.txt.dspi-config.bak` 仅保留上一次写入前的启动配置。
