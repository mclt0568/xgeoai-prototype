<template>
  <div class="toolbox-section" :class="{first}">
    <div class="title">{{ props.title }}</div>
    <slot/>
  </div>
</template>

<script lang="ts" setup>

const props = withDefaults(defineProps<{
  title?: string,
  first?: boolean,
}>(), {
  title: "Section",
  first: false,
});

</script>

<style scoped lang="scss">
@use "@/assets/scss/variables" as *;

.toolbox-section {
  padding: 10px 0px;
  width: 100%;
  border-top: 1px solid $border;

  &.first { border: none; }
}

.title {
  font-size: 14px;
  font-weight: 500;
  user-select: none;
  padding: 0 16px;
}
</style>