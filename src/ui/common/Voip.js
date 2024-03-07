import store from "../../store";
import ConversationType from "../../wfc/model/conversationType";
import avenginekitproxy from "../../wfc/av/engine/avenginekitproxy";
import IpcSub from "../../ipc/ipcSub";
import {isElectron} from "../../platform";

export default {
    install(app, options) {
        app.config.globalProperties.$startVoipCall = function (options) {
            let {audioOnly, conversation} = options;
            if (store.state.misc.isMainWindow || !isElectron()) {
                if (conversation.type === ConversationType.Single) {
                    avenginekitproxy.startCall(conversation, audioOnly, [conversation.target])
                } else {
                    let successCB = users => {
                        let participantIds = users.map(u => u.uid);
                        avenginekitproxy.startCall(conversation, audioOnly, participantIds)
                    };
                    this.$pickContact({
                        successCB,
                        users: store.getGroupMemberUserInfos(conversation.target, true, true),
                        initialCheckedUsers: [store.state.contact.selfUserInfo],
                        uncheckableUsers: [store.state.contact.selfUserInfo],
                        confirmTitle: this.$t('common.confirm'),
                    });
                }
            } else {
                IpcSub.startVoipCall(conversation, audioOnly);
            }
        };
    }
}
