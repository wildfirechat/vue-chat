<template>
    <div ref="contactItem" class="contact-item">
        <div v-if="showCategoryLabel && source.type === 'category'" class="label"
             :style="paddingStyle">
            <p>{{ source.category.toUpperCase() }}</p>
        </div>
        <div v-else class="content"
             :name="'user-'+source.uid"
             :style="paddingStyle"
             v-bind:class="{disabled: isUserUncheckable(source)}"
             @click.stop="clickUserItem(source)">
            <input class="checkbox"
                   v-bind:value="source"
                   :disabled="isUserUncheckable(source)"
                   type="checkbox"
                   :checked="isUserChecked(source)">
            <img class="avatar" :src="source.portrait" alt="">
            <span
                class="single-line"> {{
                    source._displayName || (source.groupAlias ? source.groupAlias : (source.friendAlias ? source.friendAlias : (source.displayName ? source.displayName : '用户')))
                }}</span>
        </div>
    </div>
</template>

<script>
import store from "../../../store";

export default {
    name: "CheckableUserItemView",
    props: {
        source: {
            type: Object,
            required: true,
        },
        users: {
            type: Array,
            required: true,
        },
        initialCheckedUsers: {
            type: Array,
            required: false,
            default: null,
        },
        uncheckableUsers: {
            type: Array,
            required: false,
            default: null,
        },
        showCategoryLabel: {
            type: Boolean,
            required: false,
            default: true,
        },
        enableCategoryLabelSticky: {
            type: Boolean,
            required: false,
            default: false,
        },
        paddingLeft: {
            type: String,
            required: false,
            default: '5px'
        }
    },
    data() {
        return {
            sharedPickState: store.state.pick,
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        clickUserItem(user) {
            if (this.isUserUncheckable(user)) {
                return;
            }
            store.pickOrUnpickUser(user)
        },

        isUserInitialChecked(user) {
            return this.initialCheckedUsers && this.initialCheckedUsers.findIndex(u => u.uid === user.uid) >= 0
        },

        isUserUncheckable(user) {
            return this.uncheckableUsers && this.uncheckableUsers.findIndex(u => u.uid === user.uid) >= 0;
        },

        isUserChecked(user) {
            return store.isUserPicked(user);
        }
    },

    mounted() {
        if (this.initialCheckedUsers) {
            // why?
            // 1. checkbox :checked 和 v-model冲突，以v-model为准
            // 2. v-model 的实现里，应当是采用引用比较，而不是值比较
            let oriCUs = this.users.filter(u => this.initialCheckedUsers.findIndex((iu => iu.uid === u.uid)) > -1);
            oriCUs.forEach(u => store.pickOrUnpickUser(u))
        }
    },

    computed: {
        paddingStyle() {
            return {
                paddingLeft: this.paddingLeft
            }
        },
    },
}
</script>

<style lang="css" scoped>

.contact-item {
    --user-item-padding-left: 30px;
}

ul {
    list-style: none;
    width: 100%;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.checkbox {
    margin-right: 10px;
}

.contact-item {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    align-items: flex-start;
}

.contact-item .label {
    width: 100%;
    background-color: #fafafa;
}

.contact-item .label p {
    padding: 5px 5px 5px 0;
    border-bottom: 1px solid #e0e0e0;
}

.contact-item .label.sticky {
    position: sticky;
    top: 0;
}

.contact-item .content {
    padding: 5px 5px 5px 0;
    display: flex;
    width: 100%;
    align-items: center;
}

.contact-item .content span {
    margin-left: 10px;
}

.contact-item .content.active {
    background-color: #d6d6d6;
}

.contact-item .content:active {
    background-color: #d6d6d6;
}

.disabled {
    pointer-events: none;
}
</style>
