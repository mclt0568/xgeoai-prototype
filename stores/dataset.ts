import type { Feature, FeatureCollection, Polygon } from 'geojson';
import Papa from 'papaparse';
import { defineStore } from 'pinia'


export type DataMap = {[key: number]: {[key: number]: number}};

function dataMapCopy(map: DataMap): DataMap {
  const copy: DataMap = {};

  for (const lat in map) {
    const latKey = Number(lat);
    copy[latKey] = {};

    for (const lon in map[latKey]) {
      copy[latKey][lon] = map[latKey][lon];
    }
  }

  return copy;
}

function dataMapSet(map: DataMap, lat: number, lon: number, value: number | undefined) {
  // delete point from map
  if (value === undefined) {
    if (!(lat in map)){
      return;
    }

    if (!(lon in map[lat])){
      return;
    }

    delete map[lat][lon];

    if (isEmpty(map[lat])){
      delete map[lat];
    }

    return;
  }

  if (!(lat in map)){
    map[lat] = {};
  }
  
  map[lat][lon] = value;
}

function dataMapGet(map: DataMap, lat: number, lon: number): number | undefined {
  if (!(lat in map)) return;
  
  if (!(lon in map[lat])) return;

  return map[lat][lon];
}

function dataMapMultiply(dataMap: DataMap, factor: number): void {
  for (const lat in dataMap) {
    const latKey = Number(lat);
    const row = dataMap[latKey];

    for (const lon in row) {
      const lonKey = Number(lon);
      row[lonKey] *= factor;
    }
  }
}

const GRID_SIZE = 0.25;

export function dataMapToGeoJSON(dataMap: DataMap): FeatureCollection {
  const features: Feature<Polygon>[] = [];

  for (const latStr in dataMap) {
    const lat = Number(latStr);
    const row = dataMap[lat];
    for (const lonStr in row) {
      const lon = Number(lonStr);
      const value = row[lon];

      const half = GRID_SIZE / 2;

      const coordinates = [[
        [lon - half, lat - half], // bottom-left
        [lon + half, lat - half], // bottom-right
        [lon + half, lat + half], // top-right
        [lon - half, lat + half], // top-left
        [lon - half, lat - half]  // close polygon
      ]];

      const feature: Feature<Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates
        },
        properties: {
          value
        }
      };

      features.push(feature);
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}


export interface DataRow {
  Latitude: number;
  Longitude: number;
  mean_correlation_with_existing_farms: number;
  min_distance_to_line_km: number;
  avg_capacity_factor: number;
  avg_solar_radiation: number;
  min_distance_nature_land_km: number;
  score_km: number;
  score_wind_correlation: number;
  score_wind_capacity: number;
  score_solar_radiation: number;
  score_distance_nature_land: number;
  pareto_tier: number;
  state: string;
  suitability_index: number;
  is_suitable: boolean;
  is_suitable_model: boolean;
}

export type ScoreFieldKeys = Extract<keyof DataRow, `score_${string}`>;

export type Configuration = {
  name: string,
  fieldName: ScoreFieldKeys,
  contribution: number,
  normalisation: number,
  standardisation: number,
  biased: boolean,
  dataMap: DataMap,
  cachedConfiguredDataMap: DataMap | undefined,
  cachedDataMap: DataMap | undefined,
};

export const fieldToName: Record<ScoreFieldKeys, string> = {
  score_km: "Grid Proximity",
  score_wind_correlation: "Wind Type Correlation",
  score_wind_capacity: "Wind Capacity",
  score_solar_radiation: "Solar Radiation",
  score_distance_nature_land: "Nature Land Proximity",
};

export const useDatasetStore = defineStore('dataset', () => {
  // const configurations = ref<{[key: string]: Configuration}>({});
  const loaded = ref(false);
  const configurations = ref<Partial<Record<ScoreFieldKeys, Configuration>>>({});
  const modelResult = ref<DataMap>({});

  async function loadData(url: string) {
    
    // fetch and parse data
    const BOOLEAN_FIELDS: (number | string)[] = ["is_suitable", "is_suitable_model"];
    const res = await fetch(url);
    const resText = await res.text();
    const parsed = Papa.parse(resText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transform: (v, f) => BOOLEAN_FIELDS.includes(f) ? (v === "1") : v,
    }).data as DataRow[];

    // convert table to datamap
    const fieldEntries = Object.entries(fieldToName) as [ScoreFieldKeys, string][];
    for (const [fieldName, name] of fieldEntries) {
      configurations.value[fieldName] = {
        fieldName, name,
        biased: false,
        contribution: 1 / fieldEntries.length,
        normalisation: 0,
        standardisation: 0,
        dataMap: {},
        cachedConfiguredDataMap: undefined,
        cachedDataMap: undefined,
      };
    }

    const configurationEntries = Object.entries(configurations.value) as [ScoreFieldKeys, Configuration][];
    for (const row of parsed) {
      for (const [fieldName, configuration] of configurationEntries){
        const value = row[fieldName] as number;
        dataMapSet(configuration.dataMap, row.Latitude, row.Longitude, value);
      }
    }

    for (const [fieldName, _] of fieldEntries){
      applyContribution(fieldName);
    }

    runModel();

    loaded.value = true;
  }

  function applyConfiguration(fieldName: ScoreFieldKeys) {
    // TODO: complete configuration computation
    const configuration = configurations.value[fieldName] as Configuration;
    configuration.cachedConfiguredDataMap = dataMapCopy(configuration.dataMap);
  }

  function applyContribution(fieldName: ScoreFieldKeys) {
    const configuration = configurations.value[fieldName] as Configuration;
    const contribution = configuration.contribution;
    
    if (configuration.cachedConfiguredDataMap === undefined) {
      applyConfiguration(fieldName);
    }

    /* @ts-ignore */
    configuration.cachedDataMap = dataMapCopy(configuration.cachedConfiguredDataMap);

    dataMapMultiply(configuration.cachedDataMap, contribution);
  }

  function setContribution(fieldName: ScoreFieldKeys, contribution: number) {
    // Clamp contribution between 0 and 1
    if (contribution > 1) contribution = 1;
    if (contribution < 0) contribution = 0;

    // Step 1: Collect current contributions
    const allContributions: Partial<Record<ScoreFieldKeys, number>> = {};
    for (const [key, config] of Object.entries(configurations.value) as [ScoreFieldKeys, Configuration][]) {
      allContributions[key] = config.contribution;
    }

    // Step 2: Calculate sum of others (excluding the chosen field)
    let totalOther = 0;
    for (const [key, contrib] of Object.entries(allContributions) as [ScoreFieldKeys, number][]) {
      if (key !== fieldName) {
        totalOther += contrib;
      }
    }

    // Step 3: Calculate scaling factor for others
    const newTotalOther = 1 - contribution;
    const scale = totalOther > 0 ? newTotalOther / totalOther : 0;

    // Step 4: Create new contribution map
    const newContributions: Partial<Record<ScoreFieldKeys, number>> = {};
    for (const [key, old] of Object.entries(allContributions) as [ScoreFieldKeys, number][]) {
      newContributions[key] = (key === fieldName) ? contribution : old * scale;
    }

    // Step 5: Apply back to configurations
    for (const [key, value] of Object.entries(newContributions) as [ScoreFieldKeys, number][]) {
      const config = configurations.value[key];
      if (config) config.contribution = value;
    }

    // Step 6: Apply configuration updates
    for (const key of Object.keys(newContributions) as ScoreFieldKeys[]) {
      applyContribution(key);
    }
  }
  
  function runModel(){
    const configs = Object.values(configurations.value);
    if (configs.every(c => c.contribution === 0)) {
      modelResult.value = {};
      return;
    }

    let result: DataMap = {};
    for (const config of configs) {
      if (config.contribution === 0) continue;
      if (isEmpty(result)) {
        result = dataMapCopy(config.cachedDataMap ?? {});
        continue;
      };

      for (const latStr in (config.cachedDataMap ?? {})) {
        const lat = Number(latStr);
        const row = (config.cachedDataMap ?? {})[lat];
        
        for (const lonStr in row) {
          const lon = Number(lonStr);
          const value = row[lon];
          
          const destVal = dataMapGet(result, lat, lon);
          if (destVal === undefined) {
            dataMapSet(result, lat, lon, value);
          }
          else {
            dataMapSet(result, lat, lon, value + destVal);
          }
        }
      }
    }

    modelResult.value = result;

  }


  return {
    loaded,
    loadData,
    setContribution,
    configurations,
    runModel,
    modelResult
  };
})
