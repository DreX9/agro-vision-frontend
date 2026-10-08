import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input, Card } from '@/shared/components/ui';
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  UsuarioFormularioValores,
} from '../schemas/crear-usuario.schema';
import { RolUsuarioTipo, SexoUsuarioTipo } from '../types/usuario.types';

export interface UsuarioFormularioProps {
  modo?: 'creacion' | 'edicion';
  valoresIniciales?: Partial<UsuarioFormularioValores>;
  onEnviar: (datos: UsuarioFormularioValores) => void;
  onCancelar: () => void;
  estaCargando: boolean;
  errorMensaje?: string | null;
}

const ROLES: { id: RolUsuarioTipo; nombre: string }[] = [
  { id: 'ADMINISTRADOR', nombre: 'Administrador' },
  { id: 'AGRONOMO', nombre: 'Agrónomo' },
  { id: 'SUPERVISOR', nombre: 'Supervisor' },
  { id: 'OPERADOR', nombre: 'Operador de Campo' },
];

const SEXOS: { id: SexoUsuarioTipo; nombre: string }[] = [
  { id: 'MASCULINO', nombre: 'Masculino' },
  { id: 'FEMENINO', nombre: 'Femenino' },
  { id: 'OTRO', nombre: 'Otro' },
];

/**
 * @description Formulario presentacional modular para registro y edición de usuarios en página dedicada.
 */
export const UsuarioFormulario: React.FC<UsuarioFormularioProps> = ({
  modo = 'creacion',
  valoresIniciales,
  onEnviar,
  onCancelar,
  estaCargando,
  errorMensaje,
}) => {
  const esEdicion = modo === 'edicion';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormularioValores>({
    resolver: zodResolver(esEdicion ? editarUsuarioSchema : crearUsuarioSchema),
    defaultValues: {
      nombres: valoresIniciales?.nombres || '',
      apellidos: valoresIniciales?.apellidos || '',
      correo: valoresIniciales?.correo || '',
      password: '',
      rol: valoresIniciales?.rol || 'ADMINISTRADOR',
      sexo: valoresIniciales?.sexo,
      fechaNacimiento: valoresIniciales?.fechaNacimiento || '',
      telefono: valoresIniciales?.telefono || '',
      direccion: valoresIniciales?.direccion || '',
      departamento: valoresIniciales?.departamento || '',
      provincia: valoresIniciales?.provincia || '',
    },
  });

  useEffect(() => {
    if (valoresIniciales) {
      reset({
        nombres: valoresIniciales.nombres || '',
        apellidos: valoresIniciales.apellidos || '',
        correo: valoresIniciales.correo || '',
        password: '',
        rol: valoresIniciales.rol || 'ADMINISTRADOR',
        sexo: valoresIniciales.sexo,
        fechaNacimiento: valoresIniciales.fechaNacimiento || '',
        telefono: valoresIniciales.telefono || '',
        direccion: valoresIniciales.direccion || '',
        departamento: valoresIniciales.departamento || '',
        provincia: valoresIniciales.provincia || '',
      });
    }
  }, [valoresIniciales, reset]);

  const rolSeleccionado = watch('rol');
  const sexoSeleccionado = watch('sexo');

  return (
    <Card estilo={styles.tarjeta}>
      {errorMensaje && (
        <View style={styles.alertaError}>
          <AlertCircle size={20} color={Palette.error} />
          <Text style={styles.alertaErrorTexto}>{errorMensaje}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sección: Datos de Identidad */}
        <Text style={styles.seccionTitulo}>1. Datos Personales y de Acceso</Text>
        <View style={styles.filaGrid}>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="nombres"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nombres *"
                  placeholder="Ej. Juan Carlos"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nombres?.message}
                />
              )}
            />
          </View>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="apellidos"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Apellidos *"
                  placeholder="Ej. Pérez Gómez"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.apellidos?.message}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.filaGrid}>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="correo"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Correo Electrónico *"
                  placeholder="usuario@agrovision.pe"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.correo?.message}
                />
              )}
            />
          </View>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={esEdicion ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
                  placeholder={esEdicion ? 'Dejar en blanco para conservar actual' : '••••••••'}
                  esPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />
          </View>
        </View>

        {/* Sección: Rol y Sexo */}
        <Text style={styles.seccionTitulo}>2. Rol Funcional y Sexo</Text>
        <View style={styles.filaGrid}>
          <View style={styles.columnaGrid}>
            <Text style={styles.labelCampo}>Rol Asignado *</Text>
            <View style={styles.chipsContenedor}>
              {ROLES.map((r) => {
                const seleccionado = rolSeleccionado === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setValue('rol', r.id, { shouldValidate: true })}
                    style={[styles.chip, seleccionado && styles.chipSeleccionado]}
                  >
                    <Text style={[styles.textoChip, seleccionado && styles.textoChipSeleccionado]}>
                      {r.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.rol && <Text style={styles.errorTexto}>{errors.rol.message}</Text>}
          </View>

          <View style={styles.columnaGrid}>
            <Text style={styles.labelCampo}>Sexo</Text>
            <View style={styles.chipsContenedor}>
              {SEXOS.map((s) => {
                const seleccionado = sexoSeleccionado === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setValue('sexo', s.id)}
                    style={[styles.chip, seleccionado && styles.chipSeleccionado]}
                  >
                    <Text style={[styles.textoChip, seleccionado && styles.textoChipSeleccionado]}>
                      {s.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Sección: Contacto */}
        <Text style={styles.seccionTitulo}>3. Información Adicional y Contacto</Text>
        <View style={styles.filaGrid}>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="fechaNacimiento"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Fecha de Nacimiento"
                  placeholder="YYYY-MM-DD (Ej. 1992-05-15)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fechaNacimiento?.message}
                />
              )}
            />
          </View>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="telefono"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Teléfono"
                  placeholder="+51 987654321"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.telefono?.message}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.filaGrid}>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="direccion"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Dirección"
                  placeholder="Carretera Panamericana Sur Km 300"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.direccion?.message}
                />
              )}
            />
          </View>
          <View style={styles.columnaGrid}>
            <Controller
              control={control}
              name="departamento"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Departamento"
                  placeholder="Ica"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.departamento?.message}
                />
              )}
            />
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.accionesFila}>
          <Boton
            titulo="Cancelar y Volver"
            variante="outline"
            onPress={onCancelar}
            disabled={estaCargando}
            estilo={styles.botonCancelar}
          />
          <Boton
            titulo={esEdicion ? 'Guardar Cambios' : 'Registrar Usuario'}
            variante="primario"
            cargando={estaCargando}
            onPress={handleSubmit(onEnviar)}
            estilo={styles.botonGuardar}
          />
        </View>
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    padding: 28,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.forestGreen,
    marginTop: 6,
    marginBottom: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  filaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 6,
  },
  columnaGrid: { flex: 1, minWidth: 260 },
  labelCampo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipsContenedor: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: Palette.border,
    backgroundColor: '#FAF7F0',
  },
  chipSeleccionado: { backgroundColor: Palette.forestGreen, borderColor: Palette.forestGreen },
  textoChip: { fontSize: 13, fontWeight: '600', color: Palette.text },
  textoChipSeleccionado: { color: Palette.white },
  errorTexto: { fontSize: 12, color: Palette.error, marginTop: -8, marginBottom: 12, fontWeight: '500' },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 18,
  },
  alertaErrorTexto: { fontSize: 13, color: Palette.error, fontWeight: '500', flex: 1 },
  accionesFila: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  botonCancelar: { minWidth: 160 },
  botonGuardar: { minWidth: 180 },
});

