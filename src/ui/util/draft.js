import wfc from "../../wfc/client/wfc";
import {stringValue} from "../../wfc/util/longUtil";
import store from "@/store";

export default class Draft{

    static setConversationDraft(conversation, draftText, quoteMessage){
        if(!draftText && !quoteMessage){
            wfc.setConversationDraft(conversation, '');
            return;
        }
        let obj = {
            content: draftText,
            quoteMessageUid: quoteMessage ? stringValue(quoteMessage.messageUid) : ''
        }
        wfc.setConversationDraft(conversation, JSON.stringify(obj));
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
        if(!conversationInfo.draft.startsWith("{")){
            obj.text = conversationInfo.draft;
            return obj;
        }
        let draft =  JSON.parse(conversationInfo.draft);
        obj.text = draft.content;
        obj.text = obj.text ? obj.text : '';
        if(draft.quoteMessageUid){
            let msg = store.getMessageByUid(draft.quoteMessageUid);
            obj.quotedMessage = msg;
        }
        return obj;
    }

    static getConversationDraft(conversation) {
        let conversationInfo = wfc.getConversationInfo(conversation);
        return this.getConversationDraftEx(conversationInfo);
    }
}
