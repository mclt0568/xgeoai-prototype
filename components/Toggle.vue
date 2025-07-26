<template>
  <svg class="toggle" :class="{toggled}" width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect class="background" x="32" y="16" width="32" height="16" rx="8" transform="rotate(180 32 16)"/>
    <rect class="orb" width="10" height="10" rx="5" fill="white"/>
  </svg>
</template>

<script lang="ts" setup>

const props = withDefaults(defineProps<{
  toggled?: boolean,
}>(), {
  toggled: false,
})

</script>

<style scoped lang="scss">
@use "~/assets/scss/variables" as *;

.toggle {
  .background {
    fill: $background-subtle;
    transition: 0.1s ease;
  }
  .orb {
    transition: 0.1s ease;
    x: 3px;
    y: 3px;
  }
  &.toggled {
    .background {
      fill: $accent;
    }
    .orb {
      x: 19px;
      y: 3px;
    }
  }
}
</style>