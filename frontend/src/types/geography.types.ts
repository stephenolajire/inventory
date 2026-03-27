// src/types/geography.types.ts

export interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  is_active: boolean;
}

export interface State {
  id: string;
  name: string;
  code: string;
  country: string;
}

export interface LGA {
  id: string;
  name: string;
  state: string;
}

export interface StateWithLGAs extends State {
  lgas: LGA[];
}

export interface GeographyFilters {
  country?: string;
  state?: string;
  search?: string;
}

export interface GeographyStats {
  total_countries: number;
  active_countries: number;
  total_states: number;
  total_lgas: number;
  top_states_by_vendors: {
    state: string;
    vendor_count: number;
  }[];
  top_lgas_by_vendors: {
    lga: string;
    state: string;
    vendor_count: number;
  }[];
}
