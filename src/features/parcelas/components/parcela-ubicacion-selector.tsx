import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Select } from '@/shared/components/ui';
import { DEPARTAMENTOS_PERU } from '@/shared/constants/ubigeo-peru';
import { buscarCoordenadasDistrito } from '@/shared/utils/geocodificacion';

export interface ParcelaUbicacionSelectorProps {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  errorDepartamento?: string;
  errorProvincia?: string;
  errorDistrito?: string;
  onSeleccionarDepartamento: (dep: string) => void;
  onSeleccionarProvincia: (prov: string) => void;
  onSeleccionarDistrito: (dist: string) => void;
  onCentroSugerido?: (centro: { lat: number; lng: number }, zoom?: number) => void;
}

/**
 * @description Selector territorial jerárquico en cascada para los 25 departamentos de Perú
 * con centrado geográfico automático por distrito en el mapa satelital.
 */
export const ParcelaUbicacionSelector: React.FC<ParcelaUbicacionSelectorProps> = ({
  departamento = '',
  provincia = '',
  distrito = '',
  errorDepartamento,
  errorProvincia,
  errorDistrito,
  onSeleccionarDepartamento,
  onSeleccionarProvincia,
  onSeleccionarDistrito,
  onCentroSugerido,
}) => {
  const opcionesDepartamentos = useMemo(() => {
    return DEPARTAMENTOS_PERU.map((d) => ({
      label: d.nombre,
      valor: d.nombre,
    }));
  }, []);

  const deptoSeleccionado = useMemo(() => {
    return DEPARTAMENTOS_PERU.find((d) => d.nombre.toLowerCase() === departamento.toLowerCase());
  }, [departamento]);

  const opcionesProvincias = useMemo(() => {
    if (!deptoSeleccionado) return [];
    return deptoSeleccionado.provincias.map((p) => ({
      label: p.nombre,
      valor: p.nombre,
    }));
  }, [deptoSeleccionado]);

  const provSeleccionada = useMemo(() => {
    if (!deptoSeleccionado) return undefined;
    return deptoSeleccionado.provincias.find(
      (p) => p.nombre.toLowerCase() === provincia.toLowerCase(),
    );
  }, [deptoSeleccionado, provincia]);

  const opcionesDistritos = useMemo(() => {
    if (!provSeleccionada) return [];
    return provSeleccionada.distritos.map((dist) => ({
      label: dist,
      valor: dist,
    }));
  }, [provSeleccionada]);

  const manejarCambioDepartamento = (nuevoDepto: string) => {
    onSeleccionarDepartamento(nuevoDepto);
    onSeleccionarProvincia('');
    onSeleccionarDistrito('');

    const depObj = DEPARTAMENTOS_PERU.find(
      (d) => d.nombre.toLowerCase() === nuevoDepto.toLowerCase(),
    );
    if (depObj && onCentroSugerido) {
      onCentroSugerido(depObj.centro, 11);
    }
  };

  const manejarCambioProvincia = (nuevaProv: string) => {
    onSeleccionarProvincia(nuevaProv);
    onSeleccionarDistrito('');

    if (deptoSeleccionado && onCentroSugerido) {
      const provObj = deptoSeleccionado.provincias.find(
        (p) => p.nombre.toLowerCase() === nuevaProv.toLowerCase(),
      );
      if (provObj?.centro) {
        onCentroSugerido(provObj.centro, 13);
      }
    }
  };

  const manejarCambioDistrito = async (nuevoDist: string) => {
    onSeleccionarDistrito(nuevoDist);

    if (onCentroSugerido && nuevoDist) {
      const coords = await buscarCoordenadasDistrito(nuevoDist, provincia, departamento);
      if (coords) {
        onCentroSugerido(coords, 16);
      }
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Selectores Jerárquicos Departamento -> Provincia -> Distrito */}
      <View style={styles.filaTresColumnas}>
        <View style={styles.columna}>
          <Select
            label="Departamento *"
            placeholder="Seleccione departamento..."
            opciones={opcionesDepartamentos}
            valor={departamento}
            error={errorDepartamento}
            onChange={manejarCambioDepartamento}
          />
        </View>

        <View style={styles.columna}>
          <Select
            label="Provincia *"
            placeholder={departamento ? 'Seleccione provincia...' : 'Primero elija depto.'}
            opciones={opcionesProvincias}
            valor={provincia}
            deshabilitado={!departamento || opcionesProvincias.length === 0}
            error={errorProvincia}
            onChange={manejarCambioProvincia}
          />
        </View>

        <View style={styles.columna}>
          <Select
            label="Distrito *"
            placeholder={provincia ? 'Seleccione distrito...' : 'Primero elija prov.'}
            opciones={opcionesDistritos}
            valor={distrito}
            deshabilitado={!provincia || opcionesDistritos.length === 0}
            error={errorDistrito}
            onChange={manejarCambioDistrito}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { gap: 10 },
  filaTresColumnas: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  columna: {
    flex: 1,
    minWidth: 150,
  },
});
