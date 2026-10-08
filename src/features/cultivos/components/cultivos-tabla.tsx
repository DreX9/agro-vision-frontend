import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Tabla, ColumnaTabla, Paginacion } from '@/shared/components/ui';
import { CultivoItem } from '../types/cultivo.types';
import { CultivosMenuAcciones, PosicionMenu } from './cultivos-menu-acciones';

export interface CultivosTablaProps {
  cultivos: CultivoItem[];
  cargando?: boolean;
  onEditar?: (cultivo: CultivoItem) => void;
  onCambiarEstado?: (cultivo: CultivoItem) => void;
  onEliminar?: (cultivo: CultivoItem) => void;
}

/**
 * @description Tabla con paginación estandarizada y menú de acciones de tres puntos para el catálogo de cultivos.
 */
export const CultivosTabla: React.FC<CultivosTablaProps> = ({
  cultivos,
  cargando = false,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [limitePorPagina, setLimitePorPagina] = useState(10);
  const [cultivoMenu, setCultivoMenu] = useState<CultivoItem | null>(null);
  const [posicionMenu, setPosicionMenu] = useState<PosicionMenu>({ top: 0, left: 0 });
  const [menuVisible, setMenuVisible] = useState(false);

  const totalElementos = cultivos.length;

  const totalPaginas = Math.max(1, Math.ceil(totalElementos / limitePorPagina));

  const cultivosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * limitePorPagina;
    return cultivos.slice(inicio, inicio + limitePorPagina);
  }, [cultivos, paginaActual, limitePorPagina]);

  const abrirMenu = (cultivo: CultivoItem, e: { nativeEvent: { pageX?: number; pageY?: number } }) => {
    const x = e.nativeEvent.pageX || 200;
    const y = e.nativeEvent.pageY || 200;
    setPosicionMenu({
      top: y + 10,
      left: Math.max(10, x - 170),
    });
    setCultivoMenu(cultivo);
    setMenuVisible(true);
  };

  const columnas: ColumnaTabla<CultivoItem>[] = [
    {
      id: 'nombre',
      encabezado: 'Cultivo',
      anchoMinimo: 180,
      render: (c: CultivoItem) => (
        <View style={styles.filaNombre}>
          <View
            style={[
              styles.puntoColor,
              { backgroundColor: c.colorHex || Palette.forestGreen },
            ]}
          />
          <Text style={styles.textoNombre}>{c.nombre}</Text>
        </View>
      ),
    },
    {
      id: 'cientifico',
      encabezado: 'Nombre Científico',
      anchoMinimo: 180,
      render: (c: CultivoItem) => (
        <Text style={styles.textoCientifico}>
          {c.nombreCientifico || 'No especificado'}
        </Text>
      ),
    },
    {
      id: 'variedades',
      encabezado: 'Variedades Registradas',
      anchoMinimo: 240,
      render: (c: CultivoItem) => (
        <View style={styles.contenedorVariedades}>
          {c.variedadesDefault.length > 0 ? (
            c.variedadesDefault.map((v) => (
              <View key={v} style={styles.chipVariedad}>
                <Text style={styles.textoVariedad}>{v}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.textoVacioVariedad}>Sin variedades</Text>
          )}
        </View>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      anchoMinimo: 100,
      render: (c: CultivoItem) => (
        <Badge
          texto={c.activo ? 'Activo' : 'Inactivo'}
          variante={c.activo ? 'exito' : 'peligro'}
        />
      ),
    },
    {
      id: 'acciones',
      encabezado: 'Acciones',
      anchoMinimo: 80,
      render: (c: CultivoItem) => (
        <Pressable
          style={({ pressed }) => [styles.botonAcciones, pressed && styles.botonAccionesPresionado]}
          onPress={(e) => abrirMenu(c, e)}
          hitSlop={8}
        >
          <MoreVertical size={16} color="#6B7280" />
        </Pressable>
      ),
    },
  ];

  return (
    <View style={styles.contenedor}>
      <Tabla
        datos={cultivosPaginados}
        columnas={columnas}
        claveExtractor={(c) => c.id}
        cargando={cargando}
        mensajeVacio="No hay cultivos registrados en el catálogo."
      />

      <Paginacion
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalElementos={totalElementos}
        elementosPorPagina={limitePorPagina}
        onCambiarPagina={setPaginaActual}
        onCambiarLimite={(nuevo: number) => {
          setLimitePorPagina(nuevo);
          setPaginaActual(1);
        }}
      />

      <CultivosMenuAcciones
        cultivo={cultivoMenu}
        posicion={posicionMenu}
        visible={menuVisible}
        onCerrar={() => setMenuVisible(false)}
        onEditar={onEditar}
        onCambiarEstado={onCambiarEstado}
        onEliminar={onEliminar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { gap: 12 },
  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  puntoColor: { width: 12, height: 12, borderRadius: 6 },
  textoNombre: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  textoCientifico: { fontSize: 12, fontStyle: 'italic', color: '#4B5563' },
  contenedorVariedades: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chipVariedad: {
    backgroundColor: '#EDF4E8',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  textoVariedad: { fontSize: 11, color: Palette.forestGreen, fontWeight: '600' },
  textoVacioVariedad: { fontSize: 12, color: '#9CA3AF' },
  botonAcciones: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  botonAccionesPresionado: { backgroundColor: '#E5E7EB' },
});
