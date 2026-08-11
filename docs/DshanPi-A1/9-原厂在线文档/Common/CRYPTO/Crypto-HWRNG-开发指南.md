---
sidebar_position: 1
---

# Crypto / HWRNG 开发指南

本文档基于瑞芯微官方文档 `Rockchip_Developer_Guide_Crypto_HWRNG_CN.pdf`（V1.3.0, 2024-04-24）整理，介绍 Rockchip 平台硬件加密模块（Crypto）和硬件随机数生成器（HWRNG / TRNG）的驱动开发与上层应用开发。

:::info 适用范围
- **芯片平台**：RK 全系列芯片（RK3399 / RK3288 / RK3368 / RK3328 / RK322x / RK3128 / RK3126 / RK3326/PX30 / RK3308 / RK1808 / RV1126/RV1109 / RK356x / RK3588 / RV1106 / RK3528 / RK3562 / RK3576 等）
- **内核版本**：Linux 4.19 / 5.10
- **读者对象**：技术支持工程师、软件开发工程师
:::

---

## 概述

### Crypto 版本说明

当前 RK 平台上 CRYPTO IP 有四个版本：CRYPTO V1 / V2 / V3 / V4。

| 版本 | 说明 |
| :--- | :--- |
| **V1** | 早期 IP，支持的算法和功能较少 |
| **V2** | 重新设计的 IP 核，在 V2 基础上进行了功能强化和更新，V2/V3/V4 在基础功能上完全兼容 |
| **V3** | 在 V2 算法基础上增加多线程切换支持。从 RV1106 开始，crypto v3 可自动识别支持的算法，compatible 统一使用 `"rockchip,crypto-v3"` |
| **V4** | 在 V3 基础上优化芯片面积，使用同一个 CRYPTO CORE 硬件，例化出 NSCRYPTO / SCRYPTO / KEYLAD 三个硬件 IP。驱动使用上和 crypto v3 兼容复用 |

### TRNG 说明

- 早期芯片平台的硬件随机数模块内置在硬件 CRYPTO IP 之中（包括 CRYPTO V1 和部分 CRYPTO V2）
- 从 **RK356x** 开始，HWRNG（TRNG）是**独立**的硬件模块

### 各平台 Crypto IP 版本

| 版本 | 芯片平台 |
| :--- | :--- |
| **crypto v1** | RK3399、RK3288、RK3368、RK3328/RK3228H、RK322x、RK3128、RK1108、RK3126 |
| **crypto v2** | RK3326/PX30、RK3308、RK1808、RV1126/RV1109、RK2206、RK356x、RK3588 |
| **crypto v3** | RV1106 |
| **crypto v4** | RK3528、RK3562 |

### Crypto V1 算法支持

| 算法 | 描述 |
| :--- | :--- |
| DES/TDES | 支持 ECB/CBC 两种模式，TDES 支持 EEE 和 EDE 两种密钥模式 |
| AES | 支持 ECB/CBC/CTR/XTS 模式，支持 128/192/256 bit 三种密钥长度 |
| HASH | 支持 SHA1/SHA256/MD5 |
| RSA | 支持 512/1024/2048 三种密钥长度（RK3126、RK3128、RK3288 和 RK3368 不支持） |
| TRNG | 支持 256bit 硬件随机数 |

### Crypto V2 算法支持

| 算法 | 描述 |
| :--- | :--- |
| DES/TDES | 支持 ECB/CBC/OFB/CFB 四种模式，TDES 只支持 EDE 密钥模式 |
| AES | 支持 ECB/CBC/OFB/CFB/CTR/CTS/XTS/CCM/GCM/CBC-MAC/CMAC |
| SM4 | 支持 ECB/CBC/OFB/CFB/CTR/CTS/XTS/CCM/GCM/CBC-MAC/CMAC（可选） |
| HASH | 支持 MD5/SHA1/SHA224/SHA256/SHA384/SHA512/SM3/SHA512-224/SHA512-256 带硬件填充（SM3 是可选的） |
| HMAC | 支持 MD5/SHA1/SHA256/SHA512/SM3 带硬件填充 |
| RSA/ECC | 支持最大 4096bit 的常用大数运算操作，通过软件封装可实现 RSA/ECC 算法 |
| TRNG | 支持 256bit 硬件随机数 |

### Crypto V2/V3/V4 硬件差异表

| 芯片平台 | AES | DES/TDES | SM3/SM4 | HASH | 多线程 | HMAC | RSA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RK3326/PX30/RK3308 | √ | √ | × | √ | × | √ | √ |
| RK1808 | AES-128 | × | × | SHA-1/SHA-224/SHA256/MD5 | × | √ | × |
| RV1126/RV1109 | AES128/AES-256 | √ | × | √ | × | √ | √ |
| RK2206 | √ | √ | × | √ | × | √ | √ |
| RK3568/RK3588 | √ | √ | √ | √ | × | √ | √ |
| RV1106 | √ | √ | √ | SHA-1/SHA224/SHA256/MD5 | × | √ | √ |
| RK3562 | √ | √ | × | SHA-1/SHA224/SHA256/MD5 | √ | √ | √ |
| RK3528 | √ | √ | √ | √ | √ | √ | √ |

:::note 注意
1. RK1808：AES 仅支持 128bit，对于 kernel 驱动来说可以认为不支持 AES。
2. RV1126/RV1109：由于不支持 AES-192，因此 AES-192 部分只能通过软算法实现，但软算法不能支持硬算法的所有模式。建议不要改动代码里已配置好的算法列表。
:::

---

## 驱动开发

### 驱动代码说明

#### HWRNG

由于 hwrng 驱动比较简单，crypto v1/v2、trngv1、rkrng 四种平台都集中到同一个 `.c` 文件中。

驱动中不区分具体的芯片型号，只按照以下四种 compatible 进行划分：

- `rockchip,cryptov1-rng` — 内置在 CYRPTO 模块中的 V1 版本随机数
- `rockchip,cryptov2-rng` — 内置在 CYRPTO 模块中的 V2 版本随机数
- `rockchip,trngv1` — 独立的 HWRNG 模块（如 RK3588、RV1106）
- `rockchip,rkrng` — 独立的 HWRNG 模块

驱动代码路径：

```
drivers/char/hw_random/rockchip-rng.c
```

#### Crypto

驱动相关文件：

```
drivers/crypto/rockchip
|-- procfs.c                        // proc 统计信息（时钟频率、算法列表等）
|-- procfs.h
|-- rk_crypto_bignum.c              // crypto PKA 大数运算 API
|-- rk_crypto_bignum.h
|-- rk_crypto_core.c                // Linux crypto 驱动框架和公共接口
|-- rk_crypto_core.h
|-- rk_crypto_ahash_utils.c         // ahash 公共 API
|-- rk_crypto_ahash_utils.h
|-- rk_crypto_skcipher_utils.c      // skcipher 公共 API
|-- rk_crypto_skcipher_utils.h
|-- rk_crypto_utils.c               // crypto 公共 API
|-- rk_crypto_utils.h
|-- rk_crypto_v1.c                  // crypto v1 硬件相关接口
|-- rk_crypto_v1.h
|-- rk_crypto_v1_skcipher.c         // crypto v1 分组密码算法实现
|-- rk_crypto_v1_ahash.c            // crypto v1 哈希算法实现
|-- rk_crypto_v1_reg.h              // crypto v1 硬件寄存器定义
|-- rk_crypto_v2.c                  // crypto v2 硬件相关接口
|-- rk_crypto_v2.h
|-- rk_crypto_v2_skcipher.c         // crypto v2 分组密码算法实现
|-- rk_crypto_v2_ahash.c            // crypto v2 哈希算法实现
|-- rk_crypto_v2_akcipher.c         // crypto v2 RSA 算法实现
|-- rk_crypto_v2_pka.c              // crypto v2 PKA 操作实现
|-- rk_crypto_v2_reg.h              // crypto v2 硬件寄存器定义
|-- rk_crypto_v3.c                  // crypto v3/v4 硬件相关接口
|-- rk_crypto_v3.h
|-- rk_crypto_v3_skcipher.c         // crypto v3/v4 分组密码算法实现
|-- rk_crypto_v3_ahash.c            // crypto v3/v4 哈希算法实现
|-- rk_crypto_v3_reg.h              // crypto v3/v4 硬件寄存器定义
`-- cryptodev_linux                 // 导出 crypto 接口到用户空间
```

### 启用硬件 HWRNG

#### Menuconfig 配置

hwrng 驱动会默认编译进内核，由 dts 文件决定是否使能。

在 defconfig 中添加：

```
CONFIG_HW_RANDOM=y
CONFIG_HW_RANDOM_ROCKCHIP=y
```

#### 板级 dts 文件配置

大部分芯片 dtsi 都已配置好 hwrng 节点，只需在板级 dts 中使能：

```dts
&rng {
    status = "okay";
};
```

#### 新增芯片 dtsi 文件配置

如果 dtsi 未配置好 hwrng 节点，可以参考以下方式配置。

**注意**：
- rng 基地址需要根据芯片 TRM 修改
- clocks 宏不同平台可能略有不同，可在 `include/dt-bindings/clock` 目录下 `grep -rn CRYPTO` 查找

**crypto v1 节点**：

```dts
rng: rng@ff060000 {
    compatible = "rockchip,cryptov1-rng";
    reg = <0x0 0xff060000 0x0 0x4000>;
    clocks = <&cru SCLK_CRYPTO>, <&cru HCLK_CRYPTO_SLV>;
    clock-names = "clk_crypto", "hclk_crypto";
    assigned-clocks = <&cru SCLK_CRYPTO>, <&cru HCLK_CRYPTO_SLV>;
    assigned-clock-rates = <150000000>, <100000000>;
    status = "disabled";
};
```

**crypto v2 节点**（TRNG 实际只需依赖 `hclk_crypto`）：

```dts
rng: rng@ff500400 {
    compatible = "rockchip,cryptov2-rng";
    reg = <0xff500400 0x80>;    // 如 rng 在 crypto 内部，需要加上 0x400 偏移
    clocks = <&cru HCLK_CRYPTO>;
    clock-names = "hclk_crypto";
    power-domains = <&power RV1126_PD_CRYPTO>;
    resets = <&cru SRST_CRYPTO_CORE>;
    reset-names = "reset";
    status = "disabled";
};
```

**trng v1 节点**（RK3588、RV1106 使用，随机性更强）：

```dts
rng: rng@fe378000 {
    compatible = "rockchip,trngv1";
    reg = <0x0 0xfe378000 0x0 0x200>;
    interrupts = <GIC_SPI 400 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&scmi_clk SCMI_HCLK_SECURE_NS>;
    clock-names = "hclk_trng";
    resets = <&scmi_reset SRST_H_TRNG_NS>;
    reset-names = "reset";
    status = "disabled";
};
```

#### 确认 HWRNG 已启用的方法

1. 查看当前使用的 RNG 驱动：

   ```bash
   cat /sys/devices/virtual/misc/hw_random/rng_current
   # 输出 rockchip 表示硬件驱动已启用
   ```

2. 读取随机数验证（每次输出应不同）：

   ```bash
   # Linux
   cat /dev/hwrng | od -x | head -n 1

   # Android
   cat /dev/hw_random | od -x | head -n 1
   ```

### 启用硬件 Crypto

#### Menuconfig 配置

在 menuconfig 中使能 Rockchip 加解密驱动：

```
CONFIG_CRYPTO_HW=y
CONFIG_CRYPTO_DEV_ROCKCHIP=y
CONFIG_CRYPTO_DEV_ROCKCHIP_V3=y      # 根据芯片版本选择
CONFIG_CRYPTO_DEV_ROCKCHIP_DEV=y
```

:::tip 建议使用 menuconfig 形式进行修改，会自动选择对应平台的配置项。
:::

#### 板级 dts 文件配置

确认 crypto 的 dts 节点配置正常后，在板级 dts 中开启：

```dts
&crypto {
    status = "okay";
};
```

#### 新增芯片平台支持

如果芯片 dtsi 中没有配置 crypto 节点，按以下步骤添加支持：

1. 确定芯片 crypto IP 版本（V1/V2/V3）
2. 在 `drivers/crypto/rockchip/rk_crypto_core.c` 中添加对应的 `algs_name`、`soc_data`、`compatible` 等信息
3. 芯片 dtsi 增加 crypto 配置

**示例：在驱动中添加 PX30（crypto v2）支持**：

```c
/* 增加芯片支持的算法信息 */
static char *px30_algs_name[] = {
    "ecb(aes)", "cbc(aes)", "xts(aes)",
    "ecb(des)", "cbc(des)",
    "ecb(des3_ede)", "cbc(des3_ede)",
    "sha1", "sha256", "sha512", "md5",
};

/* 绑定 algs_name 到 soc_data */
static const struct rk_crypto_soc_data px30_soc_data =
    RK_CRYPTO_V2_SOC_DATA_INIT(px30_algs_name, false);

/* 绑定 soc_data 到 compatible */
static const struct of_device_id crypto_of_id_table[] = {
    {
        .compatible = "rockchip,px30-crypto",
        .data = (void *)&px30_soc_data,
    },
    { /* sentinel */ }
};
```

**crypto v1 dtsi 节点示例**：

```dts
crypto: cypto-controller@ff8a0000 {
    compatible = "rockchip,rk3288-crypto";
    reg = <0x0 0xff8a0000 0x0 0x4000>;
    interrupts = <GIC_SPI 48 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&cru ACLK_CRYPTO>, <&cru HCLK_CRYPTO>,
             <&cru SCLK_CRYPTO>, <&cru ACLK_DMAC1>;
    clock-names = "aclk", "hclk", "sclk", "apb_pclk";
    resets = <&cru SRST_CRYPTO>;
    reset-names = "crypto-rst";
    status = "disabled";
};
```

**crypto v2 dtsi 节点示例**（寄存器空间分为 cipher + pka 两部分）：

```dts
crypto: crypto@ff500000 {
    compatible = "rockchip,rv1126-crypto";
    reg = <0xff500000 0x400>, <0xff500480 0x3B80>;
    interrupts = <GIC_SPI 3 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&cru CLK_CRYPTO_CORE>, <&cru CLK_CRYPTO_PKA>,
             <&cru ACLK_CRYPTO>, <&cru HCLK_CRYPTO>;
    clock-names = "aclk", "hclk", "sclk", "apb_pclk";
    power-domains = <&power RV1126_PD_CRYPTO>;
    resets = <&cru SRST_CRYPTO_CORE>;
    reset-names = "crypto-rst";
    status = "disabled";
};
```

#### 确认硬件 crypto 已启用的方法

**方法 1：查看注册的算法**

```bash
cat /proc/crypto | grep rk
```

**方法 2：查看 crypto 驱动详细信息**

```bash
cat /proc/rkcrypto
```

输出包括：
- CRYPTO 版本（如 `CRYPTO V2.0.0.0`，带 `multi` 表示支持多线程）
- 时钟信息（aclk / hclk / sclk / pka）
- 支持的算法列表（CIPHER / AEAD / HASH / HMAC / ASYM）
- 统计信息（busy_cnt / enqueue_cnt / dequeue_cnt / done_cnt / irq_cnt 等）

---

## 应用层开发

### User space 调用硬件 HWRNG

有两种方式获取硬件 hwrng 输出的随机数：

1. 读取 kernel 驱动节点
2. 调用 librkcrypto 库中的接口

:::info 提示
hwrng 硬件驱动注册成功后会为 kernel random 驱动增加熵。kernel 的 random 驱动是 CSPRNG（密码学安全的伪随机数生成器）。如果对随机数质量要求较高，可以读取 `/dev/random` 或 `/dev/urandom` 节点。
:::

#### 读取 kernel 驱动节点

Linux 平台节点为 `/dev/hwrng`，Android 平台节点为 `/dev/hw_random`。

参考代码：

```c
#ifdef ANDROID
#define HWRNG_NODE "/dev/hw_random"
#else
#define HWRNG_NODE "/dev/hwrng"
#endif

RK_RES rk_get_random(uint8_t *data, uint32_t len)
{
    RK_RES res = RK_CRYPTO_SUCCESS;
    int hwrng_fd = -1;
    int read_len = 0;

    hwrng_fd = open(HWRNG_NODE, O_RDONLY, 0);
    if (hwrng_fd < 0) {
        E_TRACE("open %s error!", HWRNG_NODE);
        return RK_CRYPTO_ERR_GENERIC;
    }

    read_len = read(hwrng_fd, data, len);
    if (read_len != len) {
        E_TRACE("read %s error!", HWRNG_NODE);
        res = RK_CRYPTO_ERR_GENERIC;
    }

    close(hwrng_fd);
    return res;
}
```

#### 调用 librkcrypto API

参考 API 说明：`rk_get_random`。

### User space 调用硬件 Crypto

用户空间通过 librkcrypto API 接口调用硬件 crypto。

:::caution 注意
使用前请确认 kernel 中硬件 crypto 是否已启用。
:::

#### 适用范围

| API | RK3588 | RK356x | RV1109/1126 | 其他 |
| :--- | :---: | :---: | :---: | :---: |
| rk_crypto_mem_alloc/free | √ | √ | √ |  |
| rk_crypto_init/deinit | √ | √ | √ |  |
| rk_get_random | √ | √ | √ |  |
| rk_hash_init/update/update_virt/final | √ | √ | √ |  |
| rk_cipher_init/crypt/crypt_virt/final | √ | √ | √ |  |
| rk_ae_init/set_aad/set_aad_virt/crypt/crypt_virt/final | √ | √ | √ |  |
| rk_rsa_pub_encrypt/priv_decrypt/priv_encrypt/pub_decrypt | √ | √ | √ |  |
| rk_rsa_sign/verify | √ | √ | √ |  |
| rk_write_oem_otp_key | √ | √ | √ |  |
| rk_oem_otp_key_is_written | √ | √ | √ |  |
| rk_set_oem_hr_otp_read_lock | √ | √ | √ |  |
| rk_oem_otp_key_cipher | √ | √ | √ |  |
| rk_oem_otp_key_cipher_virt | √ | √ | √ |  |

#### 版本依赖

librkcrypto V1.2.0 版本依赖 kernel 以下提交点：

- **kernel 4.19**：`commit c255a0aa097afbf7f28e3c0770c5ab778e5616b2` — `crypto: rockchip: rk3326/px30 add aes gcm support`
- **kernel 5.10**：`commit 47e85085826daf6401265b803ac9ac7116ae6bb4` — `crypto: rockchip: rk3326/px30 add aes gcm support`

#### 注意事项

1. 对称算法的输入数据长度要求与所选算法和模式的数据长度要求一致（如 ECB/CBC 要求 block 对齐，CTS/CTR 则无对齐要求）。API 中不做填充处理。
2. 如果计算数据量较大，为提高效率，建议选用通过 dma_fd 传递数据的算法接口。
3. 使用前需初始化 `rk_crypto_init`，用完需调用 `rk_crypto_deinit`。

#### 主要数据结构

**rk_crypto_mem** — 内存数据结构：

```c
typedef struct _rk_crypto_mem {
    int dma_fd;      // DMA-BUF 文件描述符
    uint8_t *virt;   // 虚拟地址
    uint32_t size;   // 内存大小
} rk_crypto_mem;
```

**rk_cipher_config** — 对称加密配置结构。

**rk_ae_config** — AEAD（认证加密）配置结构。

**rk_hash_config** — 哈希计算配置结构。

**rk_rsa_pub_key / rk_rsa_priv_key** — RSA 公私钥结构。

#### 主要常量

- **RK_CRYPTO_ALGO**：算法类型（AES / DES / 3DES / SM4 / SHA1 / SHA256 / SHA512 / MD5 / SM3 / RSA 等）
- **RK_CIPHER_MODE**：加密模式（ECB / CBC / CFB / OFB / CTR / XTS / GCM 等）
- **RK_CRYPTO_OPERATION**：操作类型（加密 / 解密）
- **RK_RSA_KEY_TYPE**：RSA 密钥类型
- **RK_RSA_CRYPT_PADDING**：RSA 加密填充方式
- **RK_RSA_SIGN_PADDING**：RSA 签名填充方式

#### 主要 API 列表

| API | 功能 |
| :--- | :--- |
| `rk_crypto_mem_alloc` | 分配 crypto 内存（支持 dma-heap） |
| `rk_crypto_mem_free` | 释放 crypto 内存 |
| `rk_crypto_init` | 初始化 crypto 环境 |
| `rk_crypto_deinit` | 反初始化 crypto 环境 |
| `rk_hash_init` | 哈希计算初始化 |
| `rk_hash_update` | 哈希数据更新（dma_fd 方式） |
| `rk_hash_update_virt` | 哈希数据更新（虚拟地址方式） |
| `rk_hash_final` | 哈希计算结束 |
| `rk_cipher_init` | 对称加密初始化 |
| `rk_cipher_crypt` | 对称加解密（dma_fd 方式） |
| `rk_cipher_crypt_virt` | 对称加解密（虚拟地址方式） |
| `rk_cipher_final` | 对称加密结束 |
| `rk_get_random` | 获取随机数 |
| `rk_write_oem_otp_key` | 写入 OEM OTP 密钥 |
| `rk_oem_otp_key_is_written` | 检查 OTP 密钥是否已写入 |
| `rk_set_oem_hr_otp_read_lock` | 设置 OEM HR OTP 读锁定 |
| `rk_oem_otp_key_cipher` | 使用 OTP 密钥加解密 |
| `rk_ae_init` | AEAD 初始化 |
| `rk_ae_set_aad` | 设置 AEAD 附加认证数据 |
| `rk_ae_crypt` | AEAD 加解密 |
| `rk_ae_final` | AEAD 结束 |
| `rk_rsa_pub_encrypt` | RSA 公钥加密 |
| `rk_rsa_priv_decrypt` | RSA 私钥解密 |
| `rk_rsa_priv_encrypt` | RSA 私钥加密 |
| `rk_rsa_pub_decrypt` | RSA 公钥解密 |
| `rk_rsa_sign` | RSA 签名 |
| `rk_rsa_verify` | RSA 验签 |

#### Debug 日志

librkcrypto 提供日志打印级别控制，可通过环境变量或 API 设置：

- **E_ERROR**：错误信息
- **E_TRACE**：跟踪信息
- **E_DEBUG**：调试信息

---

## 硬件 Crypto 性能数据

### 影响性能的因素

1. **时钟频率**：CRYPTO 模块的 aclk / sclk 时钟频率越高，性能越好
2. **数据传输方式**：使用 DMA 传输比 CPU 搬运性能高
3. **数据大小**：单次处理的数据量越大，单位效率越高（减少启动开销）
4. **算法复杂度**：不同算法的硬件处理周期不同
5. **总线带宽**：CRYPTO 挂载的总线带宽影响数据吞吐量
6. **多线程**：支持多线程的平台（如 RK3528、RK3562）可并发处理

### U-Boot 层硬件 Crypto 性能数据

#### Crypto V1 性能数据

（具体数值请参考原文档对应表格，不同算法、不同密钥长度性能有差异）

#### Crypto V2 / V3 / V4 性能数据

（具体数值请参考原文档对应表格）

---

## 术语表

| 术语 | 英文 | 说明 |
| :--- | :--- | :--- |
| AES | Advanced Encryption Standard | 高级加密标准 |
| DES | Data Encryption Standard | 数据加密标准 |
| TDES / 3DES | Triple DES | 三重数据加密算法 |
| SM4 | - | 国密分组密码算法 |
| SM3 | - | 国密哈希算法 |
| HMAC | Hash-based Message Authentication Code | 哈希消息认证码 |
| RSA | Rivest-Shamir-Adleman | 非对称加密算法 |
| ECC | Elliptic Curve Cryptography | 椭圆曲线密码学 |
| TRNG | True Random Number Generator | 真随机数生成器 |
| HWRNG | Hardware Random Number Generator | 硬件随机数生成器 |
| ECB | Electronic Codebook | 电子密码本模式 |
| CBC | Cipher Block Chaining | 密码分组链接模式 |
| CTR | Counter | 计数器模式 |
| XTS | XEX Tweakable Block Cipher with Ciphertext Stealing | XTS 模式 |
| GCM | Galois/Counter Mode | Galois/计数器模式（AEAD） |
| AEAD | Authenticated Encryption with Associated Data | 带关联数据的认证加密 |

---

## 参考资料

- 原始文档：`Rockchip_Developer_Guide_Crypto_HWRNG_CN.pdf` V1.3.0
- 瑞芯微官网：[www.rock-chips.com](https://www.rock-chips.com)
