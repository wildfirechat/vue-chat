<template>
    <section id="conversation-content" class="conversation-page">
        <ConversationView class="conversation-view"/>
    </section>
</template>

<script>
import ConversationView from "./conversation/ConversationView";
import Conversation from "../../wfc/model/conversation";
import store from "../../store";

export default {
    name: "ConversationFloatPage",
    unmounted() {
        console.log('conversation float page destroyed')
    },
    mounted() {
        let params = new URLSearchParams(window.location.hash.split('?')[1]);
        let type = Number(params.get('type'));
        let target = params.get('target');
        let line = Number(params.get('line'));
        console.log('conversation', type, target, line);
        store.setCurrentConversation(new Conversation(type, target, line));
        let conversationInfo = store.getConversationInfo(new Conversation(type, target, line));
        document.title = conversationInfo.conversation._target._displayName;
    },

    methods: {},
    components: {
        ConversationView,
    },
};
</script>

<style lang="css" scoped>
.conversation-page {
    width: 100vw;
    height: 100vh;
}

.conversation-view {
    flex: 1;
    height: 100%;
    width: 100%;
}

</style>
