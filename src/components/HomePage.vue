<template>
  <div class="home-container">
    <div class="home">
      <section class="menu-container">
        <div>
          <a href="#"><img class="avatar" src="" alt=""></a>
        </div>
        <nav class="menu">
          <ul>
            <li><a href="#" @click="go2Conversation">Conversation</a></li>
            <li><a href="#" @click="go2Contact">Contact</a></li>
            <li><a href="#" @click="go2Setting">Setting</a></li>
          </ul>
        </nav>
      </section>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import ConversationListView from "./conversation/ConversationListView";
import ConversationView from "./conversation/ConversationView";
export default {
  data() {
    return {};
  },

  methods: {
    go2Conversation() {
      console.log("go2Conversation");
      this.$router.push("/home");
    },
    go2Contact() {
      console.log("go2Contatc");
      this.$router.push("/home/contact");
    },
    go2Setting() {
      console.log("go2Setting");
      this.$router.push({ path: "/home/setting" });
    },
  },
  components: {
    ConversationListView,
    ConversationView,
  },
};
</script>

<style lang="css" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;

  list-style: none;
}
.home {
  display: flex;
  width: 100vw;
  height: 100vh;
}

.menu-container {
  width: 100px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: antiquewhite;
}

.avatar{
  background-color: gray;
  width: 50px;
  height: 50px;
  display: block;
  margin: 10px auto;
  border-radius: 10px;
}

.menu {
  flex: 1;
}

.menu ul {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.menu ul li {
  margin: 10px;
  height: 50px;
  line-height: 50px;
}

.menu ul li:last-of-type {
  margin-top: auto;
  margin-bottom: 20px;
}

.conversation-list-panel {
  width: 250px;
  background-color: aquamarine;
}

.conversation-container {
  flex: 1;
  background-color: azure;
}
</style>
