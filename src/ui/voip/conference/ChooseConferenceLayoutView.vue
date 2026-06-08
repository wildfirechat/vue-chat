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
    padding: 8px;
    background: var(--background-primary);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-main);
}

.choose-layout-container .title {
    font-size: var(--font-size-base);
    padding-bottom: 4px;
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
    margin-left: 8px;
}

.category .category-name {
    font-size: var(--font-size-base);
    padding: 4px;
    background: var(--background-secondary);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
}

.category-name {
    display: none;
}


.grid-layout {
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: 8px;
}

.grid-layout.active {
    border-color: var(--accent-color);
}

.grid-layout:hover {
    border-color: var(--accent-color);
}

.grid-layout .desc {
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 4px 0 0 0;
}

.grid-container {
    width: 100%;
    height: 55px;
    display: grid;
    grid-template-columns: auto auto auto;
    gap: 4px;
}

.grid-container .item {
    width: 30px;
    height: 15px;
    background: var(--accent-color-subtle);
}

.focus-layout {
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: 8px;
}

.focus-layout.active {
    border-color: var(--accent-color);
}

.focus-layout:hover {
    border-color: var(--accent-color);
}

.focus-layout .desc {
    font-size: var(--font-size-sm);
    text-align: center;
    padding: 4px 0 0 0;
}

.focus-layout .item-container {
    width: 120px;
    height: 55px;
    display: flex;
}

.focus-layout .item-container .item {
    width: 75%;
    height: 100%;
    background: var(--accent-color-subtle);
}

.focus-layout .right-item-container {
    flex: 1;
    padding-left: 4px;
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
}

.focus-layout .right-item-container .item {
}
</style>
