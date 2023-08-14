<template>
    <div class="video-content-container">
        <video @click.prevent="preview(message)" preload="metadata"
               controls
               draggable="true"
               @dragstart="dragVideo($event)"
               controlsList="nodownload"
               disablePictureInPicture
               :poster="'data:video/jpeg;base64,' + message.messageContent.thumbnail"
               :src="message.messageContent.remotePath +'#t=0.1'"/>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {previewMM} from "../../../../../platformHelper";

export default {
    name: "VideoMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
        isInCompositeView: {
            default: false,
            type: Boolean,
            required: false,
        }
    },
    methods: {
        preview(message) {
            if (this.isInCompositeView) {
                this.$parent.previewCompositeMessage(message.messageUid);
            } else {
                previewMM(message);
            }
        },

        dragVideo(event) {
            let video = this.message.messageContent;
            event.dataTransfer.setData('URL', video.remotePath)
        }
    }
}
</script>

<style lang="css" scoped>
.video-content-container {
    margin: 0 10px;
    position: relative;
    border: 1px solid #efefef;
    border-radius: 5px;
}

.video-content-container video {
    max-height: 300px;
    max-width: 300px;
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
