<template>
  <section class="multi-selection-action-container">
    <ul>
      <li>
        <div class="action">
          <div class="icon">
            <i class="icon-ion-forward"></i>
          </div>
          <p>逐条转发</p>
        </div>
      </li>
      <li>
        <div class="action">
          <div class="icon">
            <i class="icon-ion-forward"></i>
          </div>
          <p>合并转发</p>
        </div>
      </li>
      <li>
        <div class="action">
          <div class="icon">
            <i class="icon-ion-android-favorite"></i>
          </div>
          <p>收藏</p>
        </div>
      </li>
      <li>
        <div class="action">
          <div class="icon">
            <i class="icon-ion-android-remove"></i>
          </div>
          <p>删除</p>
        </div>
      </li>
      <li>
        <div class="action">
          <i class="icon-ion-close"></i>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  name: "MessageMultiSelectionActionView"
}
</script>

<style lang="css" scoped>

.multi-selection-action-container {
  width: 100%;
  height: 203px;
  min-height: 204px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid #e2e2e2;
}

ul {
  list-style: none;
}

ul li {
  display: inline-block;
}

.action {
  font-size: 13px;
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.action .icon {
  width: 60px;
  height: 60px;
  background-color: white;
  border-radius: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action .icon:active {
  background-color: red;

}

.action p {
  padding-top: 10px;
}


</style>
