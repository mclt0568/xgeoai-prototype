<template>
  <div class="model-configuration">
    <div @click="toggleModel" class="model-toggle">
      <toggle :toggled="modelOn" />
      {{ name }}
    </div>
    <div class="model-options" v-show="modelOn">
      <range-input :value="0.2" label="Contribution" />
      <menu-button icon="carbon:warning-alt-filled" label="Inspect and adjust data..."/>
    </div>
  </div>
</template>

<script lang="ts" setup>

const props = withDefaults(defineProps<{
  name?: string,
  columnName: string
}>(), {
  name: "Model Name",
})

const modelOn = ref(false);
function toggleModel() {
  modelOn.value = !modelOn.value;
}

</script>

<style lang="scss">
@use "@/assets/scss/variables" as *;

.model-toggle{
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: $foreground-unfocused;
  user-select: none;
  cursor: pointer;
}

.model-options {
  padding: 5px 16px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px
}
</style>