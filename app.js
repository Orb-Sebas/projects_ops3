/* ==========================================================
   CADUCIDADES · APP LOGIC
   ApexCharts · GSAP · Intersection Observer · Typewriter
   ========================================================== */

// ============ ESTADO ============
const filters = { familia: '', producto: '', memoria: '', causa: '' };
let currentSort = { field: null, asc: true };
let currentPage = 1;
const pageSize = 20;

// ============ COLORES ============
const COLORS = {
  ghost:  '#1ba8c9',
  baja:   '#eba02a',
  desist: '#9670f0',
  mkt:    '#ff5d83',
  pc:     '#1ba8c9',
  ink:    '#e8ecf4',
  soft:   '#c6ceda',
  grid:   'rgba(255,255,255,.08)'
};
const CAUSA_COLOR = {
  'Perdido - Ghosting': COLORS.ghost,
  'Perdido - Baja':     COLORS.baja,
  'Perdido - Desistido': COLORS.desist
};

const SUBCAUSA_CATEGORIA = {
  'Contactado sin respuesta': 'Comunicación',
  'Sin gestión documentada': 'Comunicación',
  'Sin motivo': 'Comunicación',
  'Dificultad en plataforma': 'Técnico',
  'Bloqueo técnico / Falta de credenciales': 'Técnico',
  'Retraso/Bloqueo por Gestoría externa': 'Técnico',
  'Sin interés en proyecto': 'Decisión cliente',
  'Baja autónomo': 'Decisión cliente',
  'Cierre de negocio': 'Decisión cliente',
  'Cliente falleció': 'Decisión cliente',
  'Bono renunciado': 'Decisión cliente',
  'Motivos personales': 'Decisión cliente',
  'Calidad de producto': 'Insatisfacción',
  'Descontento servicio': 'Insatisfacción',
  'Atención recibida': 'Insatisfacción',
  'Mala reputación ORBIDI': 'Insatisfacción',
  'No se cumplen expectativas': 'Insatisfacción',
  'Gestión PC': 'Gestión PC',
  'Incidencias documentación cliente': 'Gestión PC',
  'Pago IGIC': 'Pago',
  'No pago IVA': 'Pago',
  'Pago de importe': 'Pago',
  'Error de importe': 'Pago'
};
const CATEGORIA_COLOR = {
  'Comunicación':     '#1ba8c9',
  'Técnico':          '#14a396',
  'Decisión cliente': '#9670f0',
  'Insatisfacción':   '#ff5d83',
  'Gestión PC':       '#eba02a',
  'Pago':             '#fb923c'
};

const DATOS = window.DATOS || [];

// ============ HELPERS ============
function getFiltered(){
  return DATOS.filter(d => {
    if (filters.familia && d.familia !== filters.familia) return false;
    if (filters.producto && d.producto !== filters.producto) return false;
    if (filters.memoria && String(d.memoria) !== filters.memoria) return false;
    if (filters.causa && d.causa !== filters.causa) return false;
    return true;
  });
}
function countBy(arr, key){
  const map = {};
  arr.forEach(item => { const k = item[key] || '(vacío)'; map[k] = (map[k] || 0) + 1; });
  return map;
}
function hubspotUrl(id, familia){
  const objectId = familia === 'PC' ? '2-132008325' : '2-110970937';
  return `https://app-eu1.hubspot.com/contacts/25808060/record/${objectId}/${id}`;
}

// ============ TYPEWRITER ============
let typewriterTimeout = null;
function typewriter(el, htmlText, speed = 14){
  if (typewriterTimeout) { clearTimeout(typewriterTimeout); }
  // Strip tags to get plain, then re-type with tags preserved using token parsing
  // Simpler approach: animate character by character over innerHTML
  el.innerHTML = '';
  const caret = '<span class="type-caret"></span>';
  let i = 0;
  // Tokenize: keep tags as atomic units
  const tokens = [];
  const re = /<[^>]+>|&[^;]+;|[\s\S]/g;
  let m; while ((m = re.exec(htmlText)) !== null) tokens.push(m[0]);
  let built = '';
  function step(){
    if (i >= tokens.length){ el.innerHTML = built; return; }
    built += tokens[i++];
    el.innerHTML = built + caret;
    typewriterTimeout = setTimeout(step, speed);
  }
  step();
}

// ============ GSAP REVEAL ============
function reveal(selector, opts = {}){
  if (!window.gsap) return;
  gsap.fromTo(selector,
    { autoAlpha: 0, y: 16, filter: 'blur(8px)' },
    { autoAlpha: 1, y: 0, filter: 'blur(0px)',
      duration: opts.duration || 0.75,
      stagger: opts.stagger ?? 0.07,
      ease: 'power3.out',
      overwrite: 'auto'
    }
  );
}

// Intersection observer: one-shot fade-in on first viewport entry, using
// a `.revealed` flag so subsequent re-renders never hide the element again.
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      const el = e.target;
      if (el.dataset.revealed) return;
      el.dataset.revealed = '1';
      if (window.gsap){
        gsap.fromTo(el,
          { autoAlpha: 0, y: 14, filter: 'blur(6px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .7, ease: 'power3.out', clearProps: 'all' });
      }
      io.unobserve(el);
    }
  });
}, { threshold: 0.08 });

function observeAll(){
  document.querySelectorAll('.chart-card, .compare, .method-col, .dict-col, .insight, .table-wrap')
    .forEach(el => {
      if (el.dataset.observed || el.dataset.revealed) return;
      el.dataset.observed = '1';
      io.observe(el);
    });
}

// ============ KPIs ============
function renderKPIs(){
  const data = getFiltered();
  const total = data.length;
  const ghost = data.filter(d => d.causa === 'Perdido - Ghosting').length;
  const baja  = data.filter(d => d.causa === 'Perdido - Baja').length;
  const desist = data.filter(d => d.causa === 'Perdido - Desistido').length;
  const mkt = data.filter(d => d.familia === 'MKT').length;
  const pc  = data.filter(d => d.familia === 'PC').length;
  const mem1 = data.filter(d => d.memoria === 1).length;
  const mem2 = data.filter(d => d.memoria === 2).length;
  const pct = n => total > 0 ? Math.round(n / total * 100) : 0;

  const ghostAnim = `
    <span class="ghost-anim" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <g class="g">
          <path d="M16 4c-5 0-9 4-9 9v12l3-2 3 2 3-2 3 2 3-2 3 2V13c0-5-4-9-9-9Z"
                stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"
                fill="rgba(34,211,238,.08)"/>
          <circle cx="12.5" cy="14" r="1.2" fill="currentColor"/>
          <circle cx="19.5" cy="14" r="1.2" fill="currentColor"/>
        </g>
      </svg>
    </span>
  `;

  const kpis = [
    { label: 'Total', value: total, detail: 'proyectos caducados', cls: '' },
    { label: 'MKT', value: mkt, detail: `${pct(mkt)}% del total`, cls: 'kpi-mkt' },
    { label: 'PC', value: pc, detail: `${pct(pc)}% del total`, cls: 'kpi-pc' },
    { label: 'Ghosting', value: ghost, detail: `${pct(ghost)}% del total`, cls: 'kpi-ghost', extra: ghostAnim },
    { label: 'Baja', value: baja, detail: `${pct(baja)}% del total`, cls: 'kpi-baja' },
    { label: 'Desistido', value: desist, detail: `${pct(desist)}% del total`, cls: 'kpi-desist' },
    { label: 'Memoria 1', value: mem1, detail: `${pct(mem1)}% · primer hito`, cls: '' },
    { label: 'Memoria 2', value: mem2, detail: `${pct(mem2)}% · cierre`, cls: '' }
  ];

  const html = kpis.map(k => `
    <div class="kpi ${k.cls}">
      ${k.extra || ''}
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" data-n="${k.value}">${k.value}</div>
      <div class="kpi-detail">${k.detail}</div>
    </div>
  `).join('');

  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = html;

  // Count-up + reveal
  if (window.gsap){
    gsap.fromTo(grid.querySelectorAll('.kpi'),
      { autoAlpha: 0, y: 18, filter: 'blur(6px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .7, stagger: .06, ease: 'power3.out', clearProps: 'all' }
    );
    grid.querySelectorAll('.kpi-value').forEach(el => {
      const n = +el.dataset.n;
      const obj = { v: 0 };
      gsap.to(obj, { v: n, duration: 1.1, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.v); }
      });
    });
  }

  // Mouse-follow glow
  grid.querySelectorAll('.kpi').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });
}

// ============ HEADLINE INSIGHTS (typewriter main) ============
function renderHeadlineInsights(){
  const data = getFiltered();
  const total = data.length;
  const container = document.getElementById('headlineInsights');
  if (total === 0){
    container.innerHTML = '<div class="insight"><div class="insight-title">Sin datos con ese filtro</div><div class="insight-body">Ajusta los filtros superiores para ver interpretaciones.</div></div>';
    return;
  }

  const ghost = data.filter(d => d.causa === 'Perdido - Ghosting').length;
  const baja  = data.filter(d => d.causa === 'Perdido - Baja').length;
  const desist = data.filter(d => d.causa === 'Perdido - Desistido').length;
  const mem1 = data.filter(d => d.memoria === 1);
  const mem2 = data.filter(d => d.memoria === 2);
  const subcausaTop = Object.entries(countBy(data, 'subcausa')).sort((a,b) => b[1] - a[1]).slice(0,3);

  const fam = filters.familia || 'el universo completo';
  const prod = filters.producto ? ` · ${filters.producto}` : '';
  const filterLabel = filters.familia || filters.producto ? `${fam}${prod}` : 'todos los proyectos';

  const mem2Ghost = mem2.filter(d => d.causa === 'Perdido - Ghosting').length;
  const mem2Pct = mem2.length > 0 ? Math.round(mem2Ghost / mem2.length * 100) : 0;
  const mem1Baja = mem1.filter(d => d.causa === 'Perdido - Baja').length;
  const mem1Desist = mem1.filter(d => d.causa === 'Perdido - Desistido').length;

  const insights = [];

  // #1 — headline (typewriter)
  const dominanteTxt = ghost > baja && ghost > desist
    ? 'Domina el <em>ghosting</em> — el problema es de captación de atención, no de rechazo.'
    : baja > ghost
    ? 'Domina la <em>baja</em> — el cliente se desvincula con intención.'
    : desist > ghost
    ? 'Domina el <em>desistimiento</em> — los clientes formalizan su salida por Red.es.'
    : 'Distribución equilibrada entre las tres causas.';

  const headlineTitle = `De ${total} proyectos, ${ghost} son ghosting (${Math.round(ghost/total*100)}%).`;
  const headlineBody = `Para <strong>${filterLabel}</strong>, la distribución queda así: <strong>${ghost}</strong> ghosting, <strong>${baja}</strong> bajas, <strong>${desist}</strong> desistimientos. ${dominanteTxt}`;

  insights.push(`
    <div class="insight">
      <div class="insight-tag">Perfil general</div>
      <div class="insight-title" data-typewriter="${escAttr(headlineTitle)}"></div>
      <div class="insight-body">${headlineBody}</div>
      <div class="insight-stat">${Math.round(ghost/total*100)}% GHOSTING · ${Math.round(baja/total*100)}% BAJA · ${Math.round(desist/total*100)}% DESIST</div>
    </div>
  `);

  if (mem1.length > 0 && mem2.length > 0){
    insights.push(`
      <div class="insight ${mem2Pct > 50 ? 'opp' : ''}">
        <div class="insight-tag">Ritmo de caída</div>
        <div class="insight-title">Mem 2 es ${mem2Pct}% ghosting en este segmento.</div>
        <div class="insight-body">
          En <strong>Memoria 1</strong> (${mem1.length} casos): ${mem1Baja} bajas, ${mem1Desist} desistidos, ${mem1.filter(d=>d.causa==='Perdido - Ghosting').length} ghosting.
          En <strong>Memoria 2</strong> (${mem2.length} casos): ${mem2Ghost} ghosting, ${mem2.filter(d=>d.causa==='Perdido - Baja').length} bajas, ${mem2.filter(d=>d.causa==='Perdido - Desistido').length} desistidos.
          ${mem2Pct > 70 ? 'El ghosting de mem 2 es extremo aquí — <em>casi todo lo que cae en mem 2 es porque el cliente no apareció.</em>' :
            mem2Pct > 50 ? 'El ghosting sigue siendo dominante en mem 2, patrón típico.' :
            'Mem 2 tiene un perfil más mixto del habitual, vale la pena revisarlo.'}
        </div>
        <div class="insight-stat">MEM 1: ${mem1.length} · MEM 2: ${mem2.length} — Mem 2 Ghosting ${mem2Pct}%</div>
      </div>
    `);
  } else if (mem1.length > 0){
    insights.push(`
      <div class="insight">
        <div class="insight-tag">Solo Memoria 1</div>
        <div class="insight-title">${mem1.length} proyectos caídos en primer hito.</div>
        <div class="insight-body">
          Todos los casos del filtro son Memoria 1: el cliente ni siquiera llegó al primer cobro de justificación.
          ${mem1Baja} bajas y ${mem1Desist} desistidos forman el ${Math.round((mem1Baja+mem1Desist)/mem1.length*100)}% — son salidas explícitas, no abandono pasivo.
        </div>
        <div class="insight-stat">Todos los proyectos son mem 1</div>
      </div>
    `);
  } else if (mem2.length > 0){
    insights.push(`
      <div class="insight opp">
        <div class="insight-tag">Solo Memoria 2</div>
        <div class="insight-title">${mem2.length} proyectos perdidos en el cierre.</div>
        <div class="insight-body">
          Todos ya habían pasado Mem 1 — son clientes <em>ya monetizados al 50%</em> que ORBIDI pierde en el último tramo.
          Son la cohorte más cara de perder porque ya se ha invertido el servicio completo.
        </div>
        <div class="insight-stat">Todos los proyectos son mem 2</div>
      </div>
    `);
  }

  if (subcausaTop.length){
    const [topSub, topSubN] = subcausaTop[0];
    const topSubPct = Math.round(topSubN / total * 100);
    insights.push(`
      <div class="insight ${topSub === 'Sin gestión documentada' ? 'watch' : ''}">
        <div class="insight-tag">Subcausa dominante</div>
        <div class="insight-title">"${topSub}" explica el ${topSubPct}% de las pérdidas.</div>
        <div class="insight-body">
          Con <strong>${topSubN}</strong> casos, es la razón más repetida en este segmento. Top 3:
          ${subcausaTop.map(([s,n]) => `<em>${s}</em> (${n})`).join(' · ')}.
          ${topSub === 'Contactado sin respuesta' ? 'Es el patrón clásico de ghosting: ORBIDI insistió, no hubo respuesta. Oportunidad de probar canales alternativos.' :
            topSub === 'Sin gestión documentada' ? 'Alerta operativa: estos proyectos caducaron sin huella en CS. No es un problema del cliente, es un gap de proceso.' :
            topSub === 'Sin motivo' ? 'El cliente se dio de baja sin explicación registrada. Oportunidad de capturar mejor el motivo en el flujo de baja.' :
            topSub === 'Pago de importe' ? 'Los clientes bloqueados por pago son recuperables con recordatorios anticipados — la ventana de 18-24 días de CS es demasiado corta.' :
            'Vale la pena inspeccionar los casos individualmente desde la tabla de exploración.'}
        </div>
        <div class="insight-stat">Top 3 subcausas: ${subcausaTop.map(([s,n]) => `${s} (${n})`).join(' · ')}</div>
      </div>
    `);
  }

  if (filters.familia === 'PC'){
    const pagoN = data.filter(d => ['Pago de importe', 'Error de importe', 'Pago IGIC', 'No pago IVA'].includes(d.subcausa)).length;
    if (pagoN > 0){
      insights.push(`
        <div class="insight critical">
          <div class="insight-tag">Palanca PC</div>
          <div class="insight-title">${pagoN} proyectos bloqueados por temas de pago.</div>
          <div class="insight-body">
            En PC, los problemas financieros (Pago de importe, Error de importe, Pago IGIC, No pago IVA)
            suman <strong>${pagoN} casos</strong> (${Math.round(pagoN/total*100)}% del segmento). Vale la pena seguir fortaleciendo la estrategia de comunicaciones de cobro en PC para reducir esta bolsa.
          </div>
          <div class="insight-stat">Recuperable con refuerzo de comunicaciones de cobro</div>
        </div>
      `);
    }
  } else if (filters.familia === 'MKT'){
    const insatN = data.filter(d => ['Calidad de producto','Descontento servicio','Atención recibida','Mala reputación ORBIDI','No se cumplen expectativas'].includes(d.subcausa)).length;
    if (insatN > 0){
      insights.push(`
        <div class="insight watch">
          <div class="insight-tag">Señal MKT</div>
          <div class="insight-title">${insatN} proyectos caídos por insatisfacción.</div>
          <div class="insight-body">
            En MKT la insatisfacción del cliente (calidad, atención, reputación) causa <strong>${insatN} pérdidas</strong>
            (${Math.round(insatN/total*100)}% del segmento). Es síntoma de que el flujo de aprobación pre-memoria no captura
            bien las objeciones reales del cliente — muchas salen a flote cuando ya es tarde.
          </div>
          <div class="insight-stat">Mayoría concentrada en producto WEB</div>
        </div>
      `);
    }
  }

  container.innerHTML = insights.slice(0, 4).join('');

  // Run typewriter on the headline title
  const titleEl = container.querySelector('[data-typewriter]');
  if (titleEl){
    const text = titleEl.getAttribute('data-typewriter');
    typewriter(titleEl, text, 18);
  }

  if (window.gsap){
    gsap.fromTo(container.querySelectorAll('.insight'),
      { autoAlpha: 0, y: 14, filter: 'blur(6px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .65, stagger: .1, ease: 'power3.out', clearProps: 'all' }
    );
  }
}
function escAttr(s){ return s.replace(/"/g, '&quot;'); }

// ============ ESTRUCTURA INSIGHTS (III) ============
function renderEstructuraInsights(){
  const data = getFiltered();
  const total = data.length;
  const container = document.getElementById('estructuraInsights');
  if (total === 0){ container.innerHTML = ''; return; }

  const mem1 = data.filter(d => d.memoria === 1);
  const mem2 = data.filter(d => d.memoria === 2);
  const mem1Baja = mem1.filter(d => d.causa === 'Perdido - Baja').length;
  const mem1Desist = mem1.filter(d => d.causa === 'Perdido - Desistido').length;
  const mem1Ghost = mem1.filter(d => d.causa === 'Perdido - Ghosting').length;
  const mem2Ghost = mem2.filter(d => d.causa === 'Perdido - Ghosting').length;
  const mem2Baja = mem2.filter(d => d.causa === 'Perdido - Baja').length;
  const mem2Desist = mem2.filter(d => d.causa === 'Perdido - Desistido').length;
  const pctMem1 = n => mem1.length > 0 ? Math.round(n/mem1.length*100) : 0;
  const pctMem2 = n => mem2.length > 0 ? Math.round(n/mem2.length*100) : 0;
  const contactoSin = data.filter(d => d.subcausa === 'Contactado sin respuesta').length;

  const filtroLabel = (filters.familia || filters.producto || filters.memoria || filters.causa)
    ? [filters.familia, filters.producto, filters.memoria ? `Mem ${filters.memoria}` : '', filters.causa].filter(Boolean).join(' · ')
    : '';

  let html = '';
  if (mem1.length > 0 && mem2.length > 0){
    html += `
      <div class="insight">
        <div class="insight-tag">Patrón estructural${filtroLabel ? ' · ' + filtroLabel : ''}</div>
        <div class="insight-title">Mem 1 es financiera. Mem 2 es relacional.</div>
        <div class="insight-body">
          En <strong>Memoria 1</strong> (${mem1.length} casos) dominan Baja y Desistido: el cliente no llega a firmar el primer hito, bien porque no pagó el extra del PC, bien porque formalizó la baja en Red.es, bien porque cerró su negocio. Es una caída <strong>operativa o voluntaria</strong>.
          En <strong>Memoria 2</strong> (${mem2.length} casos) el ghosting se multiplica: cuando ya se cobró la mem 1, ya se entregó el servicio y el cliente desaparece para el cierre. Es una caída <em>de atención</em>, no de interés.
        </div>
        <div class="insight-stat">MEM 1 → ${pctMem1(mem1Baja)}% BAJA · ${pctMem1(mem1Desist)}% DESIST · ${pctMem1(mem1Ghost)}% GHOSTING — MEM 2 → ${pctMem2(mem2Ghost)}% GHOSTING · ${pctMem2(mem2Baja)}% BAJA · ${pctMem2(mem2Desist)}% DESIST</div>
      </div>
    `;
  } else if (mem1.length > 0){
    html += `
      <div class="insight">
        <div class="insight-tag">Perfil Mem 1${filtroLabel ? ' · ' + filtroLabel : ''}</div>
        <div class="insight-title">Caídas concentradas en el primer hito.</div>
        <div class="insight-body">
          Los ${mem1.length} casos se perdieron en Memoria 1 — antes del primer cobro. ${mem1Baja} bajas, ${mem1Desist} desistimientos y ${mem1Ghost} casos de ghosting. Es una cohorte con alta carga de salidas explícitas (Baja + Desistido = ${Math.round((mem1Baja+mem1Desist)/mem1.length*100)}%).
        </div>
        <div class="insight-stat">Mem 1 → ${pctMem1(mem1Baja)}% BAJA · ${pctMem1(mem1Desist)}% DESIST · ${pctMem1(mem1Ghost)}% GHOSTING</div>
      </div>
    `;
  } else if (mem2.length > 0){
    html += `
      <div class="insight opp">
        <div class="insight-tag">Perfil Mem 2${filtroLabel ? ' · ' + filtroLabel : ''}</div>
        <div class="insight-title">Todo lo que cae aquí ya estaba ganado.</div>
        <div class="insight-body">
          Los ${mem2.length} casos ya habían superado Memoria 1 — son clientes monetizados al 50% que ORBIDI pierde en el último tramo. El ${pctMem2(mem2Ghost)}% cae por ghosting.
        </div>
        <div class="insight-stat">Mem 2 → ${pctMem2(mem2Ghost)}% GHOSTING · ${pctMem2(mem2Baja)}% BAJA · ${pctMem2(mem2Desist)}% DESIST</div>
      </div>
    `;
  }

  const ghostTotal = data.filter(d => d.causa === 'Perdido - Ghosting').length;
  if (ghostTotal > 0){
    const pctGhost = Math.round(ghostTotal/total*100);
    html += `
      <div class="insight opp">
        <div class="insight-tag">Palanca accionable${filtroLabel ? ' · ' + filtroLabel : ''}</div>
        <div class="insight-title">${ghostTotal} proyectos perdidos por ghosting (${pctGhost}% del segmento).</div>
        <div class="insight-body">
          ${mem2Ghost > 0 ? `<strong>${mem2Ghost} proyectos de Mem 2</strong> fueron ghosting puro — clientes ya validados, con servicio entregado, a los que solo faltaba una firma.` : `Los ghosting aquí están principalmente en mem 1, donde el cliente nunca respondió después del contacto inicial.`}
          No son clientes enfadados ni insatisfechos: son clientes ausentes. Vale la pena probar tácticas que rompan el patrón: <em>envío de cartas legales, rotación del número desde el cual llamamos cada semana, cambio de ventana horaria</em>.
        </div>
        <div class="insight-stat">Subcausa dominante: "Contactado sin respuesta" — ${contactoSin} casos</div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// ============ SUBCAUSA INSIGHTS (IV) ============
function renderSubcausaInsights(){
  const data = getFiltered();
  const categorias = {};
  data.forEach(d => {
    const cat = SUBCAUSA_CATEGORIA[d.subcausa] || 'Otro';
    categorias[cat] = (categorias[cat] || 0) + 1;
  });
  const total = data.length;
  let html = '';

  const comunicacion = categorias['Comunicación'] || 0;
  if (comunicacion > 0){
    const pct = Math.round(comunicacion/total*100);
    html += `
      <div class="insight">
        <div class="insight-tag">Categoría · Comunicación</div>
        <div class="insight-title">${comunicacion} proyectos caen por problemas de contacto o trazabilidad.</div>
        <div class="insight-body">
          Suma "Contactado sin respuesta" + "Sin gestión documentada" + "Sin motivo". Es el <strong>${pct}%</strong> del filtro actual y la categoría más grande.
          Agrupa dos fenómenos distintos: clientes que ORBIDI no logró localizar (ghosting real) y proyectos donde CS no dejó rastro de gestión (gap interno).
          <em>Separar estos dos mundos ayudaría a medir si el problema es del cliente o nuestro.</em>
        </div>
        <div class="insight-stat">Es el "cajón" con más volumen — requiere segmentación fina</div>
      </div>
    `;
  }

  const tecnico = categorias['Técnico'] || 0;
  if (tecnico > 0){
    html += `
      <div class="insight opp">
        <div class="insight-tag">Categoría · Técnico</div>
        <div class="insight-title">${tecnico} proyectos perdidos por fricciones técnicas externas.</div>
        <div class="insight-body">
          Incluye "Dificultad en plataforma", "Bloqueo técnico / Falta de credenciales" y "Retraso por Gestoría externa".
          Son pérdidas <strong>no imputables al cliente</strong>: el cliente quería firmar, pero la plataforma o su gestor le bloquearon.
          Son el grupo con <em>mayor ratio de rescate</em> si se aplica un flujo de soporte técnico los últimos 10 días antes del vencimiento.
        </div>
        <div class="insight-stat">Alto potencial de recuperación operativa</div>
      </div>
    `;
  }

  const insat = categorias['Insatisfacción'] || 0;
  if (insat > 0){
    html += `
      <div class="insight watch">
        <div class="insight-tag">Categoría · Insatisfacción</div>
        <div class="insight-title">${insat} clientes se fueron enfadados o decepcionados.</div>
        <div class="insight-body">
          Reúne "Calidad", "Descontento", "Atención", "Mala reputación" y "Expectativas".
          No son proyectos perdidos por circunstancias: son <strong>pérdidas de reputación</strong> que generan riesgo de NPS negativo, reclamaciones y denuncias.
        </div>
        <div class="insight-stat">Riesgo reputacional además de económico</div>
      </div>
    `;
  }

  const pago = categorias['Pago'] || 0;
  if (pago > 0){
    html += `
      <div class="insight critical">
        <div class="insight-tag">Categoría · Pago</div>
        <div class="insight-title">${pago} proyectos bloqueados por dinero.</div>
        <div class="insight-body">
          IGIC, IVA, extras del MacBook, errores de importe. Casi todo es <strong>PC</strong>. El cuello de botella es el timing:
          CS detecta el no-pago con 18-24 días de margen, insuficientes para cobrar y entregar en plazo.
        </div>
        <div class="insight-stat">Seguir reforzando comunicaciones de cobro para reducir la bolsa</div>
      </div>
    `;
  }

  const decision = categorias['Decisión cliente'] || 0;
  if (decision > 0){
    html += `
      <div class="insight">
        <div class="insight-tag">Categoría · Decisión cliente</div>
        <div class="insight-title">${decision} salidas por decisión explícita.</div>
        <div class="insight-body">
          "Sin interés en proyecto", "Baja autónomo", "Cierre de negocio", "Motivos personales". Son <strong>pérdidas sanas</strong>: el cliente tomó una decisión clara. No son rescatables ni deberían serlo.
        </div>
        <div class="insight-stat">No rescatables · foco en capturar bien el motivo</div>
      </div>
    `;
  }

  document.getElementById('subcausaInsights').innerHTML = html;
}

// ============ COMPARATIVA INSIGHTS (V) ============
function renderComparativaInsights(){
  const data = getFiltered();
  const containerTop = document.getElementById('comparativaInsightsTop');
  if (data.length === 0){ if(containerTop) containerTop.innerHTML = ''; return; }

  const mkt = data.filter(d => d.familia === 'MKT');
  const pc = data.filter(d => d.familia === 'PC');
  const pagoSubcausas = ['Pago de importe','Error de importe','Pago IGIC','No pago IVA'];
  const insatSubcausas = ['Calidad de producto','Descontento servicio','Atención recibida','Mala reputación ORBIDI','No se cumplen expectativas'];
  const tecSubcausas = ['Retraso/Bloqueo por Gestoría externa','Dificultad en plataforma','Bloqueo técnico / Falta de credenciales'];
  const mktPago = mkt.filter(d => pagoSubcausas.includes(d.subcausa)).length;
  const pcPago = pc.filter(d => pagoSubcausas.includes(d.subcausa)).length;
  const mktInsat = mkt.filter(d => insatSubcausas.includes(d.subcausa)).length;
  const pcInsat = pc.filter(d => insatSubcausas.includes(d.subcausa)).length;
  const pcMem2 = pc.filter(d => d.memoria === 2);
  const pcMem2Ghost = pcMem2.filter(d => d.causa === 'Perdido - Ghosting').length;
  const pctPcMem2Ghost = pcMem2.length > 0 ? Math.round(pcMem2Ghost/pcMem2.length*100) : 0;
  const mktTec = mkt.filter(d => tecSubcausas.includes(d.subcausa)).length;
  const pcTec = pc.filter(d => tecSubcausas.includes(d.subcausa)).length;

  let html = '';
  if (mkt.length > 0 && pc.length > 0){
    html += `
      <div class="insight critical">
        <div class="insight-tag">Diferencia clave · pago</div>
        <div class="insight-title">En PC el dinero es el muro. En MKT casi nunca lo es.</div>
        <div class="insight-body">
          En <strong>PC</strong> los problemas financieros suman <strong>${pcPago} casos</strong> de ${pc.length} (${Math.round(pcPago/pc.length*100)}%). Cuando CS detecta el no-pago suele ser con 18-24 días de margen, demasiado tarde.
          En <strong>MKT</strong> esta palanca apenas existe (<strong>${mktPago} caso${mktPago !== 1 ? 's' : ''}</strong> sobre ${mkt.length}).
        </div>
        <div class="insight-stat">PC ${pcPago} casos financieros · MKT ${mktPago}</div>
      </div>
      <div class="insight opp">
        <div class="insight-tag">Diferencia clave · mem 2</div>
        <div class="insight-title">Mem 2 de PC es abrumadoramente ghosting (${pctPcMem2Ghost}%).</div>
        <div class="insight-body">
          De los ${pcMem2.length} proyectos de PC en Mem 2, <strong>${pcMem2Ghost} cayeron por ghosting</strong>. Casi todos están en pipeline <em>Penalización</em>: clientes que ya recibieron su ordenador y tienen que <strong>subir los logs de uso</strong> o agendar cita con Fractalia, y nunca respondieron.
        </div>
        <div class="insight-stat">PC Mem 2: ${pcMem2Ghost} de ${pcMem2.length} son ghosting · ligados a logs / cita Fractalia</div>
      </div>
      <div class="insight watch">
        <div class="insight-tag">Diferencia clave · insatisfacción</div>
        <div class="insight-title">MKT genera más insatisfacción que PC.</div>
        <div class="insight-body">
          Subcausas de insatisfacción: <strong>${mktInsat} en MKT</strong> (${Math.round(mktInsat/mkt.length*100)}%) frente a <strong>${pcInsat} en PC</strong> (${Math.round(pcInsat/pc.length*100)}%). Dentro de MKT, WEB concentra el grueso.
        </div>
        <div class="insight-stat">MKT ${mktInsat} insatisfacción · PC ${pcInsat} insatisfacción</div>
      </div>
      <div class="insight">
        <div class="insight-tag">Diferencia clave · fricción técnica</div>
        <div class="insight-title">La gestoría y la plataforma pesan más en MKT.</div>
        <div class="insight-body">
          Bloqueos no imputables al cliente: <strong>${mktTec} en MKT</strong> vs <strong>${pcTec} en PC</strong>. Son pérdidas <em>recuperables con un flujo de soporte técnico más ágil</em> los últimos 10 días antes del vencimiento.
        </div>
        <div class="insight-stat">Rescatables por asistencia técnica: MKT ${mktTec} · PC ${pcTec}</div>
      </div>
    `;
  } else if (mkt.length > 0){
    html += `
      <div class="insight watch">
        <div class="insight-tag">Foco · MKT${filters.producto ? ' · ' + filters.producto : ''}</div>
        <div class="insight-title">Sin familia PC en el filtro, la comparativa pierde sentido.</div>
        <div class="insight-body">
          Estás viendo ${mkt.length} proyectos de MKT. <strong>${mktInsat} cayeron por insatisfacción</strong> y <strong>${mktTec} por fricción técnica</strong>. Sumados: <strong>${mktInsat + mktTec} casos</strong>.
        </div>
        <div class="insight-stat">MKT solo · ${mkt.length} proyectos</div>
      </div>
    `;
  } else if (pc.length > 0){
    html += `
      <div class="insight critical">
        <div class="insight-tag">Foco · PC</div>
        <div class="insight-title">El dinero y la recolección de logs son los dos ejes.</div>
        <div class="insight-body">
          ${pc.length} proyectos de PC. <strong>${pcPago} por problemas de pago</strong> y <strong>${pcMem2Ghost} por ghosting en Mem 2</strong>.
        </div>
        <div class="insight-stat">PC solo · ${pc.length} proyectos</div>
      </div>
    `;
  }
  if (containerTop) containerTop.innerHTML = html;
}

// ============ SUBPRODUCTO INSIGHTS (VI) ============
function renderSubproductosInsights(){
  const data = getFiltered();
  const container = document.getElementById('subproductosInsights');
  const titleEl = document.getElementById('productosTitle');
  const descEl  = document.getElementById('productosDesc');

  if (filters.familia === 'PC'){
    titleEl.textContent = 'PC — una sola línea de producto';
    descEl.textContent  = 'No aplica desglose por subproducto';
  } else if (filters.producto && filters.producto !== 'PC'){
    titleEl.textContent = `Foco en ${filters.producto}`;
    descEl.textContent  = 'Comportamiento específico del subproducto filtrado';
  } else {
    titleEl.textContent = 'Dentro de MKT — por subproducto';
    descEl.textContent  = 'WEB, SEO, RRSS, FACT y los demás';
  }

  const mkt = data.filter(d => d.familia === 'MKT');
  if (mkt.length === 0){ container.innerHTML = ''; return; }

  function buildProductoInsight(prodName, klass){
    const subset = mkt.filter(d => d.producto === prodName);
    if (subset.length === 0) return '';
    const total = subset.length;
    const ghost = subset.filter(d => d.causa === 'Perdido - Ghosting').length;
    const baja = subset.filter(d => d.causa === 'Perdido - Baja').length;
    const desist = subset.filter(d => d.causa === 'Perdido - Desistido').length;
    const subcausaCount = {};
    subset.forEach(d => { subcausaCount[d.subcausa] = (subcausaCount[d.subcausa] || 0) + 1; });
    const topSub = Object.entries(subcausaCount).sort((a,b) => b[1] - a[1]).slice(0, 3);

    let title = '', body = '';
    if (prodName === 'WEB'){
      const calidad = subcausaCount['Calidad de producto'] || 0;
      const sinResp = subcausaCount['Contactado sin respuesta'] || 0;
      title = 'El producto que más pesa y el que más cuelga.';
      body = `WEB representa el grueso del volumen de MKT y concentra el mayor número de casos de ghosting (${ghost}). La casuística típica: el equipo envía la web, el cliente la revisa, no le gusta, y deja de contestar — quedando atrapado entre <em>"calidad de producto"</em> (${calidad} casos) y <em>"contactado sin respuesta"</em> (${sinResp} casos).`;
    } else if (prodName === 'SEO'){
      const sinGestion = subcausaCount['Sin gestión documentada'] || 0;
      const sinResp = subcausaCount['Contactado sin respuesta'] || 0;
      title = 'Sufre por falta de accesos más que por calidad.';
      body = `SEO tiene un porcentaje elevado de <em>"Sin gestión documentada"</em> (${sinGestion} de ${total} = ${Math.round(sinGestion/total*100)}%). También aparece "Contactado sin respuesta" (${sinResp}).`;
    } else if (prodName === 'RRSS'){
      const sinInt = subcausaCount['Sin interés en proyecto'] || 0;
      const cierre = subcausaCount['Cierre de negocio'] || 0;
      title = 'Aquí el "Sin interés en proyecto" aparece con fuerza.';
      body = `RRSS es el producto donde más clientes dicen abiertamente <em>"no me interesa seguir"</em> (${sinInt} caso${sinInt !== 1 ? 's' : ''}). ${cierre > 0 ? `También concentra ${cierre} caso${cierre !== 1 ? 's' : ''} de "cierre de negocio".` : ''}`;
    } else if (prodName === 'FACT'){
      const sinMot = subcausaCount['Sin motivo'] || 0;
      title = 'La factura electrónica se cae casi siempre "sin motivo".';
      body = `FACT: <strong>${sinMot} de ${total} casos (${Math.round(sinMot/total*100)}%) caen con subcausa "Sin motivo"</strong>. Trazabilidad conversacional pobre.`;
    } else if (prodName === 'ECOM'){
      title = 'Volumen bajo pero perfil mixto.';
      body = `ECOM: ${total} casos distribuidos entre diferentes causas, sin patrón dominante.`;
    } else if (prodName === 'ANALITICA'){
      title = 'Caídas tempranas sin trazabilidad.';
      body = `ANALÍTICA: ${total} proyectos, todos con subcausa <em>"Sin gestión documentada"</em>.`;
    } else {
      title = `${prodName} — ${total} proyecto${total !== 1 ? 's' : ''} en el filtro.`;
      body = `Top subcausas: ${topSub.map(s => `<em>${s[0]}</em> (${s[1]})`).join(' · ')}.`;
    }
    return `
      <div class="insight${klass ? ' ' + klass : ''}">
        <div class="insight-tag">${prodName} · ${total} proyecto${total !== 1 ? 's' : ''}</div>
        <div class="insight-title">${title}</div>
        <div class="insight-body">${body}</div>
        <div class="insight-stat">Ghosting ${ghost} · Baja ${baja} · Desistido ${desist}${topSub.length > 0 ? ' — Top: ' + topSub[0][0] + ' (' + topSub[0][1] + ')' : ''}</div>
      </div>
    `;
  }

  let productosMostrar = [];
  if (filters.producto && filters.producto !== 'PC'){
    productosMostrar = [filters.producto];
  } else {
    const prodCounts = {};
    mkt.forEach(d => { prodCounts[d.producto] = (prodCounts[d.producto] || 0) + 1; });
    productosMostrar = Object.entries(prodCounts).sort((a,b) => b[1] - a[1]).map(p => p[0]);
  }
  const classMap = { 'FACT': 'watch', 'ANALITICA': 'watch' };
  container.innerHTML = productosMostrar.map(p => buildProductoInsight(p, classMap[p] || '')).join('');
}

// ============ APEX CHARTS ============
const charts = {};
const APEX_COMMON = {
  chart: {
    background: 'transparent',
    foreColor: COLORS.soft,
    fontFamily: "'JetBrains Mono', monospace",
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 900,
      animateGradually: { enabled: true, delay: 120 },
      dynamicAnimation: { enabled: true, speed: 650 }
    }
  },
  states: {
    hover:  { filter: { type: 'lighten', value: 0.08 } },
    active: { filter: { type: 'none' } }
  },
  grid: {
    borderColor: 'rgba(255,255,255,.06)',
    strokeDashArray: 3,
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: true } }
  },
  tooltip: {
    theme: 'dark',
    style: { fontFamily: "'JetBrains Mono', monospace" },
    shared: false,
    intersect: true
  },
  legend: { labels: { colors: COLORS.soft }, markers: { radius: 12, width: 10, height: 10 } },
  dataLabels: { enabled: false }
};

function upsertChart(id, options){
  if (charts[id]){
    charts[id].updateOptions(options, true, true, true);
  } else {
    const el = document.querySelector(id);
    if (!el) return;
    charts[id] = new ApexCharts(el, options);
    charts[id].render();
  }
}

function renderCharts(){
  const data = getFiltered();
  const causasList = ['Perdido - Ghosting','Perdido - Baja','Perdido - Desistido'];
  const familias = filters.familia ? [filters.familia] : ['MKT','PC'];

  // 1) Causas x familia — stacked 100% horizontal
  const series1 = causasList.map(c => ({
    name: c.replace('Perdido - ',''),
    data: familias.map(f => {
      const subset = data.filter(d => d.familia === f);
      const total = subset.length || 1;
      const n = subset.filter(d => d.causa === c).length;
      return +(n/total*100).toFixed(1);
    })
  }));
  upsertChart('#chartCausasFamilia', {
    ...APEX_COMMON,
    chart: { ...APEX_COMMON.chart, type: 'bar', stacked: true, stackType: '100%', height: 260 },
    series: series1,
    xaxis: {
      categories: familias,
      labels: { style: { colors: COLORS.soft, fontFamily: "'JetBrains Mono', monospace" }, formatter: v => v + '%' },
      axisBorder: { color: 'rgba(255,255,255,.1)' }, axisTicks: { color: 'rgba(255,255,255,.1)' }
    },
    yaxis: { labels: { style: { colors: COLORS.soft, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' } } },
    plotOptions: { bar: { horizontal: true, borderRadius: 3, borderRadiusApplication: 'end' } },
    colors: [COLORS.ghost, COLORS.baja, COLORS.desist],
    fill: { type: 'solid', opacity: 0.95 },
    stroke: { show: true, width: 1, colors: ['rgba(0,0,0,0.3)'] },
    legend: { ...APEX_COMMON.legend, position: 'bottom' },
    dataLabels: {
      enabled: true,
      style: { colors: ['#ffffff'], fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700 },
      formatter: v => v > 8 ? v.toFixed(0) + '%' : '',
      dropShadow: { enabled: true, top: 1, left: 0, blur: 3, color: '#000', opacity: 0.6 }
    }
  });

  // 2) Causas x memoria — grouped bars
  const mems = [1, 2];
  const series2 = causasList.map(c => ({
    name: c.replace('Perdido - ',''),
    data: mems.map(m => data.filter(d => d.memoria === m && d.causa === c).length)
  }));
  upsertChart('#chartCausasMemoria', {
    ...APEX_COMMON,
    chart: { ...APEX_COMMON.chart, type: 'bar', height: 260 },
    series: series2,
    xaxis: {
      categories: ['Memoria 1','Memoria 2'],
      labels: { style: { colors: COLORS.soft } },
      axisBorder: { color: 'rgba(255,255,255,.1)' }, axisTicks: { color: 'rgba(255,255,255,.1)' }
    },
    yaxis: { labels: { style: { colors: COLORS.soft } } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '58%', borderRadiusApplication: 'end' } },
    colors: [COLORS.ghost, COLORS.baja, COLORS.desist],
    fill: { type: 'solid', opacity: 0.95 },
    stroke: { show: true, width: 1, colors: ['rgba(10,14,24,0.3)'] },
    legend: { ...APEX_COMMON.legend, position: 'bottom' },
    dataLabels: {
      enabled: true,
      style: { colors: ['#ffffff'], fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700 },
      offsetY: -22,
      background: { enabled: false },
      dropShadow: { enabled: true, top: 1, left: 0, blur: 3, color: '#000', opacity: 0.55 }
    }
  });

  // 3) Subcausas — horizontal bar ordenado
  const subcausaCount = countBy(data, 'subcausa');
  const subcausaSorted = Object.entries(subcausaCount).sort((a,b) => b[1] - a[1]);
  upsertChart('#chartSubcausas', {
    ...APEX_COMMON,
    chart: { ...APEX_COMMON.chart, type: 'bar', height: 400 },
    series: [{ name: 'Casos', data: subcausaSorted.map(s => ({ x: s[0], y: s[1], fillColor: CATEGORIA_COLOR[SUBCAUSA_CATEGORIA[s[0]]] || '#6e7898' })) }],
    plotOptions: { bar: { horizontal: true, borderRadius: 3, distributed: true, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: true, style: { colors: [COLORS.ink], fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 500 }, offsetX: 24 },
    xaxis: { labels: { style: { colors: COLORS.soft } } },
    yaxis: { labels: { style: { colors: COLORS.soft, fontSize: '11px' } } },
    legend: { show: false },
    stroke: { width: 0 },
    tooltip: { theme: 'dark', y: { formatter: v => v + ' casos' } }
  });

  // 4) Categoría — donut
  const catCount = {};
  data.forEach(d => {
    const cat = SUBCAUSA_CATEGORIA[d.subcausa] || 'Otro';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  const catEntries = Object.entries(catCount).sort((a,b) => b[1] - a[1]);
  upsertChart('#chartCategoria', {
    ...APEX_COMMON,
    chart: { ...APEX_COMMON.chart, type: 'donut', height: 400 },
    series: catEntries.map(c => c[1]),
    labels: catEntries.map(c => c[0]),
    colors: catEntries.map(c => CATEGORIA_COLOR[c[0]] || '#6e7898'),
    stroke: { width: 2, colors: ['rgba(10,14,24,.8)'] },
    plotOptions: {
      pie: {
        donut: {
          size: '62%',
          labels: {
            show: true,
            name: { show: true, color: COLORS.soft, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' },
            value: { show: true, color: COLORS.ink, fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 500 },
            total: { show: true, label: 'Total', color: COLORS.soft, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }
          }
        }
      }
    },
    legend: { ...APEX_COMMON.legend, position: 'bottom', fontFamily: "'JetBrains Mono', monospace" },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark', y: { formatter: v => v + ' casos' } }
  });

  // 5) Productos (stacked) — solo MKT, respeta memoria+causa pero muestra todos los subproductos
  const productos = ['WEB','SEO','RRSS','FACT','ECOM','ANALITICA'];
  const baseMkt = DATOS.filter(d => {
    if (d.familia !== 'MKT') return false;
    if (filters.memoria && String(d.memoria) !== filters.memoria) return false;
    if (filters.causa && d.causa !== filters.causa) return false;
    return true;
  });
  const prodData = productos.map(p => {
    const subset = baseMkt.filter(d => d.producto === p);
    return {
      producto: p, total: subset.length,
      ghost: subset.filter(d => d.causa === 'Perdido - Ghosting').length,
      baja: subset.filter(d => d.causa === 'Perdido - Baja').length,
      desist: subset.filter(d => d.causa === 'Perdido - Desistido').length
    };
  }).filter(p => p.total > 0).sort((a,b) => b.total - a.total);

  upsertChart('#chartProductos', {
    ...APEX_COMMON,
    chart: { ...APEX_COMMON.chart, type: 'bar', stacked: true, height: 400 },
    series: [
      { name: 'Ghosting', data: prodData.map(p => p.ghost) },
      { name: 'Baja', data: prodData.map(p => p.baja) },
      { name: 'Desistido', data: prodData.map(p => p.desist) }
    ],
    xaxis: {
      categories: prodData.map(p => `${p.producto} (${p.total})`),
      labels: { style: { colors: COLORS.soft, fontSize: '11px' } }
    },
    yaxis: { labels: { style: { colors: COLORS.soft } } },
    colors: [COLORS.ghost, COLORS.baja, COLORS.desist],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', borderRadiusApplication: 'end' } },
    fill: { type: 'solid', opacity: 0.95 },
    stroke: { show: true, width: 1, colors: ['rgba(0,0,0,0.4)'] },
    legend: { ...APEX_COMMON.legend, position: 'bottom' },
    dataLabels: {
      enabled: true,
      style: { colors: ['#ffffff'], fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700 },
      formatter: v => v > 3 ? v : '',
      dropShadow: { enabled: true, top: 1, left: 0, blur: 3, color: '#000', opacity: 0.6 }
    }
  });
}

// ============ TABLA ============
function renderTable(){
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  let data = getFiltered();
  if (search){
    data = data.filter(d =>
      d.nombre.toLowerCase().includes(search) ||
      d.id.includes(search) ||
      d.subcausa.toLowerCase().includes(search) ||
      (d.causa && d.causa.toLowerCase().includes(search)) ||
      (d.comentario_cs && d.comentario_cs.toLowerCase().includes(search)) ||
      (d.estado_acuerdo && d.estado_acuerdo.toLowerCase().includes(search)) ||
      (d.pipeline && d.pipeline.toLowerCase().includes(search))
    );
  }
  if (currentSort.field){
    data.sort((a,b) => {
      let va = a[currentSort.field] || '';
      let vb = b[currentSort.field] || '';
      if (typeof va === 'number') return currentSort.asc ? va - vb : vb - va;
      return currentSort.asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const pageStart = (currentPage - 1) * pageSize;
  const pageData = data.slice(pageStart, pageStart + pageSize);

  document.getElementById('tableCounter').textContent = `${data.length} proyecto${data.length !== 1 ? 's' : ''}`;
  document.getElementById('paginationInfo').textContent = `Página ${currentPage} de ${totalPages} · mostrando ${pageData.length} de ${data.length}`;
  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= totalPages;

  const rowHtml = pageData.map(d => {
    const causaClass = d.causa === 'Perdido - Ghosting' ? 'causa-ghost' :
                       d.causa === 'Perdido - Baja' ? 'causa-baja' : 'causa-desist';
    const causaLabel = d.causa ? d.causa.replace('Perdido - ', '') : '—';
    return `
      <tr>
        <td class="id" data-label="ID"><a href="${hubspotUrl(d.id, d.familia)}" target="_blank" rel="noopener">${d.id}</a></td>
        <td class="nombre" data-label="Proyecto" title="${d.nombre}">${d.nombre}</td>
        <td class="familia" data-label="Fam"><span class="badge badge-${d.familia}">${d.familia}</span></td>
        <td class="producto" data-label="Prod"><span class="badge badge-${d.producto}">${d.producto}</span></td>
        <td class="mem" data-label="Mem">M${d.memoria}</td>
        <td data-label="Causa"><span class="causa-tag ${causaClass}">${causaLabel}</span></td>
        <td class="subcausa" data-label="Subcausa">${d.subcausa}</td>
        <td data-label="Estado acuerdo">${d.estado_acuerdo || '—'}</td>
        <td data-label="Pipeline">${d.pipeline || '—'}</td>
      </tr>
    `;
  }).join('');
  document.getElementById('tablaBody').innerHTML = rowHtml || '<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--ink-muted);">Sin resultados</td></tr>';
}

// ============ FILTER LINE ============
function updateFilterLine(){
  const parts = [];
  if (filters.familia) parts.push(`Familia: ${filters.familia}`);
  if (filters.producto) parts.push(`Producto: ${filters.producto}`);
  if (filters.memoria) parts.push(`Mem ${filters.memoria}`);
  if (filters.causa) parts.push(filters.causa.replace('Perdido - ',''));
  document.getElementById('filterLine').textContent = parts.length ? `▸ ${parts.join(' · ')}` : '▸ ningún filtro activo';
  document.getElementById('footerInfo').textContent = parts.length
    ? `${getFiltered().length} proyectos · ${parts.join(' · ')}`
    : '389 proyectos analizados · MKT + PC';
}

// ============ RENDER ALL ============
function renderAll(){
  updateFilterLine();
  renderKPIs();
  renderHeadlineInsights();
  renderEstructuraInsights();
  renderSubcausaInsights();
  renderComparativaInsights();
  renderSubproductosInsights();
  renderCharts();
  renderTable();
  document.querySelectorAll('.chip').forEach(chip => {
    const f = chip.dataset.filter, v = chip.dataset.value;
    chip.classList.toggle('active', filters[f] === v);
  });
  const productoFilter = document.getElementById('productoFilter');
  if (filters.familia === 'PC'){
    productoFilter.style.opacity = '0.4';
    productoFilter.style.pointerEvents = 'none';
  } else {
    productoFilter.style.opacity = '1';
    productoFilter.style.pointerEvents = 'auto';
  }
  // Re-observe any newly-injected cards for scroll reveals
  observeAll();
}

// ============ EVENT LISTENERS ============
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const f = chip.dataset.filter, v = chip.dataset.value;
    filters[f] = v;
    if (f === 'familia') filters.producto = '';
    currentPage = 1;
    renderAll();
  });
});
function resetFilters(){
  filters.familia = ''; filters.producto = ''; filters.memoria = ''; filters.causa = '';
  currentPage = 1;
  document.getElementById('searchInput').value = '';
  renderAll();
}
window.resetFilters = resetFilters;

document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1;
  renderTable();
});
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const field = th.dataset.sort;
    if (currentSort.field === field) currentSort.asc = !currentSort.asc;
    else { currentSort.field = field; currentSort.asc = true; }
    document.querySelectorAll('th').forEach(t => t.classList.remove('sorted','asc'));
    th.classList.add('sorted');
    if (currentSort.asc) th.classList.add('asc');
    renderTable();
  });
});
document.getElementById('prevPage').addEventListener('click', () => { currentPage--; renderTable(); });
document.getElementById('nextPage').addEventListener('click', () => { currentPage++; renderTable(); });

// ============ VANTA TOPOLOGY (if available) ============
function initVanta(){}

// ============ INITIAL ENTRY ANIMATION ============
function initialReveal(){
  if (!window.gsap) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.masthead-top', { autoAlpha: 0, y: -10, duration: .6 })
    .from('.masthead h1', { autoAlpha: 0, y: 24, filter: 'blur(10px)', duration: .9 }, '-=0.3')
    .from('.masthead .sub span', { autoAlpha: 0, y: 8, duration: .5, stagger: .06 }, '-=0.4')
    .from('.filtros .filter-group, .filtros .filter-reset', { autoAlpha: 0, y: 8, duration: .45, stagger: .05 }, '-=0.3')
    .from('#overview .section-header', { autoAlpha: 0, y: 14, duration: .55 }, '-=0.2');
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initialReveal();
  renderAll();
});

// ============ STARFIELD + SHOOTING STARS ============
function initStarfield(){
  const c = document.getElementById('starfield');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, dpr, stars = [], shoots = [], mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth = window.innerWidth;
    h = c.clientHeight = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars();
  }
  function makeStars(){
    stars = [];
    const density = Math.min(1, (w * h) / (1920 * 1080));
    const N = Math.round(380 * density);
    // Milky-way band axis — diagonal from top-left to bottom-right
    const cx = w * 0.5, cy = h * 0.52;
    const angle = -Math.PI * 0.10; // slight tilt
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (let i = 0; i < N; i++){
      // Random distance along band, distance across band (gaussian-ish)
      const along = (Math.random() - 0.5) * Math.max(w, h) * 1.6;
      const acrossRand = (Math.random() + Math.random() + Math.random() - 1.5);
      const across = acrossRand * h * 0.28;
      const x = cx + along * cos - across * sin;
      const y = cy + along * sin + across * cos;
      // Size / brightness proportional to closeness to band center
      const bandWeight = Math.exp(- (across*across) / (2 * (h*0.16)*(h*0.16)));
      const rBase = Math.random() * Math.random();
      const r = 0.3 + rBase * (0.9 + bandWeight * 1.3);
      const alpha = 0.25 + Math.random() * 0.6 + bandWeight * 0.3;
      // Hue: mostly white/blue, occasional warm star near band
      const hueRoll = Math.random();
      let hue;
      if (hueRoll < 0.7) hue = 'rgba(220, 230, 255, ALPHA)';
      else if (hueRoll < 0.88) hue = 'rgba(180, 200, 255, ALPHA)';
      else if (hueRoll < 0.96) hue = 'rgba(255, 230, 220, ALPHA)';
      else hue = 'rgba(255, 200, 230, ALPHA)';
      stars.push({
        x, y, r, alpha, hue,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.004 + Math.random() * 0.012,
        drift: 0.01 + Math.random() * 0.03,
        parallax: 0.04 + rBase * 0.25
      });
    }
  }
  function spawnShoot(){
    const startX = Math.random() * w * 0.6;
    const startY = Math.random() * h * 0.4;
    const angleDeg = 20 + Math.random() * 25;
    const angle = angleDeg * Math.PI / 180;
    const speed = 8 + Math.random() * 6;
    shoots.push({
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 60 + Math.random() * 40,
      length: 140 + Math.random() * 160
    });
  }
  function drawShoot(s){
    const tailX = s.x - s.vx * (s.length / 14);
    const tailY = s.y - s.vy * (s.length / 14);
    const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.6, 'rgba(200,220,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    // head
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX / w - 0.5) * 30;
    mouse.ty = (e.clientY / h - 0.5) * 30;
  });

  function loop(){
    ctx.clearRect(0, 0, w, h);
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    for (const s of stars){
      s.tw += s.twSpeed;
      const tw = 0.6 + Math.sin(s.tw) * 0.4;
      const px = s.x + mouse.x * s.parallax;
      const py = s.y + mouse.y * s.parallax;
      const a = s.alpha * tw;
      ctx.fillStyle = s.hue.replace('ALPHA', a.toFixed(3));
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle glow for bigger stars
      if (s.r > 1.2){
        ctx.fillStyle = s.hue.replace('ALPHA', (a * 0.25).toFixed(3));
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // slow horizontal drift
      s.x += s.drift * 0.015;
      if (s.x > w + 50) s.x = -50;
    }
    // Shooting stars
    if (Math.random() < 0.004 && shoots.length < 2) spawnShoot();
    for (let i = shoots.length - 1; i >= 0; i--){
      const s = shoots[i];
      s.x += s.vx; s.y += s.vy; s.life++;
      drawShoot(s);
      if (s.life > s.maxLife || s.x > w + 200 || s.y > h + 200) shoots.splice(i, 1);
    }
    requestAnimationFrame(loop);
  }
  resize();
  loop();
}
