export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReporteResumen {
  carnetsPorEstado: Record<string, number>;
  carnetsPorCentro: Array<{ centro: string; total: number }>;
  carnetsPorTipo: Record<string, number>;
  proximosVencimientos: number;
  totalUsuarios: number;
  totalCarnets: number;
}
