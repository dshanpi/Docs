---
sidebar_position: 1
---

# DDR 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_DDR_CN.pdf`（V2.5.0, 2024-06-07）整理，介绍 Rockchip 平台 DDR 开发中的常见问题、调试方法、颗粒验证流程、眼图工具、带宽工具和 ECC 功能。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：所有内核版本
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、DDR 开发 FAQ

### 1.1 如何看懂 DDR 打印信息

DDR 打印信息包括 **loader 中的打印**和 **kernel 中的打印**。

#### Loader 中的打印

```
DDR Version 1.05 20170712      // DDR 初始化代码版本信息，从这行开始进入 DDR 初始化
In SRX                          // 有 SRX 说明是热重启，没有说明是冷开机（部分芯片无此功能）
Channel a: DDR3 400MHz          // Channel a 信息
  Bus Width=32 Col=10 Bank=8 Row=15 CS=1 Die Bus-Width=16 Size=1024MB
Channel b: DDR3 400MHz          // Channel b 信息
  Bus Width=32 Col=10 Bank=8 Row=15 CS=1 Die Bus-Width=16 Size=1024MB
Memory OK                       // Channel a 自测结果（报错说明焊接有问题）
Memory OK                       // Channel b 自测结果
OUT                             // 退出 DDR 初始化代码
```

#### Kernel 中的打印（kernel 3.0 / 3.10）

```
[ 0.528564] DDR DEBUG: version 1.00 20150126
[ 0.528690] DDR DEBUG: Channel a:
[ 0.528701] DDR DEBUG: DDR3 Device
[ 0.528716] DDR DEBUG: Bus Width=32 Col=10 Bank=8 Row=15 CS=1 Total Capability=1024MB
...
```

kernel 3.10 还会有 DDR 变频模块的输出：

```
[ 1.473637] ddrfreq: verion 1.2 20140526
[ 1.473653] ddrfreq: normal 396MHz video_1080p 240MHz video_4k 396MHz ...
[ 1.473661] ddrfreq: auto-freq=1          // 负载变频功能是否开启
[ 1.473673] ddrfreq: auto-freq-table[0] 240MHz
[ 1.473683] ddrfreq: auto-freq-table[3] 528MHz
```

:::note 注意
kernel 3.10 以后的版本，kernel 中不再有 DDR 容量信息的打印。
:::

### 1.2 如何将 RK 给的 DDR bin 合成完整可用的 loader

1. 将 DDR bin 放在 U-Boot 工程的 `rk/rkbin/bin/对应目录/` 下
2. 删除原有的 DDR bin 文件
3. 将新的 DDR bin 改名为删除掉的名字
4. 编译 U-Boot，生成对应的 loader 文件
5. **根据 DDR bin 打印的串口信息，确认 loader 已经更新正确**

各平台 DDR bin 对应目录：

| 芯片平台 | 路径 |
| :--- | :--- |
| RK3576 | `rk/rkbin/bin/rk35/rk3576_ddr_lp4_XXXXMHz_lp5_XXXXMHz_vX.XX.bin` |
| RK3588 | `rk/rkbin/bin/rk35/rk3588_ddr_lp4_XXXXMHz_lp5_XXXXMHz_vX.XX.bin` |
| RK3568 | `rk/rkbin/bin/rk35/rk3568_ddr_XXXMHz_vX.XX.bin` |
| RK3566 | `rk/rkbin/bin/rk35/rk3566_ddr_XXXMHz_vX.XX.bin` |
| RK3562 | `rk/rkbin/bin/rk35/rk3562_ddr_XXXMHz_vX.XX.bin` |
| RK3528 | `rk/rkbin/bin/rk35/rk3528_ddr_XXXMHz_vX.XX.bin` |
| RK3399 | `rk/rkbin/bin/rk33/rk3399_ddr_XXXMHz_vX.XX.bin` |
| PX30 | `rk/rkbin/bin/rk33/px30_ddr_333MHz_vX.XX.bin` |
| RV1126 | `rk/rkbin/bin/rv11/rv1126_ddr_XXXMHz_vX.XX.bin` |
| 其他 | 按类似命名规则放在 `rk/rkbin/bin/` 目录下 |

### 1.3 DDR bin 包含 4 个频率点的平台

以下平台的 DDR bin 文件包含 4 个 DDR 频率，kernel 中只能使用这 4 个频率：

| 芯片平台 | 包含频率 (MHz) |
| :--- | :--- |
| RK3528 | 324, 528, 780, 文件名中的频率 |
| RK3562 | 324, 528, 780, 文件名中的频率 |
| RK3566 | 324, 528, 780, 文件名中的频率 |
| RK3568 | 324, 528, 780, 文件名中的频率 |
| **RK3576** LP4/LP4X | 528, 1068, 1560, 文件名中的频率 |
| **RK3576** LP5/LP5X | 534, 1320, 1968, 文件名中的频率 |
| RK3588 LP4/LP4X | 528, 1068, 1560, 文件名中的频率 |
| RK3588 LP5/LP5X | 534, 1320, 1968, 文件名中的频率 |
| RV1126 | 328, 528, 784, 文件名中的频率 |

从 loader 串口 log 中可查看 4 个频率点：

```
change to F1: 528MHz
change to F2: 1068MHz
change to F3: 1560MHz
change to F0: 2112MHz
```

也可使用 `rkbin/tools/ddrbin_tool` 读取当前 4 个频率。

### 1.4 DDR bin 特殊说明

**带 eyescan 后缀的 bin**：用于合成能获取 DDR 信号二维眼图的 Loader。
- 例：`rk3568_ddr_1560MHz_eyescan_v1.16.bin`

**带 ultra 后缀的 bin**：用于电子书超级待机，搭配电子书硬件使用。

**带 tb 后缀的 bin**：用于快速开机（如 RV1126 TPL、RV1106）。

**RK3528 搭配 PCB 使用**：
- `rk3528_ddr_1056MHz_4BIT_PCB_v1.07.bin` — 4BIT DDR 设计
- `rk3528_ddr_1056MHz_2L_PCB_v1.07.bin` — 2 层 PCB 设计

### 1.5 修改 DDR bin 文件

可通过以下工具修改 DDR bin，达到修改 DDR 初始化参数、频率、串口等功能：

- **rk_ddrBin_tool_windows**（推荐）：有界面的工具，容易上手
- **rkbin/tools/ddrbin_tool**：命令行模式，说明文档见 `rkbin/tools/ddrbin_tool_user_guide.txt`

常见修改：改 DDR 频率、改串口号、改波特率。

### 1.6 如何修改 U-Boot 中的 DDR 频率

#### RK3576 / RK3588

这些平台在 loader 初始化 DDR 时，会一起初始化 4 个 DDR 频率，默认以最高频（F0）退出 loader。

修改方法：通过"修改 DDR bin 文件"所述工具，找到 `boot_fsp` 参数，选择以 F0/F1/F2/F3 的哪个频率作为退出 loader 的频率。

### 1.7 如何 enable/disable kernel 中的 DDR 变频功能

#### Kernel 4.4 及以后版本

找到 dts 中最终的 dmc 节点，修改 status：

```dts
&dmc {
    status = "okay";     /* enable DDR 变频 */
    // status = "disabled";  /* disable DDR 变频 */
};
```

:::caution RK3576 / RK3588 注意
通过 dts dmc 节点 enable DDR 变频后，需根据实际硬件电源方案检查 DMC 节点下的 `center-supply` 和 `mem-supply` 属性：
- **RK3576** 默认：`center-supply = &lt;&vdd_ddr_s0&gt;`、`mem-supply = &lt;&vdd_logic_s0&gt;`
- **RK3588** 默认：`center-supply = &lt;&vdd_ddr_s0&gt;`、`mem-supply = &lt;&vdd_log_s0&gt;`

如果 DMC 节点缺失该属性，会导致 dmc 驱动加载失败，kernel log 如下：
```
rockchip-dmc dmc: Cannot get the regulator "center"
```
:::

:::note dfi 节点
由于早期代码，dmc 节点依赖于 dfi 节点。如果 dfi 节点为 disabled，也会导致 dmc 节点无效。建议 dfi 节点的 status 保持跟 dmc 一致。
:::

#### Kernel 3.10

找到 dts 中的 `clk_ddr_dvfs_table` 节点，修改其 status。

### 1.8 如何让 kernel 一次 DDR 变频都不运行

- **kernel 4.4 及以后版本**：只要 disable 掉 dmc 节点即可，一次 DDR 变频都不会运行
- **kernel 3.10 / 3.0**：需要额外修改代码（详见原文档 1.8 节）

### 1.9 如何查看 DDR 的容量

#### 简易方法

```bash
cat /proc/meminfo | grep MemTotal
```

MemTotal 会比 DDR 实际容量小一点，往上取到标准容量即可。

#### 详细信息

| 芯片 | loader | kernel |
| :--- | :--- | :--- |
| RK3568/RK3576/RK3588 | 有详细信息 | 没有 |
| RK3399 | 有详细信息 | 没有 |
| RK3288 | 有详细信息 | 有详细信息 |
| 其他 | 有详细信息 | 视版本而定 |

loader 中的 DDR 容量打印必须用串口才能抓到，adb 抓不到。

### 1.10 修改 DDR 容量

所有 RK 平台的 DDR 容量都是自动识别的，不需要客户配置。此处提供的方法主要用于客户评估性能或评估减少 DDR 容量的影响。

修改位置：`./arch/arm/mach-rockchip/param.c`

通过修改 `param_parse_ddr_mem` 函数中的 `bank` 数组来调整传递给 kernel 的 DDR 容量。

:::caution 注意
DRAM 容量不能随意改大，因为没有真正的储存器，系统会异常。一般都是改小，用于评估。
:::

### 1.11 查看 DDR 频率

#### 通过 devfreq（开启 DDR 变频功能时）

```bash
cat /sys/class/devfreq/dmc/cur_freq
# 输出如：780000000 （单位 Hz）
```

#### 通过 clk_summary

```bash
cat /sys/kernel/debug/clk/clk_summary | grep scmi_clk_ddr
# 或
cat /sys/kernel/debug/clk/clk_summary | grep sclk_ddrc
```

### 1.12 如何修改 DDR 频率

DDR 频率修改分两种策略：**场景变频**和**负载变频**。

#### 场景变频与负载变频的区别

**kernel 4.4 及以后版本**：
- **场景变频**：进入指定场景，若负载变频关闭，DDR 频率变到对应 `SYS_STATUS_XXX` 定义的频率；若负载变频开启，则该频率作为最低频率，再根据 DDR 利用率上下调整
- **负载变频**：所有场景都根据负载变频，但保证不低于场景定义的最低频率（SYS_STATUS_NORMAL 例外，完全被负载变频替换）

**kernel 3.10**：
- **场景变频**：进入指定场景，DDR 频率就变到对应频率，不再变化
- **负载变频**：仅替换 SYS_STATUS_NORMAL 场景

#### Kernel 4.4 的 dmc 节点配置

```dts
&dmc {
    status = "okay";
    center-supply = <&vdd_center>;

    upthreshold = <40>;        // DDR 利用率超过 40% 升频
    downdifferential = <20>;   // DDR 利用率低于 20% 降频

    system-status-freq = <
        /* system status        freq(KHz) */
        SYS_STATUS_NORMAL      800000
        SYS_STATUS_REBOOT      528000
        SYS_STATUS_SUSPEND     200000
        SYS_STATUS_VIDEO_4K    600000
        SYS_STATUS_PERFORMANCE 800000
        SYS_STATUS_ISP         600000
        /* 更多场景... */
    >;

    auto-min-freq = <200000>;  // normal 场景的最低频率
    auto-freq-en = <1>;        // 1=开启负载变频, 0=关闭
};
```

:::note dmc_opp_table
kernel 4.4 的频率电压需要匹配 `dmc_opp_table` 中的 `opp-hz`。只有频率等于 opp-hz 的才会按该频率运行；小于则向上取；超过最大值则按最大值工作。
:::

#### DDR bin 含 4 个频率点的平台（RK3576/RK3588/RK3568 等）

这些平台的 kernel dmc 驱动会自动获取 loader 提供的 4 个频率。场景中使用的是宏定义而非具体频率值：

| 宏定义 | 对应频率 | 说明 |
| :--- | :--- | :--- |
| `DMC_FREQ_LEVEL_HIGH` | F0（最高频） | 最高频 |
| `DMC_FREQ_LEVEL_MID_HIGH` | F3 | 次高频 |
| `DMC_FREQ_LEVEL_MID_LOW` | F2 | 次低频 |
| `DMC_FREQ_LEVEL_LOW` | F1 | 最低频 |

### 1.13 如何修改 DDR 某个频率对应的电压

#### 调试时临时修改（kernel 4.4+）

先对 DDR 定频，然后通过 regulator 节点调整：

```bash
cat /sys/kernel/debug/regulator/vdd_ddr_s0/voltage
echo 700000 > /sys/kernel/debug/regulator/vdd_ddr_s0/voltage
```

各平台需要调整的 regulator：

| 平台 | 调整节点 |
| :--- | :--- |
| RK3576 | vdd_logic_s0 和 vdd_ddr_s0 |
| RK3588 | vdd_log_s0 和 vdd_ddr_s0 |
| RK3399 | vdd_center |
| 其他 SOC | vdd_center 或 vdd_logic |

#### 固件中修改（kernel 4.4）

修改 dts 中 `dmc_opp_table` 节点的 `opp-microvolt`：

```dts
dmc_opp_table: opp-table3 {
    compatible = "operating-points-v2";
    opp-200000000 {
        opp-hz = /bits/ 64 <200000000>;
        opp-microvolt = <825000>;   // 修改电压，单位 uV
    };
    opp-800000000 {
        opp-hz = /bits/ 64 <800000000>;
        opp-microvolt = <900000>;
    };
};
```

### 1.14 如何关闭 DDR 的负载变频功能，只留场景变频

将 `auto-freq-en`（或 `auto-freq`）设置为 0 即可。

### 1.15 DDR 如何定频

定频常用于问题定位（如排查某个频率下是否稳定）。

#### Kernel 4.4 及以后版本

方法一：通过 userspace governor

```bash
echo userspace > /sys/class/devfreq/dmc/governor
echo 528000000 > /sys/class/devfreq/dmc/userspace/set_freq
```

方法二：关闭负载变频，只留一个场景频率

```bash
echo 0 > /sys/class/devfreq/dmc/auto_freq_enable
```

### 1.16 如何查看 DDR 带宽利用率

使用 DDR 带宽工具 `rk-msch-probe`，详见本文档第五章。

简易方法（kernel 4.4+）：

```bash
cat /sys/class/devfreq/dmc/load
```

### 1.17 如何测试 DDR 可靠性

常用工具：
- **stressapptest**（Google）：模拟实际应用场景的内存压力测试
- **memtester**：内存单元测试工具，覆盖多种测试模式
- **DDR 变频测试**：在不同频率间切换测试稳定性

详细测试方法见本文档第三章"DDR 颗粒验证流程说明"。

### 1.18 如何确定 DDR 能运行的最高频率

1. 使用 ddrbin_tool 修改 DDR bin 为目标频率
2. 合成 loader 并烧写
3. 进行 DDR 压力测试（stressapptest + memtester，12 小时以上）
4. 如测试通过，可继续提高频率；如不通过，降低频率

### 1.19 怎么判断 DDR 已进入 self-refresh（自刷新省电模式）

通过 DDR 带宽工具查看 `srex` 占比，如果接近 100% 说明处于自刷新状态。

### 1.20 怎么判断 DDR 已进入 auto power-down 省电模式

通过 DDR 带宽工具查看 `pdex` 占比。

### 1.21 如何调整 DQ、DQS、CA、CLK 的 de-skew

#### 调整 kernel 中的 de-skew

修改 dts 中 dmc 节点的相关属性，具体属性名因平台而异。

#### 调整 loader 中的 de-skew

通过 `ddrbin_tool` 工具修改 DDR bin 文件中的 de-skew 参数。

### 1.22 U-Boot 下运行 DDR 压力测试

#### stressapptest

U-Boot 下的 stressapptest 命令格式与 Linux 下类似。

#### memtester

U-Boot 下也可使用 memtester 进行内存测试。

### 1.23 RK3568 ECC 的使能

RK3568 支持 SideBand ECC（边带 ECC），即通过额外的 DDR 颗粒存放 ECC 数据。

- ECC 能力：SEC/DED（纠错 1bit，发现 2bit 错误）
- 需要额外贴一颗 ECC 颗粒，颗粒类型、Row/Col/Bank 需与 DQ0-31 颗粒一致
- 只要 DDR_ECC_DQ0-7 有贴颗粒，ECC 会自动 enable

### 1.24 如何在 kernel 获取 DDR ECC 的信息

通过 debugfs 节点获取 ECC 统计信息，具体节点路径因平台而异。

### 1.25 如何在 kernel 里软件注入 DDR ECC 错误

通过相应的 debugfs 节点或 sysfs 节点注入 ECC 错误，用于验证 ECC 功能。

### 1.26 如何查看 DDR 厂商 ID

#### 通过 kernel 的 dmcdbg 节点

```bash
cat /sys/kernel/debug/dmc/dmcdbg
```

#### 通过 loader 输出信息

loader 初始化 DDR 时会打印厂商 ID 信息，需通过串口抓取。

#### 厂商 ID 对照表

LPDDR4/LPDDR5 的厂商 ID 对照表请参考原文档。常见厂商：
- 三星（Samsung）
- 海力士（SK Hynix）
- 美光（Micron）

### 1.27 常见信号相关问题

#### tINIT3 不满足协议

DDR 初始化时序问题，需要检查硬件设计或调整 DDR 初始化参数。

#### 颗粒 ODT 开启注意事项

ODT（On-Die Termination）的开启需要根据硬件设计和颗粒规格合理配置，不正确的 ODT 设置会影响信号质量。

### 1.28 高温刷新率（refresh rate）问题

高温下 DDR 漏电流增加，数据保持时间缩短，可能需要提高刷新率。一般 DDR 规格书会定义高温时的刷新要求。

---

## 二、DDR 问题排查手册

### 2.1 怎么确认是不是 DDR 问题

DDR 问题的常见表现：
- 系统随机死机、重启
- 运行内存测试工具（memtester/stressapptest）报错
- 特定负载下（如高带宽应用）出现异常
- 高低温下出现不稳定现象

排查方法：
1. 使用 memtester 和 stressapptest 测试内存
2. DDR 定频到较低频率后看是否复现
3. 提高 DDR 电压后看是否复现
4. 查看是否有 ECC 错误（如支持 ECC）

### 2.2 引起 DDR 问题的几个主要原因

| 类别 | 具体原因 |
| :--- | :--- |
| **硬件设计** | PCB 布线（长度匹配、阻抗控制）、电源完整性、接地设计 |
| **焊接问题** | 虚焊、短路、焊接不良 |
| **颗粒问题** | 颗粒本身质量、兼容性问题 |
| **时序参数** | DDR 训练参数不合理、de-skew 不正确 |
| **电源问题** | DDR 电源纹波过大、电压不足、电压动态响应差 |
| **软件配置** | 频率过高、电压不足、驱动配置错误 |
| **信号质量** | 反射、串扰、ISI 等信号完整性问题 |
| **温度** | 高温下时序裕量不足、漏电流增大 |

### 2.3 解决 DDR 问题的一些手段

1. **降低 DDR 频率**：如果降低频率后问题消失，说明是频率相关的问题
2. **提高 DDR 电压**：适当提高电压可增加时序裕量
3. **调整时序参数**：通过 ddrbin_tool 或软件调整 de-skew、training 参数
4. **DDR 眼图测试**：使用 DQ 眼图工具评估信号质量
5. **硬件检查**：检查焊接、电源纹波、阻抗等
6. **颗粒更换**：确认是否为颗粒兼容性问题

---

## 三、DDR 颗粒验证流程说明

### 3.1 总体验证项目

DDR 颗粒验证通常包含以下项目：
1. **确认容量正确** — 验证 DDR 容量与设计一致
2. **定频拷机** — 在最高频率下长时间运行压力测试
3. **变频拷机** — 在不同频率间切换测试稳定性
4. **reboot 拷机** — 反复重启测试初始化可靠性
5. **sleep 拷机** — 休眠唤醒测试（部分平台）

**测试时间要求**：每项 12 小时以上。

**测试工具**：
- `stressapptest`：Google 内存压力测试工具
- `memtester`：内存单元测试工具

### 3.2 Linux 4.xx DDR 颗粒验证流程

#### 测试固件编译

使能 DDR 变频功能：

```dts
&dfi {
    status = "okay";
};

&dmc {
    status = "okay";
    // ...
};
```

#### 测试环境搭建

1. 烧写固件
2. 安装测试工具（stressapptest、memtester、ddr_freq_scan.sh）
3. （Android）安装捕鱼达人 APK 或其他持续运行的应用

#### 确认颗粒容量

```bash
cat /proc/meminfo | grep MemTotal
```

参考值（略有偏差属正常）：
- 512MB ≈ 533504 kB
- 1GB ≈ 1048576 kB
- 2GB ≈ 2097152 kB
- 4GB ≈ 4194304 kB

#### 定频拷机

```bash
# 定频到目标频率
/data/ddr_freq_scan.sh 800000000

# stressapptest 测试（12 小时，申请 1/8 总内存）
/data/stressapptest -s 43200 -i 4 -C 4 -W --stop_on_errors -M 128

# memtester 测试
/data/memtester 128m
```

**stressapptest 结果判断**：
- 通过：`Status: PASS - please verify no corrected errors`
- 失败：`Status: FAIL - test discovered HW problems`

**memtester 结果判断**：
- 正常运行：持续打印各测试项 `ok`
- 出错：自动停止并打印 `FAILURE`

#### 变频拷机

```bash
# 后台运行 memtester
/data/memtester 128m > /data/memtester_log.txt &

# 运行变频脚本
/data/ddr_freq_scan.sh
```

测试期间屏幕可能因带宽不足出现闪烁，属正常现象。

#### reboot 拷机

- **Android**：开启计算器，输入 `83991906=`，点击 RebootTest
- **非 Android**：使用 `rockchip_test.sh` 脚本进行 auto reboot test

#### sleep 拷机

- **Android**：拔掉 USB 线，计算器中点击 SleepTest
- **非 Android**：使用 `rockchip_test.sh` 脚本的 suspend_resume test

---

## 四、Rockchip DDR DQ 眼图工具指南

### 4.1 二维眼图的获取

#### 支持的平台

RK3528、RK3562、RK3566、RK3568、RK3588、**RK3576**

#### 使用方法

1. 使用带 `eyescan` 后缀的 DDR bin 合成 Loader
2. 进入 maskrom 状态，通过下载工具下载 loader 到板子
3. 结果通过串口输出
4. loader 扫描完 2D 眼图后会自动停下（下载会提示失败）

:::caution 注意
使用 eyescan 的 loader 开机无法正常进入系统。测试完成后需要烧写普通 loader 恢复。
:::

#### 输出结果分析

- 每个 step 单位在 log 最开始处打印（单位 fs，即 0.001ps）
- `margin: rx:22-8,tx:26-32` 表示读/写方向 setup/hold time 的最小 margin 要求
- 眼图中 `*` 为有效相位点，`+` 为默认采样点，`-` 为无效相位点
- `o` 表示实际眼图压到了最小 margin 范围内，存在风险
- 最终结果：`all result: pass` 或 `all result: err`

### 4.2 一维眼图的获取

能用二维眼图的平台尽量用二维眼图（多了 vref 维度）。

#### 支持的平台

RV1109、RV1126、RK3566、RK3568、RK3528、RK3562

#### 使用方法

1. 更新 DDR bin 到对应版本（RV1126 ≥ V1.09，RK3568/66 ≥ V1.07）
2. U-Boot menuconfig 中开启 `Enable ddr test tool`
3. 编译并烧写 U-Boot
4. 开机时长按 Ctrl+C 停留在 U-Boot
5. 输入命令：

```bash
ddr_dq_eye <DDR frequency in MHz>
# 例：ddr_dq_eye 1056
# 留空默认为最高频率
```

### 4.3 DDR DQ 最小眼宽限制

满足最小眼宽限制说明 DDR DQ 眼宽大小较为可靠，但不代表 DDR 设计一定没有其他问题，还需根据实际使用需求做进一步可靠性测试。

各平台的最小眼宽限制值请参考原文档对应表格。

---

## 五、Rockchip DDR 带宽工具使用说明

### 5.1 工具获取

工具名：`rk-msch-probe_vx.xx`

### 5.2 平台支持

支持 RK 全系列主要平台，使用 `-h` 查看支持列表。

### 5.3 参数说明

| 参数 | 说明 |
| :--- | :--- |
| `-c chip_name` | 芯片名称，如 rk3568、rk3576 |
| `-d msecs` | 监视间隔时间，单位 ms，默认 1000ms |
| `-f freq` | 当前 DDR 频率，单位 MHz（可选，工具会自动获取） |
| `-t test_loop` | 指定测试轮次，到达后退出，默认无限次数 |
| `-h` | 帮助信息 |

### 5.4 使用条件

DDR devfreq 的策略不能是 `dmc_ondemand`，建议切换到 `userspace`：

```bash
echo userspace > /sys/class/devfreq/dmc/governor
echo 780000000 > /sys/class/devfreq/dmc/userspace/set_freq
```

### 5.5 打印说明

```
V1.06_20200629
ddr freq: 928Mhz
CH0: ddr monitor statistics:
ddr load = 3251.23MB/s(43.76%)
  [RD:1859.93MB/s(25.03%), WR:1391.30MB/s(18.72%),
   ACT: 3.34, srex:0.54%, pdex:1.27%, clkstp:0.00%, lp:1.81%]
```

主要统计项说明：

| 打印项 | 说明 |
| :--- | :--- |
| LOAD / load | DDR 总带宽及占比 |
| RD | Read 数据带宽及占比 |
| WR | Write 数据带宽及占比 |
| ACT (access : active) | 每个 active 命令后的读写次数，越大说明访问越连续 |
| srex | self-refresh 状态时间占比 |
| pdex | power down 状态时间占比 |
| clkstp | clock stop 状态时间占比 |
| lp / LOW POWER | 低功耗状态总时间占比 |

### 5.6 FAQ

**Q：提示 open /dev/mem error？**

A：kernel 没有打开 `CONFIG_DEVMEM` 宏。需要在 config 中添加 `CONFIG_DEVMEM=y` 或在 menuconfig 中打开 `/dev/mem virtual device support`。

---

## 六、HAL DDR ECC（仅 HAL 系统）

&gt; 本章仅适用于带有 HAL 的系统，不适用于 Linux 系统。

### 6.1 名词解释

| 缩写 | 全称 | 说明 |
| :--- | :--- | :--- |
| ECC | Error Correcting Code | 错误校验与纠正码 |
| SEC ECC | Single Error Correction | 单 bit 可纠正错误（CE） |
| DED ECC | Double Error Detection | 双 bit 可检测不可纠正错误（UE） |
| CE | Correctable Error | 可纠正错误 |
| UE | Uncorrectable Error | 不可纠正错误 |

### 6.2 简介

DDR ECC 对 DDR 数据进行错误检查和纠正。RK3568 支持 SideBand ECC，即在 DDR 数据通道旁增加一个专门存放 ECC 数据的 DDR 通道。

ECC 能力：SEC/DED（纠错 1bit，检测 2bit 错误）。

### 6.3 开启 DDR ECC

1. 只要 DDR_ECC_DQ0-7 有贴颗粒，ECC 会自动 enable
2. ECC 是 32bit DQ 数据 + 7bit ECC 数据，需要多贴一颗存放 ECC 数据的颗粒
3. ECC 颗粒要求：颗粒类型、Row/Col/Bank 与 DQ0-31 颗粒一致
4. 所有颗粒类型均支持 ECC

### 6.4 HAL 中获取 DDR ECC 信息

#### 配置

在 `hal_conf.h` 中使能：

```c
#define HAL_DDR_ECC_MODULE_ENABLED
```

#### 主要 API

```c
/* 初始化 DDR ECC 相关信息 */
HAL_Status HAL_DDR_ECC_Init(struct DDR_ECC_CNT *p);

/* 获取 DDR ECC 累计统计信息（CE 和 UE 数量） */
HAL_Status HAL_DDR_ECC_GetInfo(struct DDR_ECC_CNT *p);
```

#### 使用方式

- **软件轮询**：定期调用 `HAL_DDR_ECC_GetInfo` 获取统计信息
- **硬件中断**：挂载 CE/UE 中断服务子程序，出错时立即获取信息

错误信息输出示例：
```
[HAL WARNING] DDR ECC error: CE, 2 errors, the last is in DDR cs 0,
  Row 0xa0, ChipID 0x0, BankGroup 0x0, Bank 0x5, Col 0x318, Bit position 0x10000000
```

### 6.5 DDR ECC 错误注入

用于验证 DDR ECC 功能。开启错误注入后，对特定物理地址的写操作将触发 DDR ECC CE/UE。

主要 API：
- `HAL_DDR_ECC_PoisonEnable` — 开启错误注入
- `HAL_DDR_ECC_PoisonDisable` — 关闭错误注入

默认注入 CE（单 bit），可修改为 UE（双 bit）。

### 6.6 Note

1. DDR ECC 会使用 `[0x100000, 0x1F0000]` 的 DDR 空间，若未映射 MMU 需添加映射
2. 错误注入的物理地址空间在 HAL 中可能未映射，需增加映射
3. DDR ECC UE 会触发 CPU data abort 异常，HAL 默认无处理

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_DDR_CN.pdf` V2.5.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
