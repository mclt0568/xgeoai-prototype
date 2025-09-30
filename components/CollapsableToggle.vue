<template>
  <div @click="toggleExpanded" class="collapsable-toggle">
    <icon class="icon" v-show="expanded" icon="carbon:chevron-down" />
    <icon class="icon" v-show="!expanded" icon="carbon:chevron-right" />
    {{ label }}
  </div>
</template>

<script lang="ts" setup>
import { Icon as icon } from '@iconify/vue';

const props = withDefaults(defineProps<{
  label?: string,
  expanded?: boolean
}>(), {
  label: "",
  expanded: false,
});

const value = ref(props.expanded);
watch(() => props.expanded, (newVal) => value.value = newVal);

function toggleExpanded(){
  const newVal = !value.value;
  value.value = newVal;
  emit("update:expanded", value.value);
}

const emit = defineEmits(['update:expanded']);
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

.collapsable-toggle {
  user-select: none;
  font-size: 14px;
  color: $foreground-unfocused;
  display: flex;
  align-items: center;
  gap: 10px;
  // font-weight: 500;
}

.icon {
  color: $foreground-label;
}
</style>