<template>
  <div ref="wrap" class="chart w-full h-80"></div>
</template>

<script setup lang="ts">
import * as d3 from "d3";
import { ref, onMounted, onBeforeUnmount, watch, defineProps } from "vue";

const props = withDefaults(defineProps<{
  values: Array<number | string>;
  binSize?: number
}>(), {
  binSize: 1.5,
});

const wrap = ref<HTMLElement | null>(null);
let ro: ResizeObserver | null = null;

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
  const margin = { top: 16, right: 16, bottom: 56, left: 48 };

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

  // scales
    // Scales
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
  const bars = svg.append("g")
    .call(s => s.attr("class", "bars"))
    .selectAll("rect")
    .data(bins)
    .join("rect")
      .attr("x", d => x(d.x0!))
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1!) - x(d.x0!) - 0)) // 1px gap
      .attr("height", d => y(0) - y(d.length))
      .attr("fill", d => color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2))
      .on("mouseenter", function (event, d){
        
        // dim bars
        bars.attr("fill", "lightgray");
        d3.select(this).attr("fill", color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2));
        drawYAxis();
      })
      .on("mouseleave", function () {
        // reset all bars to their original colour
        bars.attr("fill", d => color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2));

        // clear overlay if you want
        overlay.selectAll("*").remove();
      })
    .append("title")
      .text(d => `range: [${d.x0}, ${d.x1})\ncount: ${d.length}`);

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

  // y axis label
  const overlay = svg.append("g").attr("class", "y-hover");
  
  const drawYAxis = () => {
    const labelFmt = d3.format("~s");
    const tickLen = 6;
    const labelPad = 6;

    svg.append("g")
      .selectAll("rect")
      .data(bins)
      .join("rect")
        .attr("x", d => x(d.x0!))
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1!) - x(d.x0!) - 1))
        .attr("height", d => y(0) - y(d.length))
        .attr("rx", 2)
        .attr("fill", d => color(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2))
        .on("mouseenter", (event, d) => {
          // clear previous hover marks
          overlay.selectAll("*").remove();

          const yPos = y(d.length);

          // a line
          overlay.append("line")
            .attr("x1", margin.left + width)
            .attr("x2", margin.left)
            .attr("y1", yPos)
            .attr("y2", yPos)
            .attr("stroke", "#E1E1E1")
            .attr("stroke-width", 1);

          // the label (count) aligned to left of plot area
          overlay.append("text")
            .attr("x", margin.left - tickLen - labelPad)
            .attr("y", yPos)
            .attr("font-size", 10)
            .attr("fill", "#8D8D8D")
            .attr("dy", "0.32em")               // vertical centering
            .attr("text-anchor", "end")         // text sits to the left
            .attr("class", "y-hover-label")
            .text(labelFmt(d.length));

          // (keep your console logging if you want)
          const indices = d.map(e => e.i);
          console.log(`bin=[${d.x0}, ${d.x1}) count=${d.length} indices=[${indices.join(", ")}]`);
        })
        .on("mouseleave", () => {
          overlay.selectAll("*").remove();       // hide when not hovering
        })
      .append("title")
        .text(d => `range: [${d.x0}, ${d.x1})\ncount: ${d.length}`);
  }

svg.append("g").call(xAxis);
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
</style>
