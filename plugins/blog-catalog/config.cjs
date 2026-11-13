const categories = [
  {id:'system', title:{zh:'系统与硬件',en:'Systems & hardware'}, description:{zh:'开发板入门、系统搭建与硬件调试',en:'Board essentials, system setup and hardware debugging'}, featured:['welcome','armbian-remote-desktop','buildroot-imx415-camera']},
  {id:'ai', title:{zh:'AI 与视觉',en:'AI & vision'}, description:{zh:'从开发环境到模型推理与 NPU 加速',en:'Development tools, model inference and NPU acceleration'}, featured:['buildroot-rknn-setup','npu-yolov5-detection','opencv-cpu-gesture']},
  {id:'media', title:{zh:'音视频与显示',en:'Audio, video & display'}, description:{zh:'视频播放、音频处理与显示配置',en:'Video playback, audio processing and display configuration'}, featured:['gstreamer-16ch-hw-acceleration','weston-multi-screen','sox-rnnoise-denoise']},
  {id:'network', title:{zh:'网络与服务',en:'Networking & services'}, description:{zh:'OpenWrt 系统、网络存储与应用部署',en:'OpenWrt, network storage and application deployment'}, featured:['openwrt-board-env-setup','openwrt-custom-build','openwrt-docker']},
];
const series = [
  {id:'vision', title:{zh:'A1 视觉实战',en:'A1 vision in practice'}, description:{zh:'从摄像头调试、手势识别，到 NPU 目标检测。',en:'From camera setup and gesture recognition to NPU object detection.'}, posts:['buildroot-imx415-camera','gesture-env-screen','opencv-cpu-gesture','open-gesture-project-modify','npu-yolov5-detection']},
  {id:'openwrt', title:{zh:'OpenWrt 从入门到部署',en:'OpenWrt: from setup to deployment'}, description:{zh:'环境搭建、系统构建、功能优化、NAS 与 Docker。',en:'Environment setup, custom builds, optimization, NAS and Docker.'}, posts:['openwrt-board-env-setup','openwrt-custom-build','openwrt-feature-optimize','openwrt-nas','openwrt-docker']},
];
const postCategories = Object.fromEntries([
  ['system',['welcome','armbian-remote-desktop','buildroot-imx415-camera']],
  ['ai',['buildroot-rknn-setup','gesture-env-screen','opencv-cpu-gesture','open-gesture-project-modify','npu-yolov5-detection']],
  ['media',['gstreamer-16ch-hw-acceleration','gmrender-bilibili-cast','weston-multi-screen','sox-rnnoise-denoise','audio-record-noise-analysis']],
  ['network',series[1].posts],
].flatMap(([category,ids])=>ids.map(id=>[id,category])));
module.exports = {
  categories, series, postCategories,
  defaultCategory: 'system',
  legacyIds: [{sourceIncludes:'buildroot下搭建RKNN环境', id:'buildroot-rknn-setup'}],
  titleOverrides: {
    welcome: {zh:'DshanPi-A1 开发板介绍', en:'Introducing DshanPi-A1'},
    'buildroot-rknn-setup': {zh:'Buildroot 下搭建 RKNN 环境', en:'Setting up RKNN under Buildroot'},
  },
  descriptionOverrides: {
    'buildroot-rknn-setup': {zh:'搭建 PC 端工具与板端推理环境，准备 RKNN 模型部署。', en:'Prepare the PC tools and board runtime for RKNN model deployment.'},
  },
  titleReplacements: [
    {pattern:'^DshanPi-A1\\s*(RK3576\\s*)?(测评[一二三四五]：\\s*)?', flags:'i', value:''},
    {pattern:'玚法', value:'玩法'},
  ],
  tagCategories: [
    {category:'network', pattern:'openwrt|docker|nas'},
    {category:'ai', pattern:'rknn|npu|yolo|opencv|mediapipe|手势'},
    {category:'media', pattern:'gstreamer|weston|音频|视频|降噪|投屏|dlna'},
  ],
};
