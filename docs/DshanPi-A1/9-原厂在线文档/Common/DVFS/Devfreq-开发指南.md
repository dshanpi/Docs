---
sidebar_position: 2
---

# Devfreq 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Devfreq_CN.pdf`（V1.1.1, 2021-01-21）整理，介绍 Rockchip 平台 Devfreq（设备动态调频调压）的概念、配置方法和用户态接口。

:::info 适用范围
- **芯片平台**：所有 Rockchip 芯片
- **内核版本**：Kernel 4.4 / Kernel 4.19
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

Devfreq 是 Linux 内核定义的一套框架，用于除 CPU 外其他需要动态调频调压的设备模块（如 GPU、DDR、BUS 等）。与 CPUFreq 类似，根据 governor 动态调整频率和电压，降低功耗的同时兼顾性能。

### 1.1 Devfreq 框架组成

| 组件 | 说明 |
| :--- | :--- |
| **Governor** | 调频策略，决定频率 |
| **Core** | 封装抽象 governor 和 driver |
| **Driver** | 初始化设备频率电压表，设置具体频率 |
| **Event** | 监控设备负载信息 |

### 1.2 Governor 种类

| Governor | 说明 |
| :--- | :--- |
| **simple ondemand** | 根据负载动态调频 |
| **userspace** | 用户态控制频率 |
| **powersave** | 功耗优先，始终最低频 |
| **performance** | 性能优先，始终最高频 |
| **dmc ondemand** | simple ondemand 基础上增加场景变频，DDR 变频专用 |

---

## 二、代码路径

### Governor 相关

```
drivers/devfreq/governor_simpleondemand.c
drivers/devfreq/governor_performance.c
drivers/devfreq/governor_powersave.c
drivers/devfreq/governor_userspace.c
```

### Event 相关

```
drivers/devfreq/devfreq-event.c
drivers/devfreq/event/rockchip-dfi.c       # 监控 DDR 读写 cycle 数
drivers/devfreq/event/rockchip-nocp.c      # 监控各模块访问 DDR 的字节数
```

### Core 相关

```
drivers/devfreq/devfreq.c
```

### Driver 相关

```
drivers/devfreq/rockchip_dmc.c          # DMC driver + dmc ondemand governor
drivers/gpu/arm/midgard/backend/gpu/mali_kbase_devfreq.c    # Mali Midgard GPU
drivers/gpu/arm/bifrost/.../mali_kbase_devfreq.c            # Mali Bifrost GPU
drivers/gpu/arm/mali400/mali/linux/mali_devfreq.c           # Mali400 GPU
drivers/devfreq/rockchip_bus.c          # Bus devfreq driver
drivers/soc/rockchip/rockchip_opp_select.c   # 电压调整接口
```

---

## 三、Menuconfig 配置

```
Device Drivers --->
  [*] Generic Dynamic Voltage and Frequency Scaling (DVFS) support --->
    *** DEVFREQ Governors ***
    -*- Simple Ondemand
    <*> Performance
    <*> Powersave
    *** DEVFREQ Drivers ***
    <*> ARM ROCKCHIP BUS DEVFREQ Driver
    <*> ARM ROCKCHIP DMC DEVFREQ Driver
    [*] DEVFREQ-Event device Support --->
      -*- ROCKCHIP DFI DEVFREQ event Driver
      <*> ROCKCHIP NoC Probe DEVFREQ event Driver
```

---

## 四、Device Tree 配置方法

### 4.1 GPU DVFS 配置

#### 4.1.1 Clock 配置

在 GPU 节点下增加 `clocks` 和 `clock-names` 属性：

```dts
gpu: gpu@ff9a0000 {
    compatible = "arm,malit860", ...;
    ...
    clocks = <&cru ACLK_GPU>;
    clock-names = "clk_mali";
    ...
};
```

#### 4.1.2 Regulator 配置

在 GPU 节点下增加 `mali-supply` 属性：

```dts
&gpu {
    status = "okay";
    mali-supply = <&vdd_gpu>;
};
```

#### 4.1.3 OPP Table 配置

##### 增加 OPP Table

```dts
&gpu {
    operating-points-v2 = <&gpu_opp_table>;
};

gpu_opp_table: opp-table2 {
    compatible = "operating-points-v2";

    opp-200000000 {
        opp-hz = /bits/ 64 <200000000>;    // 单位 Hz
        opp-microvolt = <800000>;          // 单位 uV
    };
    ...
    opp-800000000 {
        opp-hz = /bits/ 64 <800000000>;
        opp-microvolt = <1100000>;
    };
};
```

##### 删除 OPP

方法一：在 OPP 节点内禁用：
```dts
opp-800000000 {
    opp-hz = /bits/ 64 <800000000>;
    opp-microvolt = <1100000>;
    status = "disabled";
};
```

方法二：在板级 DTS 中引用后禁用：
```dts
&gpu_opp_table {
    opp-800000000 {
        status = "disabled";
    };
};
```

#### 4.1.4 根据 leakage 调整 OPP Table

##### 根据 leakage 调整电压

根据芯片实际漏电值自动调整电压。

#### 4.1.5 根据 PVTM 调整 OPP Table

##### 根据 PVTM 调整电压

PVTM 监测工艺/电压/温度，动态调整。

#### 4.1.6 根据 IR-Drop 调整 OPP Table

考虑电源压降。

#### 4.1.7 宽温配置

支持高低温下的稳定运行。

#### 4.1.8 升降频负载配置

配置 governor 升频/降频的负载阈值。

### 4.2 DMC DVFS 配置

#### 4.2.1 Clock 配置
#### 4.2.2 Regulator 配置
#### 4.2.3 OPP Table 配置

##### 增加 OPP Table
##### 删除 OPP

#### 4.2.4 根据 leakage 调整 OPP Table
#### 4.2.5 根据 PVTM 调整 OPP Table
#### 4.2.6 根据 IR-Drop 调整 OPP Table

#### 4.2.7 场景变频配置

DMC 支持根据不同使用场景（如播放视频、待机等）设置不同的 DDR 频率。

#### 4.2.8 负载变频配置

根据 DDR 实际访问负载动态调整频率。

#### 4.2.9 根据 VOP 带宽变频

根据显示通路（VOP）所需的带宽动态调整 DDR 频率，确保显示流畅。

### 4.3 BUS DVFS 配置

#### 4.3.1 PLL DVFS 配置

BUS 总线频率动态调整。

---

## 五、用户态接口介绍

Devfreq 在 sysfs 中的接口：

```
/sys/class/devfreq/
  ├── devfreq0/                 # 第一个 devfreq 设备（如 DMC）
  │   ├── available_governors   # 可用 governor
  │   ├── governor              # 当前 governor
  │   ├── cur_freq              # 当前频率
  │   ├── min_freq              # 最小频率
  │   ├── max_freq              # 最大频率
  │   ├── target_freq           # 目标频率
  │   ├── stats/                # 统计信息
  │   │   ├── time_in_state     # 各频率停留时间
  │   │   └── total_trans       # 变频总次数
  │   └── ...
  ├── devfreq1/                 # 第二个 devfreq 设备（如 GPU）
  └── ...
```

---

## 六、常见问题

### 6.1 如何查看频率电压表

```bash
cat /sys/class/devfreq/devfreq0/available_frequencies
```

### 6.2 如何定频

```bash
# 设置为 performance governor（固定最高频）
echo performance > /sys/class/devfreq/devfreq0/governor

# 设置为 userspace 并指定频率
echo userspace > /sys/class/devfreq/devfreq0/governor
echo <freq> > /sys/class/devfreq/devfreq0/target_freq

# 限制调频范围
echo <min_freq> > /sys/class/devfreq/devfreq0/min_freq
echo <max_freq> > /sys/class/devfreq/devfreq0/max_freq
```

### 6.3 如何查看当前频率

```bash
cat /sys/class/devfreq/devfreq0/cur_freq
```

### 6.4 如何查看当前电压

查看对应 regulator 的电压：
```bash
cat /sys/class/regulator/regulator.x/microvolts
```

### 6.5 如何单独调频调压

userspace 模式下通过 sysfs 接口设置。

### 6.6 如何查看当前电压的档位

查看 regulator 信息。

### 6.7 如何查看 leakage

```bash
cat /sys/devices/platform/rockchip-opp-sel/gpu-leakage
# 或 dmc-leakage
```

### 6.8 如何修改电压

修改 DTS 中 OPP 节点的 `opp-microvolt` 属性。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Devfreq_CN.pdf` V1.1.1
- 《Rockchip_Developer_Guide_CPUFreq_CN.pdf》
- 《Documentation/devicetree/bindings/opp/opp.txt》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
