# 音视频通话功能说明

PC端音视频通话功能，分为两个版本：普通版和高级版，两个版本之间不互通。

## 前置条件说明

1. 浏览器支持webrtc
2. 电脑有麦克风，且工作正常
3. 电脑有扬声器，且工作正常
 
刷新浏览器时，会有如下日志输出，```console.log(`detectRTC, isWebRTCSupported: ${DetectRTC.isWebRTCSupported}, hasWebcam: ${DetectRTC.hasWebcam}, hasSpeakers: ${DetectRTC.hasSpeakers}, hasMicrophone: ${DetectRTC.hasMicrophone}`, this.isSupportVoip);```
， 只有所有输出都为true时，音视频功能才能正常工作。

## 功能库说明

1. ```engine-conference.min.js``` 高级版，最高支持9路视频通话
2. ```engine-multi.min.js``` 普通版，最高支持4路视频通话
3. ```engine.min.js```默认和```engine-multi.min.js```一致

## 开发说明

1. 项目默认使用普通版音视频SDK，即```engine-multi.min.js```
2. 根据具体情况，用```engine-conference.min.js(高级版)``` 或 ```engine-multi.min.js(普通版)``` 替换 ```engine.min.js```
    > 其实就是将`engine.min.js`的文件内容替换为`engine-conference.min.js`或`engine-multi.min.js`的文件内容
3. PC端普通版音视频功能库能和移动端的单人音视频功能库互通
