<template>
  <div>
    <h2 @click="modal">SingleConversationInfo</h2>
  </div>
</template>

<script>
import InviteConversationMember from "@/ui/main/conversation/InviteConversationMember";

export default {
  name: "SingleConversationInfoView",
  methods: {
    modal() {
      this.$modal.show(
          InviteConversationMember,
          {
            name: 'hello world'
          }, {
            name: 'invite-modal',
            width: 300,
            height: 300
          }, {
            'before-open': this.beforeOpen,
            'before-close': this.beforeClose,
            'closed': this.closed,
          })
    },
    beforeOpen(event) {
      console.log('Opening...')
    },
    beforeClose(event) {
      console.log('Closing...', event, event.params)
      // What a gamble... 50% chance to cancel closing
    },
    closed(event) {
      console.log('Close...', event)
    }
  }
};
</script>

<style scoped>
</style>
