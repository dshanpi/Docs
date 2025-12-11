---
sidebar_position: 2
---

# 设备树与 Overlay 指南

:::tip 提示
本章节将详细介绍 Linux 设备树（Device Tree）的基本概念、语法结构，并重点讲解在 Armbian 系统下如何使用 **Device Tree Overlay (DTO)** 机制来动态配置硬件，而无需重新编译内核。
:::

## 1. 设备树的由来与作用

### 1.1 为什么需要设备树？

在 Linux 内核发展的早期，ARM 架构的硬件描述信息（如 GPIO 引脚号、内存地址、中断号等）都硬编码在 C 语言源文件中（如 `arch/arm/mach-xxx/board-xxx.c`）。随着 ARM 芯片和开发板的爆发式增长，内核中充斥着大量重复、杂乱的板级描述代码。

Linux 之父 **Linus Torvalds** 曾对此大发雷霆："This whole ARM thing is a f*cking pain in the ass"。

为了解决这个问题，Linux 内核引入了 **设备树 (Device Tree)** 机制。

*   **核心思想**：将硬件描述信息从内核源码中分离出来，用一种独立的文件格式（.dts）来描述。
*   **驱动与设备分离**：驱动程序只负责操作硬件（怎么做），而设备树负责告诉驱动硬件在哪里（是什么）。
    *   例如 LED 驱动，代码中只写“操作 GPIO 点亮灯”，至于具体是 GPIOA_1 还是 GPIOB_5，则由设备树指定。

:::info 体验设备树
在开发板启动后，可以通过 `/sys/firmware` 目录查看当前内核使用的设备树信息：
```bash
ls /sys/firmware/devicetree/base
```
该目录下的结构与 `.dts` 文件一一对应，目录代表节点，文件代表属性。
:::

## 2. 设备树语法详解

### 2.1 基本概念

*   **DTS (Device Tree Source)**: 文本格式的设备树源文件，供人类阅读和编辑。
*   **DTB (Device Tree Blob)**: 二进制格式的设备树文件，由 DTS 编译而来，供内核解析使用。
*   **DTC (Device Tree Compiler)**: 编译工具，将 DTS 编译为 DTB。

<img src={require('./images/image-20251030185319561.png').default} alt="设备树结构" style={{display: 'block', margin: '20px auto', maxWidth: '60%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

### 2.2 DTS 文件结构

一个基本的 DTS 文件包含版本声明、内存预留、根节点及其子节点。

```c
/dts-v1/;                // 版本声明
[memory reservations]    // 内存预留区域

/ {                      // 根节点
    [property definitions]
    [child nodes]
};
```

### 2.3 节点 (Node)

节点是设备树的基本单元，格式如下：

```c
[label:] node-name[@unit-address] {
    [properties definitions]
    [child nodes]
};
```

*   **label**: 标号，方便在其他地方引用（如 `&uart0`）。
*   **node-name**: 节点名称，通常体现设备类型。
*   **unit-address**: 单元地址，通常是寄存器基地址。

**示例**：
```c
uart0: uart@fe001000 {
    compatible = "ns16550";
    reg = <0xfe001000 0x100>;
};
```

### 2.4 属性 (Property)

属性用于描述设备的特性，格式为 `name = value`。常见的值类型包括：

1.  **字符串**: `compatible = "simple-bus";`
2.  **32位整数 (Cell)**: 使用尖括号 `< >`，如 `interrupts = <17 0xc>;`
3.  **二进制数据**: 使用中括号 `[ ]`，如 `local-mac-address = [00 00 12 34 56 78];`
4.  **混合类型**: `compatible = "ns16550", "ns8250";`

### 2.5 常用属性说明

| 属性名 | 说明 | 示例 |
| :--- | :--- | :--- |
| **compatible** | 兼容性列表，内核根据它匹配驱动程序。建议格式 `"厂家,型号"`。 | `compatible = "rockchip,rk3576";` |
| **model** | 准确描述硬件模块的名称。 | `model = "DshanPi-A1";` |
| **status** | 设备状态。`"okay"` 表示启用，`"disabled"` 表示禁用。 | `status = "disabled";` |
| **reg** | 寄存器地址范围。格式由父节点的 `#address-cells` 和 `#size-cells` 决定。 | `reg = <0xfe001000 0x100>;` |
| **#address-cells** | 子节点 `reg` 属性中地址字段占用的字长（32位为1）。 | `#address-cells = <1>;` |
| **#size-cells** | 子节点 `reg` 属性中长度字段占用的字长。 | `#size-cells = <1>;` |

## 3. 设备树 Overlay (DTO) 实战

### 3.1 传统方式 vs Overlay

*   **传统方式**：修改主设备树 (`.dts`) -> 重新编译整个 DTB -> 替换系统 DTB -> 重启。
    *   缺点：繁琐，容易破坏原有配置，需要内核源码环境。
*   **Overlay 方式**：编写片段设备树 (`.dts`) -> 编译为插件 (`.dtbo`) -> 让 Bootloader 加载。
    *   优点：增量修改，无需编译内核，即插即用（重启生效），适合开发调试。

在 **Armbian** 系统中，Overlay 机制非常成熟，通过 `armbian-add-overlay` 工具可以轻松管理。

### 3.2 Overlay 语法结构

Overlay 文件也是 `.dts` 格式，但头部需要声明插件属性。

```c
/dts-v1/;
/plugin/;  // 声明为插件

/ {
    fragment@0 {
        target = <&node_label>; // 目标节点（通过 label 引用）
        __overlay__ {
            // 在目标节点中添加或修改的内容
            status = "okay";
        };
    };
};
```

### 3.3 实战：添加 WS2812 设备节点

假设我们需要在 DshanPi-A1 上添加一个 WS2812 灯珠设备。

#### 3.3.1 编写 Overlay 文件 (ws2812.dts)

我们通过 Overlay 向根节点添加 `ws2812` 节点，并向 `pinctrl` 节点添加引脚配置。

```c
/dts-v1/;
/plugin/;

/ {
    compatible = "rockchip,rk3576";

    /* 片段 1: 添加设备节点 */
    fragment@0 {
        target-path = "/";  // 目标是根节点
        __overlay__ {
            ws2812: ws2812 {
                compatible = "dshanpi-a1,ws2812";
                status = "okay";
                pinctrl-names = "default";
                pinctrl-0 = <&ws2812_data_pin>;
                data-gpios = <&gpio4 23 0>;     /* GPIO4_C7, 0=ACTIVE_HIGH */
            };
        };
    };

    /* 片段 2: 添加引脚配置 */
    fragment@1 {
        target = <&pinctrl>; // 目标是 pinctrl 节点
        __overlay__ {
            ws2812 {
                ws2812_data_pin: ws2812-data-pin {
                    /* port=4, pin=23(C7), func=GPIO, pull=none */
                    rockchip,pins = <4 23 0 &pcfg_pull_none>;
                };
            };
        };
    };
};
```

:::warning 注意
在 Overlay 中，如果在宏定义（如 `GPIO_ACTIVE_HIGH`）编译报错，请直接使用对应的数值（如 `0`）。
:::

#### 3.3.2 编译并加载

在 Armbian 系统下，直接使用 `armbian-add-overlay` 命令：

```bash
sudo armbian-add-overlay ws2812.dts
```

该命令会自动执行以下步骤：
1.  调用 `dtc` 将 `.dts` 编译为 `.dtbo`。
2.  将 `.dtbo` 复制到 `/boot/overlay-user/` 目录。
3.  自动更新 `/boot/armbianEnv.txt` 文件，添加 `user_overlays` 配置。

#### 3.3.3 验证与生效

重启开发板：
```bash
sudo reboot
```

重启后，检查新节点是否存在：
```bash
ls /sys/firmware/devicetree/base/ws2812
```
如果能看到该目录及其属性，说明 Overlay 加载成功！

### 3.4 常用 Overlay 操作技巧

1.  **删除节点**:
    ```c
    /delete-node/ existing_node_name;
    ```
2.  **删除属性**:
    ```c
    /delete-property/ property_name;
    ```
3.  **修改属性**:
    直接在 `__overlay__` 中重新赋值即可覆盖原属性。

:::tip 总结
使用 Overlay 是嵌入式 Linux 开发中调试硬件配置的神器，熟练掌握它能极大地提高开发效率。
:::
