<template>
  <button class="menu-button" :class="{warning}"><Icon v-if="icon" :icon="icon" />{{ label }}</button>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";

const props = withDefaults(defineProps<{
  label?: string,
  icon?: string | undefined,
  warning?: boolean
}>(), {
  label: "",
  icon: undefined,
  warning: false,
});

</script>

<style scoped lang="scss">
@use "~/assets/scss/variables" as *;

.menu-button {
  width: 100%;
  background: $background-secondary;
  border: 1px solid $background-secondary;
  border-radius: 5px;
  padding: 4px 15px;
  font-size: 14px;
  color: $foreground-unfocused;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    // background: $background-interaction;
    border-color: $border;
  }

  &:active {
    background: $background-interaction;
  }
}

.menu-button.warning {
  background: $warning-background;
  color: $warning-foreground;

  &:hover {
    border-color: $warning-border;
  }

  &:active {
    background: $warning-background-interaction;
  }
}

</style>