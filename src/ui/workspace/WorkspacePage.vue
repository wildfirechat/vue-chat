<template>
    <section class="workspace-page">
        <div class="workspace-container">
            <!-- 标签栏 -->
            <div class="tab-bar" v-if="tabs.length > 0">
                <div
                    v-for="tab in visibleTabs"
                    :key="tab.id"
                    :class="['tab-item', { active: activeTabId === tab.id }]"
                    @click="activateTab(tab.id)"
                >
                    <span class="tab-title">{{ tab.title }}</span>
                    <span
                        v-if="tab.closable"
                        class="tab-close"
                        @click.stop="closeTab(tab.id)"
                    >×</span>
                </div>
            </div>

            <!-- iframe 容器 -->
            <div class="iframe-container">
                <iframe
                    v-for="tab in visibleTabs"
                    :key="tab.id"
                    v-show="activeTabId === tab.id"
                    :src="tab.url"
                    :name="`workspace-tab-${tab.id}`"
                    @load="onIframeLoad(tab.id, $event)"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                    allow="microphone; camera; fullscreen"
                    referrerpolicy="strict-origin-when-cross-origin"
                />
            </div>
        </div>
    </section>
</template>

<script>
import { init, destroy } from './bridgeServerImpl'
import wfc from '../../wfc/client/wfc';
import Config from '../../config';

export default {
    name: 'WorkspacePage',

    data() {
        return {
            tabs: [],
            activeTabId: null,
            tabCounter: 0,
            bridgeInitialized: false,
            defaultTitle: '工作台'
        }
    },

    computed: {
        visibleTabs() {
            return this.tabs.filter(t => !t.closed);
        }
    },

    created() {
        // 检查是否有传入的 url 参数
        let tmpUrl = this._getQuery(location.href, 'url');
        if (tmpUrl) {
            this.defaultUrl = decodeURIComponent(tmpUrl);
        } else {
            this.defaultUrl = Config.OPEN_PLATFORM_WORK_SPACE_URL;
        }
    },

    mounted() {
        // 初始化工作台，加载门户页
        this.addTab(this.defaultUrl, false, this.defaultTitle);

        // 初始化 bridgeServer
        init(wfc, this);
        this.bridgeInitialized = true;

        // 监听来自其他页面的消息（比如新标签页打开请求）
        window.addEventListener('message', this.handleWindowMessage);
    },

    beforeUnmount() {
        // 清理
        destroy();
        window.removeEventListener('message', this.handleWindowMessage);
    },

    methods: {
        // 添加标签页
        addTab(url, closable = true, title = '新标签') {
            // 检查是否已存在相同 url 的标签
            const existingTab = this.tabs.find(t => t.url === url && !t.closed);
            if (existingTab) {
                this.activateTab(existingTab.id);
                return existingTab.id;
            }

            const id = ++this.tabCounter;
            const tab = {
                id,
                url,
                title,
                closable,
                closed: false,
                iframe: null,
            };
            this.tabs.push(tab);
            this.activeTabId = id;
            return id;
        },

        // 关闭标签页
        closeTab(id) {
            const tab = this.tabs.find(t => t.id === id);
            if (tab) {
                tab.closed = true;

                // 切换到其他标签
                const remaining = this.visibleTabs;
                if (remaining.length > 0) {
                    // 优先切换到左侧标签，如果没有则选最后一个
                    const currentIndex = this.tabs.findIndex(t => t.id === id);
                    const leftTabs = this.tabs.slice(0, currentIndex).filter(t => !t.closed);
                    if (leftTabs.length > 0) {
                        this.activeTabId = leftTabs[leftTabs.length - 1].id;
                    } else if (remaining.length > 0) {
                        this.activeTabId = remaining[0].id;
                    }
                } else {
                    this.activeTabId = null;
                }
            }
        },

        // 激活标签
        activateTab(id) {
            this.activeTabId = id;
        },

        // iframe 加载完成
        onIframeLoad(tabId, event) {
            const tab = this.tabs.find(t => t.id === tabId);
            if (tab) {
                tab.iframe = event.target;

                // 尝试获取标题（跨域可能失败）
                try {
                    const title = event.target.contentDocument?.title;
                    if (title) {
                        tab.title = title;
                    }
                } catch (e) {
                    // 跨域无法访问，忽略
                }
            }
        },

        // 获取 iframe contentWindow（供 bridgeServer 使用）
        getTabWindow(tabId) {
            const tab = this.tabs.find(t => t.id === tabId);
            return tab?.iframe?.contentWindow || null;
        },

        // 获取当前激活的 iframe window
        getActiveTabWindow() {
            return this.getTabWindow(this.activeTabId);
        },

        // 根据 url 获取 iframe window
        getWindowByUrl(url) {
            for (const tab of this.tabs) {
                if (tab.url === url && tab.iframe) {
                    return tab.iframe.contentWindow;
                }
            }
            return null;
        },

        // 更新标签标题
        updateTabTitle(url, title) {
            const tab = this.tabs.find(t => t.url === url);
            if (tab) {
                tab.title = title || tab.title;
            }
        },

        // 处理窗口消息（用于外部请求打开新标签等）
        handleWindowMessage(event) {
            // // 安全校验：验证 origin
            // const allowedOrigins = Config.OPEN_PLATFORM_ALLOWED_ORIGINS || [];
            // if (!allowedOrigins.includes(event.origin)) {
            //     return;
            // }

            const data = event.data;
            if (data && data.type === 'workspace-add-tab') {
                this.addTab(data.url, true, data.title || '新标签');
            }
        },

        // URL 参数解析
        _getQuery(url, key) {
            if (url.indexOf('?') > 0) {
                let query = url.substring(url.indexOf('?'));
                if (query && query.length > 1) {
                    let params = new URLSearchParams(query);
                    return params.get(key);
                }
            }
            return null;
        },

        // 开放平台 UI 相关方法（供 bridgeServer 调用）
        chooseContacts(options, successCB, failCB) {
            this.$pickContact({
                successCB,
                failCB,
            });
        },

        openExternal(args) {
            // 浏览器环境中，外部打开就是新窗口
            window.open(args.url, '_blank');
        }
    }
}
</script>

<style scoped>
.workspace-page {
    display: flex;
    flex: 1;
    height: 100%;
    position: relative;
    background: #f5f5f5;
}

.workspace-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* 标签栏样式 */
.tab-bar {
    display: flex;
    background: #e8e8e8;
    border-bottom: 1px solid #d0d0d0;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    height: 36px;
}

.tab-item {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 35px;
    background: #f0f0f0;
    border-right: 1px solid #d0d0d0;
    cursor: pointer;
    user-select: none;
    font-size: 13px;
    color: #333;
    transition: background 0.2s;
    max-width: 150px;
    min-width: 80px;
}

.tab-item:hover {
    background: #e0e0e0;
}

.tab-item.active {
    background: #fff;
    border-bottom: 1px solid #fff;
    color: #1f64e4;
}

.tab-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 8px;
}

.tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 16px;
    line-height: 1;
    color: #999;
    cursor: pointer;
}

.tab-close:hover {
    background: #d0d0d0;
    color: #333;
}

/* iframe 容器 */
.iframe-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #fff;
}

.iframe-container iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
}
</style>
