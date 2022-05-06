<template>
    <div class="list-container">
        <ul>
            <li v-for="(item, index) in list"
                :key="index"
                @click="onItemClick(index, item)"
                class="item"
            >
                {{ item }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: "ListView",
    props: {
        list: {
            type: Array,
            required: true,
        },
    },
    methods: {
        onItemClick(index, data) {
            this.$modal.hide('list-item-modal', {position: index, data: data})
        },
    }
}
</script>

<style scoped>

.list-container {
    width: 100%;
    height: 100%;
    overflow: auto;
}

.list-container ul {
    height: 100%;
}

.item {
    height: 50px;
    display: flex;
    padding-left: 20px;
    padding-right: 20px;
    vertical-align: center;
    align-items: center;
    border-bottom: 1px solid #f1f1f1;
}


.item:active {
    background-color: #d6d6d6;
}
</style>
