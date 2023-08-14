<template>
    <div class="sticker-content-container">
        <img ref="thumbnail" v-show="imageLoaded === false" @click="preview(message)"
             v-bind:src="'data:video/jpeg;base64,' + message.messageContent.thumbnail">
        <img ref="img" v-show="imageLoaded" @click="preview(message)" @load="onImageLoaded"
             v-bind:src="message.messageContent.remotePath">
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {scaleDown} from "../../../../util/imageUtil";

export default {
    name: "StickerMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    data() {
        return {
            imageLoaded: false,
        }
    },
    mounted() {
        let iw = this.message.messageContent.width;
        let ih = this.message.messageContent.height;
        if (iw && ih) {
            let size = scaleDown(iw, ih, 200, 200);
            if (size) {
                this.$refs.img.style.height = size.height + 'px';
                this.$refs.img.style.width = size.width + 'px';
                this.$refs.thumbnail.style.height = size.height + 'px';
                this.$refs.thumbnail.style.width = size.width + 'px';
            }
        }
    },
    methods: {
        preview(message) {
            // TODO
            console.log('TODO, preview sticker collection');
        },
        onImageLoaded() {
            this.imageLoaded = true
        }
    }
}
</script>

<style lang="css" scoped>
.sticker-content-container {
    margin: 0 10px;
    position: relative;
    //border: 1px solid #efefef;
    border-radius: 5px;
}

.sticker-content-container img {
    max-height: 200px;
    max-width: 200px;
    width: 200px;
    height: 200px;
    border-radius: 5px;
    object-fit: scale-down;
    overflow: hidden;
}

.right-arrow:before {
    border-left-color: white;
}

.left-arrow:before {
    border-left-color: white;
}

</style>
