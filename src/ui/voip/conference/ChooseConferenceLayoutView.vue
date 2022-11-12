<template>
    <div class="choose-layout-container">
        <p class="title">会议布局</p>
        <div class="category-container">
            <div class="category">
                <p class="category-name">宫格视图</p>
                <div class="grid-layout" @click="setCurrentLayout(0)"
                     v-bind:class="{active:currentLayout === 0}"
                >
                    <div class="grid-container">
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                        <div class="item"></div>
                    </div>
                    <p class="desc">一屏9等分</p>
                </div>
            </div>
            <div class="category">
                <p class="category-name">演讲者视图</p>
                <div class="focus-layout" @click="setCurrentLayout(1)"
                     v-bind:class="{active:currentLayout === 1}">
                    <div class="item-container">
                        <div class="item"></div>
                        <div class="right-item-container">
                            <div class="item"></div>
                            <div class="item"></div>
                            <div class="item"></div>
                            <div class="item"></div>
                        </div>
                    </div>
                    <p class="desc">右侧成员列表</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "ChooseConferenceLayoutView",
    props: {
        currentLayout: {
            type: Number,
            required: true,
        }
    },
    methods: {
        setCurrentLayout(layout) {
            this.$parent.setCurrentLayout(layout);
        }
    }
}
</script>

<style scoped>
.choose-layout-container {
    width: 300px;
    height: 145px;
    padding: 10px;
    background: white;
    border-radius: 2px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.choose-layout-container .title {
    font-size: 14px;
    padding-bottom: 5px;
}

.category-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.category {
    width: 50%;
}

.category:not(:first-of-type) {
    margin-left: 10px;
}

.category .category-name {
    font-size: 14px;
    padding: 5px;
    background: #F6F8FB;
    border-radius: 5px;
    margin-bottom: 10px;
}

.category-name {
    display: none;
}


.grid-layout {
    border: 1px solid #D9DBDC;
    border-radius: 5px;
    padding: 10px;
}

.grid-layout.active {
    border-color: #4168e0;
}

.grid-layout:hover {
    border-color: #4168e0;
}

.grid-layout .desc {
    font-size: 13px;
    text-align: center;
    padding: 5px 0 0 0;
}

.grid-container {
    width: 100%;
    height: 55px;
    display: grid;
    grid-template-columns: auto auto auto;
    gap: 5px;
}

.grid-container .item {
    width: 30px;
    height: 15px;
    background: #DCE9FD;
}

.focus-layout {
    border: 1px solid #D9DBDC;
    border-radius: 5px;
    padding: 10px;
}

.focus-layout.active {
    border-color: #4168e0;
}

.focus-layout:hover {
    border-color: #4168e0;
}

.focus-layout .desc {
    font-size: 13px;
    text-align: center;
    padding: 5px 0 0 0;
}

.focus-layout .item-container {
    width: 120px;
    height: 55px;
    display: flex;
}

.focus-layout .item-container .item {
    width: 75%;
    height: 100%;
    background: #DCE9FD;
}

.focus-layout .right-item-container {
    flex: 1;
    padding-left: 5px;
    display: inline-flex;
    flex-direction: column;
    gap: 5px;
}

.focus-layout .right-item-container .item {
}
</style>
