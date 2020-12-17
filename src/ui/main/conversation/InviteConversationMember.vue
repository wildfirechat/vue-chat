<template>
  <h2 @click="closeModal">Inviting {{ name }}</h2>


</template>

<script>
export default {
  name: "InviteConversationMember",
  props: ['name'],

  methods: {
    closeModal() {
      console.log(' to hide modal');
      this.$modal.hide('invite-modal', {result: 'invite result'});
    }
  }

}
</script>

<style scoped>

</style>
