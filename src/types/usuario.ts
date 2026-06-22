import type { TipoUsuario, EstadoCarnet, EstadoUsuario } from "@/generated/prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  nombreCompleto: string;
  tipoUsuario: TipoUsuario;
  rolId: string;
  rolNombre: string;
  regionalId: string | null;
  centroId: string | null;
  permisos: string[];
}

export interface UsuarioListItem {
  id: string;
  email: string;
  documento: string;
  nombreCompleto: string;
  tipoUsuario: TipoUsuario;
  estado: EstadoUsuario;
  fotoUrl: string | null;
  regionalNombre: string | null;
  centroNombre: string | null;
  createdAt: string;
}

export interface UsuarioDetail extends UsuarioListItem {
  tipoDocumento: string;
  telefono: string | null;
  rolId: string;
  rolNombre: string;
  regionalId: string | null;
  centroId: string | null;
  dependenciaId: string | null;
}
