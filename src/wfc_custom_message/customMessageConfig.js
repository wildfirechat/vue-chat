import PersistFlag from "../wfc/messages/persistFlag";
import CustomMessageContentType from "./customMessageContentType";
import TestCustomMessageContent from "./testCustomMessageContent";
import TestCustomNotificationMessageContent from "./testCustomNotificationMessageContent";
import wfc from "../wfc/client/wfc";
import UnsupportMessageContent from "../wfc/messages/unsupportMessageConten";

export default class CustomMessageConfig {
    static CustomMessageContents = [
        {
            name: 'testCustomMessage', // 消息名字
            flag: PersistFlag.Persist,// 消息的存储类型，根据消息是否需要存储选择
            type: CustomMessageContentType.MESSAGE_CONTENT_TYPE_CUSTOM_MESSAGE_TEST, // 消息类型
            contentClazz: TestCustomMessageContent, // 消息类型定义
        },
        {
            name: 'testCustomNotificationMessage',
            flag: PersistFlag.Persist,
            type: CustomMessageContentType.MESSAGE_CONTENT_TYPE_CUSTOM_MESSAGE_TEST_NOTIFICATION,
            contentClazz: TestCustomNotificationMessageContent,
        },
        // 添加更多自定义消息定义
    ];

    static getMessageContentClazz(type) {
        for (const content of CustomMessageConfig.CustomMessageContents) {
            if (content.type === type) {
                if (content.contentClazz) {
                    return content.contentClazz;
                } else {
                    return UnsupportMessageContent;
                }
            }
        }
        return undefined;
    }

    // 请勿修改下面的registerCustomMessages方法
    static registerCustomMessages() {
        CustomMessageConfig.CustomMessageContents.forEach(cmc => {
            wfc.registerMessageContent(cmc.name, cmc.flag, cmc.type, cmc.contentClazz)
        })
    }
}
