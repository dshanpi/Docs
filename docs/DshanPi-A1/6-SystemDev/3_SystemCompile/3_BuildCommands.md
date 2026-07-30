---
sidebar_position: 3
---

# 构建命令

:::tip
本章介绍 compile.sh 支持的各类构建命令，包括内核编译、镜像构建、配置菜单等常用操作。
:::

构建框架提供了多个子命令，用于完成内核编译、补丁管理、设备树验证、清单生成等不同任务。每次执行 `./compile.sh` 时只能指定一个命令。

所有命令的基本调用格式：

```bash
./compile.sh <命令> [参数...]
```

以下是各命令的详细说明。

---

## 1. 内核与设备树

### 1.1 kernel

编译内核和设备树（如适用），并将产物输出到 `output/debs` 目录。

**用法：**

```bash
./compile.sh kernel BOARD=nanopi-r5c BRANCH=edge
```

### 1.2 kernel-config

自动调用内核的 `make menuconfig`，用于添加或移除模块与功能。

**用法：**

```bash
./compile.sh kernel-config BOARD=nanopi-r5c BRANCH=edge
```

### 1.3 rewrite-kernel-config

自动验证内核配置变更及其依赖链。手动编辑给定芯片系列和分支的配置后，需要执行此命令以确保配置变更在 CI 中能够持久生效。

**用法：**

```bash
./compile.sh rewrite-kernel-config BOARD=xxxxx BRANCH=current
```

### 1.4 dts-check

验证设备树源文件（dts），改进单板与补丁的开发工作流。

此命令针对所选单板，根据设备树绑定（device tree bindings）验证 dts/dtb 文件，并向用户输出验证日志。可用于添加新单板、开发或优化 dts 文件时。

**用法：**

```bash
./compile.sh dts-check BOARD=nanopi-r5c BRANCH=edge
```

### 1.5 kernel-dtb

仅编译 DTB，并输出完整的预处理后 dts 源码。

将目标单板的预处理后 DTS 源码输出到 `output/` 目录，同时输出相同的预处理后 DTS 源码经过 `dtc` 处理、以输入和输出 DTS 格式呈现的结果，用于"规范化"比较。

**用法：**

```bash
./compile.sh kernel-dtb BOARD=xxxxx BRANCH=edge
```

---

## 2. 补丁管理

### 2.1 uboot-patch

为 u-boot 创建补丁文件。

输出的补丁文件会写入：

```text
output/patch/u-boot-${LINUXFAMILY}-${BRANCH}.patch
```

要在后续构建中使用这些补丁，必须将它们复制到 `patch/u-boot` 目录下对应的子目录中。参见：[用户提供的补丁](./5_UserConfigurations.md)。

#### 2.1.1 工作流程

工作树和索引中所有未提交的更改都会被提交，以建立干净的工作树。运行 `uboot-patch` 时最好没有未提交的更改。

如果上述输出路径已存在补丁文件，则可能会在继续工作前先应用该补丁。

当出现提示：

```text
Press <ENTER> after you are done editing in ${pwd}
```

请在另一个窗口中导航到指定目录并进行所需的修改。修改完成后，回到运行 `uboot-patch` 命令的窗口并按 `<ENTER>`。

系统会展示一个用于重现 u-boot 树中所做更改的补丁，并提示"你对这个补丁满意吗？"。你可以回复：

- `yes` — 接受补丁原样并生成输出补丁文件
- `stop` — 中止命令且不生成输出补丁文件
- 其他任何内容 — 返回循环，做进一步修改

#### 2.1.2 注意事项

与其在运行 `uboot-patch` 时创建新文件，不如：

- 新的设备树文件应该创建在 `patch/u-boot` 下相关的 `dt` 目录中
- 新的 `_defconfig` 文件应该创建在 `patch/u-boot` 下相关的 `configs` 目录中

虽然 `uboot-patch` 命令会将在运行期间创建的新文件加入补丁，但这不是添加这些文件的推荐方式。

### 2.2 rewrite-uboot-patches

准备 git，将补丁应用到 git，再从 git 重新写回补丁。与内核类似，它会对无 mbox 的补丁进行 git 考古等操作。

:::info
应设置 `MAINTAINER` 和 `MAINTAINEREMAIL` 环境变量。
:::

- 同时提供了 `uboot-patches-to-git` 别名，但 `rewrite` 更实用
- 计划为内核和 uboot 重构一个通用的配置函数

**用法：**

```bash
./compile.sh rewrite-uboot-patches BOARD=xxxx BRANCH=edge
```

### 2.3 rewrite-kernel-patches

准备 git，将补丁应用到 git，再从 git 重新写回补丁。与 uboot 类似，它会对无 mbox 的补丁进行 git 考古等操作。

**用法：**

```bash
./compile.sh rewrite-kernel-patches BOARD=xxxx BRANCH=edge
```

---

## 3. 清单与目标

### 3.1 inventory-boards

输出每行一个单板的 CSV 清单。

该命令会将 `TARGETS_FILE` 设置为不存在的路径，从而强制使用 `default-targets.yaml`（确保每个人得到的列表一致，用户自定义补丁的单板除外）。

**用法：**

```bash
./compile.sh inventory-boards
```

输出文件路径：`/info/boards-inventory.csv`

### 3.2 targets

生成 `output/info/git_sources.json` 文件，包含 URL、分支和提交哈希的组合。

为所有设备生成该文件最简单的方式是运行 `./compile.sh targets`。在发布时，将 `output/info/git_sources.json` 文件复制到 `config/sources/git_sources.json`。文件复制完成后，对于指定了分支而非标签或提交的 git 仓库，将使用该文件中的哈希信息来获取资源。

**用法：**

```bash
./compile.sh targets
```
