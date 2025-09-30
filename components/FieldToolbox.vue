<template>
  <toolbox-section title="Data Distribution">
      <frequency-chart @filter="" :bin-size="1" :values="datasetStore.individualOutput[configuration.field].map(({value}) => value)" />
  </toolbox-section>
  <toolbox-section title="Compare With Result">
    
  </toolbox-section>
</template>

<script lang="ts" setup>

function filter

const datasetStore = useDatasetStore();

const props = withDefaults(defineProps<{
  configuration: Configuration
}>(), {})
</script>

<style>

</style>