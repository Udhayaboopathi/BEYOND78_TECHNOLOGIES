import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getCommodities = () => api.get("/commodities");
export const getCommodity = (id) => api.get(`/commodities/${id}`);
export const createCommodity = (data) => api.post("/commodities", data);
export const updateCommodity = (id, data) =>
  api.put(`/commodities/${id}`, data);
export const deleteCommodity = (id) => api.delete(`/commodities/${id}`);

export const getUOMs = () => api.get("/uoms");
export const getUOM = (id) => api.get(`/uoms/${id}`);
export const createUOM = (data) => api.post("/uoms", data);
export const updateUOM = (id, data) => api.put(`/uoms/${id}`, data);
export const deleteUOM = (id) => api.delete(`/uoms/${id}`);

export const getBlends = () => api.get("/blends");
export const getBlend = (id) => api.get(`/blends/${id}`);
export const createBlend = (data) => api.post("/blends", data);
export const createBlendWithComponents = (data) =>
  api.post("/blends/create-with-components", data);
export const updateBlend = (id, data) => api.put(`/blends/${id}`, data);
export const deleteBlend = (id) => api.delete(`/blends/${id}`);

export const getBlendComponents = () => api.get("/blend-components");
export const getBlendComponentsByBlend = (blendId) =>
  api.get(`/blend-components?blend_id=${blendId}`);
export const getBlendComponent = (id) => api.get(`/blend-components/${id}`);
export const createBlendComponent = (data) =>
  api.post("/blend-components", data);
export const updateBlendComponent = (id, data) =>
  api.put(`/blend-components/${id}`, data);
export const deleteBlendComponent = (id) =>
  api.delete(`/blend-components/${id}`);

export const getLocations = () => api.get("/locations");
export const getLocation = (id) => api.get(`/locations/${id}`);
export const createLocation = (data) => api.post("/locations", data);
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);

export const getCounterParties = () => api.get("/counter-parties");
export const getCounterParty = (id) => api.get(`/counter-parties/${id}`);
export const createCounterParty = (data) => api.post("/counter-parties", data);
export const updateCounterParty = (id, data) =>
  api.put(`/counter-parties/${id}`, data);
export const deleteCounterParty = (id) => api.delete(`/counter-parties/${id}`);

export const getCapacity = () => api.get("/capacity");
export const getCapacityItem = (id) => api.get(`/capacity/${id}`);
export const createCapacity = (data) => api.post("/capacity", data);
export const updateCapacity = (id, data) => api.put(`/capacity/${id}`, data);
export const deleteCapacity = (id) => api.delete(`/capacity/${id}`);

// Dependent Data Lookup APIs
export const getCommodityDetails = (id) =>
  api.get(`/commodities/${id}/details`);
export const getLocationDetails = (id) => api.get(`/locations/${id}/details`);

// Validation APIs
export const validateCapacity = (data) => api.post("/capacity/validate", data);
export const validateBlendProportion = (blendId) =>
  api.post(`/blend-components/validate-proportion?blend_id=${blendId}`);

// Export APIs
export const exportCommodities = () =>
  api.get("/export/commodities", { responseType: "blob" });
export const exportCapacity = () =>
  api.get("/export/capacity", { responseType: "blob" });
export const exportBlends = () =>
  api.get("/export/blends", { responseType: "blob" });
export const exportBlendComponents = () =>
  api.get("/export/blend-components", { responseType: "blob" });
export const exportUOMs = () =>
  api.get("/export/uoms", { responseType: "blob" });
export const exportLocations = () =>
  api.get("/export/locations", { responseType: "blob" });
export const exportCounterParties = () =>
  api.get("/export/counter-parties", { responseType: "blob" });

// Import APIs
export const importCapacity = (formData) =>
  api.post("/import/capacity", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const importBlends = (formData) =>
  api.post("/import/blends", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Generic Import API (for all entities)
export const importEntity = (entityKey, formData) =>
  api.post(`/import/${entityKey}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Template Download APIs
export const downloadTemplate = (entityKey) =>
  api.get(`/template/${entityKey}`, { responseType: "blob" });

// Convenience methods for specific entities
export const importCommodities = (formData) =>
  importEntity("commodities", formData);
export const importUOMs = (formData) => importEntity("uoms", formData);
export const importLocations = (formData) =>
  importEntity("locations", formData);
export const importCounterParties = (formData) =>
  importEntity("counter_parties", formData);
export const importBlendComponents = (formData) =>
  importEntity("blend_components", formData);

export default api;
