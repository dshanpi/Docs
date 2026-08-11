---
sidebar_position: 1
---

# PWM 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_PWM_CN.pdf`（V3.2.0, 2024-08-13）整理，介绍 Rockchip 平台 PWM（脉宽调制）的基本特性、使用方法和常见问题分析。

:::info 适用范围
- **芯片平台**：RK3036 / RK312X / RK3288 / RK3308 / RK3399 / RK1808 / RV1126 / RK356X / RK3588 / RV1103 / RK3528 / RK3562 / RK3576 / RK3506 等
- **内核版本**：Linux 4.4 及以上
- **读者对象**：技术支持工程师、软件开发工程师、硬件开发工程师
:::

---

## 软件驱动

### Kernel 驱动

#### 驱动目录

| 内核版本 | 驱动文件 |
| :--- | :--- |
| Linux 5.10 及以下 | `drivers/pwm/pwm-rockchip.c` |
| Linux 6.1 及以上 | `drivers/pwm/pwm-rockchip.c` + `drivers/pwm/pwm-rockchip-test.c` |

PWM 驱动版本说明：
- Linux 6.1 开始支持 **PWM v4** 驱动
- Linux 5.10 及以下支持 PWM v1-v3，共用 v1 接口（统称 PWM v1）
- Linux 6.1 新增了 test 驱动用于测试和定位问题，需开启 `CONFIG_PWM_ROCKCHIP_TEST`

#### DTS 配置

PWM 节点通常被其他驱动引用，以背光驱动为例：

**PWM v1**：

```dts
backlight: backlight {
    compatible = "pwm-backlight";
    pwms = <&pwm5 0 25000 0>;
    ......
};
```

**PWM v4**：

```dts
backlight: backlight {
    compatible = "pwm-backlight";
    pwms = <&pwm1_6ch_1 0 25000 0>;
    ......
};
```

**节点命名说明**：

| 版本 | 命名格式 | 说明 |
| :--- | :--- | :--- |
| PWM v1 | `pwmX` | 控制器 id = X / 4，通道 id = X % 4 |
| PWM v4 | `pwmX_Ych_Z` | X = 控制器 id，Y = 通道总数，Z = 通道 id |

**pwms 参数说明**（`#pwm-cells = &lt;3&gt;`）：

| 参数 | 说明 |
| :--- | :--- |
| 参数 1（index） | 值固定为 0。Rockchip 每个 PWM channel 对应一个 PWM device |
| 参数 2（period） | PWM 输出波形周期，单位 ns。例如 25000 ns = 40KHz |
| 参数 3（polarity） | 极性，可选。默认为 0，翻转极性配为 `PWM_POLARITY_INVERTED` |

---

## 功能支持

各芯片平台 PWM 版本及功能支持：

| SOC | PWM 版本 | continous | oneshot | capture | global control | output offset | counter | frequency meter | IR output | IR input | wave generator | biphasic counter |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RK3036 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| RK312X/PX3SE | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| RK3288 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| RK3308 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK3326/PX30 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK3399 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| RK1808 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RV1109/RV1126 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK356X | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK3588 | v2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RV1103/RV1106 | v3 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK3528 | v3 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK3562 | v3 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| RK3576 | v4 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| RV1103B | v4 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| RK3506 | v4 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 应用说明

PWM 框架标准接口参考 `include/linux/pwm.h` 和 `drivers/pwm/core.c`。

PWM v4 特有的功能（frequency meter、counter、wave generator 等）需要引用头文件：

```c
#include <linux/pwm-rockchip.h>
```

也可以参考 demo 驱动 `drivers/pwm/pwm-rockchip-test.c`。

### Kernel driver

#### Continuous（连续输出模式）

持续输出指定占空比的 PWM 波形。

```c
pwm_get_state(pdev, &state);
state.period = period;
state.duty_cycle = duty;
state.polarity = polarity;
state.enabled = enable;
pwm_apply_state(pdev, &state);
```

#### Oneshot（单次输出模式）

输出指定个数的 PWM 波形。需开启 `CONFIG_PWM_ROCKCHIP_ONESHOT`。

```c
pwm_get_state(pdev, &state);
state.period = period;
state.duty_cycle = duty;
state.duty_offset = duty_offset;
state.polarity = polarity;
state.oneshot_count = rpt_first;
state.oneshot_repeat = rpt_second;
pwm_apply_state(pdev, &state);
```

参数说明：
- `oneshot_count`：输出波形个数
- `oneshot_repeat`：（PWM v4）重复次数，实际输出个数 = `oneshot_repeat × oneshot_count`

Oneshot 模式输出结束后会产生中断，可在 `drivers/pwm/pwm-rockchip-irq-callbacks.h` 中添加回调逻辑：

```c
static void rockchip_pwm_oneshot_callback(struct pwm_device *pwm, struct pwm_state *state)
{
    /* 按需添加处理逻辑 */
}
```

#### Capture（输入捕获模式）

计算输入波形高低电平的持续时间。

```c
pwm_capture(pdev, &cap_res, timeout_ms);
```

结果结构体：

```c
struct pwm_capture {
    unsigned int period;      // 周期（ns）
    unsigned int duty_cycle;  // 占空比（ns）
};
```

#### Global control（全局控制）

多通道配置同步更新，结合 continuous/oneshot 模式可实现输出同步、互补输出等功能。

```c
// 加入全局控制组
rockchip_pwm_global_ctrl(pdev0, PWM_GLOBAL_CTRL_JOIN);
rockchip_pwm_global_ctrl(pdev1, PWM_GLOBAL_CTRL_JOIN);

// 授权一个通道获得全局控制权限
rockchip_pwm_global_ctrl(pdev0, PWM_GLOBAL_CTRL_GRANT);

// 各通道更新配置（pwm_apply_state）
...

// 一次性更新组内所有通道配置
rockchip_pwm_global_ctrl(pdev0, PWM_GLOBAL_CTRL_UPDATE);

// 使能组内所有通道
rockchip_pwm_global_ctrl(pdev0, PWM_GLOBAL_CTRL_ENABLE);

// 回收全局控制权限
rockchip_pwm_global_ctrl(pdev0, PWM_GLOBAL_CTRL_RECLAIM);

// 退出全局控制组
rockchip_pwm_global_ctrl(pdev0, PWM_GLOBAL_CTRL_EXIT);
```

各指令说明：

| 指令 | 说明 |
| :--- | :--- |
| `PWM_GLOBAL_CTRL_JOIN` | 加入全局控制组 |
| `PWM_GLOBAL_CTRL_EXIT` | 退出全局控制组 |
| `PWM_GLOBAL_CTRL_GRANT` | 获取全局控制权限 |
| `PWM_GLOBAL_CTRL_RECLAIM` | 回收全局控制权限 |
| `PWM_GLOBAL_CTRL_UPDATE` | 更新组内所有通道配置 |
| `PWM_GLOBAL_CTRL_ENABLE` | 使能组内所有通道 |
| `PWM_GLOBAL_CTRL_DISABLE` | 禁用组内所有通道 |

#### Output offset（输出偏移）

PWM 输出波形偏移指定时间。通常结合 global control 在 oneshot 模式下使用，对应 `struct pwm_state` 中的 `duty_offset` 参数。

#### Counter（输入计数模式）

计算输入波形的个数。

```c
rockchip_pwm_set_counter(pdev, PWM_COUNTER_INPUT_FROM_IO, true);
msleep(timeout_ms);
rockchip_pwm_set_counter(pdev, 0, false);
rockchip_pwm_get_counter_result(pdev, &counter_res, true);
```

#### Frequency meter（频率计模式）

计算输入波形的频率。

```c
rockchip_pwm_set_freq_meter(pdev, timeout_ms, PWM_COUNTER_INPUT_FROM_IO, &freq_hz);
```

#### IR output

驱动暂不支持。

#### IR input

详见文档 `Rockchip_Developer_Guide_PWM_IR_CN`，对应驱动：
`driver/input/remotectl/rockchip_pwm_remotectl.c`

#### Wave generator（波形发生器）

根据 wave table 配置输出指定波形。

```c
// 设置 duty table
duty_table.table = table;
duty_table.offset = (channel_id % 3) * PWM_TABLE_MAX;
duty_table.len = PWM_TABLE_MAX;

// 配置波形参数
wave_config.rpt = PWM_WAVE_RPT;
wave_config.clk_rate = 400000;
wave_config.duty_table = &duty_table;
wave_config.period_table = NULL;
wave_config.enable = enable;
wave_config.duty_en = true;
wave_config.period_en = false;
wave_config.width_mode = PWM_WIDTH_MODE;
wave_config.update_mode = PWM_WAVE_INCREASING_THEN_DECREASING;
wave_config.duty_max = (channel_id % 3 + 1) * PWM_TABLE_MAX - 1;
wave_config.duty_min = (channel_id % 3) * PWM_TABLE_MAX;
wave_config.offset = 0;
wave_config.middle = PWM_TABLE_MAX / 2;

rockchip_pwm_set_wave(pdev, &wave_config);

// 使能 continuous 模式
pwm_get_state(pdev, &state);
state.period = period;
state.duty_cycle = duty;
state.enabled = enable;
pwm_apply_state(pdev, &state);
```

**配置说明**：

| 参数 | 说明 |
| :--- | :--- |
| `width_mode` | 表元素宽度：`PWM_WAVE_TABLE_8BITS_WIDTH` / `PWM_WAVE_TABLE_16BITS_WIDTH` |
| `update_mode` | 更新模式：`PWM_WAVE_INCREASING`（递增循环）/ `PWM_WAVE_INCREASING_THEN_DECREASING`（先增后减） |

PWM v4 的 wave generator 有 768 × 8bit 存储空间。开启 `duty_en`/`period_en` 后，每 `rpt` 个周期从 table 中取下一个配置值。

在 middle 和 max 索引处会产生中断，可在中断回调中处理：

```c
static void rockchip_pwm_wave_middle_callback(struct pwm_device *pwm) { /* ... */ }
static void rockchip_pwm_wave_max_callback(struct pwm_device *pwm)    { /* ... */ }
```

#### Biphasic counter（双向计数器）

支持 mode0-mode4 五种计数模式。mode0 可作为 counter 和 frequency meter 使用。

```c
biphasic_config.enable = true;
biphasic_config.is_continuous = false;
biphasic_config.mode = biphasic_mode;
biphasic_config.delay_ms = timeout_ms;
rockchip_pwm_set_biphasic(pdev, &biphasic_config, &biphasic_res);
```

配置结构体：

```c
struct rockchip_pwm_biphasic_config {
    bool enable;
    bool is_continuous;  // 连续模式下手动关闭前持续计数
    u8 mode;
    u32 delay_ms;
};
```

计数模式：

| 模式 | 说明 |
| :--- | :--- |
| `PWM_BIPHASIC_COUNTER_MODE0` | 单相 A 相递增模式（等价于 counter） |
| `PWM_BIPHASIC_COUNTER_MODE1` | 单相 A 相递增/递减模式 |
| `PWM_BIPHASIC_COUNTER_MODE2` | 双相 A/B 相模式 |
| `PWM_BIPHASIC_COUNTER_MODE3` | 双相 A/B 相 2 倍频模式 |
| `PWM_BIPHASIC_COUNTER_MODE4` | 双相 A/B 相 4 倍频模式 |
| `PWM_BIPHASIC_COUNTER_MODE0_FREQ` | 单相频率计模式（等价于 frequency meter） |

连续模式下可实时获取结果：

```c
rockchip_pwm_get_biphasic_result(pdev, &biphasic_res);
```

### User space

PWM 框架在 `/sys/class/pwm/` 目录下提供用户层接口。驱动加载成功后，会生成 `pwmchipX` 目录（X 与 probe 顺序有关）。

```
/sys/class/pwm/pwmchip0/
├── device/
├── export
├── npwm
├── power/
├── subsystem/
├── uevent
└── unexport
```

- 向 `export` 写入 `0` → 生成 `pwm0` 目录
- 向 `unexport` 写入 `0` → 删除 `pwm0` 目录

`pwm0` 目录下的操作节点：

| 节点 | 说明 |
| :--- | :--- |
| `enable` | 1=使能，0=关闭 |
| `polarity` | `normal` / `inversed` |
| `duty_cycle` | 占空比（ns） |
| `period` | 周期（ns） |
| `oneshot_count` | oneshot 模式波形个数（需开启 ONESHOT 配置） |
| `oneshot_repeat` | oneshot 重复次数（PWM v4，需 ONESHOT） |
| `duty_offset` | 输出偏移时间（ns，需 ONESHOT） |
| `capture` | 捕获模式，读取输入波形高低电平时长 |

#### Continuous

```bash
cd /sys/class/pwm/pwmchip0/
echo 0 > export
cd pwm0
echo 10000 > period       # 10KHz
echo 5000 > duty_cycle     # 50% 占空比
echo normal > polarity
echo 1 > enable
```

#### Oneshot

```bash
cd /sys/class/pwm/pwmchip0/
echo 0 > export
cd pwm0
echo 10000 > period
echo 5000 > duty_cycle
echo 1000 > duty_offset
echo normal > polarity
echo 100 > oneshot_count
echo 10 > oneshot_repeat
echo 1 > enable
```

#### Capture

```bash
cd /sys/class/pwm/pwmchip0/
echo 0 > export
cd pwm0
cat capture
```

---

## 常见问题

### PWM 在 U-Boot 与 kernel 之间的衔接问题

U-Boot 如果使用了 PWM 调压功能，到 kernel 阶段 PWM 仍处于工作状态。需要根据当前硬件状态调整 PWM clock count，否则 clock 架构可能关闭无人使用的 PWM clock，导致 PWM 无法工作。

**解决方案**：确保 PWM 驱动（`drivers/pwm/pwm-rockchip.c`）更新到对应的提交点。

**其他导致切换问题的原因**：

1. **时钟源频率不一致**：U-Boot 与 kernel 的时钟源或频率不一致，会导致占空比变化
   - 确保 U-Boot 的 GPLL 频率与 kernel 保持一致（PWM 时钟挂在 GPLL 下）
   - 查看方法：U-Boot 开机 log / kernel 下 `cat /sys/kernel/debug/clock/clock_tree | grep gpll`

2. **极性和周期不一致**：U-Boot 与 kernel 配置的极性和周期不一致也会导致切换问题
   - 保持两者极性和周期配置一致

### PWM Regulator 时 PWM pin 脚上下拉配置问题

reboot 时 GRF 寄存器通常不复位，但 PWM 控制器会复位，导致 reboot 后 PWM Regulator 默认电压改变。

**解决方案**：在 kernel 中配置 PWM pin 脚上下拉与默认上下拉一致，不能配置为 none。

**步骤**：

1. 通过硬件原理图确认该 PWM pin 的默认上下拉
   - 引脚名后缀 `d` = 默认下拉（pull down）
   - 引脚名后缀 `u` = 默认上拉（pull up）

2. 在 dtsi 中定义 pinctrl：

```dts
pwm2_pin_pull_down: pwm2-pin-pull-down {
    rockchip,pins = <1 19 RK_FUNC_1 &pcfg_pull_down>;
};
```

3. 在 dts 中覆盖 PWM 的 pinctrl：

```dts
&pwm2 {
    status = "okay";
    pinctrl-names = "active";
    pinctrl-0 = <&pwm2_pin_pull_down>;
};
```

:::note 注意
该问题仅针对 PWM 作为调压时才需要修改，作为其他功能可以不用关注。
:::

### PWM 波形无法用示波器测到

**排查步骤**：

**第一步：检查 PWM Counter Register 寄存器是否在变化**

- 如果值在变化 → PWM 工作正常，问题在 pin 脚
- 如果值没变化 → PWM 工作异常，检查以下方面

**PWM 工作异常的常见原因**：

1. 时钟问题
2. PWM 寄存器配置问题（未使能、duty 大于 period 等）
3. RK3368 芯片需额外配置 GRF 中 `GRF_SOC_CON15` 寄存器的 bit12 为 1

:::note 注意
用 io 命令读寄存器时，RK3328 及之后的芯片需要先关闭 pclk gating（pclk 和工作时钟是分开的）。
:::

**PWM 正常但测不到信号的常见原因（pin 脚问题）**：

1. IOMUX 配置问题
2. IO-domain 配置不对
3. 外部硬件干扰

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_PWM_CN.pdf` V3.2.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
