<template>
    <section>
        <ul>
            <li v-for="(chatroom, index) in chatroomList" :key="index" @click="showChatroom(chatroom)">
                <div class="organization-item"
                     v-bind:class="{active: sharedContactState.currentChatroom && sharedContactState.currentChatroom.chatRoomId === chatroom.chatRoomId}">
                    <img class="avatar" :src="chatroom.portrait ? chatroom.portrait : defaultPortraitUrl">
                    <span class="single-line">{{ chatroom.title}}</span>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";
import organizationServerApi from "../../../api/organizationServerApi";
import Config from "../../../config";

export default {
    name: "ChatroomListView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
            chatroomList: [
                {
                    chatRoomId: 'chatroom1',
                    portrait: 'https://static.wildfirechat.net/ic_launcher.png',
                    title: '野火IM聊天室1'
                },
                {
                    chatRoomId: 'chatroom2',
                    portrait: 'https://static.wildfirechat.net/ic_launcher.png',
                    title: '野火IM聊天室2'
                },
                {
                    chatRoomId: 'chatroom3',
                    portrait: 'https://static.wildfirechat.net/ic_launcher.png',
                    title: '野火IM聊天室3'
                }
            ],
            defaultPortraitUrl: ''
        }
    },
    mounted() {

    },
    methods: {
        showChatroom(chatroom) {
            store.setCurrentChatroom(chatroom)
        },
    },
}
</script>

<style scoped>
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.organization-item {
    height: 50px;
    padding: 5px 10px 5px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.organization-item.active {
    background-color: #d6d6d6;
}

.organization-item span {
    margin-left: 10px;
}

</style>
