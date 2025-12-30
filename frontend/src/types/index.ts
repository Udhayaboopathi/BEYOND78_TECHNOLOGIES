// Type definitions for all data models

export interface UOM {
  id?: number;
  name: string;
  description?: string;
  type?: string;
  base_conversion?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Commodity {
  id?: number;
  name: string;
  description?: string;
  uom: string;
  density?: number;
  energy_uom?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id?: number;
  name: string;
  type: string;
  description: string;
  parent_contvarcharerpartu_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CounterParty {
  CounterpartyID: number;
  LegalName: string;
  ShortName: string;
  CounterpartyCode: string;
  Country: string;
  Type: string;
  CreditStatus: string;
  CreditLimit: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface Blend {
  id?: number;
  name: string;
  description?: string;
  uom?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlendComponent {
  id?: number;
  blend_id: number;
  commodity_id: number;
  proportion: number;
  created_at?: string;
  updated_at?: string;
  commodity?: Commodity;
  blend?: Blend;
}

export interface Capacity {
  id?: number;
  commodity_id: number;
  location_id: number;
  quantity: number;
  uom_id: number;
  eff_dt_from: string;
  eff_dt_to: string;
  dt_last_modified?: string;
  commodity?: Commodity;
  location?: Location;
  uom?: UOM;
}

// API response types
export interface ImportResult {
  successful?: Array<{
    row: number;
    data: Record<string, any>;
  }>;
  failed?: Array<{
    row: number;
    data: Record<string, any>;
    error: string;
  }>;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  message?: string;
  errors?: Array<{
    row?: number;
    field: string;
    message: string;
    value?: string;
  }>;
}

export interface ApiError {
  detail?: {
    message?: string;
    failed?: Array<{
      row: number;
      data: Record<string, any>;
      error: string;
    }>;
  } | string;
}

// Props interfaces for components
export interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (formData: FormData) => Promise<any>;
  title: string;
  templateColumns?: string[];
}

export interface EnhancedImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (formData: FormData) => Promise<any>;
  onSuccess?: () => void;
  entityKey: string;
  entityName: string;
  templateColumns: string[];
}

export interface ExportButtonProps {
  onExport: () => Promise<any>;
  filename?: string;
  label?: string;
}

// Form data types
export interface CommodityFormData {
  id?: number;
  name: string;
  description: string;
  uom: string;
  density: string | number;
  energy_uom: string;
  is_active: boolean;
}

export interface UOMFormData {
  id?: number;
  name: string;
  description: string;
  type: string;
  base_conversion: string | number;
  is_active: boolean;
}

export interface BlendFormData {
  id?: number;
  name: string;
  description: string;
  uom: string;
  is_active: boolean;
}

export interface LocationFormData {
  id?: number;
  name: string;
  type: string;
  description: string;
  parent_contvarcharerpartu_id: number;
}

export interface CounterPartyFormData {
  CounterpartyID?: number;
  LegalName: string;
  ShortName: string;
  CounterpartyCode: string;
  Country: string;
  Type: string;
  CreditStatus: string;
  CreditLimit: string | number;
}

export interface CapacityFormData {
  id?: number;
  commodity_id: number | string;
  location_id: number | string;
  capacity_value: string | number;
  capacity_uom: string;
  effective_from: string;
  effective_to: string;
}

export interface BlendComponentFormData {
  id?: number;
  blend_id: number | string;
  commodity_id: number | string;
  proportion: string | number;
}
