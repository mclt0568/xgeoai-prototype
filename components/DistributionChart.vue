<template>
  <div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script lang="ts" setup>
import * as d3 from 'd3';
import { onMounted, ref, watch } from 'vue';

const chartRef = ref<HTMLElement | null>(null);

defineProps<{
  data: { label: string; value: number }[];
}>();

onMounted(() => {
  if (!chartRef.value) return;

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', 400)
    .attr('height', 300);

  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (_, i) => i * 60)
    .attr('y', d => 300 - d.value * 10)
    .attr('width', 50)
    .attr('height', d => d.value * 10)
    .attr('fill', 'steelblue');
});


</script>

<style>

</style>