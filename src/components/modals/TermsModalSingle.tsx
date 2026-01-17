import React from "react";
import { SharedTermsModal } from "@/components/modals/SharedTermsModal";

interface TermsModalSingleProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean) => void;
  title?: string;
}

export const TermsModalSingle: React.FC<TermsModalSingleProps> = (props) => {
  return <SharedTermsModal {...props} />;
};
