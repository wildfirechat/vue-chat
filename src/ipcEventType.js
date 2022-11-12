// electron renderer进程 和 main进程之间通信的事件定义
const IpcEventType = {
    showConversationMessageHistoryPage: 'show-conversation-message-history-page',
    showMessageHistoryPage: 'show-message-history-page',
    showConversationFloatPage: 'show-conversation-float-page',
    DOWNLOAD_FILE: 'file-download',
    ENABLE_CLOSE_WINDOW_TO_EXIT: 'enable-close-window-to-exit',
    CLICK_NOTIFICATION: 'click-notification',
    UPDATE_BADGE: 'update-badge',
    SHOW_FILE_WINDOW: 'show-file-window',
    LOGINED: 'logined',
    LOGOUT: 'logouted',
    FILE_PASTE: 'file-paste',
    START_SCREEN_SHOT: "screenshots-start",
    OPEN_H5_APP_WINDOW: 'open-h5-app-window',
    SHOW_COMPOSITE_MESSAGE_WINDOW: 'show-composite-message-window',
    IS_SUSPEND: 'is-suspend',
    START_SCREEN_SHARE: 'start-screen-share',
    STOP_SCREEN_SHARE: 'stop-screen-share',
}

module.exports = IpcEventType
