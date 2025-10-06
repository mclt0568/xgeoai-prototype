<template>
  <div class="main-toolbox">
    <toolbox-section first title="Model Configuration">
      <model-configuration @inspect="onInspectionClick" v-for="configuration of configurations" v-bind:key="configuration.field" :configuration="configuration"/>
    </toolbox-section>
    <toolbox-section title="Result Distribution">
      <!-- <frequency-chart @filter="onFilter" @cancel-filter="onFilterCancel" :values="resultValues"/> -->
      <div class="chart-container" style="height: 300px">
        <chart @filter="onFilter" @cancel-filter="onFilterCancel" :selected-data="selectedData" :data="resultValues" :domain="[0, 100]" :thresholds="50" />
      </div>
    </toolbox-section>
    <!-- <div class="chart-container" style="height: 300px">
      <chart :data="[0.1, 0.1, 0.2, 0.4, 0.5, 0.92]" :domain="[0, 1]" :thresholds="50" v-model:selected-data="x"/>
    </div> -->
  </div>
</template>

<script lang="ts" setup>

const props = withDefaults(defineProps<{
  configurations: Record<ScoreFieldKeys, Configuration>,
  result: ModelData[],
}>(),{});

const resultValues = computed(() => props.result.map(({value})=>value));

const datasetStore = useDatasetStore();
const selectedData = computed(() => {
  if (datasetStore.currentlyFilteredOn === undefined) {
    return null;
  }

  if (datasetStore.currentlyFilteredOn === MODEL_OUTPUT) {
    return null;
  }


  return datasetStore.filteredResult.map(({value}) => value);
});

// when filter by frequency chart
function onFilter(x0: number, x1: number) {
  emit("filter", x0, x1);
}
function onFilterCancel() {
  emit("cancelFilter");
}

// when inspection
const emit = defineEmits<{
  (e: 'inspect', scoreKey: ScoreFieldKeys): void,
  (e: "filter", x0: number, x1: number): void,
  (e: "cancelFilter"): void,
}>();

function onInspectionClick(scoreKey: ScoreFieldKeys) {
  emit("inspect", scoreKey);
}
</script>

<style>
</style>