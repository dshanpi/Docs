---
title: HelloWorld 程序
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppBasic/HelloWorld
description: 在 DshanPI A1 CM5 上编译第一个 C 程序，分别用默认参数和自定义名字运行。
---

从 `main` 的参数和 `printf` 入手，了解第一个 C 程序如何生成。 [直接进入 DshanPI A1 CM5 实验](#cm5-lab)。

## 1 从源文件到第一行输出

运行 `./hello CM5` 时，终端把程序名和参数交给 `main`。此时 `argc` 为 2，`argv[0]` 是 `./hello`，`argv[1]` 是 `CM5`。只运行 `./hello` 时，`argc` 为 1。程序先检查参数个数，就能决定打印传入的名字还是默认的 `world`。

### 头文件和库各做什么

预处理时，`#include <stdio.h>` 引入函数声明，让编译器知道参数和返回值的类型。链接时，工具链解析对 C 标准库的引用。通常用 `gcc` 链接可执行文件时，它会自动加入 C 标准库。

<img src={require('./figures/hello-headers.png').default} width="660" alt="hello.c 示例中的 main 参数、头文件与 printf 调用" />

### 怎样查找或指定目录

| 要查什么 | 在 DshanPI A1 CM5 终端中查看 | 编译自己的项目时 |
| --- | --- | --- |
| 头文件搜索目录 | `gcc -E -v -x c /dev/null -o /dev/null`，看 `search starts here` 后面的列表 | `-I./include` 增加头文件目录 |
| 库搜索目录 | `gcc -print-search-dirs`，看 `libraries:` 一行 | `-L./lib -labc` 在指定目录查找名为 `abc` 的库；把库选项写在使用它的目标文件之后 |

例如编译器报 `stdio.h: No such file or directory` 时，应检查开发头文件；链接器报 `undefined reference` 时，应检查实现所在的目标文件或库。

## 2 在 DshanPI A1 CM5 上编译并运行 HelloWorld {#cm5-lab}

在 DshanPI A1 CM5 的 Armbian 桌面按 **Super**（Windows 徽标键），搜索 `terminal` 并按回车。CLI 版登录后可直接输入命令。本目录的示例均在开发板上编译。

### 1. 准备编译工具

```bash
gcc --version
make --version
```

实测版本为 GCC 13.3.0、GNU Make 4.3。若提示找不到命令，联网后运行 `sudo apt update`，再运行 `sudo apt install build-essential`。

### 2. 保存源文件

**建立并进入练习目录。**

```bash
mkdir -p ~/cm5-labs/hello
cd ~/cm5-labs/hello
```

**打开源文件。** 在编辑器中输入下方的 C 程序。

```bash
nano hello.c
```

粘贴下面的代码。按 **Ctrl + O**、**Enter** 保存，再按 **Ctrl + X** 退出。后续章节使用同样的方法保存代码。

```c
#include <stdio.h>

int main(int argc, char *argv[])
{
    const char *name = argc > 1 ? argv[1] : "world";
    printf("Hello, %s!\n", name);
    return 0;
}
```

### 3. 编译并运行

**编译程序。** 生成当前目录下的 `hello`。

```bash
gcc -Wall -Wextra -o hello hello.c
```

**运行两次。** 先使用默认名字，再传入 `CM5`，比较两行问候语。

```bash
./hello
./hello CM5
```

两次运行依次输出 `Hello, world!` 和 `Hello, CM5!`。第二次命令中的 `CM5` 通过 `argv[1]` 传给程序。
