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
    SHOW_MULTIMEDIA_PREVIEW_WINDOW: 'show-multimedia-preview-window',
    LOGIN: 'login',
    LOGOUT: 'logout',
    RESIZE_LOGIN_WINDOW: 'resizeLoginWindow',
    FILE_PASTE: 'file-paste',
    FILE_COPY: 'file-copy',
    START_SCREEN_SHOT: "screenshots-start",
    OPEN_H5_APP_WINDOW: 'open-h5-app-window',
    WORKSPACE_NEW_TAB_WEB_CONTENT: 'workspace-new-tab-web-content',
    WORKSPACE_ADD_NEW_TAB: 'workspace-add-new-tab',
    SHOW_COMPOSITE_MESSAGE_WINDOW: 'show-composite-message-window',
    IS_SUSPEND: 'is-suspend',
    START_SCREEN_SHARE: 'start-screen-share',
    STOP_SCREEN_SHARE: 'stop-screen-share',
    GET_SOURCE: 'get-source',
}

module.exports = IpcEventType
