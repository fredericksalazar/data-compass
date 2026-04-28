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

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

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

function formatDate(date: Date): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ResultDashboard({ result }: ResultDashboardProps) {
  const [lead, setLead] = useState<LeadData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('leadData');
    if (stored) {
      setLead(JSON.parse(stored));
    }
  }, []);

  const levelName = getLevelName(result.overall_score);
  const levelNumber = getLevelNumber(result.overall_score);
  const currentDate = formatDate(new Date());

  const sortedByScore = [...result.domain_scores].sort((a, b) => b.score - a.score);
  const bestDomain = sortedByScore[0];
  const worstDomain = sortedByScore[sortedByScore.length - 1];

  const narrativeText = `El puntaje general de ${result.overall_score.toFixed(1)} indica un nivel ${levelName} de madurez en la gestión de datos. ${bestDomain.domain_name} (${bestDomain.score.toFixed(1)}) es su fortaleza. ${worstDomain.domain_name} (${worstDomain.score.toFixed(1)}) es crítico. Priorice ${worstDomain.domain_name}.`;

  const radarData = {
    labels: result.domain_scores.map((d) => d.domain_name),
    datasets: [
      {
        label: 'Puntuación por Dominio',
        data: result.domain_scores.map((d) => d.score),
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: '#2563eb',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#2563eb',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 24,
    },
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          backdropColor: 'transparent',
          color: '#64748b',
        },
        pointLabels: {
          font: {
            size: 12,
            family: 'ui-sans-serif, system-ui, sans-serif',
            weight: '500',
          },
          color: '#334155',
        },
        grid: {
          color: '#e2e8f0',
        },
        angleLines: {
          color: '#e2e8f0',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-[95%] lg:w-[90%] max-w-7xl mx-auto space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-8 lg:p-12 relative">
          <button
            onClick={() => alert('La exportación a PDF estará disponible en el Plan Pro')}
            className="absolute top-4 right-4 px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar PDF
          </button>
          
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2 text-center">
            Reporte Ejecutivo de Madurez: {lead?.empresa || 'tu Organización'}
          </h1>
          
          <div className="flex gap-4 text-sm text-slate-500 justify-center mb-8">
            <span>Preparado para: {lead?.nombre || '---'} ({lead?.cargo || '---'})</span>
            <span>|</span>
            <span>Fecha: {currentDate}</span>
          </div>

          <p className="text-lg text-slate-600 leading-relaxed mb-10 text-center">
            Nivel de Madurez en Gobernanza de Datos
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center mb-10">
            <div className="lg:col-span-1 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${result.overall_score * 28.27} 282.74`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-blue-600">
                    {result.overall_score.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-2xl font-semibold text-slate-900">
                  Nivel {levelNumber}: {levelName}
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 relative w-full h-80 sm:h-96 lg:h-[500px] flex items-center justify-center">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div className="mb-6 p-8 rounded-lg bg-slate-50 border border-slate-200 w-[80%] mx-auto">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Resumen Ejecutivo</h2>
            <p className="text-lg text-slate-700 leading-relaxed">
              {narrativeText}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              ID de evaluación: {result.assessment_id}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 shadow-sm overflow-hidden p-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              Desbloquea tu Hoja de Ruta Estratégica
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Obtén recomendaciones precisas generadas por IA para llegar al Nivel 5 de madurez en Gobernanza de Datos.
            </p>
            <a
              href="#"
              className="inline-flex justify-center rounded-md bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Ver Planes Premium
            </a>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-base text-slate-600 hover:text-blue-600 transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}