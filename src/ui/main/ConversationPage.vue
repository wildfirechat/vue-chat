<template>
    <section id="conversation-content" class="conversation-page">
        <ConversationListPanel class="conversation-list-panel"/>
        <ConversationView class="conversation-view"/>
    </section>
</template>

<script>
import ConversationView from "./conversation/ConversationView";
import ConversationListPanel from "./ConversationListPanel.vue";

export default {
    name: "ConversationPage",
    destroyed() {
        console.log('conversation page destroyed')
    },

    methods: {},
    components: {
        ConversationListPanel,
        ConversationView,
    },
};
</script>

<style lang="css" scoped>
.conversation-page {
    flex: 1;
    display: flex;
    height: 100%;
}

.conversation-list-panel {
    width: 261px;
    height: 100%;
}

.conversation-view {
    flex: 1;
}

</style>
