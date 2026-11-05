/**
 * @description Catálogo y clasificador de herramientas, insumos fitosanitarios y EPP
 * requeridos para erradicar patologías detectadas en campo por Agro Vision AI.
 */

export interface HerramientaTag {
  nombre: string;
  categoria: 'HERRAMIENTA' | 'FITOSANITARIO' | 'EPP' | 'MANEJO';
  icono: string;
}

const DICCIONARIO_HERRAMIENTAS_POR_CLASE: Record<string, HerramientaTag[]> = {
  tizon_temprano: [
    { nombre: 'Tijeras de podar bypass', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Mochila pulverizadora 20L', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Fungicida cúprico / Trichoderma', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Alcohol 70% (desinfección)', categoria: 'FITOSANITARIO', icono: '🧴' },
    { nombre: 'Bolsas para descarte vegetal', categoria: 'HERRAMIENTA', icono: '🪣' },
    { nombre: 'Guantes de nitrilo y mascarilla N95', categoria: 'EPP', icono: '🧤' },
    { nombre: 'Riego por goteo (sin mojar hoja)', categoria: 'MANEJO', icono: '💧' },
  ],
  tizon_tardio: [
    { nombre: 'Tijera de poda desinfectada', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Atomizadora / Pulverizador alta presión', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Fungicida sistémico (Metalaxil + Mancozeb)', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Contenedor hermético de retiro', categoria: 'HERRAMIENTA', icono: '🪣' },
    { nombre: 'Overol impermeable y botas de goma', categoria: 'EPP', icono: '🥾' },
    { nombre: 'Mascarilla para vapores orgánicos', categoria: 'EPP', icono: '😷' },
  ],
  tizon_foliar: [
    { nombre: 'Tijeras de poda fitosanitaria', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Mochila aspersora con boquilla cónica', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Fungicida foliar (Azoxistrobina / Mancozeb)', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Guantes de nitrilo y protección facial', categoria: 'EPP', icono: '🧤' },
    { nombre: 'Eliminación de rastrojo infectado', categoria: 'MANEJO', icono: '🧹' },
  ],
  roya: [
    { nombre: 'Tijera podadora de dos manos', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Pulverizador con lanza telescópica', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Fungicida a base de Azufre / Triazoles', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Gafas de seguridad y mascarilla', categoria: 'EPP', icono: '🥽' },
    { nombre: 'Hipoclorito de sodio al 5% para corte', categoria: 'FITOSANITARIO', icono: '🧴' },
  ],
  aranita_roja: [
    { nombre: 'Mochila aspersora (boquilla abanico)', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Acaricida (Abamectina 1.8% EC)', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Jabón potásico o aceite de neem', categoria: 'FITOSANITARIO', icono: '🌿' },
    { nombre: 'Lupa cuentahilos de campo (10x)', categoria: 'HERRAMIENTA', icono: '🔍' },
    { nombre: 'Guantes de protección química', categoria: 'EPP', icono: '🧤' },
  ],
  mancha_foliar: [
    { nombre: 'Tijeras de podar de mano', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Mochila pulverizadora con filtro', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Bactericida cúprico / Bacillus subtilis', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Solución desinfectante de hojas de corte', categoria: 'FITOSANITARIO', icono: '🧴' },
    { nombre: 'Guantes y mascarilla protectora', categoria: 'EPP', icono: '🧤' },
  ],
  oidio_mildiu: [
    { nombre: 'Mochila pulverizadora regulable', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'Tijeras de despunte desinfectadas', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Bicarbonato potásico / Azufre mojable', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Gafas herméticas para azufre', categoria: 'EPP', icono: '🥽' },
  ],
  virosis: [
    { nombre: 'Pala de mano para extracción de raíz', categoria: 'HERRAMIENTA', icono: '⛏️' },
    { nombre: 'Trampas cromáticas adhesivas (amarillas)', categoria: 'HERRAMIENTA', icono: '🪤' },
    { nombre: 'Insecticida para vectores (Acetamiprid)', categoria: 'FITOSANITARIO', icono: '🧪' },
    { nombre: 'Bolsas gruesas de polietileno', categoria: 'HERRAMIENTA', icono: '🪣' },
    { nombre: 'Guantes descartables', categoria: 'EPP', icono: '🧤' },
  ],
  pudricion_negra_sarna: [
    { nombre: 'Tijeras podadoras de precisión', categoria: 'HERRAMIENTA', icono: '✂️' },
    { nombre: 'Navaja curva para raspado de chancros', categoria: 'HERRAMIENTA', icono: '🔪' },
    { nombre: 'Pasta cicatrizante con fungicida cúprico', categoria: 'FITOSANITARIO', icono: '🩹' },
    { nombre: 'Mochila aspersora 20L', categoria: 'HERRAMIENTA', icono: '🎒' },
    { nombre: 'EPP completo de aplicación', categoria: 'EPP', icono: '🧤' },
  ],
  follaje_sano: [
    { nombre: 'Lupa cuentahilos de campo', categoria: 'HERRAMIENTA', icono: '🔍' },
    { nombre: 'Aplicación de registro en campo', categoria: 'HERRAMIENTA', icono: '📱' },
    { nombre: 'Tensiómetro de suelo / Medidor de humedad', categoria: 'HERRAMIENTA', icono: '💧' },
  ],
};

/**
 * @description Infiere el grupo de patología a partir del texto de la clase detectada.
 */
function identificarGrupoPatologia(texto: string): string {
  const t = texto.toLowerCase();

  if (t.includes('tizón temprano') || t.includes('tizon temprano') || t.includes('early blight')) {
    return 'tizon_temprano';
  }
  if (t.includes('tizón tardío') || t.includes('tizon tardio') || t.includes('late blight')) {
    return 'tizon_tardio';
  }
  if (t.includes('tizón') || t.includes('tizon') || t.includes('blight')) {
    return 'tizon_foliar';
  }
  if (t.includes('roya') || t.includes('rust')) {
    return 'roya';
  }
  if (t.includes('arañita') || t.includes('aranita') || t.includes('ácaro') || t.includes('acaro') || t.includes('spider mite')) {
    return 'aranita_roja';
  }
  if (t.includes('mancha') || t.includes('septoria') || t.includes('spot') || t.includes('bacteriana')) {
    return 'mancha_foliar';
  }
  if (t.includes('oídio') || t.includes('oidio') || t.includes('mildiu') || t.includes('mildew')) {
    return 'oidio_mildiu';
  }
  if (t.includes('virus') || t.includes('mosaico') || t.includes('rizado')) {
    return 'virosis';
  }
  if (t.includes('sarna') || t.includes('roña') || t.includes('pudrición') || t.includes('black rot') || t.includes('scab') || t.includes('moho') || t.includes('mold')) {
    return 'pudricion_negra_sarna';
  }
  if (t.includes('sana') || t.includes('sano') || t.includes('saludable') || t.includes('optimo')) {
    return 'follaje_sano';
  }

  return 'tizon_foliar';
}

/**
 * @description Obtiene el listado de herramientas, insumos y equipos recomendados para una alerta
 * a partir de sus detecciones de IA o lista explícita de herramientas.
 */
export function obtenerHerramientasRequeridas(
  detecciones: Array<{ clase?: string }> = [],
  herramientasExplicitas?: string[],
): HerramientaTag[] {
  // 1. Si el backend o la IA ya enviaron una lista de herramientas en texto
  if (Array.isArray(herramientasExplicitas) && herramientasExplicitas.length > 0) {
    return herramientasExplicitas.map((texto) => {
      let icono = '🛠️';
      let categoria: HerramientaTag['categoria'] = 'HERRAMIENTA';
      const low = texto.toLowerCase();

      if (low.includes('tijera') || low.includes('navaja') || low.includes('pod')) {
        icono = '✂️';
        categoria = 'HERRAMIENTA';
      } else if (low.includes('mochila') || low.includes('pulveriz') || low.includes('aspers')) {
        icono = '🎒';
        categoria = 'HERRAMIENTA';
      } else if (low.includes('fungicida') || low.includes('acaricida') || low.includes('cobre') || low.includes('quimico') || low.includes('jabón') || low.includes('neem')) {
        icono = '🧪';
        categoria = 'FITOSANITARIO';
      } else if (low.includes('guante') || low.includes('mascar') || low.includes('overol') || low.includes('gafas') || low.includes('bota')) {
        icono = '🧤';
        categoria = 'EPP';
      } else if (low.includes('riego') || low.includes('drenaje') || low.includes('distancia')) {
        icono = '💧';
        categoria = 'MANEJO';
      } else if (low.includes('bolsa') || low.includes('contenedor')) {
        icono = '🪣';
        categoria = 'HERRAMIENTA';
      } else if (low.includes('lupa')) {
        icono = '🔍';
        categoria = 'HERRAMIENTA';
      }

      return {
        nombre: texto,
        categoria,
        icono,
      };
    });
  }

  // 2. Si no hay lista explícita, se deducen a partir de las clases detectadas en la planta
  if (!detecciones || detecciones.length === 0) {
    return DICCIONARIO_HERRAMIENTAS_POR_CLASE.follaje_sano;
  }

  const resultado: HerramientaTag[] = [];
  const nombresVistos = new Set<string>();

  for (const det of detecciones) {
    const claseTexto = det.clase || '';
    const grupo = identificarGrupoPatologia(claseTexto);
    const lista = DICCIONARIO_HERRAMIENTAS_POR_CLASE[grupo] || DICCIONARIO_HERRAMIENTAS_POR_CLASE.tizon_foliar;

    for (const h of lista) {
      if (!nombresVistos.has(h.nombre)) {
        nombresVistos.add(h.nombre);
        resultado.push(h);
      }
    }
  }

  return resultado.length > 0 ? resultado : DICCIONARIO_HERRAMIENTAS_POR_CLASE.follaje_sano;
}
