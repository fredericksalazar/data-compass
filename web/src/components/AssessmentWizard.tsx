import { useState, useEffect, useRef } from 'react';
import ResultDashboard from './ResultDashboard';
import LeadFormModal from './LeadFormModal';

interface Option {
  level: number;
  text: string;
}

interface Question {
  id: string;
  title: string;
  question_text: string;
  weight: number;
  options: Option[];
}

interface Domain {
  name: string;
  questions: Question[];
}

interface AssessmentSchema {
  version: string;
  total_questions: number;
  domains: Domain[];
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

const PROCESSING_STEPS = [
  'Analizando tus respuestas...',
  'Evaluando madurez por dominio...',
  'Calculando puntuación CMMI...',
  'Generando tu informe ejecutivo...',
];

const MODAL_DURATION = 10000;

function BmcIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 884 884" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="442" cy="442" r="442" fill="#FFDD00"/>
      <rect x="220" y="310" width="444" height="220" rx="30" fill="white"/>
      <line x1="308" y1="370" x2="308" y2="470" stroke="#0D0C22" strokeWidth="36" strokeLinecap="round"/>
      <line x1="392" y1="370" x2="392" y2="470" stroke="#0D0C22" strokeWidth="36" strokeLinecap="round"/>
      <line x1="578" y1="370" x2="578" y2="420" stroke="#0D0C22" strokeWidth="36" strokeLinecap="round"/>
      <line x1="492" y1="370" x2="492" y2="420" stroke="#0D0C22" strokeWidth="36" strokeLinecap="round"/>
      <path d="M442 470 C442 492 458 508 476 508 C494 508 510 492 510 470H442Z" fill="#0D0C22"/>
      <line x1="442" y1="370" x2="442" y2="420" stroke="#0D0C22" strokeWidth="36" strokeLinecap="round"/>
    </svg>
  );
}

function PayPalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
    </svg>
  );
}

function DonationButtons() {
  return (
    <>
      <a
        href="https://buymeacoffee.com/fredericksalazar"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 rounded-xl bg-[#FFDD00] px-5 py-3 text-sm font-semibold text-[#1a1a1a] transition-all hover:bg-[#f5d400] hover:scale-105 active:scale-100 shadow-lg shadow-yellow-500/20"
      >
        <BmcIcon />
        Invítame a un café
      </a>
      <a
        href="https://www.paypal.com/donate?business=fredefass01%40gmail.com&amount=10&currency_code=USD"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 rounded-xl bg-[#0070ba] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#005ea6] hover:scale-105 active:scale-100 shadow-lg shadow-blue-900/30"
      >
        <PayPalIcon />
        Donar con PayPal
      </a>
    </>
  );
}

interface LeadData {
  nombre: string;
  cargo: string;
  empresa: string;
  correo: string;
}

export default function AssessmentWizard() {
  const [schema, setSchema] = useState<AssessmentSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [barProgress, setBarProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [modalReady, setModalReady] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const apiDone = useRef(false);
  const timerDone = useRef(false);
  const pendingAnswers = useRef<Map<string, number>>(new Map());

  const allQuestions = schema?.domains.flatMap(d => d.questions) ?? [];
  const currentQuestion = allQuestions[currentIndex];
  const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
  const progress = (currentIndex / allQuestions.length) * 100;

  let currentDomainName = '';
  if (schema && currentQuestion) {
    for (const domain of schema.domains) {
      if (domain.questions.some(q => q.id === currentQuestion.id)) {
        currentDomainName = domain.name;
        break;
      }
    }
  }

  useEffect(() => {
    fetch(`${API_URL}/api/v1/assessments/cmmi/schema`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch schema');
        return res.json();
      })
      .then(data => setSchema(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const checkBothDone = () => {
    if (apiDone.current && timerDone.current) {
      setModalReady(true);
      setShowLeadForm(true);
    }
  };

  const handleSelect = (level: number) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, level);
    setAnswers(newAnswers);

    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = (finalAnswers: Map<string, number>) => {
    pendingAnswers.current = finalAnswers;
    apiDone.current = false;
    timerDone.current = false;
    setBarProgress(0);
    setStepIndex(0);
    setModalReady(false);
    setShowModal(true);

    // Animated progress bar over MODAL_DURATION — API call happens after lead form
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / MODAL_DURATION) * 100, 100);
      setBarProgress(pct);
      setStepIndex(Math.min(Math.floor(pct / 25), PROCESSING_STEPS.length - 1));
      if (pct >= 100) {
        clearInterval(interval);
        timerDone.current = true;
        checkBothDone();
      }
    }, 80);

    // Mark API as done immediately so timer drives the gate
    apiDone.current = true;
  };

  const submitToApi = async (lead: LeadData) => {
    const payload = {
      lead: {
        name: lead.nombre,
        company: lead.empresa,
        role: lead.cargo,
        email: lead.correo,
      },
      answers: Array.from(pendingAnswers.current.entries()).map(([question_id, level]) => ({ question_id, level })),
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/assessments/cmmi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to calculate result');
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // ── Renders ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Cargando evaluación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 max-w-md text-center">
          <p className="text-red-400 font-medium mb-4">No se pudo conectar con el servidor</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (showReport && result) {
    return (
      <ResultDashboard
        result={result}
        donationSlot={
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-3">Acceso libre · Sin publicidad</p>
            <h3 className="text-xl font-semibold text-white mb-2">¿Te ha servido este diagnóstico?</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Este diagnóstico CMMI es gratuito, sin anuncios y sin fricciones. Si te ha ayudado a entender mejor la madurez de tus datos, considera apoyar para que sigamos construyendo herramientas de este nivel.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <DonationButtons />
            </div>
            <p className="mt-4 text-xs text-slate-600">Donación mínima sugerida: $10 USD · 100% voluntario</p>
          </div>
        }
      />
    );
  }

  if (!currentQuestion) return null;

  const selectedLevel = answers.get(currentQuestion.id);

  return (
    <>
      {/* ── Processing modal overlay ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">

            {!modalReady ? (
              /* Processing phase */
              <div className="px-8 py-10 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M9 12h6"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">Procesando tu diagnóstico</h3>
                <p className="text-sm text-slate-400 mb-8 h-5 transition-all duration-500">
                  {PROCESSING_STEPS[stepIndex]}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-100"
                    style={{ width: `${barProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">{Math.round(barProgress)}% completado</p>
              </div>
            ) : showLeadForm ? (
              /* Lead form + donation phase */
              <LeadFormModal
                onSuccess={(data) => {
                  setLeadData(data);
                  sessionStorage.setItem('leadData', JSON.stringify(data));
                  setShowModal(false);
                  setShowReport(true);
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* ── Wizard ───────────────────────────────────────────────────────── */}
      <div className="min-h-screen flex flex-col bg-slate-950">
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
          <span className="text-sm text-slate-400">
            Pregunta <span className="text-white font-medium">{currentIndex + 1}</span> de {allQuestions.length}
          </span>
        </nav>

        <div className="h-0.5 bg-slate-800 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
            {currentDomainName && (
              <div className="flex items-center gap-2 mb-6">
                <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                  {currentDomainName}
                </span>
                <span className="text-xs text-slate-600">{Math.round(progress)}% completado</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-8 mb-4">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">{currentQuestion.title}</h2>
              <p className="text-slate-400 leading-relaxed mb-8">{currentQuestion.question_text}</p>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.level}
                    onClick={() => handleSelect(option.level)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-150 group ${
                      selectedLevel === option.level
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors ${
                        selectedLevel === option.level
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-600 group-hover:border-blue-500/50'
                      }`}>
                        {selectedLevel === option.level && (
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                            <path d="M3 5l1.5 1.5L7 3"/>
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm leading-relaxed ${selectedLevel === option.level ? 'text-white' : 'text-slate-300'}`}>
                        <span className="font-medium text-slate-500 mr-1">N{option.level}.</span>
                        {option.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Pregunta anterior
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
