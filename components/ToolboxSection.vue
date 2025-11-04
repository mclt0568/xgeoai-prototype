<template>
  <div class="toolbox-section-container">
    <div class="title">{{ props.title }}</div>
    <div class="toolbox-section" :class="{first}">
      <slot/>
    </div>
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
  display: flex;
  // flex

  &.first { border: none; }
}

.title {
  font-size: 14px;
  font-weight: 500;
  user-select: none;
  padding: 5px 16px;
}

.toolbox-section-container {
  border-right: 1px solid $border;
}
</style>