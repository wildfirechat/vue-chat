import Message from "../../wfc/messages/message";
import Conversation from "../../wfc/model/conversation";
import wfc from "../../wfc/client/wfc";
import MessageStatus from "../../wfc/messages/messageStatus";
import UnsupportMessageContent from "../../wfc/messages/unsupportMessageConten";
import UnknownMessageContent from "../../wfc/messages/unknownMessageContent";
import MessageConfig from "../../wfc/client/messageConfig";
import PersistFlag from "../../wfc/messages/persistFlag";

/**
 * OutputMessageData → 本地 Message 转换工具。
 *
 * 服务端搜索接口返回的每条消息为 OutputMessageData 格式
 * （messageId/sender/fromUser/conv/payload/timestamp/digest/senderUserInfo）。
 *
 * 转换策略：
 * - 使用 SDK 标准转换 Message.messageContentFromMessagePayload（与正常消息接收路径一致，
 *   支持 MessageConfig 注册类型 + CustomMessageConfig 自定义类型）；
 * - 二进制内容预处理：payload.base64edData → binaryContent（图片/文件等 decode 读取 binaryContent）；
 * - 透传/不存储类型（按 MessageConfig 注册表判断，非 payload.persistFlag）不渲染；
 * - 转换失败 / 类型未注册 / 解码为"不支持/未知"类型时返回 null，
 *   由调用方 fallback 到 digest 简式展示（digest 来自 _searchable_key，包含实际内容，
 *   避免显示"不支持/未知类型"占位文案）。
 */

/**
 * 转换单条 OutputMessageData 为本地 Message
 * @param {Object} outputMessageData 服务端返回的消息项
 * @returns {Message|null}
 */
export function messageFromOutputMessageData(outputMessageData) {
    if (!outputMessageData || !outputMessageData.payload || !outputMessageData.conv) {
        return null;
    }
    try {
        const item = outputMessageData;
        const payload = item.payload;

        // 透传/不存储类型（如 Typing）不参与渲染。
        // 注意：不能用 payload.persistFlag 判断——该字段由发送方编码进消息体，
        // 服务端 API/机器人发送的消息常常不带（解析出来恒为 0），但消息确实已入库，
        // 据此过滤会把整屏消息过滤光。按本地消息类型注册表判断，未注册类型（-1）保留。
        const persistFlag = MessageConfig.getMessageContentPersitFlag(payload.type);
        if (persistFlag === PersistFlag.No_Persist || persistFlag === PersistFlag.Transparent) {
            return null;
        }

        // 与 fromOutputMessageData 相同的二进制预处理：图片/文件等 decode 读取 binaryContent
        if (payload.base64edData) {
            payload.binaryContent = payload.base64edData;
            delete payload.base64edData;
        }

        const msg = new Message();
        msg.messageId = item.messageId;
        msg.messageUid = item.messageId;   // 64 位字符串，SDK 支持 Long|String
        msg.from = item.sender;
        msg.content = payload;
        msg.timestamp = item.timestamp || 0;
        msg.conversation = new Conversation(item.conv.type, item.conv.target, item.conv.line);
        const me = wfc.getUserId();
        msg.direction = item.sender === me ? 0 : 1;
        msg.status = item.sender === me ? MessageStatus.Sent : MessageStatus.Unread;

        // SDK 标准转换：支持 MessageConfig 注册类型 + CustomMessageConfig 自定义类型
        msg.messageContent = Message.messageContentFromMessagePayload(payload, item.sender);

        // 不支持/未知类型：返回 null，调用方 fallback digest 简式（显示实际内容而非占位文案）
        if (!msg.messageContent
            || msg.messageContent instanceof UnsupportMessageContent
            || msg.messageContent instanceof UnknownMessageContent
            || msg.messageContent.type === undefined) {
            return null;
        }
        return msg;
    } catch (e) {
        console.warn('messageFromOutputMessageData failed, messageId=', outputMessageData.messageId, e);
        return null;
    }
}

/**
 * 批量转换 OutputMessageData 列表为本地 Message（跳过失败/不支持项）
 * @param {Array<Object>} items
 * @returns {Map<number, Message>} messageId → Message
 */
export function messagesFromOutputMessageData(items) {
    const map = new Map();
    if (!items || !items.length) {
        return map;
    }
    for (const item of items) {
        const msg = messageFromOutputMessageData(item);
        if (msg) {
            map.set(item.messageId, msg);
        }
    }
    return map;
}
