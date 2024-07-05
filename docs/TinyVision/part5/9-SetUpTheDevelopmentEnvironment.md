---
sidebar_position: 9
---

# 搭建开发环境

这里提供了一个 `RTOS` 以供开发使用，此 `RTOS` 基于 RTT 内核。地址 [https://github.com/YuzukiHD/TinyVision/tree/main/kernel/rtos](https://github.com/YuzukiHD/TinyVision/tree/main/kernel/rtos)

使用 git 命令下载（不可以直接到 Github 下载 zip，会破坏超链接与文件属性）

```
git clone --depth=1 https://github.com/YuzukiHD/TinyVision.git
```

然后复制到当前目录下

```
 cp -rf TinyVision/kernel/rtos . && cd rtos
```

下载编译工具链到指定目录

```
cd rtos/tools/xcompiler/on_linux/compiler/ && wget https://github.com/YuzukiHD/Yuzukilizard/releases/download/Compiler.0.0.1/riscv64-elf-x86_64-20201104.tar.gz && cd -
```

![image-20230215133709126](assets/post/README/image-20230215133709126.png)
