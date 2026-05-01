import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface LeadFormProps {
  onSuccess: (leadData: LeadData) => void;
}

interface LeadData {
  nombre: string;
  cargo: string;
  empresa: string;
  correo: string;
}

export default function LeadForm({ onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadData>({
    nombre: '',
    cargo: '',
    empresa: '',
    correo: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof LeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.cargo || !formData.empresa || !formData.correo) {
      setError('Por favor, completa todos los campos');
      return;
    }

    sessionStorage.setItem('leadData', JSON.stringify(formData));
    onSuccess(formData);
  };

  const isValid = formData.nombre && formData.cargo && formData.empresa && formData.correo;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <nav className="flex items-center justify-between px-6 lg:px-8 h-16 border-b border-slate-200 dark:border-slate-800">
        <a href="/" className="flex items-center gap-2.5">
          <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <polyline points="16.5 7.5 12 12 7.5 16.5" strokeWidth="2"/>
          </svg>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Data<span className="text-blue-600 dark:text-blue-400">Compass</span></span>
        </a>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-slate-500 dark:text-slate-400">Paso 1 de 2 — Registro</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
              Evaluación CMMI · Gobernanza de Datos
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Registra tu empresa</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              Tus datos son confidenciales y se usan únicamente para personalizar tu informe.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { field: 'nombre' as keyof LeadData, label: 'Nombre completo', type: 'text', placeholder: 'Ej. María García López' },
                { field: 'cargo' as keyof LeadData, label: 'Cargo', type: 'text', placeholder: 'Ej. Chief Data Officer' },
                { field: 'empresa' as keyof LeadData, label: 'Empresa', type: 'text', placeholder: 'Ej. Acme Corp' },
                { field: 'correo' as keyof LeadData, label: 'Correo corporativo', type: 'email', placeholder: 'nombre@empresa.com' },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={formData[field]}
                    onChange={e => handleChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isValid}
                className="w-full inline-flex justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                Comenzar Evaluación →
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
            Tus datos no serán compartidos con terceros
          </p>
        </div>
      </div>
    </div>
  );
}
