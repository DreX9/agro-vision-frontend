import { z } from 'zod';

export const cultivoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del cultivo es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  nombreCientifico: z
    .string()
    .max(150, 'El nombre científico no puede superar 150 caracteres')
    .optional(),
  variedadesDefault: z.array(z.string()),
  colorHex: z.string(),
  activo: z.boolean(),
});

export type CultivoFormValores = z.infer<typeof cultivoSchema>;
