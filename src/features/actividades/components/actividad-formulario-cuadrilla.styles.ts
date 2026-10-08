import { StyleSheet } from 'react-native';
import { Palette } from '@/constants/theme';

export const styles = StyleSheet.create({
  contenedor: {
    gap: 10,
    flex: 1,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  badgeContador: {
    backgroundColor: '#EDF4E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  textoContador: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  subtitulo: {
    fontSize: 12,
    color: '#6B7280',
  },
  filtrosBarra: {
    gap: 8,
    marginTop: 4,
  },
  filaRoles: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chipFiltro: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipFiltroActivo: {
    backgroundColor: '#EDF4E8',
    borderColor: Palette.forestGreen,
  },
  textoChipFiltro: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  textoChipFiltroActivo: {
    color: Palette.forestGreen,
    fontWeight: '700',
  },
  listaScroll: {
    maxHeight: 460,
    marginTop: 6,
  },
  vacioContainer: {
    padding: 24,
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  grillaTrabajadores: {
    gap: 6,
  },
  tarjetaTrabajador: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  tarjetaTrabajadorActiva: {
    borderColor: Palette.forestGreen,
    backgroundColor: '#FAFCF8',
  },
  contenidoTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  casillaVerificacion: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaVerificacionActiva: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAEFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datosUsuario: {
    flex: 1,
  },
  nombreUsuario: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  filaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  textoTelefono: {
    fontSize: 11,
    color: '#6B7280',
  },
  seccionRolLaborCompacta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F4EE',
  },
  etiquetaRolLabor: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 2,
  },
  filaRolesSugeridos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chipRol: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipRolActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoChipRol: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  textoChipRolActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  piePaginacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorLimite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etiquetaLimite: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  botonLimite: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  botonLimiteActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoBotonLimite: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  textoBotonLimiteActivo: {
    color: '#FFFFFF',
  },
  indicadorPaginacion: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  controlesPaginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botonPagina: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  botonPaginaDeshabilitado: {
    opacity: 0.4,
  },
  textoBotonPagina: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
});
