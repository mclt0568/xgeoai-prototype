<template>
  <div class="main-toolbox">
    <toolbox-section first title="Model Configuration">
      <model-configuration @inspect="onInspectionClick" v-for="configuration of configurations" v-bind:key="configuration.field" :configuration="configuration"/>
    </toolbox-section>
    <toolbox-section title="Result Distribution">
      <frequency-chart @filter="onFilter" @cancel-filter="onFilterCancel" :values="resultValues"/>
    </toolbox-section>
    <!-- <toolbox-section title="Pinned Location"></toolbox-section> -->
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  configurations: Record<ScoreFieldKeys, Configuration>,
  result: ModelData[],
}>(),{});

const resultValues = computed(() => props.result.map(({value})=>value));


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