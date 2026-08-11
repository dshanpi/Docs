---
sidebar_position: 1
---

# GDB Over ADB 使用指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_GDB_Over_ADB_CN.pdf`（V1.0, 2019-06）整理，介绍如何通过 ADB 使用 GDB 远程调试 Buildroot 系统上的应用程序。

:::info 适用范围
- **芯片平台**：RK 系列 Buildroot 系统
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## Buildroot 配置

### 配置使能 GDB 主机程序

在 Buildroot menuconfig 中使能 GDB 主机工具链：

```
Toolchain  --->
    [*] Build cross gdb for the host
```

### 配置 GDB Server 程序

在目标系统中添加 gdbserver：

```
Target packages  --->
    Debugging, profiling and benchmark  --->
        [*] gdbserver
```

:::tip 提示
选择 gdbserver 即可满足调试需求，不需要完整的 gdb。
:::

### 配置编译带调试信息

配置 Buildroot 包带调试信息：

```
Build options  --->
    [*] build packages with debugging symbols
```

如果 Buildroot 配置了 `strip target binaries`，则不影响最终打包到 target 的包，仅影响 staging 目录（类似于 Android 的 symbol 目录）。

---

## 启动 GDB over ADB

### 步骤 1：配置 ADB 端口转发

```bash
adb forward tcp:1337 tcp:1337
```

### 步骤 2：启动 GDB Server

在 adb shell 或串口控制台执行：

**方式一：调试正在运行的进程（attach）**

```bash
gdbserver :1337 --attach <PID>
```

**方式二：启动新程序并调试**

```bash
gdbserver :1337 <程序完整路径> [参数...]
```

**示例：**

```bash
gdbserver :1337 /bin/busybox ls
```

运行后输出：

```
Process /bin/busybox created; pid = 633
Listening on port 1337
```

当 GDB 客户端连接后：

```
Remote debugging from host 127.0.0.1
```

### 步骤 3：GDB 客户端调试

在主机端运行交叉编译工具链中的 gdb：

```bash
./buildroot/output/rockchip_puma/host/bin/arm-buildroot-linux-gnueabihf-gdb
```

设置 sysroot（指向 staging 目录）：

```gdb
(gdb) set sysroot /work/linux/rk1808/buildroot/output/rockchip_puma/staging/
```

连接到远程目标：

```gdb
(gdb) target remote :1337
```

连接成功后即可使用常规 GDB 命令进行调试（设置断点、单步、查看变量等）。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_GDB_Over_ADB_CN.pdf` V1.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
