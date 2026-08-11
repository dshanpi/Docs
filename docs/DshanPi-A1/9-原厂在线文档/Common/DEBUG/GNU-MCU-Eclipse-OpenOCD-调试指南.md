---
sidebar_position: 4
---

# GNU MCU Eclipse OpenOCD 调试指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_GNU_MCU_Eclipse_OpenOCD_CN.pdf`（V2.0.0, 2021-02-08）整理，介绍基于 GNU MCU Eclipse + OpenOCD 的调试方法。

:::info 适用范围
- **芯片平台**：RK3588 / RK3568 / RK3566 / RK3399 / RK3288 / RK3368 / RK3326 / PX30 / RK3308 / RV1108 / RV1126 / RV1109 / RV1106 / RK2108 / RK2206 / RISC-V 等
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、说明

### 调试架构

```
Eclipse CDT + GNU MCU Eclipse 插件 + GDB + OpenOCD + 适配器 + SOC
```

各组件说明：

| 组件 | 说明 |
| :--- | :--- |
| **Eclipse CDT** | C/C++ 开发工具 |
| **GNU MCU Eclipse OpenOCD** | 开源插件，完成 CDT 与 GDB、OpenOCD 的交互 |
| **GDB** | GNU 调试器 |
| **OpenOCD** | 开源调试软件，适配各种 SWD/JTAG 适配器，支持 ARM、RISC-V 等架构 |
| **适配器** | FT232H / JLink 等 USB 转 SWD/JTAG 设备 |

---

## 二、操作系统环境

### 2.1 Windows

#### 软件包

解压 `openocd_eclipse.zip`，目录结构：

```
eclipse/                    # Eclipse 主程序
eclipse-workspace/          # 工作目录（已默认配置）
example/                    # 相关示例
OpenOCD/                    # OpenOCD 工具
  ├── openocd              # OpenOCD 主程序
  └── SVD/                 # CMSIS-SVD 芯片寄存器描述文件
tools/                      # 开源工具（GDB、JDK 等）
doc/                        # 使用帮助文档
实战视频/                    # 快速上手视频
```

运行 `Eclipse_for_OpenOCD V1.0.exe` 打开 Eclipse。

#### JRE 安装

运行 Eclipse 需要 Java 运行环境。安装：
```
RK\tools\jdk_8.0.1310.11_64.exe
```

#### Telnet 功能

Telnet 用于进入 OpenOCD 命令行模式。Windows 10 中：
```
控制面板 → 程序 → 启用或关闭 Windows 功能 → 勾选 Telnet 客户端
```

### 2.2 Ubuntu 64 位

#### 软件包

解压 `openocd_eclipse.tar.gz`：

```bash
tar -xzvf openocd_eclipse.tar.gz
```

#### 安装依赖

```bash
# JRE
sudo add-apt-repository ppa:openjdk-r/ppa
sudo apt-get update
sudo apt-get install openjdk-8-jre

# OpenOCD 依赖
sudo apt-get install libusb-1.0-0-dev
sudo apt-get install libftdi-dev

# USB 设备规则
sudo cp RK/OpenOCD/drivers/99-openocd.rules /etc/udev/rules.d/
sudo cp RK/OpenOCD/drivers/60-openocd.rules /etc/udev/rules.d/

# 反汇编工具
sudo apt-get install libcapstone-dev
```

:::note 说明
Ubuntu 16.04 和 18.04 测试正常。
:::

---

## 三、快速上手

### 3.1 硬件连接

支持以下连接方式：
- **标准 ARM 20PIN JTAG 座子**
- **TF 卡转 JTAG 小板**
- **UART2 与 JTAG 复用**

### 3.2 软件连接

#### 步骤 1：运行软件

```
Eclipse_for_OpenOCD V1.0.exe
```

#### 步骤 2：导入芯片配置（可选）

软件包已包含芯片配置。如有更新的配置文件，可手动导入。

#### 步骤 3：选择芯片

从芯片支持列表中找到所需要连接的芯片。

#### 步骤 4：连接成功

CPU Stop 后即可进行调试。

### 3.3 连接失败排查

#### JTAG 适配器无法识别

- 确认适配器驱动是否正确安装
- 参照《FT232H USB2JTAG 使用指南》
- OpenOCD 默认可自动识别 ft232h、ft2232h、jlink 三种适配器

#### 芯片无法识别

- 确认芯片引脚接触是否正常
- 确认芯片 JTAG IOMUX 是否使能
- 降低 JTAG 的 TCK 速率再试

#### 常见错误信息

| 错误信息 | 含义 | 处理方法 |
| :--- | :--- | :--- |
| `the connection is ok, but the cpu is in incorrect state` | 硬件连接正常，但芯片状态异常 | 无法继续 debug，需检查芯片状态 |
| `swdio(tms) pin is low level` | 硬件连接问题 | 检查 IOMUX 配置或 pin 脚接触 |
| `Please, adapter speed 1000 set clk 1MHz to try again` | TCK 速率过高 | 降低 JTAG 速率重连 |

---

## 四、基础调试功能

### 4.1 调整 SWD/JTAG 速率

如果硬件限制导致通讯失败，降低 TCK 速率。

- 最大：30000 KHz
- 推荐：15000 KHz 或 7500 KHz

### 4.2 静态加载符号表

连接前在配置中设置，只能加载一个符号表。

### 4.3 动态加载符号表

在 **Debugger Console** 窗口（实际是 GDB 命令窗口）执行 `add-symbol-file` 加载，可同时加载多个：

```gdb
# 加载 Linux 内核符号表
add-symbol-file G:/vmlinux

# 加载 BL31 符号表
add-symbol-file T:/work/uboot/u-boot/bl31.elf

# 加载 U-Boot 符号表
add-symbol-file T:/work/uboot/u-boot/u-boot

# 加载 TPL/SPL 符号表
add-symbol-file T:/work/uboot/u-boot/tpl/u-boot-tpl
add-symbol-file T:/work/uboot/u-boot/spl/u-boot-spl
```

:::note 注意
Windows 环境下路径中的 `\` 需要改为 `/`。加载符号表后，需要单步运行一下，函数调用栈才会显示出来。
:::

### 4.4 设置源代码路径

- 方法 1：通过界面直接设置
- 方法 2：在 Debug Configurations 界面设置

### 4.5 查看反汇编

- 查看调用栈函数的反汇编
- 查看某个地址的反汇编
- 查看某个函数的反汇编（需导入符号表）

### 4.6 查看调用栈函数的局部变量

在变量窗口中查看当前函数的局部变量。

### 4.7 查看全局变量

在 **Expressions** 窗口点击 **Add new expression**，输入全局变量名字。也支持指针形式的 expression。

### 4.8 单步调试

支持常规单步操作：
- Step Into（进入函数）
- Step Over（跳过函数）
- Step Return（跳出函数）
- Resume（继续运行）
- Suspend（暂停）

### 4.9 设置断点

- 从源代码窗口设置断点
- 从 Disassembly 窗口设置断点

### 4.10 查看内存数据

通过 **Memory Browser** 窗口查看内存。

:::caution 注意
Memory Browser 窗口只正常支持 32 位地址访问。对于 64 位地址访问有问题，请进入 OpenOCD 命令行模式用 `mdw`、`mww`、`smdw`、`smww`、`io` 等命令操作内存。
:::

---

## 五、高级调试功能

### 5.1 寄存器分组

寄存器很多时，可分组查看方便管理。

### 5.2 指定连接的 CPU

多核芯片可选择连接特定的 CPU 核。

### 5.3 安全调试

如果产品使能安全策略，JTAG 需要输入 key 才能调试。

### 5.4 OpenOCD 命令行模式（命令行终端）

#### 启动 OpenOCD

```bash
openocd.exe -r <芯片名>
```

更多命令参考：[OpenOCD User's Guide](http://openocd.org/doc/html/General-Commands.html)

#### Telnet 连接

新开一个 cmd 窗口：

```bash
telnet localhost 4444
```

也可以使用 SecureCRT 等工具创建 telnet 连接。

### 5.5 OpenOCD 命令行模式（基于 Eclipse）

在 Eclipse 中打开本地终端，输入：

```
telnet localhost 4444
```

:::tip 适用场景
当 UI 无法很好展示某些信息或操作时，使用命令行模式。
:::

### 5.6 查看可视化的外设寄存器

连接前选择 SVD（CMSIS System View Description）格式文件，连接后可以图形化方式查看外设寄存器。

### 5.7 查看可视化的 System Control Registers

同样通过 SVD 文件配置，可视化查看系统控制寄存器。

### 5.8 从内存导出数据到文件

```
dump_image filename [p:]address size
```

**虚拟地址访问：**
```
> dump_image dd.bin 0xffffff8009a63c80 65536
dumped 65536 bytes in 0.113187s (565.436 KiB/s)
```

**物理地址访问：**
```
> dump_image dd.bin p:0x01c63c80 65536
dumped 65536 bytes in 0.094566s (676.776 KiB/s)
```

### 5.9 从文件导入数据到内存

```
load_image filename [p:]address ['bin'|'ihex'|'elf'|'s19'] [min_address] [max_length]
```

**虚拟地址：**
```
> load_image dd.bin 0xffffff8009a63c80 bin
65536 bytes written at address 0xffffff8009a63c80
```

**物理地址：**
```
> load_image dd.bin p:0x01c63c80 bin
65536 bytes written at address 0x01c63c80
```

### 5.10 对比文件和内存数据

```
verify_image filename [offset [type]]
```

只支持虚拟地址访问：
```
> verify_image dd.bin 0xffffff8009a63c80
verified 65536 bytes in 0.066775s (958.443 KiB/s)
```

:::note 关于虚拟地址和物理地址
- 对于 MaskROM、TPL、SPL、U-Boot、ATF 等，虚拟地址与物理地址一致，直接用虚拟地址方式即可
- 对于 Linux，物理地址与虚拟地址不同，访问物理地址时需在地址前加 `p:`
- filename 为相对路径时，文件保存在 OpenOCD 运行目录下
:::

---

## 六、实际运用场景

### 6.1 调试 CPU 卡死问题

**适用场景：** 画面卡死、黑屏、串口无响应、内核报错后死机等。

**调试步骤：**

1. **启动 OpenOCD**

   ```bash
   openocd.exe -r rk3399
   ```

2. **Telnet 连接**

   ```bash
   telnet localhost 4444
   ```

3. **查看 CPU 状态**

   ```
   &gt; l                         # 查看所有 CPU 状态
   TargetName       Type       Endian  State
   0  ahb           mem_ap     little  running
   2* cpu0          aarch64    little  running
   ...
   ```

4. **打印 PC 指针（多次打印确认是否卡死）**

   ```
   &gt; dump_pc              # 连续多次打印各 CPU 的 PC 值
   cpu0 pc:0xffffff8008143a88
   cpu1 pc:0xffffff8008143a5c
   cpu2 pc:0xffffff8008081078
   ...
   ```

   经过多次打印，如果 PC 指针都没变，说明 CPU 卡死了。

5. **尝试 halt CPU**

   ```
   &gt; halt               # 正常停止
   Timeout waiting for target cpu0 halt   # 失败则用 fhalt
   &gt; fhalt              # 强制进入 debug 状态
   ```

6. **查看寄存器**

   ```
   &gt; core_reg64         # 打印 CPU 通用寄存器（64位）
   x0: 0xffffffc00a3d7e00
   x1: 0xffffff8008081028
   ...
   pc: 0xffffff800808107c
   sp: 0xffffffc0f6ed8000

   &gt; mrs SCTLR_EL1      # 读系统控制寄存器
   SCTLR_EL1: 0x34d5d91d
   ```

7. **反汇编定位函数**

   ```bash
   objdump.exe -d vmlinux | less
   ```

   查找 PC 指针所在的函数和指令，分析卡死原因。

:::tip 提示
如果无法自行分析死机原因，可将上述命令的 log 发给 Rockchip 工程师分析。
:::

### 6.2 RT-Thread 调试

默认只显示单线程，添加以下参数可显示多线程：

```
-c "cpu0 configure -rtos RT_Thread"
```

### 6.3 Linux 单步调试

适用于内核启动过程中无任何 log 输出（排除串口问题后），可能是内核启动早期异常。

#### 内核单核阶段

在 `start_kernel` 函数入口处添加死循环：

```c
// linux5.10/init/main.c
asmlinkage __visible void __init __no_sanitize_address start_kernel(void)
{
    char *command_line;
    char *after_dashes;

    asm volatile("b .");    // 死循环，等待 JTAG 连接
    // ...
}
```

连接 JTAG 后，跳过死循环指令进行单步调试。

#### 内核多核阶段

在 `bringup_nonboot_cpus` 函数末尾添加死循环，调试多核启动流程：

```c
// linux5.10/kernel/cpu.c
void bringup_nonboot_cpus(unsigned int setup_max_cpus)
{
    unsigned int cpu;
    for_each_present_cpu(cpu) {
        if (num_online_cpus() >= setup_max_cpus)
            break;
        if (!cpu_online(cpu))
            cpu_up(cpu, CPUHP_ONLINE);
    }
    asm volatile("b .");    // 死循环
}
```

### 6.4 裸机调试

#### 创建工程

按 Eclipse 标准流程创建工程，配置编译器参数和交叉编译器。

#### 加载并运行固件

复制对应芯片的调试配置，在此基础上修改即可。

### 6.5 使用 KGDB

#### 用途

- 调试某个驱动
- 出现非法指针时回溯整个调用栈，判断指针出错点
- 采用串口通讯，而非 JTAG 接口，方便快捷

#### KGDB 使能

**Menuconfig 配置：**

```
Device Drivers  --->
    Character devices  --->
        [*] Virtual terminal
        [*] Enable character translations in console
        [*] Support for console on virtual terminal

Kernel hacking  --->
    Generic Kernel Debugging Instruments  --->
        [*] KGDB: kernel debugger  --->
            [*] KGDB: use kprobe blocklist to prohibit unsafe breakpoints
            <*> KGDB: use kgdb over the serial console

Kernel hacking  --->
    Debug Oops, Lockups and Hangs  --->
        (0) panic timeout      // 配成 0，出现 die 时才会进入 kgdb
```

也可以运行时设置：
```bash
echo 0 > /sys/module/kernel/parameters/panic
```

**内核 DTS 修改：**

```dts
chosen {
    bootargs = "kgdboc_earlycon kgdboc=ttyFIQ0,1500000";
};
```

**验证生效：**

```bash
echo g > /proc/sysrq-trigger
```

正常情况下内核会进入 KGDB 等待远程调试器连接：
```
KGDB: Waiting for remote debugger
```

### 6.6 AArch64 32 位模式调试

```
-c "cpu0 aarch64_32 "
```

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_GNU_MCU_Eclipse_OpenOCD_CN.pdf` V2.0.0
- OpenOCD 官方文档：[http://openocd.org/doc/html/General-Commands.html](http://openocd.org/doc/html/General-Commands.html)
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
