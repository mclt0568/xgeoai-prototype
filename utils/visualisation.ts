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
        }
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
  [0, '#DF342B',],
  [25, '#fdae61',],
  [50, '#F3FFBF',],
  [75, '#91DBA2',],
  [100, '#45B464',],
]

export const chartScheme: Array<[number, string]>  = [
  [0, '#F60C00FF',],
  [25, '#FE7F00FF',],
  [50, '#A29B0BFF',],
  [75, '#00D231FF',],
  [100, '#00EA42FF',],
]