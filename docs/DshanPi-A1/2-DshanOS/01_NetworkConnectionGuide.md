---
sidebar_position: 1
---

# 网络连接指南

:::tip 提示
本章节将指导您如何将 **DshanPi-A1** 连接至网络。设备支持 **千兆有线网络** 和 **无线 WiFi** 两种连接方式。
:::

## 1. 有线网络连接 (推荐)

最简单、稳定的连接方式。

*   **操作**：使用网线将开发板的网口连接至路由器或交换机。
*   **配置**：系统默认开启 DHCP，**即插即用**，无需额外配置。

---

## 2. 无线 WiFi 连接

您可以选择通过图形化桌面或命令行工具来配置 WiFi。

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="desktop" label="图形化桌面 (GUI)" default>

  如果您连接了显示器并进入了桌面环境，这是最直观的配置方式。

  1.  **打开网络菜单**：点击右上角或任务栏的网络图标（通常是一个扇形 WiFi 标志）。
  2.  **选择网络**：在列表中点击您的 WiFi 名称。

  <img src={require('./images/image-20250808190309109.png').default} alt="选择WiFi" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  3.  **输入密码**：在弹出的对话框中输入 WiFi 密码，点击“连接”。

  <img src={require('./images/image-20250808190507346.png').default} alt="输入密码" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  </TabItem>
  
  <TabItem value="cli" label="命令行 (nmcli)">

  如果您通过 SSH 或串口终端操作，可以使用 **NetworkManager** 的命令行工具 `nmcli` 进行配置。

  ### 常用操作速查表

  | 功能 | 命令 | 说明 |
  | :--- | :--- | :--- |
  | **扫描 WiFi** | `nmcli device wifi list` | 列出附近所有可用的热点 |
  | **连接 WiFi** | `nmcli device wifi connect "SSID" password "PWD"` | 替换 SSID 和 PWD 为实际值 |
  | **查看状态** | `nmcli connection show` | 显示当前所有网络连接 |
  | **断开连接** | `nmcli connection down <连接名>` | 断开指定网络 |

  ### 操作示例

  **步骤 1：扫描可用 WiFi**

  ```bash
  sudo nmcli device wifi list
  ```

  *输出示例：*
  ```text
  IN-USE  BSSID              SSID             MODE   CHAN  RATE      SIGNAL  BARS  SECURITY
          74:39:89:F8:F0:AE  Programmers7     Infra  40    405 Mbit/s  90    ▂▄▆█  WPA2
  *       F0:92:B4:A6:03:91  ChinaNet-kRAH    Infra  1     130 Mbit/s  85    ▂▄▆█  WPA1 WPA2
  ```

  **步骤 2：连接 WiFi**

  假设我们要连接名为 `Programmers7` 的网络，密码为 `100askxxx`：

  ```bash
  sudo nmcli device wifi connect "Programmers7" password "100askxxx"
  ```

  连接成功后，系统会提示：
  `Device 'wlan0' successfully activated with '...'`

  </TabItem>
</Tabs>

---

## 3. 高级配置 (设置静态 IP)

在某些开发场景下（如作为服务器），您可能需要固定 IP 地址。

```bash
# 1. 修改连接配置 (假设连接名为 "Wired connection 1")
nmcli con mod "Wired connection 1" ipv4.addresses 192.168.1.100/24
nmcli con mod "Wired connection 1" ipv4.gateway 192.168.1.1
nmcli con mod "Wired connection 1" ipv4.dns "8.8.8.8 114.114.114.114"
nmcli con mod "Wired connection 1" ipv4.method manual

# 2. 重启连接使配置生效
nmcli con up "Wired connection 1"
```
