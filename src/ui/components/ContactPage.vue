<template>
  <div class="contact-page">
    <ContactListPanel class="contact-list-panel"/>
    <GroupDetailView
        v-if="sharedContactState.currentGroup"
        :group="sharedContactState.currentGroup"
        class="contact-detail-container"/>
    <UserDetailView
        v-if="sharedContactState.currentFriend"
        :user="sharedContactState.currentFriend"
        class="contact-detail-container"/>
  </div>
</template>

<script>
import ContactListPanel from "@/ui/components/ContactListPanel";
import GroupDetailView from "@/ui/components/contact/GroupDetailView";
import store from "@/store";
import UserDetailView from "@/ui/components/contact/UserDetailView";

export default {
  name: 'ContactPage',
  data() {
    return {
      sharedContactState: store.state.contact,
    }
  },
  components: {
    UserDetailView,
    GroupDetailView,
    ContactListPanel,
  },
};
</script>


<style lang="css" scoped>
.contact-page {
  display: flex;
  flex: 1;
}

.contact-list-panel {
  background-color: #fafafa;
  width: 250px;
  height: 100%;
}

ul {
  list-style: none;
}

.contact-detail-container {
  flex: 1;
  background-color: white;
}
</style>
