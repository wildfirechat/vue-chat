import {defineStore} from 'pinia'
import {ref} from "vue";
import ConnectionStatus from "./wfc/client/connectionStatus";
import {getItem} from "./ui/util/storageHelper";
import {isElectron} from "./platform";
import wfc from "./wfc/client/wfc";
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
    })

    const contactStore = ref({
        currentFriendRequest: null,
        currentGroup: null,
        currentChannel: null,
        currentFriend: null,
        currentOrganization: null,
        currentChatroom: null,
        currentUser: null,

        expandFriendRequestList: false,
        expandFriendList: true,
        expandGroup: false,
        expandChanel: false,
        expandOrganization: false,
        expandChatroom: false,

        unreadFriendRequestCount: 0,
        friendList: [],
        friendRequestList: [],
        favGroupList: [],
        channelList: [],
        favContactList: [],

        selfUserInfo: null,
        contextMenuUserInfo: null,
    })

    const searchStore = ref({
        query: null,
        userSearchResult: [],
        channelSearchResult: [],
        contactSearchResult: [],
        groupSearchResult: [],
        conversationSearchResult: [],
        messageSearchResult: [],
    })

    const pickStore = ref({
        users: [],
        organizations: [],
        conversations: [],
        messages: [],
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
        wfc: wfc,
        config: Config,
        userOnlineStateMap: new Map(),
        enableOpenWorkSpace: !!(Config.OPEN_PLATFORM_WORK_SPACE_URL),
    })

    function resetConversationStore() {
        conversationStore.currentConversationInfo = null;
        conversationStore.conversationInfoList = []
        conversationStore.currentConversationMessageList = [];
        conversationStore.currentConversationOldestMessageId = 0;
        conversationStore.currentConversationOldestMessageUid = 0;
        conversationStore.currentConversationRead = null;
        conversationStore.isMessageReceiptEnable = false;
        conversationStore.inputtingUser = null;
        conversationStore.inputClearHandler = null;
        conversationStore.shouldAutoScrollToBottom = true;
        conversationStore.previewMediaItems = [];
        conversationStore.previewMediaIndex = null;
        conversationStore.enableMessageMultiSelection = false;
        conversationStore.showChannelMenu = false;
        conversationStore.quotedMessage = null;
        conversationStore.downloadingMessages = [];
        conversationStore.sendingMessages = [];
        conversationStore.floatingConversations = [];
        conversationStore.currentVoiceMessage = null;
        conversationStore.contextMenuConversationInfo = null;
    }

    return {conversationStore, contactStore, pickStore, searchStore, miscStore}
})