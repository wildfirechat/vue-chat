<template>
    <section>
        <ul>
            <li v-for="msg in messages" :key="msg.messageId">
                <div class="message-container">
                    <img :src="msg._from.portrait" alt="" class="avatar">
                    <div>
                        <div class="message-sender-time">
                            <p class="sender">{{ $t('message.sender') }}</p>
                            <p class="time">2021/2/3 11:44</p>
                        </div>
                        <div class="message-content-container">
                            <img v-if="msg.type === 3" class="image" :src="msg.content.remotePath" alt="">
                            <p v-else-if="msg.type === 1" class="text">{{ $t('message.content') }}</p>
                            <!--todo more-->
                        </div>
                    </div>
                </div>
            </li>
        </ul>

    </section>

</template>

<script>
export default {
    name: "PreviewMessageView",
    props: {
        title: {
            type: String,
            require: true,
        },
        messages: {
            type: Array,
            require: true,
        },
    },

    computed: {
        computedMessages() {
            // TODO show avatar or not
        }
    }

}
</script>

<style scoped>

</style>
