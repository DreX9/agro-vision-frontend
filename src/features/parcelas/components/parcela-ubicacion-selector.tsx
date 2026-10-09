import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Search } from 'lucide-react-native';
import { Select, Input, Boton } from '@/shared/components/ui';
import { DEPARTAMENTOS_PERU } from '@/shared/constants/ubigeo-peru';
import {
  buscarCoordenadasDistrito,
  geocodificarDireccion,
} from '@/shared/utils/geocodificacion';

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
  onDireccionAutocompletada?: (direccion: string) => void;
}

/**
 * @description Selector territorial jerárquico en cascada para los 25 departamentos de Perú
 * con centrado geográfico por distrito y buscador de dirección o fundo exacto.
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
  onDireccionAutocompletada,
}) => {
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState<string | null>(null);

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

  const manejarBusquedaDireccion = async () => {
    if (!textoBusqueda.trim()) return;
    setBuscando(true);
    setMensajeBusqueda(null);

    try {
      const resultado = await geocodificarDireccion(textoBusqueda);
      if (resultado) {
        if (onCentroSugerido) {
          onCentroSugerido({ lat: resultado.lat, lng: resultado.lng }, 17);
        }
        if (onDireccionAutocompletada) {
          onDireccionAutocompletada(textoBusqueda);
        }

        // Si Nominatim devuelve departamento / provincia que coinciden con nuestro catálogo
        if (resultado.departamento) {
          const depMatch = DEPARTAMENTOS_PERU.find(
            (d) => resultado.departamento?.toLowerCase().includes(d.nombre.toLowerCase()) ||
                   d.nombre.toLowerCase().includes(resultado.departamento?.toLowerCase() || ''),
          );
          if (depMatch) {
            onSeleccionarDepartamento(depMatch.nombre);
            if (resultado.provincia) {
              const provMatch = depMatch.provincias.find(
                (p) => resultado.provincia?.toLowerCase().includes(p.nombre.toLowerCase()) ||
                       p.nombre.toLowerCase().includes(resultado.provincia?.toLowerCase() || ''),
              );
              if (provMatch) {
                onSeleccionarProvincia(provMatch.nombre);
                if (resultado.distrito) {
                  const distMatch = provMatch.distritos.find(
                    (dist) => resultado.distrito?.toLowerCase().includes(dist.toLowerCase()) ||
                             dist.toLowerCase().includes(resultado.distrito?.toLowerCase() || ''),
                  );
                  if (distMatch) {
                    onSeleccionarDistrito(distMatch);
                  }
                }
              }
            }
          }
        }
        setMensajeBusqueda('Ubicación localizada en el mapa satelital');
      } else {
        setMensajeBusqueda('No se encontraron coordenadas para la dirección ingresada');
      }
    } finally {
      setBuscando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Buscador de dirección o fundo exacto */}
      <View style={styles.cajaBuscadorDireccion}>
        <Text style={styles.etiquetaBusqueda}>Localizar por Dirección o Fundo</Text>
        <View style={styles.filaBuscador}>
          <View style={styles.inputBuscadorFlex}>
            <Input
              placeholder="Ej. Fundo San Pedro, Imperial, Cañete..."
              value={textoBusqueda}
              onChangeText={setTextoBusqueda}
              onSubmitEditing={manejarBusquedaDireccion}
            />
          </View>
          <Boton
            titulo="Localizar"
            iconoIzquierda={<Search size={15} color="#FFFFFF" />}
            onPress={manejarBusquedaDireccion}
            cargando={buscando}
            disabled={!textoBusqueda.trim()}
          />
        </View>
        {mensajeBusqueda && (
          <Text
            style={[
              styles.textoMensajeBusqueda,
              mensajeBusqueda.includes('No se') ? styles.textoErrorBusqueda : styles.textoExitoBusqueda,
            ]}
          >
            {mensajeBusqueda}
          </Text>
        )}
      </View>

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
  contenedor: { gap: 14 },
  cajaBuscadorDireccion: {
    backgroundColor: '#F7FBF4',
    borderWidth: 1,
    borderColor: '#D7E7D1',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  etiquetaBusqueda: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  filaBuscador: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  inputBuscadorFlex: { flex: 1 },
  textoMensajeBusqueda: { fontSize: 11, fontWeight: '600' },
  textoExitoBusqueda: { color: '#2E7D32' },
  textoErrorBusqueda: { color: '#DC2626' },
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
