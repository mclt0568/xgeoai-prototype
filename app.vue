<template>
  <div class="app">
    <div class="title">
      <span>XGeoAI Prototype</span>
      <button class="selected">Toolbox</button>
    </div>
    <div class="container">
      <div class="map-container">
        <div class="docked">
          <map-render :data="mapResult" map-id="map-model-output" />
        </div>
        <div class="inspecting-overlay" :class="{'hidden': inspectingFactor === undefined}">
          <div class="inspection-tag">
            <div class="inspection-info">Inspecting Dataset: {{ inspectingFactor ? fieldToName[inspectingFactor] : "Not inspecting" }}</div>
            <button @click="closeInspection" class="inspection-close">Close</button>
          </div>
        </div>
      </div>
      <div  class="toolbox-container">
        <main-toolbox
          :result="datasetStore.modelOutput"
          v-show="inspectingFactor === undefined"
          @inspect="inspectFactor"
          :configurations="datasetStore.currentConfigSet"
          @filter="onFilter"
          @cancel-filter="onFilterCancel"
        />
        <field-toolbox
          v-if="inspectingFactor"
          :configuration="datasetStore.currentConfigSet[inspectingFactor]"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

useHead({title: "XGeoAI Prototype"})

const datasetStore = useDatasetStore();
datasetStore.loadData("/data/data.csv");

const mapResult = computed(() => {
  if (datasetStore.currentlyFilteredOn === MODEL_OUTPUT){
    return datasetStore.filteredResult;
  }
  
  if (datasetStore.currentlyFilteredOn === undefined){
    return datasetStore.modelOutput;
  }
  
  return datasetStore.filteredResult;
  // return datasetStore.individualFiltered[datasetStore.currentlyFilteredOn];
})

// inspect and adjust
const inspectingFactor = ref<ScoreFieldKeys | undefined>(undefined);
function inspectFactor(scoreKey: ScoreFieldKeys) {
  filterRange.value = undefined;
  inspectingFactor.value = scoreKey;
}

function closeInspection() {
  inspectingFactor.value = undefined;
}

// filter model output
const filterRange = ref<[number, number]|undefined>(undefined);
function onFilter(x0: number, x1: number) {
  // filterRange.value = [x0, x1];
  datasetStore.filterFromRange("_model_output", x0, x1);
}
function onFilterCancel(){
  datasetStore.cancelFilter();
  // filterRange.value = undefined;
  // console.log("thing", filterRange.value);
}

// // filtered result
// function getFilteredResult(range: [number, number] | undefined, data: ModelData[]) {
//   if (range === undefined){
//     return data;
//   }
  
//   const [x0, x1] = range as [number, number];
  
//   return data.filter(({value}) => value >= x0 && value < x1);
// }

// function getDataRow(inspectingFactor: ScoreFieldKeys | undefined, filterRange: [number, number] | undefined) {
//   if (inspectingFactor){
//     return datasetStore.getInputDataRow(inspectingFactor);
//   }

//   return getFilteredResult(filterRange, datasetStore.modelOutput);
  
// }

</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;

.app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100vw;
  height: 100vh;
  background: $background;
}

.title {
  min-height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: $background-secondary;
  border-bottom: 1px solid $border;

  span {
    font-weight: 600;
    flex: 1;
    text-align: center;
  }

  button {
    height: 100%;
    border-radius: 0;
    border: 0;
    border-top: 2px solid $background-subtle;
    padding: 9px 16px 11px 16px;
    background: transparent;
    color: $foreground-unfocused;

    &:hover {
      background: $background-interaction;
    }
    
    &.selected {
      &:hover {
        background: $background-interaction;
      }
      
      background: $background;
      color: $foreground;
      border-top: 2px solid $accent;
    }
  }
}

.container {
  height: calc(100vh - 40px);
  display: flex;
  align-items: stretch;
  flex-direction: column;
}

.map-container {
  flex: 1;
  position: relative;

  &>div {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .inspecting-overlay {
    box-shadow: inset 0 0 30px $inspection-glow;
    pointer-events: none;
    transition: box-shadow ease 0.3s;
    
    &.hidden {
      box-shadow: none;
      
      .inspection-tag {
        margin-left: -20px;
        opacity: 0;
      }
    }
    
    .inspection-tag {
      transition: ease 0.3s;
      margin: 8px 0 0 8px;
      pointer-events: all;
      display: flex;
      height: 25px;
      width: fit-content;
      background: $inspection-accent;
      border-radius: 4px;
      align-items: center;
      user-select: none;
    }

    .inspection-info {
      color: $background;
      font-size: 12px;
      padding: 0 10px;
    }
    
    button {
      color: $background;
      background: transparent;
      padding: 5px 10px;
      font-size: 12px;
      border: 0;
      border-left: 1px solid $inspection-border;
      font-weight: 600;
    }
  }
}

#map {
  height: 100%;
  width: 100%;
}

.toolbox-container {
  height: 420px;
  border-left: $border 1px solid;
  overflow: scroll;
}

</style>