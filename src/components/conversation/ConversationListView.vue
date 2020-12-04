<template>
  <section>
    <div>
      <input type="text" placeholder="search" />
    </div>
    <section class="conversation-list">
      <ul>
        <li
          @click="showConversation(conversation)"
          v-for="conversation in conversationList"
          :key="conversation"
        >
          {{ conversation }}
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
export default {
  data() {
    return {
      conversationList: ['jooo', 2, 3, 4, 5, 6],
    };
  },

  methods: {
    showConversation(conversation) {
      console.log("show conversation", conversation);
    },
  },
};
</script>
