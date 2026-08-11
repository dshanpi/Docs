---
sidebar_position: 1
---

# IO-DOMAIN 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_IO_DOMAIN_CN.pdf`（V1.0.1, 2021-05-28）整理，介绍 Rockchip 平台 IO 电源域的配置方法。

:::info 适用范围
- **芯片平台**：RK3188 / RK3288 / RK3036 / RK312x / RK322x / RK3368 / RK3366 / RK3399 / RV1108 / RK3228H / RK3328 / RK3326/PX30 / RK3308
- **内核版本**：Linux 3.10 / 4.4
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

一般 IO 电源的电压有 1.8V、3.3V、2.5V、5.0V 等。有些 IO 同时支持多种电压，**io-domain** 就是配置 IO 电源域的寄存器，依据真实的硬件电压范围来配置对应的电压寄存器，否则 IO 无法正常工作。

---

## 二、驱动文件与 DTS 节点

### 2.1 驱动文件

驱动文件位置：`drivers/power/avs/rockchip-io-domain.c`

### 2.2 DTS 节点

**内核 3.10 版本** — DTS 节点合并：

```dts
io-domains {
    compatible = "rockchip,rk3368-io-voltage-domain";
    rockchip,grf = <&grf>;
    rockchip,pmugrf = <&pmugrf>;

    /* GRF_IO_VSEL */
    dvp-supply = <&ldo7_reg>;      /* DVPIO_VDD */
    wifi-supply = <&ldo7_reg>;     /* APIO2_VDD */
    audio-supply = <&dcdc2_reg>;   /* APIO3_VDD */
    sdcard-supply = <&ldo1_reg>;   /* SDMMC0_VDD */
    gpio30-supply = <&dcdc2_reg>;  /* APIO1_VDD */
    gpio1830-supply = <&dcdc2_reg>;/* ADIO4_VDD */

    /* PMU_GRF_IO_VSEL */
    pmu-supply = <&ldo5_reg>;      /* PMUIO_VDD */
    vop-supply = <&ldo5_reg>;      /* LCDC_VDD */
};
```

**内核 4.4 版本** — GRF 和 PMUGRF 分开：

```dts
&io_domains {
    status = "okay";
    dvp-supply = <&vcc_18>;
    audio-supply = <&vcc_io>;
    gpio30-supply = <&vcc_io>;
    gpio1830-supply = <&vcc_io>;
    sdcard-supply = <&vccio_sd>;
    wifi-supply = <&vccio_wl>;
};

&pmu_io_domains {
    status = "okay";
    pmu-supply = <&vcc_io>;
    vop-supply = <&vcc_io>;
};
```

---

## 三、TRM 中的描述

在 TRM 的 GRF/PMUGRF 章节搜索 **vsel**、**VSEL** 或 **volsel** 索引可找到 io-domain 相关寄存器。PMUGRF 中的 io-domain 用于控制 PMU IO。

**支持配置的两种电压（1.8V / 3.3V）：**
- 寄存器配置为 **1**：电压范围 1.62V ~ 1.98V（典型值 1.8V）
- 寄存器配置为 **0**：电压范围 3.00V ~ 3.60V（典型值 3.3V）

:::note
具体电压范围以实际芯片 Datasheet 为准。
:::

---

## 四、驱动软件流程

### 4.1 初始化配置

在驱动 probe 函数中，根据 supply name 获取 dts 中对应定义的 regulator，再根据 regulator 的电压配置 io-domain 寄存器：
- **1.8V 档位** → 对应 bit 配置为 1
- **3.3V 档位** → 对应 bit 配置为 0

```
开始 → 匹配 Supply_Name → 获取 Regulator 成功? → 配置 io-domain → 继续? → 结束
              ↓否                                    ↓否
           丢弃                                    结束
```

### 4.2 动态配置

初始化过程中会绑定 regulator，通过注册 notify 方式，一旦 regulator 电压发生变化，就会通知 io-domain 驱动更新对应寄存器，实现动态更新。

---

## 五、如何配置 io-domain

不是每个 IO 电源域都需要配置，有些 IO 的电源域是固定的。以下 3 步描述软件配置方法：

### 5.1 通过 rockchip-io-domain.txt 寻找名称

需要在软件上通过 dts 配置的 IO 电源域在以下文档中有描述：
`Documentation/devicetree/bindings/power/rockchip-io-domain.txt`

该文档统一描述了 TRM 与硬件原理图上 iodomain 名称的对应关系。

**以 RK3399 为例：**
```
Possible supplies for rk3399:
  bt656-supply:    The supply connected to APIO2_VDD.
  audio-supply:    The supply connected to APIO5_VDD.
  sdmmc-supply:    The supply connected to SDMMC0_VDD.
  gpio1830-supply: The supply connected to APIO4_VDD.

Possible supplies for rk3399 pmu-domains:
  pmu1830-supply:  The supply connected to PMUIO2_VDD.
```

### 5.2 通过硬件原理图寻找真实电压

仍以 RK3399-EVB 和 bt656 IO 电源域为例：
1. 在 rockchip-io-domain.txt 中找到 bt656 对应硬件原理图名称为 **APIO2_VDD**
2. 在原理图中搜索 `APIO2_VDD`，找到其电源由 RK808 的 **VCC1V8_DVP** 供给
3. 确认实际电压为 1.8V

### 5.3 通过 DTS 配置

得到配置名称和供电源头后，在 DTS 中找到对应的 regulator 并进行配置：

```dts
// rk3399-evb.dtsi
&io_domains {
    bt656-supply = <&vcc1v8_dvp>;
    // ...
};
```

---

## 六、通过硬件 Pin 脚控制的电源域

Rockchip SoC 中部分 IO 电源域在硬件上通过 Pin 脚控制，这种情况下 kernel DTS 一般不去配置，不破坏当前硬件状态。

:::tip 典型场景
Flash 和 eMMC 等模块的 IO 电源域一般由 Pin 脚控制。
:::

在 TRM 的 io-domain 寄存器描述中可以看到哪些电源域支持通过 Pin 脚控制，以及对应的硬件 Pin 脚配置。也可以通过 GRF 寄存器配置，两种方式二选一。

---

## 七、DTS 中无定义 Regulator 情况处理

如果找不到对应的 regulator（例如项目未使用 PMIC，只是简单拉了一个电源），需要在 dts 中增加 **fixed regulator** 定义。一般 3.3V 和 1.8V 两个 regulator 即可。

**示例（rk3229-evb.dts）：**

```dts
regulators {
    compatible = "simple-bus";
    #address-cells = <1>;
    #size-cells = <0>;

    vccio_1v8_reg: regulator@0 {
        compatible = "regulator-fixed";
        regulator-name = "vccio_1v8";
        regulator-min-microvolt = <1800000>;
        regulator-max-microvolt = <1800000>;
        regulator-always-on;
    };

    vccio_3v3_reg: regulator@1 {
        compatible = "regulator-fixed";
        regulator-name = "vccio_3v3";
        regulator-min-microvolt = <3300000>;
        regulator-max-microvolt = <3300000>;
        regulator-always-on;
    };
};

&io_domains {
    status = "okay";
    vccio1-supply = <&vccio_3v3_reg>;
    vccio2-supply = <&vccio_1v8_reg>;
    vccio4-supply = <&vccio_3v3_reg>;
};
```

---

## 八、常见问题

### 8.1 如何确定 Pin 脚所在电源域寄存器是否配置正确

**现象**：某 Pin 脚输出高电平时电压不对，已确认 iomux 配置为 GPIO 且输出高，但量测电压不符。

**排查步骤**（配置的反向步骤）：
1. **确定 IO 所在电源域**：查看硬件原理图或 Datasheet。例如 GPIO2_B1 在 APIO2_VDD 域，接 VCC1V8_DVP（1.8V）。
2. **查找对应名称**：通过 `rockchip-io-domain.txt` 找到对应 dts 名称（如 bt656）。
3. **读取寄存器验证**：在 TRM 中找到寄存器地址（GRF 基地址 + 偏移），用 io 命令读取：
   ```bash
   io -4 0xff77e640
   ```
   - bit0 = 1 → 1.8V（配置正确）
   - bit0 = 0 → 3.3V（配置错误，与实际 1.8V 不符）

### 8.2 io-domain 寄存器不正确

常见原因：
1. 所配置的 regulator 电压不对
2. 未配置 regulator 或 regulator 未使能
3. Regulator 比 io-domain 驱动加载更慢，获取 regulator 失败

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_IO_DOMAIN_CN.pdf` V1.0.1
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
