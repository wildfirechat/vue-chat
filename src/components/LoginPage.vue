<template>
  <div>
    <h1>Login</h1>
    <button @click="login">click to login</button>
  </div>
</template>

<script>
export default {
  methods: {
    login() {
      console.log("login");
      // TODO go to home page
      this.$router.push({ path: "/home" });
    },
  },
};
</script>
