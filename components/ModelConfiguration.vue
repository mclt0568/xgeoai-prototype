<template>
  <div class="model-configuration" :class="{enabled: configuration.enabled}">
    <div @click="toggleModel" class="model-toggle">
      <toggle :toggled="configuration.enabled" />
      {{ fieldToName[configuration.field] }}
    </div>
    <div class="model-options" v-show="configuration.enabled">
      <range-input :min="0.01" :max="0.99" @update:value="updateModel" :value="configuration.scale" label="Contribution" />
      <!-- <menu-button @click="onInspectionClick" :icon="configuration.biased ? 'carbon:warning-alt-filled' : undefined" :warning="configuration.biased" label="Inspect and compare data..."/> -->
      <collapsable-toggle v-model:expanded="expanded" label="Field Distribution"/>
      <!-- <chart v-if="expanded" disable-filter :bin-size="1" :values="datasetStore.individualOutput[configuration.field].map(({value}) => value)" /> -->
      <div v-if="expanded" class="chart-container" style="height: 300px">
        <chart @filter="onFilter" @cancel-filter="onFilterCancel" :data="datasetStore.individualOutput[configuration.field].map(({value}) => value)" :selected-data="selectedData" :domain="[0, 100]" :thresholds="50" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { throttle, update } from 'lodash';

const props = withDefaults(defineProps<{
  configuration: Configuration
}>(), {})


const expanded = ref(false);

const datasetStore = useDatasetStore();
const selectedData = computed(() => {
  if (datasetStore.currentlyFilteredOn === undefined) {
    return null;
  }
  
  if (datasetStore.currentlyFilteredOn === props.configuration.field) {
    return null;
  }

  return datasetStore.individualFiltered[props.configuration.field].map(({value}) => value);
})

function onFilter(x0: number, x1: number) {
  datasetStore.filterFromRange(props.configuration.field, x0, x1);
}
function onFilterCancel() {
  datasetStore.cancelFilter();
}

function toggleModel() {
  const enabled = props.configuration.enabled;
  datasetStore.setContribution(props.configuration.field, enabled ? 0 : 0.2);
  props.configuration.enabled = !enabled;
}

function updateModel(value: number) {
  datasetStore.setContribution(props.configuration.field, value, true);
  datasetStore.runModel();
}
// const throttledUpdate = throttle(updateModel, 20);

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

.model-configuration {
  &.enabled {
    padding-bottom: 30px;
  }
}

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
  gap: 15px
}
</style>