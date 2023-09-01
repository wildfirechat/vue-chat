import ConnectionStatus from "./wfc/client/connectionStatus";
import Vue from 'vue'
import wfc from "./wfc/client/wfc";
import EventType from "./wfc/client/wfcEvent";
import ConversationType from "./wfc/model/conversationType";
import {eq, gt, numberValue} from "./wfc/util/longUtil";
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
import {currentWindow, ipcRenderer, isElectron, remote} from "./platform";
import SearchType from "./wfc/model/searchType";
import Config from "./config";
import {getItem, setItem} from "./ui/util/storageHelper";
import CompositeMessageContent from "./wfc/messages/compositeMessageContent";
import {stringValue} from "./wfc/util/longUtil";
import DismissGroupNotification from "./wfc/messages/notification/dismissGroupNotification";
import KickoffGroupMemberNotification from "./wfc/messages/notification/kickoffGroupMemberNotification";
import QuitGroupNotification from "./wfc/messages/notification/quitGroupNotification";
import avenginekitproxy from "./wfc/av/engine/avenginekitproxy";
import MediaMessageContent from "./wfc/messages/mediaMessageContent";
import UnreadCount from "./wfc/model/unreadCount";
import LeaveChannelChatMessageContent from "./wfc/messages/leaveChannelChatMessageContent";
import EnterChannelChatMessageContent from "./wfc/messages/enterChannelChatMessageContent";
import ArticlesMessageContent from "./wfc/messages/articlesMessageContent";
import NullUserInfo from "./wfc/model/nullUserInfo";
import NullGroupInfo from "./wfc/model/nullGroupInfo";
import {genGroupPortrait} from "./ui/util/imageUtil";
import IPCEventType from "./ipcEventType";
import NullChannelInfo from "./wfc/model/NullChannelInfo";
import ModifyGroupSettingNotification from "./wfc/messages/notification/modifyGroupSettingNotification";

/**
 * 一些说明
 * _开头的字段，是为了UI层展示方便，而打补丁上出去的
 * __开头的字段，仅内部使用
 * _开头的函数，是内部函数
 * 外部不直接更新字段，而是通过提供各种action方法更新
 */
let store = {
    debug: true,
    state: {
        conversation: {
            _wfc: wfc,
            currentConversationInfo: null,
            conversationInfoList: [],
            currentConversationMessageList: [],
            currentConversationOldestMessageId: 0,
            currentConversationOldestMessageUid: 0,

            currentConversationRead: null,

            // TODO 调用setUserEnableReceipt时，需要更新
            isMessageReceiptEnable: false,

            inputtingUser: null,
            inputClearHandler: null,

            shouldAutoScrollToBottom: true,

            previewMediaItems: [],
            previewMediaIndex: null,

            enableMessageMultiSelection: false,
            showChannelMenu: false,
            quotedMessage: null,

            // 为什么不用 map？
            // map 里面的元素并不是 reactive 的
            downloadingMessages: [],
            sendingMessages: [],
            floatingConversations: [],

            currentVoiceMessage: null,
            contextMenuConversationInfo: null,

            _reset() {
                this.currentConversationInfo = null;
                this.conversationInfoList = []
                this.currentConversationMessageList = [];
                this.currentConversationOldestMessageId = 0;
                this.currentConversationOldestMessageUid = 0;
                this.currentConversationRead = null;
                this.isMessageReceiptEnable = false;
                this.inputtingUser = null;
                this.inputClearHandler = null;
                this.shouldAutoScrollToBottom = true;
                this.previewMediaItems = [];
                this.previewMediaIndex = null;
                this.enableMessageMultiSelection = false;
                this.showChannelMenu = false;
                this.quotedMessage = null;
                this.downloadingMessages = [];
                this.sendingMessages = [];
                this.floatingConversations = [];
                this.currentVoiceMessage = null;
                this.contextMenuConversationInfo = null;
            }
        },

        contact: {
            currentFriendRequest: null,
            currentGroup: null,
            currentChannel: null,
            currentFriend: null,
            currentOrganization: null,
            currentUser: null,

            expandFriendRequestList: false,
            expandFriendList: true,
            expandGroup: false,
            expandChanel: false,
            expandOrganization: false,

            unreadFriendRequestCount: 0,
            friendList: [],
            friendRequestList: [],
            favGroupList: [],
            channelList: [],
            organizationList: [],
            favContactList: [],

            selfUserInfo: null,
            contextMenuUserInfo: null,

            _reset() {
                this.currentFriendRequest = null;
                this.currentGroup = null;
                this.currentChannel = null;
                this.currentFriend = null;
                this.currentOrganization = null;
                this.currentUser = null;

                this.expandFriendRequestList = false;
                this.expandFriendList = true;
                this.expandGroup = false;
                this.expandChanel = false;

                this.unreadFriendRequestCount = 0;
                this.friendList = [];
                this.friendRequestList = [];
                this.favGroupList = [];
                this.channelList = [];
                this.organizationList = [];
                this.favContactList = [];

                this.selfUserInfo = null;
                this.contextMenuUserInfo = null;
            }
        },

        search: {
            query: null,
            show: false,
            userSearchResult: [],
            channelSearchResult: [],
            contactSearchResult: [],
            groupSearchResult: [],
            conversationSearchResult: [],
            messageSearchResult: [],

            _reset() {
                this.query = null;
                this.show = false;
                this.userSearchResult = [];
                this.channelSearchResult = [];
                this.contactSearchResult = [];
                this.groupSearchResult = [];
                this.conversationSearchResult = [];
                this.messageSearchResult = [];

            }
        },

        pick: {
            users: [],
            organizations: [],
            conversations: [],
            messages: [],

            _reset() {
                this.users = [];
                this.organizations = [];
                this.conversations = [];
                this.messages = [];

            }
        },

        misc: {
            connectionStatus: ConnectionStatus.ConnectionStatusUnconnected,
            isPageHidden: false,
            enableNotification: true,
            enableMinimize: getItem('minimizable') === '1',
            enableNotificationMessageDetail: true,
            enableCloseWindowToExit: false,
            enableAutoLogin: false,
            isElectron: isElectron(),
            isElectronWindowsOrLinux: process && (process.platform === 'win32' || process.platform === 'linux'),
            isMainWindow: false,
            linuxUpdateTitleInterval: 0,
            wfc: wfc,
            config: Config,
            userOnlineStateMap: new Map(),
            enableOpenWorkSpace: !!(Config.OPEN_PLATFORM_WORK_SPACE_URL),

            _reset() {
                this.connectionStatus = ConnectionStatus.ConnectionStatusUnconnected;
                this.isPageHidden = false;
                this.enableNotification = true;
                this.enableMinimize = getItem('minimizable') === '1';
                this.enableNotificationMessageDetail = true;
                this.enableCloseWindowToExit = false;
                this.enableAutoLogin = false;
                this.isElectron = isElectron();
                this.isElectronWindowsOrLinux = process && (process.platform === 'win32' || process.platform === 'linux');
                // this.isMainWindow = false;
                this.linuxUpdateTitleInterval = 0;
                this.wfc = wfc;
                this.config = Config;
                this.userOnlineStateMap = new Map();
            }
        },
    },

    init(isMainWindow, subWindowLoadDataOptions) {
        console.log('init store')
        miscState.connectionStatus = wfc.getConnectionStatus();
        wfc.eventEmitter.on(EventType.ConnectionStatusChanged, (status) => {
            console.log('store ConnectionStatusChanged', status)
            miscState.connectionStatus = status;
            try {
                if (status === ConnectionStatus.ConnectionStatusConnected) {
                    this._loadDefaultData();

                    this.updateTray();
                } else if (status === ConnectionStatus.ConnectionStatusLogout
                    || status === ConnectionStatus.ConnectionStatusRejected
                    || status === ConnectionStatus.ConnectionStatusSecretKeyMismatch
                    || status === ConnectionStatus.ConnectionStatusKickedOff
                    || status === ConnectionStatus.ConnectionStatusTokenIncorrect) {
                    _reset();
                    this.updateTray();
                }
            } catch (e) {
                // do nothing
            }
        });

        wfc.eventEmitter.on(EventType.UserInfosUpdate, (userInfos) => {
            console.log('store UserInfosUpdate', userInfos, miscState.connectionStatus)
            this._reloadSingleConversationIfExist(userInfos);
            // TODO optimize
            this._patchCurrentConversationMessages();
            this._loadFriendList();
            this._loadFriendRequest();
            this._loadSelfUserInfo();
            // TODO 其他相关逻辑
        });

        wfc.eventEmitter.on(EventType.SettingUpdate, () => {
            console.log('store SettingUpdate')
            this._loadDefaultConversationList();
            this._loadFavContactList();
            this._loadFavGroupList();
            this._loadChannelList();
            this.updateTray();
            // 清除远程消息时，WEB SDK会同时触发ConversationInfoUpdate 和 setting更新，但PC SDK不会，只会触发setting更新
            // if (isElectron()) {
            //     this._loadCurrentConversationMessages();
            // }
        });

        wfc.eventEmitter.on(EventType.FriendRequestUpdate, (newFrs) => {
            this._loadFriendRequest();
        });

        wfc.eventEmitter.on(EventType.FriendListUpdate, (updatedFriendIds) => {
            console.log('FriendListUpdate', updatedFriendIds);
            this._loadFriendList();
            this._loadFriendRequest();
            this._loadFavContactList();
            this._loadDefaultConversationList();
            this._patchCurrentConversationMessages();
        });

        wfc.eventEmitter.on(EventType.GroupInfosUpdate, (groupInfos) => {
            // TODO optimize
            console.log('store GroupInfosUpdate', groupInfos)
            this._reloadGroupConversationIfExist(groupInfos);
            this._loadFavGroupList();
            // TODO 其他相关逻辑

        });

        wfc.eventEmitter.on(EventType.GroupMembersUpdate, (groupId, members) => {
            // TODO optimize
            console.log('store GroupMembersUpdate', groupId)
            this._reloadGroupConversationIfExist([new NullGroupInfo(groupId)]);
            // this._loadFavGroupList();
            // TODO 其他相关逻辑
        });

        wfc.eventEmitter.on(EventType.ChannelInfosUpdate, (groupInfos) => {
            this._loadDefaultConversationList();
            this._loadChannelList();
        });

        wfc.eventEmitter.on(EventType.ConversationInfoUpdate, (conversationInfo) => {
            this._reloadConversation(conversationInfo.conversation)
            // if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversationInfo.conversation)) {
            //     this._loadCurrentConversationMessages();
            // }
            // 标记已读未读
            this.updateTray();
        });

        wfc.eventEmitter.on(EventType.ReceiveMessage, (msg, hasMore) => {
            if (miscState.connectionStatus === ConnectionStatus.ConnectionStatusReceiveing) {
                return;
            }
            if (miscState.isMainWindow && !this.isConversationInCurrentWindow(msg.conversation)) {
                return;
            }
            if (!hasMore) {
                this._reloadConversation(msg.conversation)
            }
            if (conversationState.currentConversationInfo && msg.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                if (msg.messageContent instanceof DismissGroupNotification
                    || (msg.messageContent instanceof KickoffGroupMemberNotification && msg.messageContent.kickedMembers.indexOf(wfc.getUserId()) >= 0)
                    || (msg.messageContent instanceof QuitGroupNotification && msg.messageContent.operator === wfc.getUserId())
                ) {
                    this.setCurrentConversationInfo(null);
                    return;
                }
                if (msg.messageContent.type === MessageContentType.Typing) {
                    let groupId = msg.conversation.type === 1 ? msg.conversation.target : '';
                    let userInfo = wfc.getUserInfo(msg.from, false, groupId)
                    userInfo = Object.assign({}, userInfo);
                    userInfo._displayName = wfc.getGroupMemberDisplayNameEx(userInfo);
                    conversationState.inputtingUser = userInfo;

                    if (!conversationState.inputClearHandler) {
                        conversationState.inputClearHandler = () => {
                            conversationState.inputtingUser = null;
                        }
                    }
                    clearTimeout(conversationState.inputClearHandler);
                    setTimeout(conversationState.inputClearHandler, 3000)
                } else {
                    clearTimeout(conversationState.inputClearHandler);
                    conversationState.inputtingUser = null;
                }

                if (!this._isDisplayMessage(msg) || msg.messageContent.type === MessageContentType.RecallMessage_Notification) {
                    return;
                }

                // 会把下来加载更多加载的历史消息给清理了
                let lastTimestamp = 0;
                let msgListLength = conversationState.currentConversationMessageList.length;
                if (msgListLength > 0) {
                    lastTimestamp = conversationState.currentConversationMessageList[msgListLength - 1].timestamp;
                }
                this._patchMessage(msg, lastTimestamp);
                let msgIndex = conversationState.currentConversationMessageList.findIndex(m => {
                    return m.messageId === msg.messageId || (gt(m.messageUid, 0) && eq(m.messageUid, msg.messageUid));
                });
                if (msgIndex > -1) {
                    // FYI: https://v2.vuejs.org/v2/guide/reactivity#Change-Detection-Caveats
                    conversationState.currentConversationMessageList.splice(msgIndex, 1, msg);
                    console.log('msg duplicate')
                    return;
                }

                conversationState.currentConversationMessageList.push(msg);
            }

            if (miscState.isMainWindow && this.isConversationInCurrentWindow(msg.conversation)) {
                if (msg.conversation.type !== 2 && miscState.isPageHidden && (miscState.enableNotification || msg.status === MessageStatus.AllMentioned || msg.status === MessageStatus.Mentioned)) {
                    this.notify(msg);
                }
                this.updateTray();
            }
            if (msg.messageContent instanceof ModifyGroupSettingNotification) {
                wfc.getGroupInfo(msg.messageContent.groupId, true);
            }
        });

        wfc.eventEmitter.on(EventType.RecallMessage, (operator, messageUid) => {
            this._reloadConversationByMessageUidIfExist(messageUid);
            if (conversationState.currentConversationInfo) {
                let msg = wfc.getMessageByUid(messageUid);
                if (msg && msg.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                    if (conversationState.currentConversationMessageList) {
                        let lastTimestamp = 0;
                        conversationState.currentConversationMessageList = conversationState.currentConversationMessageList.map(msg => {
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
            }
            this.updateTray();
        });

        wfc.eventEmitter.on(EventType.UserOnlineEvent, (userOnlineStatus) => {
            userOnlineStatus.forEach(e => {
                miscState.userOnlineStateMap.set(e.userId, e);
            })
            // 更新在线状态
            contactState.friendList = this._patchAndSortUserInfos(contactState.friendList, '');
        })
        // 服务端删除
        wfc.eventEmitter.on(EventType.MessageDeleted, (messageUid) => {
            this._reloadConversationByMessageUidIfExist(messageUid);
            if (conversationState.currentConversationInfo) {

                if (conversationState.currentConversationMessageList) {
                    conversationState.currentConversationMessageList = conversationState.currentConversationMessageList.filter(msg => !eq(msg.messageUid, messageUid))
                }
            }
            this.updateTray();
        });
        // 本地删除
        wfc.eventEmitter.on(EventType.DeleteMessage, (messageId) => {
            this._reloadConversationByMessageIdIfExist(messageId);
            if (conversationState.currentConversationInfo) {
                if (conversationState.currentConversationMessageList) {
                    conversationState.currentConversationMessageList = conversationState.currentConversationMessageList.filter(msg => msg.messageId !== messageId)
                }
            }
        });

        wfc.eventEmitter.on(EventType.SecretChatMessageBurned, (target, playedMessageId) => {
            // todo 倒计时等
        });

        wfc.eventEmitter.on(EventType.SecretChatMessageBurned, (messageIds) => {
            this._loadDefaultConversationList();
            if (conversationState.currentConversationInfo) {
                if (conversationState.currentConversationMessageList) {
                    conversationState.currentConversationMessageList = conversationState.currentConversationMessageList.filter(msg => messageIds.indexOf(msg.messageId) < 0)
                }
            }
        });

        wfc.eventEmitter.on(EventType.SecretChatStateChange, (targetId) => {
            this._loadDefaultConversationList();
        });

        wfc.eventEmitter.on(EventType.SendMessage, (message) => {
            // 删除频道，或者从频道会话切到其他会话时，会发送一条离开频道的消息
            if (message.messageContent instanceof LeaveChannelChatMessageContent) {
                return;
            }

            this._reloadConversation(message.conversation);
            if (!this._isDisplayMessage(message)) {
                return;
            }
            if (!conversationState.currentConversationInfo || !message.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                console.log('not current conv')
                return;
            }
            let index = conversationState.currentConversationMessageList.findIndex(m => m.messageId === message.messageId);
            if (index !== -1) {
                return;
            }
            let length = conversationState.currentConversationMessageList.length;
            let lastTimestamp = 0;
            if (length > 0) {
                let lastMessage = conversationState.currentConversationMessageList[length - 1];
                lastTimestamp = lastMessage.timestamp;
            }
            this._patchMessage(message, lastTimestamp)

            conversationState.currentConversationMessageList.push(message);
        });

        wfc.eventEmitter.on(EventType.MessageStatusUpdate, (message) => {
            console.log('message status update', message)
            if (!this._isDisplayMessage(message)) {
                return;
            }

            if (!conversationState.currentConversationInfo || !message.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                console.log('not current conv')
                return;
            }

            let index = conversationState.currentConversationMessageList.findIndex(m => m.messageId === message.messageId);
            if (index < 0) {
                return;
            }
            let msg = conversationState.currentConversationMessageList[index];
            Object.assign(msg, message)

            if (conversationState.currentConversationInfo.lastMessage && conversationState.currentConversationInfo.lastMessage.messageId === message.messageId) {
                Object.assign(conversationState.currentConversationInfo.lastMessage, message);

            }
        });

        wfc.eventEmitter.on(EventType.MessageRead, (readEntries) => {
            // optimization
            if (conversationState.currentConversationInfo) {
                // wfc.getConversationRead 每次返回同一个对象，只是该对象的值不一样。
                // 由于 VUE 不能检测到初始化时，不存在的属性的变更，故此处重新 new 一个新的对象，并赋值。
                // FYI:https://vuejs.org/v2/guide/reactivity.html
                conversationState.currentConversationRead = new Map(wfc.getConversationRead(conversationState.currentConversationInfo.conversation));
            }
        });

        avenginekitproxy.onVoipCallStatusCallback = this.updateVoipStatus
        if (isElectron()) {
            if (isMainWindow) {
                ipcRenderer.on('deep-link', (event, args) => {
                    console.log('deep-link', args)
                    // 下面是示例
                    // 可以根据 pathname 和 query parameter 进行相应的逻辑处理，这儿是跳转到对应的会话
                    let url = new URL(args);
                    let pathname = url.pathname;
                    let searchParams = url.searchParams;
                    if ('//conversation' === pathname) {
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
                let messageId = args.messageId;
                let localPath = args.filePath;
                console.log('file-downloaded', args)

                conversationState.downloadingMessages = conversationState.downloadingMessages.filter(v => v.messageId !== messageId);
                let msg = wfc.getMessageById(messageId);
                if (msg) {
                    msg.messageContent.localPath = localPath;
                    wfc.updateMessageContent(messageId, msg.messageContent);

                    conversationState.currentConversationMessageList.forEach(m => {
                        if (m.messageId === messageId) {
                            m.messageContent = msg.messageContent;
                        }
                    });
                }
            });

            ipcRenderer.on('file-download-failed', (event, args) => {
                let messageId = args.messageId;
                conversationState.downloadingMessages = conversationState.downloadingMessages.filter(v => v.messageId !== messageId);
                // TODO 其他下载失败处理
            });

            ipcRenderer.on('file-download-progress', (event, args) => {
                let messageId = args.messageId;
                let receivedBytes = args.receivedBytes;
                let totalBytes = args.totalBytes;
                let dm = conversationState.downloadingMessages.find(dm => dm.messageId === messageId);
                if (dm) {
                    dm.progress = receivedBytes;
                    dm.total = totalBytes;
                }
                // console.log('file download progress', messageId, receivedBytes, totalBytes);
            });

            miscState.subWindowLoadDataOptions = subWindowLoadDataOptions ? subWindowLoadDataOptions : {};

            if (!isMainWindow && wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected) {
                // 根据 subWindowLoadDataOptions 配置去加载
                this._loadDefaultData();
            }
            window.__wfc = wfc;
        }
        miscState.isMainWindow = isMainWindow;
    },

    _loadDefaultData() {
        this._loadFavGroupList();
        this._loadChannelList();
        this._loadFriendList();
        this._loadFavContactList();
        this._loadFriendRequest();
        this._loadSelfUserInfo();
        this._loadDefaultConversationList();
        this._loadUserLocalSettings();
        conversationState.isMessageReceiptEnable = wfc.isReceiptEnabled() && wfc.isUserReceiptEnabled();
        // if (conversationState.currentConversationInfo) {
        //     this._loadCurrentConversationMessages();
        // }
    },

    // conversation actions

    _isDisplayMessage(message) {
        // return [PersistFlag.Persist, PersistFlag.Persist_And_Count].indexOf(MessageConfig.getMessageContentPersitFlag(message.messageContent.type)) > -1;
        return message.messageId !== 0;
    },

    _loadDefaultConversationList() {
        console.log('store _loadDefaultConversationList');
        let conversationTypes = isElectron() ? [0, 1, 3, 5] : [0, 1, 3];
        this._loadConversationList(conversationTypes, [0])
    },

    _loadConversationList(conversationType = [0, 1, 3], lines = [0]) {
        let conversationList = wfc.getConversationList(conversationType, lines);
        let toLoadUserIdSet = new Set();
        let toLoadGroupIds = [];
        conversationList.forEach(info => {
            if (info.conversation.type === ConversationType.Single) {
                toLoadUserIdSet.add(info.conversation.target)
                if (info.lastMessage && info.lastMessage.from) {
                    toLoadUserIdSet.add(info.lastMessage.from);
                }
            } else if (info.conversation.type === ConversationType.Group) {
                toLoadGroupIds.push(info.conversation.target)
                if (info.lastMessage && info.lastMessage.from) {
                    toLoadUserIdSet.add(info.lastMessage.from);
                }
            }
        })
        let userInfoMap = new Map();
        let groupInfoMap = new Map();
        toLoadUserIdSet.forEach(uid => {
            userInfoMap.set(uid, new NullUserInfo(uid));
        })
        toLoadGroupIds.forEach(gid => {
            groupInfoMap.set(gid, new NullGroupInfo(gid))
        })

        console.log('to load userIds', [...toLoadUserIdSet]);
        wfc.getUserInfos([...toLoadUserIdSet])
            .forEach(u => {
                userInfoMap.set(u.uid, u);
            });
        console.log('to load groupIds', toLoadGroupIds);
        wfc.getGroupInfos(toLoadGroupIds)
            .forEach(g => {
                groupInfoMap.set(g.target, g);
            });

        conversationList.forEach(info => {
            this._patchConversationInfo(info, true, userInfoMap, groupInfoMap);
            // side affect
            if (conversationState.currentConversationInfo
                && conversationState.currentConversationInfo.conversation.equal(info.conversation)) {
                conversationState.currentConversationInfo = info;
                this._patchCurrentConversationOnlineStatus();
            }
        });
        conversationState.conversationInfoList = conversationList;
    },

    _reloadConversation(conversation, insertIfNoExist = true) {
        let conversationInfo = wfc.getConversationInfo(conversation);
        if (conversationInfo) {
            conversationInfo = this._patchConversationInfo(conversationInfo);
        }
        let index = conversationState.conversationInfoList.findIndex(info => info.conversation.equal(conversation));
        if (index >= 0) {
            Object.assign(conversationState.conversationInfoList[index], conversationInfo);
        } else {
            if (insertIfNoExist && conversation.type !== ConversationType.ChatRoom) {
                conversationState.conversationInfoList.push(conversationInfo);
            } else {
                return conversationInfo;
            }
        }

        if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversation)) {
            conversationState.currentConversationInfo = conversationInfo;
            // 清除聊天记录
            if (!conversationInfo.lastMessage) {
                conversationState.currentConversationMessageList = [];
            }
        }

        // sort
        conversationState.conversationInfoList.sort((a, b) => {
            if ((a.top && b.top) || (!a.top && !b.top)) {
                return gt(a.timestamp, b.timestamp) ? -1 : 1;
            } else {
                if (a.top) {
                    return -1;
                } else {
                    return 1;
                }
            }
        })
        return conversationInfo;
    },

    _reloadSingleConversationIfExist(userInfos) {
        if (userInfos.length > 10) {
            this._loadDefaultConversationList();
        } else {
            userInfos.forEach(ui => {
                let conv = new Conversation(ConversationType.Single, ui.uid, 0);
                this._reloadConversation(conv, false);
            })
        }
    },

    _reloadGroupConversationIfExist(groupInfos) {
        if (groupInfos.length > 10) {
            this._loadDefaultConversationList();
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
        for (let i = 0; i < conversationState.conversationInfoList.length; i++) {
            let info = conversationState.conversationInfoList[i];
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
        for (let i = 0; i < conversationState.conversationInfoList.length; i++) {
            let info = conversationState.conversationInfoList[i];
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
        if (conversationState.currentConversationInfo && conversation.equal(conversationState.currentConversationInfo.conversation)) {
            return;
        }
        let convs = conversationState.conversationInfoList.filter(info => info.conversation.equal(conversation));
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
        if (!conversationInfo) {
            if (conversationState.currentConversationInfo) {
                let conversation = conversationState.currentConversationInfo.conversation;
                wfc.unwatchOnlineState(conversation.type, [conversation.target]);
                if (conversation.type === ConversationType.Channel) {
                    let content = new LeaveChannelChatMessageContent();
                    wfc.sendConversationMessage(conversation, content);
                }
            }
            conversationState.currentConversationInfo = null;
            conversationState.shouldAutoScrollToBottom = false;
            conversationState.currentConversationMessageList.length = 0;
            conversationState.currentConversationOldestMessageId = 0;
            conversationState.currentConversationOldestMessageUid = 0;
            conversationState.currentConversationRead = null;
            conversationState.enableMessageMultiSelection = false;
            conversationState.showChannelMenu = false;
            return;
        }

        if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversationInfo.conversation)) {
            return;
        }
        let conversation = conversationInfo.conversation;
        if (conversation.type === ConversationType.Group || (conversation.type === ConversationType.Single && !wfc.isMyFriend(conversation.target))) {
            wfc.watchOnlineState(conversation.type, [conversation.target], 1000, (states) => {
                states.forEach((e => {
                    miscState.userOnlineStateMap.set(e.userId, e);
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
        conversationState.currentConversationInfo = conversationInfo;
        conversationState.shouldAutoScrollToBottom = true;
        conversationState.currentConversationMessageList.length = 0;
        conversationState.currentConversationOldestMessageId = 0;
        conversationState.currentConversationOldestMessageUid = 0;
        // 会话页面会触发调用 loadConversationHistoryMessages，这儿不用提前加载消息
        // this._loadCurrentConversationMessages();
        this._patchCurrentConversationOnlineStatus();

        conversationState.currentConversationRead = wfc.getConversationRead(conversationInfo.conversation);

        conversationState.enableMessageMultiSelection = false;
        conversationState.showChannelMenu = false;
        if (conversation.type === ConversationType.Channel) {
            let channelInfo = wfc.getChannelInfo(conversation.target, true);
            if (channelInfo.menus && channelInfo.menus.length > 0) {
                conversationState.showChannelMenu = true;
            }
        } else if (conversation.type === ConversationType.Group) {
            wfc.getGroupInfo(conversation.target, true);
        } else if (conversation.type === ConversationType.Single) {
            wfc.getUserInfo(conversation.target, true);
        }
        conversationState.quotedMessage = null;
        conversationState.currentVoiceMessage = null;

        clearTimeout(conversationState.inputClearHandler);
        conversationState.inputtingUser = null;

        pickState.messages.length = 0;
    },

    quitGroup(groupId) {
        wfc.quitGroup(groupId, [0], null, () => {
            this.setCurrentConversationInfo(null)
        }, (err) => {
            console.log('quit group error', err)
        })
    },
    dismissGroup(groupId) {
        wfc.dismissGroup(groupId, [0], null, () => {
            this.setCurrentConversationInfo(null)
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
        conversationState.enableMessageMultiSelection = !conversationState.enableMessageMultiSelection;
        pickState.messages.length = 0;
        if (conversationState.enableMessageMultiSelection && message) {
            pickState.messages.push(message);
        }
    },

    toggleChannelMenu(toggle) {
        conversationState.showChannelMenu = toggle;
    },

    selectOrDeselectMessage(message) {
        let index = pickState.messages.findIndex(m => m.messageId === message.messageId);
        if (index >= 0) {
            pickState.messages.splice(index, 1);
        } else {
            pickState.messages.push(message);
        }
    },

    deleteSelectedMessages() {
        conversationState.enableMessageMultiSelection = false;
        if (pickState.messages.length < 1) {
            return;
        }
        pickState.messages.sort((m1, m2) => m1.messageId - m2.messageId);
        pickState.messages.forEach(m => {
            wfc.deleteMessage(m.messageId);
        });
        pickState.messages.length = 0;
    },

    forwardMessage(forwardType, targetConversations, messages, extraMessageText) {
        // web 端，避免撤回消息等操作，影响组合消息
        if (!isElectron()) {
            messages = messages.map(m => Object.assign({}, m));
        }
        targetConversations.forEach(conversation => {
            // let msg =new Message(conversation, message.messageContent)
            // wfc.sendMessage(msg)
            // 或者下面这种
            if (forwardType === ForwardType.NORMAL || forwardType === ForwardType.ONE_BY_ONE) {
                messages.forEach(message => {
                    if (message.messageContent instanceof ArticlesMessageContent) {
                        let linkContents = message.messageContent.toLinkMessageContent();
                        linkContents.forEach(lm => {
                            wfc.sendConversationMessage(conversation, lm);
                        })

                    } else {
                        wfc.sendConversationMessage(conversation, message.messageContent);
                    }
                });
            } else {
                // 合并转发
                let compositeMessageContent = new CompositeMessageContent();
                let title = '';
                let msgConversation = messages[0].conversation;
                if (msgConversation.type === ConversationType.Single) {
                    let users = store.getUserInfos([wfc.getUserId(), msgConversation.target], '');
                    title = users[0]._displayName + '和' + users[1]._displayName + '的聊天记录';
                } else {
                    title = '群的聊天记录';
                }
                compositeMessageContent.title = title;
                compositeMessageContent.setMessages(messages);

                wfc.sendConversationMessage(conversation, compositeMessageContent);
            }

            if (extraMessageText) {
                let textMessage = new TextMessageContent(extraMessageText)
                wfc.sendConversationMessage(conversation, textMessage);
            }
        });
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
        conversationState.shouldAutoScrollToBottom = scroll;
    },

    /**
     *
     * @param src {String} 媒体url
     * @param thumbUrl {String} 缩略图url
     * @param thumb {String} base64格式的缩略图，但不包含'data:image/png;base64,'
     * @param autoplay
     */
    previewMedia(src, thumbUrl, thumb, autoplay = true) {
        conversationState.previewMediaItems.length = 0;
        conversationState.previewMediaItems.push({
            src: src,
            thumb: thumbUrl ? thumbUrl : 'data:image/png;base64,' + thumb,
            autoplay: autoplay,
        });
        conversationState.previewMediaIndex = 0;
        console.log('preview media', conversationState.previewMediaItems, conversationState.previewMediaIndex)
    },
    previewMedias(mediaItems, index) {
        conversationState.previewMediaItems.length = 0;
        conversationState.previewMediaItems.push(...mediaItems);
        conversationState.previewMediaIndex = index;
        console.log('preview medias', conversationState.previewMediaItems, conversationState.previewMediaIndex)
    },

    playVoice(message) {
        if (conversationState.currentVoiceMessage) {
            conversationState.currentVoiceMessage._isPlaying = false;
        }
        conversationState.currentVoiceMessage = message;
    },

    /**
     *
     * @param message
     * @param {Boolean} continuous  true，预览周围的媒体消息；false，只预览第一个参数传入的那条媒体消息
     */
    previewMessage(message, continuous) {
        conversationState.previewMediaItems.length = 0;
        conversationState.previewMediaIndex = 0;
        if (continuous && conversationState.currentConversationMessageList.length > 0) {
            let mediaMsgs = conversationState.currentConversationMessageList.filter(m => [MessageContentType.Image, MessageContentType.Video].indexOf(m.messageContent.type) > -1)
            let msg;
            for (let i = 0; i < mediaMsgs.length; i++) {
                msg = mediaMsgs[i];
                if (msg.messageId === message.messageId) {
                    conversationState.previewMediaIndex = i;
                }
                let mediaUrl = msg.messageContent.remotePath;
                if (!mediaUrl){
                    if (msg.messageContent.file){
                        mediaUrl = URL.createObjectURL(msg.messageContent.file)
                    }
                }
                conversationState.previewMediaItems.push({
                    src: mediaUrl,
                    thumb: 'data:image/png;base64,' + msg.messageContent.thumbnail,
                    autoplay: true,
                });
            }
        } else {
            conversationState.previewMediaIndex = 0;
            let mediaUrl = message.messageContent.remotePath;
            if (!mediaUrl){
                if (message.messageContent.file){
                    mediaUrl = URL.createObjectURL(message.messageContent.file)
                }
            }
            conversationState.previewMediaItems.push({
                src: mediaUrl,
                thumb: 'data:image/png;base64,' + message.messageContent.thumbnail,
                autoplay: true,
            });
        }
    },

    previewCompositeMessage(compositeMessage, focusMessageUid) {
        conversationState.previewMediaItems.length = 0;
        conversationState.previewMediaIndex = 0;

        let mediaMsgs = compositeMessage.messageContent.messages.filter(m => [MessageContentType.Image, MessageContentType.Video].indexOf(m.messageContent.type) > -1)
        let msg;
        for (let i = 0; i < mediaMsgs.length; i++) {
            msg = mediaMsgs[i];
            if (eq(msg.messageUid, focusMessageUid)) {
                conversationState.previewMediaIndex = i;
            }
            conversationState.previewMediaItems.push({
                src: msg.messageContent.remotePath,
                thumb: 'data:image/png;base64,' + msg.messageContent.thumbnail,
                autoplay: true,
            });
        }
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
                console.log('image file', file)
                if (it.length > 15 * 1024) {
                    console.warn('generated thumbnail is too large, use default thumbnail', it.length);
                    it = Config.DEFAULT_THUMBNAIL_URL;
                }
                messageContent = new ImageMessageContent(fileOrLocalPath, remotePath, it.split(',')[1]);
                messageContent.imageWidth = iw;
                messageContent.imageHeight = ih;
                break;
            case MessageContentMediaType.Video:
                let {thumbnail: vt, width: vw, height: vh} = await videoThumbnail(file);
                let duration = await videoDuration(file)
                duration = Math.ceil(duration * 1000);
                if (vt === null) {
                    return false;
                }
                if (vt.length > 15 * 1024) {
                    console.warn('generated thumbnail is too large, use default thumbnail', vt.length);
                    vt = Config.DEFAULT_THUMBNAIL_URL;
                }
                messageContent = new VideoMessageContent(fileOrLocalPath, remotePath, vt.split(',')[1]);
                // TODO width and height
                break;
            case MessageContentMediaType.File:
                messageContent = new FileMessageContent(fileOrLocalPath, remotePath);
                break;
            default:
                return false;
        }
        msg.messageContent = messageContent;
        wfc.sendMessage(msg,
            (messageId) => {
                msg.messageId = messageId;
                console.log('sf, pr', messageId)
            },
            (progress, total) => {
                // console.log('sf p', msg.messageId, Math.ceil(progress / total * 100))
                let sm = conversationState.sendingMessages.find(e => e.messageId === msg.messageId);
                if (sm) {
                    sm.progress = progress;
                    sm.total = total;
                } else {
                    conversationState.sendingMessages.push({messageId: msg.messageId, progress, total});
                }
            },
            (messageUid) => {
                console.log('sf s', messageUid)
                conversationState.sendingMessages = conversationState.sendingMessages.filter(e => e.messageId !== msg.messageId);
            },
            (error) => {
                console.log('sf e', error)
                conversationState.sendingMessages = conversationState.sendingMessages.filter(e => e.messageId !== msg.messageId);
            }
        );
    },

    quoteMessage(message) {
        conversationState.quotedMessage = message;
        conversationState.currentConversationInfo._quotedMessage = message;
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
        if (!conversationState.currentConversationInfo) {
            return;
        }
        // TODO 可以在这儿加载所有未读消息，以实现滚动到一条未读消息的地方
        let conversation = conversationState.currentConversationInfo.conversation;
        wfc.getMessagesV2(conversation, 0, true, 20, '', msgs => {
            conversationState.currentConversationMessageList = msgs;
            this._patchCurrentConversationMessages();
            if (msgs.length) {
                conversationState.currentConversationOldestMessageId = msgs[0].messageId;
            }
            for (let i = 0; i < msgs.length; i++) {
                if (gt(msgs[i].messageUid, 0)) {
                    conversationState.currentConversationOldestMessageUid = msgs[0].messageUid;
                    break;
                }
            }
        }, err => {
            console.error('_loadCurrentConversationMessages error', err);
        });
    },

    _patchCurrentConversationMessages() {
        let lastTimestamp = 0;
        let msgs = conversationState.currentConversationMessageList;
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
            let index = conversationState.currentConversationMessageList.findIndex(cm => cm.messageId === m.messageId)
            if (index === -1) {
                this._patchMessage(m, lastTimestamp);
                lastTimestamp = m.timestamp;
                newMsgs.push(m);
                loadNewMsg = true;
            }
        });
        conversationState.currentConversationMessageList = newMsgs.concat(conversationState.currentConversationMessageList);
        return loadNewMsg;
    },

    loadConversationHistoryMessages(loadedCB, completeCB) {
        if (!conversationState.currentConversationInfo) {
            return;
        }
        let conversation = conversationState.currentConversationInfo.conversation;
        console.log('loadConversationHistoryMessage', conversation, conversationState.currentConversationOldestMessageId, stringValue(conversationState.currentConversationOldestMessageUid));
        let loadRemoteHistoryMessageFunc = () => {
            wfc.loadRemoteConversationMessages(conversation, [], conversationState.currentConversationOldestMessageUid, 20,
                (msgs, hasMore) => {
                    console.log('loadRemoteConversationMessages response', msgs.length);
                    if (msgs.length === 0) {
                        // 拉回来的消息，本地全都有时，会走到这儿
                        if (hasMore) {
                            loadedCB();
                        } else {
                            completeCB();
                        }
                    } else {
                        // 可能拉回来的时候，本地已经切换会话了
                        if (conversation.equal(conversationState.currentConversationInfo.conversation)) {
                            conversationState.currentConversationOldestMessageUid = msgs[0].messageUid;
                            msgs = msgs.filter(m => m.messageId !== 0);
                            this._onloadConversationMessages(conversation, msgs);
                        }
                        this._reloadConversation(conversation);
                        loadedCB();
                    }
                },
                (error) => {
                    completeCB();
                });
        }

        wfc.getMessagesV2(conversation, conversationState.currentConversationOldestMessageId, true, 20, '', lmsgs => {
            if (lmsgs.length > 0) {
                if (!conversation.equal(conversationState.currentConversationInfo.conversation)) {
                    return;
                }
                conversationState.currentConversationOldestMessageId = lmsgs[0].messageId;
                if (gt(lmsgs[0].messageUid, 0)) {
                    conversationState.currentConversationOldestMessageUid = lmsgs[0].messageUid;
                }
                this._onloadConversationMessages(conversation, lmsgs)
                if (lmsgs.length === 0) {
                    loadRemoteHistoryMessageFunc();
                } else {
                    // loadedCB();
                    setTimeout(() => loadedCB(), 200)
                }
            } else {
                loadRemoteHistoryMessageFunc();
            }
        }, err => {
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
        if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversation)) {
            this.setCurrentConversationInfo(null);
        }
        conversationState.conversationInfoList = conversationState.conversationInfoList.filter(info => !info.conversation.equal(conversation));
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
        if (!m._from) {
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

        if (numberValue(lastTimestamp) > 0 && numberValue(m.timestamp) - numberValue(lastTimestamp) > 5 * 60 * 1000) {
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

    _patchConversationInfo(info, patchLastMessage = true, userInfoMap, groupInfoMap) {
        if (info.conversation.type === ConversationType.Single) {
            info.conversation._target = userInfoMap ? userInfoMap.get(info.conversation.target) : wfc.getUserInfo(info.conversation.target, false);
            if (info.conversation._target) {
                info.conversation._target._displayName = wfc.getUserDisplayNameEx(info.conversation._target);
            }
        } else if (info.conversation.type === ConversationType.Group) {
            info.conversation._target = groupInfoMap ? groupInfoMap.get(info.conversation.target) : wfc.getGroupInfo(info.conversation.target, false);
            if (info.conversation._target) {
                info.conversation._target._isFav = wfc.isFavGroup(info.conversation.target);
                info.conversation._target._displayName = info.conversation._target.remark ? info.conversation._target.remark : info.conversation._target.name;
            }
        } else if (info.conversation.type === ConversationType.Channel) {
            info.conversation._target = wfc.getChannelInfo(info.conversation.target, false);
            info.conversation._target._displayName = info.conversation._target.name;
        } else if (info.conversation.type === ConversationType.SecretChat) {
            let secretChatInfo = wfc.getSecretChatInfo(info.conversation.target);
            if (secretChatInfo) {
                let userId = secretChatInfo.userId;
                let userInfo = wfc.getUserInfo(userId, false);
                info.conversation._target = userInfo;
                info.conversation._target._displayName = wfc.getUserDisplayNameEx(userInfo);
            } else {
                info.conversation._target = {};
            }
        } else if (info.conversation.type === ConversationType.ChatRoom) {
            wfc.getChatroomInfo(info.conversation.target, 0, (chatRoomInfo) => {
                info.conversation._target = chatRoomInfo;
            }, err => {
                console.log('get chatRoomInfo error', err);
                info.conversation._target = {};
            });
        }
        if (gt(info.timestamp, 0)) {
            info._timeStr = helper.dateFormat(info.timestamp);
        } else {
            info._timeStr = '';
        }

        // 显示的时候，再 patch
        if (info.lastMessage && info.lastMessage.conversation !== undefined && patchLastMessage) {
            //this._patchMessage(info.lastMessage, 0, userInfoMap)
            if (!info.lastMessage._from) {
                info.lastMessage._from = undefined;
            }
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

    addDownloadingMessage(messageId) {
        conversationState.downloadingMessages.push({
            messageId: messageId,
            progress: 0,
            total: Number.MAX_SAFE_INTEGER,
        });
        console.log('add downloading')
    },

    isDownloadingMessage(messageId) {
        // web端尚未测试，先屏蔽
        if (!isElectron()) {
            return false;
        }
        return conversationState.downloadingMessages.findIndex(dm => dm.messageId === messageId) >= 0;
    },

    isSendingMessage(messageId) {
        return conversationState.sendingMessages.has(messageId);
    },

    getDownloadingMessageStatus(messageId) {
        return conversationState.downloadingMessages.find(dm => dm.messageId === messageId);
    },

    getSendingStatus(messageId) {
        return conversationState.sendingMessages.find(e => e.messageId === messageId);
    },

    addFloatingConversation(conversation) {
        conversationState.floatingConversations.push(conversation);
    },

    removeFloatingConversation(conversation) {
        conversationState.floatingConversations = conversationState.floatingConversations.filter(c => !c.equal(conversation))
    },

    isConversationInCurrentWindow(conversation) {
        if (miscState.isMainWindow) {
            let index = conversationState.floatingConversations.findIndex(fc => fc.equal(conversation));
            return index === -1;
        } else {
            return conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversation);
        }
    },

    // contact actions

    _loadSelfUserInfo() {
        contactState.selfUserInfo = wfc.getUserInfo(wfc.getUserId(), false);
    },

    _loadFriendList() {
        let friends = wfc.getMyFriendList(false);
        let fileHelperIndex = friends.indexOf(Config.FILE_HELPER_ID);
        if (fileHelperIndex < 0) {
            friends.push(Config.FILE_HELPER_ID);
        }
        if (friends && friends.length > 0) {
            let friendList = wfc.getUserInfos(friends, '');
            contactState.friendList = this._patchAndSortUserInfos(friendList, '');
        }
    },

    getUserOnlineState(userId) {
        let userOnlineState = miscState.userOnlineStateMap.get(userId);
        if (userOnlineState) {
            return userOnlineState.desc();
        }
        return '';
    },

    _patchCurrentConversationOnlineStatus() {
        let convInfo = conversationState.currentConversationInfo;
        if (convInfo && convInfo.conversation.type === ConversationType.Single) {
            // 在 将 object 和 ui 绑定之前， 向 object 中新增的属性是 reactive 的，但绑定之后，才新增的属性，不是 reactive 的，
            // 故需要通过下面这种方法，让其成为 reactive 的属性
            // conversationState.currentConversationInfo.conversation._targetOnlineStateDesc = userOnlineStatus.desc();
            Vue.set(conversationState.currentConversationInfo.conversation, '_targetOnlineStateDesc', this.getUserOnlineState(convInfo.conversation.target))
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

        contactState.friendRequestList = requests;
        contactState.unreadFriendRequestCount = wfc.getUnreadFriendRequestCount();
    },

    _patchAndSortUserInfos(userInfos, groupId = '', compareFn) {
        userInfos = userInfos.map(u => {
            if (groupId) {
                u._displayName = wfc.getGroupMemberDisplayNameEx(u);
            } else {
                u._displayName = wfc.getUserDisplayNameEx(u);
            }
            u._pinyin = convert(u._displayName, {style: 0}).join('').trim().toLowerCase();
            let firstLetter = u._pinyin[0];
            if (firstLetter >= 'a' && firstLetter <= 'z') {
                u.__sortPinyin = 'a' + u._pinyin;
            } else {
                u.__sortPinyin = 'z' + u._pinyin;
            }
            u._firstLetters = convert(u._displayName, {style: 4}).join('').trim().toLowerCase();
            return u;
        });
        if (compareFn) {
            userInfos = userInfos.sort(compareFn);
        } else {
            userInfos = userInfos.sort((a, b) => a.__sortPinyin.localeCompare(b.__sortPinyin));
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
        contactState.favGroupList = wfc.getFavGroupList();
    },

    _loadChannelList() {
        wfc.getRemoteListenedChannels(channelIds => {
            if (channelIds) {
                contactState.channelList = channelIds.map(channelId => wfc.getChannelInfo(channelId, false));
                contactState.channelList = contactState.channelList.filter(ch => {
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
            contactState.favContactList = this.getUserInfos(favUserIds, '')
            contactState.favContactList.forEach(u => {
                u._category = '☆ 星标朋友';
            })
        } else {
            contactState.favContactList = [];
        }
    },

    reloadFavGroupList() {
        this._loadFavGroupList();
    },

    setCurrentFriendRequest(friendRequest) {
        contactState.currentFriendRequest = friendRequest;
        contactState.currentFriend = null;
        contactState.currentOrganization = null;
        contactState.currentGroup = null;
        contactState.currentChannel = null;
    },

    setCurrentFriend(friend) {
        contactState.currentFriendRequest = null;
        contactState.currentFriend = friend;
        contactState.currentOrganization = null;
        contactState.currentGroup = null;
        contactState.currentChannel = null;
    },

    setCurrentGroup(group) {
        contactState.currentFriendRequest = null;
        contactState.currentFriend = null;
        contactState.currentOrganization = null;
        contactState.currentGroup = group;
        contactState.currentChannel = null;
    },

    setCurrentChannel(channel) {
        contactState.currentFriendRequest = null;
        contactState.currentFriend = null;
        contactState.currentOrganization = null;
        contactState.currentGroup = null;
        contactState.currentChannel = channel;
    },

    setCurrentOrganization(organization) {
        contactState.currentFriendRequest = null;
        contactState.currentFriend = null;
        contactState.currentGroup = null;
        contactState.currentChannel = null;
        contactState.currentOrganization = organization;
    },
    toggleGroupList() {
        contactState.expandGroup = !contactState.expandGroup;
    },

    toggleChannelList() {
        contactState.expandChanel = !contactState.expandChanel;
    },

    toggleFriendRequestList() {
        contactState.expandFriendRequestList = !contactState.expandFriendRequestList;
    },

    toggleFriendList() {
        contactState.expandFriendList = !contactState.expandFriendList;
    },

    toggleOrganizationList() {
        // TEST DATA
        contactState.organizationList = [
            {
                name: '测试公司',
                portrait: Config.DEFAULT_ORGANIZATION_PORTRAIT_URL,

            }
        ]
        contactState.expandOrganization = !contactState.expandOrganization;
    },

    // search actions
    toggleSearchView(show) {
        console.log('ts', show, searchState.show);
        searchState.show = show
    },

    setSearchQuery(query) {
        searchState.query = query;
        if (query) {
            console.log('search', query)
            searchState.contactSearchResult = this.filterContact(query);
            searchState.groupSearchResult = this.filterGroupConversation(query);
            searchState.conversationSearchResult = this.filterConversation(query);
            // searchState.messageSearchResult = this.searchMessage(query);
            this.searchUser(query);
            this.searchChannel(query);

        } else {
            searchState._reset();
        }
    },

    searchUser(query) {
        console.log('search user', query)
        wfc.searchUser(query, SearchType.General, 0, ((keyword, userInfos) => {
            console.log('search user result', query, userInfos)
            if (searchState.query === keyword) {
                searchState.userSearchResult = userInfos.filter(u => !wfc.isMyFriend(u.uid));
            }
        }), (err) => {
            console.log('search user error', query, err)
            if (searchState.query === query) {
                searchState.userSearchResult = [];
            }
        });
    },

    searchChannel(query) {
        console.log('search channel')
        wfc.searchChannel(query, true, (keyword, channelInfos) => {
            console.log('search channel result', channelInfos);
            if (searchState.query === keyword) {
                console.log('search channel result', channelInfos);
                searchState.channelSearchResult = channelInfos;
            }
        }, err => {
            console.log('search channel error', query, err)
            if (searchState.query === query) {
                searchState.channelSearchResult = [];
            }
        })
    },

    // TODO 到底是什么匹配了
    filterContact(query) {
        let result = contactState.friendList.filter(u => {
            return u._displayName.indexOf(query) > -1 || u._firstLetters.indexOf(query.toLowerCase()) > -1 || u._pinyin.indexOf(query.toLowerCase()) > -1
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
        let queryPinyin = convert(filter, {style: 0}).join('').trim().toLowerCase();
        let result = users.filter(u => {
            return u._displayName.indexOf(filter) > -1 || u._displayName.indexOf(queryPinyin) > -1
                || u._pinyin.indexOf(filter) > -1 || u._pinyin.indexOf(queryPinyin) > -1
                || u._firstLetters.indexOf(filter) > -1 || u._firstLetters.indexOf(queryPinyin) > -1
        });
        return result;
    },

    // TODO 匹配类型，是群名称匹配上了，还是群成员的名称匹配上了？
    // 目前只搜索群名称
    filterFavGroup(query) {
        console.log('to search group', contactState.favGroupList)
        let queryPinyin = convert(query, {style: 0}).join('').trim().toLowerCase();
        let result = contactState.favGroupList.filter(g => {
            let groupNamePinyin = convert(g.name, {style: 0}).join('').trim().toLowerCase();
            return g.name.indexOf(query) > -1 || g.name.indexOf(queryPinyin) > -1
                || groupNamePinyin.indexOf(query) > -1 || groupNamePinyin.indexOf(queryPinyin) > -1
        });

        console.log('group searchResult', result)
        return result;
    },

    // TODO
    filterConversation(query) {
        return conversationState.conversationInfoList.filter(info => {
            let displayNamePinyin = convert(info.conversation._target._displayName, {style: 0}).join('').trim().toLowerCase();
            let firstLetters = convert(info.conversation._target._displayName, {style: 4}).join('').trim().toLowerCase();
            return info.conversation._target._displayName.indexOf(query) > -1 || displayNamePinyin.indexOf(query.toLowerCase()) > -1 || firstLetters.indexOf(query) > -1
        })
    },

    filterGroupConversation(query) {
        // query = query.toLowerCase();
        // let groups = conversationState.conversationInfoList.filter(info => info.conversation.type === ConversationType.Group).map(info => info.conversation._target);
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
        let index = pickState.users.findIndex(u => u.uid === user.uid);
        if (index >= 0) {
            pickState.users = pickState.users.filter(u => user.uid !== u.uid)
        } else {
            pickState.users.push(user);
        }
    },

    isUserPicked(user) {
        let index = pickState.users.findIndex(u => u.uid === user.uid);
        return index >= 0;
    },

    // pick actions
    pickOrUnpickOrganization(org) {
        let index = pickState.organizations.findIndex(o => o.id === org.id);
        if (index >= 0) {
            pickState.organizations = pickState.organizations.filter(o => o.id !== org.id)
        } else {
            pickState.organizations.push(org);
        }
    },

    isOrganizationPicked(org) {
        let index = pickState.organizations.findIndex(o => o.id === org.id);
        return index >= 0;
    },

    pickOrUnpickConversation(conversation) {
        let index = pickState.conversations.findIndex(c => (conversation.target === c.target && conversation.line === c.line && conversation.type === c.type))
        if (index >= 0) {
            pickState.conversations = pickState.conversations.filter(c => !(conversation.target === c.target && conversation.line === c.line && conversation.type === c.type))
        } else {
            pickState.conversations.push(conversation);
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

        let groupName = contactState.selfUserInfo.displayName;
        let groupMemberIds = [];
        let groupMemberPortraits = [contactState.selfUserInfo.portrait];
        for (let i = 0; i < users.length; i++) {
            groupMemberIds.push(users[i].uid)
            if (i <= 3) {
                groupName += '、' + users[i].displayName;
            }
            if (i < 8) {
                groupMemberPortraits.push(users[i].portrait)
            }
        }
        groupName = groupName.substr(0, groupName.length - 1);

        genGroupPortrait(users)
            .then(portrait => {
                wfc.uploadMedia(new Date().getTime() + '.png', portrait, MessageContentMediaType.Portrait, (remoteUrl) => {
                    wfc.createGroup(null, GroupType.Restricted, groupName, remoteUrl, null, groupMemberIds, null, [0], null,
                        (groupId) => {
                            let conversation = new Conversation(ConversationType.Group, groupId, 0)
                            this.setCurrentConversation(conversation);
                            successCB && successCB(conversation);
                        }, (error) => {
                            console.log('create group error', error)
                            failCB && failCB(error);
                        });
                }, err => {
                    console.log('upload media err', err)
                });
            })
    },

    _loadUserLocalSettings() {
        let userId = wfc.getUserId();
        // 默认允许通知
        let setting = getItem(userId + '-' + 'notification');
        miscState.enableNotification = setting === null || setting === '1'
        setting = getItem(userId + '-' + 'notificationDetail');
        miscState.enableNotificationMessageDetail = setting === null || setting === '1'
        miscState.enableCloseWindowToExit = getItem(userId + '-' + 'closeWindowToExit') === '1'
        miscState.enableAutoLogin = getItem(userId + '-' + 'autoLogin') === '1'
        setting = getItem('minimizable')
        miscState.enableMinimize = setting === null || setting === '1'
    },

    setEnableNotification(enable) {
        miscState.enableNotification = enable;
        setItem(contactState.selfUserInfo.uid + '-' + 'notification', enable ? '1' : '0')
    },

    setEnableMinimize(enable) {
        miscState.enableMinimize = enable;
        setItem('minimizable', enable ? '1' : '0')
        currentWindow.minimizable = enable;
    },

    setEnableNotificationDetail(enable) {
        miscState.enableNotificationMessageDetail = enable;
        setItem(contactState.selfUserInfo.uid + '-' + 'notificationDetail', enable ? '1' : '0')
    },

    setEnableCloseWindowToExit(enable) {
        miscState.enableCloseWindowToExit = enable;
        setItem(contactState.selfUserInfo.uid + '-' + 'closeWindowToExit', enable ? '1' : '0')
        ipcRenderer.send(IPCEventType.ENABLE_CLOSE_WINDOW_TO_EXIT, enable)
    },

    setEnableAutoLogin(enable) {
        miscState.enableAutoLogin = enable;
        setItem(contactState.selfUserInfo.uid + '-' + 'autoLogin', enable ? '1' : '0')
    },

    // clone一下，别影响到好友列表
    getUserInfos(userIds, groupId) {
        let userInfos = wfc.getUserInfos(userIds, groupId);
        let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
        return this._patchAndSortUserInfos(userInfosCloneCopy, groupId);
    },

    // clone一下，别影响到好友列表
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

    // clone一下，别影响到好友列表
    getConversationMemberUsrInfos(conversation) {
        let userInfos = [];
        if (conversation.type === 0) {
            if (conversation.target !== contactState.selfUserInfo.uid) {
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
            conversationState.conversationInfoList = conversationState.conversationInfoList.filter(info => !info.conversation.equal(conv))
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

            if (fileRecord.conversation.type === 0) {
                fileRecord._conversationDisplayName = '与' + conversationInfo.conversation._target._displayName + '的聊天';
            } else {
                fileRecord._conversationDisplayName = conversationInfo.conversation._target._displayName;
            }
            if (fileRecord.name.indexOf(FileMessageContent.FILE_NAME_PREFIX) === 0) {
                fileRecord.name = fileRecord.name.substring(fileRecord.name.indexOf(FileMessageContent.FILE_NAME_PREFIX) + FileMessageContent.FILE_NAME_PREFIX.length);
            }
            fileRecord._timeStr = helper.dateFormat(fileRecord.timestamp);
            fileRecord._sizeStr = helper.humanSize(fileRecord.size)
            fileRecord._fileIconName = helper.getFiletypeIcon(fileRecord.name.substring(fileRecord.name.lastIndexOf('.')))
        });
    },

    setPageVisibility(visible) {
        miscState.isPageHidden = !visible;
        if (!visible) {
            conversationState.shouldAutoScrollToBottom = false;
        } else if (conversationState.currentConversationInfo) {
            conversationState.shouldAutoScrollToBottom = true;
        }
    },

    clearConversationUnreadStatus(conversation) {
        let info = wfc.getConversationInfo(conversation);
        if (info && (info.unreadCount.unread + info.unreadCount.unreadMention + info.unreadCount.unreadMentionAll) > 0) {
            wfc.clearConversationUnreadStatus(conversation);
            this.updateTray();
        }
    },

    clearAllUnreadStatus() {
        wfc.clearAllUnreadStatus();
        conversationState.conversationInfoList.forEach(info => {
            info.unreadCount = new UnreadCount();
        });
        this.updateTray();
    },

    notify(msg) {
        let content = msg.messageContent;
        let icon = require('@/assets/images/icon.png');
        let tip
        //Todo
        if (msg.direction === 0 /* && !(type===0 && target===file_transfer_id)*/) {
            return;
        }
        if (MessageConfig.getMessageContentPersitFlag(content.type) === PersistFlag.Persist_And_Count) {
            if (msg.status !== MessageStatus.AllMentioned && msg.status !== MessageStatus.Mentioned) {
                let silent = false;
                for (const info of conversationState.conversationInfoList) {
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
                body: miscState.enableNotificationMessageDetail ? content.digest(msg) : '',
                // TODO 下面好像不生效，更新成图片链接
                icon: icon,
                timeout: 4000,
                onClick: () => {
                    if (isElectron()) {
                        ipcRenderer.send(IPCEventType.CLICK_NOTIFICATION, currentWindow.getMediaSourceId())
                    } else {
                        window.focus();
                        this.close();
                    }
                    this.setCurrentConversation(msg.conversation)
                }
            });
        }
    },

    updateTray() {
        if (!isElectron() || !miscState.isMainWindow) {
            return;
        }
        let count = 0;
        conversationState.conversationInfoList.forEach(info => {
            if (info.isSilent) {
                return;
            }
            let unreadCount = info.unreadCount;
            count += unreadCount.unread;
        });
        if (process.platform === 'linux') {
            this.updateLinuxTitle(count);
        } else {
            ipcRenderer.send(IPCEventType.UPDATE_BADGE, count)
        }
    },

    updateLinuxTitle(unreadCount) {
        this.updateLinuxTitle.title = '野火IM';
        this.updateLinuxTitle.unreadCount = unreadCount;
        this.updateLinuxTitle.showTitle = true;
        if (!miscState.linuxUpdateTitleInterval) {
            miscState.linuxUpdateTitleInterval = setInterval(() => {
                if (this.updateLinuxTitle.showTitle || this.updateLinuxTitle.unreadCount < 1) {
                    document.title = this.updateLinuxTitle.title;
                } else {
                    document.title = this.updateLinuxTitle.title + ' ' + this.updateLinuxTitle.unreadCount;
                }
                this.updateLinuxTitle.showTitle = !this.updateLinuxTitle.showTitle;
            }, 1000)
        }
    },

    updateVoipStatus(conversation, isOngoing) {
        conversationState.conversationInfoList.forEach(ci => {
            if (ci.conversation.equal(conversation)) {
                ci._isVoipOngoing = isOngoing;
            } else {
                ci._isVoipOngoing = false;
            }
        })
    },

}

let conversationState = store.state.conversation;
let contactState = store.state.contact;
let searchState = store.state.search;
let pickState = store.state.pick;
let miscState = store.state.misc;

function _reset() {
    conversationState._reset();
    contactState._reset();
    searchState._reset();
    pickState._reset();
    miscState._reset();
}

window.__store = store;
window.stringValue = stringValue;
export default store
