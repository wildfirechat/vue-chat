<template>
  <section>
    <div v-if="conversation==null" class="empty">
      <h2>empty</h2>
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
export default {
  props: ["conversation"],

  created() {
    console.log("conversationView created", this.conversation);
  },
  updated() {
    console.log('conversationView updated', this.conversation)
  }
};
</script>
