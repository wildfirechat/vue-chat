<template>
    <div class="image-content-container">
        <div v-if="!message">
            加载中...
        </div>
        <div v-else style="width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center">
            <img v-show="mediaLoaded === false"
                 alt=""
                 v-bind:src="'data:video/jpeg;base64,' + message.messageContent.thumbnail">
            <img v-show="mediaLoaded && message.messageContent.type === 3" @load="onImageLoaded"
                 draggable="true"
                 alt=""
                 ref="img"
                 @contextmenu.prevent="showContextMenu"
                 v-bind:src="message.messageContent.remotePath">
            <video v-show="mediaLoaded && message.messageContent.type === 6" @loadedmetadata="onVideoMetaDataLoaded"
                   controls
                   draggable="true"
                   ref="video"
                   @contextmenu.prevent="showContextMenu"
                   v-bind:src="message.messageContent.remotePath"/>
            <div v-if="hasMoreOldMediaMessage" class="left-arrow-container">
                <div class="left-arrow" @click="previewNextMessage(true)">
                    <i class="icon-ion-ios-arrow-left"></i>
                </div>
            </div>
            <div v-if="hasMoreNewMediaMessage" class="right-arrow-container">
                <div class="right-arrow" @click="previewNextMessage(false)">
                    <i class="icon-ion-ios-arrow-right"></i>
                </div>
            </div>
        </div>
        <vue-context ref="menu" v-on:close="()=>{}">
            <li>
                <a @click.prevent="download">{{
                        $t('common.save')
                    }}</a>
            </li>
            <li>
                <a @click.prevent="forward">{{
                        $t('misc.share_to_friend')
                    }}</a>
            </li>
        </vue-context>
    </div>
</template>

<script>
import '../../vendor/vue-cool-lightbox/dist/vue-cool-lightbox.min.css'
import wfc from "../../wfc/client/wfc";
import {currentWindow, ipcRenderer, screen} from "../../platform";
import MessageContentType from "../../wfc/messages/messageContentType";
import {downloadFile} from "../../platformHelper";
import ForwardType from "./conversation/message/forward/ForwardType";
import {scaleDown} from "../util/imageUtil";

export default {
    name: 'MultimediaPreviewPage',
    data() {
        return {
            mediaLoaded: false,
            message: null,
            hasMoreOldMediaMessage: true,
            hasMoreNewMediaMessage: true,
            minWidth: 480,
            minHeight: 360,
        }
    },

    created() {
        document.title = '野火IM消息预览';
        let hash = window.location.hash;

        if (hash.indexOf('messageUid=') >= 0) {
            let messageUid = hash.substring(hash.indexOf('=') + 1);
            this.message = wfc.getMessageByUid(messageUid);
        }

        window.addEventListener('keyup', this.handleKeyPress, true);
    },

    methods: {

        resize(width, height) {
            let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
            let workAreaWith = display.workAreaSize.width;
            let workAreaHeight = display.workAreaSize.height;

            let size = scaleDown(width, height, workAreaWith, workAreaHeight);
            currentWindow.setSize(size.width, size.height);
            // currentWindow.center();
        },
        onImageLoaded() {
            this.mediaLoaded = true
            console.log('imageLoaded', this.$refs.img, this.$refs.img.naturalWidth, this.$refs.img.naturalHeight);
            let imgWidth = this.$refs.img.naturalWidth;
            let imgHeight = this.$refs.img.naturalHeight;
            this.resize(imgWidth, imgHeight);
        },
        onVideoMetaDataLoaded() {
            this.mediaLoaded = true
            console.log('videoMetaDataLoaded', this.$refs.video, this.$refs.video.videoWidth, this.$refs.video.videoHeight);
            let videoWidth = this.$refs.video.videoWidth;
            let videoHeight = this.$refs.video.videoHeight;
            this.resize(videoWidth, videoHeight);
        },
        handleKeyPress(event) {
            switch (event.keyCode) {
                case 32:// 空格
                    if (this.message.messageContent.type === MessageContentType.Video) {
                        if (this.$refs.video.paused) {
                            this.$refs.video.play();
                        } else {
                            this.$refs.video.pause();
                        }
                    } else {
                        this.close();
                    }
                    break;
                case 27: // ESC
                    this.close();
                    break;
                case 39: // 右箭头
                    this.previewNextMessage(false);
                    break;
                case 37:// 左箭头
                    this.previewNextMessage(true);
                    break
                default:
                    break;
            }
        },
        previewNextMessage(before) {
            this.$refs.menu.close();
            wfc.getMessagesByTimestampV2(this.message.conversation, [MessageContentType.Image, MessageContentType.Video], this.message.timestamp, before, 1, '', msgs => {
                if (msgs.length > 0) {
                    this.mediaLoaded = false;
                    this.message = msgs[0];
                    if (before) {
                        this.hasMoreNewMediaMessage = true;
                    } else {
                        this.hasMoreOldMediaMessage = true;
                    }
                } else {
                    if (before) {
                        this.hasMoreOldMediaMessage = false;
                    } else {
                        this.hasMoreNewMediaMessage = false;
                    }
                }
            }, err => {
                console.log('getMessagesByTimestampV2 error', err);
            })

        },
        close() {
            currentWindow.webContents.emit('unload')
            currentWindow.hide();
        },

        showContextMenu(event) {
            this.$refs.menu.open(event)
        },

        download() {
            downloadFile(this.message);
        },

        forward() {
            console.log('forward message', this.message);
            this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [this.message],
            });
        }
    },

    components: {}
}

</script>

<!--should not scoped-->
<style lang="css" scoped>

.image-content-container {
    position: relative;
//border: 1px solid #efefef; //border-radius: 5px;
}

.image-content-container img {
    width: 100%;
    height: 100%;
    border-radius: 5px;
    overflow: hidden;
    object-fit: contain;
}

.image-content-container video {
    width: 100%;
    height: 100%;
    border-radius: 5px;
    overflow: hidden;
    object-fit: scale-down;
}

.left-arrow-container {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.left-arrow {
    display: none;
}

.left-arrow-container:hover .left-arrow {
    color: white;
    background: #9a9a9a;
    width: 50px;
    height: 50px;
    border-radius: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.left-arrow i {
    font-size: 30px;
}

.right-arrow-container {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.right-arrow {
    display: none;
}

.right-arrow-container:hover .right-arrow {
    color: white;
    background: #9a9a9a;
    width: 50px;
    height: 50px;
    border-radius: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.right-arrow i {
    font-size: 30px;
}

</style>
