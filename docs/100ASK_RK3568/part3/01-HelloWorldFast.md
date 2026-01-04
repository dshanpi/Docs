---
sidebar_position: 1
---
# Hello快速入门

本章节将讲解如何在开发板上运行helloworld程序。

## 编译工具准备

在 Ubuntu 中可以执行以下命令编译、执行：

~~~bash
gcc -o hello hello.c
./hello
Hello, world!
~~~

上述命令编译得到的可执行程序 hello 可以在 Ubuntu 中运行，但是如果把它放到 ARM板子上去，它是无法执行的。因为它是使用 gcc 编译的，是给 PC 机编译的，里面的机器指令是 x86 的。

我们要想给 ARM 板编译出 hello 程序，需要使用相应的交叉编译工具链。100ask-RK3568开发板的交叉编译工具是(实际路径不一定相同)：

~~~bash
/home/ubuntu/100ask-RK3568-SDK/rk3568_4.19_v1.3.2/prebuilts/gcc/linux-x86/aarch64/gcc-arm-10.3-2021.07-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-gcc
~~~

## 编写helloworld程序

在 Ubuntu 上，编写一个`helloworld.c`代码，

~~~c
#include <stdio.h>

int main()
{
        printf("RK3568,Hello World!\n");
        return 0;
}
~~~

## 编译代码

编写代码完成后，可以使用上面提到的交叉编译工具来进行编译，

~~~bash
/home/ubuntu/100ask-RK3568-SDK/rk3568_4.19_v1.3.2/prebuilts/gcc/linux-x86/aarch64/gcc-arm-10.3-2021.07-x86_64-aarch64-none-linux-gnu/bin/aarch64-none-linux-gnu-gcc helloworld.c -o helloworld
~~~

可以看到helloworld程序的文件类型如下：

~~~bash
ubuntu@ubuntu2004:~/appTest/helloworld$ file helloworld
helloworld: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-aarch64.so.1, for GNU/Linux 3.7.0, with debug_info, not stripped
~~~

## 连接开发板

上传程序前，需要连接好开发板。如果不清楚如何连接开发板和使用ADB，可以先阅读《启动开发板》章节。

## 上传程序并运行

开发板启动后，通过adb工具上传可执行程序`helloworld`。这里上传至开发板 `/mnt/udisk/` 路径下，

~~~bash
ubuntu@ubuntu2004:~/appTest/helloworld$ ls
helloworld  helloworld.c
ubuntu@ubuntu2004:~/appTest/helloworld$ adb push helloworld /mnt/udisk/
helloworld: 1 file pushed. 3.8 MB/s (15416 bytes in 0.004s)
ubuntu@ubuntu2004:~/appTest/helloworld$
~~~

可以在开发板的`/mnt/udisk/`目录下，看到可执行程序`helloworld`

~~~bash
root@RK356X:/mnt/udisk# ls
helloworld
root@RK356X:/mnt/udisk#
~~~

运行如下：

~~~bash
root@RK356X:/mnt/udisk# ./helloworld
RK3568,Hello World!
root@RK356X:/mnt/udisk#
~~~
