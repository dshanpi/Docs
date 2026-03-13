---
sidebar_position: 12
---

# DuckyClaw探索物理硬件

DuckyClaw 是面向硬件的 OpenClaw 版本。该理念旨在通过强大的OpenClaw代理概念探索物理硬件。

![image-20260313172508400](images/image-20260313172508400.png)

当你的AI助手需要控制真实的设备、做出决策时，DuckyClaw正是理想的解决方案。它基于TuyaOpen C SDK开发而成——无需在微控制器上使用Node.js。只需一个代码库即可实现从ARM Cortex-M架构到x64架构的各种设备的控制。

## 1.环境搭建

### 1.1 安装开发工具

在主机上安装所需的工具。

```
sudo apt-get install lcov cmake-curses-gui build-essential ninja-build wget git python3 python3-pip python3-venv libsystemd-dev -y
```



### 1.2 获取仓库

```
#对于较大的克隆项目，你可以增加Git缓冲区的大小：
git config --global http.postBuffer 524288000

#获取duckyClaw仓库
git clone https://github.com/tuya/DuckyClaw.git
```

获取子仓库：

```
cd DuckyClaw
git submodule update --init
```



### 1.3 启动构建环境

激活TuyaOpen开发环境，以便能够使用`tos.py`功能：

```
. ./TuyaOpen/export.sh
```

运行结果如下：

![image-20260313101533407](images/image-20260313101533407.png)

验证环境：

```
tos.py version
tos.py check
```

![image-20260313101604001](images/image-20260313101604001.png)

### 1.4 选择配置

```
tos.py config choice
```

输入3来选择RaspberryPi.config文件

```
(.venv) baiwen@dshanpi-a1:~/DuckyClaw$ tos.py config choice
[INFO]: Running tos.py ...
[NOTE]: Fullclean success.
--------------------
1. ATK_T5AI_MINI_BOARD_2.4LCD_CAMERA.config
2. ESP32S3_BREAD_COMPACT_WIFI.config
3. RaspberryPi.config
4. TUYA_T5AI_BOARD_LCD_3.5_CAMERA.config
--------------------
Input "q" to exit.
Choice config file: 3
[INFO]: Initialing using.config ...
[NOTE]: Choice config: /home/baiwen/DuckyClaw/config/RaspberryPi.config
```



## 2.获取涂鸦设备配置

### 2.1 获取产品编号

访问Tuya DuckyClaw 获取[Tuya产品编号／PID](https://pbt.tuya.com/s?p=dd46368ae3840e54f018b2c45dc1550b&u=c38c8fc0a5d14c4f66cae9f0cfcb2a24&t=2)。

![image-20260313105422395](images/image-20260313105422395.png)

填写任意产品名称和型号最后点击确认。

![image-20260313105839957](images/image-20260313105839957.png)

点击**查看产品**。

![image-20260313105923167](images/image-20260313105923167.png)

可以看到外面获取到的下图箭头所示的产品ID,请记住这个**PRODUCT_ID**。

![image-20260313110009876](images/image-20260313110009876.png)

### 2.2 获取UUID和AuthKey

访问Tuya开发者平台获取[Tuya物联网平台——开放SDK购买](https://platform.tuya.com/purchase/index?type=6)。

![image-20260313110405638](images/image-20260313110405638.png)

购买完成后，可以在采购订单中找到您购买的授权码，点击下载授权码。

![image-20260313110540788](images/image-20260313110540788.png)

下载完成，可以获取excel表格文件。可以看到下载的uuid和key复制这两个`UUID`和`AUTHKEY`。

![image-20260313110830223](images/image-20260313110830223.png)



## 3.获取飞书配置

### 3.1 访问飞书开发平台

访问飞书开放平台：[飞书开放平台](https://open.feishu.cn/app)

### 3.2 创建应用

![image-20260313112601543](images/image-20260313112601543.png)

选择**创建企业自建应用**。

![image-20260313113615749](images/image-20260313113615749.png)

### 3.3 获取应用凭证

填写**应用名称**和**应用描述**，最后点击**创建**。

![image-20260313113709970](images/image-20260313113709970.png)

复制应用凭证`App ID`和`App Secret`，后面我们会用到这两个。

### 3.4 添加应用能力

![image-20260313113735386](images/image-20260313113735386.png)

在`按能力添加`下，添加机器人。添加成功后可以看到机器人能力界面。

### 3.5 配置应用权限

选择`权限管理`，点击`批量导入\导出权限`。

![image-20260313114037989](images/image-20260313114037989.png)

点击 **批量导入** 按钮后，粘贴以下 JSON 配置一键导入所需权限：

```
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "docs:document.content:read",
      "event:ip_list",
      "im:chat",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource",
      "sheets:spreadsheet",
      "wiki:wiki:readonly"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

填入完成后，点击`下一步，确认新增权限`。

![image-20260313114113667](images/image-20260313114113667.png)

在确认导入权限界面下，选择**申请开通**。

![image-20260313114125961](images/image-20260313114125961.png)

点击**确认**。

![image-20260313114159709](images/image-20260313114159709.png)

### 3.6 启用机器人能力

在 **应用能力** > **机器人** 页面，选择**如何开始使用**后的按钮。

![image-20260313114301919](images/image-20260313114301919.png)

在这里可以填写机器人对用户展示的名称。

![image-20260313114402520](images/image-20260313114402520.png)

（可选）自定义菜单界面

![image-20260313114449757](images/image-20260313114449757.png)

（可选）调整菜单状态

![image-20260313114512817](images/image-20260313114512817.png)

（可选）选择展示形式和菜单配置，可以自定义菜单界面。

![image-20260313114615248](images/image-20260313114615248.png)

### 1.7 创建版本并发布

选择上方的`创建版本`。

![image-20260313114824668](images/image-20260313114824668.png)

填写版本号`1.0.0`，填写更新说明(可自定义)。

![image-20260313114909246](images/image-20260313114909246.png)

最后选择**保存**。

![image-20260313114942729](images/image-20260313114942729.png)

选择确认发布

![image-20260313114958553](images/image-20260313114958553.png)



### 1.8 修改订阅配置

在飞书开发平台中， **事件订阅** 页面，选择订阅方式。

![image-20260313150303616](images/image-20260313150303616.png)

点击订阅方式后的按钮。

![image-20260313150335829](images/image-20260313150335829.png)

点击**添加事件**。搜索并添加以下事件：

- im.message.receive_v1- 接收消息
- im.message.message_read_v1- 消息已读回执
- im.chat.member.bot.added_v1- 机器人进群
- im.chat.member.bot.deleted_v1- 机器人被移出群

![image-20260313150507189](images/image-20260313150507189.png)

添加事件完成后如下所示，点击创建版本。

![image-20260313150616508](images/image-20260313150616508.png)

### 1.9 重新发布版本

填写版本号`1.0.1`，填写更新说明(可自定义)。

![image-20260313150715706](images/image-20260313150715706.png)

最后选择**保存**。

![image-20260313150746331](images/image-20260313150746331.png)

选择`确认发布`。

![image-20260313150759599](images/image-20260313150759599.png)



## 4.修改源码配置

修改源码`include/tuya_app_config.h`文件：

```
(.venv) baiwen@dshanpi-a1:~/DuckyClaw$ vi include/tuya_app_config.h
```

### 4.1 修改涂鸦配置

修改源码中的：

```
#ifndef TUYA_PRODUCT_ID
#define TUYA_PRODUCT_ID "xxxxxxxxxxxxxxxx"
#endif

// https://platform.tuya.com/purchase/index?type=6
#ifndef TUYA_OPENSDK_UUID
#define TUYA_OPENSDK_UUID    "uuidxxxxxxxxxxxxxxxx"             // Please change the correct uuid
#endif
#ifndef TUYA_OPENSDK_AUTHKEY
#define TUYA_OPENSDK_AUTHKEY "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Please change the correct authkey
#endif
```

填入获取的产品编号、UUID、AuthKey。

![image-20260313111707275](images/image-20260313111707275.png)



### 4.2 修改飞书配置

修改源码中的：

```
#ifndef IM_SECRET_CHANNEL_MODE
#define IM_SECRET_CHANNEL_MODE      "feishu"
#endif

#ifndef IM_SECRET_FS_APP_ID
#define IM_SECRET_FS_APP_ID         ""
#endif
#ifndef IM_SECRET_FS_APP_SECRET
#define IM_SECRET_FS_APP_SECRET     ""
#endif
```

将飞书平台的App ID和 App Secret填入IM_SECRET_FS_APP_ID和IM_SECRET_FS_APP_SECRET。

![image-20260313115336387](images/image-20260313115336387.png)

如下所示：

![image-20260313115657064](images/image-20260313115657064.png)



## 5.编译与运行

### 5.1 编译

由于我们是运行在DshanPI A1上，无需进行烧录，可直接执行以下命令进行编译：

```
tos.py build
```

如下所示：

![image-20260313115851665](images/image-20260313115851665.png)

![image-20260313145552919](images/image-20260313145552919.png)

编译完成后，会生成一个可执行文件，该文件可以保存在`dist/`目录中。

### 5.2 运行

运行可执行程序：

```
./dist/DuckyClaw_1.0.0/DuckyClaw_1.0.0.elf
```

![image-20260313151121198](images/image-20260313151121198.png)

![image-20260313151325567](images/image-20260313151325567.png)

使用智慧生活APP，点击`+`号，选择扫一扫，扫面上面的二维码，添加涂鸦设备。

> ![image-20260313151625691](images/image-20260313151625691.png)
>
> 您也可以在各大应用市场搜索“**智能生活/SmartLife”**下载使用。

### 5.3 使用飞书测试

使用飞书发送信息，测试DuckyClaw。

![image-20260313151205559](images/image-20260313151205559.png)

![image-20260313151722126](images/image-20260313151722126.png)



### 5.4 控制涂鸦设备

使用智慧生活APP，点击右上角的`+`号，添加涂鸦设备。

![image-20260313155038917](images/image-20260313155038917.png)

使用duckyClaw控制Tuya设备，这里以灯带为例，使用飞书发送文本：

```
帮我通过云端全屋控制，控制我的音乐幻彩灯带变为红色
```

如下所示：

![image-20260313155822410](images/image-20260313155822410.png)