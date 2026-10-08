import { z } from 'zod';

/**
 * @description Esquema de validación estricto para el formulario de inicio de sesión.
 */
export const iniciarSesionSchema = z.object({
  correo: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido (ej. admin@santaelena.pe)'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(4, 'La contraseña debe contener al menos 4 caracteres'),
  recordarSesion: z.boolean(),
});

export type IniciarSesionFormulario = z.infer<typeof iniciarSesionSchema>;
