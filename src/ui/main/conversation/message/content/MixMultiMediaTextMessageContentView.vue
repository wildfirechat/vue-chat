<template>
    <div class="mix-multimedia-message-view-container">
        <div class="content" :style="mediaContainerStyleObj">
            <template v-for="(item, index) in computedMedias" :key="index">
                <template v-if="item.type === 'image'">
                    <img ref="thumbnail" v-show="!item.imageLoaded" @click="preview(index)"
                         :style="item.styleObj"
                         v-bind:src="'data:video/jpeg;base64,' + item.thumbnail">
                    <img ref="img" v-show="item.imageLoaded" @click="preview(index)" @load="onImageLoaded(item)"
                         draggable="true"
                         :style="item.styleObj"
                         v-bind:src="item.url">
                </template>
                <template v-else>
                    <img ref="thumbnail" v-show="!item.videoLoaded" @click="preview(index)"
                         :style="item.styleObj"
                         v-bind:src="'data:video/jpeg;base64,' + item.thumbnail">
                    <video v-show="item.videoLoaded" :src="item.url" :style="item.styleObj" @click="preview(index)" @load="onVideoLoaded(item)"/>
                </template>
            </template>
        </div>
        <div class="footer" v-if="message.messageContent.text">
            <p>{{ message.messageContent.text }}</p>
        </div>
    </div>
</template>

<script>
import {Layouter, RectPart} from "../../../view/groupedLayout";
import Message from "../../../../../wfc/messages/message";
import {previewMM} from "../../../../../platformHelper";

export default {
    name: "MixMultiMediaTextMessageContentView",
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
            computedMedias: [],
        }
    },
    beforeMount() {
        this.computeMedia()
            .then(items => {
                this.computedMedias = items
            })
    },

    methods: {
        async computeMedia() {
            let items = this.message.messageContent.multiMedias
            let layoutItems = items.map(item => {
                return {
                    w: item.width,
                    h: item.height,
                }
            })
            let spacing = 5
            let layouter = new Layouter(layoutItems, 400, 200, spacing, 600)
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
                let {geometry, sides} = layout[i]
                let computedItem = {
                    type: items[i].type,
                    url: items[i].url,
                    thumbnail: items[i].thumbnail,
                    styleObj: {
                        position: 'absolute',
                        width: (geometry.width / width * 100) + '%',
                        height: (geometry.height / height * 100) + '%',
                        top: (geometry.y / height * 100) + '%',
                        left: (geometry.x / width * 100) + '%',
                    },
                }


                if (sides & RectPart.Left && sides & RectPart.Top) {
                    computedItem.styleObj.borderStartStartRadius = `calc(var(--border-start-start-radius) - ${spacing}px)`;
                }

                if (sides & RectPart.Left && sides & RectPart.Bottom) {
                    computedItem.styleObj.borderEndStartRadius = `calc(var(--border-end-start-radius) - ${spacing}px)`;
                }

                if (sides & RectPart.Right && sides & RectPart.Top) {
                    computedItem.styleObj.borderStartEndRadius = `calc(var(--border-start-end-radius) - ${spacing}px)`;
                }

                if (sides & RectPart.Right && sides & RectPart.Bottom) {
                    computedItem.styleObj.borderEndEndRadius = `calc(var(--border-end-end-radius) - ${spacing}px)`;
                }

                computedItems.push(computedItem)
            }

            return computedItems
        },
        onImageLoaded(item) {
            item.imageLoaded = true
        },
        onVideoLoaded(item) {
            item.videoLoaded = true
        },
        preview(index) {
            console.log('preview', index)
            previewMM(this.message, index)
        }
    },

    watch: {
        'message.messageUid': {
            handler() {
                console.log('message updated')
                for (let i = 0; i < this.computedMedias.length; i++) {
                    this.computedMedias[i].url = this.message.messageContent.multiMedias[i].url;
                }
            }
        }
    },

    directives: {}
}
</script>

<style scoped lang="css">

.mix-multimedia-message-view-container {
    max-width: 400px;
    max-height: 600px;
    margin: 0 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: white;
    padding: 5px 5px 0 5px;
    border-radius: 5px;
}

.content {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    position: relative;
    border: 1px solid #efefef;
    border-radius: 5px;
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