<template>
    <div class="search-input-container">
        <div class="input-wrapper">
            <i class="icon-ion-ios-search"></i>
            <input id="searchInput"
                   ref="input"
                   autocomplete="off"
                   v-model.trim="sharedSearchState.query"
                   @keydown.esc="cancel"
                   @focus="inputFocused = true"
                   @blur="inputFocused = false"
                   type="text" :placeholder="placeHolder"/>
            <span v-if="sharedSearchState.query" class="clear-btn" @click="sharedSearchState.query = ''">&#215;</span>
        </div>
        <div v-if="showAddButton" class="add-btn-container">
            <button ref="addBtn" @click="toggleMenu">+</button>
        </div>
        <Teleport to="body">
            <div v-if="showMenu" class="add-menu-popup" :style="popupStyle">
                <div class="add-menu-arrow"></div>
                <div class="add-menu">
                    <div class="add-menu-item" @click.stop="onAddFriend">添加好友</div>
                    <div class="add-menu-item" @click.stop="onCreateGroup">发起群聊</div>
                </div>
            </div>
        </Teleport>
        <SearchResultView v-bind:query="sharedSearchState.query" v-bind:showHint="inputFocused" v-if="sharedSearchState.query || inputFocused"/>
    </div>
</template>

<script>
import store from "../../../store";
import Config from "../../../config";
import SearchResultView from './SearchResultView.vue';
import { getItem, setItem } from '../../util/storageHelper';
import wfc from '../../../wfc/client/wfc';

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
            showMenu: false,
            inputFocused: false,
            popupStyle: { visibility: 'hidden' },
        };
    },
    mounted() {
        document.addEventListener('click', this.closeMenu);
        window.addEventListener('resize', this.closeMenu);
        window.addEventListener('contextmenu', this.closeMenu);
        window.addEventListener('scroll', this.updateMenuPosition, true);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.closeMenu);
        window.removeEventListener('resize', this.closeMenu);
        window.removeEventListener('contextmenu', this.closeMenu);
        window.removeEventListener('scroll', this.updateMenuPosition, true);
    },
    methods: {
        updateMenuPosition() {
            if (!this.showMenu || !this.$refs.addBtn) return;
            const rect = this.$refs.addBtn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            this.popupStyle = {
                position: 'fixed',
                top: `${rect.bottom}px`,
                left: `${centerX}px`,
                transform: 'translateX(-50%)',
                zIndex: 10000,
                visibility: 'visible',
            };
        },
        toggleMenu() {
            this.showMenu = !this.showMenu;
            if (this.showMenu) {
                this.popupStyle = { visibility: 'hidden' };
                this.$nextTick(() => this.updateMenuPosition());
            }
        },
        closeMenu(e) {
            if (e && e.target instanceof Node && this.$refs.addBtn && this.$refs.addBtn.contains(e.target)) {
                return;
            }
            this.showMenu = false;
        },
        onAddFriend() {
            this.showMenu = false;
            let tipKey = `${wfc.getUserId()}-show-add_friend_tip`
            let hasTipped = getItem(tipKey)
            if(hasTipped){
                this.$nextTick(() => {
                    this.$refs.input.focus();
                });
                return;
            }
            this.$alert({
                showIcon: false,
                title: '提示',
                content: '请在左上角搜索框中输入关键词，即可搜索用户，并添加好友',
                confirmText: '知道了',
                cancelText: '关闭',
                confirmCallback: () => {
                    setItem(tipKey, true);
                    this.$nextTick(() => {
                        this.$refs.input.focus();
                    });
                },
                cancelCallback: () => {
                    // do nothing
                }
            });
        },
        onCreateGroup() {
            this.showMenu = false;
            this.showCreateConversationModal();
        },
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
    margin-left: 8px;
    margin-right: 8px;
}

.search-input-container input {
    height: calc(25px * var(--layout-scale-cap));
    padding: 0 24px 0 20px;
    text-align: left;
    flex: 1;
    width: 100%;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    outline: none;
    background-color: var(--background-input);
    font-size: var(--font-size-sm);
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
    background-color: var(--background-secondary);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-primary);
}

.add-btn-container {
    position: relative;
    flex-shrink: 0;
    margin-right: 8px;
}

.add-menu-popup {
    position: fixed;
    z-index: 10000;
}

.add-menu-arrow {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid var(--border-subtle);
}

.add-menu-arrow::after {
    content: '';
    position: absolute;
    left: -7px;
    top: 2px;
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid var(--background-tooltip);
}

.add-menu {
    margin-top: 8px;
    font-size: var(--font-size-base);
    background-color: var(--background-tooltip);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-tooltip);
    min-width: 120px;
    padding: 4px;
}

.add-menu-item {
    padding: .4rem .85rem;
    color: var(--text-primary);
    white-space: nowrap;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--duration-fast), color var(--duration-fast);
}

.add-menu-item:hover {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
}

.search-input-container .clear-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translate(0, -50%);
    cursor: pointer;
    color: var(--text-secondary-strong);
    -webkit-app-region: no-drag;
    font-size: var(--font-size-lg);
    line-height: 1;
}

.search-input-container button:hover {
    background-color: var(--background-item-hover);
}

.search-input-container button:active {
    background-color: var(--background-item-active);
}

</style>
