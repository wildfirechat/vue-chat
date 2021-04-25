<template>
    <section class="receipt-detail-container">
        <h1>{{ $t('message.receipt_detail') }}</h1>
        <h2>{{ $t('message.receipt_read_users') }}</h2>
        <p>{{ readUsersDesc() }}</p>
        <h2>{{ $t('message.receipt_received_users') }}</h2>
        <p>{{ receivedUsersDesc() }}</p>
        <h2>{{ $t('message.receipt_unreceived_users') }}</h2>
        <p>{{ unreceiveUsersDesc() }}</p>
    </section>
</template>

<script>
export default {
    name: "MessageReceiptDetailView",
    props: {
        readUsers: {
            type: Array,
            required: true,
            default: null,
        },
        receivedUsers: {
            type: Array,
            required: true,
            default: null,
        },
        unreceiveUsers: {
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
        receivedUsersDesc() {
            let desc = '';
            if (this.receivedUsers) {
                this.receivedUsers.forEach(u => {
                    desc += u._displayName + '、';
                });
                desc = desc.substring(0, desc.length - 1)
            }
            return desc ? desc : this.$t('common.none');
        },
        unreceiveUsersDesc() {
            let desc = '';
            if (this.unreceiveUsers) {
                this.unreceiveUsers.forEach(u => {
                    desc += u._displayName + '、';
                });
                desc = desc.substring(0, desc.length - 1)
            }
            return desc ? desc : this.$t('common.none');
        },
    }
}

</script>

<style lang="css" scoped>
.receipt-detail-container {
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.receipt-detail-container h1 {
    align-self: center;
}

</style>
