<template>
    <section class="receipt-detail-container">
        <p class="title">{{ $t('message.receipt_detail') }}</p>
        <div class="receipt-container">
            <div class="receipt-item">
                <p class="label">{{ readTitle }}</p>
                <div class="users">
                    <UserListVue :users="readUsers"
                                 :show-category-label="false"
                                 :padding-left="'20px'"/>
                </div>
            </div>
            <div class="receipt-item">
                <p class="label">{{ unreadTitle }}</p>
                <div class="users">
                    <UserListVue :users="unreadUsers"
                                 :show-category-label="false"
                                 :click-user-item-func="()=>{}"
                    />
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import UserListVue from "../../user/UserListVue.vue";

export default {
    name: "MessageReceiptDetailView",
    components: {UserListVue},
    props: {
        readUsers: {
            type: Array,
            required: true,
            default: null,
        },
        unreadUsers: {
            type: Array,
            required: true,
            default: null,
        }
    },
    methods: {
        readUsersDesc() {
            let desc = '';
            if (this.readUsers) {
                this.readUsers.forEach(u => {
                    desc += u._displayName + '、';
                });
                desc = desc.substring(0, desc.length - 1)
            }
            return desc ? desc : this.$t('common.none');
        },
        unrreadUsersDesc() {
            let desc = '';
            if (this.unreadUsers) {
                this.unreadUsers.forEach(u => {
                    desc += u._displayName + '、';
                });
                desc = desc.substring(0, desc.length - 1)
            }
            return desc ? desc : this.$t('common.none');
        },
    },

    computed: {
        unreadTitle() {
            if (this.unreadUsers.length > 0) {
                return `未读(${this.unreadUsers.length})`
            } else {
                return '未读'
            }
        },
        readTitle() {
            if (this.readUsers.length > 0) {
                return `已读(${this.readUsers.length})`
            } else {
                return '已读'
            }
        },
    }
}

</script>

<style lang="css" scoped>
.receipt-detail-container {
    height: 100%;
    width: 100%;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.receipt-detail-container .title {
    align-self: center;
    font-weight: 400;
    font-size: 18px;
    padding: 5px 0;
}

.receipt-container {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding-top: 10px;
}

.receipt-item {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 250px;
    width: 100%;
    overflow: hidden;
    margin-bottom: 10px;
}

.receipt-item .label {
    width: 100%;
    text-align: center;
    font-size: 14px;
}

.receipt-item .users {
    flex: 1;
    overflow-y: scroll;
}


.receipt-item:last-of-type {
//border-left: 1px solid lightgrey;
}

</style>
