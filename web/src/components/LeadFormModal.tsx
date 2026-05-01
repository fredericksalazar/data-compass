import { useState } from 'react';
import { CONTACT } from '../config/contact';

interface LeadData {
  nombre: string;
  cargo: string;
  empresa: string;
  correo: string;
}

interface Answer {
  question_id: string;
  level: number;
}

interface AssessmentResult {
  assessment_id: string;
  overall_score: number;
  domain_scores: { domain_name: string; score: number }[];
}

interface LeadFormModalProps {
  apiUrl: string;
  answers: Answer[];
  onSuccess: (data: LeadData, result: AssessmentResult) => void;
}

function BmcIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 884 884" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
    </svg>
  );
}

export default function LeadFormModal({ apiUrl, answers, onSuccess }: LeadFormModalProps) {
  const [formData, setFormData] = useState<LeadData>({
    nombre: '',
    cargo: '',
    empresa: '',
    correo: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof LeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lead: {
          name: formData.nombre,
          company: formData.empresa,
          role: formData.cargo,
          email: formData.correo,
        },
        answers,
      };

      const res = await fetch(`${apiUrl}/api/v1/assessments/cmmi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to calculate result');

      const result: AssessmentResult = await res.json();
      onSuccess(formData, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 overflow-y-auto max-h-[90vh]">
      <div className="flex items-center justify-center mb-5">
        <div className="h-14 w-14 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 flex items-center justify-center">
          <svg className="h-7 w-7 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-1">¡Tu informe está listo!</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm text-center leading-relaxed mb-6">
        Personaliza tu diagnóstico con tus datos para que el informe quede a tu nombre.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre <span className="text-blue-600 dark:text-blue-400">*</span>
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={e => handleChange('nombre', e.target.value)}
            placeholder="Ej. María García"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Cargo <span className="text-slate-400 dark:text-slate-600 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={e => handleChange('cargo', e.target.value)}
              placeholder="Ej. CDO"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Empresa <span className="text-slate-400 dark:text-slate-600 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={formData.empresa}
              onChange={e => handleChange('empresa', e.target.value)}
              placeholder="Ej. Acme Corp"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Correo <span className="text-slate-400 dark:text-slate-600 font-normal">(opcional)</span>
          </label>
          <input
            type="email"
            value={formData.correo}
            onChange={e => handleChange('correo', e.target.value)}
            placeholder="nombre@empresa.com"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/>
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-900/30 disabled:opacity-60"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Ver mi informe
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Apoya DataCompass</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
          Herramienta gratuita, sin anuncios, sin fricciones. Si te resultó útil, considera apoyar el proyecto.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={CONTACT.BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFDD00] px-4 py-2 text-xs font-semibold text-[#1a1a1a] transition-all hover:bg-[#f5d400] hover:scale-105 active:scale-100"
          >
            <BmcIcon />
            Invítame a un café
          </a>
          <a
            href={CONTACT.PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0070ba] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#005ea6] hover:scale-105 active:scale-100"
          >
            <PayPalIcon />
            Donar con PayPal
          </a>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-600">Sugerido: $10 USD · 100% voluntario</p>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
        Tus datos son confidenciales y no se compartirán con terceros
      </p>
    </div>
  );
}
