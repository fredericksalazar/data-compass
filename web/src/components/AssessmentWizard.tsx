import { useState, useEffect } from 'react';
import ResultDashboard from './ResultDashboard';

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

interface Answer {
  question_id: string;
  level: number;
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

export default function AssessmentWizard() {
  const [schema, setSchema] = useState<AssessmentSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allQuestions = schema?.domains.flatMap(d => d.questions) ?? [];
  const currentQuestion = allQuestions[currentIndex];
  const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

  const progress = (currentIndex / allQuestions.length) * 100;

  // Derive current domain name
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
    fetch(`${API_URL}/api/v1/assessments/cmmi/schema')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch schema');
        return res.json();
      })
      .then(data => setSchema(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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

  const submitAssessment = async (finalAnswers: Map<string, number>) => {
    setSubmitting(true);
    const leadData = JSON.parse(sessionStorage.getItem('leadData') || '{}');
    const payload = {
      lead: {
        name: leadData.nombre || '',
        company: leadData.empresa || '',
        role: leadData.cargo || '',
        email: leadData.correo || '',
      },
      answers: Array.from(finalAnswers.entries()).map(([question_id, level]) => ({ question_id, level })),
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/assessments/cmmi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to calculate result');
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
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

  if (result) {
    return <ResultDashboard result={result} />;
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        <p className="text-slate-400 text-sm">Calculando resultados...</p>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const selectedLevel = answers.get(currentQuestion.id);

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
        <span className="text-sm text-slate-400">
          Pregunta <span className="text-white font-medium">{currentIndex + 1}</span> de {allQuestions.length}
        </span>
      </nav>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-800 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Domain label */}
          {currentDomainName && (
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                {currentDomainName}
              </span>
              <span className="text-xs text-slate-600">
                {Math.round(progress)}% completado
              </span>
            </div>
          )}

          {/* Question card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-8 mb-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-2">
              {currentQuestion.title}
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              {currentQuestion.question_text}
            </p>

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
                    <span className={`text-sm leading-relaxed ${
                      selectedLevel === option.level ? 'text-white' : 'text-slate-300'
                    }`}>
                      <span className="font-medium text-slate-500 mr-1">N{option.level}.</span>
                      {option.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Back button */}
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
  );
}
