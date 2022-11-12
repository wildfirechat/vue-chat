<template>
    <div class="conference-simple-info-container">
        <p class="title">xxx的会议</p>
        <div class="info-item">
            <p class="name">会议号</p>
            <p class="value">{{ session.callId }}</p>
            <i class="icon-ion-ios-copy"></i>
        </div>
        <div class="info-item">
            <p class="name">主持人</p>
            <p class="value">{{ session.callId }}</p>
        </div>
        <div class="info-item">
            <p class="name">会议链接</p>
            <p class="value">{{ session.callId }}</p>
            <i class="icon-ion-ios-copy"></i>
        </div>
    </div>
</template>

<script>
export default {
    name: "ConferenceSimpleInfoView",
    props: {
        session: {
            type: Object,
            required: true
        }
    }
}
</script>

<style scoped>

.conference-simple-info-container {
    background: white;
    padding: 5px 10px;
    width: 300px;
    border-radius: 2px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.title {
    padding-bottom: 10px;
}

.info-item {
    display: flex;
    font-size: 14px;
}

.info-item .name {
    width: 80px;
    color: #2d3033;
}

.info-item .value {
    flex: 1 1 auto;
    color: gray;
}

</style>
