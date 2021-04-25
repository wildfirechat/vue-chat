import wfc from "../../wfc/client/wfc";
import {_patchToJavaLong, _reverseToJsLongString, stringValue} from "../../wfc/util/longUtil";
import store from "@/store";

export default class Draft {

    static setConversationDraft(conversation, draftText, quoteInfo, mentions) {
        if (!draftText && !quoteInfo) {
            wfc.setConversationDraft(conversation, '');
            return;
        }
        let obj = {
            content: draftText,
            mentions: mentions,
            quoteInfo: quoteInfo,
        }
        let jsonStr = JSON.stringify(obj, (key, value) => {
            if (key === 'messageUid') {
                return stringValue(value);
            }
            return value;
        });
        jsonStr = _patchToJavaLong(jsonStr, "messageUid")
        wfc.setConversationDraft(conversation, jsonStr);
    }

    static getConversationDraftEx(conversationInfo) {
        let obj = {
            text: '',
            quotedMessage: null
        }
        if (!conversationInfo || !conversationInfo.draft) {
            return obj;
        }
        // 兼容处理
        if (!conversationInfo.draft.startsWith("{")) {
            obj.text = conversationInfo.draft;
            return obj;
        }
        let draftStr = conversationInfo.draft;
        draftStr = _reverseToJsLongString(draftStr, 'messageUid');
        let draft = JSON.parse(draftStr);
        obj.text = draft.content;
        obj.text = obj.text ? obj.text : '';
        if (draft.quoteInfo) {
            let msg = store.getMessageByUid(draft.quoteInfo.messageUid);
            obj.quotedMessage = msg;
        }
        return obj;
    }

    static getConversationDraft(conversation) {
        let conversationInfo = wfc.getConversationInfo(conversation);
        return this.getConversationDraftEx(conversationInfo);
    }
}
