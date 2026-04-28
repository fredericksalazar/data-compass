import { useState } from 'react';
import LeadForm from './LeadForm';
import AssessmentWizard from './AssessmentWizard';

interface LeadData {
  nombre: string;
  cargo: string;
  empresa: string;
  correo: string;
}

export default function EvaluationPage() {
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  const handleLeadSuccess = (data: LeadData) => {
    setLeadData(data);
    sessionStorage.setItem('leadData', JSON.stringify(data));
  };

  if (!leadData) {
    return <LeadForm onSuccess={handleLeadSuccess} />;
  }

  return <AssessmentWizard />;
}