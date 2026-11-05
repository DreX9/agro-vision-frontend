import { z } from 'zod';

/**
 * @description Esquema de validación Zod para registro de nuevo usuario.
 */
export const crearUsuarioSchema = z.object({
  nombres: z
    .string()
    .min(1, 'Los nombres son requeridos')
    .max(100, 'Los nombres no deben exceder 100 caracteres'),
  apellidos: z
    .string()
    .min(1, 'Los apellidos son requeridos')
    .max(100, 'Los apellidos no deben exceder 100 caracteres'),
  correo: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(4, 'La contraseña debe contener al menos 4 caracteres'),
  rol: z.enum(['ADMINISTRADOR', 'AGRONOMO', 'SUPERVISOR', 'OPERADOR'] as const, {
    message: 'Selecciona un rol válido',
  }),
  sexo: z.enum(['MASCULINO', 'FEMENINO', 'OTRO'] as const).optional(),
  fechaNacimiento: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  codigoEmpleado: z.string().max(50, 'El código no debe exceder 50 caracteres').optional(),
  numeroDocumento: z.string().max(20, 'El documento no debe exceder 20 caracteres').optional(),
  especialidad: z
    .enum([
      'GENERAL',
      'PODADOR',
      'FUMIGADOR_APLICADOR',
      'REGADOR',
      'TRACTORISTA_MAQUINISTA',
      'COSECHADOR',
      'INJERTADOR',
    ] as const)
    .optional(),
  cuadrilla: z.string().max(100, 'La cuadrilla no debe exceder 100 caracteres').optional(),
});

/**
 * @description Esquema de validación Zod para edición de usuario existente (contraseña opcional).
 */
export const editarUsuarioSchema = crearUsuarioSchema.extend({
  password: z
    .string()
    .min(4, 'La contraseña debe contener al menos 4 caracteres')
    .optional()
    .or(z.literal('')),
});

export type CrearUsuarioFormulario = z.infer<typeof crearUsuarioSchema>;
export type EditarUsuarioFormulario = z.infer<typeof editarUsuarioSchema>;
export type UsuarioFormularioValores = EditarUsuarioFormulario;

