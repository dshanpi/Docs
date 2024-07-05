---
sidebar_position: 8
---
# 配置时钟

配置`clk`与小核的 `boot` 选项，驱动位于`kernel/linux-4.9/drivers/remoteproc/sunxi_rproc_boot.c ` 可以自行参考

```c
struct sunxi_core *sunxi_remote_core_find(const char *name);

int sunxi_core_init(struct sunxi_core *core);

void sunxi_core_deinit(struct sunxi_core *core);

int sunxi_core_start(struct sunxi_core *core);

int sunxi_core_is_start(struct sunxi_core *core);

int sunxi_core_stop(struct sunxi_core *core);

void sunxi_core_set_start_addr(struct sunxi_core *core, u32 addr);

void sunxi_core_set_freq(struct sunxi_core *core, u32 freq);
```

### 使用 debugfs 加载固件

由于已经对外注册了接口，这里只需要使用命令即可启动小核心。假设小核的`elf`名字叫`e907.elf` 并且已经放置进 `lib/firmware` 文件夹

```
echo e907.elf > /sys/kernel/debug/remoteproc/remoteproc0/firmware
echo start > /sys/kernel/debug/remoteproc/remoteproc0/state
```
