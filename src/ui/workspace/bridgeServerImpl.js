/**
 * 开放平台 JS-SDK 服务端实现（Web 版本）
 *
 * 采用 postMessage 机制与 iframe 中的客户端通信
 * 兼容 vue-pc-chat 的 WebSocket 协议格式
 */


let mWfc = null;
let mHostPage = null;
let messageHandler = null;

/**
 * 初始化 bridgeServer
 * @param {Object} wfc - 野火客户端实例
 * @param {VueComponent} hostPage - WorkspacePage 组件实例
 */
export function init(wfc, hostPage) {
    if (messageHandler) {
        console.log('[BridgeServer] Already initialized');
        return;
    }

    mWfc = wfc;
    mHostPage = hostPage;

    // 绑定消息处理器
    messageHandler = handleMessage.bind(this);
    window.addEventListener('message', messageHandler);

    console.log('[BridgeServer] Initialized');
}

/**
 * 销毁 bridgeServer
 */
export function destroy() {
    if (messageHandler) {
        window.removeEventListener('message', messageHandler);
        messageHandler = null;
    }
    mWfc = null;
    mHostPage = null;
    console.log('[BridgeServer] Destroyed');
}

/**
 * 获取允许的 origin 列表
 */
function getAllowedOrigins() {
    // return Config.OPEN_PLATFORM_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS;
    return [];
}

/**
 * 验证 origin 是否在白名单中
 */
function isAllowedOrigin(origin) {
    const allowedOrigins = getAllowedOrigins();
    return allowedOrigins.includes(origin);
}

/**
 * 消息处理器
 */
function handleMessage(event) {
    // 1. 安全校验：验证 origin
    // if (!isAllowedOrigin(event.origin)) {
    //     // 非开放平台消息，忽略
    //     return;
    // }

    // 2. 验证消息格式
    const data = event.data;
    if (!data || typeof data !== 'object') {
        return;
    }

    // 只处理工作台协议消息
    if (data.type !== 'wf-op-request') {
        return;
    }

    const { requestId, handlerName, args, appUrl } = data;

    console.log('[BridgeServer] Received request:', handlerName, 'from', appUrl);

    // 3. 查找并执行 handler
    const handler = handlers[handlerName];
    if (!handler) {
        console.warn('[BridgeServer] Unknown handler:', handlerName);
        _response(handlerName, appUrl, requestId, -1, 'Unknown handler', event.source, event.origin);
        return;
    }

    // 4. 执行 handler
    try {
        handler(args, appUrl, requestId, event.source, event.origin);
    } catch (err) {
        console.error('[BridgeServer] Handler error:', err);
        _response(handlerName, appUrl, requestId, -1, err.message, event.source, event.origin);
    }
}

/**
 * Handler 实现
 */
const handlers = {
    /**
     * 显示提示
     */
    toast: (args, appUrl, requestId, source, origin) => {
        const text = typeof args === 'string' ? args : args?.text;
        if (mHostPage) {
            mHostPage.$notify({
                title: '提示',
                text: text,
                type: 'warn'
            });
        }
    },

    /**
     * 打开链接
     * external: true - 外部浏览器打开
     * external: false - 内部新标签页打开
     */
    openUrl: (args, appUrl, requestId, source, origin) => {
        console.log('[BridgeServer] openUrl', args);

        if (!args) return;

        const url = args.url;
        const external = args.external;
        const name = args.name || '新标签';

        if (!url) {
            console.warn('[BridgeServer] openUrl: missing url');
            return;
        }

        if (external) {
            // 外部打开：新浏览器标签页
            window.open(url, '_blank');
        } else {
            // 内部打开：新标签页
            if (mHostPage) {
                mHostPage.addTab(url, true, name);
            }
        }
    },

    /**
     * 获取授权码
     */
    getAuthCode: (args, appUrl, requestId, source, origin) => {
        console.log('[BridgeServer] getAuthCode:', args);
        if (!args || !mWfc) {
            _response('getAuthCode', appUrl, requestId, -1, 'Invalid params or WFC not initialized', source, origin);
            return;
        }

        const { appId, appType } = args;
        const host = new URL(appUrl).hostname;

        mWfc.getAuthCode(appId, appType, host,
            (authCode) => {
                console.log('[BridgeServer] getAuthCode success:', authCode);
                _response('getAuthCode', appUrl, requestId, 0, authCode, source, origin);
            },
            (err) => {
                console.log('[BridgeServer] getAuthCode error:', err);
                _response('getAuthCode', appUrl, requestId, err || -1, null, source, origin);
            }
        );
    },

    /**
     * 配置应用
     */
    config: (args, appUrl, requestId, source, origin) => {
        if (!args || !mWfc) {
            _notify('error', appUrl, 'Invalid params or WFC not initialized', source, origin);
            return;
        }

        const { appId, appType, timestamp, nonceStr, signature } = args;

        mWfc.configApplication(appId, appType, timestamp, nonceStr, signature,
            () => {
                console.log('[BridgeServer] config success');
                _notify('ready', appUrl, null, source, origin);
            },
            (err) => {
                console.log('[BridgeServer] config failed:', err);
                _notify('error', appUrl, err, source, origin);
            }
        );
    },

    /**
     * 选择联系人
     */
    chooseContacts: (args, appUrl, requestId, source, origin) => {
        if (!mHostPage) {
            _response('chooseContacts', appUrl, requestId, -1, 'Host page not available', source, origin);
            return;
        }

        mHostPage.chooseContacts(args,
            (users) => {
                _response('chooseContacts', appUrl, requestId, 0, users, source, origin);
            },
            (err) => {
                _response('chooseContacts', appUrl, requestId, -1, 'user canceled', source, origin);
            }
        );
    },

    /**
     * 关闭当前标签
     */
    close: (args, appUrl, requestId, source, origin) => {
        console.log('[BridgeServer] close tab for:', appUrl);
        if (mHostPage) {
            // 找到对应的 tab 并关闭
            mHostPage.tabs.forEach(tab => {
                if (tab.url === appUrl && !tab.closed) {
                    mHostPage.closeTab(tab.id);
                }
            });
        }
    },
};

/**
 * 发送响应消息
 */
async function _response(handlerName, appUrl, requestId, code, data, source, origin) {
    const response = {
        type: 'wf-op-response',
        handlerName,
        appUrl,
        requestId,
        windowId: await _getWindowId(),
        args: {
            code,
            data
        }
    };

    console.log('[BridgeServer] Send response:', handlerName, code);

    // 使用 postMessage 发送
    if (source && !source.closed) {
        source.postMessage(response, origin);
    }
}

/**
 * 发送事件通知
 */
async function _notify(handlerName, appUrl, args, source, origin) {
    const event = {
        type: 'wf-op-event',
        handlerName,
        appUrl,
        windowId: await _getWindowId(),
        args
    };

    console.log('[BridgeServer] Send event:', handlerName);

    if (source && !source.closed) {
        source.postMessage(event, origin);
    }
}

/**
 * 获取窗口 ID
 * 在 Web 环境中简化处理，使用固定值
 */
async function _getWindowId() {
    return 'web-tab-' + Date.now();
}

/**
 * 向指定 URL 的 iframe 发送消息
 * 用于外部调用
 */
export function sendMessageToTab(url, message) {
    if (!mHostPage) return;

    const targetWindow = mHostPage.getWindowByUrl(url);
    if (targetWindow && !targetWindow.closed) {
        // 获取该窗口的 origin
        try {
            const urlObj = new URL(url);
            targetWindow.postMessage(message, urlObj.origin);
        } catch (e) {
            console.error('[BridgeServer] Failed to send message:', e);
        }
    }
}
