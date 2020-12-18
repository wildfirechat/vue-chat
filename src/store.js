import ConnectionStatus from "@/wfc/client/connectionStatus";
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import ConversationType from "@/wfc/model/conversationType";
import {eq, gt, numberValue} from "@/wfc/util/longUtil";
import helper from "@/ui/util/helper";
import convert from 'pinyin'

/**
 * 一些说明
 * _开头的字段，是为了UI层展示方便，而打补丁上出去的
 * __开头的字段，仅内部使用
 * _开头的函数，是内部函数
 */
let store = {
    debug: true,
    state: {
        conversation: {
            currentConversationInfo: null,
            conversationInfoList: [],
            currentConversationMessageList: [],
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
            this.state.misc.connectionStatus = status;
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
            console.log('jooo', msg, hasMore)
            if (hasMore) {
                // do nothing
                return;
            }
            this._loadDefaultConversationList();
            if (this.state.conversation.currentConversationInfo && msg.conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
                this._loadCurrentConversationMessages();
            }
        });

        wfc.eventEmitter.on(EventType.RecallMessage, (operator, messageUid) => {
            this._loadDefaultConversationList();
            if (this.state.conversation.currentConversationMessageList) {
                this.state.conversation.currentConversationMessageList.map(msg => {
                    if (eq(msg.messageUid, messageUid)) {
                        return wfc.getMessageByUid(messageUid);
                    }
                    return msg;
                });
            }
        });

        // 服务端删除
        wfc.eventEmitter.on(EventType.MessageDeleted, (messageUid) => {
            this._loadDefaultConversationList();
            console.log('on message delete', messageUid)
            if (this.state.conversation.currentConversationMessageList) {
                this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.filter(msg => !eq(msg.messageUid, messageUid))
            }
        });
        // 本地删除
        wfc.eventEmitter.on(EventType.DeleteMessage, (messageId) => {
            this._loadDefaultConversationList();
            console.log('on delete message', messageId)
            if (this.state.conversation.currentConversationMessageList) {
                this.state.conversation.currentConversationMessageList = this.state.conversation.currentConversationMessageList.filter(msg => msg.messageId !== messageId)
            }
        });


        wfc.eventEmitter.on(EventType.SendMessage, (message) => {
            if (!this.state.conversation.currentConversationInfo || !message.conversation.equal(this.state.conversation.currentConversationInfo.conversation)) {
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
        this.state.conversation.conversationInfoList = conversationList;
    },

    setCurrentConversation(conversation) {
        let convs = this.state.conversation.conversationInfoList.filter(info => info.conversation.equal(conversation));
        if (convs && convs.length > 0) {
            this.setCurrentConversationInfo(convs[0]);
        } else {
            wfc.setConversationTimestamp(conversation, new Date().getTime());
            let info = wfc.getConversationInfo(conversation);
            this._patchConversationInfo(info);
            this.state.conversation.currentConversationInfo = info;
            this._loadDefaultConversationList();
        }
    },

    setCurrentConversationInfo(conversationInfo) {
        if (this.debug) {
            console.log('setCurrentConversation', this.state.currentConversation, conversationInfo);
        }
        this.state.conversation.currentConversationInfo = conversationInfo;
        this._loadCurrentConversationMessages();
    },

    _loadCurrentConversationMessages() {
        if (!this.state.conversation.currentConversationInfo) {
            return;
        }
        let conversation = this.state.conversation.currentConversationInfo.conversation;
        let msgs = wfc.getMessages(conversation);
        let lastTimestamp = 0;
        msgs.forEach(m => {
            this._patchMessage(m, lastTimestamp);
            lastTimestamp = m.timestamp;
        });
        this.state.conversation.currentConversationMessageList = msgs;
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
    },

    // contact actions

    _loadSelfUserInfo() {
        this.state.contact.selfUserInfo = wfc.getUserInfo(wfc.getUserId(), false);
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

            this.state.contact.friendList = friendList;
        }
        // TODO group
    },

    _loadFavGroupList() {
        this.state.contact.favGroupList = wfc.getFavGroupList();
    },

    setCurrentFriendRequest(friendRequest) {
        this.state.contact.currentFriendRequest = friendRequest;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = null;
    },

    setCurrentFriend(friend) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = friend;
        this.state.contact.currentGroup = null;
    },

    setCurrentGroup(group) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = group;
    },

    toggleGroupList() {
        this.state.contact.expandGroup = !this.state.contact.expandGroup;
    },

    toggleFriendRequestList() {
        this.state.contact.expandFriendRequestList = !this.state.contact.expandFriendRequestList;
    },

    toggleFriendList() {
        this.state.contact.expandFriendList = !this.state.contact.expandFriendList;
    },

    // search actions
    toggleSearchView(show) {
        console.log('ts', show, this.state.search.show);
        this.state.search.show = show
    },

    setSearchQuery(query) {
        this.state.search.query = query;
    },

    // pick actions
    pickUser(user, pick = true) {
        if (pick) {
            this.state.pick.users.push(user);
        } else {
            // TODO 根据user.uid 判断
            this.state.pick.users = this.state.pick.users.filter(u => user.uid !== u.uid)
        }
    },

    // TODO pickConversation


    // misc actions
}

export default store

