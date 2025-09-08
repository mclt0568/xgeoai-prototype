<template>
  <div ref="wrap" class="chart w-full h-80"></div>
</template>

<script setup lang="ts">
import * as d3 from "d3";
import { ref, onMounted, onBeforeUnmount, watch, defineProps } from "vue";
import { max, min } from "~/utils/misc";

const props = withDefaults(defineProps<{
  values: Array<number | string>;
  binSize?: number
}>(), {
  binSize: 1.5,
});

const emit = defineEmits<{
  "filter": [number, number],
  "cancelFilter": [],
}>()

const wrap = ref<HTMLElement | null>(null);
let ro: ResizeObserver | null = null;

// selection
const rangeSelected = ref<undefined | [number, number]>(undefined);
const startingRange = ref<undefined | [number, number]>(undefined);
const inSelect = ref(false);
const selected = ref(false);
function startRangeSelection(start: number, end: number) {
  inSelect.value = true;
  selected.value = true;
  
  const rectified = rectifyOrder(start, end);
  startingRange.value = rectified;
  rangeSelected.value = rectified;
}

function updateRangeSelection(start: number, end: number) {
  if (!inSelect.value) return;
  
  if (startingRange.value === undefined) {
    startRangeSelection(start, end);
  }

  const upperBound = max([start, end, ...(startingRange.value as [number, number])]);
  const lowerBound = min([start, end, ...(startingRange.value as [number, number])]);

  if (upperBound === undefined || lowerBound === undefined){
    return;
  }

  rangeSelected.value = [lowerBound, upperBound];
}

function completeSelection(){
  selected.value = true;
  inSelect.value = false;

  if (rangeSelected.value === undefined) {
    return
  };
  if (startingRange.value === undefined) {
    return
  };

  emit("filter", ...rangeSelected.value);
}

function unselect() {
  inSelect.value = false;
  selected.value = false;
  startingRange.value = undefined;
  rangeSelected.value = undefined;
  emit("cancelFilter");
}

function rectifyOrder(x: number, y: number): [number, number] {
  if (x < y) {
    return [x, y]
  }
  return [y, x]
}

// get ticks
function generateTicks(min: number, max: number, n: number): number[] {
  if (n < 2) {
    throw new Error("n must be at least 2 to include min and max");
  }
  const step = (max - min) / (n - 1);
  const ticks = [];
  for (let i = 0; i < n; i++) {
    ticks.push(min + step * i);
  }
  return ticks;
}

function draw() {
  if (!wrap.value) return;

  // clear prev chart
  wrap.value.innerHTML = "";

  // layout
  const width = wrap.value.clientWidth || 600;
  const height = wrap.value.clientHeight || 300;
  const margin = { top: 16, right: 16, bottom: 38, left: 48 };

  // prep data, cast to number and remove illegal numbers
  const raw = (props.values ?? []).map(v => +v).filter(v => Number.isFinite(v));
  if (raw.length === 0) return;
  const enumerated = raw.map((v, i) => ({ v, i }));

  // prep to draw
  const min = d3.min(raw)!;
  const max = d3.max(raw)!;
  const binSize = Math.max(+(props.binSize ?? 5), 1e-9); // avoid 0
  const thresholds = d3.range(min, max + binSize, binSize);

  // create bins
  const bin = d3.bin<{ v: number; i: number }, number>()
    .value(d => d.v)
    .thresholds(thresholds);

  const bins = bin(enumerated);

  // scales (input -> pixels)
  const x = d3.scaleLinear()
    .domain([min, max])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, b => b.length) ?? 0]).nice()
    .range([height - margin.bottom, margin.top]);

  // mount svg
  const svg = d3.select(wrap.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img");

  // colour
  const color = d3.scaleLinear<number, string>()
  .domain(chartScheme.map(d => d[0]))
  // @ts-ignore
  .range(chartScheme.map(d => d[1]));

  // container
  svg.append("rect")
  .attr("class", "bars-container")
  .attr("x", margin.left)
  .attr("y", margin.top)
  .attr("width", width - margin.left - margin.right)
  .attr("height", height - margin.top - margin.bottom);

  // bars
  svg.append("g")
    .on("mouseleave", function() {
      emit("cancelFilter");
    })
    .call(s => s.attr("class", "bars"))
    .selectAll("rect")
    .data(bins)
    .join("rect")
      .attr("x", d => x(d.x0!))
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1!) - x(d.x0!) - 0)) // 1px gap
      .attr("height", d => y(0) - y(d.length))
      .attr("fill", d => color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2))
      .on("mouseenter", function (_, d: d3.Bin<{v: number, i: number}, number>){
        
        // highlight bar
        svg.selectAll(".bars rect").attr("fill", "lightgray");
        d3.select(this).attr("fill", color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2));

        const labelFmt = d3.format("~s");
        const tickLen = 6;
        const labelPad = 6;
        const yPos = y(d.length);

        // a line
        overlay.append("line")
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("stroke", "#E1E1E1")
          .attr("stroke-width", 1);

        // the y label
        overlay.append("text")
          .attr("x", margin.left - tickLen - labelPad)
          .attr("y", yPos)
          .attr("font-size", 10)
          .attr("fill", "#8D8D8D")
          .attr("dy", "0.32em")               // vertical centering
          .attr("text-anchor", "end")         // text sits to the left
          .attr("class", "y-hover-label")
          .text(labelFmt(d.length));

        // hide x-axis
        svg.select(".x-axis").attr("opacity", "0");

        // draw new x-axis
        overlay.selectAll("text.bin-label")
        .data([d])
        .join(enter => enter.append("text").attr("class", "bin-label"))
        .attr("x", x((d.x0! + d.x1!) / 2))
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .text(`${d.x0}-${d.x1}`)
        .attr("font-size", 10)
        .attr("fill", "#8D8D8D")

        // emit filter
        emit("filter", d.x0 ?? 0, d.x1 ?? 0);
      })
      .on("mouseleave", function () {
        /* @ts-ignore */
        svg.selectAll(".bars rect").attr("fill", d => color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2));
        overlay.selectAll("*").remove();
        svg.select(".x-axis").attr("opacity", "1");
      })
      .on("mousedown", function() {})
      .on("mouseup", function() {})
    .append("title")
      .text(d => `range: [${d.x0}, ${d.x1})\ncount: ${d.length}`);

  const overlay = svg.append("g").attr("class", "hover");
    

  // x axis label
  const xAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
  g.attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickValues(generateTicks(min, max, 5))
      .tickFormat(d3.format(".1f"))
      .tickSizeInner(0)
      .tickSizeOuter(0)
      .tickPadding(13)
    )
    .call(g => g.select(".domain").remove())  // removes the line
    .call(s => s.selectAll(".tick text")
       .attr("fill", "#8D8D8D")       // label color
    )
    .call(s => s.append("text")
      .attr("x", width - margin.right)
      .attr("y", 40)              // push below ticks
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
    );
  svg.append("g").call(xAxis).attr("class", "x-axis");
}

onMounted(() => {
  draw();
  // Redraw on resize
  ro = new ResizeObserver(() => draw());
  if (wrap.value) ro.observe(wrap.value);
});

onBeforeUnmount(() => {
  if (ro && wrap.value) ro.unobserve(wrap.value);
  ro = null;
});

watch(() => props.values, () => draw(), { deep: false });
</script>

<style scoped>
/* optional: set a default height if parent doesn't provide one */
.w-full { width: 100%; }
.h-80 { height: 20rem; }

.chart {
  margin-top: 10px;
}

.chart :deep(.bars-container) {
  fill: none;
  stroke: #E1E1E1;
  stroke-width: 2;
}

.chart :deep(.hover) {
  pointer-events: none;
}
</style>
