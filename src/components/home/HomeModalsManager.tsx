import { WelcomeModal } from "@/components/modals/WelcomeModal";
import { FeatureModal } from "@/components/modals/FeatureModal";
import { InstallAppModal } from "@/components/modals/InstallAppModal";
import { ActionButtonsModal } from "@/components/modals/ActionButtonsModal";
import ModeratorApplicationForm from "@/components/forms/ModeratorApplicationForm";
import { Button } from "@/shared/ui/Button";

interface HomeModalsManagerProps {
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  showFeatureModal: boolean;
  setShowFeatureModal: (show: boolean) => void;
  selectedFeature: 'connections' | 'verification' | 'events' | 'tokens';
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  showActionButtonsModal: boolean;
  setShowActionButtonsModal: (show: boolean) => void;
  showModeratorForm: boolean;
  setShowModeratorForm: (show: boolean) => void;
}

export const HomeModalsManager = ({
  showWelcome,
  setShowWelcome,
  showFeatureModal,
  setShowFeatureModal,
  selectedFeature,
  showInstallModal,
  setShowInstallModal,
  showActionButtonsModal,
  setShowActionButtonsModal,
  showModeratorForm,
  setShowModeratorForm,
}: HomeModalsManagerProps) => {
  return (
    <>
      {showWelcome && <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />}
      
      <InstallAppModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
      />
      
      <FeatureModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        feature={selectedFeature}
      />
      
      <ActionButtonsModal
        isOpen={showActionButtonsModal}
        onClose={() => setShowActionButtonsModal(false)}
      />

      {/* Moderator Application Modal */}
      {showModeratorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-black/80 backdrop-blur-sm p-4 border-b border-white/20 z-10">
              <Button
                variant="ghost"
                onClick={() => setShowModeratorForm(false)}
                className="text-white hover:bg-white/10 float-right"
              >
                ✕ Cerrar
              </Button>
              <div className="clear-both"></div>
            </div>
            <div className="p-6">
              <ModeratorApplicationForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
