import {isElectron} from './platform'

export default class Config {
    // 是否支持多人音视频通话
    static ENABLE_MULTI_VOIP_CALL = true;
    // 是否支持1对1音视频通话
    static ENABLE_SINGLE_VOIP_CALL = true;
    // 打开voip调试模式时，voip window不会自动关闭，方便分析控制台日志，需要手动关闭。
    static ENABLE_VOIP_DEBUG_MODE = false;

    static DEFAULT_PORTRAIT_URL = 'data:image/png;base64,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';
    // 如果需要支持音视频通话功能，必须全站使用https(包括app server和im server) + wss，
    // WebSockets over SSL/TLS，启用https时，一定要配置为true；不启用https，一定要为false
    // 置为true时，请确保 IM SERVER 支持https访问。IM SERVER本身不能处理https请求，一般是通过在IM SERVER前面加上nginx之类的负载均衡器来实现https支持
    static USE_WSS = true;

    // ROUTE请求端口，默认是80；配置https时，请修改为其他端口，如443等
    static ROUTE_PORT = 443;

    // 是否关闭日志，web和小程序有效
    static DISABLE_LOG = false;

    // APP SERVER的地址，启用https时，APP SERVER也需要支持https
    // 默认的app server使用端口是8888
    static APP_SERVER = 'https://app.wildfirechat.net';
    static QR_CODE_PREFIX_PC_SESSION = "wildfirechat://pcsession/";
    // turn server 配置，可以添加多个
    static ICE_SERVERS = [{uri: 'turn:turn.wildfirechat.net:3478', userName: 'wfchat', password: 'wfchat'}];
    static LANGUAGE = 'zh_CN';

    static MESSAGE_ROAMING = 1;

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
    // 是否将用户信息、群组信息、频道信息、聊天室信息持久化
    static ENABLE_INFO_PERSISTENCE = true;

    // 是否打开日志
    static ENABLE_LOG = true;

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

    /**
     * 网络地址重定向
     *
     * 仅当双网环境时，需要特殊处理，默认原样返回
     *
     * @param {string} url
     * @return {string} newUrl
     */
    static urlRedirect(url){
        if (!url){
            return url;
        }
        // 示例代码
        // url = url.replace('oss.xxxx.com', '192.168.2.19');
        return url;
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
            console.warn('已启用WSS，请确认服务端已配置支持https，配置方法请参考这儿：https://docs.wildfirechat.cn/faq/web/https.html');
        }
        if (Config.USE_WSS && Config.ROUTE_PORT !== 443) {
            console.warn(`配置使用WSS连接时，默认端口是${Config.ROUTE_PORT}，但目前配置是，请确认!!`);
        }

        if (!Config.USE_WSS && Config.ROUTE_PORT !== 80) {
            console.warn(`配置使用WS连接时，默认端口是${Config.ROUTE_PORT}，但目前配置是，请确认!!`);
        }
    }
}

Config.validate();
