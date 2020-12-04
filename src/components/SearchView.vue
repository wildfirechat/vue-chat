<template>
  <section class="search-container">
    <div>
      Search View & result {{ query }}
    </div>

  </section>
</template>

<script>
export default {
  name: "SearchView",
  props: [
    "query"
  ],
  watch: {
    // "query":function (val, oldVal){
    //   console.log('searchView query changed:', val, oldVal)
    // }
    // or
    query() {
      console.log('searchView query changed:', this.query)
    }
  },
  created() {
    console.log('search created', this.query)
  },
  updated() {
    // console.log('searchView update', this.query);
  }
}
</script>

<style lang="css" scoped>

.search-container {
  display: none;
}

.search-container.active {
  display: block;
  background-color: #42b983ac;
}

</style>
