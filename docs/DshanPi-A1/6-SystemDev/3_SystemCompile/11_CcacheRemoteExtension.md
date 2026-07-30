---
sidebar_position: 11
---

# ccache-remote 扩展

:::tip
本章介绍 ccache-remote 扩展的使用方法和服务器搭建指南，帮助你在多台构建主机间共享编译缓存，大幅提升构建速度。
:::

:::info
Armbian 文档站点在 `Extensions-ccache-remote/` 路径下没有专门页面（返回 404）。该扩展的文档位于源代码仓库中：
[armbian/build/extensions/ccache-remote/](https://github.com/armbian/build/tree/main/extensions/ccache-remote)
:::

启用带有远程存储的 ccache，用于在多台构建主机之间共享编译缓存。支持 **Redis** 和 **HTTP/WebDAV** 后端（需要 ccache 4.4+），自动设置 `USE_CCACHE=yes`。

:::tip 提示
更多扩展请参阅 [扩展列表](./9_ExtensionsList.md)，扩展框架介绍请参阅 [扩展与钩子](./6_ExtensionsHooks.md)。
:::

## 1. 文件结构

```text
ccache-remote/
  ccache-remote.sh                     # 扩展主脚本
  README.server-setup.md               # 服务器搭建指南
  misc/
    avahi/
      ccache-redis.service             # Redis 的 Avahi DNS-SD 服务
      ccache-webdav.service            # WebDAV 的 Avahi DNS-SD 服务
    nginx/
      ccache-webdav.conf               # nginx WebDAV 配置
    redis/
      redis-ccache.conf                # Redis 配置示例
    systemd/
      ccache-avahi-redis.service       # systemd 单元（Redis + Avahi）
      ccache-avahi-webdav.service      # systemd 单元（WebDAV + Avahi）
```

## 2. 快速开始

### 2.1 使用显式 Redis 服务器

```bash
./compile.sh ENABLE_EXTENSIONS=ccache-remote \
  CCACHE_REMOTE_STORAGE="redis://192.168.1.65:6379" BOARD=...
```

### 2.2 使用 HTTP/WebDAV 服务器

```bash
./compile.sh ENABLE_EXTENSIONS=ccache-remote \
  CCACHE_REMOTE_STORAGE="http://192.168.1.65:8088/ccache/" BOARD=...
```

### 2.3 通过 DNS-SD 自动发现（无需 URL）

```bash
./compile.sh ENABLE_EXTENSIONS=ccache-remote BOARD=...
```

### 2.4 针对远程构建服务器的 DNS SRV 发现

```bash
./compile.sh ENABLE_EXTENSIONS=ccache-remote \
  CCACHE_REMOTE_DOMAIN="example.com" BOARD=...
```

### 2.5 禁用本地缓存，仅使用远程缓存

```bash
./compile.sh ENABLE_EXTENSIONS=ccache-remote \
  CCACHE_REMOTE_ONLY=yes BOARD=...
```

## 3. 自动发现优先级顺序

1. 显式的 `CCACHE_REMOTE_STORAGE` — 直接使用，不进行发现
2. 在本地网络上通过 DNS-SD 浏览 `_ccache._tcp`（avahi-browse）
3. DNS SRV 记录 `_ccache._tcp.DOMAIN`（当设置了 `CCACHE_REMOTE_DOMAIN` 时）
4. 传统 mDNS：解析 `ccache.local` 主机名（回退方案）

当发现多个服务时，**Redis 优先于 HTTP**。

## 4. 存储地址格式

`CCACHE_REMOTE_STORAGE` 支持以下格式：

```text
Redis: redis://[[USERNAME:]PASSWORD@]HOST[:PORT][|attribute=value...]
HTTP:  http://HOST[:PORT]/PATH/[|attribute=value...]
```

**常用属性：**

- `connect-timeout=N` — 连接超时时间（毫秒），默认 100
- `operation-timeout=N` — 操作超时时间（毫秒），默认 10000

## 5. 参数

| 变量 | 说明 |
| --- | --- |
| `CCACHE_BASEDIR` | 路径规范化的基础目录（启用缓存共享） |
| `CCACHE_REMOTE_STORAGE` | 远程存储 URL（`redis://...` 或 `http://...`） |
| `CCACHE_REMOTE_DOMAIN` | DNS SRV 发现的域名 |
| `CCACHE_REMOTE_ONLY` | 仅使用远程存储，禁用本地缓存 |
| `CCACHE_READONLY` | 只读模式，不更新缓存 |
| `CCACHE_RECACHE` | 不使用缓存结果，但更新缓存 |
| `CCACHE_RESHARE` | 将缓存条目重新写入远程存储 |
| `CCACHE_DISABLE` | 完全禁用 ccache |
| `CCACHE_MAXSIZE` | 最大缓存大小（例如 `10G`） |
| `CCACHE_MAXFILES` | 缓存中文件的最大数量 |
| `CCACHE_NAMESPACE` | 用于隔离的缓存命名空间 |
| `CCACHE_SLOPPINESS` | 逗号分隔的宽松选项列表 |
| `CCACHE_UMASK` | 缓存文件的 umask |
| `CCACHE_LOGFILE` | 日志文件路径 |
| `CCACHE_DEBUGLEVEL` | 调试级别（1-2） |
| `CCACHE_STATSLOG` | 统计日志文件路径 |
| `CCACHE_PCH_EXTSUM` | 在哈希中包含 PCH 扩展 |

## 6. 缓存共享要求

要让缓存在多台构建主机之间共享，所有机器上的 Armbian 项目路径必须完全相同（例如 `/home/build/armbian`）。这是因为 ccache 将工作目录包含在缓存键中。Docker 构建会自动使用一致的路径（`/armbian/...`）。

## 7. 回退行为

如果未设置 `CCACHE_REMOTE_STORAGE` 且无法解析 `ccache.local`，该扩展会静默回退到仅使用本地 ccache。

## 8. 服务器搭建指南

### 8.1 Redis 服务器

1. 安装软件包：

   ```bash
   apt install redis-server avahi-daemon avahi-utils
   ```

2. 配置 Redis — 将 `misc/redis/redis-ccache.conf` 中的设置合并到
   `/etc/redis/redis.conf`，或者在现有配置末尾添加 `include` 指令
   （`include /etc/redis/redis-ccache.conf`），然后重启服务：

   ```bash
   sudo systemctl restart redis-server
   ```

   **身份验证（推荐）。** 在配置文件中设置密码 — 通过 `requirepass`
   （Redis < 6）或 ACL 用户条目（Redis 6+）。两种方法的说明见
   `misc/redis/redis-ccache.conf` 中的注释。生成 URL 安全的密码：

   ```bash
   openssl rand -hex 24
   ```

   :::note 注意
   请勿使用 `openssl rand -base64` — base64 密码中包含 `/`、`+` 和 `=`，会破坏 `redis://` 连接字符串中的 URL 解析。
   :::

   在构建主机上，通过 Redis URL 传入密码：

   ```bash
   ./compile.sh ENABLE_EXTENSIONS=ccache-remote \
     CCACHE_REMOTE_STORAGE="redis://default:YOUR_PASSWORD@192.168.1.65:6379" BOARD=...
   ```

   **无身份验证（仅限可信网络）。** 如果所有机器都位于完全隔离的私有网络
   中且不需要访问控制，请移除 `requirepass`，在 ACL 用户条目中设置 `nopass`，
   并设置 `protected-mode no`。详见 `misc/redis/redis-ccache.conf` 中的注释。
   URL 中不需要密码：

   ```bash
   ./compile.sh ENABLE_EXTENSIONS=ccache-remote \
     CCACHE_REMOTE_STORAGE="redis://192.168.1.65:6379" BOARD=...
   ```

   如需更高级的安全性（TLS、ACL、rename-command），请参阅 [Redis 官方安全文档](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)。

3. 发布 DNS-SD 服务 — 将 `misc/avahi/ccache-redis.service` 复制到
   `/etc/avahi/services/`：

   ```bash
   cp misc/avahi/ccache-redis.service /etc/avahi/services/
   ```

   Avahi 会自动加载该文件。运行 `avahi-browse -rpt _ccache._tcp` 的客户端
   将发现 Redis 服务。

   或者使用一个 systemd 单元，将公告与 `redis-server` 生命周期绑定
   （Redis 宕机时停止公告）：

   ```bash
   cp misc/systemd/ccache-avahi-redis.service /etc/systemd/system/
   systemctl enable --now ccache-avahi-redis
   ```

   另外，也可以发布传统 mDNS 主机名：

   ```bash
   avahi-publish-address -R ccache.local `<SERVER_IP>`
   ```

   或作为 systemd 服务（`/etc/systemd/system/ccache-hostname.service`）：

   ```ini
   [Unit]
   Description=Publish ccache.local hostname via Avahi
   After=avahi-daemon.service redis-server.service
   BindsTo=redis-server.service

   [Service]
   Type=simple
   ExecStart=/usr/bin/avahi-publish-address -R ccache.local `<SERVER_IP>`
   Restart=on-failure

   [Install]
   WantedBy=redis-server.service
   ```

### 8.2 HTTP/WebDAV 服务器（nginx）

1. 安装带 WebDAV 支持的 nginx：

   ```bash
   apt install nginx-extras avahi-daemon avahi-utils
   ```

2. 将 `misc/nginx/ccache-webdav.conf` 复制到
   `/etc/nginx/sites-available/ccache-webdav`，然后启用并准备存储目录：

   ```bash
   cp misc/nginx/ccache-webdav.conf /etc/nginx/sites-available/ccache-webdav
   ln -s /etc/nginx/sites-available/ccache-webdav /etc/nginx/sites-enabled/
   mkdir -p /var/cache/ccache-webdav/ccache
   chown -R www-data:www-data /var/cache/ccache-webdav
   systemctl reload nginx
   ```

3. 验证：

   ```bash
   curl -X PUT -d "test" http://localhost:8088/ccache/test.txt
   curl http://localhost:8088/ccache/test.txt
   ```

   :::danger 警告
   未配置身份验证。仅在完全可信的私有网络中使用。
   :::

4. 发布 DNS-SD 服务 — 将 `misc/avahi/ccache-webdav.service` 复制到
   `/etc/avahi/services/`：

   ```bash
   cp misc/avahi/ccache-webdav.service /etc/avahi/services/
   ```

   或者使用将公告与 `nginx` 生命周期绑定的 systemd 单元：

   ```bash
   cp misc/systemd/ccache-avahi-webdav.service /etc/systemd/system/
   systemctl enable --now ccache-avahi-webdav
   ```

### 8.3 DNS SRV 记录（用于远程/托管服务器）

在客户端设置 `CCACHE_REMOTE_DOMAIN`，然后创建 DNS 记录。

**Redis 后端：**

```text
_ccache._tcp.example.com.  SRV  0 0 6379 ccache.example.com.
_ccache._tcp.example.com.  TXT  "type=redis"
```

**HTTP/WebDAV 后端：**

```text
_ccache._tcp.example.com.  SRV  0 0 8088 ccache.example.com.
_ccache._tcp.example.com.  TXT  "type=http" "path=/ccache/"
```

### 8.4 mDNS 客户端要求

为解析 `.local` 主机名，安装以下任一软件包：

- **libnss-resolve**（systemd-resolved）：

  ```bash
  apt install libnss-resolve
  ```

  `/etc/nsswitch.conf`：`hosts: files resolve [!UNAVAIL=return] dns myhostname`

- **libnss-mdns**（独立方式）：

  ```bash
  apt install libnss-mdns
  ```

  `/etc/nsswitch.conf`：`hosts: files mdns4_minimal [NOTFOUND=return] dns myhostname`

---

## 9. 参考资料

- [armbian/build - extensions/ccache-remote](https://github.com/armbian/build/tree/main/extensions/ccache-remote)
- [ccache.dev - Redis storage](https://ccache.dev/howto/redis-storage.html)
- [ccache.dev - HTTP storage](https://ccache.dev/howto/http-storage.html)
- [ccache.dev - remote_storage config](https://ccache.dev/manual/4.10.html#config_remote_storage)
