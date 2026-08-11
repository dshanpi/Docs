---
sidebar_position: 1
---

# 文件系统 FAQ

本文档基于瑞芯微官方文档 `Rockchip_Developer_FAQ_FileSystem_CN.pdf`（V1.1, 2019-04-23）整理，介绍 Linux 文件系统开发中的常见问题，包括存储栈、数据回写、预读、掉电保护、性能测试和 IO 高性能编程。

:::info 适用范围
- **芯片平台**：全系列
- **内核版本**：通用
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## Linux Storage Stack

Linux 存储栈的整体结构：

```
用户态应用程序
    ↓
VFS（虚拟文件系统）
    ↓
具体文件系统（ext4 / f2fs 等）
    ↓
Block Layer（块设备层）
    ↓
物理存储设备（EMMC / SD / NAND 等）
```

从用户态发起一个系统调用，一般经过这样的流程：**VFS → FS(ext4/f2fs) → Block Layer → Physical Devices**。

---

## 系统调用与 C 库函数

`fopen` 和 `open`，`read` 和 `fread`，`write` 和 `fwrite` 的区别经常让人混淆，在此做一个清晰的说明。

- **open / read / write**：Linux 提供的**系统调用**，用户态程序通过这些接口访问文件系统层
- **fopen / fread / fwrite**：**C 库**提供的文件读写接口，核心实现基于 open/read/write 系统调用

**使用建议**：
- 做文本数据输入输出 → C 库接口更方便（有 fputs/fgets 等字符串处理）
- 做底层控制或大块数据操作 → 系统调用更直接

:::note 重要
绝大部分 C 库都为文件接口提供**一层缓存**。调用 `fwrite` 操作时，数据先放到这一层缓存中，编程时必须注意。
:::

---

## Linux 数据回写

这是最常被问到的问题：**为什么 fwrite/write 函数已经返回了，掉电或重启后数据会丢失？**

问题的根源在于**缓存的存在**。存储设备属于低速设备，直接操作会有严重延迟，所以通常在 DRAM 上先缓存一部分数据。DRAM 是易失性存储设备，掉电数据就丢了。

:::caution 注意
缓存可能有好多层（C 库缓存 → Page Cache → 设备缓存），必须从上到下把每一层缓存都刷出去。
:::

### 主动同步回写

#### 系统调用方式

```c
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

int fd;
ssize_t wr;
char szBuf[] = "hello world";

fd = open("/sdcard/test.txt", O_CREAT|O_WRONLY|O_TRUNC, S_IRWXU | S_IRWXG);
wr = write(fd, szBuf, strlen(szBuf));
// 在这里掉电，test.txt 将会是空文件
// close 并不能保证数据回写
```

**修正后：**

```c
fd = open("/sdcard/test.txt", O_CREAT|O_WRONLY|O_TRUNC, S_IRWXU | S_IRWXG);
wr = write(fd, szBuf, strlen(szBuf));

#if 0
fdatasync(fd);  // 只回写数据
#else
fsync(fd);      // 回写数据和元数据（文件大小、最后修改时间等）
#endif

close(fd);  // 这里掉电是安全的
```

#### C 库方式

```c
#include <stdio.h>

FILE *fp = NULL;

fp = fopen("/sdcard/test.txt", "w+");
fputs("hello world", fp);
fclose(fp);
// 在这里掉电，test.txt 将会是空文件
```

**原因**：C 库有一层文件缓存，数据还在 C 库缓存中。`fflush` 只能把 C 库缓存写回到内核的 Page Cache，依然需要 `fsync` 再刷到物理存储设备。

**正确写法：**

```c
#include <stdio.h>

FILE *fp = NULL;
int fd;

fp = fopen("/sdcard/test.txt", "w+");
fputs("hello world", fp);
fflush(fp);                 // C 库缓存写回到内核 page cache
fd = fileno(fp);
fsync(fd);                  // page cache 回写到物理设备
fclose(fp);                 // 这里掉电数据是安全的
```

#### Java 方式

常见的 Java 写文件 Demo：

```java
public static void writeFile(String filePath, String conent) {
    BufferedWriter out = null;
    try {
        out = new BufferedWriter(new OutputStreamWriter(
            new FileOutputStream(filePath, true)));
        out.write(conent);
        // 这里掉电会丢数据
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        try {
            if (out != null) { out.close(); }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

`BufferedWriter` 有缓存，`flush` 也只能写到 Page Cache，还需要触发 fsync。

**正确写法：**

```java
public static void writeFile(String filePath, String conent) {
    BufferedWriter out = null;
    try {
        FileOutputStream fos = new FileOutputStream(filePath, true);
        out = new BufferedWriter(new OutputStreamWriter(fos));
        out.write(conent);
        out.flush();                          // 数据写到 page cache
        FileUtils.sync(fos);                  // 数据写到物理设备，方法1
        // FileDescriptor fd = fos.getFD();
        // fd.sync();                         // 数据写到物理设备，方法2
        // 这里掉电是安全的
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        try {
            if (out != null) { out.close(); }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 异步后台回写

Linux 内核会定时触发，把**已经提交到 Page Cache 的脏数据**写回到物理设备。

:::note 注意
如果数据还在上层缓存（Java 或 C 库的缓存）中没有刷下来，不会被内核的异步回写机制写回。
:::

**异步回写机制步骤：**

1. 内核按 `dirty_writeback_centisecs` 的时间间隔唤醒回写线程
2. 回写线程遍历 Page Cache，寻找被标记为脏的时间超过 `dirty_expire_centisecs` 的页面，全部回写
3. 回写线程判断脏数据总量是否超过 `dirty_background_ratio`（百分比）或 `dirty_background_bytes`，超过则回写所有脏数据
4. 回写线程等待下次唤醒周期

:::caution 注意
脏数据超过 `dirty_ratio` 和 `dirty_bytes` 以后，如果继续写数据会**自动触发同步回写**——即这一次的 write 会把之前和本次的数据都写回到物理设备再返回。
:::

### 回写参数说明

所有参数都位于 `/proc/sys/vm` 目录：

| 参数 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `dirty_writeback_centisecs` | 内核回写线程的唤醒周期，单位 10ms | 500（即 5s） |
| `dirty_expire_centisecs` | 脏数据过期时间，单位 10ms。从 Page 被标记为脏算起，超过这个时间被认为是过期数据 | 3000（即 30s） |
| `dirty_background_ratio` | 脏数据总量占可用内存的百分比阈值，超过则全部回写 | 10 |
| `dirty_background_bytes` | 脏数据总量阈值（字节），与 ratio 互斥 | 0 |
| `dirty_ratio` | 脏数据占可用内存百分比，超过后阻塞 write，强制同步回写 | 20 |
| `dirty_bytes` | 脏数据总量阈值（字节），与 dirty_ratio 互斥 | 0 |

:::tip 说明
- `dirty_background_ratio` 和 `dirty_background_bytes` 互斥，写其中一个另一个自动清 0
- `dirty_ratio` 和 `dirty_bytes` 互斥
- 百分比的基数是**可用内存大小**（包括可回收的内存），不是总内存
- 默认情况下，脏数据量没有超过阈值时，数据要等 30s 以上才会回写；考虑唤醒周期，最长可能 35s
:::

### 调整建议

对于视频监控等产品，默认配置可能导致数据累积很多才回写，给存储设备压力很大。可以减小 `dirty_background_ratio` 和 `dirty_writeback_centisecs`，让数据写入更平滑。

:::caution 注意
- 从掉电安全考虑，这两个值不能无限减小，太小会导致后台一直在做数据回写，增加掉电丢数据的风险
- 这些改动是**全局**的，对所有存储设备都生效，需慎重
:::

**Linux 在 bashrc 中配置：**

```bash
echo 5 > /proc/sys/vm/dirty_background_ratio
```

**Android 在 init.rc 中配置：**

```
write /proc/sys/vm/dirty_background_ratio 5
```

---

## Linux 数据预读

Linux 系统中，默认情况下不管是用户态调用 `read`，还是内核态调用 `vfs_read`，都会触发数据预读——多读一部分数据到 Page Cache 中。

这在**顺序读**的场景下对性能提升非常明显。高性能存储设备可以通过**加大预读窗口大小**来大幅提升顺序读性能。

### 全局控制（按存储设备）

以存储设备为单位，建议低速设备用 128KB，高速设备用 2048KB：

```bash
echo 2048 > /sys/block/mmcblk0/queue/read_ahead_kb
echo 2048 > /sys/block/dm-0/queue/read_ahead_kb
```

:::note 注意
很多设备开启了 verity 和 encrypt，最终物理存储设备会被映射成 `dm-x` 这样的逻辑设备，这些逻辑设备的预读窗口也要一起改掉才会生效。
:::

### 文件单独控制

通过 `posix_fadvise` 系统调用给文件一个调整预读窗口的提示（Hint）：

```c
#include <fcntl.h>

// 暗示顺序访问，内核会加大预读窗口
posix_fadvise(fd, start, len, POSIX_FADV_SEQUENTIAL);

// 暗示随机访问，内核会禁止预读
posix_fadvise(fd, start, len, POSIX_FADV_RANDOM);

// 暗示指定范围内只会访问一次
posix_fadvise(fd, start, len, POSIX_FADV_NOREUSE);

// 暗示短时间内会访问这个范围的数据
posix_fadvise(fd, start, len, POSIX_FADV_WILLNEED);

// 暗示短时间内不会访问某段数据
posix_fadvise(fd, start, len, POSIX_FADV_DONTNEED);
```

---

## 文件掉电保护

每个文件系统都有自己的掉电保护机制，但只保证**文件系统本身的完整性**，而无法保证**文件的完整性**。

### 概念区分

- **文件系统的完整性**：文件系统可正常挂载，所有文件和目录都可正常访问，所有文件操作正常完成
- **文件的完整性**：文件可正常读写且功能正常（如媒体文件能正常播放、XML 能正常解析、压缩文件能正常解压）

### 问题示例

假设有一个应用程序在写 XML 文件保存配置信息，就在写数据的过程中发生掉电：

```c
fd = open("/sdcard/test.xml", O_CREAT|O_WRONLY|O_TRUNC, S_IRWXU | S_IRWXG);
{
    // 在这个区间发生随机掉电
    wr = write(fd, szBuf, 8192);
    fsync(fd);
    close(fd);
}
```

重新上电后：
- 文件系统完整性可以保证（A 和 B 文件正常访问）
- test.xml 可能存在也可能不存在（不启用 dirsync 的情况下）
- 如果存在，数据大小可能是 [0-8192] 的任意值，应用可能无法解析

**原因**：write 和 fsync 不是原子操作，大部分文件系统的系统调用都无法保证原子性。文件的完整性需要应用自己来保证。

### 解决方案：AtomicFile

Android 实现的 `AtomicFile`，利用 `rename` 函数的原子性来解决问题。

**核心流程：**
1. 写数据前把原文件改名成备份文件（`.bak`）
2. 创建新文件写入数据
3. 写入完成后删除备份文件
4. 读文件前检查备份文件是否存在，存在说明发生掉电，用备份文件恢复

**使用示例：**

```java
public static void write(AtomicFile file, IntervalStats stats) throws IOException {
    FileOutputStream fos = file.startWrite();
    try {
        // startWrite 和 finishWrite 中间的写操作可以确保原子性
        write(fos, stats);
        file.finishWrite(fos);  // 假设掉电位置
        fos = null;
    } finally {
        // When fos is null (successful write), this will no-op
        file.failWrite(fos);
    }
}
```

:::caution 注意
Android 的 `AtomicFile` 只保证 `startWrite` 和 `finishWrite` 之间的写数据原子性（要么全部完成，要么全部失败），**不保证 finishWrite 完成后掉电能看到新数据**。

原因：`finishWrite` 中的删除备份文件操作不能保证写回磁盘，重新开机后 `openRead` 会发现备份文件还在，就会把实际已经写好的新文件删掉，用备份文件覆盖。
:::

### 确保 finishWrite 后数据可见

主要有两种方式：

1. **挂载时加 `MS_DIRSYNC` 参数** — 方便但整个挂载点的所有目录都进入 DIRSYNC 模式，文件创建/删除频繁时性能损失明显
2. **通过 ioctl 精确控制需要保护的目录** — 减少性能损失，但需要清楚哪些目录需要保护，且不同文件系统的命令和标志不同

:::tip 提示
默认情况下 Android 会把所有外部存储配上 `MS_DIRSYNC` 选项，所以外部存储不需要任何修改。内部存储则没有加（Android 设备多带电池，内部存储基本不需要考虑掉电）。
:::

**为内部存储加 dirsync 方法：**

修改 `system/core/fs_mgr/fs_mgr_fstab.c`，添加 dirsync 支持：

```c
{ "dirsync", MS_DIRSYNC },
```

修改设备 fstab 文件，在 data 目录最后一列加上 `dirsync`：

```
/dev/block/platform/fe330000.sdhci/by-name/userdata  /data  f2fs  noatime,nodiratime,nosuid,nodev,discard,inline_xattr,dirsync  wait,check,notrim,forceencrypt=/metadata/key_file
```

---

## 性能测试

### dd 命令（顺序性能测试）

几乎所有 Linux 系统都包含 `dd` 命令，用于顺序读写测试。注意清 cache 和回写。

```bash
#!/system/bin/sh
# 删除上一次测试数据
rm -f /data/local/2g
sync
# 启用 discard 的文件系统，删除会触发 discard，休眠避免影响
sleep 30s

# 写性能测试
busybox dd if=/dev/zero of=/data/local/2g bs=4K count=512K

# 触发回写，清 cache
cat /proc/meminfo | grep 'Dirty' -A 1
time sync
echo 3 > /proc/sys/vm/drop_caches

# 读性能测试
busybox dd if=/data/local/2g of=/dev/null bs=4K count=512K
```

**测试存储设备本身的性能**（将路径换成设备节点）：

```bash
sync
echo 3 > /proc/sys/vm/drop_caches

# 读性能测试
busybox dd if=/dev/block/dm-0 of=/dev/null bs=4K count=512K

# 写性能测试（注意：会破坏文件系统，慎重！）
busybox dd if=/dev/zero of=/dev/block/dm-0 bs=4K count=512K

time sync
```

### iozone（全面性能测试）

开源文件系统性能测试套件，支持 direct 和 buffer 两套接口。

**常见选项：**

| 选项 | 说明 |
| :--- | :--- |
| `-a` | Auto mode |
| `-f filename` | 测试使用的文件 |
| `-b filename` | 生成 Excel 报告文件 |
| `-I` | 使用 Direct IO |
| `-L #` | 设置处理器 cache line 大小（字节） |
| `-q #` | auto 模式的最大记录大小（KB） |
| `-R` | 生成 Excel 报告 |
| `-s #` | 文件大小（Kb / m / g） |
| `-S #` | 处理器 cache 大小（KB） |

**Buffer IO 测试：**

```bash
./iozone -a -s 1g -q 256 -S 512 -L 64 -f /data/iozone.dat -R -b ./iozone.xls
```

**Direct IO 测试：**

```bash
./iozone -a -I -s 1g -q 256 -S 512 -L 64 -f /data/iozone.dat -R -b ./iozone.xls
```

### fio（高级 benchmark）

fio 是开源的文件系统 benchmark，底层文件系统和存储驱动开发更常用。

**示例配置文件（external/fio/examples/tiobench-example.fio）：**

```
[global]
direct=1          ; 启用 direct io
size=64m          ; 文件大小
bsrange=4k-4k     ; 每次读取的数据块大小范围
timeout=60        ; 超时时间
numjobs=4         ; 每个 job 并发 4 个线程

[f1]
rw=write

[f2]
stonewall
rw=randwrite

[f3]
stonewall
rw=read

[f4]
stonewall
rw=randread
```

**运行测试：**

```bash
mmm external/fio/
adb push out/target/product/rk3399/system/bin/fio /data/local/
adb push external/fio/examples/tiobench-example.fio /data/local/
cd /data/local/
./fio tiobench-example.fio
```

---

## IO 高性能编程

### Direct IO

Direct IO 绕过内核的 Page Cache，直接读写存储设备。适用于应用程序自己管理文件缓存、自己控制回写时间的场景（如数据库）。

使用时在 `open` 时传入 `O_DIRECT` 标志。

:::caution 注意
Direct IO 模式下要求 write 的 buffer 和 count 都必须 **block 对齐**（一般为 512 字节）。
:::

**示例：**

```c
#include <fcntl.h>
#include <unistd.h>
#include <stdlib.h>

// 不能用 malloc，要用 posix_memalign 保证对齐
int ret = posix_memalign((void **)&buf_a, 512, bs);
if (ret) {
    perror("posix_memalign failed");
    exit(1);
}

// 传入 O_DIRECT 标志
fd = open(fileName, O_DIRECT | O_RDWR, S_IRWXU);
if (fd < 0) {
    printf("open %s failed", fileName);
    return false;
}

ret = write(fd, buf, bs);
```

### Async IO

异步 IO（AIO）让 CPU 和 IO 可以并行工作。Linux 平台下有两套：

#### 1. glibc aio

glibc 的 aio 是通过**创建新线程**来做实际 IO 操作，以释放主线程。

**主要接口：**

| 接口 | 功能 |
| :--- | :--- |
| `aio_read` | 提交一个异步读 |
| `aio_write` | 提交一个异步写 |
| `aio_cancel` | 取消一个异步请求 |
| `aio_error` | 查看请求状态 |
| `aio_return` | 查看请求返回值 |
| `aio_suspend` | 阻塞等待请求完成 |

**通知方式：**
- 轮询 `aio_error`
- `aio_suspend` 阻塞等待
- **信号通知**（`SIGEV_SIGNAL`）
- **线程回调**（`SIGEV_THREAD`）

:::note 提示
Android 平台不支持 glibc aio。
:::

#### 2. Linux native aio

内核直接提供的 AIO 接口，所有 Linux 发行版都能用（包括 Android）。通常通过 `libaio` 辅助编程。

**主要接口：**

| 接口 | 功能 |
| :--- | :--- |
| `io_setup` | 创建异步 IO 上下文 |
| `io_destroy` | 销毁异步 IO 上下文 |
| `io_submit` | 提交异步 IO 请求 |
| `io_cancel` | 取消异步 IO 请求 |
| `io_getevents` | 等待并获取异步 IO 事件 |

**示例：**

```c
#include <stdio.h>
#include <fcntl.h>
#include <libaio.h>

#define MAX_COUNT 1024
#define BUF_SIZE (1 * 1024 * 1024)

int main(int args, void *argv[]) {
    int fd;
    void *buf = NULL;
    int pagesize = sysconf(_SC_PAGESIZE);
    posix_memalign(&buf, pagesize, BUF_SIZE);
    memset(buf, 'A', BUF_SIZE);

    io_context_t ctx;
    struct iocb io, *p = &io;
    struct io_event e[10];

    memset(&ctx, 0, sizeof(ctx));
    if (io_setup(MAX_COUNT, &ctx) != 0) {
        printf("io_setup error\n");
        return -1;
    }

    fd = open("./test.txt", O_WRONLY | O_CREAT | O_APPEND | O_DIRECT, 0644);

    int n = MAX_COUNT;
    while (n > 0) {
        io_prep_pwrite(&io, fd, buf, BUF_SIZE, 0);
        if (io_submit(ctx, 1, &p) != 1) {
            printf("io_submit error\n");
            break;
        }
        // 这里可以做其他事情

        int ret = io_getevents(ctx, 1, 10, e, NULL);
        n--;
    }

    close(fd);
    io_destroy(ctx);
    return 0;
}
```

:::tip 对比
- glibc aio：更简洁易懂，但是用多线程模拟，有线程创建和同步通信开销
- linux native aio：利用 CPU 和 IO 并行工作原理，更节省 CPU，但编程更复杂

**CPU 资源紧张的场景推荐使用 linux native aio。**
:::

### 通过 ioctl 控制数据回写

文件系统的很多高级功能通过 ioctl 实现。以下介绍 f2fs 的两个特性：

#### Atomic Write

实现原子写，保证异常掉电下文件的数据一致性。可应用于数据库优化（SQLite 在 f2fs 下比 ext4 性能好很多）。

```c
case SQLITE_FCNTL_BEGIN_ATOMIC_WRITE:
    return osIoctl(pFile->h, F2FS_IOC_START_ATOMIC_WRITE);

case SQLITE_FCNTL_COMMIT_ATOMIC_WRITE:
    return osIoctl(pFile->h, F2FS_IOC_COMMIT_ATOMIC_WRITE);

case SQLITE_FCNTL_ROLLBACK_ATOMIC_WRITE:
    return osIoctl(pFile->h, F2FS_IOC_ABORT_VOLATILE_WRITE);
```

#### Volatile Write

强制数据缓存在 page cache 中，减少 writeback 对性能的影响。适用于可丢失的数据（如缓存文件）。

```c
static int keepFileInMemory(int fd) {
    ioctl(fd, F2FS_IOC_START_VOLATILE_WRITE);
    // 这段区间对这个文件的写操作全部在内存中，不会发生回写
    // ...
    ioctl(fd, F2FS_IOC_RELEASE_VOLATILE_WRITE);
}
```

---

## 开机 LOG 分析

### 挂载失败

Android 7.0 以后大部分厂商默认启用加密。对 DATA 分区来说，整个开机过程会有**两次 Mount 动作**：

1. 第一次直接挂载原始设备（加密过的分区），如果失败说明分区已加密
2. Vold 配置 dm-crypt 设备节点，多一个 `dm-x` 设备
3. 第二次挂载 `dm-x` 设备（解密后的分区）

:::tip 判断方法
启用加密后的首次挂载失败有两个特征：
1. 失败日志中有 **"Magic Mismatch"** 提示
2. 设备节点是 `"userdata"`

符合这两个特征基本是启用加密后的正常日志，继续找后面挂载 dm-x 设备的日志即可。
:::

---

## 参考资料

- 原始文档：`Rockchip_Developer_FAQ_FileSystem_CN.pdf` V1.1
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
