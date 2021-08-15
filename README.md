# vue-chat
## 野火IM解决方案

野火IM是一套跨平台开源的即时通讯解决方案，主要包含以下内容。

| 仓库                                                         | 说明                                                    | 备注 |
| ------------------------------------------------------------ | ------------------------------------------------------- | ---- |
| [android-chat](https://github.com/wildfirechat/android-chat) | 野火IM Android SDK源码和App源码                       |可以很方便地进行二次开发，或集成到现有应用当中      |
| [ios-chat](https://github.com/wildfirechat/ios-chat)         | 野火IM iOS SDK源码和App源码                            |可以很方便地进行二次开发，或集成到现有应用当中      |
| [pc-chat](https://github.com/wildfirechat/pc-chat)           | 基于[Electron](https://electronjs.org/)开发的PC平台应用 |      |
| [web-chat](https://github.com/wildfirechat/web-chat)          | Web平台的Demo, [体验地址](http://web.wildfirechat.net)   |      |
| [wx-chat](https://github.com/wildfirechat/wx-chat)           | 微信小程序平台的Demo   |      |
| [server](https://github.com/wildfirechat/server)             | IM server                                               |      |
| [app server](https://github.com/wildfirechat/app_server)     | 应用服务端                                          |      |
| [robot_server](https://github.com/wildfirechat/robot_server) | 机器人服务端                                        |      |
| [push_server](https://github.com/wildfirechat/push_server)   | 推送服务器                                              |      |
| [docs](https://github.com/wildfirechat/docs)                 | 野火IM相关文档，包含设计、概念、开发、使用说明          |      | |

## web-chat说明

本工程是野火IM Web平台Demo，详情可以阅读[docs](http://docs.wildfirechat.cn).

开发一套IM系统真的很艰辛，请路过的朋友们给点个star，支持我们坚持下去🙏🙏🙏🙏🙏

### 联系我们

> 商务合作请优先采用邮箱和我们联系。技术问题请到[野火IM论坛](http://bbs.wildfirechat.cn/) 发帖交流。

1. heavyrain.lee  邮箱: heavyrain.lee@wildfirechat.cn  微信：wildfirechat
2. imndx  邮箱: imndx@wildfirechat.cn  微信：wfchat


### 问题交流

1. 如果大家发现bug，请在GitHub提issue
2. 其他问题，请到[野火IM论坛](http://bbs.wildfirechat.cn/)进行交流学习
3. 微信公众号

<img src="http://static.wildfirechat.cn/wx_wfc_qrcode.jpg" width = 50% height = 50% />


## 体验

[在线体验野火IM Web版](http://web.wildfirechat.cn)，请使用野火IM Andorid或iOS Demo扫码登录

## 截图
![](https://static.wildfirechat.net/web-contact.png)
![](https://static.wildfirechat.net/web-group-conversation-info.png)
![](https://static.wildfirechat.net/web-home.png)
![](https://static.wildfirechat.net/web-picker-user.png)
![](https://static.wildfirechat.net/web-quote.png)
![](https://static.wildfirechat.net/web-sticker.png)
## 开发、打包依赖
1. nodejs v10.16.3
2. npm 6.9.0

## 开发
```
$ npm install
$ npm run serve
浏览器访问: http://localhost:5000

```

## 打包

```
$ npm install
$ npm run build
```

## 压缩/混淆配置说明
1. ```wfc```目录整体不能压缩
2. ```config.js```不能压缩

## License

1. Under the Creative Commons Attribution-NoDerivs 3.0 Unported license. See the [LICENSE](https://github.com/wildfirechat/web-chat/blob/master/LICENSE) file for details.

