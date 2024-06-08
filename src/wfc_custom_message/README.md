## 说明

**自定义消息扩展野火IM 功能时，请勿直接修改`wfc`目录下的内容，修改之后，会为后续升级带来很大的麻烦**

## 自定义消息步骤

1. 定义消息类型，参考[customMessageContentType](./customMessageContentType.js)，`1000`以下为内部保留，请使用`1000`以上的消息类型
2. 实现自定义消息，普通消息参考[testCustomMessageContent](./testCustomMessageContent.js)，通知消息参考[testCustomNotificationMessageContent](./testCustomNotificationMessageContent.js)
3. 配置自定义消息，参考[customMessageConfig](./customMessageConfig.js)
4. 实现自定义消息对应的 UI，普通类型消息请参考[testCustomMessageContentView](../ui/main/conversation/message/content/TestCustomMessageContentView.vue)；
   普通通知类消息，默认会使用默认通知样式，具体参考[NotificationMessageContentView](../ui/main/conversation/message/NotificationMessageContentView.vue)；
5. 配置自定义消息和自定义消息 UI 的对应关系，普通消息参考[MessageContentContainerView](../ui/main/conversation/message/MessageContentContainerView.vue)；
   需要自定义通知类消息 UI 时，请参考考[MessageItemView](../ui/main/conversation/MessageItemView.vue)
