---
sidebar_position: 2
---
# Linux Kernel简介

## 0. Linux历史

**Linux内核**（英語：Linux kernel）是一种开源的[类Unix](https://zh.wikipedia.org/wiki/类Unix系统)[操作系统](https://zh.wikipedia.org/wiki/操作系统)[宏内核](https://zh.wikipedia.org/wiki/宏内核)。整个Linux操作系统家族基于该内核部署在传统计算机平台（如个人计算机和服务器，以Linux发行版的形式[[7\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-7)）和各种嵌入式平台，如[路由器](https://zh.wikipedia.org/wiki/路由器)、[无线接入点](https://zh.wikipedia.org/wiki/無線接入點)、[专用小交换机](https://zh.wikipedia.org/wiki/专用小交换机)、[机顶盒](https://zh.wikipedia.org/wiki/机顶盒)、[FTA接收器](https://zh.wikipedia.org/w/index.php?title=FTA接收器&action=edit&redlink=1)、[智能电视](https://zh.wikipedia.org/wiki/智能电视机)、[数字视频录像机](https://zh.wikipedia.org/wiki/数字视频录像机)、[网络附加存储](https://zh.wikipedia.org/wiki/网络附加存储)（NAS）等。工作于[平板電腦](https://zh.wikipedia.org/wiki/平板電腦)、[智能手机](https://zh.wikipedia.org/wiki/智能手机)及[智能手表](https://zh.wikipedia.org/wiki/智能手表)的[Android](https://zh.wikipedia.org/wiki/Android)操作系统同样通过Linux内核提供的服务完成自身功能。尽管于[桌面电脑](https://zh.wikipedia.org/wiki/桌面電腦)的占用率较低，基于Linux的操作系统统治了几乎从移动设备到主机的其他全部领域。截至2017年11月，世界前500台最强的[超级计算机](https://zh.wikipedia.org/wiki/超级计算机)全部使用Linux。

**Linux内核最早是于1991年由芬兰黑客[林納斯·托瓦茲](https://zh.wikipedia.org/wiki/林納斯·托瓦茲)为自己的个人电脑开发的**，他当时在[Usenet新闻组](https://zh.wikipedia.org/wiki/新闻组)`comp.os.minix`登载帖子[[9\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-9)，这份著名的帖子标志着Linux内核计划的正式开始。如今，该计划已经拓展到支持大量的计算机体系架构，远超其他操作系统和内核。它迅速吸引了一批开发者和用户，利用它作为其他自由软件项目的核心，如著名的 GNU 操作系统。[[10\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-10)而今天，Linux 内核已接受了超过1200家公司的近12000名程序员的贡献，其中包括一些知名的软硬件发行商。[[11\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-11)[[12\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-12)

从技术上说，**Linux 只是一个符合[POSIX 标准](https://zh.wikipedia.org/wiki/POSIX)的内核**。它提供了一套应用程序接口（API），通过接口用户程序能与内核及硬件交互。仅仅一个内核并不是一套完整的操作系统。有一套基于 Linux 内核的完整操作系统叫作[Linux 操作系统](https://zh.wikipedia.org/wiki/Linux)，或是[GNU/Linux](https://zh.wikipedia.org/wiki/GNU/Linux)（在该系统中包含了很多[GNU 计划](https://zh.wikipedia.org/wiki/GNU計劃)的系统组件）。

**Linux 内核是在[GNU通用公共许可证](https://zh.wikipedia.org/wiki/GNU通用公共许可证)第2版之下发布的[[4\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-COPYING-4)（加上一些非自由[固件](https://zh.wikipedia.org/wiki/固件)、[blob](https://zh.wikipedia.org/wiki/二進位大型物件)与各种非自由许可证[[13\]](https://zh.wikipedia.org/wiki/Linux内核#cite_note-13)），是一个开源项目协作的突出例子**。它的版本支持根据版本最长可达6年，貢獻者遍佈世界各地，日常开发相关的讨论在[Linux 内核邮件列表](https://zh.wikipedia.org/w/index.php?title=Linux_内核邮件列表&action=edit&redlink=1)上。

![image-20240307113610041](images\image-20240307113610041.png)

- 上图左面为 Linux logo    右边  Linux祖师爷 Linus本人

### Linux版本资料

* LinuxKernel官网：https://www.kernel.org/  我们一般称Linux官网里面的 Kernel为 主线社区版本。

![image-20240307113906658](images\image-20240307113906658.png)

- 在官网里面 我们需要了解  `mainline  stable  longterm  linux-next` 有什么区别？
- **Mainline：**
  - **特点：** 主线分支是 Linux 内核的主要开发分支，包含最新的开发和功能更新。
  - **目的：** 主要用于推动新功能、改进和实验性的变化。这是开发者提交新代码和功能的主要目标。
- **Stable：**
  - **特点：** 稳定分支是为了提供一个相对较稳定的内核版本，以便企业、发行版制造商和普通用户可以依赖这个版本。
  - **目的：** 稳定分支通常用于修复主线分支中发现的 bug，并且只接受 bug 修复而不引入新功能。这有助于确保长期支持。
- **Longterm：**
  - **特点：** 长期支持 (LTS) 分支是一个更加长期维护的版本，为用户提供相对较长的支持周期。
  - **目的：** LTS 分支通常用于企业和发行版制造商，以提供更长的稳定性和支持，避免频繁的升级。
- **Linux-next：**
  - **特点：** linux-next 分支包含下一个开发周期中的补丁和功能，但这些变化还未进入主线。
  - **目的：** linux-next 提供了一个预览下一个内核版本的机会，以帮助开发者和测试人员在它们进入主线之前发现和解决潜在问题。

总的来说，这些分支在内核开发过程中起到不同的作用，主线用于主要开发，稳定分支用于提供相对较稳定的版本，长期支持分支用于提供更长时间的支持，而 linux-next 则提供一个预览未来开发方向的分支。开发者和用户可以根据其需求选择相应的内核分支。

#### 版本发布周期

- Linux版本发布周期： https://www.kernel.org/category/releases.html

![image-20240307114010886](images\image-20240307114010886.png)

#### 开发方式

- Linux Kernel的开发模式
  - 关注 Merge window （窗口合并期-两周）
  - Bug-fixing period （Bug修复期-6-10周）
  - rc版本[^1] （发布候选版）


![image-20240307114124845](images\image-20240307114124845.png)

#### 文档资料

* LinuxKernel文档中心：https://www.kernel.org/doc/html/latest/

![image-20240307114434348](images\image-20240307114434348.png)

* wiki中心：https://www.wiki.kernel.org/

![image-20240307114442387](images\image-20240307114442387.png)

- 深入介绍每个内核版本的新功能：https://kernelnewbies.org/LinuxChanges

![image-20240307114850995](images\image-20240307114850995.png)

- 每个合并窗口接受的特征讨论说明：https://lwn.net/Kernel/ 

![image-20240307114908758](images\image-20240307114908758.png)

- LinuxKernel PATCH中心：https://patchwork.kernel.org/

![image-20240307114943253](images\image-20240307114943253.png)

- 使用 git 工具阅读理解Linux 代码

![image-20240307115041451](images\image-20240307115041451.png)

* git log --grep=‘imx6ull’ 根据提交信息关键字搜索。

![image-20240307115053908](images\image-20240307115053908.png)

- 根据commit查看详细的提交说明：查看Merge合并提交信息。

- git show –m commit 显示某次Merge合并的详细修改信息。

![image-20240307115109476](images\image-20240307115109476.png)

- 通过使用git命令 查看imx6ull ubi文件系统挂载错误问题，git log –grep ‘imx6ull’ --oneline 如何解决，找到对应的  commit id 最前面 黄色 id 值。

![image-20240307115454436](images\image-20240307115454436.png)

- 确定好提交的commit id值以后 使用 git log –p -1 e4817a1b6b77 来查看详细的操作内容

![image-20240307115251476](images\image-20240307115251476.png)

## 1. Linux内核开发流程

### 构建Linux内核流程

主要分为两部分

1. 环境配置： 选择合适的编译主机环境 系统非常重要
   1. 安装对Linux内核源码构建所需的环境依赖
   2. 设置你需要构建的目标单板的架构 工具链
2. 内核构建
   1. make构建可以给bootloader使用的 内核镜像
   2. make构建 dtb设备树文件（可选 `x86架构不需要`）
   3.  make 构建内核模块驱动
   4. 安装到合适的位置，替换原有的版本

![image-20240307115608709](images\image-20240307115608709.png)

1. Host下配置开发环境

   - 安装必要依赖包
   
   
      - 解压配置合适的工具链
   
2. 获取配套的交叉编译工具链

   - SOC原厂提供: NXP ST  Rockchip Amlogic Allwinnertech 等。
   
   
      - 社区下载： Linrao Debian ARM Bootlin
   
3. 下载kernel源码

   - 获取Linux Kernel主线LTS源码

     - Git方式获取: git clone https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git

     - 压缩版下载: https://mirrors.edge.kernel.org/pub/linux/kernel/
   
   
      - 获取芯片原厂Kernel源码
   
4. 指定编译板子配置文件 `make BOARDNAME_defconfig`

5. 编译

   - 编译内核镜像 `make –jN`
   
   
      - 编译设备树`make dtbs`
   
   
      - 编译安装模块驱动 `make modules`
   
6. 安装驱动模块至目标kernel位置


### 获取适合的Linux内核

Kernel源码区别

- Linus Torvalds 发布的 Linux 内核的官方（主线）版本可在 https://kernel.org 获得。

  - 这些版本遵循内核的开发模式流程。但是，它们可能尚未包含特定领域的最新特性。某些开发中的功能可能尚未准备好用于主线版本。

- 许多芯片供应商提供自己的内核源

  - 他们优先关注硬件支持。与主线 Linux 有一个非常重要的增量支持。
  - 仅在主线还没有支持时有用。 许多SOC供应商同时投入于主线内核开发。
  
- 许多内核子社区维护自己的内核版本，通常具有更新 但不够稳定。

  - 架构社区（ARM、MIPS、PowerPC 等）、设备驱动社区（I2C、SPI、USB、PCI、网络等），其他社区（如real-time等）

  - 无官方发布，仅用于分享工作和为主线版本做出贡献。

## 2. 使用主线Linuxkernel演示

### 1. 获取主线Linuxkernel

- 所有版本压缩包下载：https://kernel.org/pub/linux/kernel/

![image-20240307120213924](images\image-20240307120213924.png)

- Git仓库源码地址：git clone https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git 

![image-20240307120230164](images\image-20240307120230164.png)

### 2. Kernel源码目录作用

| kernel源码目录 | 目录功能作用介绍                           |
| -------------- | :----------------------------------------: |
| **arch**       | 包含体系结构的文件。子目录下有不同的架构。 |
| **Documentation** | 包含内核文档。如果您想找到有关 Linux 某个方面的更多信息，可以直接从这里寻找 |
| **drivers** | 包含设备驱动程序 - 数以千计。 有一个每种驱动程序的子目录。 |
| **fs** | 包含文件系统代码。 |
| **include** | 包含内核头文件，包括那些工具链需要的文件。 |
| **init** | 包含内核启动代码。 |
| **kernel**： | 包含核心功能，包括调度、锁、定时器、电源管理和调试/代码跟踪等。 |
| **mm** | 包含内存管理。 |
| **net** | 包含网络协议。 |
| **scripts** | 包含许多有用的脚本，包括设备树编译器 (DTC)等。 |
| **tools** | 包含许多有用的工具，包括 Linux 性能计数器工具 perf，分析和追踪等。 |

### 3. 配置Kernel编译环境

#### 1. 安装Host依赖

- Ubuntu16+ 系统 LinuxKernel编译依赖

> sudo apt-get install libc6-armel-cross libc6-dev-armel-cross libncurses5-dev build-essential bison flex libssl-dev bc libelf-dev

#### 2. 设置ARCH

首先，指定要构建的内核的架构将 ARCH 设置为 arch/ 下的目录名称：` export ARCH=arm` 默认情况下，内核构建系统假定内核是为主机架构配置和构建的（在我们的例子中为 x86，那么ARCH默认就是x86)。内核构建镜像时将使用此设置。使用目标架构的配置项。使用目标架构的源代码和头文件编译内核。

![image-20240307120502837](images\image-20240307120502837.png)

#### 3. 设置 CROOS_COMPILE

在编译镜像时，内核Makefile调用的编译器是`$(CROSS_COMPILE)gcc` 在配置时需要已经指定过编译器，因为某些内核配置选项取决于编译器的功能。

- 本地编译时: 保持CROSS_COMPILE 变量未定义，内核将使用 默认的gcc 为主机架构进行本地编译。

- 使用交叉编译器时: 为了与本机编译器有所不同，交叉编译器名称的可执行文件以 目标系统、体系结构或着有时是库的名称作为前缀。例如：
  - mips-linux-gcc ：前缀名称是 mips-linux-
  -  arm-linux-gnueabi-gcc ：前缀名称是 arm-linux-gnueabi-
  -  riscv64-unknown-linux-gnu-gcc : 前缀名称是 riscv64-unknown-linux-gnu- 
  - 因此，您可以按如下方式指定您的交叉编译器：export  CROSS_COMPILE=arm-linux-gnueabi-

> CROSS_COMPILE 其实就是交叉编译工具的前缀名称（gcc、as、ld、objcopy、strip...）。

实际上有两种定义 ARCH 和 CROSS_COMPILE 的方式：

- 方式一：在 make 命令行上传递 ARCH 和 CROSS_COMPILE ：

  - `make  ARCH=arm CROSS_COMPILE=arm-linux- ...`

  - 缺点：当您运行任何 make 命令时很容易忘记传递这些变量，从而导致您的构建和配置被破坏。

- 方式二：定义 ARCH 和 CROSS_COMPILE 作为系统环境变量：

  - `export ARCH=arm   export CROSS_COMPILE=arm-linux-`

  - 缺点：它只能在当前 shell 或终端内工作。 您可以将这些设置放在每次开始处理项目时都提供的 文件中。 如果您只使用始终相同的工具链在单一架构上工作，您甚至可以将这些设置放在您的`  ~/.bashrc `文件中，使它们在任何终端上永久可见,设置后使用` source ~/.bashrc `命令生效。

### 3. 指定目标单板配置

一开始我们很难找到哪种内核配置完全适用于您的硬件和根文件系统，那么可以从如下两个方面入手。

1. 对于PC桌面设备或服务器设备：
   - 建议从配置您正在运行的内核开始，通常可以在 /boot目录下找到  cp /boot/config-`uname -r` .config

2. 嵌入式平台案例（至少是 ARM 32 位）：
   - 默认配置文件可用，通常适用于每个 CPU 系列。
   - 它们存储在 `arch/<arch>/configs/` 中 ，并且只是最小的 .config 文件（仅与默认设置有一些不同）。
   - 运行 make help 以查找是否可用于您的平台。要加载默认配置文件，只需运行。 ` make  <CPU>_defconfig` 这将覆盖您现有的 .config 文件！

配置之后，可以进入配置菜单界面进行配置更改（make menuconfig  默认可以不用修改）。

![image-20240307120628998](images\image-20240307120628998.png)

### 4. 编译安装内核

#### 1. 编译内核镜像

在配置完成上述 步骤后，需要在内核源码目录中执行。下执行 `make `命令即可开始编译内核镜像。对于x86架构 或者本地目标单板环境，我们不用过多关心是否包含参数问题，但是在嵌入式设备，因为不同的芯片厂家支持的 内核 镜像格式不同，所以我们需要在编译内核镜像之前 先确定 bootloader 支持引导的内核镜像是那种！

- 如果您有多个 CPU 内核/线程，请记住个数。同时我们建议：ncpus * 2 或 ncpus + 2，以最大化利用CPU 和 I/O资源。
  - 示例(4个CPU/单核四线程)：make -j 8

- 编译内核无需以 root 身份运行！

- 如需要 更快地重新编译：
  - 使用 ccache 编译器缓存：export  CROSS_COMPILE="ccache riscv64-linux-"

#### 2. 确认内核镜像

| 内核镜像名称 | 内核镜像功能作用                                                |
| :-----: | :--------------------------------------------------------: |
| vmlinux | 未压缩的原始内核映像，ELF 格式，用于调试目的，但无法启动。 |
| `arch/<arch>/boot/*Image` | 通常是最终可以启动的压缩后的内核镜像文件 |
| `arch/<arch>/boot/bzImage` | for x86, |
| `arch/<arch>/boot/zImage` | for ARM, |
| `arch/<arch>/boot/Image.gz` | for RISC-V, |
| `arch/<arch>/boot/vmlinux.bin.gz` | for ARC等。 |
| `arch/<arch>/boot/Image` | 也可以引导的未压缩内核映像。 |
| `arch/<arch>/boot/dts/*.dtb` | 编译的设备树文件（某些架构）。 |


#### 3. 安装内核镜像

本地安装: `sudo make install` 是否默认为主机系统安装

- 安装至 `/boot/vmlinuz-<version>`

- 压缩的内核映像。 与 `arch/<arch>/boot` 中的相同

- `/boot/System.map-<version>` 为调试目的存储内核符号地址（已过时：此类信息通常存储在内核本身中）

- `/boot/config-<version>` 此版本的内核配置

- 在 GNU/Linux 发行版中，通常会重新运行Boot-Loader配置程序，以使新内核在下次引导时可用。

嵌入式设备安装

- make install 在嵌入式开发中很少使用，因为内核镜像是单个文件，易于处理。另一个原因是没有标准的方式来部署和使用嵌入式设备内核映像。

- 因此，使内核映像对目标可用通常是手动的或通过构建系统中的脚本完成。

- 可以自定义 make install 程序 `arch/<arch>/boot/install.sh`

#### 4. 编译安装设备树

内核源码目录下执行 `make dtbs`

- 目标单板所需的硬件设备信息。

- 一般用于嵌入式设备。

- 设备树文件要与目标单板配套。

- 设备树文件一般和内核镜像存放同一位置。

![image-20240307120923939](images\image-20240307120923939.png)


#### 5. 编译安装内核模块

使用Linux模块的优势

- 使用内核模块可以支持更多不同的设备外设。

- 模块使无需重启即可轻松开发驱动程序：加载、测试、卸载、重建、加载...

- 有助于将内核映像大小保持在最小（在 PC 的 GNU/Linux 发行版中必不可少）。

- 对于减少启动时间也很有用：您无需花时间初始化稍后才需要的设备和内核功能。

- 注意：一旦加载，在系统中拥有完全控制权和权限。 没有特别的保护。 这就是为什么只有 root 用户才能加载和卸载模块。

- 为了提高安全性，可以只允许签名模块，或完全禁用模块支持。

编译驱动模块命令 在内核源码目录下执行  `make modules`

- 内核映像是一个单一文件，由与配置中启用的功能相对应的所有目标文件链接而成。这是由引导加载程序加载到内存中的文件。

- 因此，一旦内核启动，所有包含的功能都可用，此时不存在文件系统概念。但是，某些功能（设备驱动程序、文件系统等）都可以编译为模块。这些是可以动态加载/卸载，在内核添加/删除功能的插件。

- 每个驱动模块在文件系统中存储为一个单独的文件，因此必须访问文件系统才能使用驱动模块。

- 这在内核的早期引导过程中是不可用的，因为没有可用的文件系统。

本地主机模块驱动: `sudo make modules_install`

- 默认为主机系统安装，所以需要以root身份运行

- 将所有模块安装在 `/lib/modules/<version>/kernel/Module .ko`（内核对象）文件，与源文件的目录结构相同。

- `modules.alias, modules.alias.bin` 模块加载实用程序的别名。 用于查找设备的驱动程序。 示例：
- 别名 usb:v066Bp20F9d*dc*dsc*dp*ic*isc*ip*in* asix modules.dep, modules.dep.bin
  
- 模块依赖 modules.symbols, modules.symbols.bin 告诉给定符号属于哪个模块。

嵌入式主机模块驱动

- 在嵌入式开发中，您不能直接使用 make modules_install 。因为它会把驱动模块安装在本地主机上的 /lib/modules 中。

- 此时需要指定 INSTALL_MOD_PATH 变量来生成模块相关文件并将模块安装在 `<目标根文件系统>` 而不是您的 `<主机根文件系统>`中。示例命令：
  - `make INSTALL_MOD_PATH=<dir>/  modules_install`

### 5. 清理编译缓存

- 清理生成的文件（有时在切换版本之前很有用，以避免未跟踪的输出文件，或强制重新编译）：`make clean`

- 删除所有生成的文件。 从一种架构切换到另一种架构时需要。 注意：它还会删除您的 .config 文件！`make mrproper`

- 同时删除编辑器备份和补丁拒绝文件（主要是生成补丁）：`make distclean`

- 如果您在 git 树中，删除 git 未跟踪（和忽略）的所有文件： `git clean -fdx`

## 3. 如何启动Kernel

启动 Linux 内核通常是由引导加载程序（Boot Loader）来完成的。引导加载程序负责加载内核镜像并将控制权转交给内核，从而启动操作系统。以下是一般情况下 Linux 内核启动的主要步骤：

1. **引导加载程序的配置：**
   - 首先，你需要选择和配置引导加载程序。一些常见的引导加载程序包括 GRUB、LILO、Syslinux  uboot 等。这些引导加载程序有不同的配置文件，用于指定内核的位置和启动参数。
2. **内核镜像的位置：**
   - 内核镜像通常位于系统的引导分区中，例如 `/boot` 目录。引导加载程序需要知道内核的位置以及如何加载它。
3. **引导加载程序加载内核：**
   - 引导加载程序通过读取配置文件，找到内核镜像的位置，然后将内核加载到系统内存中。这通常涉及到加载 `vmlinuz` 或 `bzImage` 文件。
4. **内核初始化：**
   - 一旦内核加载到内存，控制权就会转交给内核。内核开始执行初始化过程，设置硬件、初始化内存管理、加载必要的驱动程序等。
5. **用户空间初始化：**
   - 内核完成初始化后，启动用户空间。通常，第一个用户空间程序是 `/sbin/init` 或 `/usr/lib/systemd/systemd`，它是用户空间的第一个进程。
6. **用户空间初始化完成：**
   - 一旦用户空间初始化完成，系统就会进入可操作状态，用户可以登录并开始使用操作系统。

### 1. 使用uboot引导嵌入式设备

嵌入式设备启动 Linux 内核的过程与常规计算机有些许不同，通常涉及到特定的引导加载程序和启动方式。以下是一个简化的嵌入式 Linux 内核启动过程的步骤：

1. **引导加载程序：**
   - 嵌入式系统通常使用特定的引导加载程序，例如 U-Boot（Universal Boot Loader）或 Barebox。这些引导加载程序能够加载内核映像并配置启动参数。
2. **配置引导加载程序（ENV）：**
   - 在引导加载程序中，需要配置引导命令，指定内核映像的位置、启动参数以及设备树（Device Tree）等信息。这通常在引导加载程序的环境变量中进行配置。
3. **加载设备树（Device Tree）：**
   - 对于许多嵌入式系统，设备树是一个重要的概念。设备树描述了硬件的结构和配置信息，使得相同的内核映像可以在不同的硬件平台上运行。引导加载程序可能会加载设备树文件并传递给内核。
4. **加载内核映像：**
   - 引导加载程序通过网络、存储设备或其他途径加载 Linux 内核映像到内存中。这通常是 zImage 或 Image 文件。
5. **设置启动参数(bootargs)：**
   - 引导加载程序设置启动参数，例如 root 文件系统的位置、内核命令行参数等。这些参数可能包括根文件系统的位置、内核的命令行参数等 。
6. **转交控制权给内核：**
   - 引导加载程序将控制权转交给内核，使得内核可以开始执行。内核初始化过程中会进行硬件初始化、加载驱动程序等操作。
7. **用户空间初始化：**
   - 内核初始化完成后，启动用户空间进程。这可能涉及到使用 init 程序或其他初始化系统(busybox)。
8. **用户空间操作系统启动：**
   - 一旦用户空间初始化完成，操作系统开始运行，用户可以开始使用嵌入式系统(APP)。

因此，典型的启动过程是：

1. 在内存中的地址 X 加载 zImage

2. 在内存中的地址 Y 加载`<board>.dtb`

3. 用bootz X – Y 启动内核（中间的 - 表示没有 initramfs）

### 2. kernel启动命令行参数

Kernel command line是一行字符串，是由内核传递给内核用来启动，通常情况下可以通过设置u-boot内bootargs变量来传递kernel 命令行，它也可以在设备树中定义或者在内核配置 CONFIG_CMDLINE 中进行设置。除了编译时配置外，无需重新编译内核也可以使用命令来设置 kernel command line

内核命令行是一个字符串，它定义了内核的各种参数：

| 参数 | 参数含义                                                  |
| --------- | ------------------------------------------------------------ |
| init=     | 从挂载的根文件系统运行的 init 程序，默认为 /sbin/init。      |
| loglevel= | 将控制台日志级别设置为最高级别 8，以确保您会在控制台上看到所有内核消息。 |
| panic=    | 内核恐慌时的如果大于零，则给出重新启动前的秒数； 如果为零，则永远等待（这是默认值)； 或者如果它小于零，它会立即重新启动。 |
| root= | 挂载根文件系统的设备 |
| console= | 用于内核消息输出的目的地。 |
| quiet= | 将控制台日志级别设置为静默，抑制除紧急消息。由于大多数设备都有串行控制台，因此需要是时候输出所有这些字符串了。减少了使用此选项的消息可减少启动时间。 |
| rdinit= | 从 ramdisk 运行的 init 程序。它默认为 /init |
| ro | 以只读方式安装根设备。对虚拟磁盘没有影响，这始终是读/写。 |
| rootdelay= | 尝试挂载根设备前等待的秒数；默认为零。 |
| rootfstype= | 根设备的文件系统类型。在许多情况下，挂载时会自动检测，但 jffs2 需要文件系统。 |
| rootwait | 无限期等待检测到root设备。通常需要 MMC 设备。 |
| rw | 以读写方式挂载根设备（默认）。 |

例子：`console=ttyS0 root=/dev/mmcblk0p2 rootwait` 更多的配置说明参考内核文档中的 admin-guide/kernel-parameters.txt


Linux 内核命令行是在启动时传递给内核的一组参数，用于配置内核的行为。这些参数通常由引导加载程序传递给内核，并在初始化过程中生效。以下是一些常见的 Linux 内核命令行参数及其用途：

1. **`root=`：**
   - 指定根文件系统的设备或分区。例如，`root=/dev/sda1` 表示根文件系统在 `/dev/sda1` 分区上。
2. **`ro` 和 `rw`：**
   - `ro` 表示以只读模式挂载根文件系统，而 `rw` 表示以读写模式挂载。默认情况下，通常是 `rw`。
3. **`console=`：**
   - 指定系统控制台的位置，例如 `console=ttyS0,115200` 表示使用串口设备作为控制台，波特率为 115200。
4. **`init=`：**
   - 指定用户空间初始化程序的路径。例如，`init=/sbin/init` 指定使用 `/sbin/init` 程序作为第一个用户空间进程。
5. **`single`：**
   - 启动单用户模式，只启动一个 shell 而不启动其他用户空间进程。
6. **`quiet` 和 `splash`：**
   - `quiet` 参数通常用于减少内核启动时的冗长输出，而 `splash` 用于显示启动画面，这两者一般用于改善用户体验。
7. **`vga=xxx`：**
   - 指定 VGA 显示模式，例如 `vga=792` 表示使用 1024x768 分辨率。
8. **`mem=`：**
   - 用于指定系统内存的大小，可以用于限制内核使用的物理内存大小。
9. **`panic=`：**
   - 当系统遇到内核崩溃时，这个参数用于指定内核触发崩溃转储的延迟时间。例如，`panic=10` 表示等待 10 秒后进行转储。
10. **`debug`：**
    - 打开内核调试选项，增加内核输出以进行调试。

这只是一些常见的内核命令行参数，实际使用时可能需要根据具体的需求进行调整。这些参数通常由引导加载程序配置，例如 GRUB 或 U-Boot。要查看系统当前正在使用的内核命令行参数，可以在系统运行时执行以下命令：

```
bashCopy code
cat /proc/cmdline
```

注意：在修改内核命令行参数之前，请确保了解其含义以及对系统的潜在影响，并在必要时备份相关配置。

### 3.启动嵌入式Linux kernel

```shell
U-Boot 2020.01-stm32mp-r1 (May 07 2021 - 08:09:44 +0000)

CPU: STM32MP151AAC Rev.Z
Model: MYIRTECH MYD-YA151C-256D-t Development Board
Board: stm32mp1 in trusted mode (st,stm32mp15xc-ya151c-t)
DRAM:  256 MiB
NAND:  256 MiB
MMC:   STM32 SD/MMC: 0, STM32 SD/MMC: 1
Loading Environment from UBI... Read 8192 bytes from volume uboot_config to cdae8b80
Hit any key to stop autoboot:  0
Boot over nand0!
Scanning ubi 0:...
Found /nand0_extlinux/stm32mp15xc-ya151c-t_extlinux.conf
Retrieving file: /nand0_extlinux/stm32mp15xc-ya151c-t_extlinux.conf
653 bytes read in 32 ms (19.5 KiB/s)
Retrieving file: /splash.bmp
46180 bytes read in 39 ms (1.1 MiB/s)
Retrieving file: /uImage
7957144 bytes read in 1808 ms (4.2 MiB/s)
append: ubi.mtd=UBI rootfstype=ubifs root=ubi0:rootfs rootwait rw console=ttySTM0,115200
Retrieving file: /stm32mp15xc-ya151c-hdmi-t.dtb
70634 bytes read in 38 ms (1.8 MiB/s)
## Booting kernel from Legacy Image at c2000000 ...
   Image Name:   Linux-5.4.31
   Created:      2021-04-21   9:46:03 UTC
   Image Type:   ARM Linux Kernel Image (uncompressed)
   Data Size:    7957080 Bytes = 7.6 MiB
   Load Address: c2000040
   Entry Point:  c2000040
   Verifying Checksum ... OK
## Flattened Device Tree blob at c4000000
   Booting using the fdt blob at 0xc4000000
   XIP Kernel Image
   Loading Device Tree to cdad6000, end cdaea3e9 ... OK
FDT: cpu 1 node remove for STM32MP151AAC Rev.Z
Starting kernel ...

[    0.000000] Booting Linux on physical CPU 0x0
[    0.000000] Linux version 5.4.31 (oe-user@oe-host) (gcc version 9.3.0 (GCC)) #1 SMP PREEMPT Wed Apr 21 09:46:03 UTC 2021
[    0.000000] CPU: ARMv7 Processor [410fc075] revision 5 (ARMv7), cr=10c5387d
[    0.000000] CPU: div instructions available: patching division code
[    0.000000] CPU: PIPT / VIPT nonaliasing data cache, VIPT aliasing instruction cache
[    0.000000] OF: fdt: Machine model: MYIR YA15XC-HDMI-T www.myir-tech.com
[    0.000000] Memory policy: Data cache writealloc
[    0.000000] Reserved memory: created DMA memory pool at 0x10000000, size 0 MiB
[    0.000000] OF: reserved mem: initialized node mcuram2@10000000, compatible id shared-dma-pool
[    0.000000] Reserved memory: created DMA memory pool at 0x10040000, size 0 MiB
[    0.000000] OF: reserved mem: initialized node vdev0vring0@10040000, compatible id shared-dma-pool
[    0.000000] Reserved memory: created DMA memory pool at 0x10041000, size 0 MiB
[    0.000000] OF: reserved mem: initialized node vdev0vring1@10041000, compatible id shared-dma-pool
[    0.000000] Reserved memory: created DMA memory pool at 0x10042000, size 0 MiB
[    0.000000] OF: reserved mem: initialized node vdev0buffer@10042000, compatible id shared-dma-pool
[    0.000000] Reserved memory: created DMA memory pool at 0x30000000, size 0 MiB
[    0.000000] OF: reserved mem: initialized node mcuram@30000000, compatible id shared-dma-pool
[    0.000000] Reserved memory: created DMA memory pool at 0x38000000, size 0 MiB
[    0.000000] OF: reserved mem: initialized node retram@38000000, compatible id shared-dma-pool
[    0.000000] cma: Reserved 128 MiB at 0xc5800000
[    0.000000] psci: probing for conduit method from DT.
[    0.000000] psci: PSCIv1.1 detected in firmware.
[    0.000000] psci: Using standard PSCI v0.2 function IDs
[    0.000000] psci: MIGRATE_INFO_TYPE not supported.
[    0.000000] psci: SMC Calling Convention v1.0
[    0.000000] percpu: Embedded 20 pages/cpu s50124 r8192 d23604 u81920
[    0.000000] Built 1 zonelists, mobility grouping on.  Total pages: 64960
[    0.000000] Kernel command line: ubi.mtd=UBI rootfstype=ubifs root=ubi0:rootfs rootwait rw console=ttySTM0,115200
[    0.000000] Dentry cache hash table entries: 32768 (order: 5, 131072 bytes, linear)

```

## 扩展-如何修改内核配置

- 内核包含数千个设备驱动程序、文件系统、驱动程序、网络协议和其他可配置项。

- 数以千计的选项可供选择，用于有选择地编译部分内核源代码。

- 内核配置是定义 要编译内核选项集的过程。

- 内核选项集取决于 在目标架构和您的硬件上（对于设备驱动程序等）。

- 关于希望赋予内核的功能（网络功能、文件系统、实时等）。 此类通用选项可用于所有架构。

### menuconfig界面

内核源码目录下执行 `make menuconfig`

- menuconfig在没有可用桌面环境时很有用。

- 非常高效的界面。

- 与其他工具相同的界面：BusyBox、Buildroot…

- 支持快捷键，可直接跳转到搜索结果。

- 需要安装 Debian 软件包：libncurses-dev

![image-20240308131750752](images\image-20240308131750752.png)

### linux Kernel Kconfig类型

- 在 Kconfig 文件中定义了不同类型的选项：

  - bool 选项，它们只有 是或者否。

    - true（在内核中包含该功能）。

    - false（从内核中移除该功能）。

  - tristate(三态)选项，它们存在三种类型：

    - true（将此功能包含在内核映像中）。

    - module（将该功能作为内核模块包含在内）。

    - false（从内核中移除该功能）。

  - int 选项，指定整数值。

  - hex(16进制)选项，指定十六进制值。
    - 示例：CONFIG_PAGE_OFFSET=0xC0000000

  - string(字符串)选项，指定字符串值。
    - 示例：CONFIG_LOCALVERSION=-no-network (用于区分从不同选项构建的两个内核)。

内核选项（功能）之间存在依赖关系：

- 例如，启用网络驱动程序需要启用网络堆栈

  - 两种类型的依赖：

    - depends on(依赖某个选项)。 在这种情况下，在启用选项 A 之前，依赖于选项 A 的选项 B 需要先启用。

    - select (选择依赖项)。 在这种情况下，选项 B 取决于选项 A，当启用选项 A 时，选项 B 将会自动启用。 特别对于此类依赖项用于声明硬件架构支持哪些功能。

![image-20240308131818205](images\image-20240308131818205.png)



## 扩展-如何创建自己单板配置

### 创建自己的配置文件

`make  savedefconfig`

这将创建一个最小配置（非默认设置）。

`mv defconfig arch/<arch>/configs/myboard_defconfig`

这样，您可以在内核源代码中共享参考配置，保存为自己的配置文件。

### 自定义新设备树

  首先要做的是为板卡创建一个设备树并对其进行修改以描述 Nova 板卡的附加或更改的硬件。 在这个简单的例子中，我们只需将` am335x-boneblack.dts `复制到 nova.dts 并将模型名称更改为 Nova，如下所示：

``` shell
/dts-v1/;

#include "am33xx.dtsi"
#include "am335x-bone-common.dtsi"
#include "am335x-boneblack-common.dtsi"
/ {
model = "Nova";
compatible = "ti,am335x-bone-black",
"ti,am335x-bone", "ti,am33xx";
};

[…]
```

接下来可以直接在内核源码目录下执行编译设备树命令`make ARCH=arm   nova.dtb`

如果我们希望在选择 AM33xx 目标时通过 make ARCH=arm dtbs 编译 Nova 的设备树，我们可以在 **arch/arm/boot/dts/Makefile** 中添加一个依赖项，如下所示：

``` shell
[…]

dtb-$(CONFIG_SOC_AM33XX) +=
nova.dtb

[…]

```

那么它就会在使用 AM33xx 系列开发板配置时，编译设备树文件自动帮您编译这个设备树镜像。

## 扩展-如何升级Kernel子版本

### 获取源码补丁文件

- 完整的压缩包版本

​	包含完整的内核源代码：下载和解压需要很长时间，但必须至少完成一次。例如4.20内核版本：https://kernel.org/pub/linux/kernel/v4.x/linux-4.20.13.tar.xz 

​	解压命令：tar xf linux-4.20.13.tar.xz

- 版本之间的增量补丁
  - 假设您已经有一个基本版本，并且您按照正确的顺序应用了正确的补丁以升级到下一个版本。那么可以参考快速下载补丁并应用。

​		例子：https://kernel.org/pub/linux/kernel/v4.x/patch-4.20.xz （从 4.19 到 4.20）https://kernel.org/pub/linux/kernel/v4.x/patch-4.20.13.xz  （从 4.20 到 4.20.13）所有以前的内核版本都可以在 https://kernel.org/pub/linux/kernel/

### 查看补丁文件

- 补丁是两个源代码版本之间的差异

- 使用 diff 工具或更复杂的版本控制系统生成

- 它们在开源社区中使用非常普遍。

- 参考 https://en.wikipedia.org/wiki/Diff

补丁摘录：

```shell
diff -Nru a/Makefile b/Makefile
--- a/Makefile 2005-03-04 09:27:15 -08:00
+++ b/Makefile 2005-03-04 09:27:15 -08:00
@@ -1,7 +1,7 @@
VERSION = 2
PATCHLEVEL = 6
SUBLEVEL = 11
-EXTRAVERSION =
+EXTRAVERSION = .1
NAME=Woozy Numbat
\# *DOCUMENTATION*
```

```shell
标题表示每个修改过的文件时间等
diff -Nru a/Makefile b/Makefile
--- a/Makefile 2005-03-04 09:27:15 -08:00
+++ b/Makefile 2005-03-04 09:27:15 -08:00
文件的每个修改部分都有一个子节(大块)，以标题开头，其中会包含修改起始行号和更改大块使用的行数
@@ -1,7 +1,7 @@
更改前的三行内容上下文
VERSION = 2
PATCHLEVEL = 6
SUBLEVEL = 11
更改本身
-EXTRAVERSION =
+EXTRAVERSION = .1
更改后的三行内容上下文
NAME=Woozy Numbat
# *DOCUMENTATION*
```

### patc命令使用

patch 命令：

- 在标准输入上获取补丁内容。

- 将补丁描述的 修改应用到当前目录。

Pacth命令使用示例：

```shell
patch -p <n> < diff_file
cat diff_file | patch -p <n>
xzcat diff_file.xz | patch –p <n>
zcat diff_file.gz | patch –p <n>
```

**注意事项：**

>  n : 文件路径中要跳过的目录级别数。 (-p: prune)

>  您可以使用 -R 选项反向应用补丁。

> 您可以使用 --dry-run 选项测试补丁。

### 应用Linux Patch补丁

两种类型的 Linux 补丁：

- 要么适用于之前的稳定版本（从 x.< y-1 > 至 x.y ）

- 或者对当前稳定版本进行修复（从 x.y 至  x.y.z）

可以下载 gzip 或 xz（小得多）压缩文件。始终为patch -p1 生成。

需要在顶层内核源码目录下运行patch命令。

![image-20240308132347340](images\image-20240308132347340.png)

```she
cd linux-5.7
# From 5.7 to 5.8.6
xzcat ../patch-5.8.xz | patch -p1
xzcat ../patch-5.8.6.xz | patch -p1
# Back to 5.8 from 5.8.6
xzcat ../patch-5.8.6.xz | patch -R -p1
# From 5.8 to 5.8.7
xzcat ../patch-5.8.7.xz | patch -p1
# Renaming directory
cd ..; mv linux-5.7 linux-5.8.7
```

## 扩展-内核模块使用

### 内核模块依赖

一些内核模块可以依赖其他模块，需要先加载。

- 示例：ubifs 模块依赖于 ubi 和 mtd 模块。
  - 依赖关系在` /lib/modules /<kernel-version>/modules.dep** 和  **/lib/modules/<kernel-version>/modules.dep.bin`（二进制散列格式）。这些文件是在运行` make modules_install` 时生成的。

### 内核模块工具

`<module_name>`：不带后缀 .ko 的模块文件名。

- `modinfo <module_name>`（用于查看/lib/modules 中的模块）

  - `modinfo <module_path>.ko`它获取有关模块的信息而不加载它：参数、许可证、描述和依赖。

  - `sudo insmod <module_path>.ko`  尝试加载指定的模块。 但必须给出模块目标文件的完整路径。

- `modprobe <top_module_name> modprobe` 最常见的用法：
  - 尝试加载顶层模块的所有依赖项，然后加载此模块。 modprobe 会自动在` /lib/modules/<version>/ `中查找与安装模块名称对应的目标模块文件。

- `lsmod` 显示所有加载的模块列表将其输出显示，可以与 **/proc/modules**  内容进行比较。

- `sudo rmmod <module_name> `尝试删除给定的模块。仅当模块不再使用时才允许（例如，不再有进程打开设备文件）

- `sudo modprobe -r <top_module_name>` 尝试卸载给定的顶级模块及其所有不再需要的依赖项

### 向内核模块传递参数

- 查看模块可用参数：  `modinfo usb-storage`

- 使用 insmod：   sudo insmod ./usb-storage.ko delay_use=0

- 使用 modprobe：   在 /etc/modprobe.conf 或 /etc/modprobe.d/ 中设置参数：选项 usb-storage delay_use=0

- 通过kernel command line (内核命令行)，当驱动程序被静态构建到内核中时增加: usb-storage.delay_use=0

  - **usb-storage** 是驱动名

  - **delay_use** 是驱动参数名称。 它指定访问 USB 存储设备之前的延迟。

  - **0** 为驱动参数值。

### 检查内核模块参数值

如何查找/编辑已加载模块参数的当前值？

- 检查 `/sys/module/<name>/parameters`。

- 每个参数都有一个文件，里面包含参数值。如果这些文件具有写入权限（取决于内核模块代码）也可以直接更改参数值。

- 例子：` echo 0 > /sys/module/usb_storage/parameters/delay_use`

### 装载内核模块常见问题

当加载模块失败时，insmod 通常不会提供足够的打印信息。

但是内核日志中通常会提供详细信息。比如：

```shell
 $ sudo insmod ./intr_monitor.ko
	insmod: error inserting './intr_monitor.ko': -1 Device or resource busy

 $ dmesg
	[17549774.552000] Failed to register handler for irq channel 2
```

### 文件系统自动装载内核模块

**mdev**：这是一个 BusyBox 小程序，用于使用设备节点填充目录并根据需要创建新的节点。 有一个配置文件 /etc/mdev.conf，其中包含所有者和节点模块的规则。

**udev**：这是 mdev 的另一个新版本。 您可以在桌面 Linux 和一些嵌入式设备中找到它。 它非常灵活，是高端嵌入式设备的不错选择。 它现在是 systemd 的一部分。

