<template>
    <div class="search-input-container">
        <input id="searchInput"
               ref="input"
               autocomplete="off"
               v-on:focus="onFocus(true)"
               v-model="sharedSearchState.query"
               @keydown.esc="cancel"
               type="text" :placeholder="$t('common.search')"/>
        <i class="icon-ion-ios-search"></i>
        <button v-if="showAddButton" @click="showCreateConversationModal">+</button>
    </div>
</template>

<script>
import store from "@/store";
import Config from "../../../config";

export default {
    name: "SearchView",
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
        };
    },
    methods: {
        onFocus(focused) {
            store.toggleSearchView(focused);
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
                users,
                successCB,
                showOrganization: true,
            });
        },
        cancel() {
            store.toggleSearchView(false);
            this.$refs['input'].blur();
        }
    }
}
</script>

<style lang="css" scoped>
.search-input-container {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fafafa;
    -webkit-app-region: drag;
    position: relative;
}

.search-input-container input {
    height: 25px;
    margin-left: 10px;
    margin-right: 10px;
    padding: 0 10px 0 20px;
    text-align: left;
    /* flex: 1; */
    /* 兼容Firefox 52 */
    width: 209px;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    background-color: #eeeeee;
}

.search-input-container input:active {
    border: 1px solid #4168e0;
}

.search-input-container input:focus {
    border: 1px solid #4168e0;
}

.search-input-container i {
    position: absolute;
    left: 15px;
    /* 兼容Firefox 52 */
    top: 50%;
    transform: translate(0, -50%);
}

.search-input-container button {
    width: 30px;
    height: 25px;
    margin-right: 10px;
    background-color: #fafafa;
    border-radius: 3px;
    border: 1px solid #e5e5e5;
}

.search-input-container button:active {
    background-color: #e5e5e5;
}

</style>
