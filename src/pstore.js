import {defineStore} from 'pinia'
import {ref} from "vue";
import ConnectionStatus from "./wfc/client/connectionStatus";
import {getItem} from "./ui/util/storageHelper";
import {isElectron} from "./platform";
import Config from "./config";

export const pstore = defineStore('store-p', () => {
    const conversationStore = ref({
        currentConversationInfo: null,
        conversationInfoList: [],
        currentConversationMessageList: [],
        currentConversationOldestMessageId: 0,
        currentConversationOldestMessageUid: 0,

        currentConversationRead: null,

        // TODO 调用setUserEnableReceipt时，需要更新
        isMessageReceiptEnable: false,
        isGroupMessageReceiptEnable: false,

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
    })

    const contactStore = ref({
        currentFriendRequest: null,
        currentGroup: null,
        currentChannel: null,
        currentFriend: null,
        currentOrganization: null,
        currentExternalDomain: null,
        currentChatroom: null,
        currentUser: null,

        expandFriendRequestList: false,
        expandFriendList: true,
        expandGroup: false,
        expandChanel: false,
        expandOrganization: false,
        expandExternalDomain: false,
        expandChatroom: false,

        unreadFriendRequestCount: 0,
        friendList: [],
        friendRequestList: [],
        favGroupList: [],
        channelList: [],
        favContactList: [],

        selfUserInfo: null,
        contextMenuUserInfo: null,

        isEnableMesh: false,

        _reset() {
            this.currentFriendRequest = null;
            this.currentGroup = null;
            this.currentChannel = null;
            this.currentFriend = null;
            this.currentOrganization = null;
            this.currentChatroom = null;
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
            this.favContactList = [];

            this.selfUserInfo = null;
            this.contextMenuUserInfo = null;
            this.isEnableMesh = false;
        }
    })

    const searchStore = ref({
        query: null,
        userSearchResult: [],
        channelSearchResult: [],
        contactSearchResult: [],
        groupSearchResult: [],
        conversationSearchResult: [],
        messageSearchResult: [],
        searchDomainInfo: null,

        _reset() {
            this.query = null
            this.userSearchResult = [];
            this.channelSearchResult = [];
            this.contactSearchResult = [];
            this.groupSearchResult = [];
            this.conversationSearchResult = [];
            this.messageSearchResult = []
            this.searchDomainInfo = null;
        }
    })

    const pickStore = ref({
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
    })
    const miscStore = ref({
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
        isCommercialServer: false,
        isDisableSyncDraft: false,
        isVoipOngoing: false,
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
            this.isCommercialServer = false;
            this.isDisableSyncDraft = false;
            this.isVoipOngoing = false;
            this.config = Config;
            this.userOnlineStateMap = new Map();
        }
    })

    return {conversationStore, contactStore, pickStore, searchStore, miscStore}
})
