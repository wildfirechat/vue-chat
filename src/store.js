import ConnectionStatus from "@/wfc/client/connectionStatus";
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import ConversationType from "@/wfc/model/conversationType";
import {eq, gt, numberValue} from "@/wfc/util/longUtil";
import helper from "@/ui/util/helper";
import convert from 'pinyin'
import GroupType from "@/wfc/model/groupType";
import {mergeImages} from "@/ui/util/imageUtil";
import MessageContentMediaType from "@/wfc/messages/messageContentMediaType";
import Conversation from "@/wfc/model/conversation";
import MessageContentType from "@/wfc/messages/messageContentType";

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
            currentConversationInfo: null,
            conversationInfoList: [],
            currentConversationMessageList: [],

            shouldAutoScrollToBottom: true,

            previewMediaItems: [],
            previewMediaIndex: null,
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
    },

    setCurrentConversationInfo(conversationInfo) {
        if (conversationState.currentConversationInfo && conversationState.currentConversationInfo.conversation.equal(conversationInfo.conversation)) {
            return;
        }
        conversationState.currentConversationInfo = conversationInfo;
        conversationState.shouldAutoScrollToBottom = true;
        this._loadCurrentConversationMessages();
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

    _patchMessage(m, lastTimestamp) {
        // TODO
        // _from
        // _showTime
        m._from = wfc.getUserInfo(m.from, false, m.conversation.type === ConversationType.Group ? m.conversation.target : '');
        if (numberValue(m.timestamp) - numberValue(lastTimestamp) > 5 * 60 * 1000) {
            m._showTime = true;
            m._timeStr = helper.timeFormat(m.timestamp)
        }

        return m;
    },

    _patchConversationInfo(info) {
        if (info.conversation.type === ConversationType.Single) {
            info.conversation._target = wfc.getUserInfo(info.conversation.target, false);
        } else if (info.conversation.type === ConversationType.Group) {
            info.conversation._target = wfc.getGroupInfo(info.conversation.target, false);
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
            friendList = friendList.map(u => {
                u._pinyin = convert(u.friendAlias ? u.friendAlias : u.displayName, {style: 0}).join('').trim().toLowerCase();
                let firstLetter = u._pinyin[0];
                if (firstLetter >= 'a' && firstLetter <= 'z') {
                    u.__sortPinyin = 'a' + u._pinyin;
                } else {
                    u.__sortPinyin = 'z' + u._pinyin;
                }
                u._firstLetters = convert(u.displayName, {style: 4}).join('').trim().toLowerCase();
                return u;
            }).sort((a, b) => a.__sortPinyin.localeCompare(b.__sortPinyin));

            let lastFirstLetter = null;
            friendList.forEach(u => {
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

            contactState.friendList = friendList;
        }
        // TODO group
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
    pickUser(user, pick = true) {
        if (pick) {
            pickState.users.push(user);
        } else {
            // TODO 根据user.uid 判断
            pickState.users = pickState.users.filter(u => user.uid !== u.uid)
        }
    },

    // TODO pickConversation


    // misc actions
    createGroup(users) {
        if (users.length === 1) {
            this.setCurrentConversation(new Conversation(ConversationType.Single, users[0].uid, 0));
            return;
        }

        let groupName = contactState.selfUserInfo.displayName;
        let groupMemberIds = [];
        let groupMemberPortraits = [];
        for (let i = 0; i < users.length; i++) {
            groupMemberIds.push(users[i].uid)
            if (i <= 3) {
                groupName += '、' + users[i].displayName;
            }
            if (i < 9) {
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
                                this.setCurrentConversation(new Conversation(ConversationType.Group, groupId, 0))
                            }, (error) => {
                                console.log('create group error', error)
                            });
                    },
                    (error) => {
                        console.log('upload media error', error);
                    });
            });
    }
}

let conversationState = store.state.conversation;
let contactState = store.state.contact;
let searchState = store.state.search;
let pickState = store.state.pick;
let miscState = store.state.misc;

export default store

