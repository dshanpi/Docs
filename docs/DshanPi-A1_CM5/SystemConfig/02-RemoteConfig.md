---
title: 远程登录指南
sidebar_position: 2
slug: /DshanPi-A1_CM5/SystemConfig/RemoteConfig
description: 从电脑通过 SSH 登录 DshanPI A1 CM5 的普通账号。
---

电脑与 DshanPI A1 CM5 接入同一局域网后，即可在电脑上操作开发板终端。准备好首次启动时创建的**普通用户名和密码**，并在板上[查看 IPv4 地址](./01-NetworkConnectionGuide.md)。

## 从电脑登录

1. 在 Windows 打开 **PowerShell**，或在 macOS、Linux 打开**终端**。以下命令以用户名 `baiwen`、板端地址 `192.168.1.49` 为例，请换成自己的值。

   ```bash
   ssh baiwen@192.168.1.49
   ```

2. 首次连接会显示主机指纹。如果提示的是 ED25519，可在 **DshanPI A1 CM5 本机终端**运行以下命令，对照两处的 `SHA256` 指纹。一致后，在电脑上输入 `yes`，再输入普通用户密码并回车。输入密码时屏幕不回显。

   ```bash
   ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
   ```

3. 在登录后的终端输入 `whoami` 和 `hostname`，确认显示自己的账号和 DshanPI A1 CM5 主机名。输入 `exit` 返回电脑终端。

## 使用 MobaXterm（Windows）

1. 打开 MobaXterm，点击左上角 **Session** 创建会话。[MobaXterm 官网](https://mobaxterm.mobatek.net/)

2. 选择 **SSH**，在 **Remote host** 填写 DshanPI A1 CM5 的地址，勾选 **Specify username** 并填写普通用户名，端口保留 **22**。点击 **OK**。

   图中标注的是填写位置，请使用自己开发板的 IP 和普通账号。

   <img src={require('./figures/mobaxterm-ssh-settings.png').default} width="640" alt="MobaXterm 的 SSH、Remote host、用户名和端口设置位置" />

3. 首次连接时按上节核对指纹，输入账号密码。出现命令提示符后，用 `whoami` 和 `hostname` 核对账号与板名。左侧文件面板可用于[传输文件](./03-FileTransfer.md)。

## 连接被拒绝时

在 **DshanPI A1 CM5 本机终端**运行 `systemctl status ssh.socket ssh.service --no-pager`。若已显示 `active (listening)` 或服务为 `active (running)`，重新核对电脑填写的地址和端口。若未安装服务端，可在已联网的板上执行：

**安装远程登录服务。** 在开发板终端刷新软件包列表并安装 OpenSSH 服务端。

```bash
sudo apt update
sudo apt install openssh-server
```

**启用服务。** 立即启动 SSH，并设置为随系统启动。

```bash
sudo systemctl enable --now ssh
```

若显示 `Connection timed out`，先在 DshanPI A1 CM5 本机核对当前 IP，再在 Windows PowerShell 运行 `Test-NetConnection 192.168.1.49 -Port 22`（替换为板端地址）。`TcpTestSucceeded : True` 表示电脑能连到该端口。若显示 `Permission denied`，核对首次启动时创建的普通用户名和密码。
