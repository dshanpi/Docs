---
sidebar_position: 4
---

# GMAC DPDK 使用指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Linux_GMAC_DPDK_CN.pdf`（V1.0.0, 2023-03-06）整理，介绍 Rockchip 平台以太网 GMAC 接口的 DPDK 使用方法。

:::info 适用范围
- **芯片平台**：RK3568
- **内核版本**：Linux 4.19+
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 一、概述

DPDK（Data Plane Development Kit）是数据平面开发套件，用于高性能数据包处理。本文介绍在 Rockchip 平台上使用 GMAC 接口运行 DPDK 的方法。

---

## 二、代码编译

### 2.1 内核编译

#### 使能 UIO 节点（DTS）

```dts
&gmac_uio0 {
    status = "okay";
};

&gmac_uio1 {
    status = "okay";
};
```

#### 内核配置

```bash
make CROSS_COMPILE=aarch64-linux-gnu- ARCH=arm64 rockchip_linux_defconfig
make CROSS_COMPILE=aarch64-linux-gnu- ARCH=arm64 menuconfig
```

配置项：
```
CONFIG_UIO=m
CONFIG_STMMAC_UIO=m
CONFIG_HUGETLBFS=y
```

#### 编译烧写

```bash
make CROSS_COMPILE=aarch64-linux-gnu- ARCH=arm64 rk3568-evb1-ddr4-v10.img -j8
```

烧写后，推送 KO 文件：
```bash
adb push drivers/uio/uio.ko
adb push drivers/net/ethernet/stmicro/stmmac/stmmac_uio.ko
```

### 2.2 DPDK 编译

---

## 三、运行 DPDK 程序

### 3.1 挂载巨页

```bash
# 配置大页内存
echo 1024 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages
mount -t hugetlbfs none /mnt/huge
```

### 3.2 加载 KO

```bash
insmod uio.ko
insmod stmmac_uio.ko
```

### 3.3 设置 performance 模式

```bash
echo performance > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
```

### 3.4 运行 testpmd

```bash
./testpmd -c 0x3 -n 2 -- -i
```

### 3.5 运行 l2fwd

```bash
./l2fwd -c 0x3 -n 2 -- -p 0x3
```

### 3.6 运行 l3fwd

```bash
./l3fwd -c 0x3 -n 2 -- -p 0x3 --config="(0,0,0),(1,0,1)"
```

---

## 四、Pktgen

### 4.1 下载源码

pktgen-dpdk 源码

### 4.2 编译 DPDK
### 4.3 编译 Pktgen
### 4.4 运行 Pktgen 程序

---

## 五、常见问题

### 5.1 长时间打流会丢包

可能原因：
- CPU 负载过高
- 大页内存不足
- 中断处理不及时

### 5.2 物理内存超 4G 空间

需配置 DMA 地址转换或使用 IOMMU。

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Linux_GMAC_DPDK_CN.pdf` V1.0.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
