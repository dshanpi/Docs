---
title: 首次启动与登录
sidebar_label: 首次启动与登录
sidebar_position: 4
slug: /DshanPi-A1_CM5/QuickStart/FirstBoot
custom_edit_url: https://github.com/dshanpi/Docs/edit/master/docs/DshanPi-A1_CM5/1-QuickStart/03-FirstBoot.md
---

# 首次启动与登录

本页适用于已将 Armbian Ubuntu **2026.10.10-1** 写入 eMMC 的 DshanPI A1 CM5，包括 GNOME 桌面版和 CLI 版。该版本的初始用户名是 **`root`**，初始密码是 **`1234`**，首次交互登录时需要设置新的 root 密码。[CM5 镜像发行说明](https://github.com/dshanpi/ArmBianOS/releases/tag/dshanpi-a1-cm5-2026.10.10-1)

## 1. 上电并进入首次登录

1. 确认 RKDevTool 已完成写入和校验。保持 TF 卡取出、MASKROM 按键松开。若开发板已自动重启，等待初始化完成。若开发板处于断电状态，先拔下 USB 存储设备和刷机数据线。
2. 使用本地控制台时，将显示器接到底板 HDMI，选择对应输入源，并插好 USB 键盘。板子处于关机状态时，将配套 **12V 电源接到 DC1** 开机。首次启动会初始化系统，请保持供电。
3. 出现 `login:` 时输入 `root`并回车。出现 `Password:` 时输入 `1234`，再回车。若屏幕或串口直接显示设置 root 密码的提示，从下一节开始。终端输入密码时可能不显示字符，输完后按回车即可。

**没有显示器时**，可使用已确认接线的串口控制台。若已启用 SSH，也可将一个网口接到提供 DHCP 的路由器，从路由器的客户端列表查到开发板 IP，再在同一局域网内的 Windows PowerShell 执行：

```powershell
$BoardIP = Read-Host '输入开发板 IP'
ssh "root@$BoardIP"
```

核对连接的是这块开发板后，在密码提示处输入初始密码。如果连接被拒绝，先通过本地或串口控制台完成初始化，再检查 SSH 服务。

## 2. 修改 root 密码并创建日常账号

1. 若向导要求输入**当前 root 密码**，输入 `1234`。看到 **Create root password** 或 **New password** 时，输入自行设置的**新 root 密码**。
2. 看到 **Repeat root password** 或 **Retype new password** 时，再输入一次刚设置的新密码。若提示两次输入不一致，重新输入两遍。若 SSH 在改密成功后断开，重新连接时使用新 root 密码。
3. 进入创建用户步骤后，输入日常使用的**普通用户名**，为这个账号设置密码并再输入一次。记录普通用户名，按向导完成语言和时区设置。上述英文提示取自 Armbian 通用流程，CM5 桌面版和 CLI 版的具体界面待实板确认。[Armbian 首次登录说明](https://docs.armbian.com/getting-started/first-boot-and-login/)
4. 向导完成后，用普通账号登录桌面或控制台。若仍停留在 `root` 命令行，可在本地控制台输入 `exit` 返回登录提示，或另开 SSH 会话用普通账号登录。在开发板终端执行：

   ```bash
   whoami
   sudo -v
   ```

   `whoami` 应显示刚创建的普通用户名。`sudo -v` 若提示输入密码，使用**普通账号自己的密码**。验证通过后会返回命令行。

## 3. 确认根文件系统位于 eMMC {#确认根文件系统位于-emmc}

在开发板终端执行以下命令，先找出当前系统挂载 `/` 的分区，再确认该分区属于哪块磁盘：

```bash
findmnt -n -o SOURCE /
lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS
```

例如，若第一条命令输出 `/dev/mmcblk1p2`，在第二条命令的树形列表中找到挂载点为 `/` 的 `mmcblk1p2`，向上一级找到整盘 `mmcblk1`。**设备编号以板端输出为准。** 若根设备显示为 `/dev/mapper/…`，沿列表向上找到承载它的物理磁盘。

再读取板上 MMC 设备的类型：

```bash
grep -H . /sys/class/block/mmcblk[0-9]/device/type
```

- **确认位于 eMMC**：若上一步的整盘是 `mmcblk1`，且对应行是 `/sys/class/block/mmcblk1/device/type:MMC`，则当前根文件系统位于 eMMC。
- **根分区位于其他介质**：若对应类型为 `SD`，系统使用的是 TF 卡。若根分区属于 USB 或 NVMe 磁盘，则运行在该磁盘上。正常关机，断电后移除其他启动介质，再开机复查。

最后在开发板执行 `sudo poweroff`。待系统关机、存储活动停止后断电。保持其他启动介质取出、MASKROM 松开，重新接入 12V 电源。**能够用新建的普通账号登录，且复查后根分区仍属于类型为 `MMC` 的整盘**，即可确认开发板能从 eMMC 冷启动。

## 查看板型和系统版本

在开发板终端执行：

```bash
cat /etc/armbian-release
cat /etc/os-release
uname -m
uname -r
```

本版镜像应显示板型 `BOARD=dshanpi-a1-cm5`、系统 Ubuntu 24.04（Noble）、架构 `aarch64`。若镜像带有 `dspi-config`，可用 `sudo dspi-config status` 查看板级配置。

## 从 Windows 远程登录和传文件

将开发板的一个网口接到路由器。在板端执行 `ip -br addr`，记下已连接网口的局域网 IP。执行 `systemctl status ssh --no-pager` 检查 SSH 服务，状态应为 `active (running)`。若未安装服务，在板端联网后执行：

```bash
sudo apt-get update
sudo apt-get install openssh-server
sudo systemctl enable --now ssh
```

在 Windows PowerShell 中，使用初始化时创建的普通账号登录：

```powershell
$BoardIP = Read-Host '输入开发板 IP'
$BoardUser = Read-Host '输入普通用户名'
ssh "$BoardUser@$BoardIP"
```

首次连接若显示 ED25519 主机指纹，可在板端本地终端用 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` 核对，再确认连接。重新刷机后若提示主机密钥变更，也应先核对新指纹，再更新电脑上保存的旧记录。

若要上传文件，输入 `exit` 返回同一 PowerShell 窗口，执行以下命令。

```powershell
$LocalFile = Read-Host '输入本地文件完整路径'
scp "$LocalFile" "${BoardUser}@${BoardIP}:~/"
```

回到开发板，用 `ls -lh ~` 确认文件出现在普通用户的主目录。[日常使用](../2-Usage/01-DailyUse.md) · [启动与登录故障排查](../3-Maintenance/02-Troubleshooting.md)
