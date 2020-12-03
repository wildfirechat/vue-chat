<template>
  <div class="contact-page">
    <ContactListView class="contact-list-container" />
    <ContactDetailView class="contact-detail-container" />
  </div>
</template>

<script>
import ContactListView from "./contact/ContactListView";
import ContactDetailView from "./contact/ContactDetailView";
export default {
  components: {
    ContactListView,
    ContactDetailView,
  },
};
</script>


<style lang="css" scoped>
.contact-page {
  display: flex;
  flex: 1;
}

.contact-list-container {
  background-color: burlywood;
  width: 250px;
}

.contact-detail-container {
  flex: 1;
  background-color: coral;
}
</style>