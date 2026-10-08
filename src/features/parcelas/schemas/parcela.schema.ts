import { z } from 'zod';

export const parcelaSchema = z.object({
  codigo: z
    .string()
    .max(50, 'El código no puede tener más de 50 caracteres')
    .optional()
    .or(z.literal('')),
  nombre: z
    .string()
    .min(1, 'El nombre del lote o parcela es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede tener más de 150 caracteres'),
  areaHectareas: z
    .number()
    .positive('El área debe ser mayor a 0 hectáreas'),
  cultivoId: z
    .string()
    .min(1, 'Debe seleccionar un cultivo del catálogo'),
  variedad: z.string().max(100, 'La variedad no puede superar 100 caracteres').optional(),
  usuarioResponsableId: z.string().optional().or(z.literal('')),
  ubicacion: z.string().max(255, 'La referencia de ubicación no puede superar 255 caracteres').optional(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  estado: z.enum(['ACTIVA', 'EN_PREPARACION', 'EN_DESCANSO', 'COSECHADA', 'INACTIVA'] as const),
  delimitacionGeoJson: z.unknown().optional(),
  latitudCentro: z.number().optional().nullable(),
  longitudCentro: z.number().optional().nullable(),
});

export type ParcelaFormValores = z.infer<typeof parcelaSchema>;
