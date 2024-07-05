---
sidebar_position: 4
---
# 软件适配

这部分使用BSP开发包即可，配置设备树如下：

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

e907_rproc: e907_rproc@0 {                      // rproc相关配置
	compatible = "allwinner,sun8iw21p1-e907-rproc";
	clock-frequency = <600000000>;
	memory-region = <&e907_dram>, <&vdev0buffer>,
				<&vdev0vring0>, <&vdev0vring1>;

	mboxes = <&msgbox 0>;
	mbox-names = "mbox-chan";
	iommus = <&mmu_aw 5 1>;

	memory-mappings =
			/* DA 	         len         PA */
			/* DDR for e907  */
			< 0x43c00000 0x00400000 0x43c00000 >;
	core-name = "sun8iw21p1-e907";
	firmware-name = "melis-elf";
	status = "okay";
};

rpbuf_controller0: rpbuf_controller@0 {        // rpbuf配置
	compatible = "allwinner,rpbuf-controller";
	remoteproc = <&e907_rproc>;
	ctrl_id = <0>;	/* index of /dev/rpbuf_ctrl */
	iommus = <&mmu_aw 5 1>;
	status = "okay";
};

rpbuf_sample: rpbuf_sample@0 {
	compatible = "allwinner,rpbuf-sample";
	rpbuf = <&rpbuf_controller0>;
	status = "okay";
};

msgbox: msgbox@3003000 {                       // msgbox配置
	compatible = "allwinner,sunxi-msgbox";
	#mbox-cells = <1>;
	reg = <0x0 0x03003000 0x0 0x1000>,
		<0x0 0x06020000 0x0 0x1000>;
	interrupts = <GIC_SPI 0 IRQ_TYPE_LEVEL_HIGH>,
				<GIC_SPI 1 IRQ_TYPE_LEVEL_HIGH>;
	clocks = <&clk_msgbox0>;
	clock-names = "msgbox0";
	local_id = <0>;
	status = "okay";
};

e907_standby: e907_standby@0 {
	compatible = "allwinner,sunxi-e907-standby";

	firmware = "riscv.fex";
	mboxes = <&msgbox 1>;
	mbox-names = "mbox-chan";
	power-domains = <&pd V853_PD_E907>;
	status = "okay";
};
```
