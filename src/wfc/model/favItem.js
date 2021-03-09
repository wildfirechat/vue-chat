export default class FavItem {
    id;
    // 和消息类型对应
    favType;
    timestamp;
    conversation;
    origin;
    sender;
    title;
    url;
    thumbUrl;
    data;

    static fromMessage(message) {
        // TODO
        let favItem = new FavItem();
        return favItem;
    }

    toMessage() {
        // TODO
        return null;
    }
}
