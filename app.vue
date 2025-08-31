<template>
  <div class="app">
    <div class="title">
      <span>XGeoAI Prototype</span>
      <button class="selected">Toolbox</button>
    </div>
    <div class="container">
      <div class="map-container">
        <div class="docked">
          <map-render :data="datasetStore.modelOutput" map-id="map-model-output" />
        </div>
        <div class="inspecting-overlay" :class="{'hidden': inspectingFactor === undefined}">
          <div class="inspection-tag">
            <div class="inspection-info">Inspecting Dataset: {{ fieldToName[inspectingFactor ?? "score_km"] }}</div>
            <button @click="closeInspection" class="inspection-close">Close</button>
          </div>
        </div>
      </div>
      <div  class="toolbox-container">
        <main-toolbox :result="datasetStore.modelOutput" v-show="inspectingFactor === undefined" @inspect="inspectFactor" :configurations="datasetStore.currentConfigSet" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({title: "XGeoAI Prototype"})

const datasetStore = useDatasetStore();
datasetStore.loadData("/data/data.csv");

// inspect and adjust
const inspectingFactor = ref<ScoreFieldKeys | undefined>(undefined);
function inspectFactor(scoreKey: ScoreFieldKeys) {
  inspectingFactor.value = scoreKey;
}

function closeInspection() {
  inspectingFactor.value = undefined;
}

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
  height: 40px;
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
  flex: 1;
  display: flex;
  align-items: stretch;
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
  width: 300px;
  border-left: $border 1px solid;
}

</style>