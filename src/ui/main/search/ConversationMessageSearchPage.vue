<template>
    <section class="conversation-message-search-page">
        <!-- 顶部：返回 + 搜索框 -->
        <div class="search-header" :class="{'in-sub-window': inSubWindow}">
            <!-- 子窗口里本页是栈底，返回等同于关闭，与宿主右上角的关闭按钮重复；
                 仅独立路由页（无关闭按钮）才展示返回 -->
            <div v-if="!inSubWindow" class="back-btn" @click="goBack">
                <i class="icon-ion-ios-arrow-back"></i>
            </div>
            <div class="search-input-wrapper">
                <i class="icon-ion-ios-search search-i"></i>
                <input
                    id="conversationSearchInput"
                    ref="input"
                    v-model="query"
                    autocomplete="off"
                    :placeholder="inputPlaceholder"
                    @keydown.enter="searchNow"
                    @keydown.esc="clearQuery"/>
                <span v-if="query" class="clear-btn" title="清空" @click="clearQuery">&#215;</span>
            </div>
        </div>

        <!-- 筛选条 -->
        <div class="filter-bar">
            <!-- 消息类型（多选） -->
            <div class="filter-item" :class="{active: selectedTypes.length > 0}" @click.stop="toggleMenu('type')">
                <span class="filter-label">{{ typeLabel }}</span>
                <i class="icon-ion-ios-arrow-down"></i>
                <div v-if="showMenu === 'type'" class="filter-menu type-menu" @click.stop>
                    <div class="menu-scroll">
                        <div v-for="opt in typeOptions" :key="opt.value"
                             class="filter-menu-item type-menu-item"
                             :class="{active: isTypeSelected(opt)}"
                             @click="toggleType(opt)">
                            <span class="type-checkbox" :class="{checked: isTypeSelected(opt)}"></span>
                            {{ opt.label }}
                        </div>
                    </div>
                    <div class="menu-actions">
                        <button class="menu-btn" @click="clearTypes">清空</button>
                        <button class="menu-btn primary" @click="showMenu = null">确定</button>
                    </div>
                </div>
            </div>

            <!-- 发送人（群聊：按群成员筛选） -->
            <div v-if="isGroup" class="filter-item" :class="{active: senderUid !== null}" @click.stop="toggleMenu('sender')">
                <span class="filter-label">{{ senderLabel }}</span>
                <i class="icon-ion-ios-arrow-down"></i>
                <div v-if="showMenu === 'sender'" class="filter-menu sender-menu" @click.stop>
                    <input v-model="memberKeyword" class="menu-search" placeholder="搜索群成员"/>
                    <div class="menu-scroll">
                        <div class="filter-menu-item" :class="{active: senderUid === null}"
                             @click="selectSender(null)">全部发送人
                        </div>
                        <div v-for="m in filteredMembers" :key="m.uid"
                             class="filter-menu-item member-item" :class="{active: senderUid === m.uid}"
                             @click="selectSender(m.uid)">
                            <img class="member-avatar" :src="m.portrait || defaultPortrait" @error="onAvatarError"/>
                            <span class="single-line">{{ m.displayName || m.uid }}</span>
                            <span v-if="m.uid === selfUid" class="self-tag">我</span>
                        </div>
                        <div v-if="filteredMembers.length === 0" class="menu-empty">没有匹配的成员</div>
                    </div>
                </div>
            </div>

            <!-- 时间（快捷 + 自定义开始/结束） -->
            <div class="filter-item" :class="{active: hasTimeFilter}" @click.stop="toggleMenu('time')">
                <span class="filter-label">{{ timeLabel }}</span>
                <i class="icon-ion-ios-arrow-down"></i>
                <div v-if="showMenu === 'time'" class="filter-menu time-menu" @click.stop>
                    <div v-for="opt in timeQuickOptions" :key="opt.value"
                         class="filter-menu-item" :class="{active: timeValue === opt.value && !isCustomTime}"
                         @click="selectTime(opt)">{{ opt.label }}</div>
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
                        <button class="menu-btn" @click="clearTime">清空</button>
                        <button class="menu-btn primary" @click="applyCustomTime">确定</button>
                    </div>
                </div>
            </div>

            <span v-if="hasFilter" class="filter-reset" @click="resetFilters">重置筛选</span>
        </div>

        <!-- 结果统计 -->
        <div v-if="showSummary" class="result-summary">
            <span v-if="cs.query">找到 <b>{{ resultCountLabel }}</b> 条与「{{ cs.query }}」相关的消息</span>
            <span v-else>按筛选条件浏览到 <b>{{ resultCountLabel }}</b> 条消息</span>
            <span v-if="cs.truncated" class="summary-tip">结果过多，建议补充关键词或缩小时间范围</span>
        </div>

        <!-- 结果区域 -->
        <div ref="scrollContainer" class="result-container" @scroll="onScroll">
            <!-- 搜索服务不可用 -->
            <div v-if="!serviceAvailable" class="center-state">
                <i class="icon-ion-ios-search state-icon"></i>
                <p>搜索服务未配置</p>
                <p class="hint">请联系管理员开启服务端消息搜索</p>
            </div>
            <!-- 未输入关键词，也未设置筛选 -->
            <div v-else-if="!canSearch" class="center-state">
                <i class="icon-ion-ios-search state-icon"></i>
                <p>输入关键词搜索，或直接按条件筛选浏览</p>
                <p class="hint">可按消息类型{{ isGroup ? '、发送人' : '' }}、时间筛选本会话聊天记录</p>
            </div>
            <!-- 首屏加载：骨架屏 -->
            <ul v-else-if="searching && cs.items.length === 0" class="skeleton-list">
                <li v-for="i in 5" :key="i" class="skeleton-item">
                    <span class="skeleton-avatar"></span>
                    <div class="skeleton-main">
                        <span class="skeleton-line short"></span>
                        <span class="skeleton-line"></span>
                    </div>
                </li>
            </ul>
            <!-- 出错 -->
            <div v-else-if="cs.error && cs.items.length === 0" class="center-state">
                <p>搜索失败：{{ cs.error }}</p>
                <a class="retry-btn" @click="searchNow">重试</a>
            </div>
            <!-- 空结果 -->
            <div v-else-if="cs.items.length === 0" class="center-state">
                <i class="icon-ion-ios-search state-icon"></i>
                <p>未找到匹配的消息</p>
                <p class="hint">
                    <template v-if="hasKeyword">换个关键词试试</template>
                    <template v-else>调整筛选条件试试</template>
                    <template v-if="hasFilter">，或<a class="inline-link" @click="resetFilters">清除筛选条件</a></template>
                </p>
            </div>
            <!-- 结果列表：按日期分组 -->
            <template v-else>
                <div v-for="group in groupedItems" :key="group.label" class="result-group">
                    <div class="group-header">{{ group.label }}</div>
                    <ul class="result-list">
                        <li v-for="item in group.items" :key="item.messageId" class="result-item" @click="locate(item)">
                            <img class="avatar" :src="portraitOf(item.sender)" @error="onAvatarError"/>
                            <div class="item-main">
                                <div class="item-header">
                                    <span class="sender-name single-line">{{ nameOf(item.sender) }}</span>
                                    <span class="item-time">{{ formatTime(item.timestamp) }}</span>
                                </div>
                                <p class="item-digest" v-html="renderDigest(item.digest) || '[无摘要]'"></p>
                                <div class="item-footer">
                                    <span v-if="typeTagOf(item)" class="media-tag">{{ typeTagOf(item) }}</span>
                                    <span class="locate-hint">查看上下文<i class="icon-ion-ios-arrow-right"></i></span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div v-if="cs.loading" class="load-more"><span class="mini-spinner"></span>加载中…</div>
                <div v-else-if="!cs.hasMore" class="no-more">没有更多了</div>
            </template>
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
import searchServerApi from "../../../api/searchServerApi";
import {renderSearchDigest} from "../../util/searchKeywordHighlight";
import {pushInAppSubWindow, backInAppSubWindowOrRouter, getSubWindowQuery, isInAppSubWindow} from "../../util/subWindowNavigator";

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

const SEARCH_DEBOUNCE = 300;
// 群成员下拉一次最多渲染的条数（大群下避免长列表卡顿，配合搜索框收敛）
const MEMBER_RENDER_LIMIT = 50;

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
            // 发送人 uid，null = 全部（仅群聊有效）
            senderUid: null,
            groupMembers: [],
            memberKeyword: '',
            // 时间快捷项（all/today/7d/30d）+ 自定义开始/结束
            timeValue: 'all',
            customStart: '',
            customEnd: '',
            showMenu: null,
            searchTimer: null,
            // 输入抖动期间（请求尚未发出）也算"搜索中"，避免闪现"未找到"
            pendingSearch: false,
            selfUid: wfc.getUserId(),
            defaultPortrait: Config.DEFAULT_PORTRAIT_URL,
            serviceAvailable: searchServerApi.isServiceAvailable,
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
        hasKeyword() {
            return !!this.query.trim();
        },
        // 有关键字，或设置了任一筛选条件即可检索：
        // 空关键字 + 筛选 = 服务端的"仅按筛选浏览"。两者都没有时停在待输入态，不做无条件全量浏览。
        canSearch() {
            return this.hasKeyword || this.hasFilter;
        },
        resultCountLabel() {
            return this.cs.truncated ? this.cs.total + '+' : this.cs.items.length;
        },
        searching() {
            return this.pendingSearch || this.cs.loading;
        },
        showSummary() {
            return this.canSearch && !this.searching && !this.cs.error && this.cs.items.length > 0;
        },
        typeLabel() {
            if (this.selectedTypes.length === 0) return '消息类型';
            if (this.selectedTypes.length === 1) {
                const opt = TYPE_OPTIONS.find(o => o.value === this.selectedTypes[0]);
                return opt ? opt.label : '消息类型';
            }
            return `类型(${this.selectedTypes.length})`;
        },
        senderLabel() {
            if (this.senderUid === null) return '全部发送人';
            if (this.senderUid === this.selfUid) return '我';
            const m = this.groupMembers.find(u => u.uid === this.senderUid);
            return (m && m.displayName) ? m.displayName : this.senderUid;
        },
        // 群成员下拉：自己置顶，按关键词过滤，限制渲染条数
        filteredMembers() {
            const kw = this.memberKeyword.trim().toLowerCase();
            let members = this.groupMembers;
            if (kw) {
                members = members.filter(u => (u.displayName || '').toLowerCase().indexOf(kw) >= 0
                    || (u.name || '').toLowerCase().indexOf(kw) >= 0);
            }
            const self = members.filter(u => u.uid === this.selfUid);
            const others = members.filter(u => u.uid !== this.selfUid);
            return self.concat(others).slice(0, MEMBER_RENDER_LIMIT);
        },
        isCustomTime() {
            return !!(this.customStart || this.customEnd);
        },
        timeLabel() {
            if (this.isCustomTime) {
                return `${this.customStart || '不限'} ~ ${this.customEnd || '不限'}`;
            }
            return this.optionLabel(TIME_QUICK_OPTIONS, this.timeValue);
        },
        hasTimeFilter() {
            return this.timeValue !== 'all' || this.isCustomTime;
        },
        hasFilter() {
            return this.selectedTypes.length > 0 || this.senderUid !== null || this.hasTimeFilter;
        },
        inputPlaceholder() {
            return this.conversationName ? `在「${this.conversationName}」中搜索聊天记录` : '搜索本会话聊天记录';
        },
        // 子窗口右上角有宿主的关闭按钮，顶部需要给它让出位置
        inSubWindow() {
            return isInAppSubWindow(this);
        },
        /**
         * 发送人展示信息：服务端 senderUserInfo 优先，回退本地用户信息缓存。
         * 每次 items 变化只算一遍，避免逐行渲染时的 O(n^2) 查找。
         */
        senderMap() {
            const map = {};
            for (const item of this.cs.items) {
                const uid = item.sender;
                if (!uid || map[uid]) {
                    continue;
                }
                const info = item.senderUserInfo || wfc.getUserInfo(uid, false) || {};
                map[uid] = {
                    name: info.displayName || info.name || uid,
                    portrait: info.portrait || Config.DEFAULT_PORTRAIT_URL,
                };
            }
            return map;
        },
        // 结果按日期分组（今天/昨天/具体日期），便于快速定位
        groupedItems() {
            const groups = [];
            let current = null;
            for (const item of this.cs.items) {
                const label = this.dayLabel(item.timestamp);
                if (!current || current.label !== label) {
                    current = {label, items: []};
                    groups.push(current);
                }
                current.items.push(item);
            }
            return groups;
        },
    },

    mounted() {
        const query = getSubWindowQuery(this);
        const type = Number(query.type);
        const target = query.target;
        const line = Number(query.line) || 0;
        if (!target || (type !== ConversationType.Single && type !== ConversationType.Group)) {
            console.error('conversation-search: 会话参数非法 type/target/line', query);
            this.$alert({title: '提示', content: '仅支持在单聊/群聊中搜索聊天记录', confirmText: '知道了'});
            return;
        }
        this.conversation = {type, target, line};
        this.loadConversationName();
        if (type === ConversationType.Group) {
            this.loadGroupMembers();
        }
        // 搜索是一次性的：每次进入都从干净状态开始，不恢复上次的关键词与结果
        store.resetConversationSearch();
        this.$nextTick(() => {
            if (this.$refs.input) this.$refs.input.focus();
        });
    },

    beforeUnmount() {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
        // 退出搜索页即清空搜索状态（关键词/筛选/结果均不保留）
        store.resetConversationSearch();
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

        // 群成员用于"发送人"筛选；本地无缓存时拉一次再读
        loadGroupMembers() {
            const groupId = this.conversation.target;
            this.groupMembers = store.getGroupMemberUserInfos(groupId, true);
            if (this.groupMembers.length === 0) {
                wfc.getGroupMembersEx(groupId, true, () => {
                    this.groupMembers = store.getGroupMemberUserInfos(groupId, true);
                }, () => {
                });
            }
        },

        scheduleSearch() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
                this.searchTimer = null;
            }
            if (!this.canSearch) {
                // 关键字与筛选都为空：清空结果，回到"待输入"状态，不发请求
                this.pendingSearch = false;
                store.resetConversationSearch();
                return;
            }
            this.pendingSearch = true;
            this.searchTimer = setTimeout(() => {
                this.searchTimer = null;
                this.doSearch();
            }, SEARCH_DEBOUNCE);
        },

        // 立即搜索（回车 / 重试 / 筛选变更），跳过输入抖动等待
        searchNow() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
                this.searchTimer = null;
            }
            if (!this.canSearch) {
                this.pendingSearch = false;
                store.resetConversationSearch();
                return;
            }
            this.doSearch();
        },

        doSearch() {
            if (!this.conversation || !this.canSearch) {
                this.pendingSearch = false;
                return;
            }
            this.pendingSearch = true;
            const options = this.buildSearchOptions();
            store.searchConversationMessages(this.conversation, options)
                .catch(e => {
                    console.error('search conversation messages failed', e);
                })
                .finally(() => {
                    this.pendingSearch = false;
                    const el = this.$refs.scrollContainer;
                    if (el) el.scrollTop = 0;
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
            const {startTime, endTime} = this.resolveTimeRange();
            return {
                keyword: this.query.trim(),
                contentTypes,
                fromUser: this.isGroup ? this.senderUid : null,
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
            if (!el || !this.cs.hasMore || this.searching || !this.canSearch) return;
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
            const {contentTypes, fromUser, startTime, endTime} = this.buildSearchOptions();
            pushInAppSubWindow(this, '/message-context', {
                type: this.conversation.type,
                target: this.conversation.target,
                line: this.conversation.line,
                anchorMid: String(item.messageId),
                keyword: this.query.trim(),
                // 一并带上筛选条件：服务端据此标记命中并计算上一处/下一处
                // （上下文消息流本身不过滤）。仅按筛选浏览时，这是命中导航唯一的依据。
                // contentTypes 用逗号串，兼容 router query 与子窗口 query 两种传参
                contentTypes: contentTypes.join(','),
                fromUser: fromUser || '',
                startTime: startTime || '',
                endTime: endTime || '',
                beforeCount: 10,
                afterCount: 5,
            });
        },

        toggleMenu(menu) {
            this.showMenu = this.showMenu === menu ? null : menu;
            if (this.showMenu === 'sender') {
                this.memberKeyword = '';
            }
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
            this.searchNow();
        },

        clearTypes() {
            this.selectedTypes = [];
            this.searchNow();
        },

        selectSender(uid) {
            this.senderUid = uid;
            this.showMenu = null;
            this.searchNow();
        },

        selectTime(opt) {
            // 选快捷项时清空自定义
            this.customStart = '';
            this.customEnd = '';
            this.timeValue = opt.value;
            this.showMenu = null;
            this.searchNow();
        },

        applyCustomTime() {
            if (this.customStart && this.customEnd && this.customEnd < this.customStart) {
                this.$alert({title: '提示', content: '结束时间不能早于开始时间', confirmText: '知道了'});
                return;
            }
            this.timeValue = 'all';
            this.showMenu = null;
            this.searchNow();
        },

        clearTime() {
            this.timeValue = 'all';
            this.customStart = '';
            this.customEnd = '';
            this.searchNow();
        },

        resetFilters() {
            this.selectedTypes = [];
            this.senderUid = null;
            this.timeValue = 'all';
            this.customStart = '';
            this.customEnd = '';
            this.showMenu = null;
            this.searchNow();
        },

        optionLabel(options, value) {
            const opt = options.find(o => o.value === value);
            return opt ? opt.label : (options[0] ? options[0].label : '');
        },

        clearQuery() {
            this.query = '';
            if (this.$refs.input) this.$refs.input.focus();
        },

        goBack() {
            backInAppSubWindowOrRouter(this);
        },

        // ===== 展示辅助 =====

        portraitOf(uid) {
            const info = this.senderMap[uid];
            return info ? info.portrait : Config.DEFAULT_PORTRAIT_URL;
        },

        nameOf(uid) {
            const info = this.senderMap[uid];
            return info ? info.name : uid;
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

        /** 非文本消息展示类型标签；文本消息不加标签，避免噪音 */
        typeTagOf(item) {
            switch (this.contentTypeOf(item)) {
                case MessageContentType.Voice: return '语音';
                case MessageContentType.Image: return '图片';
                case MessageContentType.File: return '文件';
                case MessageContentType.Video: return '视频';
                case MessageContentType.Link: return '链接';
                case MessageContentType.Location: return '位置';
                case MessageContentType.UserCard: return '名片';
                case MessageContentType.Collection: return '收藏';
                default: return '';
            }
        },

        /** 日期分组标题：今天 / 昨天 / yyyy-MM-dd */
        dayLabel(ts) {
            const d = new Date(ts);
            const pad = n => String(n).padStart(2, '0');
            const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const now = new Date();
            const todayYmd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            if (ymd === todayYmd) return '今天';
            const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
            const yestYmd = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
            if (ymd === yestYmd) return '昨天';
            return ymd;
        },

        /** 组内只显示时分（日期由分组标题承载） */
        formatTime(ts) {
            const d = new Date(ts);
            const pad = n => String(n).padStart(2, '0');
            return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

/* SubWindowHost 的关闭按钮浮在右上角（right: 12px，24px 宽），
   不让位的话会和输入框的清空按钮重叠 */
.search-header.in-sub-window {
    padding-right: 44px;
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
    flex-shrink: 0;
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
    height: 32px;
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
    font-size: 16px;
    line-height: 1;
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
    border-radius: 999px;
    cursor: pointer;
    background-color: var(--background-input);
    color: var(--text-secondary-strong);
    font-size: var(--font-size-sm);
    user-select: none;
    max-width: 220px;
}

.filter-item:hover {
    border-color: var(--border-active);
}

.filter-item.active {
    color: var(--accent-color);
    border-color: var(--accent-color);
}

.filter-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.filter-reset {
    margin-left: auto;
    color: var(--accent-color);
    font-size: var(--font-size-sm);
    cursor: pointer;
}

.filter-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 140px;
    background-color: var(--background-tooltip);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-tooltip);
    padding: 4px;
    z-index: 100;
    cursor: default;
}

.menu-scroll {
    max-height: 260px;
    overflow-y: auto;
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

.menu-empty {
    padding: 10px 12px;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-sm);
    text-align: center;
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

/* 发送人（群成员） */
.sender-menu {
    min-width: 220px;
}

.menu-search {
    width: 100%;
    height: 28px;
    margin-bottom: 4px;
    padding: 0 8px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    outline: none;
    background-color: var(--background-input);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.member-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.member-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.self-tag {
    margin-left: auto;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
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

/* 结果统计 */
.result-summary {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 6px 14px;
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    border-bottom: 1px solid var(--border-subtle);
}

.result-summary b {
    color: var(--text-primary);
}

.summary-tip {
    color: var(--text-warning, #d97706);
}

/* 结果 */
.result-container {
    flex: 1;
    overflow-y: auto;
    padding: 4px 12px 8px 12px;
}

.center-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 70%;
    color: var(--text-secondary);
    font-size: var(--font-size-base);
    gap: 8px;
    text-align: center;
}

.state-icon {
    font-size: 40px;
    color: var(--text-secondary-weak);
    opacity: .5;
}

.hint {
    font-size: var(--font-size-sm);
    color: var(--text-secondary-weak);
}

.retry-btn, .inline-link {
    color: var(--accent-color);
    cursor: pointer;
}

/* 骨架屏 */
.skeleton-list {
    list-style: none;
    margin: 0;
    padding: 8px 0 0 0;
}

.skeleton-item {
    display: flex;
    gap: 10px;
    padding: 10px 8px;
}

.skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
}

.skeleton-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
}

.skeleton-line {
    height: 12px;
    border-radius: 6px;
}

.skeleton-line.short {
    width: 30%;
}

.skeleton-avatar, .skeleton-line {
    background: linear-gradient(90deg,
    var(--background-item-hover) 25%,
    var(--background-item-active) 37%,
    var(--background-item-hover) 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
    0% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0 50%;
    }
}

/* 日期分组 */
.group-header {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 8px 8px 4px 8px;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-xs);
    background-color: var(--background-primary);
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
    cursor: pointer;
}

.result-item:hover {
    background-color: var(--background-item-hover);
}

.result-item:hover .locate-hint {
    opacity: 1;
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
    flex-shrink: 0;
}

.item-digest {
    margin: 4px 0;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.item-digest :deep(mark) {
    background-color: transparent;
    color: var(--accent-color);
    font-weight: 600;
    padding: 0;
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

.locate-hint {
    margin-left: auto;
    color: var(--accent-color);
    font-size: var(--font-size-xs);
    opacity: 0;
    transition: opacity .15s;
    display: flex;
    align-items: center;
    gap: 2px;
}

.load-more, .no-more {
    text-align: center;
    color: var(--text-secondary-weak);
    font-size: var(--font-size-sm);
    padding: 12px 0;
}

/* 翻页加载中的转圈动画 */
.load-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.mini-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-primary);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    flex-shrink: 0;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
