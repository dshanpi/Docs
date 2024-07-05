---
sidebar_position: 3
---
# E907 子系统框图

![image-20230215122832524](assets/post/README/image-20230215122832524.png)

具体的寄存器配置项这里就不过多介绍了，具体可以参考数据手册

V853 的异构系统通讯在硬件上使用的是 MSGBOX，在软件层面上使用的是 AMP 与 RPMsg 通讯协议。其中 A7 上基于 Linux 标准的 RPMsg 驱动框架，E907基于 OpenAMP 异构通信框架。

### AMP 与 RPMsg

V851 所带有的 A7 主核心与 E907 辅助核心是完全不同的两个核心，为了最大限度的发挥他们的性能，协同完成某一任务，所以在不同的核心上面运行的系统也各不相同。这些不同架构的核心以及他们上面所运行的软件组合在一起，就成了 AMP 系统 （Asymmetric Multiprocessing System, 异构多处理系统）。

由于两个核心存在的目的是协同的处理，因此在异构多处理系统中往往会形成 Master - Remote 结构。主核心启动后启动从核心。当两个核心上的系统都启动完成后，他们之间就通过 IPC（Inter Processor Communication）方式进行通信，而 RPMsg 就是 IPC 中的一种。

在AMP系统中，两个核心通过共享内存的方式进行通信。两个核心通过 AMP 中断来传递讯息。内存的管理由主核负责。

![image-20220704155816774](assets/post/README/image-20220704155816774.png)
