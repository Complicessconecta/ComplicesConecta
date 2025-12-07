import React from 'react';
import { TermsModalUI } from './TermsModalUI';

interface TermsModalCoupleProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean) => void;
  title?: string;
}

export const TermsModalCouple: React.FC<TermsModalCoupleProps> = (props) => {
  return <TermsModalUI {...props} />;
};

