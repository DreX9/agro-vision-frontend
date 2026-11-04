import { z } from 'zod';

export const actividadTrabajadorSchema = z.object({
  usuarioId: z.string().min(1, 'Debe seleccionar un trabajador'),
  rolEnActividad: z.string().optional(),
  zonaTrabajo: z.string().optional(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  horasAsignadas: z.number().optional(),
});

export const actividadRecursoSchema = z.object({
  insumoId: z.string().min(1, 'Debe seleccionar un insumo o equipo'),
  cantidadEstimada: z.number().positive('La cantidad debe ser mayor a 0'),
  unidadMedida: z.string().min(1, 'La unidad de medida es requerida'),
  dosis: z.string().optional().or(z.literal('')),
  cantidadReal: z.number().optional(),
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
  sectorId: z.string().optional().or(z.literal('')),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  horaInicio: z.string().optional(),
  fechaFin: z.string().optional().or(z.literal('')),
  horaFin: z.string().optional(),
  duracionHoras: z.number().optional(),
  usuarioResponsableId: z.string().optional().or(z.literal('')),
  descripcion: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
  blancoBiologico: z.string().optional().or(z.literal('')),
  metodoAplicacion: z.string().optional().or(z.literal('')),
  diasCarencia: z.number().min(0, 'No puede ser negativo').optional(),
  horasReingreso: z.number().min(0, 'No puede ser negativo').optional(),
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'] as const),
  trabajadores: z.array(actividadTrabajadorSchema),
  recursos: z.array(actividadRecursoSchema),
});

export type ActividadFormValores = z.infer<typeof actividadSchema>;

/**
 * @description Esquema de validación para insumos planificados con cálculo por hectárea.
 */
export const insumoPlanificadoSchema = z.object({
  insumoId: z.string().min(1, 'Debe seleccionar un insumo del catálogo'),
  nombreInsumo: z.string().min(1, 'Nombre del insumo requerido'),
  categoria: z.string(),
  dosisPorHa: z.number().positive('La dosis técnica debe ser mayor a 0'),
  unidadMedida: z.string().min(1, 'La unidad de medida es requerida'),
  totalCalculado: z.number().positive('El cálculo total debe ser mayor a 0'),
  diasCarencia: z.number().min(0).optional().nullable(),
  horasReingreso: z.number().min(0).optional().nullable(),
  notas: z.string().optional().nullable(),
});

export type InsumoPlanificadoValores = z.infer<typeof insumoPlanificadoSchema>;

/**
 * @description Esquema de validación para maquinaria y herramientas requeridas.
 */
export const maquinariaPlanificadaSchema = z.object({
  insumoId: z.string().min(1, 'Debe seleccionar un equipo del catálogo'),
  nombreEquipo: z.string().min(1, 'Nombre del equipo requerido'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  unidadMedida: z.string(),
  notas: z.string().optional().nullable(),
});

export type MaquinariaPlanificadaValores = z.infer<typeof maquinariaPlanificadaSchema>;

/**
 * @description Esquema refactorizado y enfocado para la vista "Programar Actividad" (/actividades/nueva).
 * Elimina la asignación nominal de personas y la selección manual de estado.
 */
export const programarActividadSchema = z.object({
  tipo: z.enum([
    'FERTILIZACION',
    'CONTROL_PLAGAS',
    'RIEGO',
    'PODA',
    'SIEMBRA',
    'COSECHA',
    'DESHIERBE',
    'MANTENIMIENTO',
  ] as const, {
    message: 'Debe seleccionar un tipo de labor válido',
  }),
  parcelaId: z.string().min(1, 'Debe seleccionar una parcela de campo'),
  sectorId: z.string().min(1, 'Debe seleccionar un sector de cultivo'),
  codigo: z.string().optional(),
  titulo: z.string().min(1, 'El identificador generado de la actividad es obligatorio'),
  notasPlanificacion: z.string().optional(),
  fechaInicio: z.string().min(1, 'La fecha programada de inicio es obligatoria'),
  fechaFin: z.string().optional(),
  turno: z.enum(['MANANA', 'TARDE', 'JORNADA_COMPLETA', 'PERSONALIZADO'] as const),
  horasEstimadas: z.number().positive('Las horas estimadas deben ser mayores a 0'),
  usuarioResponsableId: z.string().min(1, 'Debe designar a un Supervisor de Campo responsable'),
  jornalesRequeridos: z.number().int().min(1, 'Debe requerir al menos 1 operario'),
  insumos: z.array(insumoPlanificadoSchema),
  maquinaria: z.array(maquinariaPlanificadaSchema),
});

export type ProgramarActividadValores = z.infer<typeof programarActividadSchema>;

