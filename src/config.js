import {isElectron} from './platform'
import wfc from "./wfc/client/wfc";

export default class Config {
    // 调试用
    static ENABLE_AUTO_LOGIN = true;
    // 是否支持多人音视频通话
    static ENABLE_MULTI_VOIP_CALL = true;
    // 是否支持1对1音视频通话
    static ENABLE_SINGLE_VOIP_CALL = true;
    // 打开voip调试模式时，voip window不会自动关闭，方便分析控制台日志，需要手动关闭。
    static ENABLE_VOIP_DEBUG_MODE = false;

    static DEFAULT_PORTRAIT_URL = 'data:image/png;base64,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';
    static DEFAULT_GROUP_PORTRAIT_URL = 'data:image/png;base64,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'
    static DEFAULT_ORGANIZATION_PORTRAIT_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAABlUlEQVR4nO2aIW7DQBBFc409UJRD9AoFJr1DeUADSrogoDws8EslloKCLeUEOcDWEzWtii133d2xH/h0ZD/9Pzs72lVSMBRGM1gBL/zJQAAUAK1kinCgAGg4UH4nASIsABoOVPkoEmEtBGDcN5PodFgvA+Dm+WMSfUFcDMDm/WK79jObANgC0HAgETZ6oDhEjENEnMKMMWIONAbplkHauIlwlTPuwprhMuFhd74vFHJpccuEDeus6UHHfXMHXcJVVTswARCACQcGIpwqaDP0QAHQcKAYY4wxpkLFJQ3Sp8M6+1ONp5fX3ztublUHMP64xYuqBZgyfpiXmgAUAA0Higibh35FDxQADQc6jltkjAkATDjQb9wiEQ6+AY5dGqQZ1MwKcHu8DNLj23nwz9ZeMyvA7toP0vb4/W5lDjUBeAWg4UARYRf9KtIDewB2ONBv3CIR7gHY4UC/cYtEuAdghwP/Z00UndTMskwY+worzaBmFoAoADBlNgIOFACtZGvBgQKg4UD5PeGJsABoOFDlo0iEVQbgDWanvolAkB8PAAAAAElFTkSuQmCC';
    static DEFAULT_DEPARTMENT_PORTRAIT_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAAXNSR0IArs4c6QAAAIRlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAFCgAwAEAAAAAQAAAFAAAAAAwtohTAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KGV7hBwAAAjlJREFUeAHt28FOwkAQgOGt8UF4Cg0nOJjo1bfgEfRkPekj8BZeOGjigRuRcNeTJ30NsW0g2UzatTNTpE3+JiS7dGba/dgAW0oIbAgggAACCCCAAAIIIIAAAgMTyI59vlcPq2lxDuVDtT3fjnNVwoGCTw9UV1N2us3CnSZhF5sbcjpP6QNgNajri7NWg/v4/A7vxaMv20lfTmSo5wGg85UDEECngDOdGQigU8CZzgwE0CngTGcGAugUcKYzAwF0CjjTmYEAOgWc6b25nPX0unYO5TjpfQBcZtvawY9+QhgV7zHL2r08mRYoLvXnl4+retp06r/u5UPEyQ0ggE4BZzozEECngDOdGQigU8CZ3smtHdbbM1LnXnyJnmZZmBRfsu9TcZZ9Xd4W0tVKxHp7RuP496+s8baPxrq7HflfAW33dwVYHe/lZrwfd9vjN8aVK5ES7xA1Gw9q2MGHiAEtTgEw1jC0ATSgxSkAxhqGNoAGtDgFwFjD0AbQgBanABhrGNoAGtDiFNXKIbHmTf4AlFp7DqVmjBa3tUu5xjVv+UoUvwBN4uJRO4/asjmUmvK8q74WsEqaz85ri8knF5uvsNi0+0vCUGrKMfIeKEWUfQCVYDIcQCmi7AOoBJPhAEoRZR9AJZgMB1CKKPsAKsFkOIBSRNkHUAkmwwGUIso+gEowGQ6gFFH2AVSCyXDT5azZ/E3WcfeHUlMOVAvY9JcEWVfTH0pNzZiIRQABBBBAAAEEEEAAAQQQ6K/ALz1vZTdxNVa5AAAAAElFTkSuQmCC';
    static DEFAULT_MESH_PORTRAIT_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAk1BMVEUzmvD////4+/77/f+32/rl8v1ptfS53frV6/xisfRarvM5nfHp9f1AofH0+v7t9v7d7v3D4fuQyPdJpfLx+P7J5fuZzfh/wPZFo/E8nvGl0/hxufVst/Q3nPCh0fh6vfV2u/XN5vux2fmUyvdQqfKu1/mdz/hVq/PQ6Pzh8P3a7fyp1fmLxveIxPaEwvZNp/K93vpatp9RAAADjklEQVRYw+2Y23qqMBCFExEQ5CDKGRUVxXr2/Z+uzCRo4Gsl2l6yLraQb/MnmVkzhJJevXr1+pNuWaFPx/+CSswoDVwKsqI/smbZdDhRqKCR8TFstRkN6A8azj7kKfQXDcrkA54prM5fn66GXl0cRxTlXt/mxRZFWXqR4RYXfnV3JREfP2rv8cYjyoF1wLLqRrEJSaYORQX7d4A6wjCryXPEY5nfsOgqp1iaFzLUnT4oCYQ0r+Mb8Nhqsgnmm01w4ykM5ZDd5BGRISN6byR4YEBqVHjsUl15YEDCtF+6lEmZySc4Z8868FhGbJgjgxH7OqJPTaUTHPK7OSTAMa8QsTEh2rBZPBPZBOuP2wvcqjDJZltaj2LRPYoyJRMstKm0hiANdTzbhG/81MXLMdaR9tT8QBvyT7CqWOFFuHjNMwb0pRQvZ4uPAAbQ7DVw+BKnhjPxP24gjvfPga5YF9AqViusbwmgozZUZ2MphAZR2IEuMsB9K/FcaWNoTcgJHCGz5UkiOh0KLRiIa0TTFISYMLiXiaEujEVYtNpAWGOscE9Pqt+yC4gOOz/HjmyCubBGmMOCiwIuuoBLC6gG4ZoDB+4YMX2YBpstzK51AKeGAvNiO+aN64uh+Rq5aSDZAb5Xu4DkTCGJrKj2FB8Widw0gEOlnUD84eHaQYUQ0iCiaRCHMruByaReVzzgGRKJ8I/z7D2kG0i2Dvd3CL82EYltTWWAZMX8PXbbMcrFfg3xUGIpIFmiv9HUt8dRLNQnAi7iL+suYIkdb7HGqmamto3zbtR6m+SEvbpyiVp2j94uLBTK5HkqbYn7+gpTjjuAncKFsvqATezIS5Uv+/9EL+azJb9TkxsrypdaBD+z/CCNTNyc7UApYoGE6PkO2ZjG9aXcBId6c2UmnDgK2HV8hwW7eCDo0s0FRoSdlRO/kla3PZHYp0xbyaOSomHj4grGjYOEUlEiPpf0Yc6vHkrhCRWds6hjrNbtigX72o3jYaIHG/v75WZhyXBiXncXe4gWsomUNpiYLYvR1hWa6JHV2uLit149MuZRYZ3QYpGIHT9jztN4RR+ETthpHuFwZfo1Efw32urcm/KfkmgeVMYS77BOb1AA8m+AXSwLE49h6r3MqwoxkFh6OPb+V0q7kSqH+5o2dMjI+yrob3KmC/KJwh+/bjF4H2umnXdfTexaxiryWCsi/6btCv+I0atXr16f6Rsd6DUwrgFLOAAAAABJRU5ErkJggg=='
    // 默认缩略图，200 x200，#d3d3d3
    static DEFAULT_THUMBNAIL_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAABSlJREFUeF7t1bERwzAMBEGx//JYkN2A5eDSX+UIsOCNzr338/gIEPgpcATiZRB4FxCI10Hgj4BAPA8CAvEGCDQBf5DmZmpEQCAjh7ZmExBIczM1IiCQkUNbswkIpLmZGhEQyMihrdkEBNLcTI0ICGTk0NZsAgJpbqZGBAQycmhrNgGBNDdTIwICGTm0NZuAQJqbqREBgYwc2ppNQCDNzdSIgEBGDm3NJiCQ5mZqREAgI4e2ZhMQSHMzNSIgkJFDW7MJCKS5mRoREMjIoa3ZBATS3EyNCAhk5NDWbAICaW6mRgQEMnJoazYBgTQ3UyMCAhk5tDWbgECam6kRAYGMHNqaTUAgzc3UiIBARg5tzSYgkOZmakRAICOHtmYTEEhzMzUiIJCRQ1uzCQikuZkaERDIyKGt2QQE0txMjQgIZOTQ1mwCAmlupkYEBDJyaGs2AYE0N1MjAgIZObQ1m4BAmpupEQGBjBzamk1AIM3N1IiAQEYObc0mIJDmZmpEQCAjh7ZmExBIczM1IiCQkUNbswkIpLmZGhEQyMihrdkEBNLcTI0ICGTk0NZsAgJpbqZGBAQycmhrNgGBNDdTIwICGTm0NZuAQJqbqREBgYwc2ppNQCDNzdSIgEBGDm3NJiCQ5mZqREAgI4e2ZhMQSHMzNSIgkJFDW7MJCKS5mRoREMjIoa3ZBATS3EyNCAhk5NDWbAICaW6mRgQEMnJoazYBgTQ3UyMCAhk5tDWbgECam6kRAYGMHNqaTUAgzc3UiIBARg5tzSYgkOZmakRAICOHtmYTEEhzMzUiIJCRQ1uzCQikuZkaERDIyKGt2QQE0txMjQgIZOTQ1mwCAmlupkYEBDJyaGs2AYE0N1MjAgIZObQ1m4BAmpupEQGBjBzamk1AIM3N1IiAQEYObc0mIJDmZmpEQCAjh7ZmExBIczM1IiCQkUNbswkIpLmZGhEQyMihrdkEBNLcTI0ICGTk0NZsAgJpbqZGBAQycmhrNgGBNDdTIwICGTm0NZuAQJqbqREBgYwc2ppNQCDNzdSIgEBGDm3NJiCQ5mZqREAgI4e2ZhMQSHMzNSIgkJFDW7MJCKS5mRoREMjIoa3ZBATS3EyNCAhk5NDWbAICaW6mRgQEMnJoazYBgTQ3UyMCAhk5tDWbgECam6kRAYGMHNqaTUAgzc3UiIBARg5tzSYgkOZmakRAICOHtmYTEEhzMzUiIJCRQ1uzCQikuZkaERDIyKGt2QQE0txMjQgIZOTQ1mwCAmlupkYEBDJyaGs2AYE0N1MjAgIZObQ1m4BAmpupEQGBjBzamk1AIM3N1IiAQEYObc0mIJDmZmpEQCAjh7ZmExBIczM1IiCQkUNbswkIpLmZGhEQyMihrdkEBNLcTI0ICGTk0NZsAgJpbqZGBAQycmhrNgGBNDdTIwICGTm0NZuAQJqbqREBgYwc2ppNQCDNzdSIgEBGDm3NJiCQ5mZqREAgI4e2ZhMQSHMzNSIgkJFDW7MJCKS5mRoREMjIoa3ZBATS3EyNCAhk5NDWbAICaW6mRgQEMnJoazYBgTQ3UyMCAhk5tDWbgECam6kRAYGMHNqaTUAgzc3UiIBARg5tzSYgkOZmakRAICOHtmYTEEhzMzUiIJCRQ1uzCQikuZkaERDIyKGt2QQE0txMjQgIZOTQ1mwCAmlupkYEBDJyaGs2AYE0N1MjAgIZObQ1m4BAmpupEQGBjBzamk1AIM3N1IiAQEYObc0mIJDmZmpEQCAjh7ZmExBIczM1IvAFWDC2pw/rRZEAAAAASUVORK5CYII='


    // 如果需要支持音视频通话功能，必须全站使用https(包括app server和im server) + wss，
    // WebSockets over SSL/TLS，启用https时，一定要配置为true；不启用https，一定要为false
    // 置为true时，请确保 IM SERVER 支持https访问。IM SERVER本身不能处理https请求，一般是通过在IM SERVER前面加上nginx之类的负载均衡器来实现https支持
    static USE_WSS = true;

    // ROUTE请求端口，默认是80；配置https时，请修改为其他端口，如443等
    static ROUTE_PORT = 443;

    // 是否关闭日志，web和小程序有效
    static DISABLE_LOG = false;

    // 是否开启自动登录，开启之后，登录成功之后，会记录登录状态；刷新页面时，会自动登录
    static ENABLE_AUTO_LOGIN = true;

    // APP SERVER的地址，启用https时，APP SERVER也需要支持https
    // 默认的app server使用端口是8888
    static APP_SERVER = 'https://app.wildfirechat.net';

    // 语音转文字服务地址，如果没有部署语音转文字服务，或者不需要语音转文字的话，可置为 null
    static ASR_SERVER = 'https://app.wildfirechat.net/asr/api/recognize';

    // 组织结构服务地址，如果没有部署组织结构服务，或者不需要组织结构的话，可置为 null
    // 组织结构项目：https://github.com/wildfirechat/organization-platform 或 https://gitee.com/wfchat/organization-platform
    static ORGANIZATION_SERVER = 'https://org.wildfirechat.cn';
    // 野火二维码 scheme，不要修改，如果需要修改的话，所有端都需要一起修改
    static QR_CODE_PREFIX_PC_SESSION = "wildfirechat://pcsession/";

    // turn server 配置，可以添加多个<br>
    // 格式: [uri, 用户名, 密码]，可以添加多个<br>
    // Turn服务配置，用户音视频通话功能，详情参考 https://docs.wildfirechat.net/webrtc/ <br>
    // 我们提供的服务能力有限，总体带宽仅3Mbps，只能用于用户测试和体验，为了保证测试可用，我们会不定期的更改密码。<br>
    // 上线时请一定要切换成你们自己的服务。可以购买腾讯云或者阿里云的轻量服务器，价格很便宜，可以避免影响到您的用户体验。<br>
    // 如果所有客户端都是在局域网内使用，可以不配置turn服务，置为null
    static ICE_SERVERS = [['turn:turn.wildfirechat.net:3478', 'wfchat', 'wfchat123']];
    static LANGUAGE = 'zh_CN';

    static MESSAGE_ROAMING = 1;

    // AI 入口地址，如果不需要 AI 功能，置为 null 即可
    static AI_PORTAL_URL = 'https://static.wildfirechat.cn/chatbox-web/index.html'

    /**
     * web/wx 端有效
     * 配置是否开启漫游消息通知，即连接过程中，收到的漫游消息，也对上层进行消息通知
     * 如果开启的话，需要注意一下问题：
     * 1. 此时消息回执状态不对
     * 2. 这时候，不应当刷新 UI，需等待连接状态切换为connected之后，再进行刷新
     */
    static ENABLE_ROAMING_MESSAGE_RECEIVING_NOTIFICATION = false;

    /**
     * web/wx 端有效
     * 配置是否开启透传漫游消息通知
     */
    static ENABLE_ROAMING_TRANSPARENT_MESSAGE_RECEIVING_NOTIFICATION = false;

    /**
     * web/wx 端有效
     * 配置收到透传消息时，是否生成对应的会话
     */
    static ENABLE_GENERATE_CONVERSATION_FOR_TRANSPARENT_MESSAGE = false;


    // 配置clientId的生成策略，可选0，1，2；默认0
    // 0 clientId存储于内存，每次刷新网页，都会随机生成新的clientId
    // 1 clientId存储于sessionStorage，每个session对应一个clientId，刷新网页时，clientId不会变化；但打开新的tab页面，或者重启浏览器等，会重新生成
    // 2 clientId存储于localStorage，和域名绑定，每个域名，对应一个clientId，重启浏览器等，不会变化，会导致同一个浏览器，不能同时登录多个不同的账号
    // token是和clientId绑定的，当选策略1和2的时候，应用层可选择将上次成功连接的userId和token持久化，当用户进行刷新网页等操作时，可以直接用持久化的userId和token进行连接；而不用重新进行扫码登录
    // 选2时，支持web端快速登录
    static CLIENT_ID_STRATEGY = 1;

    static SDK_PLATFORM_WINDOWS = 3;
    static SDK_PLATFORM_OSX = 4;
    static SDK_PLATFORM_WEB = 5;
    static SDK_PLATFORM_WX = 6;

    // 向服务端发送ping的间隔，单位是秒。没有特殊需求，不建议修改
    static KEEP_ALIVE_INTERNAL = 180;

    /**
     * 配合{@link wfc.onForeground}使用，切换到前台时，如果多少时间没有活动，将进行重连，单位是秒
     * 需要大于{@link KEEP_ALIVE_INTERNAL}
     * 没有特殊需求，不建议修改
     */
    static KEEP_ALIVE_TIMEOUT = 200;

    // html5 audio 标签不能播放amr格式的音频，需要将amr格式转换为mp3格式
    // 本服务传入amr音频文件的地址，将音频文件转换为mp3格式，并以application/octet-stream的格式返回
    // 如果语音消息很多，建议使用cdn
    static AMR_TO_MP3_SERVER_ADDRESS = Config.APP_SERVER + '/amr2mp3?path=';

    // 发送消息超时时间，超时之后，认为当前连接已不可用，将进行重连，单位是秒。没有特殊需求不，不建议修改
    static SEND_MESSAGE_TIMEOUT = 20;

    // 会话过期时间，表示一个会话，自己不再参与之后，多久会过期。会话列表不展示已过期的会话；单位是天
    static CONVERSATION_EXPIRE_TIME = 30;
    // 文件传输助手ID，如果不需要的话，将其置空即可
    static FILE_HELPER_ID = 'wfc_file_transfer';
    // 是否将用户信息、群组信息、频道信息、聊天室信息持久化
    static ENABLE_INFO_PERSISTENCE = false;

    // 登录时，最多预加载多少个会话的未读消息
    static MAX_TO_LOAD_UNREAD_MESSAGE_CONVERSATION_COUNT = 50;

    // 登录时，每个会话最多加载多少条未读消息
    static MAX_TO_LOAD_UNREAD_COUNT_PER_CONVERSATION = 99;

    /**
     * 允许重新编辑多长时间内的撤回消息，单位是秒
     */
    static RECALL_REEDIT_TIME_LIMIT = 60;

    // 允许主动加入多人音视频通话
    static ENABLE_MULTI_CALL_AUTO_JOIN = false;

    // 需要专业版 im-server 才支持，是否打开语音对讲功能，和对讲机类似的功能，不是发送语音消息
    static ENABLE_PTT = true;

    // 是否支持图文混排、文件文本混排，目前之后 pc 端支持，故默认关闭
    static ENABLE_MIX_MEDIA_MESSAGE = false;

    // 发送日志命令，当发送此文本消息时，会把协议栈日志发送到当前会话中，为空时关闭此功能。
    static SEND_LOG_COMMAND = '*#marslog#';

    // 是否支持水印
    static ENABLE_WATER_MARK = true

    // 单人音视频通话页面是否显示音视频 SDK 相关提示
    static SHOW_VOIP_TIP = true
    static getWFCPlatform() {
        if (isElectron()) {
            if (window.process && window.process.platform === 'darwin') {
                // osx
                return 4;
            } else if (window.process && window.process.platform === 'linux') {
                return 7;
            } else {
                // windows
                return 3;
            }

        } else {
            // web
            return 5;
        }
    }

    static config(options) {
        Object.keys(options).forEach(key => {
            Config[key] = options[key];
        });
    }

    /**
     * 网络地址重定向
     *
     * 仅当双网环境时，需要特殊处理，默认原样返回
     *
     * @param {string} url
     * @return {string} newUrl
     */
    static urlRedirect(url) {
        if (!url) {
            return url;
        }
        // 示例代码
        // 双网环境时，将媒体文件地址切到备选网络
        if (Config.isUseBackupAddress()) {
            url = url.replace('oss.xxxx.com', '192.168.2.19');
        }
        return url;
    }

    /**
     * 双网环境时，判断是否是备选网络
     * @return {boolean}
     */
    static isUseBackupAddress() {
        //示例代码
        let host = wfc.getHost();
        if (host === '192.168.2.169'/* backupHost */) {
            return true;
        }
        return false;
    }

    /**
     * 表情 base 路径
     * @return {string}
     */
    static emojiBaseUrl() {
        // 表情的 baseUrl，一定要求以 / 结尾
        let emojiBaseUrl = 'https://static.wildfirechat.net/twemoji/assets/';
        // 实例代码
        // 双网环境时，将表情地址切换到备选网络
        // if (Config.isUseBackupAddress()) {
        //     emojiBaseUrl = 'https://192.168.2.169/twemoji/assets/';
        // }
        return emojiBaseUrl;
    }

    /**
     * 动态表情 base 路径
     * @return {string}
     */
    static stickerBaseUrl() {
        // 动态表情的 baseUrl，一定要求以 / 结尾
        let stickerBaseUrl = 'https://static.wildfirechat.net/sticker/';
        // 实例代码
        // 双网环境时，将动态表情地址切换到备选网络
        // if (Config.isUseBackupAddress()) {
        //     stickerBaseUrl = 'https://192.168.2.169/sticker/';
        // }
        return stickerBaseUrl;
    }

    static validate() {
        if (Config.APP_SERVER === 'https://app.wildfirechat.net') {
            console.warn("APP SERVER 配置为野火官方，如果需要连接自行部署的IM Server，请修改为说部署的app server")
        }

        console.log(`当前配置信息:
                    app server: ${Config.APP_SERVER}
                    use wss: ${Config.USE_WSS}
                    route port: ${Config.ROUTE_PORT}`)

        if (!Config.APP_SERVER.startsWith("http")) {
            throw new Error('配置错误, Config.APP_SERVER 必须是完整的http地址');
        }

        if (Config.USE_WSS) {
            console.warn('已启用WSS，请确认服务端已配置支持https，配置方法请参考：https://docs.wildfirechat.cn/faq/web/https.html');
        }
        if (Config.APP_SERVER.startsWith('https:') && !Config.USE_WSS) {
            throw new Error('https 站点，不能使用 ws，请配置wss, 配置方法请参考：https://docs.wildfirechat.cn/faq/web/https.html');
        }
        if (Config.USE_WSS && Config.ROUTE_PORT !== 443) {
            console.warn(`配置使用WSS连接时，默认端口是443，但目前配置是${Config.ROUTE_PORT}，请确认!!`);
        }

        if (!Config.USE_WSS && Config.ROUTE_PORT !== 80) {
            console.warn(`配置使用WS连接时，默认端口是80，但目前配置是${Config.ROUTE_PORT}，请确认!!`);
        }
    }
}

Config.validate();
