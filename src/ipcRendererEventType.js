// electron renderer进程 和 main进程之间通信的事件定义
const IPCRendererEventType = {
    showConversationMessageHistoryPage: 'show-conversation-message-history-page',
    showMessageHistoryPage: 'show-message-history-page'
}

module.exports = IPCRendererEventType
