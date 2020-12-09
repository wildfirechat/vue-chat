<template>
  <div class="contact-page">
    <ContactListPanel class="contact-list-panel"/>
    <UserDetailView class="contact-detail-container"/>
  </div>
</template>

<script>
import ContactListPanel from "@/components/ContactListPanel";
import UserDetailView from "@/components/contact/UserDetailView";

export default {
  components: {
    UserDetailView,
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
