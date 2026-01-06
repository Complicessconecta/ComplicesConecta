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
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${className}`}
          >
            <div className="pointer-events-auto">{children}</div>
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
      className={`bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
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
      className={`px-6 py-4 border-t border-white/10 flex gap-3 justify-end ${className}`}
    >
      {children}
    </div>
  );
};
