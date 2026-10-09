import { z } from 'zod';

export const actividadTrabajadorSchema = z.object({
  usuarioId: z.string().min(1, 'Debe seleccionar un trabajador'),
  rolEnActividad: z.string().optional(),
});

export const actividadRecursoSchema = z.object({
  insumoId: z.string().min(1, 'Debe seleccionar un insumo o equipo'),
  cantidadEstimada: z.number().positive('La cantidad debe ser mayor a 0'),
  unidadMedida: z.string().min(1, 'La unidad de medida es requerida'),
  notas: z.string().optional(),
});

export const actividadSchema = z.object({
  codigo: z
    .string()
    .max(50, 'El código no puede tener más de 50 caracteres')
    .optional()
    .or(z.literal('')),
  titulo: z
    .string()
    .min(1, 'El título de la labor es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede superar los 150 caracteres'),
  tipo: z.enum([
    'FERTILIZACION',
    'CONTROL_PLAGAS',
    'RIEGO',
    'PODA',
    'SIEMBRA',
    'COSECHA',
    'DESHIERBE',
    'MANTENIMIENTO',
    'MONITOREO_FITOSANITARIO',
    'AUDITORIA_CALIDAD',
    'SUPERVISION_TECNICA',
    'GESTION_ADMINISTRATIVA',
    'OTRO',
  ] as const),
  parcelaId: z.string().min(1, 'Debe seleccionar una parcela de campo'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().optional().or(z.literal('')),
  usuarioResponsableId: z.string().optional().or(z.literal('')),
  descripcion: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'] as const),
  trabajadores: z.array(actividadTrabajadorSchema),
  recursos: z.array(actividadRecursoSchema),
});

export type ActividadFormValores = z.infer<typeof actividadSchema>;
