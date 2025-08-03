<template>
  <div class="model-configuration">
    <div @click="toggleModel" class="model-toggle">
      <toggle :toggled="configuration.contribution !== 0" />
      {{ configuration.name }}
    </div>
    <div class="model-options" v-show="configuration.contribution !== 0">
      <range-input :min="0.01" :max="0.99" @update:value="throttledUpdate" :value="configuration.contribution" label="Contribution" />
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
  if (props.configuration.contribution !== 0){
    datasetStore.setContribution(props.configuration.fieldName, 0);
  }
  else {
    datasetStore.setContribution(props.configuration.fieldName, 0.2);
  }
  datasetStore.runModel();
}

function updateModel(value: number) {
  datasetStore.setContribution(props.configuration.fieldName, value);
  datasetStore.runModel();
}
const throttledUpdate = throttle(updateModel, 80);

// when button press
const emit = defineEmits<{
  (e: 'inspect', scoreKey: ScoreFieldKeys): void
}>();

function onInspectionClick() {
  emit("inspect", props.configuration.fieldName);
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