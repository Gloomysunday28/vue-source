<template>
  <div class="m-wx">
    <img class="m-wx__img" src="./assets/gzh.jpg" alt="前端马丁">
    关注我, 不迷路
  </div>
</template>

<script>
export default {
  name: 'wx'
};
</script>

<style scoped>
.m-wx {
  position: fixed;
  right: 20px;
  top: 50px;
  width: fit-content;
  height: fit-content;
  border-radius: 8px;
  box-shadow: 0 0 10px #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  overflow: hidden;
  font-size: 14px;
  color: red;
  padding-bottom: 10px;
}
.m-wx__img {
  width: 130px;
  height: 130px;
  margin-bottom: 10px;
}
</style>