<template>
    <div class="mix-file-message-view-container">
        <div class="file-content">
            <div v-for="(item, index) in computedFiles" :key="index" class="file-item" @click="clickFile(item)">
                <img class="icon" :src="item.url" alt=""/>
                <div class="name-size">
                    <p class="name single-line">{{ item.name }}</p>
                    <p class="size">{{ item.size }}</p>
                </div>
            </div>
        </div>
        <div class="footer" v-if="message.messageContent.text">
            <p>{{ message.messageContent.text }}</p>
        </div>
    </div>
</template>

<script>
import Message from "../../../../../wfc/messages/message";
import {downloadFile2} from "../../../../../platformHelper";
import helper from "../../../../util/helper";
import {fs, isElectron, shell} from "../../../../../platform";
import Config from "../../../../../config";

export default {
    name: "MixFileTextMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    data() {
        return {
            title: 'title',
            mediaContainerStyleObj: {},
            computedFiles: [],
        }
    },
    beforeMount() {
        this.computeMedia()
            .then(items => {
                this.computedFiles = items
            })
    },

    methods: {
        fileIcon(fileName) {
            let icon = helper.getFiletypeIcon(fileName.substring(fileName.lastIndexOf('.') + 1))
            return require("@/assets/images/filetypes/" + icon);
        },
        async computeMedia() {
            let files = this.message.messageContent.files
            return files.map(item => {
                return {
                    name: item.name,
                    url: item.iv ? (item.url ? item.url : Config.DEFAULT_THUMBNAIL_URL) : this.fileIcon(item.name),
                    size: helper.humanSize(item.size)
                }
            })
        },
        clickFile(item) {
            if (isElectron()) {
                let localPath = item.localPath;
                if (localPath && fs.existsSync(localPath)) {
                    shell.openPath(localPath);
                } else {
                    // if (!this.isDownloading()) {
                    //     downloadFile(this.message)
                    //     store.addDownloadingMessage(this.message.messageUid)
                    // } else {
                    //     this.$notify({
                    //         title: '下载中',
                    //         text: '文件下载中，请稍后',
                    //         type: 'warn'
                    //     });
                    // }
                }
                downloadFile2(item.url, item.name, 0)
            } else {
                downloadFile2(item.url, item.name, 0)
            }
        },
    },
    watch: {
        'message.messageUid': {
            handler() {
                this.computeMedia()
                    .then(items => {
                        this.computedFiles = items
                    })
            },
        }
    },
    directives: {}
}
</script>

<style scoped lang="css">

.mix-file-message-view-container {
    width: 400px;
    max-width: 400px;
    margin: 0 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: white;
    padding: 5px 5px 0 5px;
    border-radius: 5px;
}

.file-content {
    width: 100%;
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}

.file-item {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding-left: 8px;
    gap: 10px;
    min-height: 100px;
}

.file-item .icon {
    max-width: 80px;
    max-height: 80px;
    min-width: 80px;
    min-height: 80px;
    border-radius: 8px;
    background-color: #DEDEDE;
}

.file-item .name-size {
    height: 100%;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.file-item .name {
    font-size: 16px;
    padding-right: 10px;
    max-width: 100%;
}

.file-item .size {
    font-size: 14px;
    padding-top: 5px;
    color: rgb(112, 117, 121);
}

.footer {
    width: 100%;
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

img {
    max-width: 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

i {
    font-size: 24px;
    color: #000b;
    cursor: pointer;
}

i:hover {
    color: #3f64e4;
}

</style>