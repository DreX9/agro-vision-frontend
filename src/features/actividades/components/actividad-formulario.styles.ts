import { StyleSheet } from 'react-native';
import { Palette } from '@/constants/theme';

export const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  contenedor: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  barraTabs: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    alignSelf: 'flex-start',
  },
  botonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botonTabActivo: {
    backgroundColor: '#F0F7ED',
  },
  textoTab: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  textoTabActivo: {
    color: Palette.forestGreen,
    fontWeight: '800',
  },
  badgeTab: {
    backgroundColor: Palette.forestGreen,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  textoBadgeTab: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filaDosColumnasLayout: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  columnaMitad: {
    flex: 1,
  },
  layoutMovil: {
    gap: 16,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 16,
    gap: 14,
    flex: 1,
  },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  bloqueCampo: {
    gap: 6,
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipTipo: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipTipoActivo: {
    backgroundColor: '#EDF4E8',
    borderColor: Palette.forestGreen,
  },
  textoChipTipo: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  textoChipTipoActivo: {
    color: Palette.forestGreen,
    fontWeight: '700',
  },
  filaDosColumnas: {
    flexDirection: 'row',
    gap: 12,
  },
  columna: {
    flex: 1,
  },
  barraAccionesFlotanteWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 50,
  },
  barraAccionesCard: {
    width: '100%',
    maxWidth: 1440,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  grupoBotonesDerecha: {
    flexDirection: 'row',
    gap: 10,
  },
});
