import store from "../../store";
import ForwardMessageByPickConversationView from "../main/conversation/message/forward/ForwardMessageByPickConversationView";
import ForwardMessageByCreateConversationView from "../main/conversation/message/forward/ForwardMessageByCreateConversationView";

export default {
    install(app, options) {
        app.config.globalProperties.$forwardMessage = function (options) {
            const pickConversationAndForwardMessage = (forwardType, messages) => {
                return new Promise(((resolve, reject) => {
                    let beforeClose = (event) => {
                        console.log('Closing...', event, event.params)
                        // What a gamble... 50% chance to cancel closing
                        if (event.params.toCreateConversation) {
                            // Promise.race([createConversationAndForwardMessage(forwardType, messages)])
                            //     .then(resolve)
                            //     .catch(reject);
                            createConversationAndForwardMessage(forwardType, messages).then(resolve).catch(reject)
                        } else if (event.params.confirm) {
                            let conversations = event.params.conversations;
                            let extraMessageText = event.params.extraMessageText;
                            store.forwardMessage(forwardType, conversations, messages, extraMessageText)
                            resolve();
                        } else {
                            console.log('cancel')
                            resolve();
                        }
                    };

                    this.$modal.show(
                        ForwardMessageByPickConversationView,
                        {
                            forwardType: forwardType,
                            messages: messages
                        },null, {
                            name: 'forward-by-pick-conversation-modal',
                            width: 600,
                            height: 480,
                            clickToClose: false,
                        }, {
                            'before-close': beforeClose,
                        })
                }));
            }

            const createConversationAndForwardMessage = (forwardType, messages) => {
                return new Promise(((resolve, reject) => {
                    let beforeClose = (event) => {
                        console.log('Closing...', event, event.params)
                        if (event.params.backPickConversation) {
                            // Promise.race([pickConversationAndForwardMessage(forwardType, messages)])
                            //     .then(resolve)
                            //     .catch(reject);
                            pickConversationAndForwardMessage(forwardType, messages).then(resolve).then(reject)
                        } else if (event.params.confirm) {
                            let users = event.params.users;
                            let extraMessageText = event.params.extraMessageText;
                            store.forwardByCreateConversation(forwardType, users, messages, extraMessageText)
                            resolve();
                        } else {
                            console.log('cancel')
                            reject();
                        }
                    };
                    this.$modal.show(
                        ForwardMessageByCreateConversationView,
                        {
                            forwardType: forwardType,
                            messages: messages,
                            users: store.state.contact.friendList,
                        }, null, {
                            name: 'forward-by-create-conversation-modal',
                            width: 600,
                            height: 480,
                            clickToClose: false,
                        }, {
                            'before-close': beforeClose,
                        });
                }));
            };
            //return pickConversationAndForwardMessage(ForwardType.NORMAL, [message]);
            return pickConversationAndForwardMessage(options.forwardType, options.messages);
        }
    }
}
