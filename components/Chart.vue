<template>
  <div class="bin-chart" draggable="false">
    <div class="chart-container" @mouseleave="onChartExit" draggable="false">
      <div class="stacked" draggable="false">
        <div class="stacked" draggable="false">
          <div class="bars" v-show="hasSelection || normalHover !== -1" draggable="false"> <!-- hover effect -->
            <div
            v-for="[idx, _] in selectedPortions"
            draggable="false"
            class="bar"
            :class="{'hover-effect': (inRangeLoose(startingValue[2], endingValue[2], idx) && hasHardSelection) || normalHover === idx || idx === temporaryHovers }"
            style="height: 100%;"
            ></div>
            
          </div>
          <div class="bars" draggable="false"> <!-- bottom (base) -->
            <div 
              v-for="b in dataBin" 
              draggable="false"
              class="bar" 
              :class="{
                gray: hasSelection, 
                significant: b.data.length !== 0}" 
              :style="{
                height: `calc(${(b.data.length / max) * 90}%)`, 
                '--background': `${colorScale((b.x1 + b.x0) / 2)}`}"/>
          </div>
          <div v-show="hasSelection" draggable="false" class="bars"> <!-- top (selected) -->
            <div 
              v-for="[idx, d] in selectedPortions" 
              class="bar"
              draggable="false"
              :style="{
                height: `calc(${(d / max) * 90}%)`, 
                '--background': temporaryHovers === -1 ? `${colorScale((dataBin[idx].x1 + dataBin[idx].x0) / 2)}`: temporaryHovers === idx ? `${colorScale((dataBin[idx].x1 + dataBin[idx].x0) / 2)}` : 'lightgray'}"/>
          </div> 
        </div>
        <div class="bars" draggable="false"> <!-- event-capture -->
          <div 
            v-for="{x0, x1, idx} in dataBin.map((d, idx) => ({...d, idx}))" 
            class="bar" 
            :style="{height: '100%'}" 
            draggable="false"
            @mouseenter="() => onBarEnter(x0, x1, idx)" 
            @mousedown="() => onMouseDown(x0, x1, idx)"/>
        </div>
        <div class="overlay" draggable="false">
          <div class="overlay-container" v-if="hasSelection && temporaryHovers === -1" draggable="false">
            <div>Score Range: <span>{{ selectingHoverStats?.range[0] }} ~ {{ selectingHoverStats?.range[1] }}</span></div>
            <div>n Locations: <span>{{ selectingHoverStats?.n }}</span> out of {{ data.length }}</div>
            <div draggable="false" v-show="hasHardSelection"><a draggable="false" @click="() => unselect()">Unselect</a></div>
          </div>
          <div class="overlay-container" v-if="temporaryHovers !== -1" draggable="false">
            <div>Score Range: <span>{{ dataBin[temporaryHovers].x0 }} ~ {{ dataBin[temporaryHovers].x1 }}</span></div>
            <div>Highlighted: <span>{{ selectedPortions[temporaryHovers][1] }}</span> out of {{ dataBin[temporaryHovers].data.length }}</div>
            <!-- <div>Number of points: {{ selectingHoverStats?.n }}</div> -->
            <!-- <div draggable="false"><a draggable="false" @click="() => unselect()">Unselect</a></div> -->
          </div>
        </div>
      </div>
    </div>
    <div class="axis-label">
      <span>{{ (domain ?? [0, 1])[0] }}</span>
      <span>{{ ((domain ?? [0, 1])[1] + (domain ?? [0, 1])[0]) / 2 }}</span>
      <span>{{ (domain ?? [0, 1])[1] }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { shallowRef, watch, computed } from "vue";
import { bin, extent } from "d3-array";
import { scaleLinear } from "d3";

function getSelectingHoverStats(portion: typeof selectedPortions.value) {
  const significantPortions = portion.filter(([_, n]) => n);
  if (significantPortions.length === 0) {
    return {
      range: [0, 0],
      n: 0
    };
  }
  else {
    const first = significantPortions[0];
    const last = significantPortions[significantPortions.length - 1];
    return {
      range: [dataBin.value[first[0]].x0, dataBin.value[last[0]].x1],
      n: significantPortions.reduce((x, [_, y]) => x + y, 0)
    }
  }
}

const selectingHoverStats = computed(() =>
  getSelectingHoverStats(selectedPortions.value)
);

type ShallowBin = {
  data: number[];  // values that fell into the bin (copy)
  x0: number;      // lower bound
  x1: number;      // upper bound
};

const props = withDefaults(defineProps<{
  data: number[];
  selectedData?: number[] | null;
  // optional controls (useful if you want to change these reactively)
  domain?: [number, number];
  thresholds?: number | number[] | ((values: Iterable<number>, min: number, max: number) => number[]);
  disableSelect?: boolean,
}>(), {
  disableSelect: false,
});

const emit = defineEmits<{
  "filter": [number, number],
  "hardFilter": [number, number],
  "cancelFilter": [],
  "cancelHardFilter": [],
  "update:selectedData": [number[] | null],
}>()

const schemeToDomain = scaleLinear<number>().domain(chartScheme.map(([v, _]) => v)).range(props.domain ?? [0, 1]);
const colorScale = computed(() => scaleLinear<string>().domain(chartScheme.map(([v, _]) => schemeToDomain(v))).range(chartScheme.map(([_, c]) => c)));

// INTERACTION
// let barWidth = 0;
// const selectedRegion = ref<[number, number, number] | null>(null);
const currentlySelecting = ref(false);
const hasHardSelection = ref(false);
const startingValue = ref<[number, number, number]>([0, 0, 0]) // x0, x1, idx
const endingValue = ref<[number, number, number]>([0, 0, 0])
const temporaryHovers = ref<number>(-1);
const normalHover = ref<number>(-1);
function onMouseDown(x0: number, x1: number, idx: number) {
  if (currentlySelecting.value) {
    window.removeEventListener("mouseup", onMouseUp);
    window.addEventListener("mouseup", onMouseUp);
    return;
  }
  
  temporaryHovers.value = -1;
  currentlySelecting.value = true;
  hasSelection.value = true;
  hasHardSelection.value = true;
  window.addEventListener("mouseup", onMouseUp);
  updateSelectedPortion(dataBin.value[idx].data);
  startingValue.value = [x0, x1, idx];
  endingValue.value = [x0, x1, idx];
}
function onMouseUp() {
  if (startingValue.value[2] > endingValue.value[2]) {
    emit("filter", endingValue.value[0], startingValue.value[1]);
  }
  else {
    emit("filter", startingValue.value[0], endingValue.value[1]);
  }

  currentlySelecting.value = false;
  hasHardSelection.value = true;
  window.removeEventListener("mouseup", onMouseUp);
}
function onBarEnter(x0: number, x1: number, idx: number) {
  if (currentlySelecting.value){
    endingValue.value =[x0, x1, idx];
    
    if (startingValue.value[2] > endingValue.value[2]){
      updateSelectedPortion(dataBin.value.slice(endingValue.value[2], startingValue.value[2] + 1).flatMap(({data}) => data));
      emit("filter", endingValue.value[0], startingValue.value[1]);
    }
    else {
      updateSelectedPortion(dataBin.value.slice(startingValue.value[2], endingValue.value[2] + 1).flatMap(({data}) => data));
      emit("filter", startingValue.value[0], endingValue.value[1]);
    }
    
    return;
  }
  
  if (hasHardSelection.value){
    return;
  }
  
  if ((props.selectedData ?? []).length !== 0) {
    temporaryHovers.value = idx;
    // emit("filter", x0, x1);
    return;
  }
  
  // selectedRegion.value = [x0, x1, idx];
  updateSelectedPortion(dataBin.value[idx].data);
  normalHover.value = idx;
  emit("filter", x0, x1);
}
function onChartExit() {
  temporaryHovers.value = -1;
  normalHover.value = -1;
  if (!hasSelection.value && !hasHardSelection.value) {
    updateSelectedPortion([]);
    emit("cancelFilter");
  }
  if (!hasHardSelection.value && !props.selectedData) {
    hasSelection.value = false;
    emit("cancelFilter");
  }
}
function unselect(updatePortion: boolean = true) {
  temporaryHovers.value = -1;
  normalHover.value = -1;
  currentlySelecting.value = false;
  hasHardSelection.value = false;
  hasSelection.value = false;
  startingValue.value = [0, 0, 0];
  endingValue.value = [0, 0, 0];
  if (updatePortion){
    updateSelectedPortion([]);
    emit("update:selectedData", null);
    emit("cancelFilter");
  }
}

// main data bin
const binData = computed(() => {
  const b = bin();
  const dom =
    props.domain ?? (props.data.length ? (extent(props.data) as [number, number]) : [0, 1]);
  b.domain(dom);
  if (props.thresholds != null) b.thresholds(props.thresholds as any);
  return b;
});
const dataBin = shallowRef<ShallowBin[]>([]);
function updateDataBin(values: number[]) {
  unselect(false);
  const bins = binData.value(values ?? []);
  dataBin.value = bins.map((binArr) => ({
    // copy the values in the bin (avoid keeping the special array subtype from d3)
    data: Array.from(binArr),
    x0: binArr.x0 ?? Number.NEGATIVE_INFINITY,
    x1: binArr.x1 ?? Number.POSITIVE_INFINITY,
  }));
}

const lengths = computed(() => dataBin.value.map(({data}) => data.length));

const max = computed(() => {
  if (lengths.value.length === 0) return 1;
  return lengths.value.reduce((p, c) => p > c? p: c);
});

const selectedPortions = ref<[number, number][]>([]); // index, length
const hasSelection = ref(false);
function updateSelectedPortion(values: number[]) {
  const bins = binData.value(values ?? []);
  selectedPortions.value = bins.map((binArr, i) => [i, binArr.length]);
  hasSelection.value = values.length !== 0 || currentlySelecting.value;
}

function updateSelectedPortionFromExternal(values: number[]) {
  unselect(false);
  updateSelectedPortion(values);
}

// Watch data by reference; replace your data array to trigger it
watch(
  () => props.data,
  (vals) => updateDataBin(vals ?? []),
  { immediate: true }
);

watch(
  () => props.selectedData,
  (vals) => updateSelectedPortionFromExternal(vals ?? []),
  { immediate: true }
);

// // (Optional) If domain/thresholds can change dynamically and you want recompute:
// watch(
//   () => [props.domain, props.thresholds],
//   () => updateShallowBins(props.data ?? []),
//   { immediate: false }
// );





</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

$border-width: 2px;
$padding: 20px;

.bin-chart {
  height: calc(100% - ($padding * 2));
  width: calc(100% - ($padding * 2));
  // background: lightblue;
  padding: $padding;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;

}

.axis-label {
  // background: lightgreen;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #8D8D8D;
  user-select: none;
}

.stacked {
  position: relative;
  width: 100%;
  height: 100%;
  
  &>div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.overlay {
  pointer-events: none;

  a {
    pointer-events: all;
    user-select: none;
    color: $accent;
    text-decoration: underline;

    &:hover {
      background: $accent;
      color: $background;
    }
  }
}

.chart-container {
  width: calc(100% - ($border-width * 2));
  height: calc(100% - ($border-width * 2));
  border: $border-width solid $border;
}

.bars {
  // width: 100%;
  // height: calc(100% - $pad-top);
  display: flex;
  align-items: end;
  .bar { 
    flex: 1;
    background: var(--background);
  }

  .bar.gray.significant {
    background: $background-secondary;
    outline: 1px solid $border;
    outline-offset: -1px;
  }

  .bar.hover-effect {
    background: $background-secondary;
    // outline: 1px solid $border;
    // outline-offset: -1px;
  }
}

.overlay-container {
  background: rgba(0,0,0,0.05);
  position: absolute;
  top: 3px;
  right: 3px;
  padding: 5px;

  &>div {
    font-size: 12px;
    color: #505050;
    user-select: none;
  }

  span {
    color: $accent;
  }
  
}
</style>