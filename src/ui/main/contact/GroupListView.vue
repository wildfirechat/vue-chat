<template>
    <section>
        <ul>
            <li v-for="(group, index) in sharedContactState.favGroupList" :key="index" @click="showGroup(group)">
                <div class="group-item"
                     v-bind:class="{active: sharedContactState.currentGroup && sharedContactState.currentGroup.target === group.target}"
                     @contextmenu.prevent="showGroupContextMenu($event, group)">
                    <img class="avatar" :src="group.portrait">
                    <div style="padding-left: 10px">
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
    border-radius: 3px;
    object-fit: cover;
}

.group-item {
    padding: 10px 5px 10px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.group-item:hover{
    background-color: #EAEAEA;
}

.group-item.active {
    background-color: #d6d6d6;
}

.group-item span {
    margin-left: 10px;
}

</style>
