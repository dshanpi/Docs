---
title: 输入法配置指南
sidebar_position: 8
slug: /DshanPi-A1_CM5/SystemConfig/InputMethod
description: 在 GNOME 桌面为当前用户启用 Fcitx 5 和 Rime 中文输入法。
---

如果已经能在文本编辑器中输入中文，可以直接使用现有输入法。需要配置 Rime 拼音时，在 **DshanPI A1 CM5 GNOME 桌面版**中以日常使用的普通账号操作。

## 安装并启用 Fcitx 5

在开发板桌面打开终端。

**安装输入法和拼音方案。** 先刷新软件包列表，再安装 Fcitx 5 和 Rime。

```bash
sudo apt update
sudo apt install fcitx5 fcitx5-rime rime-data-luna-pinyin fcitx5-config-qt fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 fcitx5-frontend-qt5 im-config
```

**为当前用户启用 Fcitx 5。** 随后按下文重新登录桌面。

```bash
im-config -n fcitx5
```

保存当前工作，**注销桌面并重新登录**，让新会话加载输入法。[Fcitx 5 官方配置说明](https://fcitx-im.org/wiki/Setup_Fcitx_5)

## 添加中文并试打

1. 在桌面终端运行 `fcitx5-config-qt`。在可用输入法列表中搜索 **Rime**（中州韵），选中后点击中间向左的箭头。确认左侧列表中键盘布局位于首行，Rime 在其下方，点击**应用**。若找不到，取消勾选**仅显示当前语言**后重试。

   <img src={require('./figures/fcitx-add-rime.png').default} width="570" alt="Fcitx 配置窗口左侧的输入法列表与右侧的可用输入法" />

2. 打开文本编辑器，按 **Ctrl + 空格** 切换输入法，输入 `nihao`。出现候选词后选择“你好”，确认中文能写入文本。
3. 若按键无响应，在配置窗口的**全局选项**查看切换快捷键。若只有个别应用无法输入，先关闭并重新打开该应用，再运行 `fcitx5-diagnose`，核对当前图形会话、Fcitx 进程和应用所用的 GTK 或 Qt 前端。[Fcitx 5 会话配置说明](https://fcitx-im.org/wiki/Setup_Fcitx_5)

<details>
<summary>选配雾凇拼音并调整候选词数量</summary>

1. 关闭正在编辑的文本。在文件管理器按 **Ctrl + L**，输入 `~/.local/share/fcitx5`。若已有 `rime` 目录，先将它复制到其他位置备份，保留自己的词库和配置。
2. 在板端终端运行 `sudo apt install librime-plugin-lua`。按项目的安装说明取得雾凇拼音方案，将方案文件放入 `~/.local/share/fcitx5/rime/`，确认该目录下有 `rime_ice.schema.yaml`。[雾凇拼音安装说明](https://github.com/iDvel/rime-ice)
3. 在同一目录编辑 `default.custom.yaml`。下面的示例启用雾凇拼音并将每页候选词设为 9 个。已有 `patch:` 时，把所需设置合并到该项下，保留其他自定义设置。

   ```yaml
   patch:
     schema_list:
       - schema: rime_ice
     "menu/page_size": 9
   ```

4. 切换到 Rime，在输入法菜单中选择**重新部署**。完成后到文本编辑器试打拼音，输入有多个候选词的音节，核对每页最多显示 9 个候选词。

</details>

**DshanPI A1 CM5 实测结果**　在独立图形会话的 GTK 文本框中已输入“你好”。上述雾凇方案、用户桌面重登后的自启动和特定应用兼容性仍需在对应桌面中核对。
