export const TIPOS_USUARIO = [
  "APRENDIZ",
  "INSTRUCTOR",
  "FUNCIONARIO",
  "CONTRATISTA",
  "COORDINADOR",
  "ADMINISTRADOR",
] as const;

export const ESTADOS_CARNET = [
  "ACTIVO",
  "VENCIDO",
  "SUSPENDIDO",
  "REVOCADO",
] as const;

export const ESTADOS_USUARIO = ["ACTIVO", "INACTIVO", "SUSPENDIDO"] as const;

export const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "PA", "PEP"] as const;

export const ESTADO_CARNET_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  VENCIDO: "Vencido",
  SUSPENDIDO: "Suspendido",
  REVOCADO: "Revocado",
};

export const ESTADO_USUARIO_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  SUSPENDIDO: "Suspendido",
};

export const TIPO_USUARIO_LABELS: Record<string, string> = {
  APRENDIZ: "Aprendiz",
  INSTRUCTOR: "Instructor",
  FUNCIONARIO: "Funcionario",
  CONTRATISTA: "Contratista",
  COORDINADOR: "Coordinador",
  ADMINISTRADOR: "Administrador",
};

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
