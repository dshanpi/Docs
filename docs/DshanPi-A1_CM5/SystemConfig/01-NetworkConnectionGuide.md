---
title: 网络连接指南
sidebar_position: 1
slug: /DshanPi-A1_CM5/SystemConfig/NetworkConnectionGuide
description: 使用有线网络或 Wi-Fi 连接 DshanPI A1 CM5，查看局域网地址并按需设置固定 IP。
---

先将 DshanPI A1 CM5 接入局域网，再记下它的 IPv4 地址。后续远程登录和文件传输都会用到这个地址。

## 选择连接方式

**有线网络。** 将底板 **ETH0** 或 **ETH1** 接到路由器的 LAN 口。路由器启用 DHCP 时，系统会自动获取地址。[查看网口位置](../1-QuickStart/HardwareConnections.md)

使用 Wi-Fi 时，上电前先接好核心板天线。首次开机还在初始化向导中，请参照[首次启动配网](../1-QuickStart/03-FirstBoot.md#first-boot-wifi)。

### 在 GNOME 桌面连接 Wi-Fi

1. 点击右上角系统菜单，展开 **Wi-Fi**，选择自己的网络名称。

   <img src={require('./figures/gnome-wifi-menu.png').default} width="620" alt="GNOME 系统菜单中展开 Wi-Fi 并选择网络的位置" />

2. 输入该网络的密码，点击 **连接**。再次展开 Wi-Fi 菜单，确认当前网络名称。

   <img src={require('./figures/gnome-wifi-connect.png').default} width="620" alt="无线网络密码输入框和 Connect 按钮" />

### 在终端连接 Wi-Fi

在 DshanPI A1 CM5 本机终端操作。

**列出附近的 Wi-Fi。** 找到要连接的网络名称。

```bash
nmcli device wifi list
```

**连接该网络。** 替换引号里的名称，按提示输入无线密码。

```bash
nmcli --ask device wifi connect "你的 Wi-Fi 名称"
```

**确认已经连上。** 在活动连接列表中找到自己的 Wi-Fi。

```bash
nmcli connection show --active
```

在最后一条输出中找到类型为 `wifi` 的行，核对连接名称和设备。需要断开时，运行 `nmcli connection down "连接名称"`。

如果没有列出热点，运行 `nmcli device status` 查找类型为 `wifi` 的接口，再用 `rfkill list` 检查无线设备是否被禁用。如果没有无线接口，检查模块、驱动和固件。如果能看到热点但认证失败，重新核对密码。若系统提示找不到 `nmcli`，可使用桌面网络菜单或有线连接。

## 查看开发板地址

在 DshanPI A1 CM5 桌面按 **Super**（Windows 徽标键），搜索 `terminal` 并回车。在打开的终端中依次运行：

```bash
ip -br -4 addr
ip route
```

本次实测的有线接口显示 `end0  UP  192.168.1.49/24`，电脑连接时填写 `192.168.1.49`。`ip route` 中的 `default via 192.168.1.1 dev end0` 表示流量经该接口发往网关。请以自己板上与电脑同一局域网的接口地址为准。

<details>
<summary>需要固定 IP 地址时</summary>

在 DshanPI A1 CM5 桌面打开 **设置 → 网络**，点击当前有线连接旁的齿轮。进入 **IPv4**，选择 **手动**，填写网络管理员分配的地址、子网掩码、网关和 DNS，点击 **应用**。重新连接该网口后，用上面的命令核对新地址。要恢复自动分配，将 IPv4 改回 **自动（DHCP）**。

也可在 **DshanPI A1 CM5 本机终端**配置。先运行 `nmcli -f NAME,DEVICE connection show --active` 找到该网口的**连接名称**。下例中的连接名、空闲地址、网关和 DNS 都需要换成自己的值。

**填写连接名称和固定地址。** 在同一个终端中设置下面的变量，再写入已确认的地址、网关和 DNS。

```bash
profile="Wired connection 1"
sudo nmcli connection modify "$profile" ipv4.method manual ipv4.addresses 192.168.1.100/24 ipv4.gateway 192.168.1.1 ipv4.dns 192.168.1.1
```

**应用设置。** 重新启用刚修改的连接。

```bash
sudo nmcli connection up "$profile"
```

**检查是否生效。** 查看网卡的 IPv4 地址，以及默认路由是否指向预期网关。

```bash
ip -br -4 addr
ip route
```

核对该网口的新地址和默认网关。要恢复 DHCP，在同一终端执行：

```bash
sudo nmcli connection modify "$profile" ipv4.method auto ipv4.addresses "" ipv4.gateway "" ipv4.dns ""
sudo nmcli connection up "$profile"
```

</details>

**DshanPI A1 CM5 实测结果**　有线网口 `end0` 已通过 DHCP 获取地址，`wlan0` 可扫描到热点。固定 IP 的命令为配置示例。
