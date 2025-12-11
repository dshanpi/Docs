---
sidebar_position: 3
---

# 首次启动设置

:::tip 提示
本指南将协助您完成 **DshanPi-A1** 开发板的首次启动初始化配置。

首次进入系统时，终端会自动运行配置向导，请按照以下步骤完成 root 密码、用户创建及网络设置。
:::

## 初始化配置步骤

### 1. 设置 Root 密码

系统启动后，首先要求设置 **root**（超级管理员）账户的密码。

*   **操作**：输入您设定的密码（屏幕上不会显示字符），按回车，再次输入确认。
*   **示例**：设置密码为 `100ask`。

<img src={require('./images/image-20250808170958185.png').default} alt="设置root密码" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 2. 选择默认 Shell

选择系统默认的 Shell 环境。

*   **建议**：选择 **`1`** (Bash)，Bash 具有更广泛的兼容性和通用性。
*   **操作**：输入 `1` 并回车。

<img src={require('./images/image-20250808171343454.png').default} alt="选择Shell" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 3. 创建普通用户

为了安全起见，建议创建一个普通用户用于日常操作。

*   **操作**：依次输入 **用户名**（如 `baiwen`）、**密码**（如 `100ask`）及确认密码。
*   **注意**：在 `Please provide your real name` 提示处，直接回车确认即可。

<img src={require('./images/image-20250808171646114.png').default} alt="创建用户" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 4. 网络连接与时区设置

此处您可以选择是否立即连接 WiFi。

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="connect" label="方式一：立即连接 WiFi (推荐)" default>

  输入 **`y`** 并回车，系统将扫描附近的 WiFi 网络。

  1.  **选择网络**：在列表中找到您的 WiFi 名称，输入对应的序号或名称。
  2.  **输入密码**：输入 WiFi 密码并连接。
  3.  **自动配置**：连接成功后，系统会自动通过网络获取并设置时区，无需手动干预。

  <img src={require('./images/image-20250808172316740.png').default} alt="扫描WiFi" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  
  <img src={require('./images/image-20250808173106249.png').default} alt="自动设置" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  </TabItem>
  <TabItem value="skip" label="方式二：暂不连接 WiFi">

  输入 **`n`** 并回车，您需要手动设置区域和时区。

  1.  **选择编码**：通常选择 `zh_CN.UTF-8` (中文环境) 或 `en_US.UTF-8`，回车确认。
  
  <img src={require('./images/image-20250808174129465.png').default} alt="选择编码" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  2.  **选择区域**：选择 `Asia` (亚洲)，输入对应的数字（如 `4`）。
  
  <img src={require('./images/image-20250808174520315.png').default} alt="选择区域" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  3.  **选择国家**：选择 `China` (中国)，输入对应的数字（如 `11`）。
  
  <img src={require('./images/image-20250808174711895.png').default} alt="选择国家" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  4.  **选择城市**：选择 `Beijing` 或 `Shanghai`，系统将设置时区为 `Asia/Shanghai`。

  <img src={require('./images/image-20250808174958730.png').default} alt="设置完成" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  </TabItem>
</Tabs>

---

## 常见问题与解决方案

:::warning 常见困扰
如果您在操作过程中遇到问题，请先查阅以下解决方案。
:::

### Q1: 在屏幕上如何进行输入和设置？
**A:** 请连接 USB 键盘和鼠标。开发板的 USB 接口支持即插即用，连接后即可像操作普通电脑一样进行输入。设置完成后，您将进入图形化桌面环境。

<img src={require('./images/image-20250808175737643.png').default} alt="桌面环境" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### Q2: 系统运行一段时间后黑屏或无反应？
**A:** 这通常是系统进入了自动休眠（挂起）模式。

*   **临时解决**：断电重启，或尝试按键盘唤醒。
*   **永久解决**：建议关闭自动休眠功能。

**方法一：图形界面设置**
进入 `Settings` (设置) -> `Power` (电源)，将 `Automatic Suspend` (自动挂起) 设置为 `Off`。

<img src={require('./images/image-20250808180618944.png').default} alt="关闭休眠" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

**方法二：命令行设置**
打开终端 (Terminal)，执行以下命令：

```bash
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-timeout 0
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing'
```

### Q3: 首次启动直接要求输入密码，没有进入配置向导？
**A:** 这种情况可能发生，请尝试以下方案：
1.  **尝试默认密码**：输入用户名 `root`，密码尝试 `1234` 或 `100ask`。
2.  **重新烧录**：如果密码错误，可能是镜像烧录不完整，建议重新烧录系统镜像。
