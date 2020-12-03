<template>
  <div class="conversation-page">
    <ConversationListView class="conversation-list-container" />
    <ConversationView class="conversation-container" />
  </div>
</template>

<script>
import ConversationListView from "./conversation/ConversationListView";
import ConversationView from "./conversation/ConversationView";
export default {
  data() {
    return {};
  },

  methods: {
    go2Conversation() {
      console.log("go2Conversation");
      this.$router.push("/home/conversation");
    },
    go2Contact() {
      console.log("go2Contatc");
      this.$router.push("/home/contact");
    },
    go2Setting() {
      console.log("go2Setting");
      this.$router.push({ path: "/home/setting" });
    },
  },
  components: {
    ConversationListView,
    ConversationView,
  },
};
</script>

<style lang="css" scoped>

.conversation-page{
  display: flex;
  flex: 1;
}

.conversation-list-container{
  width: 250px;
  background-color: aquamarine;
}

.conversation-container {
  flex: 1;
  background-color: azure;
}
</style>
