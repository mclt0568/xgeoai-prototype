import type { Feature, FeatureCollection, Polygon } from "geojson";

import {DataFrame} from "danfojs";

const GRID_SIZE = 0.25;

export type ModelData = {
  lat: number,
  lon: number,
  value: number,
}

export const ScoreFieldKeyConstants = [
  "score_km",
  "score_wind_correlation",
  "score_wind_capacity",
  "score_solar_radiation",
  "score_distance_nature_land"
] as const;
export type ScoreFieldKeys = typeof ScoreFieldKeyConstants[number];
export const isOfScoreFieldKey = isOfType(ScoreFieldKeyConstants);

export type Configuration = {
  field: ScoreFieldKeys,
  scale: number,
  standardisation: number,
  normalisation: number,
  enabled: boolean,
  biased: boolean
}

export type ConfigurationSet = Record<ScoreFieldKeys, Configuration>;

export function getDefaultConfigurationSet(): ConfigurationSet {
  const result: Partial<ConfigurationSet> = {};
  for (const field of ScoreFieldKeyConstants) {
    result[field] = {
      field,
      biased: false,
      enabled: true,
      scale: 1 / ScoreFieldKeyConstants.length,
      standardisation: 0,
      normalisation: 0,
    }
  }

  return result as ConfigurationSet;
}

export function dataArrayToGeoJSON(data: ModelData[]): FeatureCollection {
  const features: Feature<Polygon>[] = data.map(({ lat, lon, value }) => {
    const half = GRID_SIZE / 2;

    // Coordinates of the bounding box (clockwise)
    const coordinates = [[
      [lon - half, lat + half], // top-left
      [lon + half, lat + half], // top-right
      [lon + half, lat - half], // bottom-right
      [lon - half, lat - half], // bottom-left
      [lon - half, lat + half], // close polygon
    ]];

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates,
      },
      properties: {
        value,
        lat,
        lon,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

export function toModelDataRows(df: DataFrame, valueColumn: string): ModelData[] {
  const modelDataArray: ModelData[] = (df.values as any[][]).map(row => ({
    lat: Number(row[df.columns.indexOf("Latitude")]),
    lon: Number(row[df.columns.indexOf("Longitude")]),
    value: Number(row[df.columns.indexOf(valueColumn)]),
  }));

  return modelDataArray;
}