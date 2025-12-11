---
sidebar_position: 3
---

# 文件传输指南

:::tip 提示
本章节将介绍如何在 **DshanPi-A1** 开发板与 **Windows/Linux/macOS** 主机之间高效地传输文件。
:::

## 场景一：与 Windows 主机传输文件

在 Windows 环境下，我们推荐使用图形化工具，操作简单直观。

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="mobaxterm" label="方案 A：MobaXterm (推荐)" default>

  如果您已经使用 MobaXterm 进行 SSH 连接，那么文件传输功能已经内置其中，无需额外安装软件。

  **1. 自动同步目录**
  登录 SSH 后，勾选左侧侧边栏上方的 `Follow terminal folder` 复选框。此时，左侧文件列表会自动跟随您在终端中的 `cd` 目录切换。

  <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
  <img src={require('./images/image-20250811172951329.png').default} alt="Moba界面" style={{maxWidth: '45%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src={require('./images/image-20250811173121162.png').default} alt="跟随目录" style={{maxWidth: '45%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  </div>

  **2. 下载文件 (开发板 -> Windows)**
  在左侧列表中选中文件，点击顶部的 **蓝色向下箭头** 图标，或直接**右键 -> Download**。

  <img src={require('./images/image-20250811173554317.png').default} alt="下载文件" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  **3. 上传文件 (Windows -> 开发板)**
  点击顶部的 **绿色向上箭头** 图标，或直接将 Windows 桌面上的文件**拖拽**到左侧文件列表中。

  <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
  <img src={require('./images/image-20250811174121238.png').default} alt="上传按钮" style={{maxWidth: '45%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src={require('./images/image-20250811174752462.png').default} alt="拖拽上传" style={{maxWidth: '45%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  </div>

  </TabItem>

  <TabItem value="filezilla" label="方案 B：FileZilla">

  [FileZilla](https://filezilla-project.org/download.php?type=client) 是一款专业的免费开源 FTP/SFTP 客户端。

  **1. 建立连接**
  打开 FileZilla，在顶部快速连接栏输入：
  *   **主机**: 开发板 IP 地址 (如 `192.168.1.100`)
  *   **用户名**: `root` 或 `baiwen`
  *   **密码**: 对应的用户密码
  *   **端口**: `22` (SFTP 协议默认端口)

  <img src={require('./images/image-20250811180059629.png').default} alt="FileZilla配置" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  **2. 传输文件**
  连接成功后，左侧为**本地站点**，右侧为**远程站点**。直接双击文件或左右拖拽即可传输。

  <img src={require('./images/image-20250811180845418.png').default} alt="传输界面" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

  </TabItem>
</Tabs>

---

## 场景二：与 Linux/macOS 设备传输文件

对于 Linux 或 macOS 用户，使用命令行工具 `scp` (Secure Copy) 是最高效的方式。

### 基本语法

```bash
scp [选项] 源文件 目标路径
```

### 常用操作示例

假设开发板 IP 为 `192.168.1.100`，用户名为 `baiwen`。

#### 1. 上传文件 (本地 -> 开发板)

将本地当前目录下的 `app_test` 文件上传到开发板的 `~/downloads` 目录：

```bash
scp ./app_test baiwen@192.168.1.100:~/downloads/
```

#### 2. 下载文件 (开发板 -> 本地)

将开发板上的 `/var/log/syslog` 日志文件下载到本地当前目录：

```bash
scp baiwen@192.168.1.100:/var/log/syslog .
```

#### 3. 传输文件夹

传输文件夹需要加上 **`-r`** (recursive) 参数。例如上传 `src` 文件夹：

```bash
scp -r ./src baiwen@192.168.1.100:~/workspace/
```

:::warning 注意
首次连接某个 IP 时，终端会询问 `Are you sure you want to continue connecting (yes/no)?`，请输入 `yes` 并回车确认，随后输入密码即可开始传输。
:::
