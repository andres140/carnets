import { z } from "zod";
import { TIPOS_USUARIO, ESTADOS_USUARIO, TIPOS_DOCUMENTO } from "@/lib/constants";

export const createUsuarioSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rolId: z.string().min(1, "Rol requerido"),
  tipoUsuario: z.enum(TIPOS_USUARIO),
  documento: z.string().min(5, "Documento inválido").max(50),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO),
  nombreCompleto: z.string().min(3, "Nombre requerido").max(300),
  regionalId: z.string().optional().nullable(),
  centroId: z.string().optional().nullable(),
  dependenciaId: z.string().optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  fotoUrl: z.string().optional().nullable(),
});

export const updateUsuarioSchema = createUsuarioSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(8).optional(),
    estado: z.enum(ESTADOS_USUARIO).optional(),
  });

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
