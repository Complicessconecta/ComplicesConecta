import { useToast } from "@/hooks/useToast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster({
  dockOffset = false,
}: { dockOffset?: boolean } = {}) {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      {/* Desplazamiento inferior solo donde hay dock (perfil): en el
          resto de rutas el dock no existe y el offset de 4.75rem dejaba
          el toast flotando sobre el contenido central. */}
      <ToastViewport
        className={
          dockOffset
            ? "bottom-[calc(env(safe-area-inset-bottom)+4.75rem)]"
            : "bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
        }
      />
    </ToastProvider>
  );
}
