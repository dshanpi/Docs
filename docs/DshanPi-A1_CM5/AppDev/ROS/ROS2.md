---
title: ROS 2 话题发布与订阅
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppDev/ROS2
---

发布节点将消息发到话题，订阅节点通过同一话题接收消息。下面在一块 DshanPI A1 CM5 上运行两个节点，用相同的消息编号核对通信。Ubuntu 24.04（Noble）使用 ROS 2 Jazzy。

## 理解节点、话题和工作环境

ROS 2 通过话题传递消息。`talker` 是发布节点，定时向 `/chatter` 发送字符串。`listener` 是订阅节点，收到同一条消息后打印内容。用不同语言编写的节点，只要话题和消息类型一致，就可以通信。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 在板上安装示例

打开 DshanPI A1 CM5 的桌面终端，先按官方 Ubuntu 安装指南启用 Universe 和 ROS 2 软件源。本例使用 `ros2-apt-source` 配置软件源与签名密钥。 [ROS 2 Jazzy 软件源配置](https://docs.ros.org/en/jazzy/Installation/Ubuntu-Install-Debs.html)

```bash
sudo apt update
sudo apt install ros-jazzy-demo-nodes-cpp ros-jazzy-demo-nodes-py ros-jazzy-ros2run ros-jazzy-ros2topic
```

### 打开两个终端

**终端一**启动 C++ 发布节点，保持运行。

```bash
source /opt/ros/jazzy/setup.bash
ros2 run demo_nodes_cpp talker
```

**终端二**启动 Python 订阅节点。每个新终端都要先加载环境。

```bash
source /opt/ros/jazzy/setup.bash
ros2 run demo_nodes_py listener
```

在第一个终端找 `Publishing`，在第二个终端找 `I heard`。两边出现同一条 `Hello World` 和相同编号，即表示订阅者收到发布者的消息。可在另一个加载了环境的终端运行 `ros2 topic list`，查看 `/chatter`。在两个程序中分别按 **Ctrl+C** 结束。

### 对照 DshanPI A1 CM5 的输出 {#对照-cm5-的输出}

下面截取同一条消息。订阅节点启动稍晚时，第一条收到的编号可以大于 1。

```text
[talker]: Publishing: 'Hello World: 2'
[listener]: I heard: [Hello World: 2]
```

### 核对发布者和订阅者的同一条消息

打开两个桌面终端，在两个终端分别运行第一段，再分别启动发布者和订阅者。两端使用同一个域编号。

```bash
source /opt/ros/jazzy/setup.bash
export ROS_DOMAIN_ID=83
```

```bash
# 终端一
ros2 run demo_nodes_cpp talker
```

```bash
# 终端二
ros2 run demo_nodes_py listener
```

本次两端收到的同序号消息如下。核对编号后，在两个终端分别按 `Ctrl+C`。

```text
[talker]: Publishing: 'Hello World: 3'
[listener]: I heard: [Hello World: 3]
```
