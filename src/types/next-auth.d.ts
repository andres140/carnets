import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nombreCompleto: string;
      tipoUsuario: string;
      rolId: string;
      rolNombre: string;
      regionalId: string | null;
      centroId: string | null;
      permisos: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    nombreCompleto: string;
    tipoUsuario: string;
    rolId: string;
    rolNombre: string;
    regionalId: string | null;
    centroId: string | null;
    permisos: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nombreCompleto: string;
    tipoUsuario: string;
    rolId: string;
    rolNombre: string;
    regionalId: string | null;
    centroId: string | null;
    permisos: string[];
  }
}
