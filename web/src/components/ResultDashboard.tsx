import { useState, useEffect } from 'react';
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

export default function ResultDashboard({ result }: ResultDashboardProps) {
  const [lead, setLead] = useState<LeadData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('leadData');
    if (stored) setLead(JSON.parse(stored));
  }, []);

  const levelName = getLevelName(result.overall_score);
  const levelNumber = getLevelNumber(result.overall_score);
  const levelColor = getLevelColor(result.overall_score);
  const currentDate = formatDate(new Date());

  const sortedByScore = [...result.domain_scores].sort((a, b) => b.score - a.score);
  const bestDomain = sortedByScore[0];
  const worstDomain = sortedByScore[sortedByScore.length - 1];

  const narrativeText = `El puntaje general de ${result.overall_score.toFixed(1)} indica un nivel ${levelName} de madurez en la gestión de datos. ${bestDomain.domain_name} (${bestDomain.score.toFixed(1)}) es su principal fortaleza. ${worstDomain.domain_name} (${worstDomain.score.toFixed(1)}) requiere atención prioritaria.`;

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
            onClick={() => alert('La exportación a PDF estará disponible en el Plan Pro')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:border-slate-600 hover:text-slate-200 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar PDF
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

          {/* Narrative */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Resumen Ejecutivo
            </h2>
            <p className="text-slate-300 leading-relaxed">{narrativeText}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
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
            <p className="text-xs text-slate-600 mt-6">ID de evaluación: {result.assessment_id}</p>
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
  );
}
