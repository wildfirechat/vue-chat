# vue-chat

## 野火IM解决方案

野火IM是一套跨平台开源的即时通讯解决方案，主要包含以下内容。

| [GitHub仓库地址(主站)](https://github.com/wildfirechat)            | [码云仓库地址(镜像)](https://gitee.com/wfchat)                | 说明                                                             | 备注                      |
|--------------------------------------------------------------|-------------------------------------------------------|----------------------------------------------------------------|-------------------------|
| [im-server](https://github.com/wildfirechat/im-server)       | [im-server](https://gitee.com/wfchat/im-server)       | IM Server                                                      |                         |
| [android-chat](https://github.com/wildfirechat/android-chat) | [android-chat](https://gitee.com/wfchat/android-chat) | 野火IM Android SDK源码和App源码                                       | 可以很方便地进行二次开发，或集成到现有应用当中 |
| [ios-chat](https://github.com/wildfirechat/ios-chat)         | [ios-chat](https://gitee.com/wfchat/ios-chat)         | 野火IM iOS SDK源码和App源码                                           | 可以很方便地进行二次开发，或集成到现有应用当中 |
| [pc-chat](https://github.com/wildfirechat/vue-pc-chat)       | [pc-chat](https://gitee.com/wfchat/vue-pc-chat)       | 基于[Electron](https://electronjs.org/)开发的PC 端                   |                         |
| [web-chat](https://github.com/wildfirechat/vue-chat)         | [web-chat](https://gitee.com/wfchat/vue-chat)         | 野火IM Web 端, [体验地址](http://web.wildfirechat.cn)                 |                         |
| [wx-chat](https://github.com/wildfirechat/wx-chat)           | [wx-chat](https://gitee.com/wfchat/wx-chat)           | 小程序平台的Demo(支持微信、百度、阿里、字节、QQ 等小程序平台)                            |                         |
| [app server](https://github.com/wildfirechat/app_server)     | [app server](https://gitee.com/wfchat/app_server)     | 应用服务端                                                          |                         |
| [robot_server](https://github.com/wildfirechat/robot_server) | [robot_server](https://gitee.com/wfchat/robot_server) | 机器人服务端                                                         |                         |
| [push_server](https://github.com/wildfirechat/push_server)   | [push_server](https://gitee.com/wfchat/push_server)   | 推送服务器                                                          |                         |
| [docs](https://github.com/wildfirechat/docs)                 | [docs](https://gitee.com/wfchat/docs)                 | 野火IM相关文档，包含设计、概念、开发、使用说明，[在线查看](https://docs.wildfirechat.cn/) |                         |

## 前置说明

1. 本项目所使用的`Web SDK`是需要付费的，且依赖于`专业版 IM-Server`，价格请参考[费用详情](https://docs.wildfirechat.cn/price/)
2. `Web SDK`和`专业版 IM-Server`都支持试用，具体请参考[试用说明](https://docs.wildfirechat.cn/trial/)
3. 本项目默认只能连接到官方服务，购买或申请试用之后，替换`Web SDK`，即可连到自行部署的服务

## 常见开发问题
1. 音视频相关问题，请参考以下文档
    1. [av readme](src/wfc/av/internal/README.MD)
    2. [音视频常见问题](https://docs.wildfirechat.cn/faq/webrtc.html?h=webrtc)

2. 纯内网环境，不能显示表情
    1. 将```src/assets/twemoji```目录上传到一个内网能访问的服务器，比如部署```app server```的服务器
    2. 确保通过```http(s)://base_twemoji_url/72x72/1f1e6.png```能访问到对应表情，此处```1f1e6.png```蓝底白字大写字母A
    3. 修改```config.js```，将```https://static.wildfirechat.net/twemoji/assets/``` 替换成新部署的```http(s)://base_twemoji_url/```，需要注意，最后一个```/```不能省略
    4. 动态表情类似处理

3. 想自己部署表情图片

    请常见问题2
4. 通过`iframe`加载

   需要通过 https 加载、并允许摄像头和麦克风权限，才能正常进行音视频通话，参考如下：
   > `<iframe src="https://example.com" allow="camera;microphone"></iframe>`




### 联系我们

> 商务合作请优先采用邮箱和我们联系。技术问题请到[野火IM论坛](http://bbs.wildfirechat.cn/) 发帖交流。

1. heavyrain.lee 邮箱: heavyrain.lee@wildfirechat.cn 微信：wildfirechat
2. imndx 邮箱: imndx@wildfirechat.cn 微信：wfchat

### 问题交流

1. 如果大家发现bug，请在GitHub提issue
2. 其他问题，请到[野火IM论坛](http://bbs.wildfirechat.cn/)进行交流学习
3. 微信公众号

<img src="http://static.wildfirechat.cn/wx_wfc_qrcode.jpg" width = 50% height = 50% />

## 体验

1. PC Web 端

   [在线体验野火IM Web版](http://web.wildfirechat.cn)

2. 手机Web/H5 端

   请使用微信扫描下方二维码，体验野火IM 手机Web/H5 端

   ![野火IM](https://static.wildfirechat.cn/mobile-web.png?imageView2/1/w/260/h/260)
 
## 分支说明

1. `master`：基于`Vue 3`开发，是未来的开发重心
2. `vue2`：基于`Vue 2`开发，进入维护模式，不再开发新功能，鉴于`Vue 2`已经终止支持且不再维护，建议客户升级到`Vue 3`版本

## 开发、打包依赖

1. nodejs v18.19.0
2. npm 10.2.3

> 注意避免使用`cnpm`，我们使用`cnpm`出现过一些奇怪问题的情况。如果您使用`cnpm`当遇到问题时请切换到`npm`试一下。

## 开发

```
npm install
npm run serve
浏览器访问: http://localhost:8013

// 如果需要 https 访问的话(要求 app-server 和 im-server 都配置了 https)，请执行：
npm run serve-https 

```

## 打包

```
$ npm install
$ npm run build
```

## 部署
1. 执行上面的打包步骤
2. 将打包生成的```dist```目录下的所有文件上传到服务器
3. 下面是采用nginx部署的示例配置
   ```nginx
   server {
       listen 80;
       server_name im.xxx.yyy;

       location / {
           root /path/to/dist;
           index index.html;
       }
   }
   ```
4. 如果需要支持 https，请参考[nginx配置https](https://docs.wildfirechat.cn/faq/web/https.html)。

## 压缩/混淆配置说明

1. ```wfc```目录整体不能压缩
2. ```config.js```不能压缩

## 音视频
由于浏览器限制，页面需要通过 https://im.xxx.yyy 或通过 http://localhost 访问时，才支持音视频通话

默认附带免费版本音视频，关于野火音视频可以参考[野火音视频使用说明](https://docs.wildfirechat.cn/webrtc/)和[野火音视频简介](https://docs.wildfirechat.cn/blogs/野火音视频简介.html)。如果使用音视频高级版，请参考[音视频高级版切换方法](./src/wfc/av/internal/README.MD)。


## 截图

![](http://static.wildfirechat.cn/web-home.png)
![](http://static.wildfirechat.cn/web-conversation.png)
![](http://static.wildfirechat.cn/web-contact.png)
![](http://static.wildfirechat.cn/web-channel.png)
![](http://static.wildfirechat.cn/web-emoji.png)
![](http://static.wildfirechat.cn/web-forward.png)
![](http://static.wildfirechat.cn/web-setting.png)
![](http://static.wildfirechat.cn/web-multi-video-call.png)
![](http://static.wildfirechat.cn/web-multi-audio-call.png)

## License

1. Under the Creative Commons Attribution-NoDerivs 3.0 Unported license. See the [LICENSE](https://github.com/wildfirechat/web-chat/blob/master/LICENSE) file for details.
