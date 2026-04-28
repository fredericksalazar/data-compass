import { useState, useEffect } from 'react';

const BLACKLISTED_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'yahoo.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'aol.com',
];

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
  const [touched, setTouched] = useState(false);

  const getDomain = (email: string) => {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  };

  const isCorporateEmail = (email: string) => {
    const domain = getDomain(email);
    return domain && !BLACKLISTED_DOMAINS.includes(domain);
  };

  const handleChange = (field: keyof LeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.cargo || !formData.empresa || !formData.correo) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!isCorporateEmail(formData.correo)) {
      setError('Por favor, utiliza un correo corporativo válido');
      return;
    }

    sessionStorage.setItem('leadData', JSON.stringify(formData));
    onSuccess(formData);
  };

  const isValid = formData.nombre && formData.cargo && formData.empresa && formData.correo && isCorporateEmail(formData.correo);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 text-center">
            Evaluación de Gobernanza de Datos
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mb-8 text-center">
            Ingresa tus datos para comenzar la evaluación
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e => handleChange('nombre', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={formData.cargo}
                onChange={e => handleChange('cargo', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={formData.empresa}
                onChange={e => handleChange('empresa', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={formData.correo}
                onChange={e => handleChange('correo', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={!isValid}
              className="w-full inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Comenzar Evaluación
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}