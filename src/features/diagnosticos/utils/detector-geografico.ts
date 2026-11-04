import {
  extraerPuntosPoligono,
  puntoEnPoligono,
  distanciaEntrePuntosMetros,
  calcularCentroide,
  CoordenadaPunto,
} from '@/shared/utils/geometria';
import { apiClient } from '@/shared/api/api-client';
import { ParcelaItem } from '@/features/parcelas/types/parcela.types';
import { ResumenSectoresParcela, SectorParcelaItem } from '@/features/parcelas/types/sector-parcela.types';

export interface ResultadoDeteccionGeografica {
  tipo: 'DENTRO_SECTOR' | 'DENTRO_PARCELA' | 'CERCANA' | 'FUERA';
  parcelaId?: string;
  parcelaNombre?: string;
  parcelaCodigo?: string;
  sectorId?: string;
  sectorNombre?: string;
  sectorCodigo?: string;
  cultivoNombre?: string;
  variedad?: string;
  distanciaMetros?: number;
  mensaje: string;
}

/**
 * @description Evalúa la ubicación GPS actual del operario frente a la lista de parcelas y sectores
 * del fundo agrícola utilizando algoritmos de ray casting en polígonos geodésicos y proximidad métrica.
 */
export async function detectarUbicacionEnFundo(
  coords: { latitud: number; longitud: number },
  parcelas: ParcelaItem[],
): Promise<ResultadoDeteccionGeografica> {
  if (!coords || !parcelas || parcelas.length === 0) {
    return {
      tipo: 'FUERA',
      mensaje: 'Sin coordenadas o parcelas disponibles para georreferenciación.',
    };
  }

  const puntoOperador: CoordenadaPunto = {
    latitude: coords.latitud,
    longitude: coords.longitud,
  };

  // 1. Evaluar si está dentro del polígono delimitado de alguna parcela
  for (const parcela of parcelas) {
    const verticesParcela = extraerPuntosPoligono(parcela.delimitacionGeoJson);

    let estaDentroParcela = false;
    if (verticesParcela.length >= 3) {
      estaDentroParcela = puntoEnPoligono(puntoOperador, verticesParcela);
    }

    if (estaDentroParcela) {
      // Parcela encontrada. Intentar identificar el sector específico
      try {
        const respuesta = await apiClient.get<ResumenSectoresParcela>(
          `/parcelas/${parcela.id}/sectores`,
        );
        const sectores = respuesta.data?.sectores || [];

        for (const sector of sectores) {
          const verticesSector = extraerPuntosPoligono(sector.delimitacionGeoJson);
          if (verticesSector.length >= 3 && puntoEnPoligono(puntoOperador, verticesSector)) {
            return {
              tipo: 'DENTRO_SECTOR',
              parcelaId: parcela.id,
              parcelaNombre: parcela.nombre,
              parcelaCodigo: parcela.codigo,
              sectorId: sector.id,
              sectorNombre: sector.nombre,
              sectorCodigo: sector.codigo,
              cultivoNombre: sector.cultivoNombre || parcela.cultivoNombre || 'Cultivo General',
              variedad: sector.variedad || parcela.variedad || undefined,
              mensaje: `Dentro del sector ${sector.nombre} (${sector.codigo}) en parcela ${parcela.nombre}.`,
            };
          }
        }

        // Si está dentro de la parcela pero no en un sector delimitado o no hay sectores
        const primerSector = sectores[0];
        return {
          tipo: 'DENTRO_PARCELA',
          parcelaId: parcela.id,
          parcelaNombre: parcela.nombre,
          parcelaCodigo: parcela.codigo,
          sectorId: primerSector?.id,
          sectorNombre: primerSector?.nombre,
          sectorCodigo: primerSector?.codigo,
          cultivoNombre: parcela.cultivoNombre || primerSector?.cultivoNombre || 'Cultivo General',
          variedad: parcela.variedad || primerSector?.variedad || undefined,
          mensaje: `Dentro del perímetro de parcela ${parcela.nombre} (${parcela.codigo}).`,
        };
      } catch {
        // Fallback si falla la consulta de sectores
        return {
          tipo: 'DENTRO_PARCELA',
          parcelaId: parcela.id,
          parcelaNombre: parcela.nombre,
          parcelaCodigo: parcela.codigo,
          cultivoNombre: parcela.cultivoNombre || 'Cultivo General',
          variedad: parcela.variedad || undefined,
          mensaje: `Dentro del perímetro de parcela ${parcela.nombre} (${parcela.codigo}).`,
        };
      }
    }
  }

  // 2. Si no cayó dentro de ningún polígono por ray casting, calcular proximidad por distancias
  let parcelaMasCercana: ParcelaItem | null = null;
  let menorDistancia = Infinity;

  for (const parcela of parcelas) {
    let centro: CoordenadaPunto | null = null;
    const vertices = extraerPuntosPoligono(parcela.delimitacionGeoJson);

    if (vertices.length >= 3) {
      centro = calcularCentroide(vertices);
    }

    if (!centro && parcela.latitudCentro != null && parcela.longitudCentro != null) {
      centro = {
        latitude: Number(parcela.latitudCentro),
        longitude: Number(parcela.longitudCentro),
      };
    }

    if (centro) {
      const dist = distanciaEntrePuntosMetros(puntoOperador, centro);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        parcelaMasCercana = parcela;
      }
    }
  }

  // Si está a menos de 350 metros del centroide de una parcela
  if (parcelaMasCercana && menorDistancia <= 350) {
    const distRedondeada = Math.round(menorDistancia);
    return {
      tipo: 'CERCANA',
      parcelaId: parcelaMasCercana.id,
      parcelaNombre: parcelaMasCercana.nombre,
      parcelaCodigo: parcelaMasCercana.codigo,
      cultivoNombre: parcelaMasCercana.cultivoNombre || 'Cultivo General',
      variedad: parcelaMasCercana.variedad || undefined,
      distanciaMetros: distRedondeada,
      mensaje: `En linde o cercanías de parcela ${parcelaMasCercana.nombre} (~${distRedondeada} m).`,
    };
  }

  // 3. Fuera de los límites conocidos del fundo
  return {
    tipo: 'FUERA',
    mensaje: `Coordenadas (${coords.latitud.toFixed(6)}, ${coords.longitud.toFixed(6)}) fuera de las parcelas registradas.`,
  };
}

