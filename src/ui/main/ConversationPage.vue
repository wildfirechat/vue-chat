<template>
    <section id="conversation-content" class="conversation-page">
        <ConversationListPanel class="conversation-list-panel"/>
        <ResizeBar/>
        <ConversationView class="conversation-view"/>
    </section>
</template>

<script>
import ConversationView from "./conversation/ConversationView";
import ConversationListPanel from "./ConversationListPanel.vue";
import ResizeBar from "../common/ResizeBar.vue";

export default {
    name: "ConversationPage",
    unmounted() {
        console.log('conversation page destroyed')
    },

    methods: {},
    components: {
        ConversationListPanel,
        ConversationView,
        ResizeBar,
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
    width: var(--list-panel-width);
    height: 100%;
    flex: 0 0 var(--list-panel-width);
}

.conversation-view {
    flex: 1;
}

</style>
