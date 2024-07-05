---
sidebar_position: 13
---
# 线刷固件

### 修改 U-boot 支持线刷固件

U-Boot 默认配置的是使用 SDC2 也就是 TinyVision 的 SD-NAND 刷写固件。同时也支持使用 SDC0 也就是 TF 卡烧写固件，但是需要手动配置一下 U-Boot。否则会出现如下问题，U-Boot 去初始化不存在的 SD NAND 导致刷不进系统。

![image-20240122155351715](assets/post/README/image-20240122155351715.png)

前往文件夹 `brandy/brandy-2.0/u-boot-2018/drivers/sunxi_flash/mmc/sdmmc.c` 

找到第 188 行，将 `return sdmmc_init_for_sprite(0, 2);` 修改为 `return sdmmc_init_for_sprite(0, 0);`

![image-20240122155513106](assets/post/README/image-20240122155513106.png)

修改后需要重新编译固件。插入空白的 TF 卡，如果不是空白的 TF 卡可能出现芯片不进入烧录模式。

![image-20240122160030117](assets/post/README/image-20240122160030117.png)

出现 `try card 0` 开始下载到 TF 卡内
