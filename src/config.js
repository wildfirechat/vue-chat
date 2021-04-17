import {isElectron} from './platform'

export default class Config {
    // 调试用
    static ENABLE_AUTO_LOGIN = true;
    // 是否支持多人音视频通话
    static ENABLE_MULTI_VOIP_CALL = true;
    // 是否支持1对1音视频通话
    static ENABLE_SINGLE_VOIP_CALL = true;
    // 打开voip调试模式时，voip window不会自动关闭，方便分析控制台日志，需要手动关闭。
    static ENABLE_VOIP_DEBUG_MODE = false;

    static DEFAULT_PORTRAIT_URL = 'https://static.wildfirechat.net/user-fallback.png';
    // 如果需要支持音视频通话功能，必须全站使用https(包括app server和im server) + wss，
    // WebSockets over SSL/TLS，启用https时，一定要配置为true；不启用https，一定要为false
    // 置为true时，请确保 IM SERVER 支持https访问。IM SERVER本身不能处理https请求，一般是通过在IM SERVER前面加上nginx之类的负载均衡器来实现https支持
    static USE_WSS = true;
    // WebSocket连接端口，需要和服务端对应，不能随意修改
    static WS_PORT = 8083;
    // Secure WebSocket连接端口，需要和服务端对应，不能随意修改
    static WSS_PORT = 8084;

    // ROUTE请求端口，默认是80；配置https时，请修改为其他端口，如443等
    static ROUTE_PORT = 443;

    // 是否关闭日志，web和小程序有效
    static DISABLE_LOG = false;

    // IM SERVER的HOST，是域名或者ip，没有http等前缀!
    static IM_SERVER_HOST = 'wildfirechat.net';

    // APP SERVER的地址，启用https时，APP SERVER也需要支持https
    // 默认的app server使用端口是8888
    static APP_SERVER = 'https://app.wildfirechat.net';
    static QR_CODE_PREFIX_PC_SESSION = "wildfirechat://pcsession/";
    // turn server 配置，可以添加多个
    static ICE_SERVERS = [{uri: 'turn:turn.wildfirechat.net:3478', userName: 'wfchat', password: 'wfchat'}];
    static LANGUAGE = 'zh_CN';

    // appId和appKey和专业版im server是绑定的，一定要做对应修改
    static WEB_APP_ID = 'web_12345678';
    static WEB_APP_KEY = '6f8348670cb11cf434451bc9e7ba72eeaf3452c8';

    static MESSAGE_ROAMING = 1;
    // 拉取最近2小时的消息
    static MESSAGE_ROAMING_HOUR_COUNT = 2;

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
    // 文件传输助手ID
    static FILE_HELPER_ID = 'wfc_file_transfer';

    static getWFCPlatform() {
        if (isElectron()) {
            if (window.process && window.process.platform === 'darwin') {
                // osx
                return 4;
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

    static validate() {
        let configError = true;
        if (Config.APP_SERVER === 'https://app.wildfirechat.net' && Config.IM_SERVER_HOST === 'wildfirechat.net' && Config.WEB_APP_KEY === '6f8348670cb11cf434451bc9e7ba72eeaf3452c8') {
            configError = false;
        } else if (Config.APP_SERVER !== 'https://app.wildfirechat.net' && Config.IM_SERVER_HOST !== 'wildfirechat.net' && Config.WEB_APP_KEY !== '6f8348670cb11cf434451bc9e7ba72eeaf3452c8') {
            configError = false;
        }
        if (configError) {
            throw new Error('配置错误, Config.APP_SERVER,Config.IM_SERVER_HOST,Config.WEB_APP_KEY 是配对的，必须一起修改')
        }
    }
}

Config.validate();
