<template>
    <div>
        <div class="file-upload-container">
            <input type="file" @change="onPickFile($event)">
            <button :disabled="!file" @click="upload">上传</button>
        </div>
        <div v-if="miscState.uploadBigFiles.length > 0" class="file-record-container">
            <ul>
                <li v-for="(fr, index) in miscState.uploadBigFiles"
                    :key="index">
                    <div class="file-record-item">
                        <img :src="require(`@/assets/images/filetypes/${fr._fileIconName}`)" alt="">
                        <div class="file-name-size-progress-container">
                            <p class="name single-line"> {{ fr.name }}</p>
                            <p v-if="fr.status !== 3" class="size single-line">{{ fr._sizeStr }}</p>
                            <p v-if="fr.status === 3" class="size single-line">上传失败</p>
                            <progress v-if="fr.status === 1" max="100" :value="fr.progress">70%</progress>
                        </div>
                        <div class="file-action-container">
                            <button v-if="fr.status === 1" @click="cancel(fr)">取消</button>
                            <button v-else-if="fr.status === 2" @click="send(fr)">发送</button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else class="empty-container">
            没有文件上传记录
        </div>
    </div>
</template>

<script>
import store from "../../../store";

export default {
    name: "UploadRecordView",
    data() {
        return {
            // status:1 上传中，2 上传成功 3 上传失败
            miscState: store.state.misc,
            file: null,
        }
    },
    methods: {
        onPickFile(event) {
            console.log('onPickFile', event.target.files[0]);
            this.file = event.target.files[0];
        },
        upload() {
            store.uploadBigFile(this.file, 4);
        },
        send(fr) {
            let name = fr.name;
            let size = fr.size;
            let remoteUrl = fr.remoteUrl;

            this.$eventBus.$emit('send-file', {
                name: name, size: size, remoteUrl: remoteUrl
            })
        },
        cancel(fr) {
            store.cancelUploadBigFile(fr.remoteUrl)
        }
    }
}
</script>

<style lang="css" scoped>
.file-upload-container {
    padding: 10px 25px 20px 35px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.file-upload-container > button {
    justify-self: flex-end;
    align-items: flex-end;
    padding: 5px 20px;
    border-radius: 4px;
    border: 1px solid #cccccc;
}

.file-upload-container > button:active {
    background-color: #e5e5e5;
}

.file-record-container {
    height: calc(480px - 30px);
    padding-bottom: 10px;
    overflow: auto;
}

.file-record-item {
    position: relative;
    height: 70px;
    width: 100%;
    display: flex;
    padding: 0 25px 0 35px;
    align-items: center;
    justify-content: space-between;
}

.file-record-item:after {
    display: block;
    position: absolute;
    content: " ";
    height: 0;
    top: 70px;
    left: 40px;
    right: 35px;
    border-bottom: 1px solid #f2f2f2;
}

/*.file-record-item:hover {*/
/*    background-color: #dedede;*/
/*}*/

.file-record-item img {
    width: 40px;
    height: 40px;
    margin: 0 15px 0 0;
}

.file-name-size-progress-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: calc(100% - 40px - 80px);
    flex: 1;
}

.file-name-size-progress-container .name {
    font-size: 14px;
    color: #252525;
    padding-bottom: 3px;
}

.file-name-size-progress-container .size {
    font-size: 12px;
    color: #b2b2b2;
    padding-top: 3px;
}

.file-name-size-progress-container progress {
    width: 100%;
}

.file-action-container {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    width: 80px;
    justify-content: center;
}

.file-action-container button {
    padding: 5px 20px;
    border-radius: 4px;
    border: 1px solid #cccccc;
}

.file-action-container button:active {
    background-color: #e5e5e5;
}

.empty-container {
    text-align: center;
    padding-top: 20px;
}

</style>