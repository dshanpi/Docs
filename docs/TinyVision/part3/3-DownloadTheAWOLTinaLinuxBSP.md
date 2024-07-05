---
sidebar_position: 3
---
# 下载 AWOL Tina Linux BSP

### 注册一个 AWOL 账号

下载 SDK 需要使用 AWOL 的账号，前往 `https://bbs.aw-ol.com/` 注册一个就行。其中需要账号等级为 LV2，可以去这个帖子：https://bbs.aw-ol.com/topic/4158/share/1 水四条回复就有 LV2 等级了。

### 安装 repo 管理器

BSP 使用 `repo` 下载，首先安装 `repo `，这里建议使用国内镜像源安装

```bash
mkdir -p ~/.bin
PATH="${HOME}/.bin:${PATH}"
curl https://mirrors.bfsu.edu.cn/git/git-repo > ~/.bin/repo
chmod a+rx ~/.bin/repo
```

请注意这里使用的是临时安装，安装完成后重启终端就没有了，需要再次运行下面的命令才能使用，如何永久安装请自行百度。

```bash
PATH="${HOME}/.bin:${PATH}"
```

安装使用 `repo` 的过程中会遇到各种错误，请百度解决。repo 是谷歌开发的，repo 的官方服务器是谷歌的服务器，repo 每次运行时需要检查更新然后卡死，这是很正常的情况，所以在国内需要更换镜像源提高下载速度。将如下内容复制到你的`~/.bashrc` 里

```bash
echo export REPO_URL='https://mirrors.bfsu.edu.cn/git/git-repo' >> ~/.bashrc
source ~/.bashrc
```

如果您使用的是 dash、hash、 zsh 等 shell，请参照 shell 的文档配置。环境变量配置一个 `REPO_URL` 的地址

配置一下 git 身份认证，设置保存 git 账号密码不用每次都输入。

```bash
git config --global credential.helper store
```

### 新建文件夹保存 SDK

使用 `mkdir` 命令新建文件夹，保存之后需要拉取的 SDK，然后 `cd` 进入到刚才新建的文件夹中。

```bash
mkdir tina-v853-open
cd tina-v853-open
```

### 初始化 repo 仓库

使用 `repo init` 命令初始化仓库，`tina-v853-open` 的仓库地址是 `https://sdk.aw-ol.com/git_repo/V853Tina_Open/manifest.git` 需要执行命令：

```bash
repo init -u https://sdk.aw-ol.com/git_repo/V853Tina_Open/manifest.git -b master -m tina-v853-open.xml
```

### 拉取 SDK

```bash
repo sync
```

### 创建开发环境

```bash
repo start devboard-v853-tina-for-awol --all
```