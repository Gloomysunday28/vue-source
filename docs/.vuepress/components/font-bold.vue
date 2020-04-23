<template>
  <font class="m-bold__container" :style="{ color }">
    <b><slot></slot></b>
  </font>
</template>

<script>
export default {
  name: 'fontBold',
  props: {
    color: {
      type: String
    }
  }
}
</script>

<style scoped>
  .m-bold__container {
    color: red;
  }
</style>