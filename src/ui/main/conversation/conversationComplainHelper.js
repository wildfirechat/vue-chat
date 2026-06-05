import store from "../../../store";
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import IpcSub from "../../../ipc/ipcSub";

const REPORT_SERVICE_UID = 'cgc8c8VV';

export function openComplainServiceChat(activeStore, router) {
    const conversation = new Conversation(ConversationType.Single, REPORT_SERVICE_UID, 0);
    if (store.isConversationInCurrentWindow(conversation)) {
        activeStore.setCurrentConversation(conversation);
        if (router.currentRoute.path !== '/home') {
            router.replace('/home');
        }
    } else {
        IpcSub.startConversation(conversation);
    }
}

export function showComplainAlert(vm, activeStore) {
    vm.$alert({
        title: '',
        content: '如果您发现有违反法律和道德的内容，请截图之后发送给我们，我们会在24小时之内处理',
        confirmText: '举报',
        confirmButtonType: 'danger',
        cancelText: '取消',
        cancelCallback: () => {
            // do nothing
        },
        confirmCallback: () => {
            openComplainServiceChat(activeStore, vm.$router);
        }
    });
}
