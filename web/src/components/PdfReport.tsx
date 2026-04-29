import { CONTACT } from '../config/contact';

/**
 * PdfReport — off-screen component rendered and captured by html2canvas.
 * Each child of <div id="pdf-page-N"> becomes one PDF page.
 * Width is fixed at 794px (A4 at 96dpi).
 */

interface DomainScore {
  domain_name: string;
  score: number;
}

interface AssessmentResult {
  assessment_id: string;
  overall_score: number;
  domain_scores: DomainScore[];
}

interface LeadData {
  nombre: string;
  cargo: string;
  empresa: string;
  correo: string;
}

interface PdfReportProps {
  result: AssessmentResult;
  lead: LeadData | null;
  radarImageUrl: string; // base64 snapshot of the radar canvas
}

const PAGE_W = 794;

function getLevelName(score: number) {
  if (score < 2) return 'Inicial';
  if (score < 3) return 'Gestionado';
  if (score < 4) return 'Definido';
  if (score < 4.5) return 'Medido';
  return 'Optimizado';
}

function getLevelNumber(score: number) {
  if (score < 2) return 1;
  if (score < 3) return 2;
  if (score < 4) return 3;
  if (score < 4.5) return 4;
  return 5;
}

function getLevelColor(score: number) {
  if (score < 2.5) return '#ef4444';
  if (score < 3.5) return '#f97316';
  return '#22c55e';
}

function formatDate(date: Date) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

const LEVEL_CONTEXT: Record<number, { context: string; implication: string }> = {
  1: {
    context: 'La organización opera sin una estrategia formal de datos. Los procesos son ad hoc y dependen de esfuerzos individuales.',
    implication: 'Riesgo operacional alto. Las decisiones se toman con datos inconsistentes.',
  },
  2: {
    context: 'Existen iniciativas de gestión de datos en algunas áreas, pero sin coordinación entre equipos.',
    implication: 'La organización puede gestionar el día a día, pero escala con dificultad.',
  },
  3: {
    context: 'Políticas documentadas con implementación inconsistente. Conciencia estratégica pero falta alineación ejecutiva.',
    implication: 'Punto de inflexión crítico. Invertir ahora acelera la capacidad analítica en 12-18 meses.',
  },
  4: {
    context: 'Procesos medidos y monitorizados. Cultura de datos emergente con métricas de calidad definidas.',
    implication: 'Decisiones con alto nivel de confianza. Siguiente paso: analítica avanzada.',
  },
  5: {
    context: 'Datos tratados como activo estratégico. Mejora continua institucionalizada.',
    implication: 'Posición diferencial. Preparado para IA y productos de datos a escala.',
  },
};

function getDomainInsight(d: DomainScore) {
  if (d.score < 2.5) return `Brecha crítica que impacta la confiabilidad de los datos. Requiere atención inmediata.`;
  if (d.score < 3.5) return `Progreso visible con inconsistencias. Un roadmap estructurado puede alcanzar nivel óptimo en 6-9 meses.`;
  return `Fortaleza consolidada. Puede servir como modelo de referencia para elevar otros dominios.`;
}

const CMMI_LEVELS = [
  { n: 1, name: 'Inicial', range: '< 2.0', desc: 'Procesos ad hoc, reactivos, sin estándares ni gobernanza formal.' },
  { n: 2, name: 'Gestionado', range: '2.0 – 2.9', desc: 'Procesos básicos en algunas áreas, sin coordinación transversal.' },
  { n: 3, name: 'Definido', range: '3.0 – 3.9', desc: 'Políticas documentadas con adopción parcial y estrategia en desarrollo.' },
  { n: 4, name: 'Medido', range: '4.0 – 4.4', desc: 'Procesos controlados con métricas de calidad y ownership definido.' },
  { n: 5, name: 'Optimizado', range: '≥ 4.5', desc: 'Mejora continua institucionalizada. Datos como activo estratégico.' },
];

// ─── Shared page wrapper ──────────────────────────────────────────────────────

const PAGE_H = 1123; // A4 at 96dpi

function Page({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        width: PAGE_W,
        height: PAGE_H,
        backgroundColor: '#0f172a',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-35deg)',
        fontSize: 72,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.025)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
        letterSpacing: 4,
      }}>
        DataCompass Free
      </div>
      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid rgba(148,163,184,0.1)',
        padding: '12px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: '#475569' }}>DataCompass · Diagnóstico CMMI Freemium</span>
        <span style={{ fontSize: 11, color: '#475569' }}>data-compass-app.web.app</span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', marginBottom: 16 }}>
      {children}
    </p>
  );
}

// ─── Page 1: Cover ────────────────────────────────────────────────────────────

function CoverPage({ result, lead }: { result: AssessmentResult; lead: LeadData | null }) {
  const levelNumber = getLevelNumber(result.overall_score);
  const levelName = getLevelName(result.overall_score);
  const levelColor = getLevelColor(result.overall_score);

  return (
    <Page id="pdf-page-1">
      <div style={{ padding: '48px 56px 40px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 80 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 14 }}>DC</span>
          </div>
          <span style={{ color: 'white', fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
            Data<span style={{ color: '#60a5fa' }}>Compass</span>
          </span>
          <span style={{ marginLeft: 8, fontSize: 11, color: '#475569', border: '1px solid #334155', borderRadius: 20, padding: '2px 10px' }}>
            Freemium
          </span>
        </div>

        {/* Main title */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, fontWeight: 500, letterSpacing: 1 }}>
            REPORTE DE MADUREZ EN GOBERNANZA DE DATOS
          </p>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 8 }}>
            {lead?.empresa || 'Tu Organización'}
          </h1>
          <div style={{ width: 56, height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', marginBottom: 40 }} />

          {/* Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 56 }}>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>
              <span style={{ color: '#64748b' }}>Preparado para: </span>
              {lead?.nombre || '—'} · {lead?.cargo || '—'}
            </p>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>
              <span style={{ color: '#64748b' }}>Fecha: </span>
              {formatDate(new Date())}
            </p>
          </div>

          {/* Level badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 20,
            border: `1px solid ${levelColor}40`,
            borderRadius: 16,
            padding: '20px 28px',
            background: `${levelColor}0d`,
            alignSelf: 'flex-start',
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: levelColor, textTransform: 'uppercase', marginBottom: 4 }}>
                Nivel de Madurez
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                {result.overall_score.toFixed(1)}
                <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}> / 5.0</span>
              </p>
            </div>
            <div style={{ width: 1, height: 48, background: `${levelColor}30` }} />
            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Nivel {levelNumber}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: levelColor }}>{levelName}</p>
            </div>
          </div>
        </div>

        {/* Freemium notice */}
        <div style={{
          marginTop: 48,
          padding: '14px 20px',
          borderRadius: 10,
          background: 'rgba(148,163,184,0.05)',
          border: '1px solid rgba(148,163,184,0.1)',
        }}>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Informe Freemium completo · </span>
            Este diagnóstico CMMI ha sido generado de forma gratuita por DataCompass. El informe contiene el análisis completo de los 5 dominios evaluados. Si te ha sido de utilidad, considera apoyar el proyecto con una donación voluntaria.
          </p>
        </div>
      </div>
    </Page>
  );
}

// ─── Page 2: Score + Radar ────────────────────────────────────────────────────

function ScorePage({ result, radarImageUrl }: { result: AssessmentResult; radarImageUrl: string }) {
  const levelColor = getLevelColor(result.overall_score);
  const levelName = getLevelName(result.overall_score);
  const levelNumber = getLevelNumber(result.overall_score);
  const circumference = 2 * Math.PI * 54;

  return (
    <Page id="pdf-page-2">
      <div style={{ padding: '40px 52px 56px', boxSizing: 'border-box' }}>
        <SectionLabel>Puntuación global y perfil por dominio</SectionLabel>

        <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
          {/* Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              <svg width="160" height="160" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={levelColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.overall_score / 5) * circumference} ${circumference}`}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1 }}>{result.overall_score.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>de 5.0</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Nivel {levelNumber}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: levelColor }}>{levelName}</p>
            </div>
          </div>

          {/* Domain bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
            {result.domain_scores.map(d => (
              <div key={d.domain_name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: getLevelColor(d.score), fontWeight: 500 }}>{d.domain_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: getLevelColor(d.score) }}>{d.score.toFixed(1)}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(148,163,184,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.score / 5) * 100}%`, background: getLevelColor(d.score), borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar snapshot */}
        <div style={{
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.1)',
          background: 'rgba(30,41,59,0.5)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', marginBottom: 16 }}>
            Perfil por Dominio
          </p>
          {radarImageUrl
            ? <img src={radarImageUrl} style={{ maxWidth: 480, width: '100%' }} alt="Radar" />
            : <p style={{ color: '#475569', fontSize: 13 }}>Gráfico no disponible</p>
          }
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, justifyContent: 'center' }}>
          {[{ color: '#ef4444', label: 'Crítico (< 2.5)' }, { color: '#f97316', label: 'En desarrollo (2.5–3.5)' }, { color: '#22c55e', label: 'Consolidado (> 3.5)' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

// ─── Page 3: Executive Summary ────────────────────────────────────────────────

function SummaryPage({ result }: { result: AssessmentResult }) {
  const levelNumber = getLevelNumber(result.overall_score);
  const levelName = getLevelName(result.overall_score);
  const levelColor = getLevelColor(result.overall_score);
  const ctx = LEVEL_CONTEXT[levelNumber];
  const sorted = [...result.domain_scores].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const critical = result.domain_scores.filter(d => d.score < 2.5);
  const medium = result.domain_scores.filter(d => d.score >= 2.5 && d.score < 3.5);
  const strong = result.domain_scores.filter(d => d.score >= 3.5);

  return (
    <Page id="pdf-page-3">
      <div style={{ padding: '40px 52px 56px', boxSizing: 'border-box' }}>
        <SectionLabel>Resumen Ejecutivo</SectionLabel>

        {/* Level headline */}
        <div style={{
          borderRadius: 10,
          border: `1px solid ${levelColor}30`,
          background: `${levelColor}0a`,
          padding: '18px 22px',
          marginBottom: 28,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: levelColor, textTransform: 'uppercase', marginBottom: 6 }}>
            Nivel {levelNumber} · {levelName}
          </p>
          <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 8 }}>{ctx.context}</p>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 10 }}>{ctx.implication}</p>
        </div>

        {/* Domain insights */}
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', marginBottom: 14 }}>Análisis por dominio</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {result.domain_scores.map(d => (
            <div key={d.domain_name} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: getLevelColor(d.score), marginTop: 5, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                <span style={{ color: getLevelColor(d.score), fontWeight: 600 }}>{d.domain_name} ({d.score.toFixed(1)})</span>
                {' — '}{getDomainInsight(d)}
              </p>
            </div>
          ))}
        </div>

        {/* Best / Worst */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)', padding: '14px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#22c55e', textTransform: 'uppercase', marginBottom: 6 }}>Fortaleza principal</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 3 }}>{best.domain_name}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{best.score.toFixed(1)} / 5.0</p>
          </div>
          <div style={{ borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', padding: '14px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#ef4444', textTransform: 'uppercase', marginBottom: 6 }}>Área prioritaria</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 3 }}>{worst.domain_name}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{worst.score.toFixed(1)} / 5.0</p>
          </div>
        </div>

        {/* Strategic recommendation */}
        <div style={{ borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)', padding: '14px 18px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#60a5fa', textTransform: 'uppercase', marginBottom: 8 }}>Recomendación estratégica</p>
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            {critical.length > 0
              ? `Prioriza un plan de remediación inmediato en ${critical.map(d => d.domain_name).join(' y ')}. Estas brechas críticas limitan el valor de los avances en el resto de dominios.`
              : medium.length > 0
              ? `Con ${strong.length} dominio${strong.length !== 1 ? 's' : ''} consolidado${strong.length !== 1 ? 's' : ''}, el foco debe estar en escalar las prácticas exitosas hacia ${medium.map(d => d.domain_name).join(', ')} para lograr una madurez homogénea.`
              : 'La organización ha alcanzado madurez consistente en todos los dominios. El siguiente horizonte es la analítica avanzada, automatización de calidad y productos de datos.'
            }
          </p>
        </div>
      </div>
    </Page>
  );
}

// ─── Page 4: CMMI Table ───────────────────────────────────────────────────────

function CmmiTablePage({ result }: { result: AssessmentResult }) {
  const currentLevel = getLevelNumber(result.overall_score);

  return (
    <Page id="pdf-page-4">
      <div style={{ padding: '40px 52px 56px', boxSizing: 'border-box' }}>
        <SectionLabel>Modelo de Madurez CMMI — Referencia comparativa</SectionLabel>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
          El modelo CMMI (Capability Maturity Model Integration) define cinco niveles de madurez para evaluar la capacidad de una organización en la gestión y gobernanza de sus datos. Tu organización se encuentra actualmente en el <span style={{ color: 'white', fontWeight: 600 }}>Nivel {currentLevel}</span>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CMMI_LEVELS.map(l => {
            const isCurrentLevel = l.n === currentLevel;
            const isPast = l.n < currentLevel;
            const color = l.n === 1 ? '#ef4444' : l.n === 2 ? '#f97316' : l.n <= 3 ? '#f97316' : '#22c55e';
            return (
              <div
                key={l.n}
                style={{
                  borderRadius: 10,
                  border: isCurrentLevel ? `2px solid ${color}60` : '1px solid rgba(148,163,184,0.1)',
                  background: isCurrentLevel ? `${color}0d` : 'rgba(30,41,59,0.3)',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                  opacity: !isPast && !isCurrentLevel ? 0.6 : 1,
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isCurrentLevel ? `${color}20` : 'rgba(148,163,184,0.08)',
                  border: `1px solid ${isCurrentLevel ? `${color}40` : 'rgba(148,163,184,0.15)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: isCurrentLevel ? color : '#64748b' }}>{l.n}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: isCurrentLevel ? 'white' : '#94a3b8' }}>{l.name}</p>
                    <span style={{ fontSize: 11, color: '#475569' }}>({l.range})</span>
                    {isCurrentLevel && (
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color, background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase' }}>
                        Tu nivel actual
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{l.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Glossary */}
        <div style={{ marginTop: 36, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', marginBottom: 12 }}>Glosario</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {[
              ['CMMI', 'Capability Maturity Model Integration'],
              ['Gobernanza de datos', 'Políticas y estándares para gestión de activos de datos'],
              ['Data Owner', 'Responsable de un dominio de datos en la organización'],
              ['Linaje de datos', 'Trazabilidad del origen y transformación de los datos'],
              ['Calidad de datos', 'Grado en que los datos cumplen requerimientos de uso'],
              ['Arquitectura de datos', 'Diseño estructural de sistemas y flujos de información'],
            ].map(([term, def]) => (
              <div key={term}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{term}: </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{def}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

// ─── Page 5: Donation + Legal ─────────────────────────────────────────────────

function ClosingPage({ result }: { result: AssessmentResult }) {
  return (
    <Page id="pdf-page-5">
      <div style={{ padding: '40px 52px 56px', boxSizing: 'border-box' }}>

        {/* Support section */}
        <div style={{
          borderRadius: 14,
          border: '1px solid rgba(148,163,184,0.15)',
          background: 'rgba(30,41,59,0.6)',
          padding: '32px 36px',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', marginBottom: 12 }}>
            Apoya DataCompass
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 10 }}>
            ¿Te ha servido este diagnóstico?
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
            Este diagnóstico CMMI es completamente gratuito, sin publicidad y sin restricciones. Si te ha aportado valor y quieres contribuir a que siga siendo libre y mejorando, considera hacer una donación voluntaria.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FFDD00', borderRadius: 12, padding: '10px 20px',
            }}>
              <span style={{ fontSize: 16 }}>☕</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 700 }}>Buy Me a Coffee</p>
                <p style={{ fontSize: 10, color: '#555' }}>{CONTACT.BMC_HANDLE}</p>
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#0070ba', borderRadius: 12, padding: '10px 20px',
            }}>
              <span style={{ fontSize: 16, color: 'white' }}>💙</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>PayPal</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{CONTACT.PAYPAL_EMAIL} · mín. $10 USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div style={{
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.1)',
          background: 'rgba(15,23,42,0.8)',
          padding: '22px 26px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#475569', marginBottom: 12 }}>
            Aviso Legal y Limitación de Responsabilidad
          </p>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8 }}>
            Este informe ha sido generado automáticamente por DataCompass con base en las respuestas proporcionadas por el usuario durante el proceso de evaluación. Los resultados reflejan una autoevaluación y tienen carácter orientativo y referencial.
          </p>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8, marginTop: 10 }}>
            <strong style={{ color: '#64748b' }}>DataCompass no garantiza</strong> la exactitud, completitud ni idoneidad de los resultados para ningún propósito específico. La organización evaluada asume plena responsabilidad por las decisiones, acciones o inversiones que tome con base en este informe. DataCompass, sus creadores y colaboradores quedan exentos de cualquier responsabilidad directa, indirecta, incidental o consecuente derivada del uso de este diagnóstico.
          </p>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8, marginTop: 10 }}>
            Este documento es de uso interno y no debe ser utilizado como única fuente de decisión en procesos de auditoría formal, certificación regulatoria o evaluación de terceros.
          </p>
        </div>

        {/* Footer meta */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: '#334155' }}>ID: {result.assessment_id}</p>
          <p style={{ fontSize: 11, color: '#334155' }}>Generado el {formatDate(new Date())} · DataCompass Freemium</p>
        </div>
      </div>
    </Page>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PdfReport({ result, lead, radarImageUrl }: PdfReportProps) {
  return (
    <div style={{ position: 'fixed', top: '-99999px', left: 0, pointerEvents: 'none', zIndex: -9999, width: 794 }}>
      <CoverPage result={result} lead={lead} />
      <ScorePage result={result} radarImageUrl={radarImageUrl} />
      <SummaryPage result={result} />
      <CmmiTablePage result={result} />
      <ClosingPage result={result} />
    </div>
  );
}
