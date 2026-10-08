import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import {
  Info,
  Users,
  Calendar,
  MapPin,
  User,
  Package,
  Clock,
  Phone,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui';
import { ActividadDetalle, EstadoActividadTipo } from '../types/actividad.types';

export interface ActividadDetalleTabsProps {
  actividad: ActividadDetalle;
}

/**
 * @description Vista con pestañas (Tabs) para inspeccionar la ficha técnica y la cuadrilla asignada a una actividad.
 */
export const ActividadDetalleTabs: React.FC<ActividadDetalleTabsProps> = ({ actividad }) => {
  const [tabActivo, setTabActivo] = useState<'info' | 'cuadrilla'>('info');

  const obtenerVarianteEstado = (
    estado: EstadoActividadTipo,
  ): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (estado) {
      case 'COMPLETADA':
        return 'exito';
      case 'EN_PROGRESO':
        return 'info';
      case 'PENDIENTE':
        return 'alerta';
      case 'CANCELADA':
        return 'peligro';
      default:
        return 'neutro';
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Selector de pestañas */}
      <View style={styles.barraTabs}>
        <Pressable
          onPress={() => setTabActivo('info')}
          style={[styles.botonTab, tabActivo === 'info' && styles.botonTabActivo]}
        >
          <Info size={16} color={tabActivo === 'info' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'info' && styles.textoTabActivo]}>
            Información General e Insumos
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTabActivo('cuadrilla')}
          style={[styles.botonTab, tabActivo === 'cuadrilla' && styles.botonTabActivo]}
        >
          <Users size={16} color={tabActivo === 'cuadrilla' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'cuadrilla' && styles.textoTabActivo]}>
            Cuadrilla de Trabajadores ({actividad.trabajadores.length})
          </Text>
        </Pressable>
      </View>

      {/* Contenido según pestaña */}
      <ScrollView contentContainerStyle={styles.contenidoScroll} showsVerticalScrollIndicator={false}>
        {tabActivo === 'info' ? (
          <View style={styles.bloqueTab}>
            {/* Cabecera de la labor */}
            <View style={styles.tarjetaFicha}>
              <View style={styles.cabeceraFicha}>
                <View>
                  <Text style={styles.codigoLabor}>{actividad.codigo}</Text>
                  <Text style={styles.tituloLabor}>{actividad.titulo}</Text>
                </View>
                <Badge
                  texto={actividad.estado}
                  variante={obtenerVarianteEstado(actividad.estado)}
                />
              </View>

              <View style={styles.grillaMetadatos}>
                <View style={styles.itemMeta}>
                  <MapPin size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Parcela y Cultivo</Text>
                    <Text style={styles.valorMeta}>
                      {actividad.parcelaNombre || 'Parcela'} {actividad.cultivoNombre ? `(${actividad.cultivoNombre})` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <User size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Responsable Técnico</Text>
                    <Text style={styles.valorMeta}>
                      {actividad.usuarioResponsableNombre || 'Sin asignar'}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Calendar size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Fecha de Inicio</Text>
                    <Text style={styles.valorMeta}>
                      {new Date(actividad.fechaInicio).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Clock size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Fecha Fin / Límite</Text>
                    <Text style={styles.valorMeta}>
                      {actividad.fechaFin
                        ? new Date(actividad.fechaFin).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'No especificada'}
                    </Text>
                  </View>
                </View>
              </View>

              {actividad.descripcion ? (
                <View style={styles.cajaTexto}>
                  <Text style={styles.subtituloTexto}>Descripción:</Text>
                  <Text style={styles.cuerpoTexto}>{actividad.descripcion}</Text>
                </View>
              ) : null}

              {actividad.observaciones ? (
                <View style={styles.cajaTexto}>
                  <Text style={styles.subtituloTexto}>Observaciones agronómicas:</Text>
                  <Text style={styles.cuerpoTexto}>{actividad.observaciones}</Text>
                </View>
              ) : null}
            </View>

            {/* Insumos y Recursos */}
            <View style={styles.tarjetaFicha}>
              <Text style={styles.tituloSeccion}>Insumos y Equipos Requeridos</Text>
              {actividad.recursos.length === 0 ? (
                <Text style={styles.textoVacio}>No se planificaron insumos para esta labor.</Text>
              ) : (
                <View style={styles.listaRecursos}>
                  {actividad.recursos.map((r) => (
                    <View key={r.id} style={styles.filaRecurso}>
                      <View style={styles.iconoRecurso}>
                        <Package size={16} color={Palette.forestGreen} />
                      </View>
                      <View style={styles.infoRecurso}>
                        <Text style={styles.nombreRecurso}>{r.nombreInsumo}</Text>
                        <Text style={styles.categoriaRecurso}>{r.categoriaInsumo}</Text>
                      </View>
                      <View style={styles.badgeCantidad}>
                        <Text style={styles.textoCantidad}>
                          {r.cantidadEstimada} {r.unidadMedida}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Tab Cuadrilla */
          <View style={styles.bloqueTab}>
            <View style={styles.tarjetaFicha}>
              <Text style={styles.tituloSeccion}>Personal y Operarios Asignados</Text>
              {actividad.trabajadores.length === 0 ? (
                <Text style={styles.textoVacio}>No se han asignado trabajadores a esta actividad.</Text>
              ) : (
                <View style={styles.listaTrabajadores}>
                  {actividad.trabajadores.map((t) => (
                    <View key={t.id} style={styles.tarjetaOperario}>
                      <View style={styles.avatarOperario}>
                        <User size={18} color={Palette.forestGreen} />
                      </View>
                      <View style={styles.detallesOperario}>
                        <Text style={styles.nombreOperario}>
                          {t.nombres} {t.apellidos}
                        </Text>
                        <Text style={styles.rolOperario}>
                          Rol: {t.rolEnActividad || 'Operador de campo'}
                        </Text>
                        {t.telefono ? (
                          <View style={styles.filaTelefono}>
                            <Phone size={12} color="#6B7280" />
                            <Text style={styles.telefonoOperario}>{t.telefono}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  barraTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBDC',
    paddingHorizontal: 16,
  },
  botonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  botonTabActivo: { borderBottomColor: Palette.forestGreen },
  textoTab: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  textoTabActivo: { color: Palette.forestGreen, fontWeight: '800' },
  contenidoScroll: { padding: 16, gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' },
  bloqueTab: { gap: 16 },
  tarjetaFicha: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 18,
    gap: 14,
  },
  cabeceraFicha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codigoLabor: { fontSize: 12, fontWeight: '700', color: Palette.forestGreen },
  tituloLabor: { fontSize: 18, fontWeight: '800', color: '#111827' },
  grillaMetadatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F4EC',
  },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220 },
  etiquetaMeta: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  valorMeta: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  cajaTexto: { gap: 4 },
  subtituloTexto: { fontSize: 12, fontWeight: '700', color: '#374151' },
  cuerpoTexto: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  tituloSeccion: { fontSize: 15, fontWeight: '800', color: Palette.forestGreen },
  textoVacio: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  listaRecursos: { gap: 8 },
  filaRecurso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAF8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  iconoRecurso: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRecurso: { flex: 1 },
  nombreRecurso: { fontSize: 13, fontWeight: '700', color: '#111827' },
  categoriaRecurso: { fontSize: 11, color: '#6B7280' },
  badgeCantidad: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0DEC8',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textoCantidad: { fontSize: 12, fontWeight: '700', color: Palette.forestGreen },
  listaTrabajadores: { gap: 10 },
  tarjetaOperario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAF8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarOperario: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAEFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detallesOperario: { flex: 1 },
  nombreOperario: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  rolOperario: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
  filaTelefono: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  telefonoOperario: { fontSize: 11, color: '#6B7280' },
});
