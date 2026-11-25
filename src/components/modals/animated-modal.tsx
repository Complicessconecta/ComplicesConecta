import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

interface ModalTriggerProps {
  children?: ReactNode;
  onClick?: () => void;
  asChild?: boolean;
}

interface ModalContentProps {
  children?: ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children?: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children?: ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen = false,
  onClose,
  children,
  className = "",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-0 z-[60] flex items-center justify-center px-4 pointer-events-none ${className}`}
          >
            {/* Ancho con tope al viewport: antes el div no tenía ancho y
                ModalContent sumaba `w-full` + `mx-4`, así que el modal
                desbordaba 2rem y el texto quedaba cortado en el borde
                derecho (modal de Mint NFT). */}
            <div className="pointer-events-auto w-full max-w-md min-w-0">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const ModalTrigger: React.FC<ModalTriggerProps> = ({
  children,
  onClick,
  asChild,
}) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick });
  }
  return <button onClick={onClick}>{children}</button>;
};

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 rounded-lg shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
};

export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = "",
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-6 py-4 border-t border-white/10 flex flex-wrap gap-3 justify-end ${className}`}
    >
      {children}
    </div>
  );
};
