---
title: Qt 5 窗口入门
sidebar_position: 1
slug: /DshanPi-A1_CM5/AppDev/QtWidgets
---

Qt Widgets 用控件组成桌面界面。下面创建一个 QLabel，同时验证 DshanPI A1 CM5 上的编译、链接与窗口绘制。

## 用 Qt Creator 编辑界面

Qt Widgets 用控件组成界面。`QApplication` 管理图形应用和事件循环，`QMainWindow` 提供主窗口，`QLabel` 可以显示文字或图片。使用 Qt Creator 时，设计器把布局保存为 `.ui` 文件。构建时再由 Qt 工具生成相应代码。

**1. 创建项目。** 安装 Qt 5 开发组件和 Qt Creator，打开 **File → New Project → Application (Qt) → Qt Widgets Application**。输入项目名称和保存目录，选择 **qmake**、**QMainWindow** 和本机 Qt 5 套件，完成向导。

```bash
sudo apt update
sudo apt install qtwayland5 qtbase5-dev qtcreator
```

<img src={require('../figures/qt-widgets-template.png').default} width="650" alt="Qt Creator 新项目向导中选择 Qt Widgets Application" />

**2. 编辑窗口。** 在 **Forms** 中双击 `mainwindow.ui`。从 **Display Widgets** 拖入 **Label**，双击标签修改文字并保存。

<img src={require('../figures/qt-designer-label.png').default} width="650" alt="Qt Designer 中从控件列表拖入 Label 到窗口的位置" />

**3. 构建并运行。** 选择 **Build → Build Project**，在 **Compile Output** 中确认编译完成。点击绿色运行按钮打开窗口。也可在套件对应的构建目录直接运行和项目同名的可执行文件。

## DshanPI A1 CM5 实测步骤与结果 {#cm5-实测步骤与结果}

### 编译并运行窗口

**在开发板上安装 Qt 编译工具。**

```bash
sudo apt install qtbase5-dev qt5-qmake g++ pkg-config
```

**保存示例源码。** 复制到最后单独一行的 `EOF`，生成 `cm5-window.cpp`。

```bash
cat > cm5-window.cpp <<'EOF'
#include <QApplication>
#include <QLabel>
#include <QPixmap>
#include <QTimer>
int main(int argc, char **argv) {
    QApplication app(argc, argv);
    QLabel label("Hello, CM5!");
    label.resize(320, 120);
    label.show();
    if (app.arguments().contains("--snapshot")) {
        QTimer::singleShot(150, [&] { app.exit(label.grab().save("cm5-qt.png") ? 0 : 1); });
    }
    return app.exec();
}
EOF
```

**编译窗口程序。**

```bash
g++ -fPIC cm5-window.cpp $(pkg-config --cflags --libs Qt5Widgets) -o cm5-window
```

**生成窗口截图并检查格式。** `offscreen` 让程序在后台绘制窗口。

```bash
QT_QPA_PLATFORM=offscreen ./cm5-window --snapshot
file cm5-qt.png
```

本板生成了 320 × 120 的 PNG。在 **DshanPI A1 CM5 桌面终端**再运行 `./cm5-window`，会打开同一窗口。图中是板上以 offscreen 模式绘制的结果。

![DshanPI A1 CM5 上运行的 Qt Widgets 示例窗口](../figures/cm5-qt.png)

本次还在 DshanPI A1 CM5 的 GNOME 会话中启动了程序，窗口管理器中出现了 320 × 120 的 `cm5-window` 窗口。

### 构建并运行 Qt Designer 窗口

将[DshanPI A1 CM5 示例代码包](pathname:///downloads/cm5-appdev-examples.zip)解压到主目录，得到 `~/cm5-examples/`。用 qmake 构建包含 `.ui` 界面文件的窗口工程。

**生成构建规则。** 新建构建目录，用 qmake 读取示例工程。

```bash
mkdir -p ~/cm5-qt-build && cd ~/cm5-qt-build
qmake ~/cm5-examples/window/window.pro
```

**编译并检查窗口。** 等待编译完成，再运行生成的 `cm5-ui`。

```bash
make -j2
./cm5-ui --check
```

```text
label: Hello, CM5!
```

`--check` 读取窗口中的标签后退出。在桌面运行 `./cm5-ui` 可保持窗口打开。本次还在板上用 Qt Creator 13.0.0 打开了 `window.pro`，窗口标题为 `window - Qt Creator`。这两项自动检查使用虚拟显示。
