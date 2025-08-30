<template>
  <div class="map-render" :id="mapId"></div>
</template>

<script lang="ts" setup>
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { onMounted, watch, shallowRef } from 'vue';

const props = withDefaults(defineProps<{
  mapId: string;
  data: ModelData[];
}>(), {});

// Hold the map instance
const map = shallowRef<mapboxgl.Map | null>(null);

onMounted(() => {
  const config = useRuntimeConfig();
  mapboxgl.accessToken = config.public.mapboxToken;

  const instance = initMap(props.mapId);
  map.value = instance;

  instance.on('load', () => {
    // Add the initial data source and layer
    instance.addSource('grid', {
      type: 'geojson',
      data: dataArrayToGeoJSON(props.data),
    });

    instance.addLayer({
      id: 'grid-fill',
      type: 'fill',
      source: 'grid',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, '#DF342B',
          25, '#fdae61',
          50, '#F3FFBF',
          75, '#91DBA2',
          100, '#45B464',
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'rgba(0, 0, 0, 0)'
      }
    });
  });
});

watch(
  () => props.data,
  (newData) => {
    const mapInstance = map.value;
    if (mapInstance && mapInstance.isStyleLoaded()) {
      const source = mapInstance.getSource('grid') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(dataArrayToGeoJSON(newData));
      }
    }
  },
  { deep: true } // required because DataMap is a nested object
);


</script>

<style scoped lang="scss">
.map-render {
  height: 100%;
  width: 100%;
}
</style>