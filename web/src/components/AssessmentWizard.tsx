import { useState, useEffect } from 'react';

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
  const progress = ((currentIndex) / allQuestions.length) * 100;

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/assessments/cmmi/schema')
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
    const payload = {
      answers: Array.from(finalAnswers.entries()).map(([question_id, level]) => ({
        question_id,
        level,
      })),
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/assessments/cmmi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to calculate result');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Cargando evaluación...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-2xl w-full">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6 text-center">
              Resultados de tu Evaluación
            </h1>
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {result.overall_score.toFixed(1)}
              </div>
              <div className="text-slate-600">Puntaje Overall</div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Puntajes por Dominio</h2>
              {result.domain_scores.map((domain) => (
                <div key={domain.domain_name} className="flex justify-between items-center p-4 rounded-lg border border-slate-200">
                  <span className="text-slate-900">{domain.domain_name}</span>
                  <span className="text-blue-600 font-semibold">{domain.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a href="/" className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const selectedLevel = answers.get(currentQuestion.id);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-2xl w-full">
        <div className="mb-4">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-slate-600 mt-2 text-right">
            {currentIndex + 1} / {allQuestions.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {currentQuestion.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed mb-6">
            {currentQuestion.question_text}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.level}
                onClick={() => handleSelect(option.level)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedLevel === option.level
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <span className="text-slate-900">{option.text}</span>
              </button>
            ))}
          </div>
        </div>

        {submitting && (
          <div className="mt-4 text-center text-slate-600">
            Calculando resultados...
          </div>
        )}
      </div>
    </div>
  );
}