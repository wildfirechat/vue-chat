import MessageConfig from "../../wfc/client/messageConfig";
import PersistFlag from "../../wfc/messages/persistFlag";
import Config from "../../config";

/**
 * 服务器搜索结果（OutputMessageData）的消息过滤规则。
 *
 * 搜索结果列表与消息上下文共用，区别在于：
 * - 上下文按会话原貌展示，只过滤透传/不存储类型（{@link isTransparentSearchMessage}）；
 * - 结果列表额外过滤掉配置的"噪音"类型（{@link isHiddenSearchResultMessage}），
 *   见 {@link Config.SEARCH_RESULT_HIDDEN_MESSAGE_TYPES}。
 */

/**
 * 取 OutputMessageData 的消息类型
 * @param {Object} item OutputMessageData
 * @returns {number|null} 取不到时返回 null
 */
export function searchMessageContentType(item) {
    let type = item && item.payload ? item.payload.type : undefined;
    if (type === undefined || type === null) {
        return null;
    }
    return type;
}

/**
 * 透传/不存储类型（如 Typing），任何场景下都不展示。
 *
 * 注意：<b>不能用 payload.persistFlag 判断</b>。该字段由发送方编码进消息体，
 * 服务端 API / 机器人 / 部分 SDK 发送的消息并不带该字段（解析出来恒为 0），
 * 但消息本身确实已入库（能被搜索到即已存储），据此过滤会把这类会话的消息整屏过滤光。
 * 这里按本地消息类型注册表（MessageConfig）判断，与会话界面语义一致；
 * 未注册类型（-1）保留，由调用方回退 digest 简式展示。
 *
 * @param {Object} item OutputMessageData
 * @returns {boolean}
 */
export function isTransparentSearchMessage(item) {
    let type = searchMessageContentType(item);
    if (type === null) {
        return false;
    }
    let flag = MessageConfig.getMessageContentPersitFlag(type);
    return flag === PersistFlag.No_Persist || flag === PersistFlag.Transparent;
}

/**
 * 搜索结果列表中是否隐藏该消息：透传/不存储类型 + 配置的隐藏类型
 * @param {Object} item OutputMessageData
 * @returns {boolean}
 */
export function isHiddenSearchResultMessage(item) {
    if (isTransparentSearchMessage(item)) {
        return true;
    }
    let type = searchMessageContentType(item);
    if (type === null) {
        return false;
    }
    let hiddenTypes = Config.SEARCH_RESULT_HIDDEN_MESSAGE_TYPES;
    return !!hiddenTypes && hiddenTypes.indexOf(type) > -1;
}
