---
sidebar_position: 7
---
# 车牌识别模型部署

参考资料：

- 模型仓库：[sirius-ai/LPRNet_Pytorch: Pytorch Implementation For LPRNet, A High Performance And Lightweight License Plate Recognition Framework.](https://github.com/sirius-ai/LPRNet_Pytorch/)

## 1.获取原始模型

1.进入RK Zoo 中车牌识别的模型目录：

```
cd ~/Projects/rknn_model_zoo/examples/LPRNet/model/
```

2.下载原始模型

```
chmod +x ./download_model.sh
./download_model.sh
```

运行效果：

```
(base) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/LPRNet/model$ chmod +x ./download_model.sh
(base) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/LPRNet/model$ ./download_model.sh
--2025-08-20 09:15:01--  https://ftrg.zbox.filez.com/v2/delivery/data/95f00b0fc900458ba134f8b180b3f7a1/examples/LPRNet/lprnet.onnx
Resolving ftrg.zbox.filez.com (ftrg.zbox.filez.com)... 180.184.171.46
Connecting to ftrg.zbox.filez.com (ftrg.zbox.filez.com)|180.184.171.46|:443... connected.
HTTP request sent, awaiting response... 200
Length: 1785792 (1.7M) [application/octet-stream]
Saving to: ‘./lprnet.onnx’

./lprnet.onnx                          100%[============================================================================>]   1.70M  4.99MB/s    in 0.3s

2025-08-20 09:15:02 (4.99 MB/s) - ‘./lprnet.onnx’ saved [1785792/1785792]
```



## 2.模型转换

1.使用Conda激活`rknn-toolkit2`环境

```
conda activate rknn-toolkit2
```

2.进入车牌识别模型转换目录

```
cd ~/Projects/rknn_model_zoo/examples/LPRNet/python
```

3.执行模型转换

```
python3 convert.py ../model/lprnet.onnx rk3576
```

运行效果如下：

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/LPRNet/python$ python3 convert.py ../model/lprnet.onnx rk3576
I rknn-toolkit2 version: 2.3.2
--> Config model
done
--> Loading model
I Loading : 100%|█████████████████████████████████████████████████| 36/36 [00:00<00:00, 7991.26it/s]
done
--> Building model
I OpFusing 0: 100%|██████████████████████████████████████████████| 100/100 [00:00<00:00, 427.21it/s]
I OpFusing 1 : 100%|█████████████████████████████████████████████| 100/100 [00:00<00:00, 140.03it/s]
I OpFusing 0 : 100%|█████████████████████████████████████████████| 100/100 [00:00<00:00, 100.88it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 95.81it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 82.78it/s]
I OpFusing 0 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 76.95it/s]
I OpFusing 1 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 73.15it/s]
I OpFusing 2 : 100%|██████████████████████████████████████████████| 100/100 [00:01<00:00, 56.02it/s]
I GraphPreparing : 100%|███████████████████████████████████████████| 71/71 [00:00<00:00, 964.54it/s]
I Quantizating : 100%|█████████████████████████████████████████████| 71/71 [00:00<00:00, 239.84it/s]
W build: The default input dtype of 'input' is changed from 'float32' to 'int8' in rknn model for performance!
                       Please take care of this change when deploy rknn model with Runtime API!
W build: The default output dtype of 'output' is changed from 'float32' to 'int8' in rknn model for performance!
                      Please take care of this change when deploy rknn model with Runtime API!
I rknn building ...
I rknn building done.
done
--> Export rknn model
done
```

执行完成后可以在`../model/`目录下看到端侧推理的RKNN模型

```
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/LPRNet/python$ ls ../model/
dataset.txt  download_model.sh  lprnet.onnx  lprnet.rknn  test.jpg
```



## 3.模型推理

执行推理测试代码：

```text
python3 lprnet.py --model_path ../model/lprnet.rknn --target rk3576
```

运行效果如下：

```text
(rknn-toolkit2) baiwen@dshanpi-a1:~/Projects/rknn_model_zoo/examples/LPRNet/python$ python3 lprnet.py --model_path ../model/lprnet.rknn --target rk3576
I rknn-toolkit2 version: 2.3.2
done
rk3576
--> Init runtime environment
I target set by user is: rk3576
done
--> Running model
W inference: The 'data_format' is not set, and its default value is 'nhwc'!
--> PostProcess
车牌识别结果: 湘F6CL03
```





