<template>
  <section class="user-detail-container">
    <div class="header">
      <div>
        <h2>imndx名字</h2>
        <p>hello world. 你好，野火</p>
      </div>
      <div>
        <img class="avatar" src="@/assets/images/user-fallback.png">
      </div>
    </div>
    <div class="content">
      <ul>
        <li>
          <label>备注</label>
          <div class="alias">
            <input type="text" placeholder="备注名"/>
          </div>
        </li>
        <li>
          <label>地区</label>
          <div>北京</div>
        </li>
        <li>
          <label>标签</label>
          <div>测试用户</div>
        </li>
      </ul>
    </div>
    <div class="footer">
      <button>发消息</button>
    </div>
  </section>
</template>

<script>
export default {
  name: "UserDetailView"
}
</script>

<style lang="css" scoped>

.user-detail-container {
  margin-left: 90px;
  margin-right: 90px;
}

.header {
  margin-top: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e6e6;
}

.header .avatar {
  width: 80px;
  height: 80px;
  border-radius: 2px;
}

.header h2 {
  font-size: 20px;
  font-style: normal;
  font-weight: normal;
  margin-bottom: 5px;
}

.content {
  width: 100%;
  text-align: left;
}

.content ul {
  list-style: none;
  margin: 20px 0;
}

.content ul li {
  margin-left: 0;
  height: 40px;
  line-height: 40px;
  display: flex;
}

.content ul li label {
  margin-right: 20px;
}

.content ul li .alias > input {
  width: 100%;
  border: none;
  height: 20px;
}

.content ul li > div {
  display: inline-block;
  flex: 1;
}

.footer {
  display: flex;
  justify-content: center;
}

.footer button {
  margin-top: 30px;
  color: white;
  padding: 10px 40px;
  background-color: #20fb64;
  border-radius: 5px;
  border: 1px solid transparent;
}

</style>
