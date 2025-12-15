---
sidebar_position: 2
---

# 远程登录指南

:::tip 提示
本指南将详细介绍如何通过 SSH 协议远程连接 **DshanPi-A1** 开发板。

SSH（Secure Shell）是一种安全的网络协议，允许您在本地计算机上通过命令行远程管理开发板，进行文件传输、系统配置和代码开发。
:::

## 准备工作

在开始连接之前，请确保您的环境满足以下条件。

### 1. 硬件与网络环境
*   **开发板**：DshanPi-A1 已正常启动并连接到网络（有线或 WiFi）。
*   **本地主机**：您的电脑（Windows/macOS/Linux）已连接到与开发板相同的局域网。
*   **IP 地址**：您已知晓开发板的 IP 地址。
    *   *获取方法*：在开发板终端输入 `ip addr` 或 `ifconfig` 查看，或在路由器后台查看。

### 2. SSH 客户端软件
根据您的操作系统选择合适的 SSH 客户端：

*   **Windows**: 推荐使用 [MobaXterm](https://mobaxterm.mobatek.net/) (功能强大，集成了 SFTP)、PuTTY 或 Windows Terminal。
*   **macOS / Linux**: 直接使用系统自带的终端（Terminal）即可。

---

## 快速连接步骤 (以 MobaXterm 为例)

本节以 Windows 平台常用的 **MobaXterm** 软件为例演示连接过程。

### 第一步：创建新会话
打开 MobaXterm，点击左上角的 **"Session" (会话)** 按钮，或者使用快捷键 `Ctrl` + `Shift` + `N`。

<img src={require('./images/image-20250808115942583.png').default} alt="新建会话" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 第二步：配置 SSH 参数
在弹出的设置窗口中，选择 **"SSH"** 选项卡，并填写以下信息：

1.  **Remote host (远程主机)**：输入开发板的 IP 地址（例如 `192.168.1.100`）。
2.  **Specify username (指定用户名)**：勾选该项，并输入用户名（如 `root` 或 `baiwen`）。
3.  **Port (端口)**：保持默认的 `22` 即可。
4.  点击 **"OK"** 确认。

<img src={require('./images/image-20250811115001849.png').default} alt="配置SSH" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 第三步：输入密码登录
首次连接时，终端会提示输入密码。

*   输入您设置的用户密码（输入时屏幕不会显示字符）。
*   按 **回车** 键确认。
*   如果是首次连接该 IP，软件可能会弹出安全警告（Host Key Verification），点击 **"Accept"** 即可。

<img src={require('./images/image-20250811115103727.png').default} alt="登录成功" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

:::success 成功
当您看到类似 `root@dshanpi-a1:~#` 的命令提示符时，说明您已成功登录开发板！
:::

---

## 进阶故障排查

如果您无法连接，请参考以下 checklist 进行排查。

### 1. 网络连通性检查
在本地电脑的终端（CMD 或 PowerShell）中，尝试 `ping` 开发板的 IP 地址：

```bash
ping <开发板IP地址>
# 例如：ping 192.168.1.100
```
*   **通畅**：显示 `Reply from ... time=...ms`，说明网络正常。
*   **不通**：显示 `Request timed out`，请检查网线连接、WiFi 设置或防火墙规则。

### 2. 检查 SSH 服务状态
如果您接了显示器或串口，可以在开发板本地终端检查 SSH 服务是否正常运行：

```bash
# 查看 SSH 服务状态
sudo systemctl status ssh
```

DshanPi-A1 的系统通常采用了 **Socket 激活** 机制，服务状态可能显示为 `inactive (dead)` 但 `TriggeredBy: ssh.socket`，这是正常的。这意味着 SSH 服务会在接收到连接请求时自动启动，无需手动常驻后台。

```bash
# 典型输出示例
○ ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/usr/lib/systemd/system/ssh.service; disabled; preset: ena>
     Active: inactive (dead)
TriggeredBy: ● ssh.socket
```

### 3. 常见错误代码
*   **Connection refused**：IP 地址正确，但端口不通。可能是 SSH 服务未安装或未启动，或者防火墙拦截了 22 端口。
*   **Connection timed out**：网络完全不通，请检查 IP 地址是否填写正确，或设备是否在同一网段。
*   **Permission denied**：密码错误，或该用户被禁止登录（如 root 用户默认可能被禁止远程登录，需修改 `/etc/ssh/sshd_config`）。
