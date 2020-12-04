<template>
  <section>
    <div v-if="conversation==null" class="empty">
      <h2>no conversation is select</h2>
    </div>
    <div v-else>
      <header>
        <h1>Conv title {{ conversation }}</h1>
      </header>
      <div class="message-list">
        <ul>
          <li>msg1</li>
          <li>msg2</li>
          <li>msg3</li>
          <li>msg4</li>
          <li>msg5</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
          <li>msg6</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
import UIEventType from "@/UIEventType";

export default {
  // props: ["conversation"],
  data() {
    return {
      conversation: null,
    }
  },

  mounted() {
    this.$root.$on(UIEventType.currentConversation, (arg) => {
      this.conversation = arg
    })
  },

  created() {
    console.log("conversationView created", this.conversation);
  },

  updated() {
    console.log('conversationView updated', this.conversation)
  }
};
</script>
