<template>
  <div class="home-container">
    <div class="home">
      <section class="menu-container">
        <div>
          <!-- todo tippy example -->
          <tippy to="infoTrigger"
                 interactive
                 :animate-fill="false"
                 placement="right"
                 distant="7"
                 theme="light"
                 animation="fade"
                 trigger="click"
                 arrow>
            <div class="user-info-container">
              <h3>Header</h3>
              <p style="color: black"> TODO - data binding</p>
              <button @click="test">Click</button>
            </div>
          </tippy>

          <a href="#"><img ref="infoTippy"  name="infoTrigger" class="avatar" src="" alt=""></a>
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
      this.$router.push({path: "/home/setting"});
    },
    test() {
      console.log(this.$refs['infoTippy']);
      this.$refs['infoTippy']._tippy.hide();
    }
  },
  components: {},
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

.avatar {
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

.user-info-container{
  width: 200px;
  height: 200px;
}


</style>
