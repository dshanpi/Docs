---
sidebar_position: 6
---

# 扩展与钩子

:::tip
本章介绍 Armbian 的扩展（Extensions）框架机制和钩子（Hooks）列表，教你如何扩展构建系统的功能。
:::

## 1. 扩展（Extensions）概述

扩展框架允许板级/系列开发者、扩展作者以及用户在不向核心代码中堆砌特定功能的前提下，对 Armbian 构建系统进行扩展。

它是一个用 Bash 编写的简单框架，**基于函数命名约定工作**。它为核心和扩展提供了追踪与调试、内联文档以及简单的依赖解析能力。

### 1.1 术语

- **核心（Core）**：`lib/` 目录中的所有内容，加上 `compile.sh` 及其他一些文件——构建系统的骨架。
- **扩展（Extension）**：一个独立的 Bash 源文件，其中仅包含函数。扩展位于 `extensions/` 或 `userpatches/extensions/` 目录下。
- **扩展方法（钩子 / Hook）**：核心通过 `call_extension_method()` 调用扩展的入口点。它会发现所有已启用的实现，对其排序，然后逐个调用。
- **扩展方法实现（Extension method implementation）**：当扩展方法被调用时执行的函数。可以在扩展、板级配置、系列配置、用户配置等文件中定义。

### 1.2 命名约定与排序

扩展方法实现遵循 `run_after_build__say_congratulations` 这样的模式，其中：

- `run_after_build` 是扩展方法名称。
- `__`（双下划线）是标记/分隔符。
- `say_congratulations` 是实现名称（必须唯一）。

钩子函数按数字前缀排序；没有数字前缀的函数会自动获得 `500_` 前缀。因此 `run_after_build__do_this` 与 `run_after_build__500_do_this` 是等价的。

### 1.3 什么是扩展？

扩展是一个 Bash 源文件，其中仅包含：

- 函数定义（带有 `__` 分隔符的扩展方法实现，以及内部辅助函数）
- 在文件顶部调用 `enable_extension "another-extension"`（简单的依赖系统）

:::caution 注意
扩展文件不应包含任何函数之外的代码——即被 source 时不应执行任何操作。
:::

扩展可以位于以下位置：

```text
/extensions/our-ext.sh                      # 官方，单文件
/userpatches/extensions/my-ext.sh           # 用户自定义，单文件
/extensions/our-dir-ext/our-dir-ext.sh      # 官方，目录形式
/userpatches/extensions/my-dir-ext/my-dir-ext.sh  # 用户自定义，目录形式
```

### 1.4 使用方法

通过构建参数启用扩展：

```bash
./compile.sh BOARD=... BRANCH=... ENABLE_EXTENSIONS="ext-name,another-ext"
```

完整的扩展列表请参阅 [扩展列表](./9_ExtensionsList.md)。

### 1.5 常见问题

**如何退出某个特定的钩子函数？**

在板级或系列配置文件中使用 `extension_hook_opt_out "hook_name__individual_function"`。这由板级/系列维护者自行承担风险，官方不予支持。

---

## 2. 钩子（Hooks）参考

以下钩子按构建过程中的调用顺序列出。

| 钩子名称 | 说明 | 别名 |
|---------|------|------|
| `post_family_config` | 在系列（family）配置被加载后调用，使配置有机会覆盖系列/架构的默认值。 | `config_tweaks_post_family_config` |
| `user_config` | 调用带有用户覆盖的函数。允许覆盖在其他任何地方设置的配置值。在加载 `lib.config` 之后、组装软件包列表之前调用。 | |
| `extension_prepare_config` | 允许扩展在用户配置完成后准备自身的配置。实现者应保留预设的变量值，但可以设置默认值和/或对其进行验证。 | |
| `post_aggregate_packages` | 在所有聚合完成后供用户进行最终覆盖。在聚合完所有软件包列表之后、`compilation.sh` 结束之前调用。 | `user_config_post_aggregate_packages` |
| `post_determine_cthreads` | 使配置有机会以编程方式修改 CTHREADS。在任何编译工作开始之前的早期阶段调用。 | `config_post_determine_cthreads` |
| `add_host_dependencies` | 在安装主机依赖项之前运行。将需要安装的软件包（以空格分隔）添加到 `${EXTRA_BUILD_DEPS}` 中。 | |
| `fetch_sources_tools` | 获取构建工具和构建过程所需的主机端源代码。在早期阶段运行，用于 `fetch_from_repo` 或以其他方式获取所需工具的源代码。 | |
| `build_host_tools` | 构建构建过程所需的主机端工具。在源代码获取完成后，构建构建所需的主机端工具。 | |
| `pre_install_distribution_specific` | 使配置有机会在 `install_distribution_specific` 之前执行操作。在 `create_rootfs_cache` 之后、`install_distribution_specific` 之前调用。 | `config_pre_install_distribution_specific` |
| `pre_install_kernel_debs` | 在安装 Armbian 构建的内核 deb 包之前调用。此时仍可以 `unset KERNELSOURCE` 以跳过内核安装。 | |
| `post_install_kernel_debs` | 允许配置对已安装的内核/头文件做更多操作。在 chroot 中安装完软件包、u-boot、内核和头文件之后，但在安装 BSP 之前调用。 | |
| `post_family_tweaks` | 自定义由 `$LINUXFAMILY` 特定的 `family_tweaks` 所做的调整。在 rootfs 中安装完软件包之后、启用额外服务之前运行。 | |
| `pre_customize_image` | 在 `customize-image.sh` 之前运行。在执行 `customize-image.sh` 且挂载 overlay 之前调用。 | `image_tweaks_pre_customize` |
| `post_customize_image` | `customize-image.sh` 之后的钩子。在 `customize-image.sh` 脚本运行完毕且 overlay 已卸载后运行。 | `image_tweaks_post_customize` |
| `post_post_debootstrap_tweaks` | 在移除 diversion 和 qemu、且 chroot 已卸载后运行。这是在 `${SDCARD}` 文件系统被复制到最终介质之前对其进行操作的最后机会。 | `config_post_debootstrap_tweaks` |
| `pre_prepare_partitions` | 允许为 mkfs 设置自定义选项。修改 mkfs 选项、类型等的好时机。 | `prepare_partitions_custom` |
| `prepare_image_size` | 允许基于 `$rootfs_size` 动态确定镜像大小。在 `${rootfs_size}` 已知之后、考虑 `${FIXED_IMAGE_SIZE}` 之前调用。 | `config_prepare_image_size` |
| `post_create_partitions` | 在创建完所有分区之后、但尚未格式化时调用。 | |
| `format_partitions` | 如果你创建了自己的分区，这是格式化它们的好时机。此时 loop 设备已挂载。 | |
| `pre_update_initramfs` | 允许配置介入 initramfs 的创建过程。在 rsync 同步完目标上的 `/root` 和 `/boot` 之后、调用 `update_initramfs` 之前调用。 | `config_pre_update_initramfs` |
| `pre_umount_final_image` | 允许配置在卸载镜像之前对其进行操作。在卸载 `/root` 和 `/boot` 之前调用。 | `config_pre_umount_final_image` |
| `post_umount_final_image` | 允许配置在卸载镜像之后对其进行操作。在卸载 `/root` 和 `/boot` 之后调用。 | `config_post_umount_final_image` |
| `post_build_image` | 自定义的构建后钩子。在最终 .img 文件构建完成之后、写入 SD 写入器之前调用。最终镜像路径可通过 `${FINAL_IMAGE_FILE}` 获取。 | |
| `run_after_build` | 用于在构建后运行函数的钩子。是整个构建流程中最后被调用的钩子之一。仅在构建过程中没有错误时才会运行。 | |
| `extension_metadata_ready` | 元数据中的元数据！实现此钩子以处理扩展管理器提供的元数据。此钩子执行完毕后，`${EXTENSION_MANAGER_TMP_DIR}` 将被删除。 | |
