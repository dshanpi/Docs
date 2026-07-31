---
sidebar_position: 12
---

# 桌面环境

:::tip
本章介绍 armbian-config 桌面环境子模块的技术实现，包括 YAML 驱动的分层安装机制和桌面扩展开发方法。
:::

`armbian-config`（[configng](https://github.com/armbian/configng) 仓库）桌面子模块的技术参考文档，位于 `tools/modules/desktops/` 目录下。本指南面向希望添加新桌面环境、修改安装/卸载流程，或从其他工具集成 YAML 驱动的桌面 API 的开发者。

使用 `armbian-config` 安装桌面环境的最终用户说明请参阅 Armbian Config 相关章节。

## 1. 概述

桌面子模块用一套 YAML 驱动的流水线取代了各发行版各自编写的安装脚本。每个桌面环境由 `tools/modules/desktops/yaml/` 目录下的一个 YAML 文件描述。一个 Python 辅助脚本解析 YAML 并输出 bash 兼容的变量，供模块其余部分求值和执行。

该子模块提供：

- **分层安装** — 每个桌面环境都有三个可用层级（`minimal`、`mid`、`full`），用户可在安装后通过 `upgrade`/`downgrade`/`set-tier` 在各层级间切换。
- **每次安装的清单** — 每次安装都会记录所添加的确切软件包，因此卸载和降级只会撤销它们自己添加的内容。
- **自定义 APT 仓库**、品牌定制、用户组管理和 skel 同步。
- **自动登录**管理，支持 `gdm3`、`sddm` 和 `lightdm`，对底层配置文件进行非破坏性的就地编辑。
- **按发行版 / 按架构的软件包覆盖**，使得同一个 YAML 文件可在 Debian bookworm/trixie/forky/sid 和 Ubuntu jammy/noble/resolute 上的 amd64/arm64/armhf/riscv64/loong64 架构下工作，适应不同的软件包可用性。
- **浏览器虚拟令牌**，可按发行版和架构解析（amd64 上为 google-chrome-stable，Debian/Ubuntu arm 架构上为 chromium，Debian riscv64 上为 firefox-esr，Ubuntu riscv64 上为 epiphany-browser，等等）。
- **容器/CI 感知**，使得同一条代码路径可在 Docker 内部使用，而不会尝试启动显示管理器。

## 2. 层级模型

每次桌面安装都运行在三个层级之一，按包含关系排列：`minimal -> mid -> full`。每个层级是其自身与所有更低层级的并集，因此安装 `full` 意味着包含 `mid`，而 `mid` 又意味着包含 `minimal`。层级是强制性的；不存在"直接安装此 YAML 中所有内容"的扁平模式。

| 层级 | 内容 | 大致体积 |
| --- | --- | --- |
| `minimal` | 桌面环境本身 + 显示管理器 + 基础工具。不含浏览器、办公软件，除终端和文件管理器外无面向用户的应用。 | 约 500 MB |
| `mid` | `minimal` + 浏览器 + 日常用户应用（文本编辑器、计算器、图片/PDF 查看器、媒体播放器、归档工具、BT 客户端）。 | 约 1 GB |
| `full` | `mid` + 办公套件 + 创意工具（LibreOffice、GIMP、Inkscape、Thunderbird、Audacity）。 | 约 2.5 GB |

`mid` 和 `full` 的各层级软件包列表位于 `common.yaml` 中，因此每个桌面环境都会继承它们。各桌面环境的 YAML 只覆盖它们需要的部分（例如 KDE Plasma 在 mid 层将 `gnome-text-editor` 替换为 `kate`）。

当前安装的层级记录在 `/etc/armbian/desktop/<de>.tier` 中。为某桌面环境安装的完整软件包集合记录在 `/etc/armbian/desktop/<de>.packages` 中。

## 3. 组件地图

```text
tools/modules/desktops/
├── module_desktops.sh              # 主调度器：install/remove/auto/manual/upgrade/downgrade/...
├── module_desktop_yamlparse.sh     # YAML 解析器的 bash 封装（现接受 tier 参数）
├── module_desktop_supported.sh     # 架构/发行版支持检查
├── module_desktop_repo.sh          # 自定义 APT 仓库 + GPG 密钥环设置
├── module_desktop_branding.sh      # 壁纸、欢迎界面、skel、postinst 钩子
├── module_desktop_getuser.sh       # 检测第一个普通用户
├── module_update_skel.sh           # 将 /etc/skel 传播到现有 $HOME（带 chown -R 安全网）
├── module_appimage.sh              # AppImage 辅助工具（通过 CLI 用于 armbian-imager）
│
├── scripts/
│   └── parse_desktop_yaml.py       # YAML → bash 可求值变量（或 TSV/JSON 列表）
│
├── yaml/
│   ├── common.yaml                 # 每个桌面环境都安装的各层级默认值；浏览器映射；tier_overrides
│   └── <de_name>.yaml              # 各桌面环境的定义
│
├── postinst/<de_name>.sh           # 可选的桌面环境专用后置安装钩子
├── greeters/{lightdm,sddm}/        # 欢迎界面配置和 SDDM 主题
├── branding/
│   ├── wallpapers/                 # /usr/share/backgrounds/armbian
│   ├── wallpapers-lightdm/         # /usr/share/backgrounds/armbian-lightdm
│   ├── icons/                      # /usr/share/icons/armbian
│   ├── pixmaps/                    # /usr/share/pixmaps/armbian
│   └── armbian.xml                 # GNOME 背景属性
└── skel/                           # 复制到 /etc/skel 并传播到现有 $HOME 的文件
```

每个 shell 文件都由 configng 的模块加载器加载，它们作为 bash 函数暴露在运行中的 shell 中。`desktops_dir` 指向桌面目录，用于从任何模块函数解析路径。

## 4. 数据流

```text
       CLI:  armbian-config --api module_desktops install de=xfce tier=mid
              │
              ▼
   module_desktops install de=xfce tier=mid
              │
              │  1. 验证 tier=（必填；仅允许 minimal|mid|full）
              │  2. 通过 module_desktop_getuser 解析用户
              │  3. 通过 module_desktop_yamlparse 解析 xfce.yaml 在请求层级
              │     → DESKTOP_PACKAGES, DESKTOP_TIER, DESKTOP_DM, DESKTOP_PRIMARY_PKG, ...
              │  4. 通过 module_desktop_repo 设置自定义仓库
              │  5. apt update
              │  6. apt install $DESKTOP_PACKAGES         ← 失败即中止（无状态变更）
              │  7. apt install $DESKTOP_DM               ← 失败即中止
              │  8.（仅 Armbian）如存在 armbian 仓库则安装 armbian-plymouth-theme
              │  9. 写入 /etc/armbian/desktop/<de>.packages 和 <de>.tier
              │ 10. apt remove --purge $DESKTOP_PACKAGES_UNINSTALL
              │ 11. 通过 module_desktop_branding 安装品牌定制
              │ 12. 将用户加入 sudo/audio/video/... 组
              │ 13. 通过 module_update_skel install 传播 /etc/skel（带递归 chown）
              │ 14. systemctl start display-manager      ← 容器中跳过
              │ 15. systemctl set-default graphical.target ← 仅在步骤 14 成功后执行
              │ 16. 通过 module_desktops auto 启用自动登录
              ▼
         桌面就绪，标记文件位于 /etc/armbian/desktop/
```

Python 辅助脚本是给定（桌面、发行版、架构、层级）组合下要安装哪些软件包的唯一真相来源。bash 端从不直接读取 YAML。

## 5. YAML 架构

每个桌面环境在 `tools/modules/desktops/yaml/` 下的单个 YAML 文件中定义。不带 `.yaml` 的文件名即为规范桌面名称（`de_name`）。

### 5.1 顶层字段

| 字段 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| `name` | 字符串 | 信息性 | 人类可读的名称。 |
| `description` | 字符串 | 信息性 | 单行摘要，通过 `DESKTOP_DESC` 暴露。 |
| `display_manager` | 字符串 | 是 | 欢迎界面软件包：`gdm3`、`sddm`、`lightdm` 或 `none`。 |
| `status` | 字符串 | 是 | 编辑标签 — 为 `supported`、`community`、`unsupported` 之一。通过 `DESKTOP_STATUS` 报告。仅影响标签和目录过滤 — 不阻止安装。`community` 用于可用但以尽力而为方式维护的桌面环境；`unsupported` 用于已知损坏或未经验证的桌面环境。 |
| `tiers` | 映射 | 是 | 各层级软件包列表，以 `minimal`、`mid`、`full` 为键。参见 [层级块](#层级块)。 |
| `tier_overrides` | 映射 | 可选 | 按架构和/或按发行版-按架构的软件包移除（及添加），用于填补层级空缺。参见 [tier_overrides](#tier-overrides)。 |
| `releases` | 映射 | 是 | 按发行版的覆盖，以发行版代号（`bookworm`、`trixie`、`forky`、`sid`、`jammy`、`noble`、`resolute` 等）为键。 |
| `repo` | 映射 | 可选 | 自定义 APT 仓库，见下文。 |

### 5.2 层级块

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `packages` | 列表 | 在此层级添加的软件包。与 `common.yaml` 同层级的软件包以及遍历中所有更早层级的软件包合并。 |
| `packages_remove` | 列表 | 在此层级从累积列表中移除的软件包。用于移除不适合该桌面环境的 `common.yaml` 条目（例如 KDE Plasma 在 mid 层移除 `gnome-text-editor` 并插入 `kate`）。 |
| `packages_uninstall` | 列表 | （仅 minimal 层级）安装后要清除的软件包。用于元包引入但希望移除的无关垃圾（例如 `apport`、`python3-apport`）。**重要提示**：切勿列出任何作为安装所附带元包的硬 `Depends:` 的软件包，否则 apt 的自动移除会级联并扯掉桌面的一大块。 |

第一个通过所有筛选的桌面环境专属软件包成为 `DESKTOP_PRIMARY_PKG`，供 `module_desktops status` 用于 `dpkg -l` 检查。它必须来自桌面环境自身的 `tiers.minimal.packages` 块，而非来自 `common.yaml`，否则每个桌面环境都会共享同一个主软件包。

### 5.3 按发行版块

发行版块与层级遍历**正交**：它应用于正在安装的任何层级。用于因发行版而异而非因用户选择而异的内容（例如 trixie 的 pulseaudio→pipewire 切换，bookworm 的 `gnome-calculator` 添加）。

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `architectures` | 列表 | 此发行版支持的架构。用于计算 `DESKTOP_AVAILABLE`（"此 YAML 是否声明了请求的发行版+架构组合？"的布尔值 — 与上述编辑性 `status` 不同）。 |
| `packages` | 列表 | 在层级解析集合之上额外添加的软件包。 |
| `packages_remove` | 列表 | 从合并安装列表中过滤掉的软件包。 |
| `packages_uninstall` | 列表 | 仅在此发行版上安装后清除的软件包。 |

### 5.4 tier_overrides {#tier-overrides}

`tier_overrides` 用于**软件包可用性空缺**：某个层级软件包在大多数架构/发行版上存在，但在某个特定组合上缺失。该架构有两层：

```yaml
tier_overrides:
  <tier>:
    architectures:
      <arch>:
        packages_remove: [...]    # 应用于此架构的任何发行版
    releases:
      <release>:
        architectures:
          <arch>:
            packages_remove: [...]    # 仅应用于此发行版+架构组合
```

使用按架构层处理永久性的全架构空缺（例如 `blender` 在 armhf 上始终缺失）。使用按发行版-按架构层处理临时性空缺（例如 `loupe` 在 bookworm 上缺失，因为 GNOME 43 没有它）。解析器在其遍历的每个层级步骤都会应用 tier_overrides，因此在 mid 层声明的空缺对 `mid` 和 `full` 安装都会生效。

`tier_overrides` 可位于 `common.yaml`（适用于每个桌面环境）或各桌面环境 YAML 中（仅适用于该桌面环境）。解析器先合并 common，再合并各桌面环境。

### 5.5 自定义仓库块

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `url` | 字符串 | `deb [signed-by=...] <url> <suite> <components>` 的基础 URL。 |
| `key_url` | 字符串 | GPG 密钥的 URL（ASCII 装甲格式）。 |
| `keyring` | 字符串 | 脱装甲密钥环文件的路径，例如 `/usr/share/keyrings/neon.gpg`。 |
| `suite` | 字符串或字符串列表（可选） | 跟在 URL 后的 suite 路径。列表会为每个条目输出一行 `deb [...]` — 所有条目共享 url/keyring/components — 适用于存档跨越多个并行 suite 的厂商（base、-security、-updates、-porting、-customization 等）。默认为发行版代号。正则验证为 `^[A-Za-z0-9._/-]+$`。按发行版覆盖：`releases.<release>.repo_suite`。 |
| `components` | 列表（可选） | 跟在 suite 后的组件。默认为 `[main]`。每个条目都经过正则验证 `^[A-Za-z0-9._-]+$`；无效条目会被丢弃并发出警告。按发行版覆盖：`releases.<release>.repo_components`。 |
| `preferences` | 列表（可选） | 写入 `/etc/apt/preferences.d/<de_name>` 的 APT 优先级设置。每个条目需要 `origin`、`suite` 和 `priority`（正整数）。卸载时移除。 |

`suite` 和 `components` 用于布局不符合默认 `<codename> main` 约定的厂商存档。例如，SpacemiT 的 K1 RISC-V 存档为每个 Ubuntu 发行版固定了一个快照（`noble/snapshots/v2.2`、`resolute/snapshots/v3.0`）并镜像了所有四个 Ubuntu 组件，因此 `bianbu.yaml` 在 `repo:` 级别设置 `components: [main, universe, restricted, multiverse]` 并在每个发行版块中覆盖 `repo_suite`。

`preferences` 很少需要 — 仅当厂商存档必须在给定的 `(origin, suite)` 对上优先级高于发行版时才需要。每个列表条目变为一个节：

```text
Package: *
Pin: release o=<origin>, n=<suite>
Pin-Priority: <priority>
```

优先级高于 1000 允许 apt 将软件包从发行版降级到固定存档的版本；低于 1000 仅允许升级。缺少任何必填字段的条目会被跳过，`parse_desktop_yaml.py` 会发出警告。

### 5.6 示例

```yaml
name: xfce
description: "XFCE - 轻量快速的桌面环境"
display_manager: lightdm
status: supported

tiers:
  minimal:
    packages:
      - xfce4
      - xfce4-goodies
      - lightdm
      - slick-greeter
      # ...
    packages_uninstall:
      - apport
      - python3-apport
      - python3-problem-report
      - libsnapd-glib-2-1

releases:
  trixie:
    architectures: [arm64, amd64, armhf, riscv64]
    packages:
      - pipewire-audio
      - pipewire-pulse
      - wireplumber
    packages_remove:
      - pulseaudio
      - pulseaudio-module-bluetooth
```

```yaml
# 各桌面环境的层级覆盖（kde-plasma.yaml）
name: kde-plasma
description: "KDE Plasma - 功能丰富、可定制的桌面环境"
display_manager: sddm
status: supported

tiers:
  minimal:
    packages:
      - kde-plasma-desktop
      - sddm
      - konsole
      - dolphin
      - ark
      - gwenview
      - okular
      # ...
  mid:
    # KDE 已在 minimal 层附带 ark / gwenview / okular —
    # 移除 common.yaml mid 层添加的 GTK 等效项。
    packages_remove:
      - gnome-text-editor
      - file-roller
      - loupe
    packages:
      - kate
  full:
    # libreoffice-gtk3 与默认 LibreOffice 集成的对比：
    # 当 LibreOffice 与 Plasma 一起安装时，KDE 会自动采用
    # breeze 样式，因此只需移除 GTK 前端即可。
    packages_remove:
      - libreoffice-gtk3
```

```yaml
# 带自定义仓库（kde-neon.yaml）
name: kde-neon
description: "KDE Neon - 来自 KDE 仓库的最新 Plasma（仅 Ubuntu）"
display_manager: sddm
status: supported
repo:
  url: "http://archive.neon.kde.org/testing"
  key_url: "https://archive.neon.kde.org/public.key"
  keyring: "/usr/share/keyrings/neon.gpg"

tiers:
  minimal:
    packages:
      - neon-desktop
      - sddm
      # ...

releases:
  noble:
    architectures: [arm64, amd64]
```

### 5.7 common.yaml

`common.yaml` 承载适用于每个桌面环境的各层级默认值、浏览器替换表以及任何跨桌面环境的 `tier_overrides`。各桌面环境 YAML 仅在需要在 common 基础上添加软件包或覆盖 common 层级条目时才声明 `tiers` 块。

```yaml
name: common
description: "每个桌面环境都安装的软件包，按层级划分"

tiers:
  minimal:
    packages:
      - adwaita-icon-theme
      - cups
      - dconf-cli
      - profile-sync-daemon
      - terminator
      - upower
  mid:
    packages:
      - browser              # 虚拟 — 从下方 `browser:` 按架构解析
      - gnome-text-editor
      - gnome-calculator
      - loupe
      - vlc
      - file-roller
      - transmission-gtk
  full:
    packages:
      - libreoffice
      - libreoffice-gtk3
      - gimp
      - inkscape
      - thunderbird
      - audacity

browser:
  bookworm:
    amd64:   google-chrome-stable
    arm64:   chromium
    armhf:   chromium
    # bookworm 没有 riscv64 移植版 — 无需条目
  trixie:
    amd64:   google-chrome-stable
    arm64:   chromium
    armhf:   chromium
    riscv64: firefox-esr            # Debian 中不存在 'firefox'
  noble:
    amd64:   google-chrome-stable
    arm64:   chromium               # apt.armbian.com 真实 .deb（Ubuntu 的是 snap 垫片）
    armhf:   chromium
    riscv64: epiphany-browser       # Ubuntu riscv64 未构建 firefox/chromium
  resolute:
    amd64:   google-chrome-stable
    arm64:   chromium
    armhf:   chromium
    riscv64: epiphany-browser
  forky:
    amd64:   google-chrome-stable
    arm64:   chromium
    armhf:   chromium
    riscv64: firefox-esr
  sid:
    amd64:   google-chrome-stable
    arm64:   chromium
    armhf:   chromium
    riscv64: firefox-esr
    loong64: firefox-esr            # loong64 尚未构建 chromium

tier_overrides:
  mid:
    # armbian-imager 上游仅发布 amd64/arm64 版本 —
    # 在所有其他架构上去除它。
    architectures:
      armhf:    { packages_remove: [armbian-imager] }
      riscv64:  { packages_remove: [armbian-imager] }
      loong64:  { packages_remove: [armbian-imager] }
    releases:
      bookworm:
        architectures:
          amd64:  { packages_remove: [loupe] }   # GNOME 43 时代 — 无 loupe
          arm64:  { packages_remove: [loupe] }
          armhf:  { packages_remove: [loupe] }
      jammy:
        architectures:
          amd64:    { packages_remove: [loupe] } # GNOME 42 — 无 loupe
          arm64:    { packages_remove: [loupe] }
          armhf:    { packages_remove: [loupe] }
          riscv64:  { packages_remove: [loupe] }
  full:
    # apt.armbian.com 上的 'code' (VSCode) .deb 链接到
    # pre-t64 库名称，这些名称在 post-t64 发行版（trixie+、noble+）
    # 上已不存在。amd64/arm64 已重建；armhf 尚未重建。
    # 完全没有 riscv64 上游构建版本。在两者上全架构去除，
    # 直到/除非 armhf .deb 得到更新。
    architectures:
      armhf:    { packages_remove: [code] }
      riscv64:  { packages_remove: [code] }
    releases:
      bookworm:
        architectures:
          armhf:  { packages_remove: [thunderbird] }
      trixie:
        architectures:
          armhf:  { packages_remove: [thunderbird] }
      noble:
        # Ubuntu noble armhf/riscv64 上没有 thunderbird
        # （上游 Ubuntu deb 不存在），因此仅在这两个
        # 架构上去除。amd64/arm64 从 apt.armbian.com 获得
        # 真实 .deb。
        architectures:
          armhf:    { packages_remove: [thunderbird] }
          riscv64:  { packages_remove: [thunderbird] }
      resolute:
        architectures:
          armhf:    { packages_remove: [thunderbird] }
          riscv64:  { packages_remove: [thunderbird] }
```

### 5.8 浏览器虚拟令牌

任何层级块中的字面字符串 `browser` 在解析时会从 `browser:` 映射解析为真实的软件包名称。查找顺序：

1. `browser.<release>.<arch>` — 最具体
2. `browser.<arch>` — 如果没有按发行版条目，则按架构回退
3. 完全丢弃该令牌（静默 — 安装继续进行而不带浏览器，而不是因字面量 `browser` 作为 apt 名称而失败）

需要按发行版层是因为同一架构在不同发行版中可能解析为不同结果：

- Debian 有 `firefox-esr` 但**没有** `firefox` 软件包。
- Ubuntu 的 `chromium` / `firefox` deb 是需要 `snapd` 的 snap 垫片包装器。Armbian 不附带 snapd，因此这些垫片在运行时会失效 — apt.armbian.com 托管了真实的 `chromium` / `firefox` / `google-chrome-stable` .deb 以供替代使用。
- amd64 始终获得 `google-chrome-stable`（Google 不发布 arm/riscv 构建版本，因此仅限 amd64）。
- `chromium` 在 Debian 或 Ubuntu 中都不为 riscv64 构建。
- Ubuntu 不为 riscv64 发布 `firefox` 或 `firefox-esr`（Mozilla 没有 riscv64 二进制文件，而 `firefox-esr` 是 Debian 独有的软件包名）。回退到 `epiphany-browser`（GNOME Web）— 原生 GTK、体积小，且在每个 Ubuntu 架构上都可用。
- Debian riscv64 获得 `firefox-esr`，因为 Debian 存档确实为 riscv64 发布了它。
- `loong64` 仅在清单中为 `sid` 声明；`chromium` 也尚未在那里构建，因此使用 `firefox-esr`。

## 6. Python 辅助脚本：parse_desktop_yaml.py

单用途 CLI，由 bash 模块通过 `python3` 调用。所有 YAML 解析和验证都在此进行，以便 bash 端免于处理 YAML 逻辑。

### 6.1 用法

```bash
# 解析一个桌面环境在某个层级的配置，输出 DESKTOP_* shell 变量。
# --tier 是必填项。
parse_desktop_yaml.py <yaml_dir> <de_name> <release> <arch> --tier <minimal|mid|full>

# 以 TSV 格式列出所有桌面环境（名称<TAB>状态<TAB>可用性<TAB>架构）
# 第三列是计算出的 DESKTOP_AVAILABLE 的 "yes"/"no"。
parse_desktop_yaml.py <yaml_dir> --list <release> <arch> \
    [--filter <available|unavailable|all>]   \
    [--status <supported,community,unsupported>]

# 与 --list 相同，但格式为 JSON。
parse_desktop_yaml.py <yaml_dir> --list-json <release> <arch> \
    [--filter <available|unavailable|all>]   \
    [--status <supported,community,unsupported>]

# 为每个桌面环境打印 "<name>\t<primary_pkg>"，供 `installed` 使用
parse_desktop_yaml.py <yaml_dir> --primaries <release> <arch>
```

`--list` / `--list-json` 上的两个过滤标志在两个正交轴上进行选择，两者都默认为宽松模式（与过滤前的调用者向后兼容）：

- `--filter` 在**计算出的** `DESKTOP_AVAILABLE` 轴上选择（YAML 是否声明了此发行版+架构组合？）。取值：`available`（默认 — 隐藏没有此组合条目的桌面环境）、`unavailable`（仅显示未声明的桌面环境）或 `all`（此轴不过滤）。
- `--status` 在**编辑性的** `DESKTOP_STATUS` 轴上选择。接受逗号分隔的保留状态列表作为参数。省略该标志则保留所有状态。示例：`--status supported,community` 会从输出中丢弃 `unsupported` 的桌面环境。

### 6.2 输出变量（各桌面环境模式）

所有值都经过双引号包裹并通过 `shell_escape()` 进行 shell 转义（转义 `\`、`"`、`$` 和 `` ` ``），因此 bash 调用方可以安全地 `eval` 输出。

| 变量 | 来源 | 说明 |
| --- | --- | --- |
| `DESKTOP_PACKAGES` | 完整层级遍历：common minimal/mid/full + 桌面环境 minimal/mid/full + 发行版 `packages` − 每一层的 `packages_remove` 和 `tier_overrides` 移除项。`browser` 虚拟令牌在此解析。 | 空格分隔，可直接传给 `apt install`。 |
| `DESKTOP_PACKAGES_UNINSTALL` | 来自 common + 桌面环境 + 发行版的 minimal 层级 `packages_uninstall` | 空格分隔。 |
| `DESKTOP_PRIMARY_PKG` | 第一个通过所有筛选的桌面环境专属软件包（非来自 common） | 供 `module_desktops status` 用于 `dpkg -l` 检查。 |
| `DESKTOP_DM` | `display_manager`，默认 `lightdm` | |
| `DESKTOP_STATUS` | YAML 中的编辑性 `status`，默认 `unsupported`。为 `supported` / `community` / `unsupported` 之一。 | 与 `DESKTOP_AVAILABLE` 正交 — 一个 community 桌面环境可能在某个组合上可用（其 YAML 声明了该发行版+架构），也可能不可用。 |
| `DESKTOP_AVAILABLE` | 如果 `arch` 在发行版的 `architectures` 中且 `release` 是 `releases` 中的键，则为 `yes`，否则为 `no` | 计算出的轴 — YAML 是否声明了此发行版+架构组合。在 2026-04 之前名为 `DESKTOP_SUPPORTED`（重命名是为了将其与编辑性的 `status` 字段区分开）。 |
| `DESKTOP_DESC` | `description`，默认 `de_name` | |
| `DESKTOP_TIER` | 请求的层级名称 | 直接从 `--tier` 参数设置。 |
| `DESKTOP_REPO_URL` | `repo.url` | 仅当存在 `repo:` 时输出。 |
| `DESKTOP_REPO_KEY_URL` | `repo.key_url` | 仅当存在 `repo:` 时输出。 |
| `DESKTOP_REPO_KEYRING` | `repo.keyring` | 仅当存在 `repo:` 时输出。 |

### 6.3 解析算法

对于给定的 `(de_name, release, arch, tier)`：

1. 从空的 `packages` 和 `removes` 列表开始。
2. **遍历层级**从 `minimal` 到目标层级。每一步：
   - 合并 `common.tiers.<tier>.packages`，然后合并 `de.tiers.<tier>.packages`，应用每一层的 `packages_remove` 进行过滤。
   - 为（发行版，架构）应用 `common.tier_overrides.<tier>`。
   - 为（发行版，架构）应用 `de.tier_overrides.<tier>`。
3. **解析 `browser` 令牌**，通过 `common.browser.<release>.<arch>` 解析为真实软件包（回退到 `common.browser.<arch>`，或丢弃令牌）。
4. **应用发行版块**：过滤 `release.<release>.packages_remove`，然后添加 `release.<release>.packages`。
5. **计算 `packages_uninstall`**，通过合并来自 common、桌面环境和发行版块的 minimal 层级 `packages_uninstall`。
6. **计算 `DESKTOP_PRIMARY_PKG`**，作为第一个通过发行版和按架构移除后仍然存在的桌面环境专属层级遍历软件包。
7. 输出所有 `DESKTOP_*` 变量。

### 6.4 错误处理与验证

解析器对顶层结构要求严格，但对格式错误的子节点持宽容态度：

- **必填的 `--tier` 参数。** 不带该参数调用会打印用法并以退出码 1 退出。无效的层级值（`ultra` 等）会报错并给出清晰信息。
- **路径遍历防护** — `de_name` 通过 `os.path.realpath`/`commonpath` 相对于 `yaml_dir` 解析。任何位于目录外的内容（`../...`、绝对路径、符号链接转义）都会被拒绝，显示 `Error: invalid desktop name '<name>'` 并以退出码 1 退出。
- **宽容的规范化** — `tiers`、`releases`、`architectures`、`tier_overrides`、`repo`，每个列表字段都通过 `_as_dict` / `_as_list` 辅助函数处理。类型错误的节点会被强制转换为安全的空默认值（`{}` 或 `[]`），而不是引发 `AttributeError` 或执行令人惊讶的子字符串匹配，例如 `arch in "arm64"`。

### 6.5 列表和 JSON 列表模式

遍历每个 `*.yaml`（排除 `common.yaml`），解析每个的发行版块，每个桌面环境输出一行。默认情况下，仅打印请求的 `(release, arch)` 下 `DESKTOP_AVAILABLE=yes` 的条目 — 传递 `--filter unavailable` 或 `--filter all` 可覆盖此行为。传递 `--status <csv>` 可进一步按编辑性 `status` 字段缩小范围。`module_desktops install` 在出错时使用这些模式显示可用的桌面环境，`module_desktops supported` 则用于暴露机器可读的目录。这些模式不需要 `--tier`。

每个 JSON 条目具有以下结构（两个正交状态轴）：

```json
{
  "name": "budgie",
  "description": "Budgie - 来自 Solus 项目的优雅桌面环境",
  "display_manager": "lightdm",
  "status": "community",
  "available": true,
  "architectures": ["arm64", "amd64"]
}
```

## 7. Bash 模块 API

所有函数都由 configng 的模块加载器加载。它们共享全局状态（`DESKTOP_*` 变量、`desktops_dir`、`DISTROID`）— 调用点必须遵循文档化的顺序。

### 7.1 module_desktops

```text
module_desktops <command> [de=<name>] [tier=<tier>] [arch=<arch>] [release=<release>] [mode=<mode>]
```

顶层调度器。`de=`、`tier=`、`arch=`、`release=`、`mode=` 参数从 `$@` 中按位置解析。

| 命令 | 行为 | 必填参数 |
| --- | --- | --- |
| `install` | 完整安装流水线（参见 [生命周期：安装](#生命周期安装)）。在 `pkg_install` 失败时干净地中止，不改变系统状态。使用 `mode=build`：跳过用户检测、组成员身份、skel 传播和 DM 启动/自动登录 — 用于镜像构建时不存在真实用户的场景。 | `de=`、`tier=`（可选：`mode=build`） |
| `remove` | 禁用自动登录、停止显示管理器、清除 `<de>.packages` 中记录的每个软件包、运行 `pkg_clean`、将 `default.target` 切换回 `multi-user`、隔离到 multi-user.target 以便正在运行的会话也回落到控制台。 | `de=` |
| `upgrade` | 将已安装的桌面环境升级到更高层级。如果目标相同或更低则拒绝（请使用 `downgrade`）。 | `de=`、`tier=` |
| `downgrade` | 将已安装的桌面环境降级到更低层级。可移除集合与安装清单求交集，因此绝不会触及用户手动安装的软件包。 | `de=`、`tier=` |
| `set-tier` | 方向无关的层级变更 — 从当前标记自动检测升级或降级。参数形式与 `upgrade`/`downgrade` 相同。如果未安装或已在目标层级则友好提示并拒绝。由对话框菜单的"切换到 `<层级>`"条目使用。 | `de=`、`tier=` |
| `tier` | 在标准输出上打印已安装的层级名称（`minimal`/`mid`/`full`），或 `not installed`。已安装时返回 0，否则返回 1。在 CLI 中需要实际层级值时使用此命令。 | `de=` |
| `at-tier` | 静默门控：如果桌面环境已安装且其当前层级标记与给定目标匹配则退出 0。由对话框菜单条件门控使用。 | `de=`、`tier=` |
| `status` | 静默退出码查询。如果 `DESKTOP_PRIMARY_PKG` 已通过 `dpkg -l` 安装则返回 0，否则返回 1。**两种路径都不打印任何内容**，因此可以安全地从每次渲染触发数十次的菜单条件门控中使用。 | `de=` |
| `disable` | `systemctl stop && disable display-manager`。 | — |
| `enable` | `systemctl enable && start display-manager`。 | — |
| `auto` | 为 `DESKTOP_DM`（gdm3/sddm/lightdm）配置自动登录。就地编辑 gdm 配置 — 绝不覆盖文件 — 因此保留用户自定义。 | `de=` |
| `manual` | 恢复自动登录。幂等。 | `de=` |
| `login` | 如果当前配置了自动登录则返回 0。锚定正则；安全地忽略 stock noble `custom.conf` 中注释掉的示例行。 | `de=` |
| `supported` | 带 `de=`：基于桌面环境在 `arch=`/`release=` 上的 `DESKTOP_AVAILABLE` 打印 `true`/`false`。不带 `de=`：打印 JSON 目录。两个可选过滤旋钮：`filter=available\|unavailable\|all`（计算可用性轴，默认 `available`）和 `status=<csv>`（编辑性状态保留列表 — 例如 `status=supported,community` 隐藏编辑性 `unsupported` 的桌面环境）。 | 可选 `de=`、`arch=`、`release=`、`filter=`、`status=` |
| `installed` | 如果已安装任何桌面环境则返回 0（使用缓存的 `--primaries` 查找）。 | — |
| `help` | 显示帮助并退出。 | — |

#### 7.1.1 清单文件

每个已安装的桌面环境有两个文件，都位于 `/etc/armbian/desktop/` 下：

| 文件 | 格式 | 用途 |
| --- | --- | --- |
| `<de>.packages` | 换行分隔的软件包名称 | `module_desktops install` 新安装的确切软件包集合（通过 `pkg_install` 的 `ACTUALLY_INSTALLED` 数组从 `apt-get -s install` 试运行中捕获）。`remove` 路径将其传递给 `pkg_remove`；`downgrade` 路径用它来约束可移除的内容。 |
| `<de>.tier` | 一行：`minimal`、`mid` 或 `full` | 当前已安装层级的真相来源。由 `status`、`tier`、`at-tier`、`upgrade`、`downgrade`、`set-tier` 读取。由 `install` 和层级变更命令写入。 |

#### 7.1.2 写入的自动登录文件

| 显示管理器 | 文件 |
| --- | --- |
| `gdm3` | Ubuntu 上为 `/etc/gdm3/custom.conf`，Debian 上为 `/etc/gdm3/daemon.conf`。根据 `/etc/os-release` 中的 `ID=` 分支（而非按发行版代号 — bookworm 和 trixie 都使用 `daemon.conf`）。文件通过 sed 就地编辑，**不**会被覆盖 — 保留任何用户自定义（`WaylandEnable=false` 等）。 |
| `sddm` | `/etc/sddm.conf.d/autologin.conf`（插入式，非破坏性） |
| `lightdm` | `/etc/lightdm/lightdm.conf.d/22-armbian-autologin.conf`（插入式，非破坏性） |

### 7.2 module_desktop_yamlparse

```text
module_desktop_yamlparse <de_name> [arch] [release] [tier]
```

封装 `parse_desktop_yaml.py`。重置所有 `DESKTOP_*` 全局变量，运行辅助脚本，并 `eval` 其标准输出。解析失败时返回 1（解析器的 stderr 会被显示出来）。

默认值：

- `arch` → `dpkg --print-architecture`
- `release` → `$DISTROID`
- `tier` → `minimal` — 传递给解析器的 `--tier` 参数，因此只需要 `DESKTOP_DM` / `DESKTOP_PRIMARY_PKG` 的调用方（状态检查、自动登录路径）无需知道实际安装的层级。

```bash
module_desktop_yamlparse xfce
echo "$DESKTOP_PRIMARY_PKG"   # → xfce4

module_desktop_yamlparse xfce arm64 trixie full
echo "$DESKTOP_TIER"          # → full
echo "$DESKTOP_PACKAGES"      # → minimal + mid + full 集合，浏览器已解析
```

### 7.3 module_desktop_yamlparse_list

```text
module_desktop_yamlparse_list [arch] [release]
```

调用带 `--list` 的解析器，并将 TSV 打印到标准输出。用于组装在未带 `de=` 调用 `install` 时显示的"可用：..."提示。

### 7.4 module_desktop_supported

```text
module_desktop_supported <de_name> [arch] [release]
```

`module_desktop_yamlparse` 的便捷封装，基于 `DESKTOP_AVAILABLE`（计算可用性轴）返回 0/1。抑制解析器 stderr — 用于谓词和 CI 门控。注意：此函数不考虑编辑性的 `DESKTOP_STATUS` 轴 — 一个 `status: unsupported` 的桌面环境如果其 YAML 声明了请求的发行版+架构，此处仍可返回 0。如果需要排除不受支持的桌面环境，请单独过滤 `DESKTOP_STATUS`。

### 7.5 module_desktop_repo

```text
module_desktop_repo <de_name>
```

设置自定义 APT 源。必须在 `module_desktop_yamlparse` **之后**调用，因为它消费 `DESKTOP_REPO_URL`、`DESKTOP_REPO_KEY_URL`、`DESKTOP_REPO_KEYRING`。

行为：

1. 对照 `^[a-zA-Z0-9._-]+$` 验证 `de_name`（深度防御 — YAML 解析器已阻止遍历）。
2. `curl --retry 3 --connect-timeout 10 --max-time 30 ... | gpg --dearmor` 写入密钥环。设置了 pipefail，因此 curl 失败会被暴露出来。
3. 在继续之前验证密钥环非空（捕获 HTML 错误页脱装甲后产生零字节文件的情况）。
4. 写入 `/etc/apt/sources.list.d/<de_name>.list`，内容为 `deb [signed-by=<keyring>] <url> $DISTROID main`。

如果 YAML 没有 `repo:` 块则为空操作。

### 7.6 module_desktop_branding

```text
module_desktop_branding <de_name>
```

复制品牌资产并运行可选的 postinst 钩子。幂等 — 每一步都用 `[[ -d ... ]]` 保护。

| 源（在 `tools/modules/desktops/` 下） | 目标 |
| --- | --- |
| `greeters/lightdm/` | `/etc/armbian/lightdm/` 并镜像到 `/etc/lightdm/` |
| `skel/` | `/etc/skel/` |
| `branding/wallpapers/*.jpg` | `/usr/share/backgrounds/armbian/` |
| `branding/wallpapers-lightdm/*.jpg` | `/usr/share/backgrounds/armbian-lightdm/` |
| `branding/icons/*` | `/usr/share/icons/armbian/` |
| `branding/pixmaps/*` | `/usr/share/pixmaps/armbian/` |
| `branding/armbian.xml` | `/usr/share/gnome-background-properties/` |
| `greeters/sddm/themes/*` | `/usr/share/sddm/themes/`（仅当 `DESKTOP_DM=sddm` 时） |
| `postinst/<de_name>.sh` | 通过 `bash` 执行（在容器/CI 中跳过） |

GNOME 设置 → 关于 / KDE 信息中心 等中的发行版徽标**不**从此处安装 — 该文件随 `armbian-base-files` 一起提供，以便与 `/etc/os-release` 中的 `LOGO=` 行保持同步。

### 7.7 module_desktop_getuser

```text
module_desktop_getuser
```

返回第一个具有真实登录 shell 的非 root、非系统用户。如果设置了 `$SUDO_USER` 且不是 root 则优先使用，否则扫描 `/etc/passwd` 查找第一个 `1000 ≤ uid < 65534` 且 shell 不匹配 `nologin|false` 的条目。如果找不到则退出 1。

### 7.8 module_update_skel

```text
module_update_skel install
```

遍历 `getent passwd`，对每个普通用户（`1000 ≤ uid < 65534`，主目录存在，非 root）：

1. 用 `find -mindepth 1` 遍历 `/etc/skel`。对每个条目：
   - 目录：如果目标不存在则创建。
   - 文件：如果目标不存在则复制；绝不覆盖。
2. 运行 `chown -R "$uid:$gid" "$home/"` 作为安全网。

递归 `chown` 至关重要：其他软件包的 postinst 脚本（caja、nemo、gnome-keyring 等）通常会在首次安装时将 root 拥有的文件泄漏到用户的 `~/.config` 目录中。如果没有递归 chown，那些工具在首次登录时会因无法写入自己的配置目录而拒绝启动。

### 7.9 module_appimage

```text
module_appimage <install|remove|status> app=<name>
```

独立的 AppImage 辅助工具。内部 `APPIMAGE_REPO` 注册表将逻辑应用名称（例如 `armbian-imager`）映射到 GitHub `owner/repo` 路径，并从最新版本下载相应架构后缀的 AppImage。`module_appimage install` 还会安装 `libfuse2`、`fuse3` 以及 `libgles2`/`libegl1`/`libgl1`/`libgl1-mesa-dri` 运行时，以便 AppImage 可以启动。

默认情况下不从桌面安装路径调用。`armbian-imager` AppImage 可通过 `armbian-config --api module_appimage install app=armbian-imager` 供明确想要它的用户使用。

## 8. 生命周期：安装

`module_desktops install` 中的安装流水线有意设计为线性且易于幂等。**每个触及系统状态的步骤都取决于前一步的成功。**

标记为 `[R]` 的步骤**仅在运行时**执行 — 传递 `mode=build` 时跳过（镜像构建时，不存在真实用户）。标记为 `[B]` 的步骤在**两种**模式下都运行。

```text
 1. [B] 验证参数              de= 和 tier= 都为必填；tier 必须为 minimal|mid|full
 2. [R] 解析目标用户           module_desktop_getuser（在 mode=build 中跳过）
 3. [B] 解析目标层级的 YAML    module_desktop_yamlparse $de $arch $release $tier
 4. [B] 验证软件包列表          DESKTOP_PACKAGES / DESKTOP_PRIMARY_PKG 为空则退出
 5. [B] 不可用警告              DESKTOP_AVAILABLE != yes → 向 stderr 发出警告，继续
 6. [B] 禁止交互                debconf-set-selections + DEBIAN_FRONTEND=noninteractive
 7. [B] 配置自定义仓库          module_desktop_repo $de （如无 repo: 块则为空操作）
 8. [B] 写入 apt 优先级         _module_desktops_write_apt_pin （强制使用 apt.armbian.com .deb）
 9. [B] apt update              pkg_update
10. [B] 重置 ACTUALLY_INSTALLED  pkg_install 用来记录新软件包的数组
11. [B] apt install 桌面软件包    pkg_install $DESKTOP_PACKAGES        ← 失败即中止
12. [B] apt install + 注册 DM    pkg_install $DESKTOP_DM              ← 失败即中止
                                  /etc/X11/default-display-manager
13. [B]（Armbian）如存在 /etc/apt/sources.list.d/armbian.{list,sources} 则安装 plymouth
14. [B] 保存安装清单            /etc/armbian/desktop/<de>.packages 和 <de>.tier
15. [B] 清除不需要的软件包      apt-get remove --purge $DESKTOP_PACKAGES_UNINSTALL
16. [B] 安装品牌定制            module_desktop_branding $de（浏览器策略、VPU 标志等）
17. [R] 将用户加入组            sudo netdev audio video dialout plugdev input bluetooth systemd-journal ssh
18. [R] 配置文件同步守护进程（psd） touch ~/.activate_psd，sudoers 条目
19. [R] 将 skel 同步到现有用户   module_update_skel install （带 chown -R 安全网）
20. [R] 停止其他 DM             逐个停止 gdm3/lightdm/sddm
21. [R] 启动显示管理器           systemctl start display-manager      ← 容器路径也跳过
22. [R] 切换 default.target      systemctl set-default graphical.target  仅在步骤 21 成功后
23. [R] 启用自动登录             module_desktops auto de=$de
```

**`mode=build`** 由 Armbian 构建框架在镜像创建时使用。此时 rootfs 没有普通用户（armbian-firstrun 在首次启动时创建第一个用户），而 DM/systemd 操作在 chroot 内没有意义。软件包、品牌定制、清单和 `/etc/skel` 都会正确落地；第一个用户在 `useradd` 时继承 skel，而 armbian-firstrun 管理 `graphical.target`。

如果步骤 11 或 12 失败，函数返回 1 且不进行进一步的状态变更 — 不写入清单，`default.target` 保持在 `multi-user`，不启动任何 DM。系统状态与从未运行过安装时相同。

## 9. 生命周期：移除

```text
 1. 验证参数                 de= 必填
 2. 读取已安装层级标记        /etc/armbian/desktop/<de>.tier（默认：minimal）
 3. 在已安装层级解析 YAML     module_desktop_yamlparse $de $arch $release $installed_tier
 4. 禁用自动登录             module_desktops manual de=$de
 5. 停止显示管理器           systemctl stop display-manager
 6. 切换 default.target      systemctl set-default multi-user.target
 7. 隔离到 multi-user         systemctl isolate multi-user.target （立即将正在运行的会话
                            回落到控制台，无需重启）
 8. 计算可移除集合           来自 /etc/armbian/desktop/<de>.packages
                            回退：通过 dpkg-query 遍历 DESKTOP_PACKAGES
 9. 过滤掉必要软件包         apt-get -s -y purge <列表> （模拟，解析 stderr）
                            apt 在"警告：以下必要软件包将被移除"
                            下列出的每个软件包都会从可移除集合中
                            丢弃 — 见下文注释
10. 清除剩余集合             apt-get -y purge <过滤后的列表>   ← 失败即中止，
                            保留清单以便重试
11. 删除清单文件             rm /etc/armbian/desktop/<de>.{packages,tier}  （仅在步骤 10 成功后）
12. pkg_clean                apt-get clean — 回收下载的 .deb 缓存
```

`set-default` 和 `isolate` 调用共同确保用户在卸载后立即获得 tty1 上的控制台登录，无需重启。没有它们的话，系统会停留在 `graphical.target` 而后面没有 DM，本地控制台将是空白的。

**为什么要有必要软件包过滤（步骤 9）。** 移除路径直接调用 `apt-get -y purge` — **而不是** `pkg_remove`（它包装了 `apt-get autopurge`）。`autopurge` 在移除之上添加了孤立清理级联，而在新的 post-t64 镜像（trixie+、noble+）上，与 `e2fsprogs` 一起引入的几个共享库（`libext2fs2t64`、`libss2`、`logsave`）被标记为自动安装。一旦桌面环境被移除，没有任何手动安装的软件包依赖它们，autopurge 就会提议孤立移除整个链条，而 apt 2.9+ / solver 3.0 会以 `E: Essential packages were removed and -y was used without --allow-remove-essential` 否决该事务 — 实际上什么都不会被移除。普通的 `apt-get purge` 避免了级联，而清单已经是完整列表，因此不需要级联。

过滤器捕获的另一种情况：某些基础镜像（特别是从 debian-slim 重建的 `armbian/repository-update:*-armhf` 标签）没有预装 `e2fsprogs`。当桌面环境的安装通过传递依赖引入 `dracut-install` 或 `gnome-disk-utility` 时，它们会拉入 `e2fsprogs`，它会出现在清单中，而清除它会触及一个 Essential 软件包。步骤 9 模拟清除，解析 apt 的必要警告块（去除 `(due to X)` 注释），并在真正的清除运行之前从列表中删除每个被标记的名称。

如果步骤 10 失败，函数返回 1 并保留清单，因此下一次 `remove` 会针对同一列表重试，而不是回退到精度较低的 YAML 遍历路径。

## 10. 生命周期：升级和降级

`upgrade` 和 `downgrade` 是 `_module_desktops_change_tier` 的两半：

```text
1.  验证参数                 de= 和 tier= 必填；tier 必须为 minimal|mid|full
2.  读取当前层级标记          /etc/armbian/desktop/<de>.tier（必须存在）
3.  验证方向                 upgrade 拒绝目标 <= 当前
                            downgrade 拒绝目标 >= 当前
                            相同层级 → 无操作消息，退出 0
4.  解析 YAML 两次           一次在当前层级，一次在目标层级
                            将软件包列表存储在两个 bash 数组中
5.  计算集合差               （对逐行 printf 输入使用 awk）
                            upgrade:   to_install = target - current
                            downgrade: removable  = current - target
6.  （仅 downgrade）求交集   removable ∩ <de>.packages — 绝不触及
                            用户在桌面安装路径之外手动安装的软件包
7.  应用                     pkg_install（升级）或 pkg_remove（降级）
8.  更新清单                 追加新软件包，或移除已清空的软件包
9.  更新层级标记             /etc/armbian/desktop/<de>.tier
```

`set-tier` 是同一辅助函数的薄前端，它根据当前层级与目标层级自动检测方向。它是对话框菜单中"将 `<桌面环境>` 切换到 `<层级>`"按钮所使用的入口点。

## 11. 容器和 CI 感知

`_desktop_in_container` 在以下任一条件成立时返回 true：

- `/.dockerenv` 存在
- `/run/.containerenv` 存在
- 设置了 `$CI`
- 设置了 `$GITHUB_ACTIONS`

在容器内，安装流水线仍执行软件包、品牌定制和 skel 工作，但**跳过**：

- 停止或启动任何显示管理器
- `set-default graphical.target` 切换
- 自动登录变更后重启显示管理器
- 移除时的 `systemctl isolate` 调用
- 运行各桌面环境的 `postinst/<de_name>.sh` 钩子

这使得同一条代码路径可用于 Docker 内的镜像预植，而不需要并行的"容器模式"分支。

## 12. 添加新桌面环境

1. **创建 YAML。** 在 `tools/modules/desktops/yaml/<de_name>.yaml` 处新建一个文件，遵循 [架构](#yaml-架构)。最低必填字段：`display_manager`、`status`、`tiers.minimal.packages`，以及 `releases.<代号>` 下至少一个带有 `architectures` 列表的条目。
2. **（可选）各桌面环境的层级覆盖。** 仅当需要覆盖 common 默认值时才添加 `tiers.mid` 和/或 `tiers.full` 块。大多数桌面环境直接继承 common 的 mid/full。
3. **（可选）`tier_overrides`。** 仅当存在此桌面环境特有的已知软件包可用性空缺时，才添加按架构或按发行版-按架构的移除项。跨桌面环境的空缺应放在 `common.yaml` 中。
4. **（可选）自定义仓库。** 如果桌面环境不在发行版的默认仓库中，则添加 `repo:` 块。将密钥环路径固定在 `/usr/share/keyrings/` 下。
5. **（可选）Postinst 钩子。** 在 `tools/modules/desktops/postinst/<de_name>.sh` 处放置任何必须在 `apt install` 后运行的桌面环境专用配置。容器/CI 运行会自动跳过。
6. **（可选）品牌定制覆盖。** 品牌定制位于共享目录中，因此大多数桌面环境不需要任何桌面环境专属资产 — 仅当桌面环境需要不同的东西时才添加文件。
7. **在每个层级冒烟测试解析器：**

    ```bash
    cd configng
    for tier in minimal mid full; do
        python3 tools/modules/desktops/scripts/parse_desktop_yaml.py \
            tools/modules/desktops/yaml `<de_name>` trixie arm64 --tier $tier
        echo "---"
    done
    ```

    所有 `DESKTOP_*` 变量都应打印出来，对于你在 YAML 中列出的任何（发行版，架构）对，`DESKTOP_AVAILABLE="yes"`，且 `DESKTOP_TIER` 应与请求的层级匹配。

8. **列表模式健全性检查：**

    ```bash
    python3 tools/modules/desktops/scripts/parse_desktop_yaml.py \
        tools/modules/desktops/yaml --list trixie arm64
    ```

    你的新桌面环境应出现在你声明的（发行版，架构）组合的 TSV 输出中。

9. **端到端测试**在一次性 VM 或容器中：

    ```bash
    armbian-config --api module_desktops install de=`<de_name>` tier=minimal
    armbian-config --api module_desktops upgrade de=`<de_name>` tier=mid
    armbian-config --api module_desktops upgrade de=`<de_name>` tier=full
    armbian-config --api module_desktops downgrade de=`<de_name>` tier=minimal
    armbian-config --api module_desktops remove de=`<de_name>`
    ```

10. **添加菜单项**在 `tools/json/config.system.json` 中，如果你希望桌面环境出现在对话框菜单中。现有桌面环境每个 DE 使用以下槽位分配：

    | ID 槽位 | 动作 |
    | --- | --- |
    | `*01` | 安装 minimal |
    | `*02` | 卸载 |
    | `*03` | 启用自动登录 |
    | `*04` | 禁用自动登录 |
    | `*05` | 安装 mid |
    | `*06` | 安装 full |
    | `*07` | 切换到 minimal |
    | `*08` | 切换到 mid |
    | `*09` | 切换到 full |

    `*07-*09` 切换层级条目使用 `module_desktops set-tier` 并用 `module_desktops status de=<X> && ! module_desktops at-tier de=<X> tier=<target>` 控制可见性。

    **`status: community` 的桌面环境**（`[CSC]` 层级）使用更短的分配 — 仅有 `*01`（安装 minimal）、`*02`（卸载）、`*03`（自动登录）、`*04`（手动登录）— 遵循 `kde-neon` 的先例。没有 3 层安装，没有 set-tier。描述和 `short` 带有尾随的 `[CSC]` 标记，以便 UI 可以区分社区桌面环境与一级支持的桌面环境。**不要**为 `status: unsupported` 的桌面环境添加菜单项 — 它们被有意排除在对话框之外，以避免用户从菜单进入损坏的安装路径。

## 13. 矩阵审计自动化

桌面矩阵涵盖多个桌面环境 × 多个发行版 × 多个架构，有两种漂移倾向于无声累积：

1. **缺失的发行版** — `armbian/build` 向 `config/distributions/` 添加了一个新发行版（例如 Ubuntu `resolute`），但没有任何桌面环境 YAML 为其添加发行版块，因此桌面环境根本无法在该发行版上安装。
2. **软件包空缺** — 解析后的 `DESKTOP_PACKAGES` 集合中的某个条目不再对某些 `(release, arch)` 对发布（存档移除了它，或者从未为该架构构建过），因此 `apt` 在安装时会失败，报错 `E: Unable to locate package`。

一个每周运行的 GitHub Actions 工作流会检测这两种情况，将发现交给 Claude Code 提议 YAML 编辑，并打开一个草稿 PR 供维护者审查。

### 13.1 组件

```text
tools/modules/desktops/github/
├── audit.py           # 确定性扫描器 — 输出 audit-report.json
├── audit_prompt.py    # 将报告渲染为 Claude 提示
└── audit_apply.py     # 遗留的直接 API 应用器（工作流未使用）

.github/workflows/
└── maintenance-desktop-audit.yml   # 定时工作流
```

只有扫描器与网络通信；LLM 从不自行获取软件包元数据。这使得"哪里坏了"的信号可重现且易于缓存，并将所有非确定性限制在"如何修复"这一步。

### 13.2 audit.py

针对以下内容遍历 `tools/modules/desktops/yaml/`：

- `armbian/build` 的 `config/distributions/<release>.conf`（从通过 `--build-repo` 传递的兄弟签出中加载）以获取发行版集合及其支持状态（`supported`、`csc`、`eos` 等）。任何 `eos` 的内容都被跳过。
- `packages.debian.org` 和 `packages.ubuntu.com` — 每个 `(release, arch, package)` 元组发送一个 `urllib` 请求，使用 `ThreadPoolExecutor` 并行化。响应在运行期间在进程内缓存。

报告结构（`audit-report.json`）：

```json
{
  "scanned_releases": ["bookworm", "noble", "resolute", "trixie"],
  "build_distributions": { "<release>": { "name": "...", "support": "supported|csc|eos", "architectures": [...] } },
  "missing_releases": [ { "release": "resolute", "support_status": "csc", "architectures": [...] } ],
  "package_holes":    [ { "de": "xfce", "release": "trixie", "arch": "riscv64", "tier": "full", "missing": ["libfoo"] } ],
  "skipped_desktops": ["bianbu"],
  "stats": { "desktops": 11, "scope": 4, "holes": 0, "package_lookups": 0 }
}
```

YAML 中 `status: unsupported` 的桌面环境列在 `skipped_desktops` 中且不被审计 — 不受支持的桌面环境中的漂移不具可操作性。`status: community` 的桌面环境**会**被审计（社区层级桌面环境中的漂移仍然值得报告，即使维护者可能选择不立即采取行动）。

标志：`--tier {minimal,mid,full}` 缩小范围；`--release <代号>` 审计单个发行版；`--skip-network` 是仅报告 `missing_releases` 的试运行。

### 13.3 audit_prompt.py

将 JSON 报告渲染为单个文本提示（没有 markdown-in-markdown 的麻烦；报告 JSON 嵌入在代码围栏块中）。提示将 Claude 限制为：

- 仅触及 `tools/modules/desktops/yaml/` 下的 YAML 文件
- 处理**每一个**发现，而不仅仅是第一个
- 对于软件包空缺，优先编辑 `common.yaml` 的 `tier_overrides` 块（一个地方，适用于每个桌面环境），而不是在各桌面环境 YAML 中复制 `packages_remove` 条目
- 对于缺失的发行版，为每个 `status: supported` 的桌面环境 YAML 添加一个发行版块，从现有块复制结构，仅在需要时调整按发行版的差异
- 始终添加内联注释解释**为什么**存在空缺，以便未来的读者可以区分临时的存档缺口和永久的上游移植限制
- 保留现有的 2 空格缩进
- 如果报告为空，则说明情况并不进行任何编辑

### 13.4 maintenance-desktop-audit.yml

触发条件：

- `schedule: '0 6 * * 1'` — 每周一 UTC 06:00。发行版和软件包可用性变化缓慢，因此每周一次足够且成本低。
- `workflow_dispatch` — 带有可选的 `tier`、`release` 和 `dry_run` 输入。`dry_run: true` 在确定性审计后停止，并附上 `audit-report.json`，不调用 Claude 也不打开 PR。

并发：`group: desktop-audit`，`cancel-in-progress: false` — 两个定时运行永远不会竞争，手动调度会排在定时运行之后而不是终止它。

作业步骤，按顺序：

1. **签出 configng**在工作区根目录（无 `path:`），以便 `claude-code-action` 能找到 `.git`。
2. **签出 `armbian/build`**到 `armbian-build/`，使用 `fetch-depth: 1` — 审计只读取 `config/distributions/`，因此浅克隆即可。
3. **设置 Python 3.12** 并 `pip install pyyaml`。
4. **运行 `audit.py`** — 写入 `audit-report.json`，向 `$GITHUB_STEP_SUMMARY` 追加 markdown 摘要表，并将 `steps.audit.outputs.actionable` 设为 `true` 当且仅当 `missing_releases` 或 `package_holes` 非空。
5. **准备 Claude 提示**（`audit_prompt.py`）— 仅当 `actionable` 且非试运行时。
6. **上传 `audit-report` 工件**（总是，保留 30 天）— 即使在零空缺运行中也可用作历史记录。
7. **`anthropics/claude-code-action@v1`**，使用：
   - `claude_code_oauth_token: secrets.CLAUDE_CODE_OAUTH_TOKEN`（Max 订阅令牌 — 无需按运行支付 API 费用）。
   - `claude_args: --max-turns 30 --permission-mode acceptEdits --allowed-tools Edit,Write,Read,Glob,Grep,Bash(git:*)`。`acceptEdits` 加上显式允许列表是必需的：没有它们，操作的默认工具门会拒绝 Edit/Write，分支将保持为空。`Bash(git:*)` 仅允许只读 git 检查；没有 shell 执行面。
8. **暂存 Claude 执行日志** — 将 `${RUNNER_TEMP}/claude-execution-output.json` 复制到工作区；作为 `claude-execution-output` 工件上传，使用 `if: always()` 以便失败或零编辑运行也可以从转录本中调试，无需重新运行。
9. **清理临时文件** — 从工作树中移除 `armbian-build/`、`audit-report.json`、`claude-prompt.txt` 和 `claude-execution-output.json`，以便 `peter-evans/create-pull-request` 只看到 Claude 的 YAML 编辑。
10. **`peter-evans/create-pull-request@v6`** — 分支 `bot/desktop-matrix-audit`，基准 `main`，`add-paths: tools/modules/desktops/yaml/*`，`delete-branch: true`，`draft: true`，标签 `bot`、`desktops`、`documentation`。PR 正文为 `steps.claude.outputs.structured_output`（Claude 自己对所更改内容及原因的总结）。如果 Claude 没有产生差异，分支不会领先于 main，也不会打开 PR — 工作流以绿色完成，仅有审计工件。

### 13.5 权限

```yaml
permissions:
  contents: write        # 推送到 bot/desktop-matrix-audit
  pull-requests: write   # 打开 PR
  id-token: write        # claude-code-action OIDC
```

### 13.6 审查机器人 PR

机器人 PR 有意以**草稿**形式打开。合并前的人工检查：

1. 阅读 Claude 的 PR 正文 — 它应列出它更改的每个文件及原因。
2. 确认差异范围限于 `tools/modules/desktops/yaml/`。任何超出范围的文件都是危险信号（工作流的 `add-paths` 应该已经阻止了这一点，但请验证）。
3. 对于每个缺失发行版的添加：抽查新的发行版块是对现有块的合理复制（例如 `xfce.yaml` 的 `resolute` 块应该看起来像 `trixie` 或 `noble` 块，而不是一个写了一半的存根）。
4. 对于每个软件包空缺编辑：确认它位于 `common.yaml` 的 `tier_overrides` 中它所属的位置，而不是在每个桌面环境中重复。
5. 对于每个 WHY 注释：确认它是准确的。"尚未在 trixie 中"会随时间失效；"没有上游 riscv64 移植"则不会。
6. 标记为准备审查并正常合并。`delete-branch: true` 会在合并时清理。

如果 Claude 判断报告不具可操作性（例如，唯一的发现是一个维护者希望暂缓的 `csc` 层级发行版），则运行结束时存在 `audit-report` 工件且没有 PR — 检查工件和 `claude-execution-output` 日志以确认。

## 14. 常见陷阱

### 14.1 packages_uninstall 级联

在 `tiers.minimal.packages_uninstall` 中列出一个软件包会在安装后对其运行 `apt-get remove --purge`。如果该软件包是桌面环境安装引入的任何元包的硬 `Depends:`，apt 的自动移除级联会将该元包一起扯掉 — 而在设置了 `APT::Get::AutomaticRemove "true"` 的系统上（Ubuntu noble/resolute），级联会继续并撕掉桌面的一大块。实际场景中的例子：

- 列出任何 `xfce4-goodies` 插件（例如 `xfce4-clipman-plugin`）会扯掉 `xfce4-goodies` 本身，然后是半个桌面。
- 列出 `language-selector-gnome` 会扯掉 `gnome-control-center`（它在 Ubuntu 上将其作为硬 Depends），因此用户会丢失设置。
- 列出 `kdeconnect` 或 `khelpcenter` 会扯掉 `neon-desktop`。

**规则**：永远不要把你附带的元包的 `Depends:` 放入 `packages_uninstall`。在添加任何内容之前，用 `apt-cache rdepends --installed <pkg>` 验证。

### 14.2 Gnome 的 daemon.conf 与 custom.conf

Debian 和 Ubuntu 都附带 `gdm3` 软件包，但它们读取不同的配置文件：

- Debian（任何发行版）：`/etc/gdm3/daemon.conf`
- Ubuntu（任何发行版）：`/etc/gdm3/custom.conf`

`module_desktops auto` 根据 `/etc/os-release` 中的 `ID=ubuntu` 分支，**而不是**按发行版代号。代码的早期版本按代号分支，导致在 Debian bookworm 上写入了错误的文件。

`auto` 路径还通过 sed 就地编辑文件（保留任何用户自定义，如 `WaylandEnable=false`），而不是用全新的 `cat > $file` 覆盖它。

### 14.3 登录正则锚定

标准的 Ubuntu noble `/etc/gdm3/custom.conf` 模板附带一行注释掉的示例行：

```text
#  AutomaticLoginEnable = true
```

对 `AutomaticLoginEnable\s*=\s*true` 进行未锚定的 `grep` 会匹配此注释，而 `module_desktops login` 会在每个全新安装中（用户从未碰过自动登录）返回 0（自动登录已启用）。修复方法是使用 `^AutomaticLoginEnable[[:space:]]*=[[:space:]]*true` — 在行首锚定，这样注释就不会匹配。

## 15. 安全说明

- **路径遍历**：`de_name` 从 CLI 输入流入 `os.path.join(yaml_dir, f"{de_name}.yaml")`。Python 辅助脚本通过 `os.path.realpath` 解析两边，并拒绝任何位于 `yaml_dir` 外的内容（处理 `..`、绝对路径和符号链接转义）。`module_desktop_repo` 还会在写入 `/etc/apt/sources.list.d/<de_name>.list` 之前对照 `^[a-zA-Z0-9._-]+$` 验证 `de_name`。
- **Shell 注入**：Python 辅助脚本输出的所有值都通过 `shell_escape()`（转义 `\`、`"`、`$`、`` ` ``），因此即使 YAML 字符串包含 shell 元字符，bash 调用方也可以安全地 `eval` 输出。
- **GPG 密钥环获取**：`curl | gpg --dearmor` 流水线在 `set -o pipefail` 下运行，带有 `--retry 3 --connect-timeout 10 --max-time 30`，脱装甲后还有非空文件检查。失败的下载或 HTML 错误页不会静默产生空密钥环。
- **APT 源**使用 `[signed-by=<keyring>]` 写入，绝不通过 `apt-key`。每个桌面环境的源列表位于自己的文件中（`/etc/apt/sources.list.d/<de_name>.list`），因此移除只需一个 `rm`。

## 16. 另见

- [扩展与钩子](./6_ExtensionsHooks.md) — Armbian 构建框架的扩展系统，由板级配置用于注入构建时钩子。
- Armbian Config — `armbian-config` 的最终用户文档。
- [configng 仓库](https://github.com/armbian/configng) — 此处描述的所有内容的来源。
