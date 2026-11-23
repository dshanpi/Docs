---
title: 文件传输指南
sidebar_position: 3
slug: /DshanPi-A1_CM5/SystemConfig/FileTransfer
description: 用 SFTP 图形界面或 scp 在电脑和 DshanPI A1 CM5 之间双向传输文件。
---

先确认能用普通账号[远程登录 DshanPI A1 CM5](./02-RemoteConfig.md)。上传目标优先选择该用户的主目录，例如 `/home/baiwen`。

## 在 Windows 上拖放文件

1. **跟随板端目录。** 打开 DshanPI A1 CM5 会话，在左侧 SFTP 面板勾选 **Follow terminal folder**。在板端终端输入 `cd ~`，确认左侧路径切换到自己的主目录。

2. **上传到 DshanPI A1 CM5。** 将电脑文件拖入左侧面板，或点击绿色向上箭头选择文件。刷新面板，核对文件名和大小。
3. **下载到电脑。** 选中板端文件，点击蓝色向下箭头，或右键选择 **Download**，再选电脑上的保存目录。

### 使用 FileZilla

1. 在电脑上打开 **FileZilla Client**。在快速连接栏的主机框输入 `sftp://192.168.1.49`（换成板端 IP），填写普通用户名、密码和端口 `22`，点击**快速连接**。首次连接时核对主机指纹。

   <img src={require('./figures/filezilla-connect.png').default} width="620" alt="FileZilla 顶部快速连接栏中的主机、用户名、密码和端口" />

2. 左侧**本地站点**是电脑，右侧**远程站点**是 DshanPI A1 CM5。向右拖放可上传，向左拖放可下载。完成后在目标目录核对文件。

## 使用命令行传输

在**电脑终端**进入存放 `demo.txt` 的目录。下面的用户名和 IP 为示例，请替换后执行。

**从电脑上传。** 文件会保存到板端用户的主目录。

```bash
scp ./demo.txt baiwen@192.168.1.49:~/
```

**下载到电脑。** 使用另一个文件名，方便与原文件比较。

```bash
scp baiwen@192.168.1.49:~/demo.txt ./demo-from-cm5.txt
```

在 DshanPI A1 CM5 桌面打开终端，输入 `ls -l ~/demo.txt` 核对上传的文件。在电脑上打开下载的 `demo-from-cm5.txt`，确认内容与原文件一致。要上传整个目录，例如当前目录下的 `project`，使用：

```bash
scp -r ./project baiwen@192.168.1.49:~/
```

**DshanPI A1 CM5 实测结果**　使用命令行上传、下载文件及上传目录后，内容比对一致。SFTP 已验证可读取板端文件。
