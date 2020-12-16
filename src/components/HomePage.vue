<template>
  <div class="home-container">
    <div class="home">
      <section class="menu-container">
        <div>
          <!-- todo tippy example -->
          <tippy
              to="infoTrigger"
              interactive
              :animate-fill="false"
              placement="right"
              distant="7"
              theme="light"
              animation="fade"
              trigger="click"
              arrow
          >
            <UserCardView v-on:close="closeUserCard" :user-info="{name:'Imndx'}"/>
            <!--            <div class="user-info-container">-->
            <!--              <h3>Header</h3>-->
            <!--              <p style="color: black">TODO - data binding</p>-->
            <!--              <button @click="test">Click</button>-->
            <!--            </div>-->
          </tippy>

          <a href="#"><img
              ref="userCardTippy"
              name="infoTrigger"
              class="avatar"
              src="@/assets/images/user-fallback.png"
              alt=""
          /></a>
        </div>
        <nav class="menu">
          <ul>
            <li><i class="icon-ion-ios-chatboxes" v-bind:class="{active : currentTab === 'conversation'}"
                   @click="go2Conversation"></i></li>
            <li><i class="icon-ion-ios-contact" v-bind:class="{active : currentTab === 'contact'}"
                   @click="go2Contact"></i></li>
            <li>
              <i class="icon-ion-ios-settings-strong" v-bind:class="{active : currentTab === 'setting'}"
                 @click="go2Setting"></i>
              <!--              <div>-->
              <!--                <tippy to="testTrigger1"-->
              <!--                       interactive-->
              <!--                       :animate-fill="false"-->
              <!--                       placement="right-end"-->
              <!--                       distant="7"-->
              <!--                       theme="light"-->
              <!--                       animation="fade"-->
              <!--                       trigger="click"-->
              <!--                       arrow>-->
              <!--                  <div class="user-info-container">-->
              <!--                    <h3>Header</h3>-->
              <!--                    <p style="color: black"> TODO - data binding</p>-->
              <!--                    <button @click="test">Click</button>-->
              <!--                  </div>-->
              <!--                </tippy>-->
              <!--                <i class="icon-ion-ios-settings-strong" name="testTrigger1"></i>-->
              <!--              </div>-->
            </li>
          </ul>
        </nav>
      </section>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import UserCardView from "@/components/user/UserCardView";

export default {
  data() {
    return {
      currentTab: 'conversation',
    };
  },

  methods: {
    go2Conversation() {
      this.currentTab = 'conversation';
      this.$router.push("/home");
    },
    go2Contact() {
      this.currentTab = 'contact';
      this.$router.push("/home/contact");
    },
    go2Setting() {
      this.currentTab = 'setting';
      this.$router.push({path: "/home/setting"});
    },

    closeUserCard() {
      console.log('closeUserCard')
      this.$refs["userCardTippy"]._tippy.hide();
    },
  },
  components: {UserCardView},
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
  width: 70px;
  min-width: 70px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #292a2c 0%, #483a3a 100%);
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
  padding: 20px 0;
}

.avatar {
  background-color: gray;
  width: 35px;
  height: 35px;
  display: block;
  margin: 10px auto;
  border-radius: 3px;
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
  height: 40px;
  line-height: 50px;
}

.menu ul li:last-of-type {
  margin-top: auto;
  margin-bottom: 20px;
}


i {
  font-size: 24px;
  color: #000;
  cursor: pointer;
}

i:hover {
  color: #34b7f1;
}

i.active {
  color: #34b7f1;
}
</style>
