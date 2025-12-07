import React from 'react';
import { TermsModalUI } from './TermsModalUI';

interface TermsModalSingleProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean) => void;
  title?: string;
}

export const TermsModalSingle: React.FC<TermsModalSingleProps> = (props) => {
  return <TermsModalUI {...props} />;
};

