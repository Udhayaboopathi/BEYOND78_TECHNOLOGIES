import axios, { AxiosResponse } from "axios";
import {
  Commodity,
  UOM,
  Blend,
  BlendComponent,
  Location,
  CounterParty,
  Capacity,
  ImportResult,
} from "./types";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Commodities
export const getCommodities = (): Promise<AxiosResponse<Commodity[]>> =>
  api.get("/commodities");
export const getCommodity = (id: number): Promise<AxiosResponse<Commodity>> =>
  api.get(`/commodities/${id}`);
export const createCommodity = (
  data: Partial<Commodity>
): Promise<AxiosResponse<Commodity>> => api.post("/commodities", data);
export const updateCommodity = (
  id: number,
  data: Partial<Commodity>
): Promise<AxiosResponse<Commodity>> => api.put(`/commodities/${id}`, data);
export const deleteCommodity = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/commodities/${id}`);

// UOMs
export const getUOMs = (): Promise<AxiosResponse<UOM[]>> => api.get("/uoms");
export const getUOM = (id: number): Promise<AxiosResponse<UOM>> =>
  api.get(`/uoms/${id}`);
export const createUOM = (data: Partial<UOM>): Promise<AxiosResponse<UOM>> =>
  api.post("/uoms", data);
export const updateUOM = (
  id: number,
  data: Partial<UOM>
): Promise<AxiosResponse<UOM>> => api.put(`/uoms/${id}`, data);
export const deleteUOM = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/uoms/${id}`);

// Blends
export const getBlends = (): Promise<AxiosResponse<Blend[]>> =>
  api.get("/blends");
export const getBlend = (id: number): Promise<AxiosResponse<Blend>> =>
  api.get(`/blends/${id}`);
export const createBlend = (
  data: Partial<Blend>
): Promise<AxiosResponse<Blend>> => api.post("/blends", data);
export const createBlendWithComponents = (
  data: any
): Promise<AxiosResponse<Blend>> => api.post("/blends/create-with-components", data);
export const updateBlend = (
  id: number,
  data: Partial<Blend>
): Promise<AxiosResponse<Blend>> => api.put(`/blends/${id}`, data);
export const deleteBlend = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/blends/${id}`);

// Blend Components
export const getBlendComponents = (): Promise<
  AxiosResponse<BlendComponent[]>
> => api.get("/blend-components");
export const getBlendComponentsByBlend = (
  blendId: number
): Promise<AxiosResponse<BlendComponent[]>> =>
  api.get(`/blend-components?blend_id=${blendId}`);
export const getBlendComponent = (
  id: number
): Promise<AxiosResponse<BlendComponent>> => api.get(`/blend-components/${id}`);
export const createBlendComponent = (
  data: Partial<BlendComponent>
): Promise<AxiosResponse<BlendComponent>> =>
  api.post("/blend-components", data);
export const updateBlendComponent = (
  id: number,
  data: Partial<BlendComponent>
): Promise<AxiosResponse<BlendComponent>> =>
  api.put(`/blend-components/${id}`, data);
export const deleteBlendComponent = (
  id: number
): Promise<AxiosResponse<void>> => api.delete(`/blend-components/${id}`);

// Locations
export const getLocations = (): Promise<AxiosResponse<Location[]>> =>
  api.get("/locations");
export const getLocation = (id: number): Promise<AxiosResponse<Location>> =>
  api.get(`/locations/${id}`);
export const createLocation = (
  data: Partial<Location>
): Promise<AxiosResponse<Location>> => api.post("/locations", data);
export const updateLocation = (
  id: number,
  data: Partial<Location>
): Promise<AxiosResponse<Location>> => api.put(`/locations/${id}`, data);
export const deleteLocation = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/locations/${id}`);

// Counter Parties
export const getCounterParties = (): Promise<AxiosResponse<CounterParty[]>> =>
  api.get("/counter-parties");
export const getCounterParty = (
  id: number
): Promise<AxiosResponse<CounterParty>> => api.get(`/counter-parties/${id}`);
export const createCounterParty = (
  data: Partial<CounterParty>
): Promise<AxiosResponse<CounterParty>> => api.post("/counter-parties", data);
export const updateCounterParty = (
  id: number,
  data: Partial<CounterParty>
): Promise<AxiosResponse<CounterParty>> =>
  api.put(`/counter-parties/${id}`, data);
export const deleteCounterParty = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/counter-parties/${id}`);

// Capacity
export const getCapacity = (): Promise<AxiosResponse<Capacity[]>> =>
  api.get("/capacity");
export const getCapacityItem = (id: number): Promise<AxiosResponse<Capacity>> =>
  api.get(`/capacity/${id}`);
export const createCapacity = (
  data: Partial<Capacity>
): Promise<AxiosResponse<Capacity>> => api.post("/capacity", data);
export const updateCapacity = (
  id: number,
  data: Partial<Capacity>
): Promise<AxiosResponse<Capacity>> => api.put(`/capacity/${id}`, data);
export const deleteCapacity = (id: number): Promise<AxiosResponse<void>> =>
  api.delete(`/capacity/${id}`);

// Dependent Data Lookup APIs
export const getCommodityDetails = (
  id: number
): Promise<AxiosResponse<Commodity>> => api.get(`/commodities/${id}/details`);
export const getLocationDetails = (
  id: number
): Promise<AxiosResponse<Location>> => api.get(`/locations/${id}/details`);

// Validation APIs
export const validateCapacity = (
  data: Partial<Capacity>
): Promise<AxiosResponse<any>> => api.post("/capacity/validate", data);
export const validateBlendProportion = (
  blendId: number
): Promise<AxiosResponse<any>> =>
  api.post(`/blend-components/validate-proportion?blend_id=${blendId}`);

// Export APIs
export const exportCommodities = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/commodities", { responseType: "blob" });
export const exportCapacity = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/capacity", { responseType: "blob" });
export const exportBlends = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/blends", { responseType: "blob" });
export const exportBlendComponents = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/blend-components", { responseType: "blob" });
export const exportUOMs = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/uoms", { responseType: "blob" });
export const exportLocations = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/locations", { responseType: "blob" });
export const exportCounterParties = (): Promise<AxiosResponse<Blob>> =>
  api.get("/export/counter-parties", { responseType: "blob" });

// Import APIs
export const importCapacity = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> =>
  api.post("/import/capacity", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const importBlends = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> =>
  api.post("/import/blends", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Generic Import API (for all entities)
export const importEntity = (
  entityKey: string,
  formData: FormData
): Promise<AxiosResponse<ImportResult>> =>
  api.post(`/import/${entityKey}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Template Download APIs
export const downloadTemplate = (
  entityKey: string
): Promise<AxiosResponse<Blob>> =>
  api.get(`/template/${entityKey}`, { responseType: "blob" });

// Convenience methods for specific entities
export const importCommodities = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> => importEntity("commodities", formData);
export const importUOMs = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> => importEntity("uoms", formData);
export const importLocations = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> => importEntity("locations", formData);
export const importCounterParties = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> =>
  importEntity("counter_parties", formData);
export const importBlendComponents = (
  formData: FormData
): Promise<AxiosResponse<ImportResult>> =>
  importEntity("blend_components", formData);

export default api;
