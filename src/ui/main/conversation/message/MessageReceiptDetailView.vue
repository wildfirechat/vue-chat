<template>
  <section class="receipt-detail-container">
    <h1>消息回执信息</h1>
    <h2>已读人员</h2>
    <p>{{ readUsersDesc() }}</p>
    <h2>已送达</h2>
    <p>{{ receivedUsersDesc() }}</p>
    <h2>未送达</h2>
    <p>{{ unreceiveUsersDesc() }}</p>
  </section>
</template>

<script>
export default {
  name: "MessageReceiptDetailView",
  props: {
    readUsers: {
      type: Array,
      required: true,
      default: null,
    },
    receivedUsers: {
      type: Array,
      required: true,
      default: null,
    },
    unreceiveUsers: {
      type: Array,
      required: true,
      default: null,
    }
  },
  methods: {
    readUsersDesc() {
      let desc = '';
      if (this.readUsers) {
        this.readUsers.forEach(u => {
          desc += u._displayName + '、';
        });
        desc = desc.substring(0, desc.length - 1)
      }
      return desc ? desc : '无';
    },
    receivedUsersDesc() {
      let desc = '';
      if (this.receivedUsers) {
        this.receivedUsers.forEach(u => {
          desc += u._displayName + '、';
        });
        desc = desc.substring(0, desc.length - 1)
      }
      return desc ? desc : '无';
    },
    unreceiveUsersDesc() {
      let desc = '';
      if (this.unreceiveUsers) {
        this.unreceiveUsers.forEach(u => {
          desc += u._displayName + '、';
        });
        desc = desc.substring(0, desc.length - 1)
      }
      return desc ? desc : '无';
    },
  }
}

</script>

<style lang="css" scoped>
.receipt-detail-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.receipt-detail-container h1 {
  align-self: center;
}

</style>
