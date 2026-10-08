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
  contenedorScroll: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
    maxWidth: 1440,
    alignSelf: 'center',
    width: '100%',
  },
  layoutDosColumnas: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  columnaIzquierda: {
    width: 500,
    maxWidth: '44%',
    gap: 16,
  },
  columnaDerecha: {
    flex: 1,
    minHeight: 680,
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
  },
  tarjetaMapaEscritorio: {
    minHeight: 700,
    flex: 1,
  },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  cabeceraMapa: {
    gap: 4,
  },
  ayudaMapa: {
    fontSize: 12,
    color: '#6B7280',
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
});
