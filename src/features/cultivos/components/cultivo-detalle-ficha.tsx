import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Sprout,
  BookOpen,
  Calendar,
  Palette as PaletteIcon,
  Layers,
  CheckCircle2,
  Tag,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui';
import { CultivoItem } from '../types/cultivo.types';

export interface CultivoDetalleFichaProps {
  cultivo: CultivoItem;
}

/**
 * @description Vista estructurada y estilizada para la inspección técnica de un cultivo del catálogo.
 */
export const CultivoDetalleFicha: React.FC<CultivoDetalleFichaProps> = ({ cultivo }) => {
  return (
    <ScrollView contentContainerStyle={styles.contenidoScroll} showsVerticalScrollIndicator={false}>
      {/* Tarjeta Principal de Identificación */}
      <View style={styles.tarjetaFicha}>
        <View style={styles.cabeceraFicha}>
          <View style={styles.filaTitulo}>
            <View
              style={[
                styles.indicadorColor,
                { backgroundColor: cultivo.colorHex || Palette.forestGreen },
              ]}
            />
            <View>
              <Text style={styles.nombreCultivo}>{cultivo.nombre}</Text>
              {cultivo.nombreCientifico ? (
                <Text style={styles.nombreCientifico}>
                  {cultivo.nombreCientifico}
                </Text>
              ) : null}
            </View>
          </View>

          <Badge
            texto={cultivo.activo ? 'Cultivo Activo' : 'Cultivo Inactivo'}
            variante={cultivo.activo ? 'exito' : 'peligro'}
          />
        </View>

        <View style={styles.grillaMetadatos}>
          <View style={styles.itemMeta}>
            <BookOpen size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Nombre Botánico / Científico</Text>
              <Text style={[styles.valorMeta, styles.textoItalica]}>
                {cultivo.nombreCientifico || 'No registrado'}
              </Text>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <PaletteIcon size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Color Distintivo en Mapas</Text>
              <View style={styles.filaColor}>
                <View
                  style={[
                    styles.muestraColor,
                    { backgroundColor: cultivo.colorHex || Palette.forestGreen },
                  ]}
                />
                <Text style={styles.valorMeta}>
                  {cultivo.colorHex ? cultivo.colorHex.toUpperCase() : 'Por defecto (#2E7D32)'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <Layers size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Total de Variedades</Text>
              <Text style={styles.valorMeta}>
                {cultivo.variedadesDefault.length} {cultivo.variedadesDefault.length === 1 ? 'variedad' : 'variedades'}
              </Text>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <Calendar size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Fecha de Creación</Text>
              <Text style={styles.valorMeta}>
                {new Date(cultivo.createdAt).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variedades Comerciales Registradas */}
      <View style={styles.tarjetaFicha}>
        <View style={styles.cabeceraSeccion}>
          <Tag size={16} color={Palette.forestGreen} />
          <Text style={styles.tituloSeccion}>Variedades Comerciales Asociadas</Text>
        </View>

        {cultivo.variedadesDefault.length === 0 ? (
          <Text style={styles.textoVacio}>
            No se han registrado variedades para este cultivo. Se permite especificar cualquier variedad manualmente al delimitar parcelas.
          </Text>
        ) : (
          <View style={styles.contenedorChips}>
            {cultivo.variedadesDefault.map((variedad, index) => (
              <View key={index} style={styles.chipVariedad}>
                <CheckCircle2 size={13} color={Palette.forestGreen} />
                <Text style={styles.textoChip}>{variedad}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Uso Operativo */}
      <View style={styles.tarjetaFicha}>
        <View style={styles.cabeceraSeccion}>
          <Sprout size={16} color={Palette.forestGreen} />
          <Text style={styles.tituloSeccion}>Uso Operativo y Trazabilidad</Text>
        </View>

        <Text style={styles.descripcionOperativa}>
          Este cultivo está disponible para ser asociado a lotes y parcelas durante la delimitación georreferenciada.
          Permite segmentar los registros fitosanitarios, recetas de insumos, cuadrillas de trabajadores y calendarios de labores por especie agronómica.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenidoScroll: { padding: 16, gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' },
  tarjetaFicha: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 18,
    gap: 14,
  },
  cabeceraFicha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicadorColor: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  nombreCultivo: { fontSize: 20, fontWeight: '700', color: '#111827' },
  nombreCientifico: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginTop: 2 },
  grillaMetadatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 200,
    flex: 1,
  },
  etiquetaMeta: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  valorMeta: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  textoItalica: { fontStyle: 'italic' },
  filaColor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  muestraColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloSeccion: { fontSize: 15, fontWeight: '700', color: '#111827' },
  textoVacio: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', paddingVertical: 4 },
  contenedorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipVariedad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F7F2',
    borderWidth: 1,
    borderColor: '#D0DEC8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  textoChip: { fontSize: 13, fontWeight: '600', color: '#273C2C' },
  descripcionOperativa: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
});
