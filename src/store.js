import ConnectionStatus from "./wfc/client/connectionStatus";
import wfc from "./wfc/client/wfc";
import EventType from "./wfc/client/wfcEvent";
import ConversationType from "./wfc/model/conversationType";
import {eq, gt, lt, numberValue} from "./wfc/util/longUtil";
import helper from "./ui/util/helper";
import convert from './vendor/pinyin'
import GroupType from "./wfc/model/groupType";
import {imageThumbnail, videoDuration, videoThumbnail} from "./ui/util/imageUtil";
import MessageContentMediaType from "./wfc/messages/messageContentMediaType";
import Conversation from "./wfc/model/conversation";
import MessageContentType from "./wfc/messages/messageContentType";
import MessageStatus from './wfc/messages/messageStatus';
import Message from "./wfc/messages/message";
import ImageMessageContent from "./wfc/messages/imageMessageContent";
import VideoMessageContent from "./wfc/messages/videoMessageContent";
import FileMessageContent from "./wfc/messages/fileMessageContent";
import Push from "push.js";
import MessageConfig from "./wfc/client/messageConfig";
import PersistFlag from "./wfc/messages/persistFlag";
import ForwardType from "./ui/main/conversation/message/forward/ForwardType";
import TextMessageContent from "./wfc/messages/textMessageContent";
import {currentWindow, ipcRenderer, isElectron} from "./platform";
import SearchType from "./wfc/model/searchType";
import Config from "./config";
import searchServerApi from "./api/searchServerApi";
import {getItem, setItem} from "./ui/util/storageHelper";
import watermark from "./ui/util/waterMark";
import CompositeMessageContent from "./wfc/messages/compositeMessageContent";
import {stringValue, longValue} from "./wfc/util/longUtil";
import DismissGroupNotification from "./wfc/messages/notification/dismissGroupNotification";
import KickoffGroupMemberNotification from "./wfc/messages/notification/kickoffGroupMemberNotification";
import QuitGroupNotification from "./wfc/messages/notification/quitGroupNotification";
import avenginekitproxy from "./wfc/av/engine/avenginekitproxy";
import MediaMessageContent from "./wfc/messages/mediaMessageContent";
import UnreadCount from "./wfc/model/unreadCount";
import LeaveChannelChatMessageContent from "./wfc/messages/leaveChannelChatMessageContent";
import EnterChannelChatMessageContent from "./wfc/messages/enterChannelChatMessageContent";
import ArticlesMessageContent from "./wfc/messages/articlesMessageContent";
import NullGroupInfo from "./wfc/model/nullGroupInfo";
import IPCEventType from "./ipcEventType";
import NullChannelInfo from "./wfc/model/NullChannelInfo";
import ModifyGroupSettingNotification from "./wfc/messages/notification/modifyGroupSettingNotification";
import {storeToRefs} from 'pinia'
import {pstore} from './pstore'
import {toRaw} from 'vue'

import CallStartMessageContent from "./wfc/av/messages/callStartMessageContent";
import SoundMessageContent from "./wfc/messages/soundMessageContent";
import MixMultiMediaTextMessageContent from "./wfc/messages/mixMultiMediaTextMessageContent";
import MixFileTextMessageContent from "./wfc/messages/mixFileTextMessageContent";
import Long from "long";
import StreamingTextGeneratedMessageContent from './wfc/messages/streamingTextGeneratedMessageContent'
import StreamingTextGeneratingMessageContent from './wfc/messages/streamingTextGeneratingMessageContent'
import StreamingTextCancelledMessageContent from './wfc/messages/streamingTextCancelledMessageContent'

/**
 * 一些说明
 * _开头的字段，是为了UI层展示方便，而打补丁上出去的
 * __开头的字段，仅内部使用
 * _开头的函数，是内部函数
 * 外部不直接更新字段，而是通过提供各种action方法更新
 */

// 拼音转换是纯 CPU 开销，且同一个名字的转换结果不变，缓存起来，避免联系人列表每次重载时全量重算
const pinyinCache = new Map();

// String.prototype.localeCompare 每次调用都要重新解析 locale 并构造排序规则，联系人上万时
// 一次排序有十几万次比较，开销很可观。复用同一个 Collator，语义不变但快一个数量级
const nameCollator = new Intl.Collator();
function convertPinyinCached(name) {
    if (!name || typeof name !== 'string') {
        return { pinyin: '', firstLetters: '' };
    }
    let entry = pinyinCache.get(name);
    if (!entry) {
        entry = {
            pinyin: convert(name, {style: 0}).join('').trim().toLowerCase(),
            firstLetters: convert(name, {style: 4}).join('').trim().toLowerCase(),
        };
        if (pinyinCache.size > 10000) {
            pinyinCache.clear();
        }
        pinyinCache.set(name, entry);
    }
    return entry;
}
let store = {
    debug: true,
    state: {
        conversation: null,
        contact: null,
        search: null,
        pick: null,
        misc: null,
    },
    storeId: '',
    _wfcListeners: [],
    _reloadTimers: null,
    // 待合并处理的群成员更新事件对应的群 id，详见 EventType.GroupMembersUpdate 监听
    _pendingGroupMemberUpdateGroupIds: new Set(),

    _addWfcListener(eventName, handler) {
        wfc.eventEmitter.on(eventName, handler);
        this._wfcListeners.push({eventName, handler});
        return handler;
    },

    removeAllWfcListeners() {
        if (!this._wfcListeners || this._wfcListeners.length === 0) {
            return;
        }
        this._wfcListeners.forEach(({eventName, handler}) => {
            if (typeof wfc.eventEmitter.off === 'function') {
                wfc.eventEmitter.off(eventName, handler);
            } else {
                wfc.eventEmitter.removeListener(eventName, handler);
            }
        });
        this._wfcListeners = [];
    },

    removeAllListeners() {
        this.removeAllWfcListeners();
    },

    init(isMainWindow, subWindowLoadDataOptions, subStoreId = 'subStore') {
        console.log('init store')

        this.removeAllListeners();
        this._cancelDeferredReloads();

        this.storeId = isMainWindow ? 'mainStore' : subStoreId;
        const {conversationStore, contactStore, pickStore, searchStore, miscStore} = storeToRefs(pstore(this.storeId));
        this.state.conversation = conversationStore.value;
        this.state.contact = contactStore.value;
        this.state.search = searchStore.value;
        this.state.pick = pickStore.value;
        this.state.misc = miscStore.value;

        this.state.misc.connectionStatus = wfc.getConnectionStatus();
        // 初始化时检查锁定状态
        this.state.misc.isLocked = wfc.isLocked();
        this._addWfcListener(EventType.ConnectionStatusChanged, (status) => {
            console.log('store ConnectionStatusChanged', status, ConnectionStatus.desc(status));
            this.state.contact.isEnableMesh = wfc.isEnableMesh();
            this.state.misc.connectionStatus = status;
            this.state.misc.isCommercialServer = wfc.isCommercialServer();
            this.state.misc.isDisableSyncDraft = wfc.isDisableSyncDraft();
            try {
                if (status === ConnectionStatus.ConnectionStatusConnected) {
                    // 连接成功后检查锁定状态
                    this.state.misc.isLocked = wfc.isLocked();
                    this._loadDefaultData();

                    this.updateTray();
                } else if (status === ConnectionStatus.ConnectionStatusLogout
                    || status === ConnectionStatus.ConnectionStatusRejected
                    || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
                    || status === ConnectionStatus.ConnectionStatusKickedOff
                    || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
                    this._reset();
                    this.updateTray();
                }
            } catch (e) {
                // do nothing
            }
        });

        this._addWfcListener(EventType.UserInfosUpdate, (userInfos) => {
            console.log('store UserInfosUpdate', userInfos.length, this.state.misc.connectionStatus)
            this._reloadSingleConversationIfExist(userInfos);
            let updatedUidSet = new Set(userInfos.map(u => u.uid));
            // 只有更新的用户出现在当前会话消息里时，才需要重新 patch 当前会话消息
            let msgs = this.state.conversation.currentConversationMessageList;
            if (msgs && msgs.length > 0 && msgs.some(m => updatedUidSet.has(m.from))) {
                this._deferPatchCurrentConversationMessages();
            }
            this._deferLoadFriendList();
            this._deferLoadFriendRequest();
            let selfUid = this.state.contact.selfUserInfo ? this.state.contact.selfUserInfo.uid : wfc.getUserId();
            if (updatedUidSet.has(selfUid)) {
            	this._loadSelfUserInfo();
            }
            // TODO 其他相关逻辑
        });

        this._addWfcListener(EventType.SettingUpdate, () => {
            console.log('store SettingUpdate')
            // 检查锁定状态变化
            const newLockedState = wfc.isLocked();
            if (this.state.misc.isLocked !== newLockedState) {
                this.state.misc.isLocked = newLockedState;
                console.log('lock state changed:', newLockedState);
            }
            this._deferLoadDefaultConversationList();
            this._deferLoadFavContactList();
            this._deferLoadFavGroupList();
            // 清除远程消息时，WEB SDK会同时触发ConversationInfoUpdate 和 setting更新，但PC SDK不会，只会触发setting更新
            // if (isElectron()) {
            //     this._loadCurrentConversationMessages();
            // }
        });

        this._addWfcListener(EventType.FriendRequestUpdate, (newFrs) => {
            this._deferLoadFriendRequest();
        });

        this._addWfcListener(EventType.FriendListUpdate, (updatedFriendIds) => {
            console.log('FriendListUpdate', updatedFriendIds);
            this._deferLoadFriendList();
            this._deferLoadFriendRequest();
            this._deferLoadFavContactList();
            this._deferLoadDefaultConversationList();
            this._deferPatchCurrentConversationMessages();
        });

        this._addWfcListener(EventType.GroupInfosUpdate, (groupInfos) => {
            // TODO optimize
            console.log('store GroupInfosUpdate', groupInfos.length)
            this._reloadGroupConversationIfExist(groupInfos);
            this._deferLoadFavGroupList();
            // TODO 其他相关逻辑

        });

        this._addWfcListener(EventType.GroupMembersUpdate, (groupId, members) => {
            // 初次登录同步时，SDK 会为每个群逐一回调群成员更新，群很多时这里会被连续调用成百上千次。
            // 单次处理要走 getConversationInfo/getGroupInfo/isFavGroup 等多次同步 IPC，还会对整个会话
            // 列表做一次排序，逐个处理会把渲染进程主线程打满，表现为主页大面积白屏、卡死。
            // 这里先把 groupId 攒起来，去抖后合并处理；群数量多时 _reloadGroupConversationIfExist
            // 会自动退化成一次全量会话列表重载。
            this._pendingGroupMemberUpdateGroupIds.add(groupId);
            this._deferReload('groupMemberUpdate', () => this._flushPendingGroupMemberUpdates());
            // this._loadFavGroupList();
            if (this.state.conversation.currentConversationInfo && this.state.conversation.currentConversationInfo.conversation.type === ConversationType.Group
                && this.state.conversation.currentConversationInfo.conversation.target === groupId) {
                this._deferPatchCurrentConversationMessages();
            }

            // TODO 其他相关逻辑
        });

        this._addWfcListener(EventType.ChannelInfosUpdate, (groupInfos) => {
            this._deferLoadDefaultConversationList();
            this._deferLoadChannelList();
        });

        this._addWfcListener(EventType.ConversationInfoUpdate, (conversationInfo) => {
            this._reloadConversation(conversationInfo.conversation)
            // if (this.state.conversation.currentConversationInfo && this.state.conversation.currentConversationInfo.conversation.equal(conversationInfo.conversation)) {
            //     this._loadCurrentConversationMessages();
            // }
            // 标记已读未读
            this.updateTray();
        });

        this._addWfcListener(EventType.ReceiveMessage, (msg, hasMore) => {
            if (this.state.misc.connectionStatus === ConnectionStatus.ConnectionStatusReceiveing) {
                return;
            }
            this._handleStreamingTextMessage(msg);
            // 取消消息（20）只是删除信号：按 streamId 移除正在生成的
            // 14/15 消息后，取消消息本身不进入列表、不触发刷新
            if (msg.messageContent instanceof StreamingTextCancelledMessageContent) {
                return;
            }
            if (this.state.misc.isMainWindow && !this.isConversationInCurrentWindow(msg.conversation)) {
                return;
            }
            if (msg.messageContent instanceof DismissGroupNotification
                || (msg.messageContent instanceof KickoffGroupMemberNotification && msg.messageContent.kickedMembers.indexOf(wfc.getUserId()) >= 0)
                || (msg.messageContent instanceof QuitGroupNotification && msg.messageContent.operator === wfc.getUserId())
            ) {
                this.setCurrentConversationInfo(null);
                return;
            }

            if (!hasMore) {
                this._reloadConversation(msg.conversation)
            }
            if (this.state.conversation.currentConversationInfo && msg.conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                if (msg.messageContent.type === MessageContentType.Typing) {
                    let groupId = msg.conversation.type === 1 ? msg.conversation.target : '';
                    let userInfo = wfc.getUserInfo(msg.from, false, groupId)
                    userInfo = Object.assign({}, userInfo);
                    userInfo._displayName = wfc.getGroupMemberDisplayNameEx(userInfo);
                    this.state.conversation.inputtingUser = userInfo;

                    if (!this.state.conversation.inputClearHandler) {
                        this.state.conversation.inputClearHandler = () => {
                            this.state.conversation.inputtingUser = null;
                        }
                    }
                    clearTimeout(this.state.conversation.inputClearHandler);
                    setTimeout(this.state.conversation.inputClearHandler, 6000)
                } else {
                    clearTimeout(this.state.conversation.inputClearHandler);
                    this.state.conversation.inputtingUser = null;
                }

                if (!this._isDisplayMessage(msg) || msg.messageContent.type === MessageContentType.RecallMessage_Notification) {
                    return;
                }

                if (msg.content.notLoaded) {
                    console.log('message not loaded, reset conversation message list')
                    this.state.conversation.currentConversationMessageList.length = 0
                    this.state.conversation.currentConversationOldestMessageId = 0
                    this.state.conversation.currentConversationOldestMessageUid = 0
                    return;
                }
                // 会把下来加载更多加载的历史消息给清理了
                let lastTimestamp = 0;
                let msgListLength = this.state.conversation.currentConversationMessageList.length;
                if (msgListLength > 0) {
                    lastTimestamp = this.state.conversation.currentConversationMessageList[msgListLength - 1].timestamp;
                }
                this._patchMessage(msg, lastTimestamp);
                let msgIndex = this.state.conversation.currentConversationMessageList.findIndex(m => {
                    return m.messageId === msg.messageId
                        || (gt(m.messageUid, 0) && eq(m.messageUid, msg.messageUid))
                        || (m.messageContent.type === MessageContentType.Streaming_Text_Generating
                            && (msg.messageContent.type === MessageContentType.Streaming_Text_Generating || msg.messageContent.type === MessageContentType.Streaming_Text_Generated)
                            && m.messageContent.streamId === msg.messageContent.streamId
                        )
                });
                if (msgIndex > -1) {
                    // FYI: https://v2.vuejs.org/v2/guide/reactivity#Change-Detection-Caveats
                    this.state.conversation.currentConversationMessageList.splice(msgIndex, 1, msg);
                    console.log('msg duplicate, update message')
                    return;
                } else {
                    let firstMsg = this.state.conversation.currentConversationMessageList[0];
                    if(firstMsg && lt(msg.timestamp, firstMsg.timestamp)) {
                        console.log('msg timestamp is less than first msg, maybe update old message content, ignore')
                        return;
                    }
                }

                this.state.conversation.currentConversationMessageList.push(msg);
            }

            if (this.state.misc.isMainWindow && this.isConversationInCurrentWindow(msg.conversation)) {
                if (msg.conversation.type !== 2 && this.state.misc.isPageHidden && (this.state.misc.enableNotification || msg.status === MessageStatus.AllMentioned || msg.status === MessageStatus.Mentioned)) {
                    this.notify(msg);
                }
                this.updateTray();
            }
            if (msg.messageContent instanceof ModifyGroupSettingNotification) {
                wfc.getGroupInfo(msg.messageContent.groupId, true);
            }
        });

        this._addWfcListener(EventType.RecallMessage, (operator, messageUid) => {
            this._reloadConversationByMessageUidIfExist(messageUid);
            if (this.state.conversation.currentConversationInfo) {
                let msg = wfc.getMessageByUid(messageUid);
                if (msg) {
                    if (msg.conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                        if (this.state.conversation.currentConversationMessageList) {
                            let lastTimestamp = 0;
                            this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.map(msg => {
                                if (eq(msg.messageUid, messageUid)) {
                                    let newMsg = wfc.getMessageByUid(messageUid);
                                    this._patchMessage(newMsg, lastTimestamp);
                                    return newMsg;
                                }
                                lastTimestamp = msg.timestamp;
                                return msg;
                            });
                        }
                    }
                } else {
                    this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.filter(m => !eq(m.messageUid, messageUid));
                }
            }
            this.updateTray();
        });
        this._addWfcListener(EventType.UserOnlineEvent, (userOnlineStatus) => {
            userOnlineStatus.forEach(e => {
                this.state.misc.userOnlineStateMap.set(e.userId, e);
            })
            // 更新在线状态。在线状态不影响显示名、拼音和排序，只需更新在线状态描述，不必全量重新 patch + 排序
            this.state.contact.friendList.forEach(u => {
                u._userOnlineStatusDesc = this.getUserOnlineState(u.uid);
            });
            this._patchCurrentConversationOnlineStatus();
        })
        // 服务端删除
        this._addWfcListener(EventType.MessageDeleted, (messageUid) => {
            this._reloadConversationByMessageUidIfExist(messageUid);
            if (this.state.conversation.currentConversationInfo) {

                if (this.state.conversation.currentConversationMessageList) {
                    this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.filter(msg => !eq(msg.messageUid, messageUid))
                }
            }
            this.updateTray();
        });
        // 本地删除
        this._addWfcListener(EventType.DeleteMessage, (messageId) => {
            this._reloadConversationByMessageIdIfExist(messageId);
            if (this.state.conversation.currentConversationInfo) {
                if (this.state.conversation.currentConversationMessageList) {
                    this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.filter(msg => msg.messageId !== messageId)
                }
            }
        });

        this._addWfcListener(EventType.SecretChatMessageBurned, (target, playedMessageId) => {
            // todo 倒计时等
        });

        this._addWfcListener(EventType.SecretChatMessageBurned, (messageIds) => {
            this._loadDefaultConversationList();
            if (this.state.conversation.currentConversationInfo) {
                if (this.state.conversation.currentConversationMessageList) {
                    this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.filter(msg => messageIds.indexOf(msg.messageId) < 0)
                }
            }
        });

        this._addWfcListener(EventType.SecretChatStateChange, (targetId) => {
            this._loadDefaultConversationList();
        });

        this._addWfcListener(EventType.SendMessage, (message) => {
            // 删除频道，或者从频道会话切到其他会话时，会发送一条离开频道的消息
            if (message.messageContent instanceof LeaveChannelChatMessageContent) {
                return;
            }

            this._reloadConversation(message.conversation);
            if (!this._isDisplayMessage(message)) {
                return;
            }
            if (!this.state.conversation.currentConversationInfo || !message.conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                console.log('not current conv')
                return;
            }
            let index = this.state.conversation.currentConversationMessageList.findIndex(m => m.messageId === message.messageId);
            if (index !== -1) {
                return;
            }
            let length = this.state.conversation.currentConversationMessageList.length;
            let lastTimestamp = 0;
            if (length > 0) {
                let lastMessage = this.state.conversation.currentConversationMessageList[length - 1];
                lastTimestamp = lastMessage.timestamp;
            }
            this._patchMessage(message, lastTimestamp)

            this.state.conversation.currentConversationMessageList.push(message);
            const defaultRenderMessageCount = 50;
            if (this.state.conversation.currentConversationMessageList.length > defaultRenderMessageCount) {
                this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.slice(this.state.conversation.currentConversationMessageList.length - defaultRenderMessageCount);
            }
        });

        const messageStatusOrContentUpdateListener = (message) => {
            console.log('message status update', message)
            if (!this._isDisplayMessage(message)) {
                return;
            }

            if (!this.state.conversation.currentConversationInfo || !message.conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                console.log('not current conv')
                return;
            }

            let index = this.state.conversation.currentConversationMessageList.findIndex(m => m.messageId === message.messageId);
            if (index < 0) {
                return;
            }
            let msg = this.state.conversation.currentConversationMessageList[index];
            msg = Object.assign(msg, message)
            this.state.conversation.currentConversationMessageList.splice(index, 1, msg)

            if (this.state.conversation.currentConversationInfo.lastMessage && this.state.conversation.currentConversationInfo.lastMessage.messageId === message.messageId) {
                Object.assign(this.state.conversation.currentConversationInfo.lastMessage, message);
            }
        }

        this._addWfcListener(EventType.MessageStatusUpdate, messageStatusOrContentUpdateListener);

        this._addWfcListener(EventType.MessageContentUpdate, messageStatusOrContentUpdateListener);

        this._addWfcListener(EventType.MessageRead, (readEntries) => {
            // optimization
            if (this.state.conversation.currentConversationInfo) {
                // wfc.getConversationRead 每次返回同一个对象，只是该对象的值不一样。
                // 由于 VUE 不能检测到初始化时，不存在的属性的变更，故此处重新 new 一个新的对象，并赋值。
                // FYI:https://vuejs.org/v2/guide/reactivity.html
                this.state.conversation.currentConversationRead = new Map(wfc.getConversationRead(this.state.conversation.currentConversationInfo.conversation));
            }
        });

        if(isMainWindow){
            avenginekitproxy.onVoipCallStatusCallback = this.updateVoipStatus.bind(this)
        }
        if (isElectron()) {
            if (isMainWindow) {
                ipcRenderer.on('deep-link', (event, args) => {
                    console.log('deep-link', args)
                    if (!wfc.isLogin()) {
                        return;
                    }
                    // 下面是示例
                    // 可以根据 pathname 和 query parameter 进行相应的逻辑处理，这儿是跳转到对应的会话
                    let url = new URL(args);
                    let pathname = url.pathname;
                    let searchParams = url.searchParams;
                    if ('//conversation' === pathname || '//conversation/' === pathname) {
                        let target = searchParams.get('target');
                        let line = Number(searchParams.get('line'));
                        let type = Number(searchParams.get('type'))
                        let conversation = new Conversation(type, target, line)
                        this.setCurrentConversation(conversation);
                    }
                })

                ipcRenderer.on('floating-conversation-window-closed', (event, args) => {
                    let type = args.type;
                    let target = args.target;
                    let line = args.line;

                    let conv = new Conversation(type, target, line);
                    this.removeFloatingConversation(conv)
                    this._reloadConversation(conv);
                });

            }
            ipcRenderer.on('file-downloaded', (event, args) => {
                let messageUid = args.messageUid;
                let localPath = args.filePath;
                console.log('file-downloaded', args)

                this.state.conversation.downloadingMessages = this.state.conversation.downloadingMessages.filter(v => !eq(v.messageUid, messageUid));
                let msg = wfc.getMessageByUid(messageUid);
                console.log('downloaded file', msg)
                if (msg) {
                    msg.messageContent.localPath = localPath;
                    wfc.updateMessageContent(msg.messageId, msg.messageContent);

                    this.state.conversation.currentConversationMessageList.forEach(m => {
                        if (m.messageUid === messageUid) {
                            m.messageContent = msg.messageContent;
                        }
                    });
                }
            });

            ipcRenderer.on('file-download-failed', (event, args) => {
                let messageUid = args.messageUid;
                this.state.conversation.downloadingMessages = this.state.conversation.downloadingMessages.filter(v => !eq(v.messageUid, messageUid));
                // TODO 其他下载失败处理
            });

            ipcRenderer.on('file-download-progress', (event, args) => {
                let messageUid = args.messageUid;
                let receivedBytes = args.receivedBytes;
                let totalBytes = args.totalBytes;
                let dm = this.state.conversation.downloadingMessages.find(dm => eq(dm.messageUid, messageUid));
                if (dm) {
                    dm.progress = receivedBytes;
                    dm.total = totalBytes;
                }
                // console.log('file download progress', messageId, receivedBytes, totalBytes);
            });

            this.state.misc.subWindowLoadDataOptions = subWindowLoadDataOptions ? subWindowLoadDataOptions : {};

            if (!isMainWindow && wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
                // 根据 subWindowLoadDataOptions 配置去加载
                this._loadDefaultData();
            }
            window.__wfc = wfc;
        }
        this.state.misc.isMainWindow = isMainWindow;
        window.__cw = currentWindow;
    },

    _loadDefaultData() {
        let loadOptions = this.state.misc.subWindowLoadDataOptions;
        let isMainWindow = this.state.misc.isMainWindow;
        (isMainWindow || loadOptions.loadFavContactList) && this._loadFavGroupList();
        (isMainWindow || loadOptions.loadChannelList) && this._loadChannelList();
        (isMainWindow || loadOptions.loadFriendList) && this._loadFriendList();
        (isMainWindow || loadOptions.loadFavContactList) && this._loadFavContactList();
        isMainWindow && this._loadAiRobotList();
        (isMainWindow || loadOptions.loadFriendRequestList) && this._loadFriendRequest();
        (isMainWindow || loadOptions.loadDefaultConversationList) && this._loadDefaultConversationList();
        this._loadSelfUserInfo();
        this._loadUserLocalSettings();
        this.state.conversation.isMessageReceiptEnable = wfc.isReceiptEnabled() && wfc.isUserReceiptEnabled();
        this.state.conversation.isGroupMessageReceiptEnable = wfc.isGroupReceiptEnabled() && wfc.isUserReceiptEnabled();
        // 休眠恢复之后，重新连接成功时，可能出现会话列表的 lastMessage 在会话界面未显示，需要判断是否需要重新加载当前会话的消息
        if (this.state.conversation.currentConversationInfo) {
            if(gt(this.state.conversation.currentConversationInfo.timestamp, 0) && (this.state.conversation.currentConversationMessageList.length === 0 || !eq(this.state.conversation.currentConversationInfo.timestamp, this.state.conversation.currentConversationMessageList[this.state.conversation.currentConversationMessageList.length - 1].timestamp))){
                this._loadCurrentConversationMessages();
            }
        }
    },

    // 初次登录或长时间未登录后，数据同步期间 UserInfosUpdate/GroupInfosUpdate/SettingUpdate/FriendListUpdate
    // 等事件会高频触发，对应 handler 又会全量重载数据（大量同步 IPC + 拼音转换等计算），把渲染主线程打满，
    // 导致主页长时间卡顿、数据迟迟补不全。这里做 trailing debounce 合并，maxWait 保证持续风暴下也会定期刷新
    _deferReload(key, reloadFn, delay = 300, maxWait = 1500) {
        if (!this._reloadTimers) {
            this._reloadTimers = new Map();
        }
        let entry = this._reloadTimers.get(key);
        if (!entry) {
            entry = {timer: 0, firstDeferTime: 0};
            this._reloadTimers.set(key, entry);
        }
        if (!entry.firstDeferTime) {
            entry.firstDeferTime = Date.now();
        }
        clearTimeout(entry.timer);
        let wait = Math.min(delay, Math.max(0, entry.firstDeferTime + maxWait - Date.now()));
        entry.timer = setTimeout(() => {
            entry.firstDeferTime = 0;
            reloadFn();
        }, wait);
    },

    _cancelDeferredReloads() {
        if (this._reloadTimers) {
            this._reloadTimers.forEach(entry => clearTimeout(entry.timer));
            this._reloadTimers.clear();
        }
        this._pendingGroupMemberUpdateGroupIds.clear();
    },

    // 合并处理攒下来的群成员更新：群数量超过阈值时，_reloadGroupConversationIfExist 内部会
    // 退化成一次去抖的全量会话列表重载，避免逐个会话重载带来的同步 IPC 与排序风暴
    _flushPendingGroupMemberUpdates() {
        if (this._pendingGroupMemberUpdateGroupIds.size === 0) {
            return;
        }
        let groupIds = Array.from(this._pendingGroupMemberUpdateGroupIds);
        this._pendingGroupMemberUpdateGroupIds.clear();
        console.log('store GroupMembersUpdate flush', groupIds.length);
        this._reloadGroupConversationIfExist(groupIds.map(groupId => new NullGroupInfo(groupId)));
    },

    _deferLoadDefaultConversationList() {
        this._deferReload('defaultConversationList', () => {
            this._loadDefaultConversationList();
            // 未读数从 conversationInfoList 计算而来，列表刷新后需要同步刷新系统托盘/Dock 角标。
            // PC SDK 下，其他端标记已读/清除远程消息只会触发 SettingUpdate，若在列表重载前计算角标，会得到过期数值
            this.updateTray();
        });
    },

    _deferLoadFriendList() {
        this._deferReload('friendList', () => this._loadFriendList());
    },

    _deferLoadFriendRequest() {
        this._deferReload('friendRequest', () => this._loadFriendRequest());
    },

    _deferLoadFavContactList() {
        this._deferReload('favContactList', () => this._loadFavContactList());
    },

    _deferLoadFavGroupList() {
        this._deferReload('favGroupList', () => this._loadFavGroupList());
    },

    _deferLoadChannelList() {
        this._deferReload('channelList', () => this._loadChannelList());
    },

    _deferPatchCurrentConversationMessages() {
        this._deferReload('patchCurrentMessages', () => this._patchCurrentConversationMessages(), 150, 1000);
    },

    // conversation actions

    _isDisplayMessage(message) {
        // return [PersistFlag.Persist, PersistFlag.Persist_And_Count].indexOf(MessageConfig.getMessageContentPersitFlag(message.messageContent.type)) > -1;
        return message.messageId !== 0
            || message.messageContent.type === MessageContentType.Streaming_Text_Generating
            || message.messageContent.type === MessageContentType.Transcription;
    },

    _loadDefaultConversationList() {
        console.log('store _loadDefaultConversationList');
        let conversationTypes = isElectron() ? [0, 1, 3, 5] : [0, 1, 3];
        this._loadConversationList(conversationTypes, [0])
    },

    _loadConversationList(conversationType = [0, 1, 3], lines = [0]) {
        let conversationList = wfc.getConversationList(conversationType, lines);
        console.log('_loadConversationList size', conversationList.length);
        conversationList.forEach(info => {
            // 只做纯本地计算；target（头像/名称）解析很昂贵（本地没有还会发远程拉取），
            // 会话很多时（2000+ 群）不能在这里批量做，交给会话列表条目渲染时按需 ensureConversationTarget。
            // lastMessage 的发送者信息同理，由会话条目展示时按需 _patchMessage。
            this._patchConversationInfoLight(info, false);
            // side affect
            if (this.state.conversation.currentConversationInfo
                && this.state.conversation.currentConversationInfo.conversation.equal(info.conversation)) {
                // 当前正在聊天的会话本来就要展示，直接解析
                this._resolveConversationTarget(info.conversation);
                this.state.conversation.currentConversationInfo = info;
                this._patchCurrentConversationOnlineStatus();
            }
        });
        this.state.conversation.conversationInfoList = conversationList;
    },

    _reloadConversation(conversation, insertIfNoExist = true) {
        let conversationInfo = wfc.getConversationInfo(conversation);
        if (conversationInfo) {
            conversationInfo = this._patchConversationInfo(conversationInfo, true);
            conversationInfo.conversation._targetOnlineStateDesc = this.getUserOnlineState(conversation.target);
        } else {
            return
        }
        let index = this.state.conversation.conversationInfoList.findIndex(info => info.conversation.equal(conversation));
        if (index >= 0) {
            Object.assign(this.state.conversation.conversationInfoList[index], conversationInfo);
        } else {
            if (insertIfNoExist && gt(conversationInfo.timestamp, 0) && conversation.type !== ConversationType.ChatRoom) {
                this.state.conversation.conversationInfoList.push(conversationInfo);
            } else {
                return conversationInfo;
            }
        }

        if (this.state.conversation.currentConversationInfo && this.state.conversation.currentConversationInfo.conversation.equal(conversation)) {
            let isClearConversationMessageHistory = !conversationInfo.lastMessage && !!this.state.conversation.currentConversationInfo.lastMessage;
            // 清除聊天记录
            if (isClearConversationMessageHistory) {
                this.state.conversation.currentConversationMessageList = [];
            }
            this.state.conversation.currentConversationInfo = conversationInfo;
        }

        this._sortConversationInfoList();
        return conversationInfo;
    },

    // 置顶会话在前，其余按时间倒序。时间相同返回 0，保证排序稳定，也让下面的"是否已有序"判断成立
    _compareConversationInfo(a, b) {
        if (!!a.top !== !!b.top) {
            return a.top ? -1 : 1;
        }
        if (gt(a.timestamp, b.timestamp)) {
                    return -1;
        }
        if (lt(a.timestamp, b.timestamp)) {
                    return 1;
                }
        // 时间相同（或时间戳非法无法比较）时返回 0，保持原有相对顺序，避免每次重载都判定成乱序而反复重排
        return 0;
    },

    // 直接对 conversationInfoList（reactive proxy）调用 sort，每次元素交换都要穿过 Proxy 的
    // get/set 并触发依赖通知，会话上千时单次排序就是几万次响应式写入。这里改成先在 raw 数组上
    // 判断是否已经有序（绝大多数重载都不会改变顺序），确实乱序时才在 raw 数组上排好序、整体赋值一次，
    // 把 O(n log n) 次响应式触发降为 1 次。
    _sortConversationInfoList() {
        let raw = toRaw(this.state.conversation.conversationInfoList);
        if (!raw || raw.length < 2) {
            return;
            }
        for (let i = 1; i < raw.length; i++) {
            if (this._compareConversationInfo(raw[i - 1], raw[i]) > 0) {
                this.state.conversation.conversationInfoList = raw.slice().sort(this._compareConversationInfo);
                return;
            }
        }
    },

    _reloadSingleConversationIfExist(userInfos) {
        let cl = this.state.conversation.conversationInfoList
        if (!cl || cl.length === 0) {
            return;
        }
        if (userInfos.length > 10) {
            // 初次同步时用户信息会大批量更新，走去抖合并的全量重载
            this._deferLoadDefaultConversationList();
        } else {
            let toReloadConversations = [];
            let addedConvKeys = new Set();
            let uidSet = new Set(userInfos.map(info => info.uid));
            if (cl) {
                cl.forEach(ci => {
                    let conv = ci.conversation;
                    let key = this._conversationKey(conv);
                    if (conv.type === ConversationType.Single) {
                        if (uidSet.has(conv.target) && !addedConvKeys.has(key)) {
                            addedConvKeys.add(key);
                            toReloadConversations.push(conv);
                        }
                    } else {
                        let lastMsg = ci.lastMessage;
                        if (lastMsg && uidSet.has(lastMsg.from) && !addedConvKeys.has(key)) {
                            addedConvKeys.add(key);
                            toReloadConversations.push(conv);
                        }
                    }
                })
            }
            for (let conv of toReloadConversations) {
                this._reloadConversation(conv, false);
            }
        }
    },

    _reloadGroupConversationIfExist(groupInfos) {
        if (groupInfos.length > 10) {
            this._deferLoadDefaultConversationList();
        } else {
            groupInfos.forEach(gi => {
                let conv = new Conversation(ConversationType.Group, gi.target, 0);
                this._reloadConversation(conv, false);
            })
        }
    },

    _reloadConversationByMessageIdIfExist(messageId) {
        if (messageId === 0) {
            return;
        }
        let toLoadConversationInfo = null;
        for (let i = 0; i < this.state.conversation.conversationInfoList.length; i++) {
            let info = this.state.conversation.conversationInfoList[i];
            if (info.lastMessage && info.lastMessage.messageId === messageId) {
                toLoadConversationInfo = info;
                break;
            }
        }

        if (toLoadConversationInfo) {
            this._reloadConversation(toLoadConversationInfo.conversation)
        }
    },
    _reloadConversationByMessageUidIfExist(messageUid) {
        let toLoadConversationInfo = null;
        for (let i = 0; i < this.state.conversation.conversationInfoList.length; i++) {
            let info = this.state.conversation.conversationInfoList[i];
            if (info.lastMessage && eq(info.lastMessage.messageUid, messageUid)) {
                toLoadConversationInfo = info;
                break;
            }
        }

        if (toLoadConversationInfo) {
            this._reloadConversation(toLoadConversationInfo.conversation)
        }
    },

    setCurrentConversation(conversation) {
        if (!conversation) {
            this.setCurrentConversationInfo(null)
            return;
        }
        if (this.state.conversation.currentConversationInfo && conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
            return;
        }
        let convs = this.state.conversation.conversationInfoList.filter(info => info.conversation.equal(conversation));
        let info;
        if (convs && convs.length > 0) {
            info = convs[0];
        } else {
            wfc.setConversationTimestamp(conversation, new Date().getTime());
            info = this._reloadConversation(conversation);
        }
        this.setCurrentConversationInfo(info);
    },
    setCurrentConversationInfo(conversationInfo) {
        if (this.state.conversation.currentConversationInfo &&(!conversationInfo || !this.state.conversation.currentConversationInfo.conversation.equal(conversationInfo.conversation))) {
                let conversation = this.state.conversation.currentConversationInfo.conversation;

                if (wfc.isUserOnlineStateEnabled() && ((conversation.type === ConversationType.Single || conversation.type === ConversationType.SecretChat) && !wfc.isMyFriend(conversation.target))) {
                    wfc.unwatchOnlineState(conversation.type, [conversation.target]);
                }
                if (conversation.type === ConversationType.Channel) {
                    let content = new LeaveChannelChatMessageContent();
                    wfc.sendConversationMessage(conversation, content);
                }
            this.clearConversationUnreadStatus(this.state.conversation.currentConversationInfo.conversation)
            }
        if (!conversationInfo) {
            this.state.conversation.currentConversationInfo = null;
            this.state.conversation.shouldAutoScrollToBottom = false;
            this.state.conversation.currentConversationMessageList.length = 0;
            this.state.conversation.currentConversationOldestMessageId = 0;
            this.state.conversation.currentConversationOldestMessageUid = 0;
            this.state.conversation.currentConversationRead = null;
            this.state.conversation.enableMessageMultiSelection = false;
            this.state.conversation.showChannelMenu = false;
            return;
        }

        if (this.state.conversation.currentConversationInfo && this.state.conversation.currentConversationInfo.conversation.equal(conversationInfo.conversation)) {
            return;
        }
        let conversation = conversationInfo.conversation;
        // 会话列表加载时不再解析 target，进入会话时（本来就要展示）确保已解析
        this.ensureConversationTarget(conversation);
        if (wfc.isUserOnlineStateEnabled() && ((conversation.type === ConversationType.Single || conversation.type === ConversationType.SecretChat) && !wfc.isMyFriend(conversation.target))) {
            wfc.watchOnlineState(conversation.type, [conversation.target], 1000, (states) => {
                states.forEach((e => {
                    this.state.misc.userOnlineStateMap.set(e.userId, e);
                }))
                this._patchCurrentConversationOnlineStatus();

            }, (err) => {
                console.log('watchOnlineState error', err);
            })
        }
        if (conversation.type === ConversationType.Channel) {
            let content = new EnterChannelChatMessageContent();
            wfc.sendConversationMessage(conversation, content);
        }
        this.state.conversation.currentConversationInfo = conversationInfo;
        this.state.conversation.shouldAutoScrollToBottom = true;
        this.state.conversation.currentConversationMessageList.length = 0;
        this.state.conversation.currentConversationOldestMessageId = 0;
        this.state.conversation.currentConversationOldestMessageUid = 0;
        // 会话页面会触发调用 loadConversationHistoryMessages，这儿不用提前加载消息
        // this._loadCurrentConversationMessages();
        this._patchCurrentConversationOnlineStatus();

        this.state.conversation.currentConversationRead = wfc.getConversationRead(conversationInfo.conversation);

        this.state.conversation.enableMessageMultiSelection = false;
        this.state.conversation.showChannelMenu = false;
        if (conversation.type === ConversationType.Channel) {
            let channelInfo = wfc.getChannelInfo(conversation.target, true);
            if (channelInfo.menus && channelInfo.menus.length > 0) {
                this.state.conversation.showChannelMenu = true;
            }
        } else if (conversation.type === ConversationType.Group) {
            wfc.getGroupInfo(conversation.target, true);
        } else if (conversation.type === ConversationType.Single) {
            wfc.getUserInfo(conversation.target, true);
        }
        this.state.conversation.quotedMessage = null;
        this.state.conversation.currentVoiceMessage = null;

        clearTimeout(this.state.conversation.inputClearHandler);
        this.state.conversation.inputtingUser = null;

        this.state.pick.messages.length = 0;
    },

    quitGroup(groupId) {
        wfc.quitGroup(groupId, [0], null, () => {
            this.setCurrentConversationInfo(null)
            this._deferLoadFavGroupList()
        }, (err) => {
            console.log('quit group error', err)
        })
    },
    dismissGroup(groupId) {
        wfc.dismissGroup(groupId, [0], null, () => {
            this.setCurrentConversationInfo(null)
            this._deferLoadFavGroupList()
        }, (err) => {
            console.log('dismiss group error', err)
        })
    },
    subscribeChannel(channelId, subscribe) {
        wfc.listenChannel(channelId, subscribe, () => {
            //this.setCurrentConversationInfo(null)
        }, (err) => {
            console.log('unsubscribe channel error', err)
        })
    },

    toggleMessageMultiSelection(message) {
        this.state.conversation.enableMessageMultiSelection = !this.state.conversation.enableMessageMultiSelection;
        this.state.pick.messages.length = 0;
        if (this.state.conversation.enableMessageMultiSelection && message) {
            this.state.pick.messages.push(message);
        }
    },

    toggleChannelMenu(toggle) {
        this.state.conversation.showChannelMenu = toggle;
    },

    selectOrDeselectMessage(message) {
        let index = this.state.pick.messages.findIndex(m => m.messageId === message.messageId);
        if (index >= 0) {
            this.state.pick.messages.splice(index, 1);
        } else {
            this.state.pick.messages.push(message);
        }
    },

    deleteSelectedMessages(deleteRemoteMessages = false) {
        this.state.conversation.enableMessageMultiSelection = false;
        if (this.state.pick.messages.length < 1) {
            return;
        }
        this.state.pick.messages.sort((m1, m2) => m1.messageId - m2.messageId);
        this.state.pick.messages.forEach(m => {
            if (deleteRemoteMessages) {
                wfc.deleteRemoteMessageByUid(m.messageUid);
            } else {
                wfc.deleteMessage(m.messageId);
            }
        });
        this.state.pick.messages.length = 0;
    },

    async forwardMessage(forwardType, targetConversations, messages, extraMessageText) {
        // web 端，避免撤回消息等操作，影响组合消息
        if (!isElectron()) {
            messages = messages.map(m => Object.assign({}, m));
        }
        for (const conversation of targetConversations) {
            // let msg =new Message(conversation, message.messageContent)
            // wfc.sendMessage(msg)
            // 或者下面这种
            let ps = (conversation, message) => {
                return new Promise((resolve, reject) => {
                    wfc.sendConversationMessage(conversation, message, [], null, null, (messageUid, timestamp) => {
                        // resolve(messageUid, timestamp);
                        // ignore result
                        resolve()
                    }, err => {
                        // reject(err);
                        // ignore error
                        resolve()
                    });
                })
            }
            if (forwardType === ForwardType.NORMAL || forwardType === ForwardType.ONE_BY_ONE) {
                for (const message of messages) {
                    if (message.messageContent instanceof ArticlesMessageContent) {
                        let linkContents = message.messageContent.toLinkMessageContent();
                        for (const lm of linkContents) {
                            await ps(conversation, lm);
                        }

                    } else {
                        message.messageContent = this._filterForwardMessageContent(message)
                        await ps(conversation, message.messageContent);
                    }
                }
            } else {
                // 合并转发
                let compositeMessageContent = new CompositeMessageContent();
                let title = '';
                let msgConversation = messages[0].conversation;
                if (msgConversation.type === ConversationType.Single) {
                    let users = this.getUserInfos([wfc.getUserId(), msgConversation.target], '');
                    title = users[0]._displayName + '和' + users[1]._displayName + '的聊天记录';
                } else {
                    title = '群的聊天记录';
                }
                compositeMessageContent.title = title;
                let msgs = messages.map(m => {
                    m.messageContent = this._filterForwardMessageContent(m)
                    return m
                })
                compositeMessageContent.setMessages(msgs);

                await ps(conversation, compositeMessageContent);
            }

            if (extraMessageText) {
                let textMessage = new TextMessageContent(extraMessageText)
                await ps(conversation, textMessage);
            }
        }
    },

    forwardByCreateConversation(forwardType, users, messages, extraMessageText) {
        this.createConversation(users,
            (conversation) => {
                this.forwardMessage(forwardType, [conversation], messages, extraMessageText)
            },
            (err) => {
                console.error('createConversation error', err)
            })
    },

    setShouldAutoScrollToBottom(scroll) {
        this.state.conversation.shouldAutoScrollToBottom = scroll;
    },

    /**
     *
     * @param src {String} 媒体url
     * @param thumbUrl {String} 缩略图url
     * @param thumb {String} base64格式的缩略图，但不包含'data:image/png;base64,'
     * @param autoplay
     */
    previewMedia(src, thumbUrl, thumb, autoplay = true) {
        this.state.conversation.previewMediaItems.length = 0;
        this.state.conversation.previewMediaItems.push({
            src: src,
            thumb: thumbUrl ? thumbUrl : 'data:image/png;base64,' + thumb,
            autoplay: autoplay,
        });
        this.state.conversation.previewMediaIndex = 0;
        console.log('preview media', this.state.conversation.previewMediaItems, this.state.conversation.previewMediaIndex)
    },
    previewMedias(mediaItems, index) {
        this.state.conversation.previewMediaItems.length = 0;
        this.state.conversation.previewMediaItems.push(...mediaItems);
        this.state.conversation.previewMediaIndex = index;
        console.log('preview medias', this.state.conversation.previewMediaItems, this.state.conversation.previewMediaIndex)
    },

    playVoice(message) {
        if (this.state.conversation.currentVoiceMessage) {
            this.state.conversation.currentVoiceMessage._isPlaying = false;
        }
        this.state.conversation.currentVoiceMessage = message;
    },

    /**
     *
     * @param message
     * @param {Boolean} continuous  true，预览周围的媒体消息；false，只预览第一个参数传入的那条媒体消息
     */
    previewMessage(message, continuous) {
        this.state.conversation.previewMediaItems.length = 0;
        this.state.conversation.previewMediaIndex = 0;
        if (continuous && this.state.conversation.currentConversationMessageList.length > 0) {
            let mediaMsgs = this.state.conversation.currentConversationMessageList.filter(m => [MessageContentType.Image, MessageContentType.Video].indexOf(m.messageContent.type) > -1)
            let msg;
            for (let i = 0; i < mediaMsgs.length; i++) {
                msg = mediaMsgs[i];
                if (msg.messageId === message.messageId) {
                    this.state.conversation.previewMediaIndex = i;
                }
                let mediaUrl = msg.messageContent.remotePath;
                if (!mediaUrl) {
                    if (msg.messageContent.file) {
                        mediaUrl = URL.createObjectURL(msg.messageContent.file)
                    }
                }
                this.state.conversation.previewMediaItems.push({
                    src: mediaUrl,
                    thumb: 'data:image/png;base64,' + msg.messageContent.thumbnail,
                    autoplay: true,
                });
            }
        } else {
            this.state.conversation.previewMediaIndex = 0;
            let mediaUrl = message.messageContent.remotePath;
            if (!mediaUrl) {
                if (message.messageContent.file) {
                    mediaUrl = URL.createObjectURL(message.messageContent.file)
                }
            }
            this.state.conversation.previewMediaItems.push({
                src: mediaUrl,
                thumb: 'data:image/png;base64,' + message.messageContent.thumbnail,
                autoplay: true,
            });
        }
    },

    previewCompositeMessage(compositeMessage, focusMessageUid) {
        this.state.conversation.previewMediaItems.length = 0;
        this.state.conversation.previewMediaIndex = 0;

        let mediaMsgs = compositeMessage.messageContent.messages.filter(m => [MessageContentType.Image, MessageContentType.Video].indexOf(m.messageContent.type) > -1)
        let msg;
        for (let i = 0; i < mediaMsgs.length; i++) {
            msg = mediaMsgs[i];
            if (eq(msg.messageUid, focusMessageUid)) {
                this.state.conversation.previewMediaIndex = i;
            }
            this.state.conversation.previewMediaItems.push({
                src: msg.messageContent.remotePath,
                thumb: 'data:image/png;base64,' + msg.messageContent.thumbnail,
                autoplay: true,
            });
        }
    },

    /**
     *
     * @param conversation :Conversation 会话
     * @param files : File[] 需要发送的媒体文件
     * @param text : string 描述
     * @return {Promise<void>}
     */
    async sendMixMediaMessage(conversation, files, text) {
        console.log('sendMixMediaMessage', conversation, files, text);
        let isAllImageOrVideoFile = true
        for (let i = 0; i < files.length; i++) {
            if (files[i].type.indexOf('image') === -1 && files[i].type.indexOf('video') === -1) {
                isAllImageOrVideoFile = false
                break
            }
        }

        let content;
        let entries
        if (isAllImageOrVideoFile) {
            entries = await Promise.all(
                files.map(async f => {
                    let isImg = f.type.indexOf('image') >= 0
                    let {thumbnail: it, width: iw, height: ih} = isImg ? await imageThumbnail(f) : await videoThumbnail(f);
                    it = it ? it : Config.DEFAULT_THUMBNAIL_URL;
                    if (it.length > 6 * 1024) {
                        console.warn('generated thumbnail is too large, use default thumbnail', it.length);
                        it = Config.DEFAULT_THUMBNAIL_URL;
                    }
                    return {
                        url: '',
                        type: isImg ? 'image' : 'video',
                        thumbnail: it.split(',')[1],
                        width: iw,
                        height: ih,
                        tmpFile: f,
                    }
                })
            )

            content = new MixMultiMediaTextMessageContent(entries, text)
        } else {
            entries = files.map(f => {
                return {
                    url: '',
                    name: f.name,
                    size: f.size,
                    iv: f.type.indexOf('image') >= 0 || f.type.indexOf('video') >= 0,
                    tmpFile: f,
                }
            })
            content = new MixFileTextMessageContent(entries, text)
        }
        let msg = wfc.insertMessage(conversation, content, MessageStatus.Sending, true)

        let entriesWithUrl = await Promise.all(
            entries.map(entry => {
                let file = entry.tmpFile;
                return new Promise((resolve, reject) => {
                    wfc.uploadMedia(file.name, file, file.type.indexOf('image') >= 0 ? MessageContentMediaType.Image : MessageContentMediaType.Video, remoteUrl => {
                        entry.url = remoteUrl
                        delete entry.tmpFile
                        resolve(entry)
                    }, err => {
                        resolve(entry)
                        console.error('upload file failed', f, err);
                    }, (process, total) => {

                    })
                })
            })
        )
        if (isAllImageOrVideoFile) {
            content = new MixMultiMediaTextMessageContent(entriesWithUrl, text)
        } else {
            content = new MixFileTextMessageContent(entries, text)
        }
        wfc.updateMessageContent(msg.messageId, content)
        msg.messageContent = content
        wfc.sendSavedMessage(msg, 0, (messageUid, timestamp) => {

        }, err => {
            console.log('send msg failed', err)
        })
    },

    /**
     *
     * @param conversation
     * @param {File | string} file html File 类型或者url，绝对路径只在electron里面生效
     * @return {Promise<boolean>}
     */
    async sendFile(conversation, file) {
        console.log('send file', file)
        if (file.size && file.size > 100 * 1024 * 1024) {
            if (!wfc.isSupportBigFilesUpload() || conversation.type === ConversationType.SecretChat) {
                console.log('file too big, and not support upload big file')
                return true;
            }
        }

        let fileOrLocalPath = null;
        let remotePath = null;
        if (typeof file === 'string') {
            if (!file.startsWith('http')) {
                fileOrLocalPath = file;
            } else {
                remotePath = file;
            }

            file = {
                path: file,
                name: file.substring((file.lastIndexOf('/') + 1))
            }
        } else {
            fileOrLocalPath = file;
        }
        let msg = new Message();
        msg.conversation = conversation;

        // 检查禁止发送的文件类型
        let fileName = file.name || '';
        let ext = fileName.split('.').pop().toLowerCase();
        if (Config.DISABLED_SEND_FILE_TYPES.includes(ext)) {
            console.log('file type not allowed to send', ext);
            window.dispatchEvent(new CustomEvent('app-toast', {
                detail: { title: '提示', text: '不能发送该类型文件', type: 'warn' }
            }));
            return true;
        }

        let mediaType = helper.getMediaType(file.name.split('.').slice(-1).pop());
        // todo other file type
        let messageContentmediaType = {
            'pic': MessageContentMediaType.Image,
            'video': MessageContentMediaType.Video,
            'doc': MessageContentMediaType.File,
        }[mediaType];

        let messageContent;
        switch (messageContentmediaType) {
            case MessageContentMediaType.Image:
                let {thumbnail: it, width: iw, height: ih} = await imageThumbnail(file);
                it = it ? it : Config.DEFAULT_THUMBNAIL_URL;
                console.log('image file',it.length, file )
                if (it.length > 10 * 1024) {
                    console.warn('generated thumbnail is too large, use default thumbnail', it.length);
                    it = Config.DEFAULT_THUMBNAIL_URL;
                }
                messageContent = new ImageMessageContent(fileOrLocalPath, remotePath, it.split(',')[1]);
                messageContent.imageWidth = iw;
                messageContent.imageHeight = ih;
                break;
            case MessageContentMediaType.Video:
                let vtr = await videoThumbnail(file);
                if (vtr) {
                    let {thumbnail: vt, width: vw, height: vh} = vtr;
                    let duration = await videoDuration(file)
                    duration = Math.ceil(duration * 1000);
                    if (vt.length > 10 * 1024) {
                        console.warn('generated thumbnail is too large, use default thumbnail', vt.length);
                        vt = Config.DEFAULT_THUMBNAIL_URL;
                    }
                    messageContent = new VideoMessageContent(fileOrLocalPath, remotePath, vt.split(',')[1]);
                    // TODO width and height
                    break;
                } else {
                    // fallback to file message
                }
            case MessageContentMediaType.File:
            // do nothing
            default:
                messageContent = new FileMessageContent(fileOrLocalPath, remotePath);
                break;
        }
        msg.messageContent = messageContent;
        wfc.sendMessage(msg,
            (messageId) => {
                msg.messageId = messageId;
                console.log('sf, pr', messageId)
            },
            (progress, total) => {
                // console.log('sf p', msg.messageId, Math.ceil(progress / total * 100))
                let sm = this.state.conversation.sendingMessages.find(e => e.messageId === msg.messageId);
                if (sm) {
                    sm.progress = progress;
                    sm.total = total;
                } else {
                    this.state.conversation.sendingMessages.push({messageId: msg.messageId, progress, total});
                }
            },
            (messageUid) => {
                console.log('sf s', messageUid)
                this.state.conversation.sendingMessages = this.state.conversation.sendingMessages.filter(e => e.messageId !== msg.messageId);
            },
            (error) => {
                console.log('sf e', error)
                this.state.conversation.sendingMessages = this.state.conversation.sendingMessages.filter(e => e.messageId !== msg.messageId);
            }
        );
    },

    quoteMessage(message) {
        this.state.conversation.quotedMessage = message;
        this.state.conversation.currentConversationInfo._quotedMessage = message;
    },

    getConversationInfo(conversation) {
        let info = wfc.getConversationInfo(conversation);
        return this._patchConversationInfo(info, false);
    },


    /**
     * 获取会话消息
     * @param {Conversation} conversation 会话
     * @param {number} fromIndex 其实消息的 messageId
     * @param {boolean} before 获取其实消息之前，还是之后的消息
     * @param {string} withUser 过滤该用户发送或接收的消息
     * @param {function (Message[]) } callback 消息列表会回调
     */
    getMessages(conversation, fromIndex = 0, before = true, withUser = '', callback) {
        wfc.getMessagesV2(conversation, fromIndex, before, 20, withUser, msgs => {
            msgs = msgs.map(m => this._patchMessage(m, 0));
            //callback && callback(msgs);
            setTimeout(() => callback && callback(msgs), 200)
        }, err => {
            console.error('getMessageV2 error', err)
            callback && callback([]);
        });
    },

    getMessageInTypes(conversation, contentTypes, timestamp, before = true, withUser = '', callback) {
        wfc.getMessagesByTimestampV2(conversation, contentTypes, timestamp, before, 20, withUser, msgs => {
            msgs = msgs.map(m => this._patchMessage(m, 0));
            callback && callback(msgs);
        }, err => {
            callback && callback([]);
        });
    },

    _loadCurrentConversationMessages() {
        console.log('_loadCurrentConversationMessages')
        if (!this.state.conversation.currentConversationInfo) {
            return;
        }
        // TODO 可以在这儿加载所有未读消息，以实现滚动到一条未读消息的地方
        let conversation = this.state.conversation.currentConversationInfo.conversation;
        wfc.getMessagesV2(conversation, 0, true, 20, '', msgs => {
            this.state.conversation.currentConversationMessageList = msgs;
            this._patchCurrentConversationMessages();
            if (msgs.length) {
                this.state.conversation.currentConversationOldestMessageId = msgs[0].messageId;
            }
            for (let i = 0; i < msgs.length; i++) {
                if (gt(msgs[i].messageUid, 0)) {
                    this.state.conversation.currentConversationOldestMessageUid = msgs[0].messageUid;
                    break;
                }
            }
        }, err => {
            console.error('_loadCurrentConversationMessages error', err);
        });
    },

    _patchCurrentConversationMessages() {
        let lastTimestamp = 0;
        let msgs = this.state.conversation.currentConversationMessageList;
        msgs.forEach(m => {
            this._patchMessage(m, lastTimestamp);
            lastTimestamp = m.timestamp;
        });
    },

    _onloadConversationMessages(conversation, messages) {
        if (!messages || messages.length === 0) {
            return false;
        }
        let loadNewMsg = false;
        let lastTimestamp = 0;
        let newMsgs = [];
        messages.forEach(m => {
            let index = this.state.conversation.currentConversationMessageList.findIndex(cm => cm.messageId === m.messageId)
            if (index === -1) {
                this._patchMessage(m, lastTimestamp);
                lastTimestamp = m.timestamp;
                newMsgs.push(m);
                loadNewMsg = true;
            }
        });
        this.state.conversation.currentConversationMessageList = newMsgs.concat(this.state.conversation.currentConversationMessageList);
        let streamingTextGeneratingMessage = this.state.conversation.streamingTextGeneratingMessages.get(this._conversationKey(conversation));
        if(streamingTextGeneratingMessage){
            this._patchMessage(streamingTextGeneratingMessage, lastTimestamp);
            this.state.conversation.currentConversationMessageList.push(streamingTextGeneratingMessage);
        }
        return loadNewMsg;
    },

    loadConversationHistoryMessages(loadedCB, completeCB, enableLoadRemoteHistoryMessage = true) {
        if (!this.state.conversation.currentConversationInfo) {
            return;
        }
        let conversation = this.state.conversation.currentConversationInfo.conversation;
        console.log('loadConversationHistoryMessage', conversation, this.state.conversation.currentConversationOldestMessageId, stringValue(this.state.conversation.currentConversationOldestMessageUid));
        let loadRemoteHistoryMessageFunc = () => {
            console.log('loadRemoteConversationMessages', conversation, this.state.conversation.currentConversationOldestMessageUid);
            wfc.loadRemoteConversationMessages(conversation, [], this.state.conversation.currentConversationOldestMessageUid, 20,
                (msgs) => {
                    console.log('loadRemoteConversationMessages response', msgs.length);
                    if (msgs.length === 0) {
                        completeCB();
                    } else {
                        // 可能拉回来的时候，本地已经切换会话了
                        if (conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                            this.state.conversation.currentConversationOldestMessageUid = msgs[0].messageUid;
                            let filteredMsgs = msgs.filter(m => {
                                return m.messageId !== 0 && this.state.conversation.currentConversationMessageList.findIndex(cm => eq(cm.messageUid, m.messageUid)) === -1
                            })
                            if (filteredMsgs.length === 0) {
                                loadedCB();
                                return;
                            }

                            this._onloadConversationMessages(conversation, filteredMsgs);
                            loadedCB();
                        }
                        if (!this.state.conversation.currentConversationInfo.lastMessage) {
                            this._reloadConversation(conversation);
                        }
                    }
                },
                (error) => {
                    completeCB();
                });
        }

        wfc.getMessagesV2(conversation, this.state.conversation.currentConversationOldestMessageId, true, 20, '', lmsgs => {
            if (lmsgs.length > 0) {
                if (!conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                    return;
                }
                this.state.conversation.currentConversationOldestMessageId = lmsgs[0].messageId;
                if (gt(lmsgs[0].messageUid, 0)) {
                    this.state.conversation.currentConversationOldestMessageUid = lmsgs[0].messageUid;
                }
                this._onloadConversationMessages(conversation, lmsgs)
                if (lmsgs.length < 20) {
                    console.log('getMessageV2, no more new local messages, try to load remote history message', enableLoadRemoteHistoryMessage);
                    if (enableLoadRemoteHistoryMessage) {
                        loadRemoteHistoryMessageFunc();
                    } else {
                        completeCB();
                    }
                } else {
                    // loadedCB();
                    setTimeout(() => loadedCB(), 200)
                }
            } else {
                console.log('getMessageV2, no more local messages, try to load remote history message', enableLoadRemoteHistoryMessage);
                if (enableLoadRemoteHistoryMessage) {
                    loadRemoteHistoryMessageFunc();
                } else {
                    completeCB();
                }
            }
        }, err => {
            console.error('getMessagesV2 error', err);
            completeCB();
        });
    },

    setConversationTop(conversation, top) {
        wfc.setConversationTop(conversation, top,
            () => {
                this._reloadConversation(conversation);
            },
            (err) => {
                console.log('setConversationTop error', err)
            });
    },

    setConversationSilent(conversation, silent) {
        wfc.setConversationSlient(conversation, silent,
            () => {
                this._reloadConversation(conversation);
            },
            (err) => {
                console.log('setConversationSilent error', err)
            });
    },

    removeConversation(conversation) {
        wfc.removeConversation(conversation, false);
        if (this.state.conversation.currentConversationInfo && this.state.conversation.currentConversationInfo.conversation.equal(conversation)) {
            this.setCurrentConversationInfo(null);
        }
        this.state.conversation.conversationInfoList = this.state.conversation.conversationInfoList.filter(info => !info.conversation.equal(conversation));
        this.updateTray();
    },

    getMessageById(messageId) {
        let msg = wfc.getMessageById(messageId);
        if (msg) {
            this._patchMessage(msg, 0);
        }
        return msg;
    },

    getMessageByUid(messageUid) {
        let msg = wfc.getMessageByUid(messageUid);
        if (msg) {
            this._patchMessage(msg, 0);
        }
        return msg;
    },

    _patchMessage(m, lastTimestamp = 0, userInfoMap) {
        // TODO
        // _from
        // _showTime
        if (m.conversation.type === ConversationType.Single) {
            m._from = userInfoMap ? userInfoMap.get(m.from) : wfc.getUserInfo(m.from, false, '');
        }
        if (!m._from || !m._from.updateDt) {
            let u = wfc.getUserInfo(m.from, false, m.conversation.type === ConversationType.Group ? m.conversation.target : '');
            // clone for modify
            // TODO sdk 返回的时候，直接返回 clone copy，而不是直接返回底层的数据，防止上层修改，影响到底层数据模型
            m._from = Object.assign({}, u);
        }
        if (m.conversation.type === ConversationType.Group) {
            m._from._displayName = wfc.getGroupMemberDisplayNameEx(m._from);
        } else {
            m._from._displayName = wfc.getUserDisplayNameEx(m._from);
        }
        if (m.conversation.type === ConversationType.SecretChat) {
            if (m.messageContent instanceof MediaMessageContent && m.messageContent.remotePath && m.messageContent.remotePath.startsWith("http")) {
                m.messageContent.remotePath = `http://localhost:${Config.SECRET_CHAT_MEDIA_DECODE_SERVER_PORT}?target=${m.conversation.target}&url=${m.messageContent.remotePath}`
            }
        }

        if (lastTimestamp === 0 || (numberValue(lastTimestamp) > 0 && numberValue(m.timestamp) - numberValue(lastTimestamp) > 5 * 60 * 1000)) {
            m._showTime = true;
        }
        m._timeStr = helper.timeFormat(m.timestamp)

        if (m.messageContent instanceof CompositeMessageContent) {
            this._patchCompositeMessageContent(m.messageContent);
        }

        // TODO 如果Im server支持备选网络，需要根据当前的网络情况，判断当前是处于主网络，还是备选网络，并动态修改媒体类消息的remotePath，不然可能会出现不能正常加载的情况
        // 如何判断是主网络，还是备选网络，这儿提供一种思路：分别通过主网络和备选网络测试访问im server的/api/version接口
        // 判断是主网络，还是备选网络，一般启动的时候，检测到网络网络变化的时候，在判断一次。
        // if(m.messageContent instanceof MediaMessageContent){
        // TODO 动态修改remotePath
        // }

        return m;
    },

    _patchCompositeMessageContent(compositeMessageContent) {
        let messages = compositeMessageContent.messages;
        messages.forEach(m => {
            this._patchMessage(m, 0)
        })
    },

    // 解析会话目标（头像/名称）需要查用户/群信息，本地没有还会发远程拉取，
    // 是唯一昂贵的部分，必须按需（展示时）调用，不能对会话列表批量调用。
    _resolveConversationTarget(conversation, userInfoMap, groupInfoMap) {
        if (conversation.type === ConversationType.Single) {
            conversation._target = userInfoMap ? userInfoMap.get(conversation.target) : wfc.getUserInfo(conversation.target, false);
            if (conversation._target) {
                conversation._target._displayName = wfc.getUserDisplayNameEx(conversation._target);
            }
        } else if (conversation.type === ConversationType.Group) {
            conversation._target = groupInfoMap ? groupInfoMap.get(conversation.target) : wfc.getGroupInfo(conversation.target, false);
            if (conversation._target) {
                conversation._target._isFav = wfc.isFavGroup(conversation.target);
                conversation._target._displayName = conversation._target.remark ? conversation._target.remark : conversation._target.name;
            }
        } else if (conversation.type === ConversationType.Channel) {
            conversation._target = wfc.getChannelInfo(conversation.target, false);
            conversation._target._displayName = conversation._target.name;
        } else if (conversation.type === ConversationType.SecretChat) {
            let secretChatInfo = wfc.getSecretChatInfo(conversation.target);
            if (secretChatInfo) {
                let userId = secretChatInfo.userId;
                let userInfo = wfc.getUserInfo(userId, false);
                conversation._target = userInfo;
                conversation._target._displayName = wfc.getUserDisplayNameEx(userInfo);
            } else {
                conversation._target = {};
            }
        } else if (conversation.type === ConversationType.ChatRoom) {
            wfc.getChatroomInfo(conversation.target, 0, (chatRoomInfo) => {
                conversation._target = chatRoomInfo;
            }, err => {
                console.log('get chatRoomInfo error', err);
                conversation._target = {};
            });
        }
    },

    // 会话目标（头像/名称）解析要在真正展示时才有意义，页面渲染时调用本方法按需解析并缓存到 conversation._target 上，
    // 避免会话很多（2000+ 群）时一次性对全部会话拉取用户/群信息，卡死主线程。
    ensureConversationTarget(conversation) {
        if (!conversation._target) {
            this._resolveConversationTarget(conversation);
        }
        return conversation._target;
    },

    // 只做纯本地计算，不涉及任何用户/群信息查询，会话列表批量调用是廉价的。
    _patchConversationInfoLight(info, patchLastMessage = true, userInfoMap) {
        if (gt(info.timestamp, 0)) {
            info._timeStr = helper.dateFormat(info.timestamp);
        } else {
            info._timeStr = '';
        }


        if (patchLastMessage && info.lastMessage && info.lastMessage.conversation !== undefined && (!info.lastMessage._from || !info.lastMessage._from.updateDt)) {
            this._patchMessage(info.lastMessage, 0, userInfoMap)
        }

        if (info.unreadCount) {
            info._unread = info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll;
        }
        if (info.conversation.equal(avenginekitproxy.conversation)) {
            info._isVoipOngoing = true;
        } else {
            info._isVoipOngoing = false;
        }

        return info;
    },

    _patchConversationInfo(info, patchLastMessage = true, userInfoMap, groupInfoMap) {
        this._resolveConversationTarget(info.conversation, userInfoMap, groupInfoMap);
        return this._patchConversationInfoLight(info, patchLastMessage, userInfoMap);
    },
    addDownloadingMessage(messageUid) {
        this.state.conversation.downloadingMessages.push({
            messageUid: messageUid,
            progress: 0,
            total: Number.MAX_SAFE_INTEGER,
        });
        console.log('add downloading')
    },

    isDownloadingMessage(messageUid) {
        // web端尚未测试，先屏蔽
        if (!isElectron()) {
            return false;
        }
        return this.state.conversation.downloadingMessages.findIndex(dm => eq(dm.messageUid, messageUid)) >= 0;
    },

    isSendingMessage(messageId) {
        return this.state.conversation.sendingMessages.has(messageId);
    },

    getDownloadingMessageStatus(messageUid) {
        return this.state.conversation.downloadingMessages.find(dm => eq(dm.messageUid, messageUid));
    },

    getSendingStatus(messageId) {
        return this.state.conversation.sendingMessages.find(e => e.messageId === messageId);
    },

    addFloatingConversation(conversation) {
        this.state.conversation.floatingConversations.push(conversation);
    },

    removeFloatingConversation(conversation) {
        this.state.conversation.floatingConversations = this.state.conversation.floatingConversations.filter(c => !c.equal(conversation))
    },

    isConversationInCurrentWindow(conversation) {
        if (this.state.misc.isMainWindow) {
            let index = this.state.conversation.floatingConversations.findIndex(fc => fc.equal(conversation));
            return index === -1;
        } else {
            return this.state.conversation.currentConversationInfo && this.state.conversation.currentConversationInfo.conversation.equal(conversation);
        }
    },

    // contact actions

    _loadSelfUserInfo() {
        this.state.contact.selfUserInfo = wfc.getUserInfo(wfc.getUserId(), false);
    },

    _loadFriendList() {
        let friends = wfc.getMyFriendList(false);
        if(Config.FILE_HELPER_ID){
            let fileHelperIndex = friends.indexOf(Config.FILE_HELPER_ID);
            if (fileHelperIndex < 0 && Config.FILE_HELPER_ID) {
                friends.push(Config.FILE_HELPER_ID);
            }
        }
        if (friends && friends.length > 0) {
            let friendList = wfc.getUserInfos(friends, '');
            this.state.contact.friendList = this._patchAndSortUserInfos(friendList, '');
        }
    },

    getUserOnlineState(userId) {
        let userOnlineState = this.state.misc.userOnlineStateMap.get(userId);
        if (userOnlineState) {
            return userOnlineState.desc();
        }
        return '';
    },

    _patchCurrentConversationOnlineStatus() {
        let convInfo = this.state.conversation.currentConversationInfo;
        if (convInfo && convInfo.conversation.type === ConversationType.Single) {
            // 在 将 object 和 ui 绑定之前， 向 object 中新增的属性是 reactive 的，但绑定之后，才新增的属性，不是 reactive 的，
            // 故需要通过下面这种方法，让其成为 reactive 的属性
            // this.state.conversation.currentConversationInfo.conversation._targetOnlineStateDesc = userOnlineStatus.desc();
            // Vue.set(this.state.conversation.currentConversationInfo.conversation, '_targetOnlineStateDesc', this.getUserOnlineState(convInfo.conversation.target))
            this.state.conversation.currentConversationInfo.conversation._targetOnlineStateDesc = this.getUserOnlineState(convInfo.conversation.target);
        } else {
            //TODO
        }
    },
    _loadFriendRequest() {
        let requests = wfc.getIncommingFriendRequest()

        requests.sort((a, b) => numberValue(b.timestamp) - numberValue(a.timestamp))
        requests = requests.length >= 20 ? requests.slice(0, 20) : requests;
        let uids = [];
        requests.forEach(fr => {
            uids.push(fr.target);
        });
        let userInfos = wfc.getUserInfos(uids, '')
        requests.forEach(fr => {
            let userInfo = userInfos.find((u => u.uid === fr.target));
            fr._target = userInfo;
        });

        this.state.contact.friendRequestList = requests;
        this.state.contact.unreadFriendRequestCount = wfc.getUnreadFriendRequestCount();
    },

    _patchAndSortUserInfos(userInfos, groupId = '', compareFn) {
        userInfos = userInfos.map(u => {
            if (groupId) {
                u._displayName = wfc.getGroupMemberDisplayNameEx(u);
                u._displayNameIgnoreFriendAlias = wfc.getGroupMemberDisplayNameEx(u, true);
            } else {
                u._displayName = wfc.getUserDisplayNameEx(u);
                u._displayNameIgnoreFriendAlias = u.displayName
            }
            let pinyin = convertPinyinCached(u._displayName);
            u._pinyin = pinyin.pinyin;
            let firstLetter = u._pinyin[0];
            if (firstLetter >= 'a' && firstLetter <= 'z') {
                u.__sortPinyin = 'a' + u._pinyin;
            } else {
                u.__sortPinyin = 'z' + u._pinyin;
            }
            u._firstLetters = pinyin.firstLetters;
            return u;
        });
        if (compareFn) {
            userInfos = userInfos.sort(compareFn);
        } else {
            userInfos = userInfos.sort((a, b) => nameCollator.compare(a.__sortPinyin, b.__sortPinyin));
        }

        userInfos.forEach(u => {
            let uFirstLetter = u.__sortPinyin[1];
            if (uFirstLetter >= 'a' && uFirstLetter <= 'z') {
                u._category = uFirstLetter;
            } else {
                u._category = '#';
            }
            u._userOnlineStatusDesc = this.getUserOnlineState(u.uid);
        });
        return userInfos;
    },

    _loadFavGroupList() {
        this.state.contact.favGroupList = wfc.getFavGroupList();
    },

    _loadChannelList() {
        wfc.getRemoteListenedChannels(channelIds => {
            if (channelIds) {
                this.state.contact.channelList = channelIds.map(channelId => wfc.getChannelInfo(channelId, false));
                this.state.contact.channelList = this.state.contact.channelList.filter(ch => {
                    return !(ch instanceof NullChannelInfo)
                });
            }
        }, err => {
            console.error('getRemoteListenedChannels error', err)
        });
    },


    _loadFavContactList() {
        let favUserIds = wfc.getFavUsers();
        if (favUserIds.length > 0) {
            this.state.contact.favContactList = this.getUserInfos(favUserIds, '')
            this.state.contact.favContactList.forEach(u => {
                u._category = '☆ 星标朋友';
            })
        } else {
            this.state.contact.favContactList = [];
        }
    },

    _loadAiRobotList() {
        if (Config.AI_ROBOT) {
            let aiUserInfos = this.getUserInfos([Config.AI_ROBOT], '');
            aiUserInfos.forEach(u => {
                u._category = 'AI 助手';
            });
            this.state.contact.aiRobotList = aiUserInfos;
        } else {
            this.state.contact.aiRobotList = [];
        }
    },

    reloadFavGroupList() {
        this._loadFavGroupList();
    },

    setCurrentFriendRequest(friendRequest) {
        this.state.contact.currentFriendRequest = friendRequest;
        this.state.contact.currentFriend = null;
        this.state.contact.currentOrganization = null;
        this.state.contact.currentChatroom = null;
        this.state.contact.currentGroup = null;
        this.state.contact.currentChannel = null;
        this.state.contact.currentExternalDomain = null;
    },

    setCurrentFriend(friend) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = friend;
        this.state.contact.currentOrganization = null;
        this.state.contact.currentChatroom = null;
        this.state.contact.currentGroup = null;
        this.state.contact.currentChannel = null;
        this.state.contact.currentExternalDomain = null;
    },

    setCurrentGroup(group) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentOrganization = null;
        this.state.contact.currentChatroom = null;
        this.state.contact.currentGroup = group;
        this.state.contact.currentChannel = null;
        this.state.contact.currentExternalDomain = null;
    },

    setCurrentChannel(channel) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentOrganization = null;
        this.state.contact.currentChatroom = null;
        this.state.contact.currentGroup = null;
        this.state.contact.currentChannel = channel;
        this.state.contact.currentExternalDomain = null;
    },

    setCurrentOrganization(organization) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = null;
        this.state.contact.currentChannel = null;
        this.state.contact.currentChatroom = null;
        this.state.contact.currentOrganization = organization;
        this.state.contact.currentExternalDomain = null;
    },

    setCurrentExternalDomain(domainInfo) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = null;
        this.state.contact.currentChannel = null;
        this.state.contact.currentChatroom = null;
        this.state.contact.currentOrganization = null;
        this.state.contact.currentExternalDomain = domainInfo;
    },

    setCurrentChatroom(chatroom) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = null;
        this.state.contact.currentChannel = null;
        this.state.contact.currentOrganization = null;
        this.state.contact.currentChatroom = chatroom;
        this.state.contact.currentExternalDomain = null;
    },
    toggleGroupList() {
        this.state.contact.expandGroup = !this.state.contact.expandGroup;
    },

    toggleChannelList() {
        this.state.contact.expandChanel = !this.state.contact.expandChanel;
        // 从服务端拉取，且比较耗性能，故展开时，才从刷新
        if(this.state.contact.expandChanel) {
            this._loadChannelList();
        }
    },

    toggleFriendRequestList() {
        this.state.contact.expandFriendRequestList = !this.state.contact.expandFriendRequestList;
    },

    toggleFriendList() {
        this.state.contact.expandFriendList = !this.state.contact.expandFriendList;
    },

    toggleOrganizationList() {
        this.state.contact.expandOrganization = !this.state.contact.expandOrganization;
    },

    toggleExternalDomainList() {
        this.state.contact.expandExternalDomain = !this.state.contact.expandExternalDomain;
    },

    toggleChatroom() {
        this.state.contact.expandChatroom = !this.state.contact.expandChatroom;
    },

    // search actions
    hideSearchView() {
        this.state.search.query = '';
    },

    setSearchQuery(query) {
        this.state.search.query = query;
        if (query) {
            console.log('search', query)
            if (this.state.search.searchDomainInfo) {
                this.searchUser(query, this.state.search.searchDomainInfo.domainId);
            } else {
                this.state.search.contactSearchResult = this.filterContact(query);
                this.state.search.groupSearchResult = this.filterGroupConversation(query);
                this.state.search.conversationSearchResult = this.filterConversation(query);
                // this.state.search.messageSearchResult = this.searchMessage(query);
                this.searchUser(query);
                this.searchChannel(query);
            }

        } else {
            this.state.search._reset();
        }
    },

    setSearchDomainInfo(domainInfo) {
        this.state.search.searchDomainInfo = domainInfo;
    },

    // ==================== 会话内服务器搜索（wf-search-server） ====================

    resetConversationSearch() {
        this.state.search.conversationSearch._reset();
    },

    /**
     * 会话内消息搜索（服务器搜索服务）。
     * cursor 为空视为新搜索（重置结果），非空为翻页（追加）。
     *
     * @param {Object} conversation {type, target, line}
     * @param {Object} options {keyword, contentTypes, fromUser, startTime, endTime, cursor}
     * @returns {Promise<Object>} 服务端返回 data
     */
    async searchConversationMessages(conversation, options = {}) {
        const cs = this.state.search.conversationSearch;
        if (!options.cursor) {
            cs.conversation = conversation;
            cs.query = options.keyword || '';
            cs.contentTypes = options.contentTypes || [];
            cs.fromUser = options.fromUser || null;
            cs.startTime = options.startTime || null;
            cs.endTime = options.endTime || null;
            cs.items = [];
            cs.cursor = null;
            cs.hasMore = false;
            cs.truncated = false;
            cs.total = 0;
        }
        cs.loading = true;
        cs.error = null;
        try {
            const data = await searchServerApi.searchConversationMessages(conversation, {
                keyword: options.keyword || '',
                contentTypes: options.contentTypes || [],
                fromUser: options.fromUser || null,
                startTime: options.startTime || null,
                endTime: options.endTime || null,
                cursor: options.cursor || null,
                size: options.size || 20,
            });
            cs.items = options.cursor ? cs.items.concat(data.items || []) : (data.items || []);
            cs.total = data.total || 0;
            cs.cursor = data.nextCursor || null;
            cs.hasMore = !!data.hasMore;
            cs.truncated = !!data.truncated;
            return data;
        } catch (e) {
            cs.error = (e && e.message) ? e.message : '搜索失败';
            throw e;
        } finally {
            cs.loading = false;
        }
    },

    /**
     * 消息上下文（服务器搜索服务）：锚点 ±N 条 + 上一处/下一处命中
     * @param {Object} conversation {type, target, line}
     * @param {number} anchorMid 锚点消息 mid
     * @param {Object} options {beforeCount, afterCount, keyword, contentTypes, fromUser, startTime, endTime}
     * @returns {Promise<Object>}
     */
    searchConversationMessageContext(conversation, anchorMid, options = {}) {
        return searchServerApi.getMessageContext(conversation, anchorMid, options);
    },

    searchUser(query, domainId = '') {
        console.log('search user', query)
        wfc.searchUserEx(domainId, query, SearchType.General, 0, ((keyword, userInfos) => {
            console.log('search user result', query, userInfos)
            if (this.state.search.query === keyword) {
                this.state.search.userSearchResult = userInfos.filter(u => !wfc.isMyFriend(u.uid));
            }
        }), (err) => {
            console.log('search user error', query, err)
            if (this.state.search.query === query) {
                this.state.search.userSearchResult = [];
            }
        });
    },

    searchChannel(query) {
        console.log('search channel')
        wfc.searchChannel(query, true, (keyword, channelInfos) => {
            console.log('search channel result', channelInfos);
            if (this.state.search.query === keyword) {
                console.log('search channel result', channelInfos);
                this.state.search.channelSearchResult = channelInfos;
            }
        }, err => {
            console.log('search channel error', query, err)
            if (this.state.search.query === query) {
                this.state.search.channelSearchResult = [];
            }
        })
    },

    // TODO 到底是什么匹配了
    filterContact(query) {
        let result = this.state.contact.friendList.filter(u => {
            return u.displayName.indexOf(query) > -1 || u._displayName.indexOf(query) > -1 || u._firstLetters.indexOf(query.toLowerCase()) > -1 || u._pinyin.indexOf(query.toLowerCase()) > -1
        });

        console.log('friend searchResult', result)
        return result;
    },

    searchFiles(keyword, beforeMessageUid, successCB, failCB) {
        if (!keyword) {
            return;
        }
        wfc.searchFiles(keyword, null, '', beforeMessageUid, 0, 20,
            (files) => {
                this._patchFileRecords(files);
                successCB && successCB(files);
            },
            (errorCode) => {
                console.log('search file error', errorCode);
                failCB && failCB(errorCode);
            })
    },

    filterUsers(users, filter) {
        if (!users || !filter || !filter.trim()) {
            return users;
        }
        let queryPinyin = convertPinyinCached(filter).pinyin;
        let result = users.filter(u => {
            return u.displayName.indexOf(filter) > -1 || u._displayName.indexOf(filter) > -1 || u._displayName.indexOf(queryPinyin) > -1
                || u._pinyin.indexOf(filter) > -1 || u._pinyin.indexOf(queryPinyin) > -1
                || u._firstLetters.indexOf(filter) > -1 || u._firstLetters.indexOf(queryPinyin) > -1
        });
        return result;
    },

    // TODO 匹配类型，是群名称匹配上了，还是群成员的名称匹配上了？
    // 目前只搜索群名称
    filterFavGroup(query) {
        console.log('to search group', this.state.contact.favGroupList)
        let queryPinyin = convertPinyinCached(query).pinyin;
        let result = this.state.contact.favGroupList.filter(g => {
            let groupNamePinyin = convertPinyinCached(g.name).pinyin;
            return g.name.indexOf(query) > -1 || g.name.indexOf(queryPinyin) > -1
                || groupNamePinyin.indexOf(query) > -1 || groupNamePinyin.indexOf(queryPinyin) > -1;
        });

        console.log('group searchResult', result)
        return result;
    },

    filterConversation(query) {
        let lowerQuery = query.toLowerCase();
        return this.state.conversation.conversationInfoList.filter(info => {
            let target = this.ensureConversationTarget(info.conversation);
            if (!target || !target._displayName) return false;
            let targetPinyin = convertPinyinCached(target._displayName);
            return target._displayName.indexOf(query) > -1
                || targetPinyin.pinyin.indexOf(lowerQuery) > -1
                || targetPinyin.firstLetters.indexOf(lowerQuery) > -1;
        });
    },

    filterGroupConversation(query) {
        // query = query.toLowerCase();
        // let groups = this.state.conversation.conversationInfoList.filter(info => info.conversation.type === ConversationType.Group).map(info => info.conversation._target);
        // return groups.filter(groupInfo => {
        //     let namePinyin = convert(groupInfo.name, {style: 0}).join('').trim().toLowerCase();
        //     let firstLetters = convert(groupInfo.name, {style: 4}).join('').trim().toLowerCase();
        //     return groupInfo.name.indexOf(query) > -1 || namePinyin.indexOf(query) > -1 || firstLetters.indexOf(query) > -1
        // })
        let gsr = wfc.searchGroups(query)
        return gsr.map(r => r.groupInfo);
    },

    searchMessage(conversation, query) {
        let msgs = wfc.searchMessage(conversation, query)
        msgs = msgs.reverse();
        return msgs.map(m => this._patchMessage(m, 0));
    },

    searchMessageInTypes(conversation, contentTypes, query, offset) {
        let msgs = wfc.searchMessageByTypes(conversation, query, contentTypes, true, 20, offset)
        return msgs.map(m => this._patchMessage(m, 0));
    },

    searchConversation(query, types = [0, 1, 2], lines = [0, 1, 2]) {
        let results = wfc.searchConversation(query, types, lines);
        return results.map(r => {
            let info = wfc.getConversationInfo(r.conversation);
            r._conversationInfo = this._patchConversationInfo(info, false);
            return r;
        })
    },

    // pick actions
    pickOrUnpickUser(user) {
        let index = this.state.pick.users.findIndex(u => u.uid === user.uid);
        if (index >= 0) {
            this.state.pick.users = this.state.pick.users.filter(u => user.uid !== u.uid)
        } else {
            this.state.pick.users.push(user);
        }
    },

    isUserPicked(user) {
        let index = this.state.pick.users.findIndex(u => u.uid === user.uid);
        return index >= 0;
    },

    // pick actions
    pickOrUnpickOrganization(org) {
        let index = this.state.pick.organizations.findIndex(o => o.id === org.id);
        if (index >= 0) {
            this.state.pick.organizations = this.state.pick.organizations.filter(o => o.id !== org.id)
        } else {
            this.state.pick.organizations.push(org);
        }
    },

    isOrganizationPicked(org) {
        let index = this.state.pick.organizations.findIndex(o => o.id === org.id);
        return index >= 0;
    },

    pickOrUnpickConversation(conversation) {
        let index = this.state.pick.conversations.findIndex(c => (conversation.target === c.target && conversation.line === c.line && conversation.type === c.type))
        if (index >= 0) {
            this.state.pick.conversations = this.state.pick.conversations.filter(c => !(conversation.target === c.target && conversation.line === c.line && conversation.type === c.type))
        } else {
            this.state.pick.conversations.push(conversation);
        }
    },

    // misc actions
    createConversation(users, successCB, failCB) {
        if (users.length === 1) {
            let conversation = new Conversation(ConversationType.Single, users[0].uid, 0);
            this.setCurrentConversation(conversation);
            successCB && successCB(conversation);
            return;
        }

        let groupName = this.state.contact.selfUserInfo.displayName;
        let groupMemberIds = [];
        for (let i = 0; i < users.length; i++) {
            groupMemberIds.push(users[i].uid)
            if (i <= 3) {
                groupName += '、' + users[i].displayName;
            }
        }
        groupName = groupName.substr(0, groupName.length - 1);
        wfc.createGroup(null, GroupType.Restricted, groupName, null, null, groupMemberIds, null, [0], null,
            (groupId) => {
                let conversation = new Conversation(ConversationType.Group, groupId, 0)
                this.setCurrentConversation(conversation);
                successCB && successCB(conversation);
            }, (error) => {
                console.log('create group error', error)
                failCB && failCB(error);
            });
    },

    _loadUserLocalSettings() {
        let userId = wfc.getUserId();
        // 默认允许通知
        let setting = getItem(userId + '-' + 'notification');
        this.state.misc.enableNotification = setting === null || setting === '1'
        setting = getItem(userId + '-' + 'notificationDetail');
        this.state.misc.enableNotificationMessageDetail = setting === null || setting === '1'
        this.state.misc.enableCloseWindowToExit = getItem(userId + '-' + 'closeWindowToExit') === '1'
        this.state.misc.enableAutoLogin = getItem(userId + '-' + 'autoLogin') === '1'
        setting = getItem('minimizable')
        this.state.misc.enableMinimize = setting === null || setting === '1'
        setting = getItem(userId + '-' + 'showSendButton')
        this.state.misc.showSendButton = setting !== null ? setting === '1' : false
        // 会话列表分组默认开启
        setting = getItem(userId + '-' + 'conversationListFilter')
        this.state.misc.enableConversationListFilter = setting === null || setting === '1'
    },

    setEnableNotification(enable) {
        this.state.misc.enableNotification = enable;
        setItem(this.state.contact.selfUserInfo.uid + '-' + 'notification', enable ? '1' : '0')
    },

    setEnableMinimize(enable) {
        this.state.misc.enableMinimize = enable;
        setItem('minimizable', enable ? '1' : '0')
        currentWindow.minimizable = enable;
    },

    setEnableNotificationDetail(enable) {
        this.state.misc.enableNotificationMessageDetail = enable;
        setItem(this.state.contact.selfUserInfo.uid + '-' + 'notificationDetail', enable ? '1' : '0')
    },

    setEnableCloseWindowToExit(enable) {
        this.state.misc.enableCloseWindowToExit = enable;
        setItem(this.state.contact.selfUserInfo.uid + '-' + 'closeWindowToExit', enable ? '1' : '0')
        ipcRenderer.send(IPCEventType.ENABLE_CLOSE_WINDOW_TO_EXIT, enable)
    },

    setEnableAutoLogin(enable) {
        this.state.misc.enableAutoLogin = enable;
        setItem(this.state.contact.selfUserInfo.uid + '-' + 'autoLogin', enable ? '1' : '0')
    },

    setShowSendButton(enable) {
        this.state.misc.showSendButton = enable;
        setItem(this.state.contact.selfUserInfo.uid + '-' + 'showSendButton', enable ? '1' : '0')
    },

    setEnableConversationListFilter(enable) {
        this.state.misc.enableConversationListFilter = enable;
        setItem(this.state.contact.selfUserInfo.uid + '-' + 'conversationListFilter', enable ? '1' : '0')
    },

    // clone一下，别影响到好友列表
    getUserInfos(userIds, groupId) {
        let userInfos = wfc.getUserInfos(userIds, groupId);
        let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
        return this._patchAndSortUserInfos(userInfosCloneCopy, groupId);
    },

    // clone一下，别影响到好友列表
    /**
     * @param groupId
     * @param includeSelf
     * @param sortByPinyin
     * @return {*}
     */
    getGroupMemberUserInfos(groupId, includeSelf = true, sortByPinyin = false) {

        let memberIds = wfc.getGroupMemberIds(groupId);
        let userInfos = wfc.getUserInfos(memberIds, groupId);
        if (!includeSelf) {
            userInfos = userInfos.filter(u => u.uid !== wfc.getUserId())
        }
        let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
        if (sortByPinyin) {
            return this._patchAndSortUserInfos(userInfosCloneCopy, groupId);
        } else {
            let compareFn = (u1, u2) => {
                let index1 = memberIds.findIndex(id => id === u1.uid)
                let index2 = memberIds.findIndex(id => id === u2.uid)
                return index1 - index2;
            }
            return this._patchAndSortUserInfos(userInfosCloneCopy, groupId, compareFn);
        }
    },

    /**
     * 异步获取群成员用户信息
     * 仅 electron 环境有效
     * @param groupId
     * @param includeSelf
     * @param sortByPinyin
     * @return {Promise<unknown>}
     */
    getGroupMemberUserInfosAsync(groupId, includeSelf = true, sortByPinyin = false) {
        return new Promise((resolve, reject) => {
            let memberIds = wfc.getGroupMemberIds(groupId);
            wfc.getUserInfosAsync(memberIds, groupId, userInfos => {
                if (!includeSelf) {
                    userInfos = userInfos.filter(u => u.uid !== wfc.getUserId())
                }
                let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
                if (sortByPinyin) {
                    resolve(this._patchAndSortUserInfos(userInfosCloneCopy, groupId));
                } else {
                    let compareFn = (u1, u2) => {
                        let index1 = memberIds.findIndex(id => id === u1.uid)
                        let index2 = memberIds.findIndex(id => id === u2.uid)
                        return index1 - index2;
                    }
                    // resolve(userInfosCloneCopy)
                    resolve(this._patchAndSortUserInfos(userInfosCloneCopy, groupId, compareFn));
                }
            });
        })
    },

    /**
     * 获取部分群成员用户信息
     * @param groupId
     * @param memberIds
     * @param sortByPinyin
     * @return {Promise<unknown>}
     */
    getPartialGroupMembersInfoAsync(groupId, memberIds, sortByPinyin = false) {
        return new Promise((resolve, reject) => {
            wfc.getUserInfosAsync(memberIds, groupId, userInfos => {
                let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
                if (sortByPinyin) {
                    resolve(this._patchAndSortUserInfos(userInfosCloneCopy, groupId));
                } else {
                    let compareFn = (u1, u2) => {
                        let index1 = memberIds.findIndex(id => id === u1.uid)
                        let index2 = memberIds.findIndex(id => id === u2.uid)
                        return index1 - index2;
                    }
                    // resolve(userInfosCloneCopy)
                    resolve(this._patchAndSortUserInfos(userInfosCloneCopy, groupId, compareFn));
                }
            });
        })
    },
    // clone一下，别影响到好友列表
    getConversationMemberUsrInfos(conversation) {
        let userInfos = [];
        if (conversation.type === 0) {
            if (conversation.target !== this.state.contact.selfUserInfo.uid) {
                userInfos.push(wfc.getUserInfo(wfc.getUserId(), false));
            }
            userInfos.push(wfc.getUserInfo(conversation.target, false));
            let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
            userInfos = this._patchAndSortUserInfos(userInfosCloneCopy, '');
        } else if (conversation.type === 1) {
            userInfos = this.getGroupMemberUserInfos(conversation.target, true);
        }
        return userInfos;
    },

    // 仅 electron 环境有效
    async getConversationMemberUsrInfosAsync(conversation) {
        let userInfos = [];
        if (conversation.type === 0) {
            if (conversation.target !== this.state.contact.selfUserInfo.uid) {
                userInfos.push(wfc.getUserInfo(wfc.getUserId(), false));
            }
            userInfos.push(wfc.getUserInfo(conversation.target, false));
            let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
            userInfos = this._patchAndSortUserInfos(userInfosCloneCopy, '');
        } else if (conversation.type === 1) {
            userInfos = await this.getGroupMemberUserInfosAsync(conversation.target, true);
        }
        return userInfos;
    },

    getMyFileRecords(beforeUid, count, successCB, failCB) {
        if (!successCB) {
            return;
        }
        wfc.getMyFileRecords(beforeUid, 0, count, fileRecords => {
            this._patchFileRecords(fileRecords)
            successCB(fileRecords);
        }, failCB)
    },

    getConversationFileRecords(conversation, fromUser, beforeMessageUid, count, successCB, failCB) {
        wfc.getConversationFileRecords(conversation, fromUser, beforeMessageUid, 0, count, fileRecords => {
            this._patchFileRecords(fileRecords)
            successCB(fileRecords);
        }, failCB);
    },

    deleteFriend(target) {
        wfc.deleteFriend(target, () => {
            let conv = new Conversation(ConversationType.Single, target, 0);
            wfc.removeConversation(conv, true);
            this.state.conversation.conversationInfoList = this.state.conversation.conversationInfoList.filter(info => !info.conversation.equal(conv))
        }, (err) => {
            console.log('deleteFriend error', err);
        });
    },

    _patchFileRecords(fileRecords) {
        fileRecords.forEach(fileRecord => {
            let groupId = fileRecord.conversation.type === 1 ? fileRecord.conversation.target : '';
            if (groupId) {
                fileRecord._userDisplayName = wfc.getGroupMemberDisplayName(groupId, fileRecord.userId);
            } else {
                fileRecord._userDisplayName = wfc.getUserDisplayName(fileRecord.userId);
            }
            let conversationInfo = wfc.getConversationInfo(fileRecord.conversation);
            this._patchConversationInfo(conversationInfo, false);

            let convName = ''
            if(conversationInfo.conversation._target && conversationInfo.conversation._target._displayName){
                if (fileRecord.conversation.type === 0) {
                    convName = '与' + conversationInfo.conversation._target._displayName + '的聊天';
                } else {
                    convName = conversationInfo.conversation._target._displayName;
                }
            } else {
                convName = `<${conversationInfo.conversation.target}>`
            }
             fileRecord._conversationDisplayName = convName
            fileRecord._timeStr = helper.dateFormat(fileRecord.timestamp);
            fileRecord._sizeStr = helper.humanSize(fileRecord.size)
            fileRecord._fileIconName = helper.getFiletypeIcon(fileRecord.name.substring(fileRecord.name.lastIndexOf('.')))
        });
    },

    setPageVisibility(visible) {
        this.state.misc.isPageHidden = !visible;
        if (!visible) {
            this.state.conversation.shouldAutoScrollToBottom = false;
        } else if (this.state.conversation.currentConversationInfo) {
            this.state.conversation.shouldAutoScrollToBottom = true;
        }
    },

    setTheme(theme) {
        this.state.misc.theme = theme;
        setItem('theme', theme);
        this.applyTheme();
    },

    applyTheme() {
        let theme = this.state.misc.theme;
        let actualTheme = theme;
        if (theme === 'system') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', actualTheme);
        watermark.refresh();
    },

    // 字体缩放（参考微信PC端），同时影响字号、会话/联系人列表项高度及头像大小
    setFontScale(scale) {
        scale = this._normalizeFontScale(scale);
        this.state.misc.fontScale = scale;
        setItem('fontScale', scale);
        this.applyFontScale();
    },

    applyFontScale() {
        let scale = this._normalizeFontScale(this.state.misc.fontScale);
        document.documentElement.style.setProperty('--font-scale', scale);
    },

    _normalizeFontScale(scale) {
        scale = parseFloat(scale);
        if (!scale || isNaN(scale)) {
            scale = 1;
        }
        // 限制在 0.85 ~ 1.45 之间，避免界面错乱
        return Math.min(1.45, Math.max(0.85, scale));
    },

    clearConversationUnreadStatus(conversation) {
        let info = wfc.getConversationInfo(conversation);
        if (info && (info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll) > 0) {
            wfc.clearConversationUnreadStatus(conversation);
            this.updateTray();
        }
    },

    clearConversationHistory(conversation) {
        wfc.clearMessages(conversation);
        if (this.state.conversation.currentConversationInfo && conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
            this.state.conversation.currentConversationMessageList = [];
        }
    },

    clearRemoteConversationHistory(conversation) {
        wfc.clearRemoteConversationMessages(conversation, () => {
            if (
                this.state.conversation.currentConversationInfo &&
                conversation.equal(
                    this.state.conversation.currentConversationInfo.conversation
                )
            ) {
                this.state.conversation.currentConversationMessageList = [];
            }
        }, err => {
            console.log('clearRemoteConversationHistory', err);
        });
    },

    clearAllUnreadStatus() {
        wfc.clearAllUnreadStatus();
        this.state.conversation.conversationInfoList.forEach(info => {
            info.unreadCount = new UnreadCount();
        });
        this.updateTray();
    },

    notify(msg) {
        let content = msg.messageContent;
        let icon = require('@/assets/images/icon.png');
        let tip
        let now = new Date().getTime();
        if (this._lastNotificationTime && now - this._lastNotificationTime < 4000) {
            return;
        }
        this._lastNotificationTime = now;

        if (msg.direction === 0 /* && !(type===0 && target===file_transfer_id)*/) {
            return;
        }
        if (MessageConfig.getMessageContentPersitFlag(content.type) === PersistFlag.Persist_And_Count) {
            if (msg.status !== MessageStatus.AllMentioned && msg.status !== MessageStatus.Mentioned) {
                let silent = false;
                for (const info of this.state.conversation.conversationInfoList) {
                    if (info.conversation.equal(msg.conversation)) {
                        silent = info.isSilent;
                        break;
                    }
                }
                if (silent) {
                    return;
                }
                tip = "新消息来了";
            } else {
                tip = "有人@你";
            }

            Push.create(tip, {
                body: this.state.misc.enableNotificationMessageDetail ? content.digest(msg) : '',
                // TODO 下面好像不生效，更新成图片链接
                icon: icon,
                timeout: 4000,
                requireInteraction: true,
                onClick: () => {
                    if (isElectron()) {
                        ipcRenderer.send(IPCEventType.CLICK_NOTIFICATION, currentWindow.getMediaSourceId())
                    } else {
                        window.focus();
                        this.close();
                    }
                    this.setCurrentConversation(msg.conversation)
                }
            }).catch(e => {
                console.error('Please enable notification')
            });
        }
    },

    updateTray() {
        if (!isElectron() || !this.state.misc.isMainWindow) {
            return;
        }
        let count = 0;
        this.state.conversation.conversationInfoList.forEach(info => {
            if (info.isSilent) {
                return;
            }
            let unreadCount = info.unreadCount;
            count += unreadCount.unread;
        });
        if (process.platform === 'linux') {
            this.updateLinuxTitle(count);
            ipcRenderer.send(IPCEventType.UPDATE_BADGE, count)
        } else {
            ipcRenderer.send(IPCEventType.UPDATE_BADGE, count)
        }
    },

    updateLinuxTitle(unreadCount) {
        this.updateLinuxTitle.title = '野火IM';
        this.updateLinuxTitle.unreadCount = unreadCount;
        this.updateLinuxTitle.showTitle = true;
        if (!this.state.misc.linuxUpdateTitleInterval) {
            this.state.misc.linuxUpdateTitleInterval = setInterval(() => {
                if (this.updateLinuxTitle.showTitle || this.updateLinuxTitle.unreadCount < 1) {
                    document.title = this.updateLinuxTitle.title;
                } else {
                    document.title = this.updateLinuxTitle.title + ' ' + this.updateLinuxTitle.unreadCount;
                }
                this.updateLinuxTitle.showTitle = !this.updateLinuxTitle.showTitle;
            }, 1000)
        }
    },

    updateVoipStatus(conversation, isOngoing)  {
        this.state.misc.isVoipOngoing = isOngoing;
        if (!conversation) {
            return
        }
        this.state.conversation.conversationInfoList.forEach(ci => {
            if (ci.conversation.equal(conversation)) {
                ci._isVoipOngoing = isOngoing;
            } else {
                ci._isVoipOngoing = false;
            }
        })
    },

    _filterForwardMessageContent(message) {
        let content = message.messageContent
        if (content instanceof CallStartMessageContent) {
            content = new TextMessageContent(content.digest(message))
        } else if (content instanceof SoundMessageContent) {
            content = new TextMessageContent(content.digest(message) + ' ' + content.duration + "''");
        }
        return content
    },

    _handleStreamingTextMessage(msg){
        if(msg.messageContent instanceof StreamingTextGeneratingMessageContent) {
            this.state.conversation.streamingTextGeneratingMessages.set(this._conversationKey(msg.conversation), msg);
        } else if(msg.messageContent instanceof  StreamingTextGeneratedMessageContent){
            this.state.conversation.streamingTextGeneratingMessages.delete(this._conversationKey(msg.conversation));
        } else if(msg.messageContent instanceof StreamingTextCancelledMessageContent) {
            this.state.conversation.streamingTextGeneratingMessages.delete(this._conversationKey(msg.conversation));
            this._removeStreamingMessage(msg);
        }
    },

    /**
     * 取消消息（20）：按 streamId 从当前会话消息列表删除对应的
     * 正在生成(14)/已生成(15)消息，界面上的"生成中"气泡直接消失。
     */
    _removeStreamingMessage(msg) {
        const current = this.state.conversation.currentConversationInfo;
        if (!current || !msg.conversation.equal(current.conversation)) {
            return;
        }
        const streamId = msg.messageContent.streamId;
        const list = this.state.conversation.currentConversationMessageList;
        const idx = list.findIndex(m =>
            (m.messageContent.type === MessageContentType.Streaming_Text_Generating
                || m.messageContent.type === MessageContentType.Streaming_Text_Generated)
            && m.messageContent.streamId === streamId
        );
        if (idx > -1) {
            list.splice(idx, 1);
        }
    },

    _conversationKey(conv){
        return `${conv.type}-${conv.target}-${conv.line}`
    },


    _reset() {
        this._cancelDeferredReloads();
        this.state.conversation._reset();
        this.state.contact._reset();
        this.state.search._reset();
        this.state.pick._reset();
        this.state.misc._reset();
    },

    destroy() {
        if (!this.storeId || this.storeId === 'mainStore') {
            return;
        }

        this.removeAllListeners();

        this._reset();

        const pStore = pstore(this.storeId);
        const pinia = pStore.$pinia;
        pStore.$dispose();

        if (pinia && pinia.state && pinia.state.value && pinia.state.value[this.storeId]) {
            delete pinia.state.value[this.storeId];
        }

        this.state.conversation = null;
        this.state.contact = null;
        this.state.search = null;
        this.state.pick = null;
        this.state.misc = null;
        this.storeId = '';
        this._wfcListeners = [];
    }
}

function createStoreObject() {
    return {
        ...store,
        state: {
            conversation: null,
            contact: null,
            search: null,
            pick: null,
            misc: null,
        },
        storeId: '',
        _wfcListeners: [],
    };
}

export function newStore(){
    return createStoreObject();
}

const mainStore = createStoreObject();
window.__store = mainStore;
window.stringValue = stringValue;
window.longValue = longValue;
window.fromString = Long.fromString;
export default mainStore
