<template>
    <section>
        <ul>
            <li v-for="(chatroom, index) in chatroomList" :key="index" @click="showChatroom(chatroom)">
                <div class="chatroom-item"
                     v-bind:class="{active: sharedContactState.currentChatroom && sharedContactState.currentChatroom.chatRoomId === chatroom.chatRoomId}">
                    <img class="avatar" :src="chatroom.portrait ? chatroom.portrait : defaultPortraitUrl">
                    <div class="item-info">
                        <p class="single-line">{{ chatroom.title}}</p>
                    </div>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";

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
.chatroom-item {
    padding: 8px 4px 8px 30px;
    display: flex;
    font-size: var(--font-size-sm);
    align-items: center;
}

.chatroom-item:hover{
    background-color: var(--background-item-hover);
}

.chatroom-item.active {
    background-color: var(--background-item-placeholder);
}

.item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-left: 8px;
}

.chatroom-item span {
    /*margin-left: 10px;*/
}

</style>
