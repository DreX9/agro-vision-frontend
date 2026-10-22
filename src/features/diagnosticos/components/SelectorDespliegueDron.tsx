import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Navigation,
  MapPin,
  Leaf,
  Radio,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Card } from '@/shared/components/ui/card';
import { Select } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useSectoresPorParcelaQuery } from '@/features/parcelas/api/sectores.api';
import { DespliegueDronConfig } from '../types/diagnostico.types';
import { abrirGoogleMaps } from '../utils/geolocalizacion';

export interface SelectorDespliegueDronProps {
  despliegue: DespliegueDronConfig | null;
  onDespliegueChange: (config: DespliegueDronConfig | null) => void;
}

/**
 * @description Panel previo a la cámara para seleccionar la Parcela / Sector
 * donde se enviará el dron para la misión de monitoreo fitosanitario.
 */
export const SelectorDespliegueDron: React.FC<SelectorDespliegueDronProps> = ({
  despliegue,
  onDespliegueChange,
}) => {
  const [parcelaId, setParcelaId] = useState<string>(despliegue?.parcelaId || '');
  const [sectorId, setSectorId] = useState<string>(despliegue?.sectorId || '');

  // Cargar parcelas disponibles en la finca
  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const parcelas = datosParcelas?.items || [];

  // Cargar sectores de la parcela seleccionada
  const { data: datosSectores, isLoading: cargandoSectores } = useSectoresPorParcelaQuery(
    parcelaId || undefined,
  );
  const sectores = datosSectores?.sectores || [];

  const parcelaActiva = parcelas.find((p) => p.id === parcelaId);
  const sectorActivo = sectores.find((s) => s.id === sectorId);

  // Sincronizar configuración de despliegue al cambiar parcela o sector
  useEffect(() => {
    if (!parcelaId || !parcelaActiva) {
      if (despliegue !== null) onDespliegueChange(null);
      return;
    }

    // Coordenadas base de la parcela / sector
    const latitud =
      sectorActivo?.latitudCentro ??
      parcelaActiva.latitudCentro ??
      -11.947138;
    const longitud =
      sectorActivo?.longitudCentro ??
      parcelaActiva.longitudCentro ??
      -76.975346;

    const cultivoNombre =
      sectorActivo?.cultivoNombre ??
      parcelaActiva.cultivoNombre ??
      'Cultivo General';
    const cultivoVariedad =
      sectorActivo?.variedad ??
      parcelaActiva.variedad ??
      undefined;

    onDespliegueChange({
      parcelaId: parcelaActiva.id,
      parcelaNombre: parcelaActiva.nombre,
      parcelaCodigo: parcelaActiva.codigo,
      sectorId: sectorActivo?.id,
      sectorNombre: sectorActivo?.nombre,
      sectorCodigo: sectorActivo?.codigo,
      cultivoNombre,
      cultivoVariedad,
      latitud: Number(latitud),
      longitud: Number(longitud),
    });
  }, [parcelaId, sectorId, parcelaActiva, sectorActivo]);

  const handleCambiarParcela = (nuevaParcelaId: string) => {
    setParcelaId(nuevaParcelaId);
    setSectorId('');
  };

  const opcionesParcelas = parcelas.map((p) => ({
    label: `${p.codigo} - ${p.nombre} (${p.areaHectareas} ha)`,
    valor: p.id,
  }));

  const opcionesSectores = [
    { label: 'Toda la parcela (Vuelo general)', valor: '' },
    ...sectores.map((s) => ({
      label: `${s.codigo} - ${s.nombre} (${s.cultivoNombre || 'Cultivo'}${s.variedad ? ` - ${s.variedad}` : ''})`,
      valor: s.id,
    })),
  ];

  return (
    <Card estilo={styles.contenedor}>
      {/* Cabecera del Panel */}
      <View style={styles.filaEncabezado}>
        <View style={styles.iconoEncabezado}>
          <Navigation size={20} color="#FFFFFF" />
        </View>
        <View style={styles.textosEncabezado}>
          <View style={styles.filaTitulo}>
            <Text style={styles.titulo}>Punto de Despliegue y Vuelo del Dron</Text>
            <Badge texto="MISIÓN DE VUELO" variante="exito" />
          </View>
          <Text style={styles.subtitulo}>
            Selecciona la parcela y sector donde se enviará el dron para realizar la inspección y registrar los hallazgos fitosanitarios.
          </Text>
        </View>
      </View>

      {/* Selectores de Parcela y Sector */}
      <View style={styles.grillaSelectores}>
        <View style={styles.columnaSelector}>
          <Select
            label="Parcela de Monitoreo *"
            placeholder={cargandoParcelas ? 'Cargando parcelas...' : 'Seleccione una parcela'}
            opciones={opcionesParcelas}
            valor={parcelaId}
            onChange={handleCambiarParcela}
          />
        </View>

        <View style={styles.columnaSelector}>
          <Select
            label="Zona de Cultivo / Sector (Opcional)"
            placeholder={
              !parcelaId
                ? 'Primero elija una parcela'
                : cargandoSectores
                ? 'Cargando sectores...'
                : sectores.length === 0
                ? 'Sin sectores asignados'
                : 'Seleccione el sector de cultivo'
            }
            opciones={opcionesSectores}
            valor={sectorId}
            deshabilitado={!parcelaId || cargandoSectores || sectores.length === 0}
            onChange={setSectorId}
          />
        </View>
      </View>

      {/* Ficha de Telemetría Activa del Vuelo */}
      {despliegue ? (
        <View style={styles.tarjetaTelemetria}>
          <View style={styles.filaTelemetriaCabecera}>
            <View style={styles.badgeRadio}>
              <Radio size={14} color="#15803D" />
              <Text style={styles.textoBadgeRadio}>DRON ENLAZADO A LA PARCELA</Text>
            </View>
            <Text style={styles.textoSensor}>Cámara Inalámbrica: Irium Webcam</Text>
          </View>

          <View style={styles.grillaDatosTelemetria}>
            <View style={styles.itemDato}>
              <View style={styles.iconoDato}>
                <MapPin size={16} color={Palette.forestGreen} />
              </View>
              <View>
                <Text style={styles.etiquetaDato}>Área de Misión</Text>
                <Text style={styles.valorDato} numberOfLines={1}>
                  {despliegue.parcelaNombre}
                  {despliegue.sectorNombre ? ` > ${despliegue.sectorNombre}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.itemDato}>
              <View style={styles.iconoDato}>
                <Leaf size={16} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.etiquetaDato}>Cultivo Monitoreado</Text>
                <Text style={styles.valorDato} numberOfLines={1}>
                  {despliegue.cultivoNombre}
                  {despliegue.cultivoVariedad ? ` (${despliegue.cultivoVariedad})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.itemDato}>
              <View style={styles.iconoDato}>
                <Navigation size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.etiquetaDato}>Coordenadas de Referencia</Text>
                <View style={styles.filaCoordenadasConLink}>
                  <Text style={styles.valorCoordenadas}>
                    Lat: {despliegue.latitud.toFixed(6)}°, Lon: {despliegue.longitud.toFixed(6)}°
                  </Text>
                  <Pressable
                    onPress={() => abrirGoogleMaps(despliegue.latitud, despliegue.longitud)}
                    style={({ pressed }) => [
                      styles.botonMaps,
                      pressed && styles.botonMapsPresionado,
                    ]}
                  >
                    <ExternalLink size={12} color="#0284C7" />
                    <Text style={styles.textoBotonMaps}>Ver en Maps</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.bannerInfo}>
          <Info size={18} color="#0284C7" />
          <Text style={styles.textoBannerInfo}>
            Selecciona una parcela para desplegar el dron y habilitar la vinculación de los diagnósticos.
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 18,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filaEncabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconoEncabezado: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Palette.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textosEncabezado: {
    flex: 1,
    gap: 4,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitulo: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  grillaSelectores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  columnaSelector: {
    flex: 1,
    minWidth: 260,
  },
  tarjetaTelemetria: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  filaTelemetriaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeRadio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  textoBadgeRadio: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#15803D',
  },
  textoSensor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  grillaDatosTelemetria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemDato: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconoDato: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  etiquetaDato: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  valorDato: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  filaCoordenadasConLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  valorCoordenadas: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    fontFamily: 'monospace',
  },
  botonMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  botonMapsPresionado: {
    opacity: 0.8,
  },
  textoBotonMaps: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
  },
  textoBannerInfo: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
});
