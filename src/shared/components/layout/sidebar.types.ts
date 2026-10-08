import React from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarCheck,
  Sprout,
  Activity,
  ScanLine,
  PlusCircle,
  ListTree,
} from 'lucide-react-native';

export interface SubItemNavegacion {
  nombre: string;
  ruta: string;
  icono: React.ComponentType<{ size?: number; color?: string }>;
}

export interface ItemNavegacion {
  nombre: string;
  ruta: string;
  icono: React.ComponentType<{ size?: number; color?: string }>;
  subitems?: SubItemNavegacion[];
}

export const ITEMS_MENU_SIDEBAR: ItemNavegacion[] = [
  { nombre: 'Dashboard', ruta: '/', icono: LayoutDashboard },
  { nombre: 'Usuarios', ruta: '/usuarios', icono: Users },
  {
    nombre: 'Parcelas',
    ruta: '/parcelas',
    icono: MapPin,
    subitems: [
      { nombre: 'Lista de parcelas', ruta: '/parcelas', icono: ListTree },
      { nombre: 'Registrar parcela', ruta: '/parcelas/nuevo', icono: PlusCircle },
      { nombre: 'Registrar cultivo', ruta: '/cultivos/nuevo', icono: Sprout },
    ],
  },
  { nombre: 'Actividades', ruta: '/actividades', icono: CalendarCheck },
  { nombre: 'Cultivos', ruta: '/cultivos', icono: Sprout },
  { nombre: 'Monitoreo', ruta: '/monitoreo', icono: Activity },
  { nombre: 'Diagnósticos', ruta: '/diagnostico', icono: ScanLine },
];
