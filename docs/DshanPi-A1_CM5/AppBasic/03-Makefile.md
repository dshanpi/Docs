---
title: Makefile 的使用
sidebar_position: 3
slug: /DshanPi-A1_CM5/AppBasic/Makefile
description: 用 Make 描述依赖，比较首次构建与增量构建的输出。
---

从一条 Makefile 规则开始，理解修改源文件或头文件后哪些目标需要重建。 [直接进入 DshanPI A1 CM5 实验](#cm5-lab)。

## 1 用目标和依赖描述构建过程

例如 `sum-demo` 由 `sum.o` 和 `add.o` 链接而成。GNU Make 从目标沿依赖向下检查：目标不存在，或某个依赖比目标新，才执行相应命令。规则第一行写成 `目标: 依赖`，下一行以 **Tab** 开头，写生成目标的命令。

把两个 `.c` 都放在同一条 GCC 命令里，每次修改都要重新编译全部代码。改成每个 `.c` 对应一个 `.o` 后，修改 `add.c` 只需更新 `add.o` 再链接。模式规则 `%.o: %.c` 能为多个源文件复用同一条命令。

### 读懂规则中的变量

| 写法 | 含义 |
| --- | --- |
| `$@`、`$<`、`$^` | 当前目标、第一个依赖、全部去重后的依赖 |
| `=`、`:=` | 前者使用时展开变量，后者在赋值时展开 |
| `?=`、`+=` | 变量还未定义时赋默认值、向现有值追加内容 |
| `.PHONY: clean` | 即使有名为 `clean` 的文件，仍会执行清理命令 |

### 让头文件变更触发重新编译

编译 `sum.c` 时也会读入它包含的头文件。可用 `-MMD -MP` 让 GCC 同时生成 `.d` 依赖文件，再在 Makefile 末尾读入这些依赖。以下是对页末示例**模式规则**的扩展：

```makefile
%.o: %.c
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

-include $(objects:.o=.d)
```

首次构建还没有 `.d` 文件，`-include` 允许继续执行。以后修改头文件时，Make 可据此找到需要重编的 `.o`。

## 2 根据源文件列表生成目标文件

### 常见函数

| 操作 | GNU Make 写法 | 结果 |
| --- | --- | --- |
| 找出当前目录的 C 文件 | `$(wildcard *.c)` | 返回匹配的文件名 |
| 把源文件名换成目标文件名 | `$(patsubst %.c,%.o,$(sources))` | 例如 `add.c` 变为 `add.o` |
| 筛选或剔除项目 | `$(filter %.o,$(obj-y))`、`$(filter-out %.o,$(obj-y))` | 从列表中区分目标文件与其他项 |
| 取目录、文件名或后缀 | `$(dir src/add.c)`、`$(notdir src/add.c)`、`$(suffix src/add.c)` | 分别得到 `src/`、`add.c`、`.c` |
| 对多个目录执行同一操作 | `$(foreach d,$(dirs),$(wildcard $(d)/*.c))` | 依次收集各目录的 C 文件 |

例如将 `sources := sum.c add.c` 交给 `patsubst`，结果是 `sum.o add.o`。页末练习显式列出这两个文件，方便观察每次构建发生了什么。

## 3 在 DshanPI A1 CM5 上观察增量构建 {#cm5-lab}

先完成 [GCC 多文件示例](./02-GCCCompiler.md)，确认 `~/cm5-labs/hello` 中已有 `sum.c` 和 `add.c`。

### 1. 写入构建规则

在开发板终端运行 `cd ~/cm5-labs/hello`，再用 `nano Makefile` 保存以下内容。每条编译或清理命令前按一次 **Tab**。

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
objects = sum.o add.o

sum-demo: $(objects)
	$(CC) $(objects) -o $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

.PHONY: clean
clean:
	$(RM) $(objects) sum-demo
```

`sum-demo` 依赖两个目标文件。模式规则中的 `$<` 是当前源文件，`$@` 是要生成的文件。

### 2. 验证增量构建

**做一次完整构建。** 清理旧产物，再编译并运行 `sum-demo`。

```bash
make clean
make
./sum-demo
```

**在没有改动时再构建一次。** 观察 Make 是否再次调用编译器。

```bash
make
```

**模拟修改一个源文件。** `touch` 更新时间戳，再运行 Make，观察哪些文件重新参与构建。

```bash
touch add.c
make
```

第一次 `make` 编译两个源文件并链接，程序输出 `5`。第二次提示目标已是最新。更新 `add.c` 的时间戳后，最后一次只重新编译 `add.o`，然后重新链接。若出现 `missing separator`，检查命令行开头是否使用了 Tab。
