import { useState, useEffect, useCallback } from 'react';
import PdfReport from './PdfReport';
import { generatePdf, captureRadarImage } from '../utils/generatePdf';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface LeadData {
  nombre: string;
  cargo: string;
  empresa: string;
  correo: string;
}

interface DomainScore {
  domain_name: string;
  score: number;
}

interface AssessmentResult {
  assessment_id: string;
  overall_score: number;
  domain_scores: DomainScore[];
}

interface ResultDashboardProps {
  result: AssessmentResult;
  donationSlot?: React.ReactNode;
}

function getLevelName(score: number): string {
  if (score < 2) return 'Inicial';
  if (score < 3) return 'Gestionado';
  if (score < 4) return 'Definido';
  if (score < 4.5) return 'Medido';
  return 'Optimizado';
}

function getLevelNumber(score: number): number {
  if (score < 2) return 1;
  if (score < 3) return 2;
  if (score < 4) return 3;
  if (score < 4.5) return 4;
  return 5;
}

function getLevelColor(score: number): string {
  if (score < 2.5) return '#ef4444';   // rojo  — crítico
  if (score < 3.5) return '#f97316';   // naranja — medio
  return '#22c55e';                     // verde  — bueno
}

function formatDate(date: Date): string {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

const LEVEL_CONTEXT: Record<number, { headline: string; context: string; implication: string }> = {
  1: {
    headline: 'Gestión de datos reactiva y no estructurada',
    context: 'La organización opera sin una estrategia formal de datos. Los procesos son ad hoc, dependen de esfuerzos individuales y no existe visibilidad centralizada sobre los activos de información.',
    implication: 'El riesgo operacional es alto: las decisiones se toman con datos inconsistentes, lo que limita la capacidad de respuesta ante cambios de negocio y expone a la organización ante auditorías regulatorias.',
  },
  2: {
    headline: 'Procesos básicos de datos sin estandarización transversal',
    context: 'Existen iniciativas de gestión de datos en algunas áreas, pero sin coordinación entre equipos. La calidad de los datos varía según la unidad de negocio y no hay responsabilidades formalmente asignadas.',
    implication: 'La organización puede gestionar operaciones del día a día, pero escala con dificultad. La generación de reportes confiables consume más tiempo y recursos del necesario.',
  },
  3: {
    headline: 'Madurez en transición: procesos definidos con adopción parcial',
    context: 'La organización cuenta con políticas y estándares documentados de gobernanza de datos, pero su implementación es inconsistente. Hay conciencia estratégica sobre el valor de los datos, aunque falta alineación ejecutiva.',
    implication: 'Es el punto de inflexión crítico: las organizaciones en Nivel 3 que invierten en consolidar sus procesos aceleran significativamente su capacidad analítica y competitiva en los siguientes 12-18 meses.',
  },
  4: {
    headline: 'Gestión de datos orientada a métricas y control de calidad',
    context: 'Los procesos están medidos, monitorizados y mejoran continuamente. Existe una cultura de datos emergente con métricas de calidad definidas, linaje documentado y ownership claro por dominio.',
    implication: 'La organización puede tomar decisiones basadas en datos con alto nivel de confianza. El siguiente paso es sistematizar la mejora continua y explotar capacidades analíticas avanzadas.',
  },
  5: {
    headline: 'Excelencia operacional en gobernanza de datos',
    context: 'La organización ha alcanzado un nivel de madurez donde los datos son tratados como un activo estratégico de primer orden. Los procesos se optimizan proactivamente con mejora continua institucionalizada.',
    implication: 'Posición diferencial frente al mercado. La organización está preparada para escalar capacidades de IA, analítica avanzada y productos de datos con gobernanza sólida como base.',
  },
};

function getDomainInsight(domain: DomainScore): string {
  const name = domain.domain_name;
  const s = domain.score;
  if (s < 2.5) {
    return `${name} (${s.toFixed(1)}) representa una brecha crítica que impacta directamente la confiabilidad de los datos. Requiere un plan de acción inmediato con recursos dedicados.`;
  }
  if (s < 3.5) {
    return `${name} (${s.toFixed(1)}) muestra progreso pero aún presenta inconsistencias. Con un roadmap estructurado puede alcanzar nivel óptimo en 6-9 meses.`;
  }
  return `${name} (${s.toFixed(1)}) es una fortaleza consolidada que puede servir como modelo de referencia para elevar los dominios con menor madurez.`;
}

export default function ResultDashboard({ result, donationSlot }: ResultDashboardProps) {
  const [lead, setLead] = useState<LeadData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [radarImageUrl, setRadarImageUrl] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('leadData');
    if (stored) setLead(JSON.parse(stored));
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const img = captureRadarImage();
      setRadarImageUrl(img);
      // Wait for radarImageUrl state to propagate to PdfReport
      await new Promise(r => setTimeout(r, 200));
      const empresa = lead?.empresa?.replace(/\s+/g, '-') || 'Reporte';
      await generatePdf(`DataCompass-${empresa}.pdf`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('PDF generation failed:', msg);
      alert(`Error al generar PDF: ${msg}`);
    } finally {
      setDownloading(false);
    }
  }, [lead]);

  const levelName = getLevelName(result.overall_score);
  const levelNumber = getLevelNumber(result.overall_score);
  const levelColor = getLevelColor(result.overall_score);
  const currentDate = formatDate(new Date());

  const sortedByScore = [...result.domain_scores].sort((a, b) => b.score - a.score);
  const bestDomain = sortedByScore[0];
  const worstDomain = sortedByScore[sortedByScore.length - 1];
  const criticalDomains = result.domain_scores.filter(d => d.score < 2.5);
  const mediumDomains = result.domain_scores.filter(d => d.score >= 2.5 && d.score < 3.5);
  const strongDomains = result.domain_scores.filter(d => d.score >= 3.5);
  const levelCtx = LEVEL_CONTEXT[levelNumber];

  const radarData = {
    labels: result.domain_scores.map(d => d.domain_name),
    datasets: [
      {
        label: 'Puntuación',
        data: result.domain_scores.map(d => d.score),
        backgroundColor: 'rgba(96, 165, 250, 0.08)',
        borderColor: '#60a5fa',
        borderWidth: 2,
        pointBackgroundColor: result.domain_scores.map(d => getLevelColor(d.score)),
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: result.domain_scores.map(d => getLevelColor(d.score)),
        pointHoverBorderColor: '#fff',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 24 },
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          backdropColor: 'transparent',
          color: '#475569',
        },
        pointLabels: {
          font: { size: 12, family: 'ui-sans-serif, system-ui, sans-serif', weight: '500' as const },
          color: '#94a3b8',
        },
        grid: { color: 'rgba(148,163,184,0.15)' },
        angleLines: { color: 'rgba(148,163,184,0.15)' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: 12,
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
      },
    },
  };

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (result.overall_score / 5) * circumference;

  return (
    <>
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-8 h-16 border-b border-slate-800 flex-shrink-0">
        <a href="/" className="flex items-center gap-2.5">
          <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <polyline points="16.5 7.5 12 12 7.5 16.5" strokeWidth="2"/>
          </svg>
          <span className="text-lg font-bold text-white tracking-tight">Data<span className="text-blue-400">Compass</span></span>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-lg shadow-blue-900/30"
          >
            {downloading ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar PDF
              </>
            )}
          </button>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Volver al inicio</a>
        </div>
      </nav>

      <div className="flex-1 px-4 py-10 lg:py-16">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-300 mb-6">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Evaluación completada
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Reporte de Madurez: <span className="text-blue-400">{lead?.empresa || 'tu Organización'}</span>
            </h1>
            <p className="text-slate-500 text-sm">
              Preparado para {lead?.nombre || '—'} · {lead?.cargo || '—'} · {currentDate}
            </p>
          </div>

          {/* Score + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-6">Puntuación Global</p>
              {/* Circular gauge */}
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8"/>
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.overall_score / 5) * 282.74} 282.74`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white">{result.overall_score.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">de 5.0</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Nivel {levelNumber}</span>
                <p className="text-2xl font-bold mt-1" style={{ color: levelColor }}>{levelName}</p>
              </div>

              {/* Domain scores list */}
              <div className="w-full mt-8 space-y-3">
                {result.domain_scores.map(d => (
                  <div key={d.domain_name} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate mb-1" style={{ color: getLevelColor(d.score) }}>{d.domain_name}</p>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(d.score / 5) * 100}%`, backgroundColor: getLevelColor(d.score) }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold w-6 text-right" style={{ color: getLevelColor(d.score) }}>{d.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar card */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-6">Perfil por Dominio</p>
              <div className="relative w-full h-80 lg:h-96">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>

          {/* CMMI Roadmap */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 17l4-8 4 4 4-6 4 10"/>
              </svg>
              <h2 className="text-lg font-semibold text-white">Tu posición en el modelo CMMI</h2>
            </div>
            <p className="text-slate-500 text-sm mb-10">Así es el camino desde donde estás hasta la madurez total en gobernanza de datos.</p>

            {/* Mountain path */}
            <div className="relative">
              {/* SVG mountain silhouette background */}
              <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" viewBox="0 0 800 160" preserveAspectRatio="none">
                <polygon points="0,160 120,90 240,110 360,50 480,70 600,20 720,40 800,10 800,160" fill="white"/>
              </svg>

              {/* Steps */}
              <div className="relative flex items-end gap-2 lg:gap-3 h-48">
                {[
                  { n: 1, name: 'Inicial',     range: '< 2.0',      color: '#ef4444', desc: 'Procesos reactivos sin estrategia formal' },
                  { n: 2, name: 'Gestionado',  range: '2.0 – 2.9',  color: '#f97316', desc: 'Procesos básicos sin coordinación' },
                  { n: 3, name: 'Definido',    range: '3.0 – 3.9',  color: '#f97316', desc: 'Políticas documentadas, adopción parcial' },
                  { n: 4, name: 'Medido',      range: '4.0 – 4.4',  color: '#22c55e', desc: 'Procesos controlados con métricas' },
                  { n: 5, name: 'Optimizado',  range: '≥ 4.5',      color: '#06b6d4', desc: 'Mejora continua institucionalizada' },
                ].map((lvl, i) => {
                  const isCurrent = lvl.n === levelNumber;
                  const isPast    = lvl.n < levelNumber;
                  const heights   = ['h-16', 'h-24', 'h-32', 'h-40', 'h-48'];
                  return (
                    <div key={lvl.n} className="flex-1 flex flex-col items-center gap-0 relative" style={{ height: '100%', justifyContent: 'flex-end' }}>

                      {/* "Estás aquí" pin */}
                      {isCurrent && (
                        <div className="absolute -top-1 flex flex-col items-center z-10 animate-bounce">
                          <span className="text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded-full text-white mb-1"
                            style={{ background: lvl.color, fontSize: 10 }}>
                            Estás aquí
                          </span>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={lvl.color}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className={`w-full ${heights[i]} rounded-t-lg flex items-start justify-center pt-2 transition-all relative`}
                        style={{
                          background: isCurrent
                            ? `linear-gradient(180deg, ${lvl.color}33, ${lvl.color}15)`
                            : isPast
                            ? `linear-gradient(180deg, ${lvl.color}22, ${lvl.color}08)`
                            : 'rgba(30,41,59,0.5)',
                          border: `1px solid ${isCurrent ? lvl.color + '60' : isPast ? lvl.color + '30' : 'rgba(148,163,184,0.1)'}`,
                          borderBottom: 'none',
                          opacity: !isPast && !isCurrent ? 0.45 : 1,
                        }}
                      >
                        {/* Level number */}
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: isCurrent ? lvl.color : isPast ? lvl.color + '30' : 'rgba(148,163,184,0.1)',
                            color: isCurrent ? 'white' : isPast ? lvl.color : '#475569',
                          }}
                        >
                          {isPast ? (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          ) : lvl.n}
                        </div>
                      </div>

                      {/* Label below */}
                      <div className="text-center mt-2 px-1">
                        <p className="text-xs font-semibold leading-tight"
                          style={{ color: isCurrent ? lvl.color : isPast ? '#64748b' : '#334155' }}>
                          {lvl.name}
                        </p>
                        <p className="text-slate-600 mt-0.5" style={{ fontSize: 9 }}>{lvl.range}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Path line */}
              <div className="mt-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            {/* Current level detail */}
            <div className="mt-8 rounded-lg p-4 flex items-start gap-4"
              style={{ background: `${levelColor}0d`, border: `1px solid ${levelColor}30` }}>
              <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{ background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40` }}>
                {levelNumber}
              </div>
              <div>
                <p className="font-semibold text-white">{getLevelName(result.overall_score)} — Nivel {levelNumber}</p>
                <p className="text-slate-400 text-sm mt-0.5">{LEVEL_CONTEXT[levelNumber].context}</p>
              </div>
              {levelNumber < 5 && (
                <div className="ml-auto flex-shrink-0 text-right hidden sm:block">
                  <p className="text-xs text-slate-500 mb-1">Siguiente nivel</p>
                  <p className="text-sm font-semibold" style={{ color: levelColor }}>
                    {['Gestionado','Definido','Medido','Optimizado'][levelNumber - 1] ?? ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 space-y-8">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h2 className="text-lg font-semibold text-white">Resumen Ejecutivo</h2>
            </div>

            {/* Level headline + context */}
            <div className="rounded-lg border bg-slate-800/40 p-5" style={{ borderColor: `${levelColor}30` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: levelColor }}>
                Nivel {levelNumber} · {levelName}
              </p>
              <p className="text-white font-semibold text-base mb-2">{levelCtx.headline}</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{levelCtx.context}</p>
              <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-700 pt-3">{levelCtx.implication}</p>
            </div>

            {/* Domain analysis */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Análisis por dominio</p>
              <div className="space-y-3">
                {result.domain_scores.map(d => (
                  <div key={d.domain_name} className="flex gap-3 items-start">
                    <span
                      className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full"
                      style={{ backgroundColor: getLevelColor(d.score) }}
                    />
                    <p className="text-slate-300 text-sm leading-relaxed">{getDomainInsight(d)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Best / Worst highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1">Fortaleza principal</p>
                <p className="text-white font-semibold">{bestDomain.domain_name}</p>
                <p className="text-green-400 text-sm font-bold mt-1">{bestDomain.score.toFixed(1)} / 5.0</p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">Área prioritaria</p>
                <p className="text-white font-semibold">{worstDomain.domain_name}</p>
                <p className="text-red-400 text-sm font-bold mt-1">{worstDomain.score.toFixed(1)} / 5.0</p>
              </div>
            </div>

            {/* Strategic recommendation */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Recomendación estratégica</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {criticalDomains.length > 0
                  ? `Prioriza un plan de remediación inmediato en ${criticalDomains.map(d => d.domain_name).join(' y ')}. Estas brechas críticas limitan el valor de los avances en el resto de dominios.`
                  : mediumDomains.length > 0
                  ? `Con ${strongDomains.length} dominio${strongDomains.length !== 1 ? 's' : ''} consolidado${strongDomains.length !== 1 ? 's' : ''}, el foco debe estar en escalar las prácticas exitosas hacia ${mediumDomains.map(d => d.domain_name).join(', ')} para lograr una madurez homogénea.`
                  : `La organización ha alcanzado madurez consistente en todos los dominios. El siguiente horizonte es la explotación de datos avanzada: analítica predictiva, automatización de calidad y productos de datos.`
                }
              </p>
            </div>

            <p className="text-xs text-slate-600">ID de evaluación: {result.assessment_id}</p>
          </div>

          {/* Donation slot */}
          {donationSlot && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-8 py-10">
              {donationSlot}
            </div>
          )}

          {/* Author note */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              FS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white font-medium">¿Tienes dudas o quieres profundizar en algún aspecto de tu diagnóstico?</span>
                {' '}Soy Frederick, Senior Data Engineer & Architect con +8 años trabajando en datos en algunas de las empresas más grandes de LATAM — y el creador de esta herramienta. Con gusto puedo orientarte.
              </p>
            </div>
            <a
              href="https://fredericksalazar.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Contáctame
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          {/* CTA Premium */}
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Desbloquea tu Hoja de Ruta Estratégica
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto">
              Obtén recomendaciones precisas generadas por IA para llevar tu organización al Nivel 5 de madurez en Gobernanza de Datos.
            </p>
            <a
              href="#"
              className="inline-flex justify-center rounded-md bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              Ver Planes Premium →
            </a>
            <p className="text-xs text-slate-600 mt-4">Plan Pro incluye: informe PDF · benchmarks sectoriales · roadmap priorizado</p>
          </div>

        </div>
      </div>
    </div>

    {/* Off-screen PDF layout — always in DOM so html2canvas can find it */}
    <PdfReport result={result} lead={lead} radarImageUrl={radarImageUrl} />
    </>
  );
}
