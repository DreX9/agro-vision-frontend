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
  Layers,
} from 'lucide-react-native';
import { RolSistema } from '@/shared/constants/roles-permisos';

export interface SubItemNavegacion {
  nombre: string;
  ruta: string;
  icono: React.ComponentType<{ size?: number; color?: string }>;
  rolesPermitidos?: RolSistema[];
}

export interface ItemNavegacion {
  nombre: string;
  ruta: string;
  icono: React.ComponentType<{ size?: number; color?: string }>;
  subitems?: SubItemNavegacion[];
  rolesPermitidos?: RolSistema[];
}

export const ITEMS_MENU_SIDEBAR: ItemNavegacion[] = [
  {
    nombre: 'Dashboard',
    ruta: '/',
    icono: LayoutDashboard,
    rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO', 'SUPERVISOR', 'OPERADOR'],
  },
  {
    nombre: 'Usuarios',
    ruta: '/usuarios',
    icono: Users,
    rolesPermitidos: ['ADMINISTRADOR'],
  },
  {
    nombre: 'Parcelas',
    ruta: '/parcelas',
    icono: MapPin,
    rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO'],
    subitems: [
      {
        nombre: 'Lista de parcelas',
        ruta: '/parcelas',
        icono: ListTree,
        rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO'],
      },
      {
        nombre: 'Registrar parcela',
        ruta: '/parcelas/nuevo',
        icono: PlusCircle,
        rolesPermitidos: ['ADMINISTRADOR'],
      },
      {
        nombre: 'Asignar cultivos',
        ruta: '/parcelas/asignacion-cultivos',
        icono: Layers,
        rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO'],
      },
      {
        nombre: 'Registrar cultivo',
        ruta: '/cultivos/nuevo',
        icono: Sprout,
        rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO'],
      },
    ],
  },
  {
    nombre: 'Actividades',
    ruta: '/actividades',
    icono: CalendarCheck,
    rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO', 'SUPERVISOR'],
  },
  {
    nombre: 'Cultivos',
    ruta: '/cultivos',
    icono: Sprout,
    rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO'],
  },
  {
    nombre: 'Monitoreo',
    ruta: '/monitoreo',
    icono: Activity,
    rolesPermitidos: ['ADMINISTRADOR'],
  },
  {
    nombre: 'Diagnósticos',
    ruta: '/diagnostico',
    icono: ScanLine,
    rolesPermitidos: ['ADMINISTRADOR', 'AGRONOMO', 'SUPERVISOR'],
  },
];

