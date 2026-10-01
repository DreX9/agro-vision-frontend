export type Rol = 'Gerencia' | 'Administrador' | 'Capataz' | 'Evaluador de Campo' | 'Asesor Agronómico';
export type EstadoParcela = 'Activa' | 'En descanso' | 'En preparación' | 'Inactiva';
export type EstadoActividad = 'Pendiente' | 'En progreso' | 'Completada' | 'Cancelada';
export type SeveridadIncidencia = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type EstadoIncidencia = 'Detectada' | 'En evaluación' | 'Validada' | 'En tratamiento' | 'Resuelta' | 'Cerrada';
export type TipoAlerta = 'Fitosanitaria' | 'Ambiental' | 'Operativa';
export type PrioridadAlerta = 'Crítica' | 'Alta' | 'Media' | 'Baja';
export type EstadoAlerta = 'Pendiente' | 'En revisión' | 'Atendida' | 'Resuelta' | 'Descartada';

export interface Parcela {
  id: string;
  codigo: string;
  nombre: string;
  cultivo: string;
  variedad: string;
  area: number;
  estado: EstadoParcela;
  estadoCultivo: 'Normal' | 'Requiere atención' | 'Crítico';
  capataz: string;
  fechaRegistro: string;
  ubicacion: string;
  poligono?: [number, number][];
  incidenciasActivas: number;
  ultimaInspeccion: string;
}

export interface Cultivo {
  id: string;
  nombre: string;
  variedad: string;
  temporada: string;
  cicloMeses: number;
  descripcion: string;
  colorHex: string;
  parcelas: number;
  areaTotal: number;
}

export interface Actividad {
  id: string;
  parcelaId: string;
  parcelaCodigo: string;
  parcelaNombre: string;
  tipo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  responsable: string;
  trabajadores: number;
  descripcion: string;
  insumos: string;
  observaciones: string;
  estado: EstadoActividad;
  costoEstimado: number;
}

export interface Inspeccion {
  id: string;
  parcelaId: string;
  parcelaCodigo: string;
  parcelaNombre: string;
  evaluador: string;
  fecha: string;
  hora: string;
  estadoGeneral: 'Normal' | 'Requiere atención' | 'Crítico';
  zonaAfectada: string;
  observaciones: string;
  fotografias: string[];
  incidenciasGeneradas: number;
  estado: 'Borrador' | 'Completada';
}

export interface Incidencia {
  id: string;
  codigo: string;
  parcelaId: string;
  parcelaCodigo: string;
  parcelaNombre: string;
  cultivo: string;
  tipo: 'Posible plaga' | 'Posible enfermedad' | 'Deficiencia' | 'Anomalía' | 'Otro';
  descripcion: string;
  fotografiaUrl: string;
  nivelPrioridad: SeveridadIncidencia;
  estado: EstadoIncidencia;
  responsable: string;
  observaciones: string;
  fechaDeteccion: string;
  fechaResolucion?: string;
  diasAbierta: number;
  analisisIA?: {
    resultado: string;
    coincidencia: number;
    recomendacion: string;
  };
  historialEstados: { estado: EstadoIncidencia; fecha: string; nota: string }[];
}

export interface RegistroAmbiental {
  id: string;
  parcelaId: string;
  parcelaCodigo: string;
  fecha: string;
  temperatura: number;
  tempMin: number;
  humedad: number;
  precipitacion: number;
  viento: number;
  velocidadViento: number;
  uv: number;
  condicion: string;
  radiacionSolar?: number;
  puntoRocio?: number;
}

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  subtipo: string;
  titulo: string;
  parcelaId: string;
  parcelaCodigo: string;
  parcelaNombre: string;
  descripcion: string;
  prioridad: PrioridadAlerta;
  estado: EstadoAlerta;
  fecha: string;
  atendidaPor?: string;
  accionRecomendada?: string;
  responsable?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  estado: 'Activo' | 'Inactivo';
  activo: boolean;
  telefono: string;
  fechaIngreso: string;
  ultimoAcceso: string;
  parcelasAsignadas?: string[];
}

// ─── PARCELAS ──────────────────────────────────────────────────────────────

export const parcelas: Parcela[] = [
  { id: 'p01', codigo: 'P-001', nombre: 'Lote Norte A', cultivo: 'Palta', variedad: 'Hass', area: 8.5, estado: 'Activa', estadoCultivo: 'Normal', capataz: 'Carlos Mendoza', fechaRegistro: '2022-03-15', ubicacion: 'Sector Norte — Cajamarca', incidenciasActivas: 0, ultimaInspeccion: '2026-09-07' },
  { id: 'p02', codigo: 'P-002', nombre: 'Lote Sur B', cultivo: 'Mandarina', variedad: 'Clementina', area: 6.2, estado: 'Activa', estadoCultivo: 'Requiere atención', capataz: 'Rosa Quispe', fechaRegistro: '2022-05-20', ubicacion: 'Sector Sur — Cajamarca', incidenciasActivas: 1, ultimaInspeccion: '2026-09-06' },
  { id: 'p03', codigo: 'P-003', nombre: 'Bloque Este C', cultivo: 'Arándano', variedad: 'Biloxi', area: 12.0, estado: 'Activa', estadoCultivo: 'Crítico', capataz: 'Carlos Mendoza', fechaRegistro: '2022-09-01', ubicacion: 'Sector Este — Cajamarca', incidenciasActivas: 2, ultimaInspeccion: '2026-09-08' },
  { id: 'p04', codigo: 'P-004', nombre: 'Bloque Oeste D', cultivo: 'Espárrago', variedad: 'UC-157', area: 9.5, estado: 'Activa', estadoCultivo: 'Normal', capataz: 'María Flores', fechaRegistro: '2023-01-10', ubicacion: 'Sector Oeste — Cajamarca', incidenciasActivas: 0, ultimaInspeccion: '2026-09-05' },
  { id: 'p05', codigo: 'P-005', nombre: 'Parcela Central E', cultivo: 'Palta', variedad: 'Hass', area: 15.0, estado: 'Activa', estadoCultivo: 'Requiere atención', capataz: 'Juan Valdera', fechaRegistro: '2023-03-01', ubicacion: 'Sector Central — Cajamarca', incidenciasActivas: 1, ultimaInspeccion: '2026-09-07' },
  { id: 'p06', codigo: 'P-006', nombre: 'Lote F', cultivo: 'Maíz', variedad: 'PM-213', area: 11.0, estado: 'Activa', estadoCultivo: 'Normal', capataz: 'Juan Valdera', fechaRegistro: '2023-07-15', ubicacion: 'Sector Sur — Cajamarca', incidenciasActivas: 0, ultimaInspeccion: '2026-09-04' },
  { id: 'p07', codigo: 'P-007', nombre: 'Bloque G', cultivo: 'Arándano', variedad: 'Ventura', area: 8.0, estado: 'Activa', estadoCultivo: 'Requiere atención', capataz: 'María Flores', fechaRegistro: '2023-04-01', ubicacion: 'Sector Norte — Cajamarca', incidenciasActivas: 1, ultimaInspeccion: '2026-09-06' },
  { id: 'p08', codigo: 'P-008', nombre: 'Lote H — Principal', cultivo: 'Palta', variedad: 'Hass', area: 18.0, estado: 'Activa', estadoCultivo: 'Crítico', capataz: 'Carlos Mendoza', fechaRegistro: '2021-11-20', ubicacion: 'Sector Principal — Cajamarca', incidenciasActivas: 2, ultimaInspeccion: '2026-09-08' },
  { id: 'p09', codigo: 'P-009', nombre: 'Extensión Norte I', cultivo: 'Espárrago', variedad: 'Grande F1', area: 7.5, estado: 'En descanso', estadoCultivo: 'Normal', capataz: 'Rosa Quispe', fechaRegistro: '2022-08-10', ubicacion: 'Extensión Norte — Cajamarca', incidenciasActivas: 0, ultimaInspeccion: '2026-08-20' },
  { id: 'p10', codigo: 'P-010', nombre: 'Parcela Nueva J', cultivo: 'Mandarina', variedad: 'W. Murcott', area: 5.8, estado: 'En preparación', estadoCultivo: 'Normal', capataz: 'Juan Valdera', fechaRegistro: '2026-07-01', ubicacion: 'Sector Sur — Cajamarca', incidenciasActivas: 0, ultimaInspeccion: '—' },
  { id: 'p11', codigo: 'P-011', nombre: 'Lote K', cultivo: 'Arándano', variedad: "O'Neal", area: 10.5, estado: 'Activa', estadoCultivo: 'Normal', capataz: 'María Flores', fechaRegistro: '2023-09-15', ubicacion: 'Sector Este — Cajamarca', incidenciasActivas: 0, ultimaInspeccion: '2026-09-03' },
  { id: 'p12', codigo: 'P-012', nombre: 'Bloque L', cultivo: 'Espárrago', variedad: 'Atlas F1', area: 9.0, estado: 'Activa', estadoCultivo: 'Requiere atención', capataz: 'Carlos Mendoza', fechaRegistro: '2023-02-28', ubicacion: 'Sector Oeste — Cajamarca', incidenciasActivas: 1, ultimaInspeccion: '2026-09-08' },
];

// ─── ACTIVIDADES ────────────────────────────────────────────────────────────

export const actividades: Actividad[] = [
  { id: 'a01', parcelaId: 'p01', parcelaCodigo: 'P-001', parcelaNombre: 'Lote Norte A', tipo: 'Fertilización', fecha: '2026-09-08', horaInicio: '07:00', horaFin: '12:00', responsable: 'Carlos Mendoza', trabajadores: 8, descripcion: 'Aplicación de NPK 20-10-20 mediante fertiriego.', insumos: 'NPK 20-10-20 (50 kg), Quelato de Fe (5 L)', observaciones: 'Condiciones climáticas favorables.', estado: 'En progreso', costoEstimado: 1250 },
  { id: 'a02', parcelaId: 'p04', parcelaCodigo: 'P-004', parcelaNombre: 'Bloque Oeste D', tipo: 'Riego', fecha: '2026-09-08', horaInicio: '06:00', horaFin: '10:00', responsable: 'María Flores', trabajadores: 3, descripcion: 'Turno de riego por gravedad. Dosis 800 m³/ha.', insumos: '', observaciones: 'Sin novedad.', estado: 'Completada', costoEstimado: 320 },
  { id: 'a03', parcelaId: 'p07', parcelaCodigo: 'P-007', parcelaNombre: 'Bloque G', tipo: 'Control Fitosanitario', fecha: '2026-09-07', horaInicio: '08:00', horaFin: '13:00', responsable: 'María Flores', trabajadores: 6, descripcion: 'Aplicación preventiva de fungicida e insecticida.', insumos: 'Captan 50 WP (2 kg), Imidacloprid (1.5 L)', observaciones: 'Segunda aplicación programada en 7 días.', estado: 'Completada', costoEstimado: 980 },
  { id: 'a04', parcelaId: 'p06', parcelaCodigo: 'P-006', parcelaNombre: 'Lote F', tipo: 'Cosecha', fecha: '2026-09-10', horaInicio: '06:00', horaFin: '14:00', responsable: 'Juan Valdera', trabajadores: 25, descripcion: 'Cosecha mecanizada de maíz. Estimado 175 t/ha.', insumos: 'Maquinaria cosechadora', observaciones: 'Coordinar transporte con anterioridad.', estado: 'Pendiente', costoEstimado: 4200 },
  { id: 'a05', parcelaId: 'p03', parcelaCodigo: 'P-003', parcelaNombre: 'Bloque Este C', tipo: 'Poda', fecha: '2026-09-06', horaInicio: '07:00', horaFin: '16:00', responsable: 'Carlos Mendoza', trabajadores: 12, descripcion: 'Poda de formación en plantas de segundo año.', insumos: 'Tijeras de poda, pasta cicatrizante', observaciones: 'Completada sin incidencias.', estado: 'Completada', costoEstimado: 760 },
  { id: 'a06', parcelaId: 'p12', parcelaCodigo: 'P-012', parcelaNombre: 'Bloque L', tipo: 'Fertilización', fecha: '2026-09-09', horaInicio: '07:00', horaFin: '11:00', responsable: 'Carlos Mendoza', trabajadores: 5, descripcion: 'Segunda aplicación de nitrógeno en cobertura.', insumos: 'Urea 46% (80 kg)', observaciones: '', estado: 'Pendiente', costoEstimado: 420 },
];

// ─── INCIDENCIAS ────────────────────────────────────────────────────────────

export const incidencias: Incidencia[] = [
  {
    id: 'inc01', codigo: 'INC-001', parcelaId: 'p08', parcelaCodigo: 'P-008', parcelaNombre: 'Lote H — Principal', cultivo: 'Palta',
    tipo: 'Posible plaga', descripcion: 'Infestación de ácaro rojo (Panonychus ulmi) detectada en hojas jóvenes. Densidad media-alta en cuadrante NE.',
    fotografiaUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
    nivelPrioridad: 'Alta', estado: 'En evaluación', responsable: 'Lucía Sánchez', observaciones: 'Muestra enviada al agrónomo.',
    fechaDeteccion: '2026-09-08', diasAbierta: 0,
    analisisIA: { resultado: 'Posible infestación de ácaro Panonychus ulmi', coincidencia: 84, recomendacion: 'Aplicar acaricida sistémico (abamectina o bifenazate).' },
    historialEstados: [{ estado: 'Detectada', fecha: '2026-09-08 09:35', nota: 'Detectada durante inspección rutinaria' }],
  },
  {
    id: 'inc02', codigo: 'INC-002', parcelaId: 'p03', parcelaCodigo: 'P-003', parcelaNombre: 'Bloque Este C', cultivo: 'Arándano',
    tipo: 'Posible plaga', descripcion: 'Alta densidad de Frankliniella occidentalis (trips) en flores. Riesgo severo de daño en frutos en formación.',
    fotografiaUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=400&fit=crop',
    nivelPrioridad: 'Crítica', estado: 'En tratamiento', responsable: 'Pedro Ríos', observaciones: 'Primera aplicación realizada.',
    fechaDeteccion: '2026-09-05', diasAbierta: 3,
    analisisIA: { resultado: 'Posible plaga de trips — Frankliniella sp.', coincidencia: 91, recomendacion: 'Spinosad 120 SC (0.5 mL/L).' },
    historialEstados: [{ estado: 'Detectada', fecha: '2026-09-05 11:20', nota: 'Detección durante inspección' }],
  },
  {
    id: 'inc03', codigo: 'INC-003', parcelaId: 'p09', parcelaCodigo: 'P-009', parcelaNombre: 'Extensión Norte I', cultivo: 'Espárrago',
    tipo: 'Posible enfermedad', descripcion: 'Marchitez vascular en plantas. Síntomas: amarillamiento y muerte de tallos.',
    fotografiaUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
    nivelPrioridad: 'Media', estado: 'En tratamiento', responsable: 'Rosa Quispe', observaciones: 'Trichoderma al suelo en curso.',
    fechaDeteccion: '2026-08-28', diasAbierta: 11,
    historialEstados: [{ estado: 'Detectada', fecha: '2026-08-28 08:00', nota: 'Reportada por Rosa Quispe' }],
  },
  {
    id: 'inc04', codigo: 'INC-004', parcelaId: 'p12', parcelaCodigo: 'P-012', parcelaNombre: 'Bloque L', cultivo: 'Espárrago',
    tipo: 'Deficiencia', descripcion: 'Clorosis internerval en hojas basales. Posible déficit de potasio.',
    fotografiaUrl: 'https://images.unsplash.com/photo-1518977676405-d4b7f85a0ca1?w=600&h=400&fit=crop',
    nivelPrioridad: 'Baja', estado: 'Detectada', responsable: 'Pedro Ríos', observaciones: 'Pendiente análisis foliar.',
    fechaDeteccion: '2026-09-08', diasAbierta: 0,
    historialEstados: [{ estado: 'Detectada', fecha: '2026-09-08 14:05', nota: 'Detectada en inspección' }],
  },
  {
    id: 'inc05', codigo: 'INC-005', parcelaId: 'p02', parcelaCodigo: 'P-002', parcelaNombre: 'Lote Sur B', cultivo: 'Mandarina',
    tipo: 'Anomalía', descripcion: 'Deformación en frutos jóvenes con superficie rugosa e irregular.',
    fotografiaUrl: 'https://images.unsplash.com/photo-1601472544049-e26f1c62f39d?w=600&h=400&fit=crop',
    nivelPrioridad: 'Media', estado: 'En evaluación', responsable: 'Rosa Quispe', observaciones: 'Muestra enviada.',
    fechaDeteccion: '2026-09-06', diasAbierta: 2,
    historialEstados: [{ estado: 'Detectada', fecha: '2026-09-06 09:00', nota: 'Reportada por Rosa Quispe' }],
  },
];

// ─── CLIMA ──────────────────────────────────────────────────────────────────

export const registrosAmbientales: RegistroAmbiental[] = [
  { id: 'ra01', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-02', temperatura: 28, tempMin: 15, humedad: 72, precipitacion: 0, viento: 12, velocidadViento: 12, uv: 7, condicion: 'Soleado' },
  { id: 'ra02', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-03', temperatura: 26, tempMin: 14, humedad: 78, precipitacion: 2, viento: 15, velocidadViento: 15, uv: 5, condicion: 'Parcialmente nublado' },
  { id: 'ra03', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-04', temperatura: 24, tempMin: 13, humedad: 85, precipitacion: 8, viento: 18, velocidadViento: 18, uv: 3, condicion: 'Lluvioso' },
  { id: 'ra04', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-05', temperatura: 25, tempMin: 14, humedad: 82, precipitacion: 4, viento: 14, velocidadViento: 14, uv: 4, condicion: 'Nublado' },
  { id: 'ra05', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-06', temperatura: 27, tempMin: 15, humedad: 75, precipitacion: 0, viento: 11, velocidadViento: 11, uv: 6, condicion: 'Soleado' },
  { id: 'ra06', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-07', temperatura: 29, tempMin: 16, humedad: 68, precipitacion: 0, viento: 9, velocidadViento: 9, uv: 8, condicion: 'Soleado' },
  { id: 'ra07', parcelaId: 'p08', parcelaCodigo: 'P-008', fecha: '2026-09-08', temperatura: 30, tempMin: 17, humedad: 65, precipitacion: 0, viento: 8, velocidadViento: 8, uv: 9, condicion: 'Soleado' },
];

export const registrosClima = registrosAmbientales.map(r => ({
  fecha: r.fecha.slice(5),
  tempMax: r.temperatura,
  tempMin: r.tempMin,
  humedad: r.humedad,
  condicion: r.condicion,
}));

// ─── ALERTAS ────────────────────────────────────────────────────────────────

export const alertas: Alerta[] = [
  { id: 'alt01', tipo: 'Fitosanitaria', subtipo: 'Posible plaga', titulo: 'Ácaro rojo detectado en P-008', parcelaId: 'p08', parcelaCodigo: 'P-008', parcelaNombre: 'Lote H — Principal', descripcion: 'Posible presencia de ácaro rojo detectada durante inspección.', prioridad: 'Alta', estado: 'Pendiente', fecha: '2026-09-08', accionRecomendada: 'Aplicar acaricida preventivo.', responsable: 'Lucía Sánchez' },
  { id: 'alt02', tipo: 'Fitosanitaria', subtipo: 'Posible plaga', titulo: 'Trips en flores — P-003 (crítico)', parcelaId: 'p03', parcelaCodigo: 'P-003', parcelaNombre: 'Bloque Este C', descripcion: 'Incidencia crítica de trips en flores.', prioridad: 'Alta', estado: 'En revisión', fecha: '2026-09-05', accionRecomendada: 'Continuar con spinosad.', responsable: 'Lucía Sánchez' },
  { id: 'alt03', tipo: 'Ambiental', subtipo: 'Condición climática', titulo: 'Estrés hídrico — P-012 alta temperatura', parcelaId: 'p12', parcelaCodigo: 'P-012', parcelaNombre: 'Bloque L', descripcion: 'Temperatura máxima 30°C con humedad relativa 65 %.', prioridad: 'Media', estado: 'Pendiente', fecha: '2026-09-08', accionRecomendada: 'Aumentar frecuencia de riego.', responsable: 'Juan Valdera' },
  { id: 'alt04', tipo: 'Operativa', subtipo: 'Actividad pendiente', titulo: 'Cosecha de maíz programada P-006', parcelaId: 'p06', parcelaCodigo: 'P-006', parcelaNombre: 'Lote F', descripcion: 'Cosecha programada para el 10/09.', prioridad: 'Media', estado: 'Pendiente', fecha: '2026-09-07', accionRecomendada: 'Confirmar maquinaria.', responsable: 'Carlos Mendoza' },
  { id: 'alt05', tipo: 'Operativa', subtipo: 'Incidencia sin atención', titulo: 'INC-003 sin resolución — 11 días', parcelaId: 'p09', parcelaCodigo: 'P-009', parcelaNombre: 'Extensión Norte I', descripcion: 'Incidencia INC-003 lleva 11 días abierta.', prioridad: 'Media', estado: 'En revisión', fecha: '2026-09-01', accionRecomendada: 'Escalar a asesor agronómico.', responsable: 'Pedro Ríos' },
  { id: 'alt06', tipo: 'Ambiental', subtipo: 'Cambio relevante', titulo: 'Precipitación inusual 8 mm P-005', parcelaId: 'p05', parcelaCodigo: 'P-005', parcelaNombre: 'Parcela Central E', descripcion: 'Precipitación inusual de 8 mm.', prioridad: 'Baja', estado: 'Resuelta', fecha: '2026-09-04', accionRecomendada: 'Drenaje verificado.', responsable: 'Juan Valdera' },
];

export const usuarioActual: Usuario = {
  id: 'u1',
  nombre: 'Roberto',
  apellido: 'Bustamante',
  email: 'r.bustamante@santaelena.pe',
  rol: 'Gerencia',
  estado: 'Activo',
  activo: true,
  telefono: '+51 944 112 233',
  fechaIngreso: '2018-03-01',
  ultimoAcceso: '2026-09-08',
  parcelasAsignadas: ['Todas'],
};
