<template>
  <div class="pick-contact-container">
    <section class="contact-list-container">
      <div class="input-container">
        <input type="text" placeholder="搜索">
      </div>
      <div class="friend-list-container">
        <FriendListVue :enable-pick="true" :friends="contacts"/>
      </div>
    </section>
    <section class="checked-contact-list-container">
      <header>
        <h2>发起群聊</h2>
        <span>已选择联系人</span>
      </header>
      <div class="content">

      </div>
      <footer>
        <button>取消</button>
        <button>创建</button>
      </footer>
    </section>
  </div>
</template>

<script>
import FriendListVue from "@/components/contact/FriendListVue";

export default {
  name: "PickContactView",
  components: {FriendListVue},
  props: ['contacts', 'initialCheckedContacts', 'uncheckableContacts', 'title', 'confirmTitle'],
}
</script>

<style lang="css" scoped>
.pick-contact-container {
  display: flex;
  height: 100%;
}

.contact-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: #f7f7f7;
}

.contact-list-container .input-container {
  display: flex;
  width: 100%;
  background-color: red;
}

.contact-list-container input {
  height: 25px;
  margin: 15px 20px 15px 15px;
  flex: 1;
  border-radius: 3px;
  border: 1px solid #ededed;
  background-color: white;
  padding-left: 10px;
  text-align: left;
}

.contact-list-container .friend-list-container {
  height: 100%;
  overflow: auto;
  margin-left: -10px;
}

.checked-contact-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.checked-contact-list-container header {
  height: 55px;
  background-color: rebeccapurple;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.checked-contact-list-container .content {
  flex: 1;
}

.checked-contact-list-container footer {
  height: 55px;
  background-color: #42b983;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}


</style>
