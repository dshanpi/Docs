---
sidebar_position: 10
---

# 内核 Rust 扩展

:::tip
本章介绍 kernel-rust 扩展的使用方法，教你如何在 Armbian 内核构建中启用 Rust 支持。
:::

## 1. 概述

Linux 内核自 6.1 版本起逐步引入 Rust 支持，越来越多的子系统和驱动程序开始与传统的 C 代码并行使用 Rust 编写。在不久的将来，面向 Armbian 用户的实用驱动和子系统预计将需要或受益于 Rust 内核支持。

此扩展通过 `rustup` 安装一个固定版本的 Rust 工具链，自动启用 `CONFIG_RUST`，并配置所有必要的构建参数，使得 Rust 内核模块能够与 C 代码一同编译。

如果不使用此扩展，Armbian 内核在构建时不包含 Rust 支持——工具链未安装，`CONFIG_RUST` 也不会出现在 menuconfig 中。

:::tip 提示
更多扩展请参阅 [扩展列表](./9_ExtensionsList.md)，扩展框架介绍请参阅 [扩展与钩子](./6_ExtensionsHooks.md)。
:::

## 2. 为什么使用 rustup 而非发行版软件包

目前，各发行版提供的 Rust 软件包无法完全满足在最新内核中启用 Rust 支持的全部要求。将发行版的某些组件与外部来源的组件混合使用既脆弱又不值得。

因此，本扩展通过 `rustup` 独立于宿主发行版下载一套完整的、版本固定的工具链。当 Armbian 构建系统所使用的基础发行版能够提供完全从发行版源构建最新内核 Rust 环境所需的软件包时，Armbian 可能会切换为使用发行版软件包。

## 3. 快速开始

### 3.1 基本构建

```bash
./compile.sh BOARD=<board> BRANCH=<branch> ENABLE_EXTENSIONS="kernel-rust"
```

### 3.2 打开 menuconfig（含 Rust 选项）

```bash
./compile.sh kernel-config BOARD=<board> BRANCH=<branch> ENABLE_EXTENSIONS="kernel-rust"
```

### 3.3 通过 userconfig 文件永久启用

```bash
enable_extension "kernel-rust"
```

## 4. 要求

- **内核版本**：6.12 或更高。所需的最低 rustc 版本取决于内核版本；请参阅 [Rust-for-Linux 版本策略](https://rust-for-linux.com/rust-version-policy)。
- **宿主软件包**：`libclang-dev` — 由扩展自动安装。
- **构建宿主架构**：x86_64、aarch64 或 riscv64。
- 首次使用时需要互联网连接（下载 rustup-init 和工具链组件）。

## 5. 参数

| 变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| **`RUST_VERSION`** | `1.85.0` | 通过 rustup 安装的 rustc 版本。 |
| **`BINDGEN_VERSION`** | `0.71.1` | 通过 cargo 安装的 `bindgen-cli` 版本。 |
| **`RUST_KERNEL_SAMPLES`** | `no` | 设置为 `yes` 以将示例 Rust 内核模块（`rust_minimal`、`rust_print`、`rust_driver_faux`）构建为可加载模块。用于工具链的冒烟测试。 |
| **`RUST_EXTRA_COMPONENTS`** | *（空数组）* | 额外安装的 rustup 组件（例如 `clippy`、`llvm-tools`）。 |
| **`RUST_EXTRA_CARGO_CRATES`** | *（空数组）* | 额外安装的 cargo crate。支持 `name` 或 `name@version` 语法。 |

## 6. 工具链缓存

工具链仅安装一次，存放于 `${SRC}/cache/tools/rustup/`，并在各次构建间重复使用。缓存通过以下内容的哈希值进行内容寻址：

- `RUST_VERSION`
- `BINDGEN_VERSION`
- 构建宿主架构
- `RUST_EXTRA_COMPONENTS`
- `RUST_EXTRA_CARGO_CRATES`

修改以上任一值都会使缓存失效，并在下次构建时触发完全重新安装。标记文件为缓存目录内的 `.marker-<hash>`。

## 7. 扩展性

其他扩展可在工具链安装前请求额外的工具链组件或 crate：

```bash
# 在你的扩展文件中：
RUST_EXTRA_COMPONENTS+=("clippy" "llvm-tools")
RUST_EXTRA_CARGO_CRATES+=("mdbook" "cargo-deb@2.11.0")
```

## 8. 内核制品版本管理

此扩展会将 `RUST_VERSION|BINDGEN_VERSION` 的短哈希添加到内核制品版本字符串中（键为 `_R`，例如 `rust1a2b`）。这确保了即使内核源代码未变更，修改工具链版本也会触发内核重新构建。

## 9. 实现说明

### 9.1 env -i 隔离

内核构建在 `env -i` 环境下运行，该环境会清除全部环境变量。此扩展直接通过 make 参数（`RUSTC=`、`RUSTFMT=`、`BINDGEN=`）传递 Rust 工具路径，并通过 make 环境数组设置 `RUST_LIB_SRC`。

使用的是工具链 sysroot 中的直接路径而非 rustup 代理二进制文件，因此 `RUSTUP_HOME` 无需存在于被清除的环境中。

### 9.2 ccache 与 Rust

ccache 不支持 rustc（上游自 2019 年起标记为不会修复）。内核构建系统没有 `RUSTC_WRAPPER` 机制，因此 Rust 编译无法被 ccache 缓存。

启用此扩展时，仅有 C/汇编编译能从 ccache 中受益。

---

## 10. 参考资料

- [Rust in the Linux kernel — quick start](https://docs.kernel.org/rust/quick-start.html)
- [Rust for Linux — version policy](https://rust-for-linux.com/rust-version-policy)
- [rustup installation](https://rust-lang.github.io/rustup/installation/index.html)
