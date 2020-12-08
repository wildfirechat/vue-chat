<template>
  <div class="contact-page">
    <ContactListPanel class="contact-list-panel"/>
    <ContactDetailView class="contact-detail-container"/>
  </div>
</template>

<script>
import ContactDetailView from "./contact/ContactDetailView";
import ContactListPanel from "@/components/ContactListPanel";

export default {
  components: {
    ContactListPanel,
    ContactDetailView,
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
  background-color: coral;
}
</style>
