---
sidebar_position: 3
---

# DS-5 External Debug 连接指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_DS5_CN.pdf`（V2.1.0, 2020-02-26）整理，介绍 ARM DS-5 调试工具通过 JTAG/SWD 连接 Rockchip 芯片的方法。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：无限制
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、JTAG/SWD 硬件接口

### 1.1 系统调试架构

Rockchip 芯片支持两种调试输出接口：
- **JTAG/SWD** — 用于调试连接
- **TRACE_DATA** — 用于跟踪数据输出

### 1.2 JTAG 与 SWD 接口

| 接口类型 | 线数 | 信号线 |
| :--- | :--- | :--- |
| **JTAG** | 5 线 | TDO、TDI、TRST_N、TMS、TCK |
| **SWD** | 2 线 | TMS（SWDIO）、TCK（SWCLK） |

**特点：**
- 这两种接口由芯片硬件自动识别和控制，不需要软件干预
- DS-5 调试软件若 5 线全部连接，配置为 JTAG 或 SWD 都能识别
- 若只连接 TMS 和 TCK，则只能配置为 SWD 接口

### 1.3 硬件连接方式

Debug 引脚通常和 SDMMC 复用，硬件设计上有几种连接方式：

1. **直接连 JTAG/SWD 座子** — 板子有预留调试接口
2. **TF 卡转接板** — 通过 TF-TO-JTAG 转接板连接（Rockchip 独有）
3. **飞线** — 从 TF 卡座飞线连接（根据各自芯片引脚定义）

:::note 提示
建议在 **Maskrom 或 Loader 烧写模式**下尝试连接，以确保硬件没问题。运行到 Linux 内核后，SDMMC 驱动可能会禁止 JTAG/SWD 功能，需要软件做相应修改。
:::

:::caution 注意
Debug 功能和 TF 卡无法同时使用。
:::

---

## 二、JTAG/SWD 代码软件配置

### 2.1 IOMUX 引脚复用切换

JTAG 各引脚与其他功能模块复用，需要切换到 JTAG 功能。

#### 方法 1：配置 IOMUX 寄存器

通过 GRF 寄存器配置引脚复用为 JTAG 功能（具体寄存器地址因芯片而异，以 RK3399 为例：`GRF_GPIO4B_IOMUX`）。

#### 方法 2：Force JTAG 位

当 force jtag 位为 1 时，硬件会自动切换到 JTAG，不需要配置 IOMUX 寄存器。

以 RK3399 为例：`GRF_SOC_CON7` 寄存器中的 force jtag 位。

:::caution 注意
force jtag 位配为 1 时，需要 SDMMC 的 detect 脚为**高**才会起作用，否则还是 SDMMC 的 IOMUX。也就是说，使用 JTAG 时**不能插着 SD 卡**。
:::

### 2.2 Debug 模块和 CPU CLK

一般无需额外配置 CLK 开关。

---

## 三、DS-5 软件工具快速上手

### 3.1 DS-5 主要菜单

DS-5 主界面主要包含：
- **File** — 工程管理
- **Window → Debug Control** — 调试控制窗口
- **Window → Preferences** — 偏好设置
- **Debug Configurations** — 调试连接配置

### 3.2 创建新的芯片平台配置

平台配置包含 DEBUG 系统相关信息，告诉 DS-5 该 SOC 包含哪些 DEBUG 模块及组合方式。

#### 步骤 1：创建 Configuration Database

```
File → New → Other → Configuration Database
```

#### 步骤 2：创建 Platform Configuration

```
File → New → Other → Platform Configuration
```

- **5 线 JTAG**：选择 `Automatic/simple platform detection`
- **2 线 SWD**：选择 `Advanced platform detection or manual creation`

#### 步骤 3：选择数据库和调试器

- 选择之前创建的 Configuration Database
- 在 **Connection Address** 中选择已连接的 DSTREAM 设备（USB 或网口）

#### 步骤 4：自动检测平台

- 5 线 JTAG：直接点击 **Autodetect Platform**
- 2 线 SWD：先配置 SWD 参数，再点击 Autodetect Platform

:::important 重要
Autodetect Platform 一定要在 **Maskrom 模式**下进行，否则很多模块可能识别不到。
:::

#### 步骤 5：手动添加缺失连接

扫描完成后，若提示 CSETM_0-3 没有连接，需要手动添加：
1. 右击 CSETM_0
2. 点击 **Add Link From This Device**
3. 选择 CSTFunnel
4. 以此类推添加 CSETM_0-3

#### 步骤 6：保存配置

按 `Ctrl+S` 保存工程。

:::tip 提示
也可以使用现成的配置文件，通过 **Window → Preferences** 添加配置路径。
:::

### 3.3 创建新的连接配置

#### 步骤 1：打开调试配置

```
Window → Show view → Debug Control → Debug Configurations
```

#### 步骤 2：新建 DS-5 Debugger

右击 **Debugger → 新建 DS-5 Debugger 配置**：

1. 输入新连接名称
2. 选择对应的 SOC 配置（可在搜索框输入芯片型号搜索）
3. 选择调试类型：
   - **Bare Metal Debug** — 裸系统调试
   - **Linux Kernel Debug** — Linux 内核调试（更好地支持带系统的调试功能）
4. 选择连接的 CPU 组合（单个核或所有核）
5. 选择 DS-5 连接器（USB 或网口连接的调试器）
6. 在 **Debugger** 菜单栏下选择 **Connect only**
7. 点击 **Apply** 保存，再点击 **Debug** 开始连接

连接成功后，即可使用 Stop、Run、单步执行等调试功能。

---

## 四、错误排除

### 4.1 连接失败排查

1. **检查 DS5 TARGET 灯** — 若不亮表示 JTAG 没供电，需要打开 SD 卡的电
2. **检查 TMS 和 TCK 硬件连接** — 确认这两个脚焊接/连接正常
3. **确认芯片处于 Maskrom/Loader 模式** — Linux 内核运行时 JTAG 可能被禁用
4. **确认 force jtag 位已配置** — 确保引脚切换到 JTAG 功能
5. **确认未插 SD 卡** — SD 卡插入时 JTAG 可能无法使用

### 4.2 DS-5 设备连接异常

如果 DS-5 设备用起来不正常、连接老是异常，可能是 **DS-5 软件和 DSTREAM 设备固件版本不匹配**。

**升级 DSTREAM 固件：**

```
Window → Show View → Other → Debug Hardware Firmware Installer
```

1. 选择 DSTREAM 设备
2. 连接设备（软件会自动识别版本并提示是否需要升级）
3. 升级固件

---

## 五、调试基本步骤

### 5.1 可查看信息

连上目标板后点击 **Stop**，可以查看：

#### 导入符号表

在 Commands 窗口输入：

```
add-symbol-file "W:\kernel\rk3399_linux4.4\vmlinux"
```

**常见用法：**

```
add-symbol-file myFile.axf                  # 从入口点加载符号
add-symbol-file myLib.so                    # 共享库符号文件
add-symbol-file myModule.ko                 # 内核模块符号文件
add-symbol-file myFile.axf 0x2000           # 从入口点+0x2000 加载
add-symbol-file vmlinux N:0                 # 在非安全地址 0x0 加载
add-symbol-file vmlinux EL2:0x4080000000    # 在 EL2 非安全地址空间加载
```

#### 查看线程调用栈

右击 `RK3399 connected` → 选择 **Display Threads**：
- **Active Threads** — 每个核当前执行的线程
- **All Threads** — 所有线程
- 点击某个线程可查看其调用栈
- 右侧显示 CPU 相关寄存器

#### 查看变量

- 局部变量和全局变量
- 可以手动添加监控变量

#### 查看内存和寄存器

使用 **memory** 功能查看内存或外设寄存器。

在 command 窗口输入 `info mem` 查看地址空间信息：

```
Num Enb Low Addr                 High Addr                Attributes       Description
 1: y  SP:0x0000000000000000     SP:0xFFFFFFFFFFFFFFFF     rw, nocache      安全世界物理地址
 2: y  S:0x00000000              S:0xFFFFFFFF             rw, nocache      安全世界地址
 3: y  NP:0x0000000000000000     NP:0xFFFFFFFFFFFFFFFF     rw, nocache      普通世界物理地址
 4: y  N:0x00000000              N:0xFFFFFFFF             rw, nocache      普通世界地址
 5: y  H:0x00000000              H:0xFFFFFFFF             rw, nocache      Hypervisor 地址
 6: y  EL3:0x0000000000000000    EL3:0xFFFFFFFFFFFFFFFF   rw, nocache      EL3 地址
 7: y  EL2:0x0000000000000000    EL2:0xFFFFFFFFFFFFFFFF   rw, nocache      EL2 地址
 8: y  EL1S:0x0000000000000000   EL1S:0xFFFFFFFFFFFFFFFF  rw, nocache      EL1 安全世界地址
 9: y  EL1N:0x0000000000000000   EL1N:0xFFFFFFFFFFFFFFFF  rw, nocache      EL1 普通世界地址
10: y  APB_0:0x00000000          APB_0:0xFFFFFFFF         rw, nobp...      APB 总线外设（通过 AP 1）
11: y  AHB_0:0x00000000          AHB_0:0xFFFFFFFF         rw, nobp...      AHB 总线（通过 AP 0）
```

:::tip 提示
当 CPU 已经挂掉时，可以通过 APB_0 或 AHB_0 方式直接访问外设寄存器和 DDR 内存。
:::

### 5.2 常用命令

| 命令 | 功能 |
| :--- | :--- |
| `dump binary memory "E:\mem_ok.txt" sp:0x62000000 +0x200000` | 保存某段内存到本地文件 |
| `restore "E:\mem_ok.txt" binary sp:0x64000000` | 从文件恢复内存 |
| `memory fill &lt;verify=0&gt;:sp:0x60000000 +0x10 4 0x55555555` | 在内存段填充特定值 |
| `set *0xff690000=0x33` | 设置某地址的值（DDR、外设寄存器、CPU 寄存器均可） |

:::info 更多帮助
DS-5 命令使用帮助可在调试过程中随时查询，涵盖了各种调试场景的命令。
:::

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_DS5_CN.pdf` V2.1.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
