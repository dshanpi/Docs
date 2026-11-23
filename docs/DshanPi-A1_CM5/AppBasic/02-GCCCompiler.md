---
title: GCC 编译器的使用
sidebar_position: 2
slug: /DshanPi-A1_CM5/AppBasic/GCCCompiler
description: 逐步生成预处理文件、汇编文件和目标文件，再链接运行。
---

沿一份 C 源文件看 GCC 的四个阶段，再比较静态库与动态库。 [直接进入 DshanPI A1 CM5 实验](#cm5-lab)。

## 1 看懂 GCC 的四个阶段

一条 `gcc hello.c -o hello` 命令串起四个阶段。各阶段的选项和产物见下表。

<img src={require('./figures/gcc-compilation-stages.png').default} width="580" alt="从 hello.c 到 hello 的四个阶段以及对应的 GCC 选项" />

| 阶段 | GCC 选项 | 结果与用途 |
| --- | --- | --- |
| 预处理 | `-E` | 展开头文件、宏和条件编译，得到 `.i` |
| 编译 | `-S` | 将 C 代码翻译成汇编，得到 `.s` |
| 汇编 | `-c` | 生成可重定位目标文件 `.o`，其中的外部符号可留到链接时解析 |
| 链接 | 传入 `.o` 和所需库 | 解析符号、合并各段，生成可执行文件 |

要看 GCC 实际调用了哪些工具，可以在编译命令中加 `-v`。要看某个宏为何生效，可用 `gcc -E -dM hello.c` 列出预处理后的宏定义。

## 2 编译多个文件，选择链接方式

`main.c` 调用 `sub.c` 中的函数时，头文件负责声明接口，两份源文件各自编译。运行 `gcc main.c sub.c -o demo` 可以一次编译并链接；也可以分别用 `-c` 生成 `main.o` 和 `sub.o`，再运行 `gcc main.o sub.o -o demo`。后一种方式允许只重新编译改动的源文件。

| 形式 | 制作与使用 | 运行时 |
| --- | --- | --- |
| 静态库 `.a` | `ar rcs libsub.a sub.o` 将目标文件归档；链接时把 `./libsub.a` 放在调用者之后 | 链接器把所需代码并入程序 |
| 动态库 `.so` | 用 `-fPIC` 编译库代码，用 `-shared` 生成共享库；用 `-L` 和 `-l` 链接 | 加载器需要找到对应的共享库；板端练习演示从程序所在目录加载 |

## 3 按问题查编译选项

| 问题 | 选项与判断方法 |
| --- | --- |
| 输出名是什么？ | `-o hello` 指定输出名。链接时未指定名称，通常生成 `a.out`。 |
| 如何找出可疑代码？ | `-Wall -Wextra` 开启常见警告。先处理第一条警告给出的源文件和行号。 |
| 如何按源代码调试？ | `-g` 保留调试信息；`-Og` 适合调试，也可用 `-O0` 观察未优化的代码。 |
| 如何选择优化等级？ | `-O1`、`-O2`、`-O3` 逐步启用不同的优化。测量自己的程序后再选择等级。 |
| 编译器找不到头文件？ | `-I目录` 增加头文件搜索路径；`-E` 可以检查实际包含的内容。 |
| 链接器找不到库或符号？ | `-L目录` 增加库搜索路径，`-lsub` 请求链接 `libsub`。静态库的顺序会影响符号解析。 |
| 需要传递链接器参数？ | `-Wl,参数` 由 GCC 转交链接器。`-static` 请求静态链接，需要安装相应静态库。 |

下面的练习用同一个加法函数分别验证多文件、静态库和动态库链接。

<details>
<summary>查阅传给链接器的选项</summary>

`-L` 改变链接阶段的库查找路径。运行时查找共享库属于加载器的工作，页末示例用 `-Wl,-rpath,'$ORIGIN'` 把可执行文件所在目录加入运行时搜索路径。`-Wl,-Map=demo.map` 可生成链接映射，便于定位符号来自哪个文件。

启动代码和标准库通常由 GCC 自动加入。在自行实现程序入口或运行库的项目中，`-nostartfiles` 可省略标准启动文件，`-nodefaultlibs` 可省略默认库，`-nostdlib` 同时省略两者。

</details>

## 4 在 DshanPI A1 CM5 上验证编译与链接 {#cm5-lab}

先按 [HelloWorld 程序](./01-HelloWorld.md) 保存 `hello.c`。在 DshanPI A1 CM5 终端进入同一目录：

```bash
cd ~/cm5-labs/hello
```

### 1. 分步编译

**展开头文件和宏。** 结果写入 `hello.i`。

```bash
gcc -E hello.c -o hello.i
```

**生成汇编代码。** 输入上一步的文件，得到 `hello.s`。

```bash
gcc -S hello.i -o hello.s
```

**生成目标文件。** `hello.o` 将在下一步参与链接。

```bash
gcc -c hello.s -o hello.o
```

**链接并运行。** 得到可执行文件 `hello` 后，传入 `CM5` 检查输出。

```bash
gcc hello.o -o hello
./hello CM5
```

| 文件 | 可以观察什么 |
| --- | --- |
| `hello.i` | 预处理后的 C 代码，包括展开的头文件。 |
| `hello.s` | 编译器生成的 ARM64 汇编指令。 |
| `hello.o` | 尚未链接的目标文件。运行 `readelf -h hello.o`，查看 `Machine` 行的 `AArch64`。 |
| `hello` | 可执行文件。本例输出 `Hello, CM5!`。 |

### 2. 选择编译选项

日常编译可一步完成。`-Wall -Wextra` 打开常用警告，`-g` 保留调试信息，`-o` 指定输出文件：

```bash
gcc -Wall -Wextra -g hello.c -o hello
```

### 3. 链接多个源文件

继续使用刚才的练习目录。

**写入两个源文件。** `add.c` 实现加法，`sum.c` 调用它。

```bash
printf '%s\n' 'int add(int a, int b) { return a + b; }' > add.c
printf '%s\n' '#include <stdio.h>' 'int add(int, int);' 'int main(void) { printf("%d\n", add(2, 3)); return 0; }' > sum.c
```

**编译并运行。** 终端应打印两个数相加的结果 `5`。

```bash
gcc -Wall -Wextra sum.c add.c -o sum
./sum
```

输出应为 `5`。若只编译 `sum.c`，链接器会报告找不到 `add` 的实现。

<details>
<summary>将加法函数打包成静态库或动态库</summary>

**制作静态库。** 先编译 `add.c`，再将目标文件打包为 `libadd.a`。

```bash
gcc -c add.c -o add.o
ar rcs libadd.a add.o
```

**用静态库编译并运行。**

```bash
gcc sum.c ./libadd.a -o sum-static
./sum-static
```

**制作动态库。** 生成 `libadd.so`。

```bash
gcc -fPIC -shared add.c -o libadd.so
```

**用动态库编译并运行。** 程序会在自身所在目录查找这个库。

```bash
gcc sum.c -L. -ladd -Wl,-rpath,'$ORIGIN' -o sum-shared
./sum-shared
```

两个程序都输出 `5`。运行 `sum-shared` 时，将 `libadd.so` 放在可执行文件旁。

</details>
