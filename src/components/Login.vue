<template>
  <div>
    <qrcode-vue :value="value" :size="size" level="H"></qrcode-vue>
  </div>
</template>
<script>
import QrcodeVue from 'qrcode.vue'

export default {
  data() {
    console.log('xojo')
    return {
      value: 'https://example.com',
      size: 300,
    }
  },
  created() {
  },
  methods: {},
  components: {
    QrcodeVue,
  },
}
</script>
