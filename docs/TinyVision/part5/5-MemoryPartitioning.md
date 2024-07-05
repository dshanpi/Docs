---
sidebar_position: 5
---
# 内存划分

在设备树配置小核心使用的内存，包括小核自己使用的内存，设备通信内存，回环内存等等，这里E907 运行在 DRAM 内。内存起始地址可以在数据手册查到。

![image-20230215131405440](assets/post/README/image-20230215131405440.png)

通常来说我们把内存地址设置到末尾，例如这里使用的 V851s，拥有 64MByte 内存，则内存范围为 `0x40000000 - 0x44000000`，这里配置到 `0x43c00000` 即可。对于 V853s 拥有 128M 内存则可以设置到 `0x47C00000`，以此类推。对于交换区内存则可以配置在附近。

```
reserved-memory {                               // 配置预留内存区间
	e907_dram: riscv_memserve {                 // riscv 核心使用的内存
		reg = <0x0 0x43c00000 0x0 0x00400000>;  // 起始地址 0x43c00000 长度 4MB
		no-map;
	};

	vdev0buffer: vdev0buffer@0x43000000 {       // vdev设备buffer预留内存
		compatible = "shared-dma-pool";
		reg = <0x0 0x43000000 0x0 0x40000>;
		no-map;
	};

	vdev0vring0: vdev0vring0@0x43040000 {       // 通讯使用的vring设备0
		reg = <0x0 0x43040000 0x0 0x20000>;
		no-map;
	};

	vdev0vring1: vdev0vring1@0x43060000 {       // 通讯使用的vring设备1
		reg = <0x0 0x43060000 0x0 0x20000>;
		no-map;
	};
};
```

然后需要配置下 `e907` 的链接脚本，找到 `e907_rtos/rtos/source/projects/v851-e907-lizard/kernel.lds`  将 `ORIGIN` 配置为上面预留的内存。

```
MEMORY
{
   /*DRAM_KERNEL: 4M */
   DRAM_SEG_KRN (rwx) : ORIGIN = 0x43c00000, LENGTH = 0x00400000
}
```

然后配置小核的 `defconfig` 位于 `e907_rtos/rtos/source/projects/v851-e907-lizard/configs/defconfig` 配置与其对应即可。

```
CONFIG_DRAM_PHYBASE=0x43c00000
CONFIG_DRAM_VIRTBASE=0x43c00000
CONFIG_DRAM_SIZE=0x0400000
```
