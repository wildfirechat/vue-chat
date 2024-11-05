<template>
    <div class="send-mix-multimedia-message-view-container">
        <div class="header">
            <i class="icon-ion-close" style="visibility: hidden"></i>
            <p>{{ title }}</p>
            <i class="icon-ion-more" style="visibility: hidden"></i>
        </div>
        <div v-if="isAllImageOrVideoFile" class="multi-media-content" :style="mediaContainerStyleObj">
            <template v-for="(item, index) in computedMultiMedias" :key="index">
                <img v-if="item.type === 'image'" :src="item.url" alt="hello" :style="item.styleObj"/>
                <video v-else :src="item.url" :style="item.styleObj"/>
            </template>
        </div>
        <div v-else class="file-content">
            <div v-for="(item, index) in computedFiles" :key="index" class="file-item">
                <img class="icon" :src="item.url" alt=""/>
                <div class="name-size">
                    <p class="name">{{ item.name }}</p>
                    <p class="size">{{ item.size }}</p>
                </div>
            </div>
        </div>
        <div class="footer">
            <VEmojiPicker
                id="emoji"
                ref="emojiPicker"
                v-if="showEmojiDialog"
                labelSearch="Search"
                lang="pt-BR"
                v-v-on-click-outside="hideEmojiView"
                :customEmojis="emojis"
                :customCategories="emojiCategories"
                style="position: absolute; right: 10px; bottom: 50px"
                @select="onSelectEmoji"
            />
            <input ref="input" placeholder="添加一些描述..." autofocus v-model="comment">
            <i id="showEmoji" class="icon-ion-ios-heart" @click="toggleEmojiView"></i>
            <i class="icon-ion-android-send" @click="send"></i>
        </div>
    </div>
</template>

<script>
import {Layouter, RectPart} from "./groupedLayout";
import {imageSize, videoSize} from "../../util/imageUtil";
import {categoriesDefault, emojisDefault, VEmojiPicker} from "@imndx/v-emoji-picker-vue3";
import Config from "../../../config";
import {config as emojiConfig} from "../conversation/EmojiAndStickerConfig";
import {vOnClickOutside} from '@vueuse/components'
import Conversation from "../../../wfc/model/conversation";
import store from "../../../store";
import helper from "../../util/helper";
import {fs, ipcRenderer, isElectron} from "../../../platform";
import IpcEventType from "../../../ipcEventType";

export default {
    name: "SendMixMediaMessageView",
    components: {VEmojiPicker},
    props: {
        conversation: {
            type: Conversation,
            required: true,
        },
        files: {
            type: Array,
            required: true,
        },
        text: {
            type: String,
            required: false,
        }
    },
    data() {
        return {
            title: 'title',
            mediaContainerStyleObj: {},
            computedMultiMedias: [],
            newPasteFiles: [],
            computedFiles: [],
            showEmojiDialog: false,
            emojiCategories: categoriesDefault,
            emojis: emojisDefault,
            comment: this.text,
            isAllImageOrVideoFile: true,
        }
    },
    beforeMount() {
        console.log('before mount', this.files)
    },
    mounted() {
        this.initEmojiPicker()
        window.addEventListener('paste', this.handlePaste)
        window.addEventListener('keydown', this.onKeyDown)
        this.computeMedia()
        this.$refs.input.focus()
    },

    beforeUnmount() {
        this.computedMultiMedias.forEach(media => {
            URL.revokeObjectURL(media.url)
        })
        this.computedFiles.forEach(media => {
            if (media.url) {
                URL.revokeObjectURL(media.url)
            }
        })
        window.removeEventListener('paste', this.handlePaste)
        window.removeEventListener('keydown', this.onKeyDown)
    },
    methods: {
        onKeyDown(evt) {
            // enter
            if (evt.keyCode === 13) {
                this.send(evt)
            }
            // 字符输入
            if (evt.inputType === 'insertText' || evt.inputType === 'insertCompositionText') {
                this.$refs.input.focus()
            }
        },
        async handlePaste(e) {
            let text;
            e.preventDefault();
            if (e.target !== document.body && e.target !== this.$refs.input) {
                return
            }

            if ((e.originalEvent || e).clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData('text/plain');
            } else {
                text = await navigator.clipboard.readText();
            }
            if (text && text.trim()) {
                this.$refs.input.focus()
                document.execCommand('insertText', false, text.trim());
                // Safari 浏览器 execCommand 失效，可以采用下面这种方式处理粘贴
                // this.$refs.input.innerText += text;
                return
            }
            console.log('handlePaste', e);
            const dT = e.clipboardData || window.clipboardData;
            if (dT) {
                let fileList = dT.files;
                if (this.files.length + fileList.length > 10) {
                    this.$notify({
                        text: '一次最多支持发送 10 个媒体',
                        type: 'error'
                    });
                }

                let pasteFiles = [...fileList]

                // 允许粘贴相同文件
                let filteredFiles = pasteFiles.filter(f => {
                    let index = this.files.findIndex(file => {
                            return f.size === file.size
                        }
                    )
                    if (index > -1) {
                        if (!this.isAllImageOrVideoFile) {
                            return false
                        } else {
                            return f.type.indexOf('image') > -1 || f.type.indexOf('video') > -1;
                        }
                    } else {
                        return true
                    }
                })
                this.files.push(...filteredFiles)
                this.computeMedia()
            } else {
                // do nothing
            }

        },
        send(e) {
            if (e && e.keyCode === 229) {
                return
            }
            if (this.files.length === 1 && !this.$refs.input.value.trim()) {
                store.sendFile(this.conversation, this.files[0])
            } else {
                store.sendMixMediaMessage(this.conversation, [...this.files, ...this.newPasteFiles], this.$refs.input.value.trim())
            }
            this.$modal.hide('send-mix-multi-media-message-modal', {confirm: true})
        },
        computeMedia() {
            for (let i = 0; i < this.files.length; i++) {
                if (this.files[i].type.indexOf('image') === -1 && this.files[i].type.indexOf('video') === -1) {
                    this.isAllImageOrVideoFile = false
                    break
                }
            }
            if (this.isAllImageOrVideoFile) {
                this.title = `${this.files.length} 媒体`
                this.computeMultiMedia()
                    .then(items => {
                        this.computedMultiMedias = items
                    })

            } else {
                this.title = `${this.files.length}  文件`
                this.computeFile()
                    .then(items => {
                        this.computedFiles = items
                    })

            }
        },
        initEmojiPicker() {
            window.__twemoji_base_url__ = Config.emojiBaseUrl();
            let config = emojiConfig();
            this.emojiCategories = config.emojiCategories.filter(c => !c.name.startsWith('Sticker'));
            this.emojis = config.emojis.filter(c => !c.category.startsWith('Sticker'));
        },
        toggleEmojiView() {
            this.showEmojiDialog = !this.showEmojiDialog;
        },
        hideEmojiView(e) {
            if (e.target.id !== 'showEmoji') {
                this.showEmojiDialog = false;
            }
        },
        onSelectEmoji(emoji) {
            this.showEmojiDialog = false;
            this.$refs.input.focus();
            document.execCommand('insertText', false, emoji.data);
        },
        fileIcon(fileName) {
            let icon = helper.getFiletypeIcon(fileName.substring(fileName.lastIndexOf('.') + 1))
            return require("@/assets/images/filetypes/" + icon);
        },
        async computeFile() {
            let items = await Promise.all(
                this.files.map(async file => {
                    let isImgOrVideo = file.type.indexOf('image') >= 0 || file.type.indexOf('video') >= 0;
                    return {
                        name: file.name,
                        size: helper.humanSize(file.size),
                        type: isImgOrVideo ? 'imageOrVideo' : 'file',
                        url: isImgOrVideo ? URL.createObjectURL(file) : this.fileIcon(file.name),
                    }
                })
            )
            return items
        },

        async computeMultiMedia() {
            let items = await Promise.all(
                this.files.map(async file => {
                    let isImg = file.type.indexOf('image') >= 0;
                    let mediaUrl = URL.createObjectURL(file);
                    let size = isImg ? await imageSize(mediaUrl) : await videoSize(mediaUrl);
                    return {
                        type: isImg ? 'image' : 'video',
                        w: size.width,
                        h: size.height,
                        url: mediaUrl,
                        fileSize: file.size
                    }
                })
            )

            let layouter = new Layouter(items, 560, 200, 5, 400)
            let layout = layouter.layout()

            const widthItem = layout.find((item) => item.sides & RectPart.Right);
            const width = widthItem.geometry.width + widthItem.geometry.x;

            const heightItem = layout.find((item) => item.sides & RectPart.Bottom);
            const height = heightItem.geometry.height + heightItem.geometry.y;

            this.mediaContainerStyleObj = {
                width: width + 'px',
                height: height + 'px'
            }

            let computedItems = []
            for (let i = 0; i < items.length; i++) {
                computedItems.push({
                    type: items[i].type,
                    url: items[i].url,
                    styleObj: {
                        position: 'absolute',
                        width: (layout[i].geometry.width / width * 100) + '%',
                        height: (layout[i].geometry.height / height * 100) + '%',
                        top: (layout[i].geometry.y / height * 100) + '%',
                        left: (layout[i].geometry.x / width * 100) + '%',
                    },
                })
            }

            return computedItems
        },
    },
    directives: {
        vOnClickOutside,
    }
}
</script>

<style scoped lang="css">

.send-mix-multimedia-message-view-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.header {
    width: 100%;
    height: 55px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.multi-media-content {
    width: 100%;
    flex: 1;
    overflow: hidden;
    position: relative;
}

.file-content {
    width: 100%;
    flex: 1;
    overflow: auto;
    position: relative;
    display: flex;
    flex-direction: column;
}

.file-item {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding-left: 20px;
    gap: 20px;
    min-height: 100px;
}

.file-item .icon {
    max-width: 80px;
    max-height: 80px;
    border-radius: 8px;
}

.file-item .name-size {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

.file-item .name {
    font-size: 16px;
}

.file-item .size {
    font-size: 14px;
    padding-top: 5px;
    color: rgb(112, 117, 121);
}

.footer {
    width: 100%;
    height: 60px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    gap: 20px;
}

.footer input {
    flex: 1;
    height: 30px;
    padding-left: 10px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    background-color: #eeeeee;
}

img {
    max-width: 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

video {
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