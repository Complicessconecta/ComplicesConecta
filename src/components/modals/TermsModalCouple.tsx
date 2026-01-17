import React from "react";
import { SharedTermsModal } from "@/components/modals/SharedTermsModal";

interface TermsModalCoupleProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean) => void;
  title?: string;
}

export const TermsModalCouple: React.FC<TermsModalCoupleProps> = (props) => {
  return <SharedTermsModal {...props} />;
};
