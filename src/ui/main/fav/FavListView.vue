<template>
  <section class="fav-list-container">
    <h2>{{ title }}</h2>
    <div infinite-wrapper>
      <div v-if="category === 'media'">
        <div v-for="group in groupedMediaItems"
             :key="group.category"
             class="media-category-container">
          <p>{{ group.category }}</p>
          <ul class="media-category-items">
            <li v-for="(favItem, index ) in group.items"
                @click="handleClickMedia(index, group.items)"
                :key="favItem.id">
              <div v-if="favItem.type === 3" class="media-item-image">
                <img :src="favItem.url">
              </div>
              <div v-else class="media-item-video">
                <video preload="metadata" :src="favItem.url"/>
                <i class="icon-ion-play"></i>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <ul v-else>
        <li v-for="(favItem, index) in (filteredFavItems)"
            :key="index">
          <div class="fav-item-container" @click="handleClick(favItem)">
            <div class="fav-item-content">
              <!--            文件-->
              <div v-if="favItem.type === 5" class="fav-item-file">
                <img :src="require(`@/assets/images/filetypes/${favItem._fileIconName}`)" alt="">
                <div class="name-size">
                  <p class="name">{{ favItem.title }}</p>
                  <p class="size">{{ favItem._sizeStr }}</p>
                </div>
              </div>
              <!--            图片-->
              <div v-else-if="favItem.type === 3" class="fav-item-image">
                <img :src="favItem.url">
              </div>
              <!--            视频-->
              <div v-else-if="favItem.type === 6" class="fav-item-video">
                <video preload="metadata" :src="favItem.url"/>
                <i class="icon-ion-play"></i>
              </div>
              <!--            其他-->
              <div v-else class="fav-item-other">
                <p>
                  {{ favItem.title }}
                </p>
              </div>
            </div>
            <div class="fav-item-sender-time">
              <p class="time">2021/01/30</p>
              <p class="sender">{{ $t('fav.from') + ': ' + favItem._senderName }}</p>
            </div>
          </div>
        </li>
      </ul>
      <infinite-loading :identifier="'fav'" force-use-infinite-wrapper direction="bottom"
                        @infinite="infiniteHandler">
        <!--            <template slot="spinner">加载中...</template>-->
        <template slot="no-more">{{$t('fav.no_more')}}</template>
        <template slot="no-results">{{$t('fav.all_fav_load')}}</template>
      </infinite-loading>
    </div>
  </section>

</template>

<script>
import axios from "axios";
import helper from "@/ui/util/helper";
import MessageContentType from "@/wfc/messages/messageContentType";
import wfc from "@/wfc/client/wfc";
import InfiniteLoading from "vue-infinite-loading";
import store from "@/store";
import {ipcRenderer} from "@/platform";

export default {
  name: "FavListView",
  props: {
    category: {
      type: String,
      default: 'all',
      required: false,
    },
  },
  data() {
    return {
      favItems: [],
    }
  },
  methods: {
    /**
     *
     * @param category
     * @param cb {function(number, boolean, boolean)}}
     * @return {Promise<void>}
     */
    async loadFavList(category, cb) {
      let startId = this.favItems.length > 0 ? this.favItems[this.favItems.length - 1].id : 0
      let response = await axios.post('/fav/list', {
        id: startId,
        count: 20,
      }, {withCredentials: true});
      if (response.data && response.data.result) {
        let obj = response.data.result;
        let items = obj.items;
        let found = false;
        for (let i = 0; i < items.length; i++) {
          if (category === 'all') {
            found = true;
            break;
          }
          if (category === 'file' && items[i].type === MessageContentType.File) {
            found = true;
            break;
          }
          if (category === 'media' && [MessageContentType.Image, MessageContentType.Video].indexOf(items[i].type) >= 0) {
            found = true;
            break;
          }
          if (category === 'composite' && items[i].type === MessageContentType.Composite_Message) {
            found = true;
            break;
          }
        }
        this._patchFavItem(items);
        this.favItems = this.favItems.concat(items);
        if (obj.hasMore && !found && cb) {
          this.loadFavList(category, cb);
          return;
        }
        cb && cb(obj.hasMore);
      } else {
        console.log('loadFavList failed', response)
        cb && cb(false)
      }
    },

    _patchFavItem(favItems) {
      favItems.forEach(fi => {
        if (fi.data) {
          if (fi.type === MessageContentType.Composite_Message) {
            // TODO
          } else {
            fi.data = JSON.parse(fi.data);
          }
        }
        fi._timeStr = helper.dateFormat(fi.timestamp);
        if (fi.type === MessageContentType.File) {
          fi.title = fi.title ? fi.title : 'unname'
          fi._fileIconName = helper.getFiletypeIcon(fi.title.substring(fi.title.lastIndexOf('.')))
          fi._sizeStr = helper.humanSize(fi.data.size)
        }
        fi._senderName = wfc.getUserDisplayName(fi.sender);
      });
    },

    infiniteHandler($state) {
      this.loadFavList(this.category, (hasMore) => {
        if (hasMore) {
          $state.loaded();
        } else {
          $state.complete();
        }
      });
    },
    handleClick(favItem) {
      switch (favItem.type) {
        case MessageContentType.Image:
        case MessageContentType.Video:
          store.previewMedia(favItem.url, favItem.data.thumb)
          break;
        case MessageContentType.File:
          ipcRenderer.send('file-download', {
            // TODO -1时，不通知进度
            messageId: -1,
            remotePath: favItem.url,
            fileName: favItem.title,
          });
          break;
        case MessageContentType.Composite_Message:
          // TODO
          break;
        default:
          console.log('todo click', favItem)
          break;
      }
    },
    handleClickMedia(index, favItems) {
      let mediaItems = [];
      favItems.forEach(favItem => {
        mediaItems.push({
          src: favItem.url,
          thumb: 'data:image/png;base64,' + favItem.data.thumb,
          autoplay: true,
        })
      })
      store.previewMedias(mediaItems, index)
    }
  },

  computed: {
    title() {
      let str = this.$t('fav.fav');
      switch (this.category) {
        case 'all':
          str = this.$t('fav.all');
          break;
        case 'file':
          str = this.$t('fav.file');
          break;
        case 'media':
          str = this.$t('fav.media');
          break;
        case 'composite':
          str = this.$t('fav.composite');
          break;
        default:
          break;
      }
      return str;
    },
    filteredFavItems() {
      let items = this.favItems;
      switch (this.category) {
        case 'all':
          items = this.favItems;
          break;
        case 'file':
          items = this.favItems.filter(fi => fi.type === MessageContentType.File)
          break;
        case 'media':
          items = this.favItems.filter(fi => fi.type === MessageContentType.Image || fi.type === MessageContentType.Video)
          break;
        case 'composite':
          items = this.favItems.filter(fi => fi.type === MessageContentType.Composite_Message)
          break;
        default:
          break;
      }
      return items;
    },

    groupedMediaItems() {
      let items = this.favItems.filter(fi => fi.type === MessageContentType.Image || fi.type === MessageContentType.Video)
      let groupedItems = [];

      let months = [this.$t('common.month_1'), this.$t('common.month_1'), this.$t('common.month_2'), this.$t('common.month_3'), this.$t('common.month_4'), this.$t('common.month_5'), this.$t('common.month_6'), this.$t('common.month_7'), this.$t('common.month_8'), this.$t('common.month_9'), this.$t('common.month_10'), this.$t('common.month_11'), this.$t('common.month_12'), ];

      let map = new Map();
      items.forEach(item => {
        let favDate = new Date(item.timestamp);
        let category = months[favDate.getMonth()] + ' ' + favDate.getFullYear();
        if (!map.has(category)) {
          map.set(category, [item]);
        } else {
          map.get(category).push(item);
        }
      });
      groupedItems = Array.from(map).map(([category, items]) => ({category: category, items: items}))

      console.log('groupedItems', groupedItems)
      // groupedItems = groupedItems.concat(groupedItems)
      return groupedItems;
    },
  },

  mounted() {
    // this.loadFavList('all');
  },
  components: {
    InfiniteLoading,
  }
}
</script>

<style lang="css" scoped>
.fav-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fav-list-container h2 {
  width: 100%;
  height: 60px;
  font-size: 16px;
  font-style: normal;
  font-weight: normal;
  display: flex;
  align-items: center;
  padding-left: 20px;
  border-bottom: 1px solid #ebebeb;
}

.fav-list-container div {
  flex: 1;
  overflow: auto;
}

.fav-item-container {
  width: 100%;
  display: flex;
  min-height: 75px;
  max-height: 110px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 0 80px;
}

.fav-item-container:after {
  position: absolute;
  content: " ";
  height: 0;
  left: 80px;
  right: 80px;
  bottom: 0;
  border-bottom: 1px solid #e4e4e4;
}

.fav-item-container:active {
  background-color: #dedede;
}

.fav-item-content {
  flex: 1;
  padding-right: 20px;
  display: flex;
  align-items: center;
}

.fav-item-other p {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #252525;
}

.fav-item-image {
  height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fav-item-image img {
  height: 70px;
  width: 140px;
  object-fit: cover;
}

.fav-item-file {
  display: flex;
  font-size: 12px;
  height: 110px;
  align-items: center;
}

.fav-item-file img {
  width: 60px;
  height: 60px;
  margin: 0 20px 0 10px;
}

.fav-item-file .name-size {
  padding: 25px 0;
  height: 100%;
  flex: 1;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.fav-item-file .name {
  color: #252525;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-item-file .size {
  color: #b2b2b2;
}

.fav-item-video {
  height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.fav-item-video video {
  background-color: lightgrey;
  height: 70px;
  width: 140px;
  object-fit: cover;
}

.fav-item-video i {
  position: absolute;
  left: 68px;
  right: 0;
  width: 10px;
  margin-right: auto;
}

.fav-item-sender-time {
  max-width: 120px;
  text-align: right;
}

.fav-item-sender-time .time {
  font-size: 12px;
  color: #b6b6b6;
}

.fav-item-sender-time .sender {
  font-size: 12px;
  color: #b2b2b2;
  padding-top: 3px;
}

.media-category-container {
  display: flex;
  flex-direction: column;
  padding: 0 80px;
}

.media-category-container p {
  font-size: 14px;
  padding: 20px 0 10px 0;
}

.media-category-items {
  width: 100%;
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.media-item-image img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  padding: 2px;
}

.media-item-video {
  position: relative;
}

.media-item-video video {
  width: 70px;
  height: 70px;
  object-fit: cover;
  padding: 2px;
}

.media-item-video i {
  position: absolute;
  top: 32px;
  left: 32px;
  width: 10px;
  margin-right: auto;
}

</style>
