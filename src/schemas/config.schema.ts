import { z } from "zod";

export const regionalSchema = z.object({
  codigo: z.string().min(2).max(10),
  nombre: z.string().min(3).max(200),
  activo: z.boolean().optional(),
});

export const centroSchema = z.object({
  regionalId: z.string().min(1),
  codigo: z.string().min(2).max(20),
  nombre: z.string().min(3).max(200),
  activo: z.boolean().optional(),
});

export type RegionalInput = z.infer<typeof regionalSchema>;
export type CentroInput = z.infer<typeof centroSchema>;
