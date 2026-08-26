<template>
    <section class="conversation-message-search-page">
        <!-- 顶部：返回 + 搜索框 -->
        <div class="search-header">
            <div class="back-btn" @click="goBack">
                <i class="icon-ion-ios-arrow-back"></i>
            </div>
            <div class="search-input-wrapper">
                <i class="icon-ion-ios-search search-i"></i>
                <input
                    id="conversationSearchInput"
                    ref="input"
                    v-model.trim="query"
                    autocomplete="off"
                    :placeholder="inputPlaceholder"
                    @keydown.esc="clearQuery"/>
                <span v-if="query" class="clear-btn" @click="clearQuery">&#215;</span>
            </div>
        </div>

        <!-- 筛选条 -->
        <div class="filter-bar">
            <!-- 消息类型（多选） -->
            <div class="filter-item" @click.stop="toggleMenu('type')">
                <span class="filter-label" :class="{active: selectedTypes.length > 0}">{{ typeLabel }}</span>
                <i class="icon-ion-ios-arrow-down"></i>
                <div v-if="showMenu === 'type'" class="filter-menu type-menu">
                    <div v-for="opt in typeOptions" :key="opt.value"
                         class="filter-menu-item type-menu-item"
                         :class="{active: isTypeSelected(opt)}"
                         @click.stop="toggleType(opt)">
                        <span class="type-checkbox" :class="{checked: isTypeSelected(opt)}"></span>
                        {{ opt.label }}
                    </div>
                    <div class="menu-actions">
                        <button class="menu-btn" @click.stop="clearTypes">清空</button>
                        <button class="menu-btn primary" @click.stop="showMenu = null">确定</button>
                    </div>
                </div>
            </div>
            <!-- 发送人（群聊） -->
            <div v-if="isGroup" class="filter-item" @click.stop="toggleMenu('sender')">
                <span class="filter-label" :class="{active: senderValue !== 'all'}">{{ senderLabel }}</span>
                <i class="icon-ion-ios-arrow-down"></i>
                <div v-if="showMenu === 'sender'" class="filter-menu">
                    <div v-for="opt in senderOptions" :key="opt.value"
                         class="filter-menu-item" :class="{active: senderValue === opt.value}"
                         @click.stop="selectSender(opt)">{{ opt.label }}</div>
                </div>
            </div>
            <!-- 时间（快捷 + 自定义开始/结束） -->
            <div class="filter-item" @click.stop="toggleMenu('time')">
                <span class="filter-label" :class="{active: hasTimeFilter}">{{ timeLabel }}</span>
                <i class="icon-ion-ios-arrow-down"></i>
                <div v-if="showMenu === 'time'" class="filter-menu time-menu">
                    <div v-for="opt in timeQuickOptions" :key="opt.value"
                         class="filter-menu-item" :class="{active: timeValue === opt.value && !isCustomTime}"
                         @click.stop="selectTime(opt)">{{ opt.label }}</div>
                    <div class="time-divider"></div>
                    <div class="custom-time">
                        <span class="custom-time-label">开始时间</span>
                        <input v-model="customStart" type="date"/>
                    </div>
                    <div class="custom-time">
                        <span class="custom-time-label">结束时间</span>
                        <input v-model="customEnd" type="date"/>
                    </div>
                    <div class="menu-actions">
                        <button class="menu-btn" @click.stop="clearTime">清空</button>
                        <button class="menu-btn primary" @click.stop="applyCustomTime">确定</button>
                    </div>
                </div>
            </div>
            <span v-if="hasFilter" class="filter-reset" @click="resetFilters">重置</span>
        </div>

        <!-- 结果区域 -->
        <div ref="scrollContainer" class="result-container" @scroll="onScroll">
            <div v-if="!hasSearched" class="placeholder">
                <p>^~^</p>
                <p>输入关键词或选择筛选条件，搜索本会话聊天记录</p>
            </div>
            <div v-else-if="cs.loading && cs.items.length === 0" class="center-state">
                <span class="spinner"></span>
                <p>搜索中…</p>
            </div>
            <div v-else-if="cs.error && cs.items.length === 0" class="center-state">
                <p>搜索失败：{{ cs.error }}</p>
                <a class="retry-btn" @click="doSearch">重试</a>
            </div>
            <div v-else-if="cs.items.length === 0" class="center-state">
                <p>未找到匹配的消息</p>
                <p class="hint">尝试缩短关键词或调整筛选条件</p>
            </div>
            <ul v-else class="result-list">
                <li v-for="item in cs.items" :key="item.messageId" class="result-item">
                    <img class="avatar" :src="avatarOf(item.sender)" @error="onAvatarError"/>
                    <div class="item-main">
                        <div class="item-header">
                            <span class="sender-name">{{ nameOf(item.sender) }}</span>
                            <span class="item-time">{{ formatTime(item.timestamp) }}</span>
                        </div>
                        <p class="item-digest single-line" v-html="renderDigest(item.digest)"></p>
                        <div class="item-footer">
                            <span v-if="hasMediaOf(item)" class="media-tag">{{ mediaLabel(item) }}</span>
                            <span class="locate-btn" @click="locate(item)">定位</span>
                        </div>
                    </div>
                </li>
            </ul>
            <div v-if="cs.loading && cs.items.length > 0" class="load-more">加载中…</div>
            <div v-if="!cs.hasMore && cs.items.length > 0" class="no-more">没有更多了</div>
            <div v-if="cs.truncated" class="truncated-tip">结果过多，请添加更多关键词或调整筛选</div>
        </div>

        <!-- 点击空白关闭下拉 -->
        <div v-if="showMenu" class="menu-mask" @click="showMenu = null"></div>
    </section>
</template>

<script>
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";
import Config from "../../../config";
import MessageContentType from "../../../wfc/messages/messageContentType";
import ConversationType from "../../../wfc/model/conversationType";
import {renderSearchDigest} from "../../util/searchKeywordHighlight";
import {openInAppSubWindow, pushInAppSubWindow, backInAppSubWindowOrRouter, getSubWindowQuery} from "../../util/subWindowNavigator";

// 常见消息类型（多选；取值映射本项目 MessageContentType.js，服务端透传 int）
const TYPE_OPTIONS = [
    {label: '文本', value: 'text', types: [MessageContentType.Text]},
    {label: '图片', value: 'image', types: [MessageContentType.Image]},
    {label: '文件', value: 'file', types: [MessageContentType.File]},
    {label: '语音', value: 'voice', types: [MessageContentType.Voice]},
    {label: '视频', value: 'video', types: [MessageContentType.Video]},
    {label: '链接', value: 'link', types: [MessageContentType.Link]},
    {label: '位置', value: 'location', types: [MessageContentType.Location]},
    {label: '名片', value: 'card', types: [MessageContentType.UserCard]},
    {label: '收藏', value: 'collection', types: [MessageContentType.Collection]},
];

const TIME_QUICK_OPTIONS = [
    {label: '全部时间', value: 'all'},
    {label: '今天', value: 'today'},
    {label: '近 7 天', value: '7d'},
    {label: '近 30 天', value: '30d'},
];

export default {
    name: "ConversationMessageSearchPage",

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
            query: '',
            // 消息类型多选（TYPE_OPTIONS 的 value 集合）
            selectedTypes: [],
            senderValue: 'all',
            // 时间快捷项（all/today/7d/30d）+ 自定义开始/结束
            timeValue: 'all',
            customStart: '',
            customEnd: '',
            showMenu: null,
            searchTimer: null,
            hasSearched: false,
            userInfoMap: {},
        };
    },

    computed: {
        cs() {
            return store.state.search.conversationSearch;
        },
        isGroup() {
            return this.conversation && this.conversation.type === ConversationType.Group;
        },
        typeOptions() {
            return TYPE_OPTIONS;
        },
        timeQuickOptions() {
            return TIME_QUICK_OPTIONS;
        },
        typeLabel() {
            if (this.selectedTypes.length === 0) return '消息类型';
            if (this.selectedTypes.length === 1) {
                const opt = TYPE_OPTIONS.find(o => o.value === this.selectedTypes[0]);
                return opt ? opt.label : '消息类型';
            }
            return `类型(${this.selectedTypes.length})`;
        },
        senderOptions() {
            let me = wfc.getUserId();
            return [
                {label: '全部发送人', value: 'all', uid: null},
                {label: '我', value: 'me', uid: me},
            ];
        },
        senderLabel() {
            return this.optionLabel(this.senderOptions, this.senderValue);
        },
        isCustomTime() {
            return !!(this.customStart || this.customEnd);
        },
        timeLabel() {
            if (this.isCustomTime) {
                return `${this.customStart || '?'} ~ ${this.customEnd || '?'}`;
            }
            return this.optionLabel(TIME_QUICK_OPTIONS, this.timeValue);
        },
        hasTimeFilter() {
            return this.timeValue !== 'all' || this.isCustomTime;
        },
        hasFilter() {
            return this.selectedTypes.length > 0 || this.senderValue !== 'all' || this.hasTimeFilter;
        },
        inputPlaceholder() {
            return this.conversationName ? `在「${this.conversationName}」中搜索聊天记录` : '搜索本会话聊天记录';
        },
    },

    mounted() {
        const query = getSubWindowQuery(this);
        const type = Number(query.type);
        const target = query.target;
        const line = Number(query.line) || 0;
        if (!target) {
            console.error('conversation-search: 缺少会话参数 type/target/line', query);
            this.$alert({title: '提示', content: '无法获取会话信息，请从会话设置界面重新进入', confirmText: '知道了'});
            return;
        }
        this.conversation = {type, target, line};
        this.loadConversationName();
        // 恢复上次会话搜索状态（同会话内）
        if (this.cs.conversation
            && this.cs.conversation.type === type
            && this.cs.conversation.target === target
            && this.cs.conversation.line === line) {
            this.query = this.cs.query || '';
            this.restoreFiltersFromStore();
            this.hasSearched = this.cs.items.length > 0 || this.cs.error !== null;
        }
        this.$nextTick(() => {
            if (this.$refs.input) this.$refs.input.focus();
        });
    },

    beforeUnmount() {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
    },

    watch: {
        query() {
            this.scheduleSearch();
        },
    },

    methods: {
        loadConversationName() {
            if (this.conversation.type === ConversationType.Group) {
                let groupInfo = wfc.getGroupInfo(this.conversation.target, false);
                if (groupInfo && groupInfo.name) {
                    this.conversationName = groupInfo.name;
                } else {
                    wfc.getGroupInfoEx(this.conversation.target, true, (info) => {
                        if (info && info.name) this.conversationName = info.name;
                    }, () => {
                    });
                }
            } else {
                let userInfo = wfc.getUserInfo(this.conversation.target, false);
                if (userInfo && userInfo.displayName) {
                    this.conversationName = userInfo.displayName;
                } else {
                    wfc.getUserInfoEx(this.conversation.target, true, (info) => {
                        if (info && info.displayName) this.conversationName = info.displayName;
                    }, () => {
                    });
                }
            }
        },

        scheduleSearch() {
            if (this.searchTimer) clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => {
                this.hasSearched = true;
                this.doSearch();
            }, 300);
        },

        doSearch() {
            if (!this.conversation) return;
            const options = this.buildSearchOptions();
            store.searchConversationMessages(this.conversation, options).catch(e => {
                console.error('search conversation messages failed', e);
            });
        },

        buildSearchOptions() {
            // 消息类型多选：合并所有选中类型的 int 值（服务端透传）
            let contentTypes = [];
            for (const opt of TYPE_OPTIONS) {
                if (this.selectedTypes.includes(opt.value)) {
                    contentTypes = contentTypes.concat(opt.types);
                }
            }
            const senderOpt = this.senderOptions.find(s => s.value === this.senderValue) || this.senderOptions[0];
            const {startTime, endTime} = this.resolveTimeRange();
            return {
                keyword: this.query,
                contentTypes,
                fromUser: this.isGroup ? senderOpt.uid : null,
                startTime,
                endTime,
            };
        },

        resolveTimeRange() {
            // 自定义开始/结束时间优先
            if (this.customStart && this.customEnd) {
                return {
                    startTime: new Date(this.customStart + 'T00:00:00').getTime(),
                    endTime: new Date(this.customEnd + 'T23:59:59').getTime(),
                };
            }
            if (this.customStart || this.customEnd) {
                // 只填了一端：另一端按需放开（开始→当天起，结束→当天止）
                if (this.customStart) {
                    return {startTime: new Date(this.customStart + 'T00:00:00').getTime(), endTime: null};
                }
                return {startTime: null, endTime: new Date(this.customEnd + 'T23:59:59').getTime()};
            }
            const now = Date.now();
            switch (this.timeValue) {
                case 'today': {
                    const d = new Date();
                    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                    return {startTime: start, endTime: now};
                }
                case '7d':
                    return {startTime: now - 7 * 24 * 3600 * 1000, endTime: now};
                case '30d':
                    return {startTime: now - 30 * 24 * 3600 * 1000, endTime: now};
                default:
                    return {startTime: null, endTime: null};
            }
        },

        onScroll() {
            const el = this.$refs.scrollContainer;
            if (!el || !this.cs.hasMore || this.cs.loading) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
                // 触底翻页
                store.searchConversationMessages(this.conversation, {
                    ...this.buildSearchOptions(),
                    cursor: this.cs.cursor,
                }).catch(e => console.error('load more failed', e));
            }
        },

        locate(item) {
            // messageId 为字符串（64 位 ID 防精度丢失），原样传递。
            // 用 pushInAppSubWindow 压栈打开（返回时回到搜索界面，而非直接关闭）
            pushInAppSubWindow(this, '/message-context', {
                type: this.conversation.type,
                target: this.conversation.target,
                line: this.conversation.line,
                anchorMid: String(item.messageId),
                keyword: this.query || '',
                beforeCount: 10,
                afterCount: 5,
            });
        },

        toggleMenu(menu) {
            this.showMenu = this.showMenu === menu ? null : menu;
        },

        // ===== 类型多选 =====

        isTypeSelected(opt) {
            return this.selectedTypes.includes(opt.value);
        },

        toggleType(opt) {
            const idx = this.selectedTypes.indexOf(opt.value);
            if (idx >= 0) {
                this.selectedTypes.splice(idx, 1);
            } else {
                this.selectedTypes.push(opt.value);
            }
            this.refreshSearch();
        },

        clearTypes() {
            this.selectedTypes = [];
            this.refreshSearch();
        },

        selectSender(opt) {
            this.senderValue = opt.value;
            this.showMenu = null;
            this.refreshSearch();
        },

        selectTime(opt) {
            // 选快捷项时清空自定义
            this.customStart = '';
            this.customEnd = '';
            this.timeValue = opt.value;
            this.showMenu = null;
            this.refreshSearch();
        },

        applyCustomTime() {
            if (this.customStart && this.customEnd && this.customEnd < this.customStart) {
                this.$alert({title: '提示', content: '结束时间不能早于开始时间', confirmText: '知道了'});
                return;
            }
            this.timeValue = 'all';
            this.showMenu = null;
            this.refreshSearch();
        },

        clearTime() {
            this.timeValue = 'all';
            this.customStart = '';
            this.customEnd = '';
            this.refreshSearch();
        },

        refreshSearch() {
            this.hasSearched = true;
            this.doSearch();
        },

        resetFilters() {
            this.selectedTypes = [];
            this.senderValue = 'all';
            this.timeValue = 'all';
            this.customStart = '';
            this.customEnd = '';
            this.refreshSearch();
        },

        restoreFiltersFromStore() {
            // 从 store 恢复上次筛选：类型多选直接映射；发送人与时间按需恢复
            const types = this.cs.contentTypes || [];
            if (types.length > 0) {
                this.selectedTypes = TYPE_OPTIONS
                    .filter(opt => opt.types.some(v => types.includes(v)))
                    .map(opt => opt.value);
            }
            const me = wfc.getUserId();
            if (this.cs.fromUser === me) this.senderValue = 'me';
        },

        optionLabel(options, value) {
            const opt = options.find(o => o.value === value);
            return opt ? opt.label : (options[0] ? options[0].label : '');
        },

        clearQuery() {
            this.query = '';
        },

        goBack() {
            backInAppSubWindowOrRouter(this);
        },

        // ===== 展示辅助 =====

        avatarOf(uid) {
            const senderInfo = this.senderInfoOf(uid);
            if (senderInfo && senderInfo.portrait) return senderInfo.portrait;
            let info = this.userInfoMap[uid];
            if (!info) {
                info = wfc.getUserInfo(uid, false);
                if (info) this.userInfoMap[uid] = info;
            }
            return info && info.portrait ? info.portrait : Config.DEFAULT_PORTRAIT_URL;
        },

        nameOf(uid) {
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
            if (!this.cs.items) return null;
            for (const item of this.cs.items) {
                if (item.sender === uid && item.senderUserInfo) {
                    return item.senderUserInfo;
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

        /** 消息类型来自 payload.type（OutputMessageData 格式） */
        contentTypeOf(item) {
            return item && item.payload ? item.payload.type : 0;
        },

        /** 媒体类消息（图片/文件/语音/视频/链接等，依据 payload.mediaType 与类型） */
        hasMediaOf(item) {
            const type = this.contentTypeOf(item);
            const mediaType = item && item.payload ? (item.payload.mediaType || 0) : 0;
            return mediaType > 0 || [MessageContentType.Image, MessageContentType.File,
                MessageContentType.Video, MessageContentType.Voice, MessageContentType.Link].includes(type);
        },

        mediaLabel(item) {
            switch (this.contentTypeOf(item)) {
                case MessageContentType.Text: return '文本';
                case MessageContentType.Voice: return '语音';
                case MessageContentType.Image: return '图片';
                case MessageContentType.File: return '文件';
                case MessageContentType.Video: return '视频';
                case MessageContentType.Link: return '链接';
                default: return '消息';
            }
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
.conversation-message-search-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
}

/* 顶部 */
.search-header {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    gap: 8px;
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

.search-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
}

.search-input-wrapper input {
    width: 100%;
    height: 30px;
    padding: 0 28px 0 28px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    outline: none;
    background-color: var(--background-input);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.search-input-wrapper input:focus {
    border-color: var(--border-active);
}

.search-i {
    position: absolute;
    left: 8px;
    color: var(--text-secondary-strong);
}

.clear-btn {
    position: absolute;
    right: 8px;
    cursor: pointer;
    color: var(--text-secondary-strong);
}

/* 筛选条 */
.filter-bar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    gap: 8px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
    z-index: 10;
    flex-wrap: wrap;
}

.filter-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    background-color: var(--background-input);
    color: var(--text-secondary-strong);
    font-size: var(--font-size-sm);
    user-select: none;
}

.filter-label.active {
    color: var(--accent-color);
}

.filter-reset {
    margin-left: auto;
    color: var(--accent-color);
    font-size: var(--font-size-sm);
    cursor: pointer;
}

.filter-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 120px;
    background-color: var(--background-tooltip);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-tooltip);
    padding: 4px;
    z-index: 100;
}

.filter-menu-item {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-primary);
    white-space: nowrap;
    font-size: var(--font-size-sm);
}

.filter-menu-item:hover {
    background-color: var(--background-item-hover);
}

.filter-menu-item.active {
    color: var(--accent-color);
    background-color: var(--background-item-active);
}

/* 类型多选 */
.type-menu {
    min-width: 160px;
}

.type-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.type-checkbox {
    width: 14px;
    height: 14px;
    border: 1px solid var(--border-primary);
    border-radius: 3px;
    flex-shrink: 0;
    position: relative;
}

.type-checkbox.checked {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
}

.type-checkbox.checked::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid var(--text-on-accent);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

/* 菜单底部操作 */
.menu-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid var(--border-subtle);
    margin-top: 4px;
}

.menu-btn {
    border: 1px solid var(--border-primary);
    background-color: var(--background-input);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    padding: 4px 12px;
    cursor: pointer;
    font-size: var(--font-size-sm);
}

.menu-btn.primary {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: var(--text-on-accent);
}

/* 时间自定义 */
.time-divider {
    height: 1px;
    background-color: var(--border-subtle);
    margin: 6px 10px;
}

.custom-time {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: var(--font-size-sm);
}

.custom-time-label {
    color: var(--text-secondary);
    white-space: nowrap;
    font-size: var(--font-size-xs);
}

.custom-time input {
    width: 130px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background-color: var(--background-input);
    color: var(--text-primary);
    padding: 4px 6px;
}

.menu-mask {
    position: fixed;
    inset: 0;
    z-index: 5;
}

/* 结果 */
.result-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
}

.placeholder, .center-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60%;
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    gap: 8px;
}

.hint {
    font-size: var(--font-size-sm);
    color: var(--text-secondary-weak);
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

.result-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.result-item {
    display: flex;
    gap: 10px;
    padding: 10px 8px;
    border-radius: var(--radius-md);
    cursor: default;
}

.result-item:hover {
    background-color: var(--background-item-hover);
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
}

.item-main {
    flex: 1;
    min-width: 0;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
}

.sender-name {
    color: var(--text-secondary-strong);
    font-size: var(--font-size-sm);
}

.item-time {
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
}

.item-digest {
    margin: 4px 0;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    word-break: break-all;
}

.item-digest :deep(mark) {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
    border-radius: 2px;
    padding: 0 1px;
}

.item-footer {
    display: flex;
    align-items: center;
    gap: 10px;
}

.media-tag {
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xs);
    padding: 1px 6px;
}

.locate-btn {
    color: var(--accent-color);
    font-size: var(--font-size-sm);
    cursor: pointer;
}

.locate-btn:hover {
    text-decoration: underline;
}

.load-more, .no-more {
    text-align: center;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-sm);
    padding: 12px 0;
}

.truncated-tip {
    text-align: center;
    color: var(--text-warning, #d97706);
    font-size: var(--font-size-sm);
    padding: 8px 0;
}
</style>
