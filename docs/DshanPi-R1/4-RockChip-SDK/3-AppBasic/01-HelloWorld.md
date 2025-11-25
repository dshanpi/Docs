---
sidebar_position: 1
---
# HelloWorld程序
- 源码获取：[AppBaseCode](https://dl.100ask.net/Hardware/MPU/RK3576-DshanPi-A1/utils/AppBaseCode/)

## 1.编译hello.c

hello.c的源码如下：

```
#include <stdio.h>

/* 执行命令: ./hello weidongshan
 * argc = 2
 * argv[0] = ./hello
 * argv[1] = weidongshan
 */

int main(int argc, char **argv)
{
     if (argc >= 2)
             printf("Hello, %s!\n", argv[1]);
     else
             printf("Hello, world!\n");
     return 0;
}
```

在DshanPI A1中，右键鼠标，点击终端，执行以下命令编译、执行：

```
gcc -o hello hello.c
./hello
Hello, world!
./hello weidongshan
Hello, weidongshan!
```



## 2.Hello程序的引申

![image-20251010151013132](${images}/image-20251010151013132.png)

**①  怎么确定编译器中头文件的默认路径？**

执行sudo find / -name “stdio.h” ，它位于一个“include”目录下。本地编译器一般默认的头文件路径是/usr/include/。

**②  怎么自己指定头文件目录？**

编译时，加上`“-I <头文件目录>”`这样的选项。

**③  怎么确定编译器中库文件的默认路径？**

执行sudo find -name lib,可以得到/usr/lib，一般来说这个目录是本地编译器的库文件默认路径，进去看看，有很多so文件。

**④  怎么自己指定库文件目录、指定要用的库文件？**

编译时，加上`“-L <库文件目录>”`这样的选项，用来指定库目录；

编译时，加上`“-labc”`这样的选项，用来指定库文件libabc.so。