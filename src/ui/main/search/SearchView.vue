<template>
    <div class="search-input-container">
        <div class="input-wrapper">
            <i class="icon-ion-ios-search"></i>
            <input id="searchInput"
                   ref="input"
                   autocomplete="off"
                   v-model.trim="sharedSearchState.query"
                   @keydown.esc="cancel"
                   type="text" :placeholder="placeHolder"/>
            <span v-if="sharedSearchState.query" class="clear-btn" @click="sharedSearchState.query = ''">&#215;</span>
        </div>
        <button v-if="showAddButton" @click="showCreateConversationModal">+</button>
        <SearchResultView v-bind:query="sharedSearchState.query" v-if="sharedSearchState.query"/>
    </div>
</template>

<script>
import store from "../../../store";
import Config from "../../../config";
import wfc from "../../../wfc/client/wfc";
import SearchResultView from './SearchResultView.vue';

export default {
    name: "SearchView",
    components: { SearchResultView },
    props: {
        showAddButton: {
            type: Boolean,
            default: true,
        },
        searchType: {
            type: String,
            default: '',
        }
    },
    data() {
        return {
            sharedSearchState: store.state.search,
            sharedContactState: store.state.contact,
            searchTip: '在测试单位搜索用户',
        };
    },
    methods: {
        showCreateConversationModal() {
            let successCB = users => {
                store.createConversation(users);
            }
            let users = this.sharedContactState.favContactList.concat(this.sharedContactState.friendList);
            users = users.filter(u => {
                return u.uid !== Config.FILE_HELPER_ID
            });
            this.$pickContact({
                title: '发起群聊',
                users,
                successCB,
                showOrganization: true,
            });
        },
        cancel() {
            store.hideSearchView();
            this.$refs['input'].blur();
        }
    },

    computed: {
        placeHolder() {
            if (this.sharedSearchState.searchDomainInfo) {
                return `在 ${this.sharedContactState.currentExternalDomain.name} 搜索用户`
            } else {
                return '搜索、添加好友'
            }
        }
    },

    watch: {
        'sharedSearchState.searchDomainInfo': {
            deep: true,
            handler(newValue, oldView) {
                if (newValue) {
                    this.$refs.input.focus();
                }
            }
        }
    }
}
</script>

<style lang="css" scoped>
.search-input-container {
    height: 60px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    background-color: var(--background-secondary);
    -webkit-app-region: drag;
    position: relative;
}

.input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    margin-left: 10px;
    margin-right: 10px;
}

.search-input-container input {
    height: 25px;
    padding: 0 24px 0 20px;
    text-align: left;
    flex: 1;
    width: 100%;
    border: 1px solid var(--border-primary);
    border-radius: 3px;
    outline: none;
    background-color: var(--background-input);
}

.search-input-container input:active {
    border: 1px solid var(--border-active);
}

.search-input-container input:focus {
    border: 1px solid var(--border-active);
}

.search-input-container i {
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translate(0, -50%);
}

.search-input-container button {
    width: 30px;
    height: 25px;
    margin-right: 10px;
    background-color: var(--background-secondary);
    border-radius: 3px;
    border: 1px solid var(--border-primary);
}

.search-input-container .clear-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translate(0, -50%);
    cursor: pointer;
    color: var(--text-secondary-strong);
    -webkit-app-region: no-drag;
    font-size: 16px;
    line-height: 1;
}

.search-input-container button:active {
    background-color: var(--border-primary);
}

</style>
