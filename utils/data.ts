import Papa from "papaparse";
import type { FeatureCollection, Feature, Polygon } from "geojson";

const GRID_SIZE = 0.25;

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

export async function getData(url: string): Promise<DataRow[]> {
  const BOOLEAN_FIELDS: (number | string)[] = ["is_suitable", "is_suitable_model"];
  
  const res = await fetch(url);
  const resText = await res.text();
  const parsed = Papa.parse(resText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transform: (v, f) => BOOLEAN_FIELDS.includes(f) ? (v === "1") : v,
  })

  return parsed.data as DataRow[];
};

export function toGridGeoJSON(data: DataRow[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.map((row): Feature<Polygon> => {
      const half = GRID_SIZE / 2;
      const lng = row.Longitude;
      const lat = row.Latitude;

      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [lng - half, lat - half], // bottom-left
            [lng + half, lat - half], // bottom-right
            [lng + half, lat + half], // top-right
            [lng - half, lat + half], // top-left
            [lng - half, lat - half]  // close polygon
          ]]
        },
        properties: {
          value: row.avg_capacity_factor
        }
      };
    })
  };
}