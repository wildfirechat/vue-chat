<template>
    <section>
        <ul>
            <li v-for="(group, index) in sharedContactState.favGroupList" :key="index" @click="showGroup(group)">
                <div class="group-item"
                     v-bind:class="{active: sharedContactState.currentGroup && sharedContactState.currentGroup.target === group.target}">
                    <img class="avatar" :src="group.portrait">
                    <span class="single-line">{{ group.name }}</span>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "@/store";

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
        }
    },
}
</script>

<style scoped>
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.group-item {
    height: 50px;
    padding: 5px 10px 5px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.group-item.active {
    background-color: #d6d6d6;
}

.group-item span {
    margin-left: 10px;
}

</style>
