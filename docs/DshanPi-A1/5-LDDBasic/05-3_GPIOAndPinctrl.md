---
sidebar_position: 3
---

# GPIO 与 Pinctrl 子系统

:::tip 提示
本章节将深入解析 Linux 内核中用于管理引脚的两大核心子系统：**Pinctrl（引脚控制）** 和 **GPIO（通用输入输出）**。理解它们的区别与协作关系，是进行嵌入式硬件开发的基础。
:::

## 1. 核心概念解析

在嵌入式 Linux 系统中，对引脚的控制分为两个层面：

1.  **Pinctrl 子系统 (Pin Control Subsystem)**
    *   **职责**：负责引脚的“复用”和“电气特性”配置。
    *   **复用 (Muxing)**：决定一个物理引脚是作为普通 GPIO，还是复用为 UART、I2C、PWM 等功能。
    *   **电气特性 (Conf)**：设置引脚的上拉/下拉、驱动能力、开漏/推挽等。
    *   **比喻**：Pinctrl 就像是“修路队”，负责把路铺好（设置电气属性），并决定这条路通向哪里（复用功能）。

2.  **GPIO 子系统 (General Purpose Input/Output Subsystem)**
    *   **职责**：当引脚被复用为 "GPIO" 功能后，负责控制引脚的电平（高/低）和读取输入状态。
    *   **比喻**：GPIO 子系统就像是“交通信号灯控制器”，在路铺好（Pinctrl 配置好）之后，负责控制红绿灯的亮灭（高低电平）。

:::warning 关键点
**先 Pinctrl，后 GPIO**。在操作 GPIO 之前，必须确保该引脚在 Pinctrl 中被正确配置为 GPIO 模式，而不是其他功能（如 I2C）。
:::

## 2. Pinctrl 子系统配置

在设备树（DTS）中，Pinctrl 配置通常作为独立的节点存在，并被其他设备节点引用。

### 2.1 Pinctrl 节点语法 (Rockchip 平台)

以瑞芯微（Rockchip）平台为例，Pinctrl 节点的定义通常位于 `arch/arm64/boot/dts/rockchip/rk3576-pinctrl.dtsi` 中。

```c
&pinctrl {
    /* 定义一组引脚配置 */
    ws2812 {
        ws2812_data_pin: ws2812-data-pin {
            /* 格式: <bank pin func pull_strength> */
            rockchip,pins = <4 23 0 &pcfg_pull_none>;
        };
    };
};
```

*   **bank**: GPIO 组号，如 `4` 代表 GPIO4。
*   **pin**: 组内编号，如 `23` 对应 `PC7` (8*2 + 7 = 23)。
*   **func**: 复用功能，`0` 通常代表 GPIO，其他值代表 UART, SPI 等特定功能。
*   **pull_strength**: 电气属性，如 `&pcfg_pull_none` (无上下拉), `&pcfg_pull_up` (上拉)。

### 2.2 在设备节点中引用 Pinctrl

当我们在设备树中定义一个设备（如 LED）时，需要告诉内核该设备使用了哪些引脚配置。

```c
ws2812: ws2812 {
    compatible = "dshanpi-a1,ws2812";
    
    /* 引用名为 "default" 的状态，对应 pinctrl-0 指定的配置 */
    pinctrl-names = "default";
    pinctrl-0 = <&ws2812_data_pin>;
    
    /* 其他属性 */
    status = "okay";
};
```

*   **pinctrl-names**: 定义状态名称列表，最常用的是 `"default"`。
*   **pinctrl-0**: 对应 `"default"` 状态下的引脚配置列表。内核在加载驱动时，会自动将引脚配置为该状态。

## 3. GPIO 子系统操作

当引脚被配置为 GPIO 模式后，我们可以在用户空间或内核空间对其进行控制。

### 3.1 用户空间操作：Sysfs (旧接口)

Linux 早期提供了基于 sysfs 的 GPIO 接口 `/sys/class/gpio`，虽然已被标记为过时（Deprecated），但在调试中依然常用。

1.  **计算 GPIO 编号**：
    Rockchip 平台公式：`GPIO_ID = bank * 32 + group * 8 + pin`
    例如 `GPIO4_C7`:
    *   bank = 4
    *   group = 2 (A=0, B=1, C=2, D=3)
    *   pin = 7
    *   `ID = 4 * 32 + 2 * 8 + 7 = 128 + 16 + 7 = 151`

2.  **导出引脚**：
    ```bash
    echo 151 > /sys/class/gpio/export
    ```

3.  **设置方向**：
    ```bash
    echo out > /sys/class/gpio/gpio151/direction  # 输出模式
    # 或
    echo in > /sys/class/gpio/gpio151/direction   # 输入模式
    ```

4.  **控制电平**：
    ```bash
    echo 1 > /sys/class/gpio/gpio151/value  # 输出高电平
    echo 0 > /sys/class/gpio/gpio151/value  # 输出低电平
    ```

5.  **查看状态**：
    ```bash
    cat /sys/class/gpio/gpio151/value
    ```

### 3.2 用户空间操作：libgpiod (新接口)

**libgpiod** 是现代 Linux 推荐的 GPIO 用户空间工具库，它直接操作字符设备 `/dev/gpiochipX`，效率更高且支持并发安全。

#### 3.2.1 常用命令

*   **gpiodetect**: 列出系统中的 GPIO 控制器。
    ```bash
    gpiodetect
    ```
*   **gpioinfo**: 查看 GPIO 线路的详细信息（被谁占用、当前状态）。
    ```bash
    gpioinfo
    ```
*   **gpioset**: 设置 GPIO 电平。
    ```bash
    # 设置 GPIO4_C7 (假设对应 chip4 的 line 23) 为高电平
    gpioset gpiochip4 23=1
    ```
*   **gpioget**: 读取 GPIO 电平。
    ```bash
    gpioget gpiochip4 23
    ```

#### 3.2.2 C 语言编程示例

```c
#include <gpiod.h>
#include <stdio.h>
#include <unistd.h>

int main() {
    struct gpiod_chip *chip;
    struct gpiod_line *line;

    /* 打开 GPIO 控制器 4 */
    chip = gpiod_chip_open_by_number(4);
    if (!chip) {
        perror("Open chip failed");
        return -1;
    }

    /* 获取第 23 号线路 (GPIO4_C7) */
    line = gpiod_chip_get_line(chip, 23);
    if (!line) {
        perror("Get line failed");
        gpiod_chip_close(chip);
        return -1;
    }

    /* 请求输出模式，初始值为低电平 */
    if (gpiod_line_request_output(line, "example", 0) < 0) {
        perror("Request output failed");
        gpiod_chip_close(chip);
        return -1;
    }

    /* 闪烁 LED */
    while (1) {
        gpiod_line_set_value(line, 1); // 高电平
        sleep(1);
        gpiod_line_set_value(line, 0); // 低电平
        sleep(1);
    }

    gpiod_line_release(line);
    gpiod_chip_close(chip);
    return 0;
}
```

### 3.3 内核空间操作 (驱动开发)

在编写内核驱动时，使用 **GPIO Descriptor (gpiod)** 接口是标准做法。

1.  **在设备树中定义 GPIO**:
    ```c
    my_device {
        compatible = "my,device";
        enable-gpios = <&gpio4 23 GPIO_ACTIVE_HIGH>;
    };
    ```

2.  **在驱动代码中获取 GPIO**:
    ```c
    struct gpio_desc *enable_gpio;
    
    /* 在 probe 函数中 */
    enable_gpio = devm_gpiod_get(&pdev->dev, "enable", GPIOD_OUT_LOW);
    if (IS_ERR(enable_gpio)) {
        return PTR_ERR(enable_gpio);
    }
    ```
    *注意：设备树属性名为 `enable-gpios`，代码中获取时只需传 `"enable"`，内核会自动拼接后缀。*

3.  **控制 GPIO**:
    ```c
    gpiod_set_value(enable_gpio, 1); // 设置有效电平 (Active)
    ```

:::info 逻辑电平与物理电平
内核的 `gpiod_set_value` 设置的是**逻辑有效电平**。
*   如果设备树中定义为 `GPIO_ACTIVE_HIGH`，设置 1 则输出高电平。
*   如果设备树中定义为 `GPIO_ACTIVE_LOW`，设置 1 则输出低电平。
这使得驱动代码通用，无需关心硬件具体的极性连接。
:::

## 4. 总结

| 特性 | Pinctrl 子系统 | GPIO 子系统 |
| :--- | :--- | :--- |
| **主要职责** | 引脚复用、电气属性配置 | 输入/输出电平控制、中断处理 |
| **操作对象** | Pad (焊盘) | Logic Line (逻辑线路) |
| **生效时机** | 驱动 Probe 前（通常由内核核心处理） | 驱动运行过程中 |
| **用户空间工具** | 较少 (通常静态配置) | `sysfs`, `libgpiod` |

理解这两者的分工，能帮助你迅速定位硬件控制问题：如果是引脚没反应，先查 Pinctrl 有没有配对；如果是电平不对，再查 GPIO 控制逻辑。
