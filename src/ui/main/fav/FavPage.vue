<template>
    <section class="fav-page">
        <!--    <FavCategoryListPanel class="fav-category-list-panel"/>-->
        <section class="fav-category-list-panel-container">
            <SearchView :show-add-button="false" :search-type="'fav'"/>
            <div class="panel">
                <SearchResultView v-bind:query="sharedSearchState.query"
                                  v-if="sharedSearchState.show"
                                  class="search-result-container"/>
                <div class="category-container">
                    <ul>
                        <li>
                            <div class="category-item" v-bind:class="{active: category === CATEGORY_ALL}"
                                 @click="showAllFav">
                                <i class="icon-ion-android-cloud"></i>
                                <p>{{ $t('fav.all') }}</p>
                            </div>
                        </li>
                        <li>
                            <div class="category-item" v-bind:class="{active:category === CATEGORY_FILE}"
                                 @click="showFileFav">
                                <i class="icon-ion-android-document"></i>
                                <p>{{ $t('fav.file') }}</p>
                            </div>
                        </li>
                        <li>
                            <div class="category-item" v-bind:class="{active:category === CATEGORY_MEDIA}"
                                 @click="showMediaFav">
                                <i class="icon-ion-image"></i>
                                <p>{{ $t('fav.media') }}</p>
                            </div>
                        </li>
                        <li>
                            <div class="category-item" v-bind:class="{active: category === CATEGORY_COMPOSITE}"
                                 @click="showCompositeFav">
                                <i class="icon-ion-ios-chatboxes"></i>
                                <!--              组合消息-->
                                <p>{{ $t('fav.composite') }}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

        </section>
        <FavView class="fav-list-view" :category="category"/>
    </section>
</template>

<script>
import FavView from "@/ui/main/fav/FavListView";
import store from "@/store";
import SearchResultView from "@/ui/main/search/SearchResultView";
import SearchView from "@/ui/main/search/SearchView";

export default {
    name: "FavPage",
    destroyed() {
        console.log('conversation page destroyed')
    },
    data() {
        return {
            sharedSearchState: store.state.search,
            category: 'all',

            CATEGORY_ALL: 'all',
            CATEGORY_MEDIA: 'media',
            CATEGORY_FILE: 'file',
            CATEGORY_COMPOSITE: 'composite',
        }
    },
    methods: {
        showAllFav() {
            if (this.category === this.CATEGORY_ALL) {
                return;
            }
            this.category = this.CATEGORY_ALL;

        },
        showFileFav() {
            if (this.category === this.CATEGORY_FILE) {
                return;
            }
            this.category = this.CATEGORY_FILE;

        },
        showMediaFav() {
            if (this.category === this.CATEGORY_MEDIA) {
                return;
            }
            this.category = this.CATEGORY_MEDIA;

        },
        showCompositeFav() {
            if (this.category === this.CATEGORY_COMPOSITE) {
                return;
            }
            this.category = this.CATEGORY_COMPOSITE;
        }
    },

    activated() {
        console.log('favPage activated')
    },

    components: {
        FavView,
        SearchResultView,
        SearchView,
    },
};
</script>

<style lang="css" scoped>
.fav-page {
    flex: 1;
    display: flex;
    height: 100%;
}

.fav-list-view {
    flex: 1;
}

.fav-category-list-panel-container {
    width: 250px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e5e5;
}

.panel {
    height: calc(100% - 60px);
    position: relative;
    background-color: #fafafa;
    flex: 1;
    overflow-y: auto;
}

.search-result-container {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}

.category-container {
    width: 100%;
    height: 100%;
}

.category-item {
    display: flex;
    flex-direction: row;
    padding: 5px 0 5px 20px;
    height: 50px;
    align-items: center;
}

.category-item:active {
    background-color: #dedede;
}

.category-item.active {
    background-color: #dedede;
}

.category-item p {
    margin-left: 10px;
    font-size: 14px;
    flex: 1;
}


</style>
