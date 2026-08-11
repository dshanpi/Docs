---
sidebar_position: 1
---

# CPUFreq 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_CPUFreq_CN.pdf`（V1.1.1, 2021-02-25）整理，介绍 Rockchip 平台 CPUFreq（CPU 动态调频调压）的概念、配置方法和用户态接口。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：Kernel 4.4 / Kernel 4.19
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

CPUFreq 是 Linux 内核定义的一套框架，支持根据指定的 **governor（调频策略）** 动态调整 CPU 频率和电压，有效降低 CPU 功耗的同时兼顾性能。

### 1.1 CPUFreq 框架组成

| 组件 | 说明 |
| :--- | :--- |
| **Governor** | 调频策略，根据系统负载决定 CPU 频率 |
| **Core** | 封装抽象 governor 和 driver，定义接口 |
| **Driver** | 初始化 CPU 频率电压表，设置具体频率 |
| **Stats** | 提供 cpufreq 统计信息 |

### 1.2 Governor 种类

| Governor | 说明 |
| :--- | :--- |
| **conservative** | 根据负载动态调频，按比例平滑升降 |
| **ondemand** | 根据负载动态调频，幅度大，可直接跳到最高/最低 |
| **interactive** | 响应更快，可配置参数更多更灵活 |
| **userspace** | 提供用户态接口，由应用程序调整频率 |
| **powersave** | 功耗优先，始终保持最低频率 |
| **performance** | 性能优先，始终保持最高频率 |
| **schedutil** | EAS 使用的 governor，结合能耗感知调度 |

**EAS（Energy Aware Scheduling）**：新一代任务调度策略，结合 CPUFreq 和 CPUIdle，在调度任务时同时考虑性能和功耗，保证系统能耗最低。

---

## 二、代码路径

### Governor 相关

```
drivers/cpufreq/cpufreq_conservative.c
drivers/cpufreq/cpufreq_ondemand.c
drivers/cpufreq/cpufreq_interactive.c
drivers/cpufreq/cpufreq_userspace.c
drivers/cpufreq/cpufreq_performance.c
kernel/sched/cpufreq_schedutil.c
```

### Stats 相关

```
drivers/cpufreq/cpufreq_stats.c
```

### Core 相关

```
drivers/cpufreq/cpufreq.c
```

### Driver 相关

```
drivers/cpufreq/cpufreq-dt.c              /* platform driver */
drivers/cpufreq/rockchip-cpufreq.c       /* platform device */
drivers/soc/rockchip/rockchip_opp_select.c  /* 电压调整接口 */
```

---

## 三、配置方法

### 3.1 Menuconfig 配置

```
CPU Power Management --->
  CPU Frequency scaling --->
    [*] CPU Frequency scaling
    <*> CPU frequency translation statistics
    [*] CPU frequency time-in-state statistics
    Default CPUFreq governor (interactive) --->   /* 选择默认 governor */
    <*> 'performance' governor
    <*> 'powersave' governor
    <*> 'userspace' governor for userspace frequency scaling
    <*> 'ondemand' cpufreq policy governor
    -*- 'interactive' cpufreq policy governor
    <*> 'conservative' cpufreq governor
    [ ] 'schedutil' cpufreq policy governor
    *** CPU frequency scaling drivers ***
    <*> Generic DT based cpufreq driver
    <*> Rockchip CPUfreq driver
```

:::tip
通过 "Default CPUFreq governor" 选择默认变频策略，可根据产品需求修改。
:::

### 3.2 Clock 配置

在 CPU 节点下增加 `clocks` 属性（一般在 DTSI 文件中）。

**非大小核平台**（RK3326 / RK3328 等）：
```dts
cpu0: cpu@0 {
    device_type = "cpu";
    compatible = "arm,cortex-a53", "arm,armv8";
    ...
    clocks = <&cru ARMCLK>;
};
```

**大小核平台**（RK3368 / RK3399 等）：
```dts
cpu_l0: cpu@0 { ... clocks = <&cru ARMCLKL>; };  // 小核
cpu_b0: cpu@100 { ... clocks = <&cru ARMCLKB>; }; // 大核
```

:::caution 注意
如果 clock 没有配置，CPUFreq 驱动加载失败：
```
cpu cpu0: failed to get clock: -2
cpufreq-dt: probe of cpufreq-dt failed with error -2
```
:::

### 3.3 Regulator 配置

在 CPU 节点下增加 `cpu-supply` 属性（一般在板级 DTS 中）。

**非大小核平台**：
```dts
&cpu0 {
    cpu-supply = <&vdd_arm>;
};
```

**大小核平台**：
```dts
&cpu_l0 { cpu-supply = <&vdd_cpu_l>; };
&cpu_l1 { cpu-supply = <&vdd_cpu_l>; };
&cpu_l2 { cpu-supply = <&vdd_cpu_l>; };
&cpu_l3 { cpu-supply = <&vdd_cpu_l>; };
&cpu_b0 { cpu-supply = <&vdd_cpu_b>; };
&cpu_b1 { cpu-supply = <&vdd_cpu_b>; };
```

:::caution 注意
如果 regulator 没有配置，cpufreq 驱动仍可加载，但**只调频不调压**。高频时可能因电压偏低导致死机。
:::

### 3.4 OPP Table 配置

OPP（Operating Performance Points）Table 定义了频率-电压对应关系，配置在 DTS 中。

#### 3.4.1 增加 OPP Table

```dts
cpu0: cpu@0 {
    ...
    operating-points-v2 = <&cpu0_opp_table>;
};

cpu0_opp_table: opp_table0 {
    compatible = "operating-points-v2";
    opp-shared;                           // 多个 CPU 共用

    rockchip,avs-scale = <13>;           // 最高频率转换因子

    opp-408000000 {
        opp-hz = /bits/ 64 <408000000>;  // 频率，单位 Hz
        opp-microvolt = <950000 950000 1350000>; // 电压 <target min max>, 单位 uV
        clock-latency-ns = <40000>;      // 变频需要的时间，单位 ns
        opp-suspend;                      // 休眠时使用的频点
    };
    // 更多 OPP 节点...
};
```

**rockchip,avs-scale：** 频点转换因子，转换成频率后表示平台支持的最高频率，超过该频率的 OPP 会被删除。用于防止误填不支持的高频。

#### 3.4.2 删除 OPP

方法一：在 OPP 节点中直接禁用：
```dts
opp-1512000000 {
    opp-hz = /bits/ 64 <1512000000>;
    opp-microvolt = <1350000>;
    status = "disabled";
};
```

方法二：在板级 DTS 中引用后禁用：
```dts
&cpu0_opp_table {
    opp-1512000000 {
        status = "disabled";
    };
};
```

### 3.5 根据 leakage 调整 OPP Table

#### 3.5.1 根据 leakage 调整电压

芯片 leakage（漏电）不同，相同频率所需电压不同。驱动可根据芯片实际 leakage 值自动调整 OPP 电压。

### 3.6 根据 PVTM 调整 OPP Table

#### 3.6.1 根据 PVTM 调整电压

PVTM（Process Voltage Temperature Monitor）监测芯片工艺、电压、温度，动态调整电压。

### 3.7 根据 IR-Drop 调整 OPP Table

考虑电源网络压降（IR Drop）对实际电压的影响，调整 OPP 电压值。

### 3.8 宽温配置

支持在宽温度范围下的 OPP 配置，确保高低温下的稳定性。

---

## 四、用户态接口介绍

CPUFreq 在 sysfs 中提供丰富的调试和控制接口：

```
/sys/devices/system/cpu/cpufreq/
/sys/devices/system/cpu/cpu0/cpufreq/
  ├── scaling_available_governors   # 可用 governor 列表
  ├── scaling_governor             # 当前 governor
  ├── scaling_available_frequencies # 可用频率列表
  ├── scaling_cur_freq             # 当前频率
  ├── scaling_min_freq             # 调频下限
  ├── scaling_max_freq             # 调频上限
  ├── scaling_setspeed             # userspace 模式下设置频率
  ├── cpuinfo_cur_freq             # 硬件当前频率
  ├── stats/                       # 统计信息
  │   ├── time_in_state            # 各频率停留时间
  │   └── total_trans              # 变频总次数
  └── ...
```

---

## 五、常见问题

### 5.1 各平台 CPU 的最高频率

参考对应芯片的 datasheet 或 DTS 中的 OPP Table。

### 5.2 如何查看频率电压表

```bash
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_frequencies
```

### 5.3 如何修改电压

修改 DTS 中 OPP 节点的 `opp-microvolt` 属性。

### 5.4 如何定频

```bash
# 方法 1：设置 governor 为 performance（固定最高频）
echo performance > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# 方法 2：userspace 模式指定频率
echo userspace > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
echo 1008000 > /sys/devices/system/cpu/cpu0/cpufreq/scaling_setspeed

# 方法 3：限制调频范围
echo 816000 > /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq
echo 816000 > /sys/devices/system/cpu/cpu0/cpufreq/scaling_min_freq
```

### 5.5 如何查看当前频率

```bash
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq   # 软件当前频率
cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_cur_freq   # 硬件实际频率
```

### 5.6 如何查看当前电压

```bash
cat /sys/class/regulator/regulator.x/microvolts
```

### 5.7 如何单独调频调压

```bash
# userspace 模式下可单独设置频率
echo userspace > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
echo <freq> > /sys/devices/system/cpu/cpu0/cpufreq/scaling_setspeed
```

### 5.8 如何查看当前电压的档位

查看 regulator 的电压档位信息。

### 5.9 如何查看 leakage

```bash
cat /sys/devices/platform/rockchip-opp-sel/cpu-leakage
```

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_CPUFreq_CN.pdf` V1.1.1
- 《Documentation/devicetree/bindings/opp/opp.txt》
- 《Documentation/power/opp.txt》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
