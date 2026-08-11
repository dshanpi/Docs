---
sidebar_position: 14
---

# HDMI-CEC 软件说明

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_HDMI-CEC_CN.pdf`（V1.1.0, 2020-08-11）整理，介绍 Rockchip 平台 HDMI-CEC 的基本概念、软件架构与调试方法。

:::info 适用范围
- **芯片平台**：RK322X / RK3328 / RK3368 / RK3399 / RK3288
- **系统版本**：Android 5.X 以上 / Linux kernel 4.4 / 4.19
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、CEC 简介

### 1.1 CEC 的定义

CEC 全称 **Consumer Electronics Control**（消费类电子控制），为用户环境中所有通过 HDMI 线连接的家庭视听设备提供高级控制功能。用户通过一个遥控器即可对所有连接的设备进行控制。

**典型应用：** 用电视遥控器同时控制电视和盒子，或用盒子遥控器同时控制电视和盒子。

### 1.2 CEC 协议简介

#### 网络拓扑
CEC 假定系统内所有音视频信号源产品直接或间接连接到一个"根"显示设备，通过 HDMI 线连接成自上而下的树状结构：
- 显示设备作为"根"
- 信号开关设备作为"枝"
- 信号源产品作为"叶"节点

#### 物理地址
每个设备有且仅有一个物理地址，软件通过 EDID 为 CEC 网络中的所有设备分配物理地址。

#### 逻辑地址
每个连接到 CEC 总线上的设备必须绑定一个逻辑地址，定义设备类型。
- 每个逻辑地址只能绑定唯一一个设备（15 除外）
- 大多数设备只绑定一个逻辑地址，少数设备最多可绑定两个

**逻辑地址分配流程：** 发送 SRC 和 DST 地址相同的 **POLL MSG** 来确认地址是否已被占用。

#### CEC 消息格式

CEC 设备通过发送 CEC MSG 通信。CEC MSG 由多个或单个 Block 组成：

**Block 格式：**
- 8 bit Header/Data
- 1 bit EOM（End of Message，1 表示消息结束）
- 1 bit ACK（响应位，发送方置 1，接收方成功收到后置 0）

**Header Block**（第一个 Block）：
- 高 4 位：发送方 Logical address
- 低 4 位：接收方 Logical address

**Data Block**：OPCODE 或参数。

---

## 二、CEC 代码介绍

### 2.1 Android CEC 框架介绍

#### 2.1.1 Android CEC 框架概述

Android TIF（TV Input Framework）引入了 HDMI-CEC，让连接设备能够相互通信并降低兼容性问题。

**核心组成部分：**

1. **HdmiControlManager** — 向有权限的应用提供 API
   - 路径：`frameworks/base/core/java/android/hardware/hdmi`
2. **HdmiControlService** — 系统服务，实现 CEC 标准
   - 路径：`frameworks/base/services/core/java/com/android/server/hdmi`
3. **HDMI-CEC HAL** — 硬件抽象层，抽象硬件差异

#### 2.1.1.1 HdmiControlService

与系统其他部分（TIF、Audio 服务、电源管理服务等）协作实现 CEC 标准。设计用于支持多种类型的逻辑设备。

#### 2.1.1.2 HDMI-CEC HAL

设备制造商必须按照 Android 定义实现 HAL。HAL 提供以下 API：

**TX/RX/事件：**
- `send_message` — 发送 CEC 消息
- `register_event_callback` — 注册事件回调

**信息：**
- `get_physical_address` — 获取物理地址
- `get_version` — 获取 CEC 版本
- `get_vendor_id` — 获取厂商 ID
- `get_port_info` — 获取 HDMI 端口信息

**逻辑地址：**
- `add_logical_address` — 添加逻辑地址
- `clear_logical_address` — 清除逻辑地址

**状态：**
- `is_connected` — 连接状态
- `set_option` — 设置选项
- `set_audio_return_channel` — 设置 ARC

### 2.2 Linux HDMI CEC 应用说明

#### 2.2.1 v4l-utils 的安装

Linux 下使用 v4l-utils 工具进行 CEC 调试。

#### 2.2.2 相关命令

使用 `cec-ctl` 等命令进行 CEC 控制和调试。

### 2.3 CEC 软件流程介绍

#### 2.3.1 CEC 初始化流程

##### 驱动注册流程
##### 初始化设置流程

#### 2.3.2 CEC 消息发送流程

#### 2.3.3 CEC 消息接收流程

#### 2.3.4 CEC 事件处理流程

### 2.4 新增 CEC Feature 常用接口

---

## 三、常用 DEBUG 方法

### 3.1 DEBUG 脚本

#### 3.1.1 log 内容说明

#### 3.1.2 CEC DEBUG 节点说明

```bash
# 查看 CEC 相关 debug 节点
ls /sys/class/cec/
```

#### 3.1.3 CEC kernel log 开启方法

```bash
echo 0x1f > /sys/module/cec/parameters/debug
```

### 3.2 常见异常排查方法

#### 3.2.1 所有 CEC 功能都失效的场景

排查方向：
- CEC 物理连接是否正常
- CEC 驱动是否加载
- 逻辑地址分配是否成功
- CEC 总线电平是否正常

#### 3.2.2 电视待机，盒子未进入待机

排查方向：
- 电视是否发送了正确的 CEC 待机命令
- 盒子是否正确接收并解析命令
- 电源管理服务是否响应

#### 3.2.3 盒子待机，电视未进入待机

排查方向：
- 盒子是否发送了待机命令
- 电视是否支持待机命令
- CEC 消息是否成功传输

#### 3.2.4 盒子唤醒，电视未被唤醒

排查方向：
- 盒子是否发送了唤醒命令
- 电视是否支持 CEC 唤醒
- CEC 总线在待机状态下是否保持供电

#### 3.2.5 电视遥控器无法控制盒子的 UI

排查方向：
- 电视是否发送了正确的按键消息
- 盒子是否正确接收并映射按键
- HdmiControlService 是否正常工作

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_HDMI-CEC_CN.pdf` V1.1.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
