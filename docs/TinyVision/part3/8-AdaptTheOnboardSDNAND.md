---
sidebar_position: 8
---
# 适配板载 SD NAND

设备树中的 SDC2 节点修改如下，之后线刷即可

```
&sdc2 {
	non-removable;
	bus-width = <4>;
	mmc-ddr-3_3v;
	/*mmc-hs200-1_8v;*/
	/*mmc-hs400-1_8v;*/
	no-sdio;
	/delete-property/ no-sd;
	no-mmc;
	ctl-spec-caps = <0x8>;
	cap-mmc-highspeed;
	sunxi-signal-vol-sw-without-pmu;
	sunxi-power-save-mode;
	/*sunxi-dis-signal-vol-sw;*/
	max-frequency = <50000000>;
	/*vmmc-supply = <&reg_dcdc1>;*/
	/*emmc io vol 3.3v*/
	/*vqmmc-supply = <&reg_aldo1>;*/
	/*emmc io vol 1.8v*/
	/*vqmmc-supply = <&reg_eldo1>;*/
	status = "okay";
};
```
