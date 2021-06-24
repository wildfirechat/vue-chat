<template>
    <section class="screen-window-picker-container" ref="contentContainer">
        <h2 class="title">选择要分享什么</h2>
        <p class="desc">WFC想分享您屏幕上的内容</p>
        <div class="category-container">
            <div class="category" v-bind:class="{active:this.currentCategory === 'screen'}"
                 @click="setCategory('screen')">
                整个屏幕
            </div>
            <div class="category" v-bind:class="{active:this.currentCategory === 'window'}"
                 @click="setCategory('window')">
                窗口
            </div>
        </div>
        <div class="source-container">
            <div :key="source.id"
                 v-for="(source) in currentCategory === 'screen' ? screenSources : windowSources"
                 class="source"
                 v-bind:class="{active:selectedSource && selectedSource.id === source.id}"
                 @click="selectSource(source)"
                 @dblclick="share($event, source)"
            >
                <div class="thumbnail">
                    <img :src="source.thumbnail.toDataURL()" alt="">
                </div>
                <div class="source-icon-name-container">
                    <img class="icon" v-if="source.appIcon" :src="source.appIcon.toDataURL()" alt="">
                    <p class="name single-line">{{ source.name }}</p>
                </div>
            </div>
        </div>
        <div class="action-container">
            <button @click="share" v-bind:disabled="!this.selectedSource">
                分享
            </button>
            <button @click="cancel">
                取消
            </button>
        </div>
    </section>
</template>

<!--only for electron-->
<script>
import {desktopCapturer} from "../../platform";

export default {
    name: "ScreenOrWindowPicker",
    data() {
        return {
            currentCategory: 'screen', // window
            selectedSource: '',
            screenSources: [],
            /*id: "window:94694:0"
            name: "微信 (聊天)"
            thumbnail: NativeImage {}
            display_id: ""
            appIcon: NativeImage {}
             */
            windowSources: [],
        }
    },

    methods: {
        selectSource(source) {
            console.log('select', source)
            this.selectedSource = source;
        },
        setCategory(category) {
            if (this.currentCategory !== category) {
                this.currentCategory = category;
                this.selectedSource = null;

                let width = category === 'screen' ? '50%' : '33%';
                this.$refs.contentContainer.style.setProperty('--source-width', width);
            }
        },

        cancel() {
            this.$modal.hide('screen-window-picker-modal');
        },

        share(ev, source) {
            if (source) {
                this.selectedSource = source;
            }
            this.$modal.hide('screen-window-picker-modal',
                {
                    source: this.selectedSource,
                })
        }
    },

    mounted() {
        let types = ['screen', 'window'];
        desktopCapturer.getSources({types: types, thumbnailSize: {width: 200, height: 200}, fetchWindowIcons: true})
            .then(sources => {
                this.screenSources = sources.filter(source => source.id.startsWith('screen'))
                this.windowSources = sources.filter(source => source.id.startsWith('window'))
            });
    }

}
</script>

<style scoped lang="css">

.screen-window-picker-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 20px;
    --source-width: 50%
}

.category-container {
    display: flex;
}

.category {
    font-size: 16px;
    flex: 1;
    text-align: center;
    padding: 5px;
}

.category.active {
    color: #4168e0;
    border-bottom: 2px solid #4168e0;
}

.source-container {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    flex-wrap: wrap;
    overflow-y: scroll;
    border: 1px solid lightgrey;
    width: 100%;
}

.source {
    margin-top: 5px;
    width: var(--source-width);
    height: 200px;
    padding: 5px;
}

.source.active {
    border: 2px solid #4168e0;
}

.source .thumbnail {
    margin: 10px;
    height: 120px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

.source .source-icon-name-container {
    padding: 10px;
    display: flex;
    flex-direction: row;
}

.source-icon-name-container .icon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
}

.action-container {
    display: flex;
    flex-direction: row-reverse;
}

.action-container button {
    padding: 10px 25px;
    border-radius: 3px;
    font-size: 15px;
    margin: 20px 0 0 10px;
    background: none;
}

.action-container button:active {
    color: #4168e0;
    border-color: #4168e0;
}

.action-container button.disabled {
}

</style>
