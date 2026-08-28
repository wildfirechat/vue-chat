<template>
    <section class="message-context-page">
        <!-- 顶部 -->
        <div class="context-header">
            <div class="back-btn" @click="goBack">
                <i class="icon-ion-ios-arrow-back"></i>
            </div>
            <div class="header-title">
                <p class="title single-line">{{ pageTitle }}</p>
                <p v-if="keyword" class="keyword single-line">与「{{ keyword }}」相关的上下文</p>
            </div>
        </div>

        <!-- 上一处/下一处 -->
        <div class="nav-bar">
            <button class="nav-btn" :disabled="!context || !context.prevHitMid" @click="jumpTo('prev')">
                <i class="icon-ion-ios-arrow-up"></i>上一处
            </button>
            <button class="nav-btn" :disabled="!context || !context.nextHitMid" @click="jumpTo('next')">
                下一处<i class="icon-ion-ios-arrow-down"></i>
            </button>
            <span class="nav-tip">本会话内按时间切换命中消息</span>
        </div>

        <!-- 消息流（上下滚动分页加载更早/更晚消息，哨兵触发） -->
        <div ref="scrollContainer" class="message-container">
            <div v-if="loading && !context" class="center-state">
                <span class="spinner"></span>
                <p>加载中…</p>
            </div>
            <div v-else-if="error" class="center-state">
                <p>加载失败：{{ error }}</p>
                <a class="retry-btn" @click="loadContext">重试</a>
            </div>
            <ul v-else-if="messages.length > 0" class="message-list">
                <!-- 顶部哨兵：向上滚动到最早附近 → 加载更早消息（插入顶部） -->
                <li ref="sentinelTop" class="sentinel"></li>
                <li v-if="loadingEarlier" class="scroll-loading"><span class="mini-spinner"></span>加载更早消息…</li>
                <li v-if="!hasEarlier && !loadingEarlier" class="scroll-end">已到最早的消息</li>
                <!-- 按 messageId 去重渲染（服务端上下文可能包含重复消息） -->
                <li v-for="msg in displayMessages" :id="'msg-' + msg.messageId" :key="msg.messageId"
                    class="message-item"
                    :class="{hit: msg.isHit, anchor: msg.messageId === anchorMid}"
                    @contextmenu.prevent="openContextMenu($event, msg)">
                    <img class="avatar" :src="avatarOf(msg.sender)" @error="onAvatarError"/>
                    <div class="msg-main">
                        <div class="msg-header">
                            <span class="sender-name">{{ nameOf(msg.sender) }}</span>
                            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                            <span v-if="msg.messageId === anchorMid" class="anchor-tag">命中</span>
                        </div>
                        <!-- 通知/撤回消息：与会话界面一致的通知渲染 -->
                        <div v-if="isNotificationMessage(msg)" class="msg-content">
                            <RecallNotificationMessageContentView v-if="isRecallNotificationMessage(msg)"
                                                                  :message="messageOf(msg)"/>
                            <ContextableNotificationMessageContentContainerView v-else-if="isContextableNotificationMessage(msg)"
                                                                                :message="messageOf(msg)"/>
                            <NotificationMessageContentView v-else :message="messageOf(msg)"/>
                        </div>
                        <!-- 完整消息渲染：OutputMessageData → 本地 Message → MessageContentContainerView -->
                        <div v-else-if="messageOf(msg)" class="msg-content"
                             :class="{'no-interaction': isNonInteractive(messageOf(msg))}">
                            <MessageContentContainerView :message="messageOf(msg)"/>
                        </div>
                        <!-- 兜底：payload 不可用时的摘要展示；digest 为空（如撤回消息）显示占位 -->
                        <p v-else class="msg-digest" v-html="renderDigest(msg.digest) || '[该消息已撤回]'"></p>
                    </div>
                </li>
                <!-- 底部哨兵：向下滚动到最晚附近 → 加载更晚消息（追加底部） -->
                <li v-if="loadingLater" class="scroll-loading"><span class="mini-spinner"></span>加载更晚消息…</li>
                <li v-if="!hasLater && !loadingLater" class="scroll-end">已到最新的消息</li>
                <li ref="sentinelBottom" class="sentinel"></li>
            </ul>
            <div v-else class="center-state">
                <p>未找到上下文消息</p>
            </div>
        </div>

        <!-- 消息长按/右键菜单（参考普通会话消息菜单） -->
        <vue-context ref="contextMenu" v-slot="{data: message}" :close-on-scroll="true">
            <li v-if="message && isCopyable(message)">
                <a @click.prevent="copyMessage(message)">复制</a>
            </li>
            <li v-if="message && isDownloadable(message)">
                <a @click.prevent="downloadMessage(message)">下载</a>
            </li>
            <li v-if="message && isForwardable(message)">
                <a @click.prevent="forwardMessage(message)">转发</a>
            </li>
            <li v-if="message && isFavable(message)">
                <a @click.prevent="favMessage(message)">收藏</a>
            </li>
        </vue-context>
    </section>
</template>

<script>
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";
import Config from "../../../config";
import ConversationType from "../../../wfc/model/conversationType";
import {renderSearchDigest} from "../../util/searchKeywordHighlight";
import {backInAppSubWindowOrRouter, getSubWindowQuery} from "../../util/subWindowNavigator";
import {messagesFromOutputMessageData} from "../../util/outputMessageData";
import MessageContentContainerView from "../conversation/message/MessageContentContainerView";
import NotificationMessageContentView from "../conversation/message/NotificationMessageContentView.vue";
import RecallNotificationMessageContentView from "../conversation/message/RecallNotificationMessageContentView.vue";
import ContextableNotificationMessageContentContainerView from "../conversation/message/ContextableNotificationMessageContentContainerView.vue";
import NotificationMessageContent from "../../../wfc/messages/notification/notificationMessageContent";
import RecallMessageNotification from "../../../wfc/messages/notification/recallMessageNotification";
import RichNotificationMessageContent from "../../../wfc/messages/notification/richNotificationMessageContent";
import ArticlesMessageContent from "../../../wfc/messages/articlesMessageContent";
import Long from "long";
import TextMessageContent from "../../../wfc/messages/textMessageContent";
import ImageMessageContent from "../../../wfc/messages/imageMessageContent";
import VideoMessageContent from "../../../wfc/messages/videoMessageContent";
import FileMessageContent from "../../../wfc/messages/fileMessageContent";
import SoundMessageContent from "../../../wfc/messages/soundMessageContent";
import MessageContentType from "../../../wfc/messages/messageContentType";
import MessageConfig from "../../../wfc/client/messageConfig";
import PersistFlag from "../../../wfc/messages/persistFlag";
import CollectionMessageContent from "../../../wfc/messages/collectionMessageContent";
import CallStartMessageContent from "../../../wfc/av/messages/callStartMessageContent";
import {copyText, copyImg} from "../../util/clipboard";
import {downloadFile} from "../../../platformHelper";
import appServerApi from "../../../api/appServerApi";
import ForwardType from "../conversation/message/forward/ForwardType";

// 连续多少轮「拉到消息却一条都渲染不出来」后停止该方向的自动加载（分页死循环保护）
const MAX_EMPTY_ROUNDS = 3;

// 本页面只用于查看历史消息，这些消息的点击会真的发起通话/加入会议，在上下文里点到都是误触，
// 故屏蔽其内容区的交互（右键菜单挂在外层 li 上，不受影响）
const NON_INTERACTIVE_CONTENT_TYPES = [
    MessageContentType.VOIP_CONTENT_TYPE_START,
    MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE,
];

export default {
    name: "MessageContextPage",
    components: {
        MessageContentContainerView,
        NotificationMessageContentView,
        RecallNotificationMessageContentView,
        ContextableNotificationMessageContentContainerView,
    },

    props: {
        // Web 端子窗口通过 sub-window-query 传入路由参数（Electron 端走 $route.query）
        subWindowQuery: {
            type: Object,
            required: false,
            default: null,
        }
    },

    data() {
        return {
            conversation: null,
            conversationName: '',
            anchorMid: 0,
            keyword: '',
            // 搜索页透传的筛选条件（命中标记 / 上一处 / 下一处）
            contentTypes: [],
            fromUser: null,
            startTime: null,
            endTime: null,
            context: null,
            // 当前消息列表（时间升序：最早在上，最晚在下），支持上下滚动分页扩展
            messages: [],
            loading: false,
            error: null,
            // 滚动分页状态
            loadingEarlier: false,
            loadingLater: false,
            hasEarlier: true,
            hasLater: true,
            // 连续「拉到消息但一条都渲染不出来」的轮次：达到上限即停止该方向，
            // 避免列表填不满视口时哨兵无限触发分页、把 context 接口打爆
            emptyEarlierRounds: 0,
            emptyLaterRounds: 0,
            userInfoMap: {},
            // messageId → 本地 Message（转换结果缓存）
            messageMap: new Map(),
        };
    },

    computed: {
        pageTitle() {
            if (this.conversationName) {
                return `在「${this.conversationName}」中的消息`;
            }
            return '消息上下文';
        },
        /**
         * 去重后的消息列表（按 messageId，保留首次出现）：
         * 服务端上下文/滚动加载可能返回重复 mid（边界消息、多表归并等）。
         * 同时过滤透传/不存储类型的消息（按本地消息类型注册表判断，见 shouldHideMessage）。
         */
        displayMessages() {
            const seen = new Set();
            const result = [];
            for (const msg of this.messages) {
                if (seen.has(msg.messageId)) {
                    continue;
                }
                seen.add(msg.messageId);
                // 透传/不存储类型（如 Typing），过滤不显示
                if (this.shouldHideMessage(msg)) {
                    continue;
                }
                result.push(msg);
            }
            return result;
        },
    },

    mounted() {
        const query = getSubWindowQuery(this);
        const type = Number(query.type);
        const target = query.target;
        const line = Number(query.line) || 0;
        // 64 位消息 ID 保持字符串传递（JS Number 无法精确表示 > 2^53 的 long）
        const anchorMid = query.anchorMid;
        if (!target || !anchorMid) {
            console.error('message-context: 缺少会话/锚点参数', query);
            this.$alert({title: '提示', content: '无法获取消息上下文，请从搜索结果重新进入', confirmText: '知道了'});
            return;
        }
        this.conversation = {type, target, line};
        this.anchorMid = anchorMid;
        this.keyword = query.keyword || '';
        // 搜索页带过来的筛选条件：用于命中标记与上一处/下一处（不影响上下文消息流本身）
        this.contentTypes = String(query.contentTypes || '')
            .split(',')
            .map(v => Number(v))
            .filter(v => !isNaN(v) && v > 0);
        this.fromUser = query.fromUser || null;
        this.startTime = query.startTime ? Number(query.startTime) : null;
        this.endTime = query.endTime ? Number(query.endTime) : null;
        this.loadConversationName();
        this.loadContext();
    },

    beforeUnmount() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    },

    methods: {
        /**
         * 透传/不存储类型的消息（如 Typing）不显示。
         *
         * 注意：<b>不能用 payload.persistFlag 判断</b>。该字段由发送方编码进消息体，
         * 服务端 API / 机器人 / 部分 SDK 发送的消息并不带该字段（解析出来恒为 0），
         * 但消息本身确实已入库（能被搜索到即已存储）。早期按 persistFlag === 0 过滤，
         * 会把这类会话的上下文消息<b>整屏过滤光</b>：页面只剩"加载更早消息…/已到最新的消息"，
         * 且因为列表始终填不满视口，哨兵会不停触发分页，表现为不停请求 context 接口。
         *
         * 这里改为按本地消息类型注册表（MessageConfig）判断，与会话界面语义一致；
         * 未注册类型（-1）保留，回退 digest 简式展示。
         */
        shouldHideMessage(msg) {
            const type = msg && msg.payload ? msg.payload.type : undefined;
            if (type === undefined || type === null) {
                return false;
            }
            const flag = MessageConfig.getMessageContentPersitFlag(type);
            return flag === PersistFlag.No_Persist || flag === PersistFlag.Transparent;
        },

        /** 通话、会议邀请等消息：屏蔽点击等交互，见 NON_INTERACTIVE_CONTENT_TYPES */
        isNonInteractive(message) {
            if (!message || !message.messageContent) {
                return false;
            }
            return NON_INTERACTIVE_CONTENT_TYPES.indexOf(message.messageContent.type) > -1;
        },

        /**
         * 64 位消息 ID 比较（JS Number 无法精确表示，用 Long 库；mid 均为正数）
         * @returns {number} -1/0/1
         */
        compareMid(a, b) {
            const la = Long.fromString(String(a));
            const lb = Long.fromString(String(b));
            return la.compare(lb);
        },

        // ==================== 消息长按/右键菜单（参考普通会话消息菜单） ====================

        /** 打开消息上下文菜单：msg 为 OutputMessageData，取转换后的本地 Message */
        openContextMenu(event, msg) {
            const message = this.messageOf(msg);
            if (!message) {
                return; // payload 不可用时无菜单（digest 简式展示）
            }
            this.$refs.contextMenu.open(event, message);
        },

        isCopyable(message) {
            const content = message.messageContent;
            return content instanceof TextMessageContent || content instanceof ImageMessageContent;
        },

        isDownloadable(message) {
            const content = message.messageContent;
            return content instanceof ImageMessageContent
                || content instanceof FileMessageContent
                || content instanceof VideoMessageContent;
        },

        isForwardable(message) {
            const content = message.messageContent;
            return !(content instanceof SoundMessageContent
                || content instanceof CollectionMessageContent
                || content instanceof CallStartMessageContent);
        },

        isFavable(message) {
            if (!message || !message.messageContent) {
                return false;
            }
            return [MessageContentType.VOIP_CONTENT_TYPE_START,
                MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE,
                MessageContentType.Collection].indexOf(message.messageContent.type) <= -1;
        },

        copyMessage(message) {
            const content = message.messageContent;
            if (content instanceof TextMessageContent) {
                const selectedText = window.getSelection().toString();
                copyText(selectedText || content.content);
            } else if (content instanceof ImageMessageContent) {
                copyImg(content.remotePath);
            }
        },

        downloadMessage(message) {
            if (!store.isDownloadingMessage(message.messageId)) {
                downloadFile(message);
                store.addDownloadingMessage(message.messageUid);
            } else {
                console.log('file is downloading');
            }
        },

        forwardMessage(message) {
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
            }).catch(() => {
            });
        },

        favMessage(message) {
            appServerApi.favMessage(message)
                .then(() => {
                    this.$notify({text: '收藏成功', type: 'info'});
                })
                .catch(err => {
                    console.log('fav error', err);
                    this.$notify({text: '收藏失败', type: 'error'});
                });
        },

        loadConversationName() {
            if (this.conversation.type === ConversationType.Group) {
                wfc.getGroupInfoEx(this.conversation.target, false, (info) => {
                    if (info && info.name) this.conversationName = info.name;
                }, () => {
                });
            } else {
                wfc.getUserInfoEx(this.conversation.target, false, (info) => {
                    if (info && info.displayName) this.conversationName = info.displayName;
                }, () => {
                });
            }
        },

        loadContext() {
            if (!this.conversation || !this.anchorMid) return;
            this.loading = true;
            this.error = null;
            store.searchConversationMessageContext(this.conversation, this.anchorMid, {
                keyword: this.keyword,
                contentTypes: this.contentTypes,
                fromUser: this.fromUser,
                startTime: this.startTime,
                endTime: this.endTime,
                beforeCount: 20,
                afterCount: 10,
            }).then(data => {
                this.context = data;
                // 初始去重（按 messageId 保留首次出现），保证滚动边界稳定
                const seen = new Set();
                this.messages = (data.messages || []).filter(m => {
                    if (seen.has(m.messageId)) {
                        return false;
                    }
                    seen.add(m.messageId);
                    return true;
                });
                // 初始即已覆盖锚点前后，标记两侧可继续加载
                this.hasEarlier = true;
                this.hasLater = true;
                // OutputMessageData → 本地 Message（完整消息渲染）
                this.messageMap = messagesFromOutputMessageData(this.messages);
                this.emptyEarlierRounds = 0;
                this.emptyLaterRounds = 0;
                if (this.messages.length > 0 && this.displayMessages.length === 0) {
                    console.warn('[Ctx] 服务端返回', this.messages.length, '条消息，但全部被过滤，页面无内容可显示，'
                        + '首条 payload=', this.messages[0] && this.messages[0].payload);
                }
                console.log('[Ctx] loadContext anchor=', this.anchorMid,
                    '| messages=', this.messages.length,
                    '| first=', this.messages[0] && this.messages[0].messageId,
                    '| last=', this.messages[this.messages.length - 1] && this.messages[this.messages.length - 1].messageId,
                    '| prevHit=', data.prevHitMid, '| nextHit=', data.nextHitMid);
                // 滚动定位到高亮的锚点消息（居中展示）
                this.scrollToAnchor();
                // 建立哨兵观察（列表渲染后）
                this.setupObserver();
            }).catch(e => {
                console.error('load message context failed', e);
                this.error = (e && e.message) ? e.message : '加载失败';
            }).finally(() => {
                this.loading = false;
            });
        },

        /**
         * 滚动容器定位到锚点（高亮命中）消息，居中展示。
         * 用容器坐标计算（不依赖 scrollIntoView 祖先链），并在图片异步加载后二次修正。
         */
        scrollToAnchor() {
            const doScroll = () => {
                const container = this.$refs.scrollContainer;
                const el = document.getElementById('msg-' + this.anchorMid);
                if (!container || !el) return;
                const rect = el.getBoundingClientRect();
                const cRect = container.getBoundingClientRect();
                // 目标：元素垂直居中于容器
                container.scrollTop += rect.top - cRect.top - container.clientHeight / 2 + rect.height / 2;
            };
            this.$nextTick(doScroll);
            // 图片等异步内容加载后再次修正定位
            setTimeout(doScroll, 150);
        },

        /**
         * 哨兵 IntersectionObserver：顶部哨兵可见 → 加载更晚；底部哨兵可见 → 加载更早。
         * 不依赖 scroll 事件与阈值判定，滚动到边缘（含提前量）即自动加载，可持续直到结束。
         */
        setupObserver() {
            // 等待列表 DOM 渲染完成后再取哨兵 ref（messages 赋值后 Vue 异步更新 DOM）
            this.$nextTick(() => {
                if (this.observer) {
                    this.observer.disconnect();
                }
                const container = this.$refs.scrollContainer;
                const top = this.$refs.sentinelTop;
                const bottom = this.$refs.sentinelBottom;
                if (!container || !top || !bottom || typeof IntersectionObserver === 'undefined') {
                    console.warn('[Ctx] setupObserver 无法建立: container=', !!container, 'top=', !!top, 'bottom=', !!bottom,
                        'IO=', typeof IntersectionObserver !== 'undefined');
                    return;
                }
                console.log('[Ctx] setupObserver 建立哨兵观察');
                this.observer = new IntersectionObserver((entries) => {
                    for (const entry of entries) {
                        if (!entry.isIntersecting) continue;
                        if (entry.target === top) {
                            // 顶部哨兵可见：向上滚到最早附近 → 加载更早
                            this.loadEarlier();
                        } else if (entry.target === bottom) {
                            // 底部哨兵可见：向下滚到最晚附近 → 加载更晚
                            this.loadLater();
                        }
                    }
                }, {
                    root: container,
                    rootMargin: '150px 0px', // 提前 150px 触发，滚动更流畅
                    threshold: 0,
                });
                this.observer.observe(top);
                this.observer.observe(bottom);
            });
        },

        messageOf(msg) {
            return this.messageMap.get(msg.messageId) || null;
        },

        /** 通知/撤回/富通知消息：与会话界面一致走通知渲染 */
        isNotificationMessage(msg) {
            const message = this.messageOf(msg);
            if (!message || !message.messageContent) {
                return false;
            }
            const content = message.messageContent;
            return content instanceof NotificationMessageContent
                || content instanceof RecallMessageNotification
                || content instanceof RichNotificationMessageContent;
        },

        /** 撤回通知：渲染"xx 撤回了一条消息" */
        isRecallNotificationMessage(msg) {
            const message = this.messageOf(msg);
            return !!(message && message.messageContent instanceof RecallMessageNotification);
        },

        /** 富通知/图文：可引用/可操作的通知渲染 */
        isContextableNotificationMessage(msg) {
            const message = this.messageOf(msg);
            if (!message || !message.messageContent) {
                return false;
            }
            const content = message.messageContent;
            return content instanceof RichNotificationMessageContent
                || content instanceof ArticlesMessageContent;
        },

        // ===== 上下滚动分页加载（复用 context 接口：以边界消息为 anchor 仅取一侧） =====
        // 列表按时间升序：顶部=最早，底部=最晚。
        // 向上滚动到顶部 → 加载更早（before），插入顶部并保持视口；
        // 向下滚动到底部 → 加载更晚（after），追加底部。

        /**
         * 向上滚动到列表顶部：加载更早的消息（before 方向），插入到列表头部并保持滚动位置
         */
        loadEarlier() {
            if (this.loadingEarlier || !this.hasEarlier || this.messages.length === 0) return;
            const first = this.messages[0];
            const el = this.$refs.scrollContainer;
            const oldScrollHeight = el ? el.scrollHeight : 0;
            const oldScrollTop = el ? el.scrollTop : 0;
            this.loadingEarlier = true;
            console.log('[Ctx] loadEarlier: first=', first.messageId,
                '(hex=' + Long.fromString(String(first.messageId)).toString(16) + ')',
                'anchor=', first.messageId, 'beforeCount=20');
            store.searchConversationMessageContext(this.conversation, first.messageId, {
                keyword: '',
                beforeCount: 40,
                afterCount: 0,
            }).then(data => {
                const newOnes = (data.messages || []).filter(m => this.compareMid(m.messageId, first.messageId) < 0);
                console.log('[Ctx] loadEarlier resp: messages=', (data.messages || []).length, '| newOnes=', newOnes.length,
                    '| midRange=', newOnes.length ? (newOnes[0].messageId + '~' + newOnes[newOnes.length - 1].messageId) : '-');
                if (newOnes.length === 0) {
                    console.log('[Ctx] loadEarlier 边界：服务端无更早消息（返回 0），hasEarlier=false');
                    this.hasEarlier = false;
                    return;
                }
                const existing = new Set(this.messages.map(m => m.messageId));
                const toAdd = newOnes.filter(m => !existing.has(m.messageId));
                if (toAdd.length === 0) {
                    console.warn('[Ctx] loadEarlier 边界：newOnes=', newOnes.length, '但全部已加载（重复过滤），hasEarlier=false');
                    this.hasEarlier = false;
                    return;
                }
                // 更早消息插入顶部（在现有最早之前），滚动位置保持
                const visibleBefore = this.displayMessages.length;
                this.messages = toAdd.concat(this.messages);
                this.mergeMessageMap(toAdd);
                // 只要还有返回，就继续可加载（边界由服务端空返回决定）
                this.hasEarlier = true;
                this.checkVisibleGrowth('earlier', visibleBefore, toAdd);
                console.log('[Ctx] loadEarlier done: toAdd=', toAdd.length, '| total=', this.messages.length, '| hasEarlier=', this.hasEarlier);
                this.$nextTick(() => {
                    const sc = this.$refs.scrollContainer;
                    if (sc) {
                        sc.scrollTop = oldScrollTop + (sc.scrollHeight - oldScrollHeight);
                    }
                });
            }).catch(e => {
                console.error('load earlier failed', e);
                this.hasEarlier = false;
            }).finally(() => {
                this.loadingEarlier = false;
                // 若哨兵仍可见（内容未填满视口），继续加载直到满屏或边界
                this.$nextTick(() => this.continueIfSentinelVisible());
            });
        },

        /**
         * 向下滚动到列表底部：加载更晚的消息（after 方向），追加到列表末尾（滚动位置自然保持）
         */
        loadLater() {
            if (this.loadingLater || !this.hasLater || this.messages.length === 0) return;
            const last = this.messages[this.messages.length - 1];
            this.loadingLater = true;
            // anchorMid 为字符串（64 位 ID），打印十进制与 hex 便于与服务端 [CTX] req 对照
            console.log('[Ctx] loadLater: last=', last.messageId,
                '(hex=' + Long.fromString(String(last.messageId)).toString(16) + ')',
                'anchor=', last.messageId, 'afterCount=20');
            store.searchConversationMessageContext(this.conversation, last.messageId, {
                keyword: '',
                beforeCount: 0,
                afterCount: 40,
            }).then(data => {
                const newOnes = (data.messages || []).filter(m => this.compareMid(m.messageId, last.messageId) > 0);
                console.log('[Ctx] loadLater resp: messages=', (data.messages || []).length, '| newOnes=', newOnes.length,
                    '| midRange=', newOnes.length ? (newOnes[0].messageId + '~' + newOnes[newOnes.length - 1].messageId) : '-');
                if (newOnes.length === 0) {
                    console.log('[Ctx] loadLater 边界：服务端无更晚消息（返回 0），hasLater=false');
                    this.hasLater = false;
                    return;
                }
                const existing = new Set(this.messages.map(m => m.messageId));
                const toAdd = newOnes.filter(m => !existing.has(m.messageId));
                if (toAdd.length === 0) {
                    console.warn('[Ctx] loadLater 边界：newOnes=', newOnes.length, '但全部已加载（重复过滤），hasLater=false');
                    this.hasLater = false;
                    return;
                }
                const visibleBefore = this.displayMessages.length;
                this.messages = this.messages.concat(toAdd);
                this.mergeMessageMap(toAdd);
                // 只要还有返回，就继续可加载（边界由服务端空返回决定）
                this.hasLater = true;
                this.checkVisibleGrowth('later', visibleBefore, toAdd);
                console.log('[Ctx] loadLater done: toAdd=', toAdd.length, '| total=', this.messages.length, '| hasLater=', this.hasLater);
            }).catch(e => {
                console.error('load later failed', e);
                this.hasLater = false;
            }).finally(() => {
                this.loadingLater = false;
                this.$nextTick(() => this.continueIfSentinelVisible());
            });
        },

        /**
         * 分页保护：本轮拉到了消息，但一条都没能渲染出来（全被 shouldHideMessage 过滤）时计数；
         * 连续 MAX_EMPTY_ROUNDS 轮如此就停止该方向的自动加载。
         *
         * 列表填不满视口时哨兵会一直可见 → continueIfSentinelVisible 无限触发分页，
         * 没有这个保护就会不停请求 context 接口（曾经的现象：页面空白 + 接口刷屏）。
         */
        checkVisibleGrowth(direction, visibleBefore, toAdd) {
            const grew = this.displayMessages.length > visibleBefore;
            if (grew) {
                if (direction === 'earlier') {
                    this.emptyEarlierRounds = 0;
                } else {
                    this.emptyLaterRounds = 0;
                }
                return;
            }
            const rounds = direction === 'earlier' ? ++this.emptyEarlierRounds : ++this.emptyLaterRounds;
            console.warn('[Ctx]', direction, '本轮新增', toAdd.length, '条消息但均不可显示（连续', rounds, '轮），'
                + '首条 payload=', toAdd[0] && toAdd[0].payload);
            if (rounds >= MAX_EMPTY_ROUNDS) {
                console.warn('[Ctx]', direction, '连续', rounds, '轮无可显示消息，停止该方向自动加载');
                if (direction === 'earlier') {
                    this.hasEarlier = false;
                } else {
                    this.hasLater = false;
                }
            }
        },

        /**
         * 加载完成后检查：若哨兵仍在容器视口扩展区域内（内容未填满视口），
         * 继续加载对应方向，直到满屏或到达边界。
         */
        continueIfSentinelVisible() {
            const container = this.$refs.scrollContainer;
            if (!container) return;
            const cRect = container.getBoundingClientRect();
            const margin = 150;
            const check = (el, loadFn) => {
                if (!el) return;
                const r = el.getBoundingClientRect();
                if (r.top >= cRect.top - margin && r.top <= cRect.bottom + margin) {
                    loadFn();
                }
            };
            // 顶部哨兵（列表最早消息之上）→ 加载更早；底部哨兵（最晚消息之下）→ 加载更晚
            check(this.$refs.sentinelTop, () => this.loadEarlier());
            check(this.$refs.sentinelBottom, () => this.loadLater());
        },

        mergeMessageMap(newItems) {
            const extra = messagesFromOutputMessageData(newItems);
            const merged = new Map(this.messageMap);
            extra.forEach((v, k) => merged.set(k, v));
            this.messageMap = merged;
        },

        jumpTo(direction) {
            if (!this.context) return;
            // prevHitMid/nextHitMid 为字符串（64 位 ID 防精度丢失）
            const targetMid = direction === 'prev' ? this.context.prevHitMid : this.context.nextHitMid;
            if (!targetMid) return;
            this.anchorMid = String(targetMid);
            // loadContext 成功后会自动滚动定位到新锚点
            this.loadContext();
        },

        goBack() {
            backInAppSubWindowOrRouter(this);
        },

        // ===== 展示辅助 =====

        avatarOf(uid) {
            let info = this.userInfoMap[uid];
            if (!info) {
                info = wfc.getUserInfo(uid, false);
                if (info) this.userInfoMap[uid] = info;
            }
            return info && info.portrait ? info.portrait : Config.DEFAULT_PORTRAIT_URL;
        },

        nameOf(uid) {
            // 优先服务端附带 senderUserInfo，其次本地用户信息
            const senderInfo = this.senderInfoOf(uid);
            if (senderInfo && senderInfo.displayName) return senderInfo.displayName;
            let info = this.userInfoMap[uid];
            if (!info) {
                info = wfc.getUserInfo(uid, false);
                if (info) this.userInfoMap[uid] = info;
            }
            return info && info.displayName ? info.displayName : uid;
        },

        senderInfoOf(uid) {
            if (!this.messages || this.messages.length === 0) return null;
            for (const msg of this.messages) {
                if (msg.sender === uid && msg.senderUserInfo) {
                    return msg.senderUserInfo;
                }
            }
            return null;
        },

        onAvatarError(e) {
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },

        renderDigest(digest) {
            return renderSearchDigest(digest);
        },

        formatTime(ts) {
            const d = new Date(ts);
            const now = new Date();
            const pad = n => String(n).padStart(2, '0');
            const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const todayYmd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            if (ymd === todayYmd) return hm;
            const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
            const yestYmd = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
            if (ymd === yestYmd) return `昨天 ${hm}`;
            if (d.getFullYear() === now.getFullYear()) return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
            return `${ymd} ${hm}`;
        },
    },
};
</script>

<style lang="css" scoped>
.message-context-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
}

.context-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-subtle);
}

.back-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: var(--radius-md);
    color: var(--text-secondary-strong);
}

.back-btn:hover {
    background-color: var(--background-item-hover);
}

.header-title {
    flex: 1;
    min-width: 0;
}

.title {
    color: var(--text-primary);
    font-size: var(--font-size-base);
    font-weight: 500;
}

.keyword {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    margin-top: 2px;
}

.nav-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-subtle);
}

.nav-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background-color: var(--background-input);
    color: var(--text-secondary-strong);
    cursor: pointer;
    font-size: var(--font-size-sm);
}

.nav-btn:hover:not(:disabled) {
    border-color: var(--border-active);
    color: var(--accent-color);
}

.nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.nav-tip {
    margin-left: auto;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
}

.message-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px 14px;
}

.center-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60%;
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    gap: 8px;
}

.retry-btn {
    color: var(--accent-color);
    cursor: pointer;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.message-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.sentinel {
    height: 1px;
    list-style: none;
}

.scroll-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
    padding: 8px 0;
}

/* 加载更早/更晚消息时的转圈动画 */
.mini-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-primary);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    flex-shrink: 0;
    animation: spin 0.8s linear infinite;
}

.scroll-end {
    text-align: center;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
    padding: 8px 0;
}

.message-item {
    display: flex;
    gap: 10px;
    padding: 10px 8px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
}

.message-item.hit {
    background-color: var(--background-item-active);
    border-color: var(--border-active);
}

.message-item.anchor {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
}

.message-item.anchor .sender-name,
.message-item.anchor .msg-time {
    color: var(--text-on-accent);
}

.message-item.anchor .msg-digest {
    color: var(--text-on-accent);
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
}

.msg-main {
    flex: 1;
    min-width: 0;
}

.msg-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.sender-name {
    color: var(--text-secondary-strong);
    font-size: var(--font-size-sm);
}

.msg-time {
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
}

.anchor-tag {
    font-size: var(--font-size-xs);
    border: 1px solid currentColor;
    border-radius: var(--radius-xs);
    padding: 0 4px;
}

/* 通话、会议邀请等消息：屏蔽内容区的点击 */
.msg-content.no-interaction {
    pointer-events: none;
}

.msg-digest {
    margin-top: 4px;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    word-break: break-all;
}

.msg-digest :deep(mark) {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-radius: 2px;
    padding: 0 1px;
}

.message-item.anchor .msg-digest :deep(mark) {
    background-color: var(--text-on-accent);
    color: var(--accent-color);
}

.bottom-bar {
    padding: 10px 12px;
    border-top: 1px solid var(--border-subtle);
    background-color: var(--background-secondary);
}

.enter-conversation-btn {
    width: 100%;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    font-size: var(--font-size-base);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.enter-conversation-btn:hover {
    opacity: 0.9;
}
</style>
