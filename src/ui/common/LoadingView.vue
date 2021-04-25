<template>
    <div class="loading">
        <div class="line">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="circlebg"></div>
    </div>

</template>

<script>
export default {
    name: "LoadingView"
}
</script>

<style lang="css" scoped>
.loading {
    width: 30px;
    height: 30px;
    margin: 0 auto;
}

.loading {
    /*background: #535353;*/
}

/** 加载动画的静态样式 **/
.loading {
    position: relative;
}

.loading .line div {
    position: absolute;
    left: 13px;
    top: 0;
    width: 3px;
    height: 30px;
}

.loading .line div:before, .loading .line div:after {
    content: '';
    display: block;
    height: 50%;
    background: #848484; /*jow loading的颜色*/
    border-radius: 5px;
}

.loading .line div:nth-child(2) {
    -webkit-transform: rotate(30deg);
}

.loading .line div:nth-child(3) {
    -webkit-transform: rotate(60deg);
}

.loading .line div:nth-child(4) {
    -webkit-transform: rotate(90deg);
}

.loading .line div:nth-child(5) {
    -webkit-transform: rotate(120deg);
}

.loading .line div:nth-child(6) {
    -webkit-transform: rotate(150deg);
}

.loading .circlebg {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    width: 15px;
    height: 15px;
    background: #f3f3f3;
    border-radius: 15px;
}

/** 加载动画 **/
@-webkit-keyframes load {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

.loading .line div:nth-child(1):before {
    -webkit-animation: load 1.2s linear 0s infinite;
}

.loading .line div:nth-child(2):before {
    -webkit-animation: load 1.2s linear 0.1s infinite;
}

.loading .line div:nth-child(3):before {
    -webkit-animation: load 1.2s linear 0.2s infinite;
}

.loading .line div:nth-child(4):before {
    -webkit-animation: load 1.2s linear 0.3s infinite;
}

.loading .line div:nth-child(5):before {
    -webkit-animation: load 1.2s linear 0.4s infinite;
}

.loading .line div:nth-child(6):before {
    -webkit-animation: load 1.2s linear 0.5s infinite;
}

.loading .line div:nth-child(1):after {
    -webkit-animation: load 1.2s linear 0.6s infinite;
}

.loading .line div:nth-child(2):after {
    -webkit-animation: load 1.2s linear 0.7s infinite;
}

.loading .line div:nth-child(3):after {
    -webkit-animation: load 1.2s linear 0.8s infinite;
}

.loading .line div:nth-child(4):after {
    -webkit-animation: load 1.2s linear 0.9s infinite;
}

.loading .line div:nth-child(5):after {
    -webkit-animation: load 1.2s linear 1s infinite;
}

.loading .line div:nth-child(6):after {
    -webkit-animation: load 1.2s linear 1.1s infinite;
}

</style>
