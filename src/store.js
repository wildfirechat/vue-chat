import ConnectionStatus from "@/wfc/client/connectionStatus";
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import ConversationType from "@/wfc/model/conversationType";
import {eq, gt, numberValue} from "@/wfc/util/longUtil";
import helper from "@/ui/util/helper";
import convert from 'pinyin'
import GroupType from "@/wfc/model/groupType";
import {imageThumbnail, mergeImages, videoThumbnail} from "@/ui/util/imageUtil";
import MessageContentMediaType from "@/wfc/messages/messageContentMediaType";
import Conversation from "@/wfc/model/conversation";
import MessageContentType from "@/wfc/messages/messageContentType";
import MessageConfig from "@/wfc/client/messageConfig";
import PersistFlag from "@/wfc/messages/persistFlag";
import Message from "@/wfc/messages/message";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import VideoMessageContent from "@/wfc/messages/videoMessageContent";
import FileMessageContent from "@/wfc/messages/fileMessageContent";

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

            shouldAutoScrollToBottom: true,

            previewMediaItems: [],
            previewMediaIndex: null,

            enableMessageMultiSelection: false,
            selectedMessages: [],
            quotedMessage: null,
        },

        contact: {
            currentFriendRequest: null,
            currentGroup: null,
            currentFriend: null,

            expandFriendRequestList: false,
            expandFriendList: false,
            expandGroup: false,

            friendList: [],
            friendRequestList: [],
            favGroupList: [],

            selfUserInfo: null,
        },

        search: {
            query: null,
            show: false,
        },

        pick: {
            users: [],
            conversations: [],
        },

        misc: {
            test: false,
            connectionStatus: ConnectionStatus.ConnectionStatusUnconnected,
        },
    },

    init() {
        wfc.eventEmitter.on(EventType.ConnectionStatusChanged, (status) => {
            miscState.connectionStatus = status;
            this._loadFavGroupList();
            this._loadFriendList();
            this._loadSelfUserInfo();
        });

        wfc.eventEmitter.on(EventType.UserInfosUpdate, (userInfos) => {
            // TODO optimize
            this._loadDefaultConversationList();
            this._loadCurrentConversationMessages();
            this._loadFriendList();
            // TODO 其他相关逻辑
        });

        wfc.eventEmitter.on(EventType.GroupInfosUpdate, (groupInfos) => {
            // TODO optimize
            this._loadDefaultConversationList();
            this._loadFavGroupList();
            // TODO 其他相关逻辑

        });

        wfc.eventEmitter.on(EventType.ReceiveMessage, (msg, hasMore) => {
            if (!this._isDisplayMessage(msg)) {
                return;
            }

            if (!hasMore) {
                this._loadDefaultConversationList();
            }
            if (conversationState.currentConversationInfo && msg.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                // 会把下来加载更多加载的历史消息给清理了
                let lastTimestamp = 0;
                let msgListLength = conversationState.currentConversationMessageList.length;
                if (msgListLength > 0) {
                    lastTimestamp = conversationState.currentConversationMessageList[msgListLength - 1].timestamp;
                }
                this._patchMessage(msg, lastTimestamp);
                conversationState.currentConversationMessageList.push(msg);
            }
        });

        wfc.eventEmitter.on(EventType.RecallMessage, (operator, messageUid) => {
            this._loadDefaultConversationList();
            if (conversationState.currentConversationInfo) {
                let msg = wfc.getMessageByUid(messageUid);
                if (msg && msg.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                    if (conversationState.currentConversationMessageList) {
                        let lastTimestamp = 0;
                        conversationState.currentConversationMessageList.map(msg => {
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
        });

        // 服务端删除
        wfc.eventEmitter.on(EventType.MessageDeleted, (messageUid) => {
            this._loadDefaultConversationList();
            if (conversationState.currentConversationInfo) {
                let msg = wfc.getMessageByUid(messageUid);
                if (msg && msg.conversation.equal(conversationState.currentConversationInfo.conversation)) {
                    if (conversationState.currentConversationMessageList) {
                        conversationState.currentConversationMessageList = conversationState.currentConversationMessageList.filter(msg => !eq(msg.messageUid, messageUid))
                    }
                }
            }
        });
        // 本地删除
        wfc.eventEmitter.on(EventType.DeleteMessage, (messageId) => {
            this._loadDefaultConversationList();
            if (conversationState.currentConversationInfo) {
                if (conversationState.currentConversationMessageList) {
                    conversationState.currentConversationMessageList = conversationState.currentConversationMessageList.filter(msg => msg.messageId !== messageId)
                }
            }
        });


        wfc.eventEmitter.on(EventType.SendMessage, (message) => {
            if (!this._isDisplayMessage(message)) {
                return;
            }
            if (!conversationState.currentConversationInfo || !message.conversation.equal(conversationState.currentConversationInfo.conversation)) {
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

    },

    // conversation actions

    _isDisplayMessage(message) {
        return [PersistFlag.Persist, PersistFlag.Persist_And_Count].indexOf(MessageConfig.getMessageContentPersitFlag(message.messageContent.type)) > -1;
    },

    _loadDefaultConversationList() {
        this.loadConversationList([0, 1], [0])
    },

    loadConversationList(conversationType = [0, 1], lines = [0]) {
        let conversationList = wfc.getConversationList(conversationType, lines);
        conversationList.forEach(info => {
            this._patchConversationInfo(info);
        });
        conversationState.conversationInfoList = conversationList;
    },

    setCurrentConversation(conversation) {
        if (conversationState.currentConversationInfo && conversation.equal(conversationState.currentConversationInfo.conversation)) {
            return;
        }
        let convs = conversationState.conversationInfoList.filter(info => info.conversation.equal(conversation));
        if (convs && convs.length > 0) {
            this.setCurrentConversationInfo(convs[0]);
        } else {
            wfc.setConversationTimestamp(conversation, new Date().getTime());
            let info = wfc.getConversationInfo(conversation);
            this._patchConversationInfo(info);
            conversationState.currentConversationInfo = info;
            this._loadDefaultConversationList();
        }
        conversationState.shouldAutoScrollToBottom = true;
        this._loadCurrentConversationMessages();

        conversationState.enableMessageMultiSelection = false;
        conversationState.selectedMessages.length = 0;
        conversationState.quotedMessage = null;
    },

    setCurrentConversationInfo(conversationInfo) {
        if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversationInfo.conversation)) {
            return;
        }
        conversationState.currentConversationInfo = conversationInfo;
        conversationState.shouldAutoScrollToBottom = true;
        this._loadCurrentConversationMessages();

        conversationState.enableMessageMultiSelection = false;
        conversationState.selectedMessages.length = 0;
        conversationState.quotedMessage = null;
    },

    toggleMessageMultiSelection() {
        conversationState.enableMessageMultiSelection = !conversationState.enableMessageMultiSelection;
        conversationState.selectedMessages.length = 0;
    },

    selectOrDeselectMessage(message) {
        let index = conversationState.selectedMessages.findIndex(m => m.messageId === message.messageId);
        if (index >= 0) {
            conversationState.selectedMessages.splice(index, 1);
        } else {
            conversationState.selectedMessages.push(message);
        }
    },

    deleteSelectedMessages() {
        conversationState.enableMessageMultiSelection = false;
        if (conversationState.selectedMessages.length < 1) {
            return;
        }
        conversationState.selectedMessages.sort((m1, m2) => m1.messageId - m2.messageId);
        conversationState.selectedMessages.forEach(m => {
            wfc.deleteMessage(m.messageId);
        });
        conversationState.selectedMessages.length = 0;
    },

    setShouldAutoScrollToBottom(scroll) {
        conversationState.shouldAutoScrollToBottom = scroll;
    },

    previewMessage(message) {
        conversationState.previewMediaItems.length = 0;
        conversationState.previewMediaIndex = null;
        let mediaMsgs = conversationState.currentConversationMessageList.filter(m => [MessageContentType.Image, MessageContentType.Video].indexOf(m.messageContent.type) > -1)
        let msg;
        for (let i = 0; i < mediaMsgs.length; i++) {
            msg = mediaMsgs[i];
            if (msg.messageId === message.messageId) {
                conversationState.previewMediaIndex = i;
            }
            conversationState.previewMediaItems.push({
                src: msg.messageContent.remotePath,
                thumb: 'data:image/png;base64,' + msg.messageContent.thumbnail,
                autoplay: true,
            });
        }
    },
    async sendFile(conversation, file) {
        let msg = new Message();
        msg.conversation = conversation;

        var mediaType = helper.getMediaType(file.name.split('.').slice(-1).pop());
        var messageContentmediaType = {
            'pic': MessageContentMediaType.Image,
            'video': MessageContentMediaType.Video,
            'doc': MessageContentMediaType.File,
        }[mediaType];

        let messageContent;
        switch (messageContentmediaType) {
            case MessageContentMediaType.Image:
                let iThumbnail = await imageThumbnail(file);
                if (iThumbnail === null) {
                    return false;
                }
                // let img64 = self.imgDataUriToBase64(imageThumbnail);
                messageContent = new ImageMessageContent(file, null, iThumbnail.split(',')[1]);
                break;
            case MessageContentMediaType.Video:
                let vThumbnail = await videoThumbnail(file);
                if (vThumbnail === null) {
                    return false;
                }
                // let video64 = self.imgDataUriToBase64(videoThumbnail);
                messageContent = new VideoMessageContent(file, null, vThumbnail.split(',')[1]);
                break;
            case MessageContentMediaType.File:
                messageContent = new FileMessageContent(file);
                break;
            default:
                return false;
        }
        msg.messageContent = messageContent;
        wfc.sendMessage(msg,
            (messageId) => {
                console.log('sf, p', messageId)

            },
            (progress, total) => {
                console.log('sf pp', progress, total)
            },
            (messageUid) => {
                console.log('sf s', messageUid)

            },
            (error) => {
                console.log('sf e', error)

            }
        );
    },

    quoteMessage(message) {
        conversationState.quotedMessage = message;
    },

    _loadCurrentConversationMessages() {
        if (!conversationState.currentConversationInfo) {
            return;
        }
        let conversation = conversationState.currentConversationInfo.conversation;
        let msgs = wfc.getMessages(conversation);
        let lastTimestamp = 0;
        msgs.forEach(m => {
            this._patchMessage(m, lastTimestamp);
            lastTimestamp = m.timestamp;
        });
        conversationState.currentConversationMessageList = msgs;
    },

    loadConversationHistoryMessages(loadedCB, completeCB) {
        if (!conversationState.currentConversationInfo) {
            return;
        }
        let conversation = conversationState.currentConversationInfo.conversation;
        let firstMsgUid = conversationState.currentConversationMessageList.length > 0 ? conversationState.currentConversationMessageList[0].messageUid : 0;
        wfc.loadRemoteConversationMessages(conversation, firstMsgUid, 20,
            (msgs) => {
                if (conversation.equal(conversationState.currentConversationInfo.conversation)) {
                    let lastTimestamp = 0;
                    msgs.forEach(m => {
                        this._patchMessage(m, lastTimestamp);
                        lastTimestamp = m.timestamp;
                    });
                    conversationState.currentConversationMessageList = msgs.concat(conversationState.currentConversationMessageList);
                }
                if (msgs.length === 0) {
                    completeCB();
                } else {
                    loadedCB();
                }
            },
            (error) => {
                completeCB();
            });
    },

    setConversationTop(conversation, top) {
        wfc.setConversationTop(conversation, top,
            () => {
                this._loadDefaultConversationList();
            },
            (err) => {
                console.log('setConversationTop error', err)
            });
    },

    setConversationSilent(conversation, silent) {
        wfc.setConversationSlient(conversation, silent,
            () => {
                this._loadDefaultConversationList();
            },
            (err) => {
                console.log('setConversationSilent error', err)
            });
    },

    removeConversation(conversation) {
        wfc.removeConversation(conversation, false);
        if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversation)) {
            conversationState.currentConversationInfo = null;
        }
        this._loadDefaultConversationList();
    },

    _patchMessage(m, lastTimestamp) {
        // TODO
        // _from
        // _showTime
        m._from = wfc.getUserInfo(m.from, false, m.conversation.type === ConversationType.Group ? m.conversation.target : '');
        if (m.conversation.type === ConversationType.Group) {
            m._from._displayName = wfc.getGroupMemberDisplayNameEx(m._from);
        } else {
            m._from._displayName = wfc.getUserDisplayNameEx(m._from);
        }
        if (numberValue(m.timestamp) - numberValue(lastTimestamp) > 5 * 60 * 1000) {
            m._showTime = true;
            m._timeStr = helper.timeFormat(m.timestamp)
        }

        return m;
    },

    _patchConversationInfo(info) {
        if (info.conversation.type === ConversationType.Single) {
            info.conversation._target = wfc.getUserInfo(info.conversation.target, false);
            info.conversation._target._displayName = wfc.getUserDisplayNameEx(info.conversation._target);
        } else if (info.conversation.type === ConversationType.Group) {
            info.conversation._target = wfc.getGroupInfo(info.conversation.target, false);
            info.conversation._target._displayName = info.conversation._target.name;
        }
        if (gt(info.timestamp, 0)) {
            info._timeStr = helper.dateFormat(info.timestamp);
        } else {
            info._timeStr = '';
        }
        return info;
    },

    // contact actions

    _loadSelfUserInfo() {
        contactState.selfUserInfo = wfc.getUserInfo(wfc.getUserId(), false);
    },

    _loadFriendList() {
        let friends = wfc.getMyFriendList(false);
        if (friends && friends.length > 0) {
            let friendList = wfc.getUserInfos(friends, '');
            contactState.friendList = this._patchAndSortUserInfos(friendList, '');
        }
        console.log('xxx', contactState.friendList);
    },

    _patchAndSortUserInfos(userInfos, groupId = '') {
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
        }).sort((a, b) => a.__sortPinyin.localeCompare(b.__sortPinyin));

        let lastFirstLetter = null;
        userInfos.forEach(u => {
            let uFirstLetter = u.__sortPinyin[1];
            if (uFirstLetter >= 'a' && uFirstLetter <= 'z') {
                if (!lastFirstLetter || lastFirstLetter !== uFirstLetter) {
                    u._category = uFirstLetter;
                    lastFirstLetter = u._category;
                }
            } else {
                if (lastFirstLetter !== '#') {
                    u._category = '#';
                    lastFirstLetter = u._category;
                }
            }
        });
        return userInfos;
    },

    _loadFavGroupList() {
        contactState.favGroupList = wfc.getFavGroupList();
    },

    setCurrentFriendRequest(friendRequest) {
        contactState.currentFriendRequest = friendRequest;
        contactState.currentFriend = null;
        contactState.currentGroup = null;
    },

    setCurrentFriend(friend) {
        contactState.currentFriendRequest = null;
        contactState.currentFriend = friend;
        contactState.currentGroup = null;
    },

    setCurrentGroup(group) {
        contactState.currentFriendRequest = null;
        contactState.currentFriend = null;
        contactState.currentGroup = group;
    },

    toggleGroupList() {
        contactState.expandGroup = !contactState.expandGroup;
    },

    toggleFriendRequestList() {
        contactState.expandFriendRequestList = !contactState.expandFriendRequestList;
    },

    toggleFriendList() {
        contactState.expandFriendList = !contactState.expandFriendList;
    },

    // search actions
    toggleSearchView(show) {
        console.log('ts', show, searchState.show);
        searchState.show = show
    },

    setSearchQuery(query) {
        searchState.query = query;
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

        mergeImages(groupMemberPortraits)
            .then((groupPortrait) => {
                wfc.uploadMedia('', groupPortrait, MessageContentMediaType.Portrait,
                    (remoteUrl) => {
                        console.log('upload media success', remoteUrl);
                        wfc.createGroup(null, GroupType.Restricted, groupName, remoteUrl, groupMemberIds, [0], null,
                            (groupId) => {
                                this._loadDefaultConversationList();
                                let conversation = new Conversation(ConversationType.Group, groupId, 0)
                                this.setCurrentConversation(conversation);
                                successCB && successCB(conversation);
                            }, (error) => {
                                console.log('create group error', error)
                                failCB && failCB(error);
                            });
                    },
                    (error) => {
                        console.log('upload media error', error);
                    });
            });
    },

    // clone一下，别影响到好友列表
    getGroupMemberUserInfos(groupId, includeSelf = true) {

        let memberIds = wfc.getGroupMemberIds(groupId);
        let userInfos = wfc.getUserInfos(memberIds, groupId);
        if (!includeSelf) {
            userInfos = userInfos.filter(u => u.uid !== wfc.getUserId())
        }
        let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
        return this._patchAndSortUserInfos(userInfosCloneCopy, groupId);
    },

    // clone一下，别影响到好友列表
    getConversationMemberUsrInfos(conversation) {
        let userInfos = [];
        if (conversation.type === 0) {
            userInfos.push(wfc.getUserInfo(wfc.getUserId(), false));
            userInfos.push(wfc.getUserInfo(conversation.target, false));
            let userInfosCloneCopy = userInfos.map(u => Object.assign({}, u));
            userInfos = this._patchAndSortUserInfos(userInfosCloneCopy, '');
        } else if (conversation.type === 1) {
            userInfos = this.getGroupMemberUserInfos(conversation.target, true);
        }
        return userInfos;
    }
}

let conversationState = store.state.conversation;
let contactState = store.state.contact;
let searchState = store.state.search;
let pickState = store.state.pick;
let miscState = store.state.misc;

export default store

