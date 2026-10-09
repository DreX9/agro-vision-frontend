import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';

export interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  elementosPorPagina: number;
  opcionesLimite?: number[];
  onCambiarPagina: (nuevaPagina: number) => void;
  onCambiarLimite?: (nuevoLimite: number) => void;
}

const LIMITES_ESTANDAR = [10, 20, 30];

/**
 * @description Componente global estandarizado de paginación con selector de límites (10, 20, 30), botones numéricos y controles de salto.
 */
export const Paginacion: React.FC<PaginacionProps> = ({
  paginaActual,
  totalPaginas,
  totalElementos,
  elementosPorPagina,
  opcionesLimite = LIMITES_ESTANDAR,
  onCambiarPagina,
  onCambiarLimite,
}) => {
  const inicio = totalElementos > 0 ? (paginaActual - 1) * elementosPorPagina + 1 : 0;
  const fin = Math.min(paginaActual * elementosPorPagina, totalElementos);

  const puedeAvanzar = paginaActual < totalPaginas;
  const puedeRetroceder = paginaActual > 1;

  const generarNumerosPagina = () => {
    const paginas: number[] = [];
    const maxBotones = 5;
    let inicioRango = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let finRango = Math.min(totalPaginas, inicioRango + maxBotones - 1);

    if (finRango - inicioRango + 1 < maxBotones) {
      inicioRango = Math.max(1, finRango - maxBotones + 1);
    }

    for (let i = inicioRango; i <= finRango; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  const numerosPagina = totalPaginas > 1 ? generarNumerosPagina() : [1];

  return (
    <View style={styles.contenedor}>
      {/* Selector de Límite por Página */}
      <View style={styles.seccionLimite}>
        <Text style={styles.etiquetaLimite}>Mostrar:</Text>
        <View style={styles.grupoBotonesLimite}>
          {opcionesLimite.map((limite) => {
            const activo = elementosPorPagina === limite;
            return (
              <Pressable
                key={limite}
                onPress={() => onCambiarLimite && onCambiarLimite(limite)}
                style={({ pressed }) => [
                  styles.botonChipLimite,
                  activo && styles.botonChipLimiteActivo,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Text style={[styles.textoChipLimite, activo && styles.textoChipLimiteActivo]}>
                  {limite}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.etiquetaLimite}>por pág.</Text>
      </View>

      {/* Resumen de Registros */}
      <View style={styles.seccionResumen}>
        <Text style={styles.resumenTexto}>
          Mostrando <Text style={styles.resumenBold}>{inicio}-{fin}</Text> de{' '}
          <Text style={styles.resumenBold}>{totalElementos}</Text> registros
        </Text>
      </View>

      {/* Controles de Navegación con Botones Numéricos */}
      <View style={styles.controles}>
        {/* Ir a la Primera Página */}
        <Pressable
          disabled={!puedeRetroceder}
          onPress={() => onCambiarPagina(1)}
          style={({ pressed }) => [
            styles.botonCuadrado,
            !puedeRetroceder && styles.botonDeshabilitado,
            pressed && styles.botonPresionado,
          ]}
        >
          <ChevronsLeft size={16} color={puedeRetroceder ? Palette.text : '#CBD5E1'} />
        </Pressable>

        {/* Página Anterior */}
        <Pressable
          disabled={!puedeRetroceder}
          onPress={() => onCambiarPagina(paginaActual - 1)}
          style={({ pressed }) => [
            styles.botonCuadrado,
            !puedeRetroceder && styles.botonDeshabilitado,
            pressed && styles.botonPresionado,
          ]}
        >
          <ChevronLeft size={16} color={puedeRetroceder ? Palette.text : '#CBD5E1'} />
        </Pressable>

        {/* Botones de Páginas Numéricas */}
        <View style={styles.grupoNumeros}>
          {numerosPagina.map((num) => {
            const esActual = num === paginaActual;
            return (
              <Pressable
                key={num}
                onPress={() => onCambiarPagina(num)}
                style={({ pressed }) => [
                  styles.botonNumero,
                  esActual && styles.botonNumeroActivo,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Text style={[styles.textoNumero, esActual && styles.textoNumeroActivo]}>
                  {num}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Página Siguiente */}
        <Pressable
          disabled={!puedeAvanzar}
          onPress={() => onCambiarPagina(paginaActual + 1)}
          style={({ pressed }) => [
            styles.botonCuadrado,
            !puedeAvanzar && styles.botonDeshabilitado,
            pressed && styles.botonPresionado,
          ]}
        >
          <ChevronRight size={16} color={puedeAvanzar ? Palette.text : '#CBD5E1'} />
        </Pressable>

        {/* Ir a la Última Página */}
        <Pressable
          disabled={!puedeAvanzar}
          onPress={() => onCambiarPagina(totalPaginas)}
          style={({ pressed }) => [
            styles.botonCuadrado,
            !puedeAvanzar && styles.botonDeshabilitado,
            pressed && styles.botonPresionado,
          ]}
        >
          <ChevronsRight size={16} color={puedeAvanzar ? Palette.text : '#CBD5E1'} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Palette.white,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 12,
  },
  seccionLimite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etiquetaLimite: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  grupoBotonesLimite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3EFE6',
    padding: 3,
    borderRadius: 8,
  },
  botonChipLimite: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  botonChipLimiteActivo: {
    backgroundColor: Palette.forestGreen,
  },
  textoChipLimite: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.text,
  },
  textoChipLimiteActivo: {
    color: Palette.white,
  },
  seccionResumen: {
    alignItems: 'center',
  },
  resumenTexto: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  resumenBold: {
    fontWeight: '700',
    color: Palette.text,
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grupoNumeros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  botonCuadrado: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonNumero: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonNumeroActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoNumero: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  textoNumeroActivo: {
    color: Palette.white,
    fontWeight: '700',
  },
  botonDeshabilitado: {
    opacity: 0.4,
    backgroundColor: '#F8FAFC',
  },
  botonPresionado: {
    opacity: 0.75,
  },
});


