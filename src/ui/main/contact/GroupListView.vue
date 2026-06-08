<template>
    <section>
        <ul>
            <li v-for="(group, index) in sharedContactState.favGroupList" :key="index" @click="showGroup(group)">
                <div class="group-item"
                     v-bind:class="{active: sharedContactState.currentGroup && sharedContactState.currentGroup.target === group.target}"
                     @contextmenu.prevent="showGroupContextMenu($event, group)">
                    <img class="avatar" :src="group.portrait">
                    <div class="group-item-info">
                        <p class="single-line">{{ group.remark ? group.remark : group.name }}</p>
                    </div>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";

export default {
    name: "GroupListView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        showGroup(group) {
            store.setCurrentGroup(group)
        },
        showGroupContextMenu(event, group) {
            // this.$eventBus.$emit('showContactContextMenu', [event, userInfo]);
        }
    },
}
</script>

<style scoped>
.avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--default-portrait-border-radius);
    object-fit: cover;
    flex-shrink: 0;
}

.group-item {
    padding: 8px 4px 8px 30px;
    display: flex;
    font-size: var(--font-size-sm);
    align-items: center;
    transition: background var(--duration-fast);
}

.group-item:hover{
    background-color: var(--background-item-hover);
}

.group-item.active {
    background-color: var(--background-item-placeholder);
}

.group-item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-left: 8px;
}

.group-item span {
    margin-left: 8px;
}

</style>
