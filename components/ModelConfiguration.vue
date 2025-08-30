<template>
  <div class="model-configuration">
    <div @click="toggleModel" class="model-toggle">
      <toggle :toggled="configuration.enabled" />
      {{ fieldToName[configuration.field] }}
    </div>
    <div class="model-options" v-show="configuration.enabled">
      <range-input :min="0.01" :max="0.99" @update:value="throttledUpdate" :value="configuration.scale" label="Contribution" />
      <menu-button @click="onInspectionClick" :icon="configuration.biased ? 'carbon:warning-alt-filled' : undefined" :warning="configuration.biased" label="Inspect and adjust data..."/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { throttle } from 'lodash';


const props = withDefaults(defineProps<{
  configuration: Configuration
}>(), {})

const datasetStore = useDatasetStore();
function toggleModel() {
  const enabled = props.configuration.enabled;
  datasetStore.setContribution(props.configuration.field, enabled ? 0 : 0.2);
  props.configuration.enabled = !enabled;
}

function updateModel(value: number) {
  datasetStore.setContribution(props.configuration.field, value, true);
  datasetStore.runModel();
}
const throttledUpdate = throttle(updateModel, 20);

// when button press
const emit = defineEmits<{
  (e: 'inspect', scoreKey: ScoreFieldKeys): void
}>();

function onInspectionClick() {
  emit("inspect", props.configuration.field);
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