---
sidebar_position: 3
---
# TinaSDKV2.0 Kernel基本开发

Tina-SDK Linux系统启动流程：

![image-20240713180705739](images/image-20240713180705739.png)

## Linux Kerenl目录结构

### 设备树配置文件位置

- 100ASK_T113s3-Pro开发板LinuxKernel配置文件： **device/config/chips/t113/configs/100ask/linux/config-5.4**

![image-20240311160545443](images\image-20240311160545443.png)

- 100ASK_T113s3-Pro开发板LinuxKernel设备树文件： **device/config/chips/t113/configs/100ask/board.dts**

![image-20240311160623153](images\image-20240311160623153.png)

可以在tina-sdk source后，在tina-sdk任意目录内执行 `cconfigs`命令直接切换到板级 Linux 设备树 和 配置文件目录。

![image-20240311170614919](images\image-20240311170614919.png)

- 100ASK_T113s3-Pro开发板设备树 board.dts 父级设备树名称 `sun8iw20p1.dtsi`

![image-20240311155903965](images\image-20240311155903965.png)

### 内核源码位置

- Linux-5.4内核源码：**lichee/linux-5.4**

![image-20240311155604678](images\image-20240311155604678.png)

可以在tina-sdk source后，在tina-sdk任意目录内执行 `ckernel`命令直接切换到linux内核源码目录下。

![image-20240311170943094](images\image-20240311170943094.png)

- 100ASK_T113s3-Pro开发板父级设备树  `sun8iw20p1.dtsi`所在位置  **lichee/linux-5.4/arch/arm/boot/dts**

![image-20240311160012185](images\image-20240311160012185.png)

可以在tina-sdk source后，在tina-sdk任意目录内执行 `cdts`命令直接切换到linux内核源码设备树目录下。

![image-20240311170845624](images\image-20240311170845624.png)

### env环境变量

- 100ASK_T113s3-Pro开发板启动环境变量：**device/config/chips/t113/configs/100ask/env.cfg**

![image-20240311164800885](images\image-20240311164800885.png)

### 设备树打包

boot_package.cfg 文件描述了，Linux内核设备树所在位置。

1. 为了在启动内核前更新参数到内核dts 和可以在U-Boot 控制台查看修改dts。按阶段划分可以分为使用内部dts 阶段和使用内核dts 阶段。如下图所示。

![image-20240311171632180](images\image-20240311171632180.png)

2. 可以通过命令set_working_fdt来切换当前生效的fdt。

```shell
[04.562]update bootcmd
[04.576]change working_fdt 0x7bebee58 to 0x7be8ee58
[04.587]update dts
Hit any key to stop autoboot: 0
=> set
set_working_fdt setenv setexpr
=> set_working_fdt 0x7bebee58
change working_fdt 0x7be8ee58 to 0x7bebee58
=>
```

> 参考：D1-H_Tina_Linux_U-Boot_开发指南.pdf

## 单独编译Linux

在TinaSDK内，单独编译LinuxKernel 只需要在源码 根 目录下执行 ` mkernel`命令即可开始针对于 kernel的编译操作，这里需要注意的是，mkernel  命令默认是没有生效的，您如果关闭了之前编译的终端/host系统，则需要重新 执行 `source build/envsetup.sh `命令来初始化 TinaSDK的编译环境。并且因为缓存问题，强烈建议 你 执行`make clean` 后执行，`lunch `命令，输入 4  重新选择我们的 **4. t113_100ask-tina** 单板 

``` shell
ubuntu@ubuntu1804:~/tina-d1-h$ source build/envsetup.sh 
Setup env done! Please run lunch next.
ubuntu@ubuntu1804:~/tina-d1-h$ lunch 

You're building on Linux

Lunch menu... pick a combo:
     1. d1-h_nezha_min-tina
     2. d1-h_nezha-tina
     3. d1s_nezha-tina
     4. t113_100ask-tina

Which would you like? [Default t113_100ask]: 4
============================================
TINA_BUILD_TOP=/home/ubuntu/tina-d1-h
TINA_TARGET_ARCH=arm
TARGET_PRODUCT=t113_100ask
TARGET_PLATFORM=t113
TARGET_BOARD=t113-100ask
TARGET_PLAN=100ask
TARGET_BUILD_VARIANT=tina
TARGET_BUILD_TYPE=release
TARGET_KERNEL_VERSION=5.4
TARGET_UBOOT=u-boot-2018
TARGET_CHIP=sun8iw20p1
============================================
clean buildserver
[2]+  Killed                  $T/tools/build/buildserver --path $T 2> /dev/null 1>&2
[1] 49529
ubuntu@ubuntu1804:~/tina-d1-h$ 
```

### 单独编译kernel

前面介绍，在TinaSDK 环境内，单独编译 Linux kernel只需要 `mkernel`一个命令即可，如下图所示：

```shell
ubuntu@ubuntu1804:~/tina-d1-h$ mkernel
===This's tina environment.===
special target, skip mboot,marisc
make[1]: Entering directory '/home/ubuntu/tina-d1-h'
make[2]: Entering directory '/home/ubuntu/tina-d1-h/target/allwinner'
make[3]: Entering directory '/home/ubuntu/tina-d1-h/target/allwinner/t113-100ask'
/home/ubuntu/tina-d1-h/scripts/kconfig.pl  + /home/ubuntu/tina-d1-h/target/allwinner/generic/config-5.4 /home/ubuntu/tina-d1-h/device/config/chips/t113/configs/100ask/linux/config-5.4 > /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.target
awk '/^(#[[:space:]]+)?CONFIG_KERNEL/{sub("CONFIG_KERNEL_","CONFIG_");print}' /home/ubuntu/tina-d1-h/.config >> /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.target
echo "# CONFIG_KALLSYMS_EXTRA_PASS is not set" >> /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.target
echo "# CONFIG_KALLSYMS_ALL is not set" >> /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.target
echo "CONFIG_KALLSYMS_UNCOMPRESSED=y" >> /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.target
/home/ubuntu/tina-d1-h/scripts/metadata.pl kconfig /home/ubuntu/tina-d1-h/tmp/.packageinfo /home/ubuntu/tina-d1-h/.config 5.4 > /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.override
/home/ubuntu/tina-d1-h/scripts/kconfig.pl 'm+' '+' /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.target /dev/null /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.override > /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.set
......
rm -f /home/ubuntu/tina-d1-h/out/t113-100ask/rootfs.img
rm -f /home/ubuntu/tina-d1-h/out/t113-100ask/usr.img
dd if=/home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/root.squashfs of=/home/ubuntu/tina-d1-h/out/t113-100ask/rootfs.img bs=128k conv=sync
282+1 records in
283+0 records out
37093376 bytes (37 MB, 35 MiB) copied, 0.0216129 s, 1.7 GB/s
( cd /home/ubuntu/tina-d1-h/out/t113-100ask ; find -maxdepth 1 -type f \! -name 'md5sums'  -printf "%P\n" | sort | xargs md5sum --binary > md5sums )
( cd /home/ubuntu/tina-d1-h/out/t113-100ask ; find -maxdepth 1 -type f \! -name 'md5sums'  -printf "%P\n" | sort | xargs openssl dgst -sha256 > sha256sums )
make[4]: Leaving directory '/home/ubuntu/tina-d1-h/target/allwinner/generic/image'
make[3]: Leaving directory '/home/ubuntu/tina-d1-h/target/allwinner/t113-100ask'
make[2]: Leaving directory '/home/ubuntu/tina-d1-h/target/allwinner'
make[1]: Leaving directory '/home/ubuntu/tina-d1-h'

#### make completed successfully (25 seconds) ####

```

如果你得 kernel没有修改，整个编译过程非常快，TinaSDK系统默认会检查配置文件，看是否有改动，如果有改动，则会编译改动位置，如果无改动，就会直接跳过进行后续的头处理 打包处理。

### Kconfig 配置方法
如果你需要修改内核配置项，可以在TinaSDK源码目录下执行 `make kernel_menuconfig`命令来进入到 内核的菜单选项界面。

对于menuconfig是一种图形化配置工具，这里以 `kernel menuconfig` 作为例子，讲解如何使用 Kconfig 基础配置方法。

首先我们进入 `kernel menuconfig`

```
make kernel_menuconfig
```
```shell
ubuntu@ubuntu1804:~/tina-d1-h$ make kernel_menuconfig
===This's tina environment.===
special target, skip mboot,marisc
export MAKEFLAGS= ;make V=ss -C target/allwinner menuconfig
make[1]: Entering directory '/home/ubuntu/tina-d1-h/target/allwinner'
make[2]: Entering directory '/home/ubuntu/tina-d1-h/target/allwinner/t113-100ask'
rm -f /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config.prev
rm -f /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.configured
/home/ubuntu/tina-d1-h/scripts/kconfig.pl  + /home/ubuntu/tina-d1-h/target/allwinner/generic/config-5.4 /home/ubuntu/tina-d1-h/device/config/chips/t113/configs/100ask/linux/config-5.4 > /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61/.config
export MAKEFLAGS= ;make -C /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61 -C /home/ubuntu/tina-d1-h/out/t113-100ask/compile_dir/target/linux-t113-100ask/linux-5.4.61 HOSTCFLAGS="-O2 -I/home/ubuntu/tina-d1-h/out/host/include -I/home/ubuntu/tina-d1-h/out/host/usr/include  -Wall -Wmissing-prototypes -Wstrict-prototypes" CROSS_COMPILE="arm-openwrt-linux-muslgnueabi-" ARCH="arm" KBUILD_HAVE_NLS=no KBUILD_BUILD_USER="" KBUILD_BUILD_HOST="" CONFIG_SHELL="bash" V=''  CC="arm-openwrt-linux-muslgnueabi-gcc" menuconfig
make[3]: Entering directory '/home/ubuntu/tina-d1-h/lichee/linux-5.4'
--define-variable argument does not have a value for the variable
--define-variable argument does not have a value for the variable
scripts/kconfig/mconf  Kconfig
configuration written to .config

*** End of the configuration.
*** Execute 'make' to start the build or try 'make help'.

make[3]: Leaving directory '/home/ubuntu/tina-d1-h/lichee/linux-5.4'
make[2]: Leaving directory '/home/ubuntu/tina-d1-h/target/allwinner/t113-100ask'
make[1]: Leaving directory '/home/ubuntu/tina-d1-h/target/allwinner'

#### make completed successfully (6 seconds) ####

```
这里就是 `kernel menuconfig` 的主目录。其具体的操作方法如下图所示。

![image-20220711114825681](images\image-20220711105637061.png)

我们再进入较为常用的 `Device Driver` ，看一下各个符号的含义。

![image-20220711115616754](images\image-20220711115616754.png)

其中，可以使用 `空格键` 选中各个选项，这里以 `Multimedia support` 选项为例：

![image-20220711120726186](images\image-20220711120726186.png)

也可以使用 `Y` `M` `N` 键来修改选项：

![image-20220711120802522](images\image-20220711120802522.png)

遇到被其他依赖选择的选项，可以查看 Help 页面检查被什么选项所依赖。

![image-20220711125703598](images\image-20220711121418636.png)

进入 Help 页面后，便可以查看这个选项的依赖情况。需要注意的是，有些选项是作为底层依赖无法随意取消，例如这里示例的 `Hardware Monitoring support` 选项。

![image-20220711125333193](images\image-20220711125333193.png)

Kconfig 所创建的界面还有一个功能，就是搜索功能，方便快速的找到目标选项。这里以搜索 LCD 屏幕 `icn6202` 驱动为例。

在 Kconfig 的界面中按 `/` 键，进入搜索页面。

![image-20220711130647390](images\image-20220711130647390.png)


### Kconfig修改配置示例

调整 kernel打印等级默认为7

![image-20240312191931286](images\image-20240312191931286.png)

默认不知道 kernel的printk打印等级配置在哪里，通过搜索得到路径，上面那个  Enable support for printk 并不是 我们要找到的 调整系统默认打印等级的配置项。继续往下，找到了 一个 Delay each boot printk message by N milliseconds 通过查看这个也不是，这个配置和是 用来 调整 因为系统信息显示过快 而 调整 每个 printk的打印间隔时间的。

还有一个 Early printk  看着类似，但是也不是，不过我们可以大概 知道 是在  Kernel hacking这个 类目内，

![image-20240312192151522](images\image-20240312192151522.png)



![image-20240312192917118](images\image-20240312192917118.png)

![image-20240312192951669](images\image-20240312192951669.png)

CONFIG_MESSAGE_LOGLEVEL_DEFAULT

![image-20240312193020080](images\image-20240312193020080.png)

![image-20240312193152213](images\image-20240312193152213.png)

![image-20240313095953057](images\image-20240313095953057.png)



![image-20240312193802741](images\image-20240312193802741.png)

### 打包kernel

编译完成后，执行 `pack` 命令即可开始打包系统操作，打包完成后，最后会 提示 **pack finish** 以及使用 红色背景色 告诉你 最终输出的镜像文件。

我们通过 ssh / vmware 拖拽等工具，将其 copy 出来即可。

![image-20240312193833770](images\image-20240312193833770.png)

### 烧写更新

根据之前烧写的文章进行镜像烧录操作。

### 启动验证

启动系统后，执行 `cat /proc/sys/kernel/printk`来查看系统默认是否已经把 printk 打印等级调整到了最高。如果如下图 红色箭头 7 所示，就表示已经成功。

![image-20240313100416526](images\image-20240313100416526.png)



## 增加一个已有的内核模块

7寸1024x600分辨率+电容触摸屏：https://item.taobao.com/item.htm?id=611156659477&

### 查看原理图

![image-20240713175858442](images/image-20240713175858442.png)

![image-20240313155539238](images\image-20240313155539238.png)

通过对比原理图，可以得到触摸屏信号和主控 对应的引脚关系为如下表格所示：

| 电路图引脚标号 | T113s3引脚名 |
| -------------- | ------------ |
| CTP_INT        | PE1          |
| CTP_RST        | PE0          |
| RPI_SCL        | PE12         |
| RPI_SDA        | PE13         |

> 注意：此内容假设您已经了解I2C驱动开发，熟悉input子系统，可以看懂电路图等基础，如果不具备 建议 观看 韦老师的视频 I2C子系统开发 https://ldd.100ask.net/04_I2C/01/     Input子系统开发： https://ldd.100ask.net/05_Input/04_5/ 
>
> 全志TinaSDK TWI 开发参考文档： https://tina.100ask.net/SdkModule/Linux_TWI_DevelopmentGuide-01/

通过查看数据手册  **T113-s3_datasheet_v1.6.pdf**  P41 可以看出来，PE12 PE13  复用模式为 function2 时为 I2c(全志这里叫TWI) ，由此 我们知道 需要在内核设备树内 twi2 节点下进行初始化，并增加 gt911 触摸设备书节点。

![image-20240313103637616](images\image-20240313103637616.png)



### 确认设备树

> TinaSDK dts设备树语法定义使用等可以参考文档： https://tina.100ask.net/SdkModule/Linux_Deploy_DevelopmentGuide-03/  如果希望深入学习 dts 可以参考视频深入学习 https://www.100ask.net/video/detail/p_5e61a9f374112_5P2wQoy0

在最开始我们知道内核的设备树文件在  **device/config/chips/t113/configs/100ask/**  目录下，名为  board.dts ，通过 vim /gedit等工具编译 board.dts文件

1. 先找到 引脚定义 `&pio `节点，在里面添加 **twi2**  引脚复用，把PE12 PE13 复用为 twi2 模式。
2. 在底部增加 &twi2  节点路径，并参考其他节点设置，将其启用。
3. 节点内 增加 我们的gt911 触摸屏的触摸设备节点，并根据节点属性 和实际的 屏幕参数 添加对应值，需要 注意 **ctp_int_port** 就是我们的 **CTP_INT** 引脚，**ctp_wakeup** 就是我们原理图上 **CTP_RST** 引脚。
4. 保存后，退出即可，**需要注意的是，如果您自行添加 类似的触摸屏节点，则需要检查一下 你增加的 设备树节点 引脚 是否和默认的存在冲突，如果存在冲突需要解决后 才能正确添加并使用**。


```shell
&pio {
		twi2_pins_a: twi2@0 {
                pins = "PE12", "PE13";
                function = "twi2";
                drive-strength = <10>;
        };

        twi2_pins_b: twi2@1 {
                pins = "PE12", "PE13";
                function = "gpio_in";
        };
};
```
![image-20240313103917890](images\image-20240313103917890.png)


``` shell
&twi2 {
        clock-frequency = <400000>;
        pinctrl-0 = <&twi2_pins_a>;
        pinctrl-1 = <&twi2_pins_b>;
        pinctrl-names = "default", "sleep";
        dmas = <&dma 45>, <&dma 45>;
        dma-names = "tx", "rx";
        status = "okay";

        ctp@14 {
                compatible = "allwinner,goodix";
                device_type = "ctp";
                reg = <0x14>;
                status = "okay";
                ctp_name = "gt9xxnew_ts";
                ctp_twi_id = <0x2>;
                ctp_twi_addr = <0x14>;
                ctp_screen_max_x = <0x400>;
                ctp_screen_max_y = <0x258>;
                ctp_revert_x_flag = <0x0>;
                ctp_revert_y_flag = <0x0>;
                ctp_exchange_x_y_flag = <0x0>;
                ctp_int_port = <&pio PE 1 GPIO_ACTIVE_HIGH>;
                ctp_wakeup = <&pio PE 0 GPIO_ACTIVE_HIGH>;
        };
};
```
![image-20240713180129301](images/image-20240713180129301.png)

​	在TinaSDK 内Linux kernel的设备树 会默认和 boot0  uboot optee保存在一起，以便加速启动，所以 没有办法 单独编译设备树，去打包升级，我们只能通过在TinaSDK目录下使用  make 命令 来打包整个系统 系统会自动帮你编译 Linux设备树文件。

### 配置内核模块

在上一章节，介绍了如何使用Kconfig修改配置，举例使用在 tina-sdk 源码目录下 通过 `make kernel_menuconfig`命令直接进入内核菜单选项，进行配置内核选项，但是这种做法，只能保证本次编译有效，一旦使用了 make distclean 或者 make clean 过内核源码目录缓存，配置就会失效。

在TinaSDK 里面，整套编译系统框架基于 openwrt 14版本进行扩展支持，所以在内核选项配置层面，也延续了 原有的编译修改方式。如果我们需要修改内核配置项，并保存生效，则需要了解清楚openwrt对内核模块/配置文件是如何进行处理的。

----

内核默认配置文件在 `device/config/chips/t113/configs/100ask/linux/`目录下，一般情况下原厂提供SDK都会提供，默认的config文件和 tinasdk的关联性很强，一般情况下不能直接去 修改这里的 config文件，修改过后导致你编译kernel时出现很多选项依赖问题。

如果遇到修改内核配置并保存，我们应该如何操作呢？

![image-20240313115107879](images\image-20240313115107879.png)

如下所示，我们以增加 选择 默认支持的 gt911驱动模块为例，不使用` make kernel_menuconfig`进入内核菜单配置界面，而是直接在 TinaSDK源码根目录下 执行 `make  menuconfig` 进入 到 kernel modules 一层层找到 我们的 驱动模块。

你可以理解为 TinaSDK 帮我们提前把 模块之间的依赖都处理好了，我们只需要选择 使用那个模块就可以。

![image-20240313114507875](images\image-20240313114507875.png)



如上所示，TinaSDK提前帮我们把内核模块配置项依赖关系帮我们处理好了，那么在哪里处理呢？  对于我们的100ASK_T113s3-Pro开发板 在 **target/allwinner/t113-common/**目录内  这里有个 **modules.mk** 文件。

![image-20240313114950590](images\image-20240313114950590.png)

打开 **modules.mk**文件 找到 gt911驱动模块驱动的TinaSDK选项位置，可以看到如下图所示，系统已经帮我们提前配置好了 这个模块的依赖关系，以及生成的模块驱动，我们只需要 在TinaSDK config内选中就可以直接用了。

![image-20240313114851690](images\image-20240313114851690.png)

配置成功后，保存推出主界面，就可以继续执行 `make `命令来完整的编译系统了。

### 编译打包 

编译完成后，执行 `pack` 命令即可开始打包系统操作，打包完成后，最后会 提示 **pack finish** 以及使用 红色背景色 告诉你 最终输出的镜像文件。

我们通过 ssh / vmware 拖拽等工具，将其 copy 出来即可。

![image-20240312193833770](images\image-20240312193833770.png)

### 烧录更新

根据之前烧写的文章进行镜像烧录操作。

### 重启验证

首先：确保屏幕和100ASK_T113s3-Pro 开发板 fpc连接好,屏幕背光启动后会自动亮，等待系统启动，

启动过程中，可以看到 一些 关于gt9xx 模块的装载信息

![image-20240313153253036](images\image-20240313153253036.png)

当一个系统内有很多input输入设备在dev目录下可看到很多个 event 节点，我们不知道设备之间对应关系，就可以执行 `cat /proc/bus/input/devices` 来查看你得设备具体对应的 event节点是那个。

![image-20240313154053759](images\image-20240313154053759.png)

通过下图，列出了系统所有的input 设备，可以看到 蓝框所示，是我们的 gt9xx驱动模块，对应的 event节点是2.

![image-20240313154025014](images\image-20240313154025014.png)

此时通过 `cat  /dev/input/event2`命令，同时手放在触摸屏上，就可以看到触摸驱动已经正常，硬件也正常，但是我们现在没有 tslib / ui工具来验证 坐标是否和实物一致，后期可以通过 libinput evtest等开源工具进行验证。

![image-20240313154341955](images\image-20240313154341955.png)

