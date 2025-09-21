import mapboxgl from "mapbox-gl";

export const australiaBounds: mapboxgl.LngLatBoundsLike = [
  [110.0, -46.0],
  [156.0, -8.0]
];

export function getBoundsCenter(bounds: mapboxgl.LngLatBoundsLike): [number, number] {
  // @ts-ignore
  const [sw, ne] = bounds;

  const centerLng = (sw[0] + ne[0]) / 2;
  const centerLat = (sw[1] + ne[1]) / 2;

  return [centerLng, centerLat];
}

export function initMap(mapName: string) {
  const center = getBoundsCenter(australiaBounds);

  const map = new mapboxgl.Map({
      container: mapName,
      style: 'mapbox://styles/mapbox/standard',
      config: {
        basemap: {
          theme: 'monochrome',
          lightPreset: 'day',
        },
      },
      projection: 'mercator',
      zoom: 2,
      center,
  });
  
  map.addControl(new mapboxgl.NavigationControl());
  map.scrollZoom.enable();
  
  map.on('style.load', () => {
      map.setFog({});
  });

  map.on("load", ()=>{
    map.fitBounds(australiaBounds, {padding: 30});
  })

  return map
}

export const mapScheme: Array<[number, string]>  = [
  [0, '#F1E900',],
  // [50, '#A5A5A5',],
  [100, '#00A6FF',],
]
export const chartScheme: Array<[number, string]>  = [
  [0, '#F1E900',],
  [100, '#007DEA',],
]