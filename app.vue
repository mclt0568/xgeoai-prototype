<template>
  <div class="app">
    <div class="title">
      <span>XGeoAI Prototype</span>
      <button class="selected">Toolbox</button>
    </div>
    <div class="container">
      <div class="map-container">
        <div ref="map" id="map"></div>
      </div>
      <div class="toolbox-container">
        <main-toolbox />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import mapboxgl from 'mapbox-gl'
import { initMap } from './utils/map';
import { getData, toGridGeoJSON } from './utils/data';

const x = ref(0.6);

useHead({title: "XGeoAI Prototype"})

onMounted(async () => {
  const config = useRuntimeConfig();
  mapboxgl.accessToken = config.public.mapboxToken;

  const map = initMap("map");

  const data = await getData("/data/data.csv");

  map.on("load", ()=>{
    map.addSource("avg-capacity-factor", {
      type: "geojson",
      data:  toGridGeoJSON(data),
    });

    map.addLayer({
      id: 'grid-fill',
      type: 'fill',
      source: 'avg-capacity-factor',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0.0, '#4575b4',
          0.25, '#91bfdb',
          0.5, '#ffffbf',
          0.75, '#fdae61',
          1.0, '#d73027'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'rgba(0, 0, 0, 0)'
      }
    });
  })
})
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