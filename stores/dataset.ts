import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { defineStore } from 'pinia'
import { isOfType } from '@/utils/misc';
import * as dfd from "danfojs";
import { filter } from 'lodash';

const FIELD_KEEP = ["Latitude", "Longitude"];

export const MODEL_OUTPUT = "_model_output";
export const adjustedFieldOf = (field: ScoreFieldKeys) => `_adjusted_${field}`;
export const scaledFieldOf = (field: ScoreFieldKeys) => `_scaled_${field}`;

export const fieldToName: Record<ScoreFieldKeys, string> = {
  score_km: "Grid Proximity",
  score_wind_correlation: "Wind Type Correlation",
  score_wind_capacity: "Wind Capacity",
  score_solar_radiation: "Solar Radiation",
  score_distance_nature_land: "Nature Land Proximity",
};

export const useDatasetStore = defineStore('dataset', () => {
  const loaded = ref(false);
  let df: dfd.DataFrame | undefined = undefined;
  const modelOutput = ref<ModelData[]>([]);
  const currentConfigSet = ref<ConfigurationSet>(getDefaultConfigurationSet());
  const individualOutput = ref<Record<ScoreFieldKeys, ModelData[]>>({
    score_distance_nature_land: [],
    score_km: [],
    score_solar_radiation: [],
    score_wind_capacity: [],
    score_wind_correlation: []
  });
  const individualFiltered = ref<Record<ScoreFieldKeys, ModelData[]>>({
    score_distance_nature_land: [],
    score_km: [],
    score_solar_radiation: [],
    score_wind_capacity: [],
    score_wind_correlation: []
  });
  const filteredResult = ref<ModelData[]>([]);
  const currentlyFilteredOn = ref<ScoreFieldKeys | typeof MODEL_OUTPUT | undefined>(undefined);

  async function loadData(url: string) {
    
    let _df = await dfd.readCSV(url);
    _df = _df.loc({columns: [...FIELD_KEEP, ...ScoreFieldKeyConstants]});

    
    for (const field of ScoreFieldKeyConstants) {
      _df = _df.addColumn(adjustedFieldOf(field), Array(_df.shape[0]).fill(0));
      _df = _df.addColumn(scaledFieldOf(field), Array(_df.shape[0]).fill(0));
    }
    
    _df = _df.addColumn(MODEL_OUTPUT, Array(_df.shape[0]).fill(0));
    
    df = _df;
    
    ScoreFieldKeyConstants.forEach(k => applyAdjustments(k, true));
    
    for (const field of ScoreFieldKeyConstants){
      const data = toModelDataRows(_df, field);
      individualOutput.value[field] = [...data];
      individualFiltered.value[field] = [...data];
    }

    runModel();
  }

  function applyAdjustments(field: ScoreFieldKeys, preventModelExec: boolean = false) {
    if (df === undefined) return;
    
    let _df = df;
    _df.addColumn(adjustedFieldOf(field), _df[field].values, { inplace: true });
    applyContribution(field, preventModelExec);
  }
  
  function applyContribution(field: ScoreFieldKeys, preventModelExec: boolean = false) {
    if (df === undefined) return;
    
    let _df = df;

    const scale = currentConfigSet.value[field].scale;

    _df.addColumn(scaledFieldOf(field), _df[adjustedFieldOf(field)].mul(scale), { inplace: true });


    if (preventModelExec) {
      return;
    }

    runModel();
  }

  function setContribution(field: ScoreFieldKeys, contribution: number, preventModelExec: boolean = false) {
    if (df === undefined) return;

    if (currentlyFilteredOn !== undefined) {
      cancelFilter();
    }

    const currentConfigs = currentConfigSet.value;
    const scales: [ScoreFieldKeys, number][] = (Object.entries(currentConfigs) as [ScoreFieldKeys, Configuration][]).map(([f, c]) => ([f, c.scale]));
    let totalOthers = 0;


    // sum (fields without `field`)
    scales.forEach(([f, c]) => {
      if (f === field) return;
      totalOthers += c;
    });


    const newTotal = 1 - contribution;

    
    // const newScales: [ScoreFieldKeys, number][] = [];
    scales.forEach(([f, c]) => {
      if (f === field) {
        currentConfigSet.value[f].scale = contribution;
        applyContribution(f, true);
        return;
      }
      
      currentConfigSet.value[f].scale = (c / totalOthers) * newTotal;

      applyContribution(f, true);
    });

    if (preventModelExec) {
      return;
    }

    runModel();
  }
  
  function runModel(){
    if (df === undefined) return;

    
    let _df = df;
    
    _df.addColumn(MODEL_OUTPUT, Array(_df.shape[0]).fill(0), { inplace: true });
    
    const currentConfigsEntries = Object.entries(currentConfigSet.value) as [ScoreFieldKeys, Configuration][];

    const columns = [...currentConfigsEntries.map(e => e[0]).map(scaledFieldOf)];
    const summed = _df.loc({ columns }).sum({ axis: 1 }).round();
    _df.addColumn(MODEL_OUTPUT, summed, { inplace: true });

    df = _df;

    const data = toModelDataRows(_df, MODEL_OUTPUT)
    modelOutput.value = data;
    filteredResult.value = data;
    
    // for (const field of ScoreFieldKeyConstants)
    //   individualOutput.value[field] = toModelDataRows(_df, scaledFieldOf(field));
  }

  function getInputDataRow(field: ScoreFieldKeys): ModelData[] {
    if (df === undefined) return [];

    return toModelDataRows(df, field);
  }

  function filterFromRange(field: ScoreFieldKeys | typeof MODEL_OUTPUT, x0: number, x1: number) {
    if (df == undefined) {
      return;
    }
    
    currentlyFilteredOn.value = field;
    
    const mask = df.loc({ columns: [field] }).values.map(v => (x0 <= (v as number)) && ((v as number) < x1));
    const filtered = df.loc({rows: mask});
    
    const data = toModelDataRows(filtered, MODEL_OUTPUT)
    filteredResult.value = data;
    
    for (const field of ScoreFieldKeyConstants){
      individualFiltered.value[field] = toModelDataRows(filtered, field);
    }
  }

  function filterFromLocation(x0: number, x1: number, y0: number, y1: number) {
    
  }

  function cancelFilter() {
    console.log("called");
    filteredResult.value = modelOutput.value;
    for (const field of ScoreFieldKeyConstants){
      individualFiltered.value[field] = [...individualOutput.value[field]];
    }
    currentlyFilteredOn.value = undefined;
  }

  return {
    loaded,
    loadData,
    setContribution,
    runModel,
    df,
    modelOutput,
    currentConfigSet,
    getInputDataRow,
    individualOutput,
    filterFromRange,
    cancelFilter,
    currentlyFilteredOn,
    individualFiltered,
    filteredResult,
  };
})
