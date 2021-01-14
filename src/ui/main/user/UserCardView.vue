<template>
  <section @click.stop="" class="user-info-container">
    <div class="header">
      <div class="desc">
        <h2>{{ userInfo._displayName}}</h2>
        <label>野火ID: {{ userInfo.name }}</label>
      </div>
      <div>
        <img class="avatar" v-bind:src="userInfo.portrait"/>
      </div>
    </div>
    <div class="content">
      <ul>
        <li>
          <label>备注</label>
          <div class="alias">
            <input @click.stop="" type="text" placeholder="备注名"/>
          </div>
        </li>
        <li>
          <label>地区</label>
          <div>北京</div>
        </li>
        <li>
          <label>标签</label>
          <div>测试用户</div>
        </li>
      </ul>
    </div>
    <div class="action">
      <a href="#"><i class="icon-ion-ios-shuffle" @click="share"></i></a>
      <a href="#"><i class="icon-ion-ios-chatboxes" @click="chat"></i></a>
    </div>
  </section>
</template>

<script>
import UserInfo from "@/wfc/model/userInfo";
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";

export default {
  name: "UserCardView",
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
  },
  methods: {
    share() {
      // TODO share
      this.close();
    },
    chat() {
      let conversation = new Conversation(ConversationType.Single, this.userInfo.uid, 0);
      store.setCurrentConversation(conversation)
      this.close();
    },

    close() {
      this.$emit('close');
    }
  }
};
</script>

<style lang="css" scoped>
.user-info-container {
  width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #292a2c;
  background-color: #fcfcfc;
}

.user-info-container .avatar {
  width: 60px;
  height: 60px;
  border-radius: 3px;
}

.header {
  width: calc(100% - 40px);
  margin: 10px 20px;
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid lightgray;
}


.header .desc {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.content {
  width: 100%;
  text-align: left;
}

.content ul {
  border: 1px solid white;
  list-style: none;
  margin: 10px 20px;
}

.content ul li {
  margin-left: 0;
  height: 40px;
  line-height: 40px;
  display: flex;
}

.content ul li label {
  margin-right: 20px;
}

.content ul li .alias {
  border: none;
  background: none;
}

.content ul li .alias > input {
  width: 100%;
}

.content ul li > div {
  display: inline-block;
  flex: 1;
}

.action {
  width: calc(100% - 40px);
  display: flex;
  justify-content: flex-end;

  padding-top: 20px;
  padding-bottom: 10px;
}

.action a {
  display: inline-block;
}

.action a i {
  font-size: 24px;
  padding: 5px 30px;
}

.action a i:last-of-type {
  padding-right: 0;
}

i:hover {
  color: #34b7f1;
}


</style>
