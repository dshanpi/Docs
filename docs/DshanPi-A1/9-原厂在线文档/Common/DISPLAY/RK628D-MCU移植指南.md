---
sidebar_position: 19
---

# RK628D MCU 移植指南

本文档基于瑞芯微官方文档 `Rockchip_MCU_RK628D_Porting_Guide_CN.pdf`（V1.1.0, 2021-05-28）整理，介绍在 MCU 平台上移植 RK628D 显示转换芯片驱动的方法。

:::info 适用范围
- **芯片型号**：RK628D
- **移植平台**：通用 MCU（以 GD32 为例）
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、简介

本文档描述 **MCU + RK628** 的软件配置、移植方法及调试手段。当使用非 Linux 平台（如裸机 MCU）控制 RK628D 时，需要移植 RK628 的纯 C 语言驱动代码。

### 驱动代码结构

```
├── Include
│   ├── panel.h
│   ├── rk628_combtxphy.h
│   ├── rk628_config.h         // 平台相关配置
│   ├── rk628_cru.h
│   ├── rk628_dsi.h
│   ├── rk628.h
│   ├── rk628_lvds.h
│   ├── rk628_post_process.h
│   ├── rk628_registers_dump.h
│   └── rk628_rgb.h
└── Source
    ├── panel.c
    ├── rk628.c
    ├── rk628_combtxphy.c
    ├── rk628_config.c         // 平台相关配置实现
    ├── rk628_cru.c
    ├── rk628_dsi.c
    ├── rk628_lvds.c
    ├── rk628_post_process.c
    ├── rk628_registers_dump.c
    └── rk628_rgb.c
```

**移植原则：** 所有需要移植或配置的内容尽量在 `rk628_config.c` 或 `rk628_config.h` 中修改。

---

## 二、平台移植

### 2.1 移植平台基础头文件

在 `rk628_config.h` 中引用 MCU 平台的头文件：

```c
// 跟平台相关的基础头文件
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "gd32f1x0_eval.h"
#include "gd32f1x0.h"
#include "systick.h"   // 跟延时相关实现依赖的头文件
```

### 2.2 封装 I2C 读写访问接口

RK628D 的地址和数据都是 **32bit**。需根据 RK628D I2C 操作流程封装访问接口。

```c
void rk628_i2c_write(uint32_t reg, uint32_t val)
{
    i2c_write(reg, val);  // 需要在 MCU 上实现的 i2c 写接口
}

uint32_t rk628_i2c_read(uint32_t reg)
{
    return i2c_read(reg); // 需要在 MCU 上实现的 i2c 读接口
}

void rk628_i2c_update_bits(uint32_t reg, uint32_t mask, uint32_t val)
{
    uint32_t orig, tmp;
    orig = i2c_read(reg);
    tmp = orig & ~mask;
    tmp |= val & mask;
    i2c_write(reg, tmp);
}
```

**I2C 功能测试：** 使用 `rk628_registers_dump.c` 中的接口 dump 出 RK628D 各个寄存器域的当前配置，验证 I2C 通信是否正常。

### 2.3 封装延时相关的接口

```c
void mdelay(unsigned long msec)
{
    delay_1ms(1);  // MCU 平台实现
}
```

可根据 MCU 平台实现更多精度的延时接口。

### 2.4 main 函数

```c
int main(void)
{
    ...
    while (1) {
        if (!init) {
            // set reset
            gpio_bit_reset(GPIOA, GPIO_PIN_9);
            delay_1ms(6);
            gpio_bit_set(GPIOA, GPIO_PIN_9);
            delay_1ms(1000);
            fwdgt_counter_reload();
            init = 1;
        }
        ...
    }
}
```

### 2.5 输入输出配置

在配置文件中选择输入源和输出目标。

---

## 三、Panel 端配置

### 3.1 Timing 配置

配置显示时序参数（clock、hactive、vactive、porch 等）。

### 3.2 Panel 时序实现

实现 Panel 上下电时序控制。

### 3.3 DSI Panel 初始化序列配置

配置 DSI 屏的初始化命令序列（DCS/Generic 命令）。

---

## 四、场景应用

### 4.1 RGB 输入

#### 4.1.1 DSI 输出

##### 单 DSI 输出
##### 双 DSI 输出

#### 4.1.2 LVDS 输出

##### 单 LVDS 输出
##### 双 LVDS 输出
##### 双 LVDS 左右屏

### 4.2 HDMI 输入

#### 4.2.1 配置 HDMI 输入
#### 4.2.2 HDMI 检测脚配置
#### 4.2.3 HPD 输出配置
#### 4.2.4 注意事项

---

## 参考资料

- 原始文档：`Rockchip_MCU_RK628D_Porting_Guide_CN.pdf` V1.1.0
- 《Rockchip_Developer_Guide_RK628_For_All_Porting_CN.pdf》
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
