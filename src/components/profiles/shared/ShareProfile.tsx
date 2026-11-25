import { useState } from "react";
import { Share2, Copy } from "lucide-react";
import {
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconBrandX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/buttons/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Modal";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { safeOpenUrl } from "@/utils/safeOpenUrl";
import { shareProfileToTikTok } from "@/lib/tiktok-share";
import { logger } from "@/lib/logger";

interface ShareProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

export const ShareProfile = ({
  isOpen,
  onClose,
  profileId,
  profileName,
}: ShareProfileProps) => {
  const { toast } = useToast();
  const [profileUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/profile/${profileId}`;
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Enlace copiado",
        description: "El enlace del perfil se ha copiado al portapapeles",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const text = `¡Mira el perfil de ${profileName} en ComplicesConecta!`;

    switch (platform) {
      case "tiktok":
        // TikTok no tiene share web directo: abre la subida y copia el
        // texto con el enlace para pegarlo (ver @/lib/tiktok-share).
        void shareProfileToTikTok(profileId, profileName).then((ok) => {
          if (ok) {
            toast({
              title: "Listo para TikTok",
              description:
                "Texto copiado. Pégalo al subir tu video en TikTok",
            });
          } else {
            logger.error("Error compartiendo en TikTok");
            toast({
              title: "No se pudo compartir en TikTok",
              description: "Inténtalo de nuevo o copia el enlace",
              variant: "destructive",
            });
          }
        });
        break;
      case "facebook":
        safeOpenUrl(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
        );
        break;
      case "whatsapp":
        safeOpenUrl(`https://wa.me/?text=${encodeURIComponent(text + " " + profileUrl)}`);
        break;
      case "x":
        safeOpenUrl(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
        );
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: `Perfil de ${profileName}`,
            text: text,
            url: profileUrl,
          });
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartir perfil de {profileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL del perfil */}
          <div className="space-y-2">
            <Label htmlFor="profile-url">Enlace del perfil</Label>
            <div className="flex gap-2">
              <Input
                id="profile-url"
                value={profileUrl}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Opciones de compartir: TikTok, Facebook, WhatsApp y X.
              Menú compacto para pantallas chicas: 2 columnas, sin el
              bloque de QR "próximamente" que solo ocupaba espacio. */}
          <div className="space-y-3">
            <Label>Compartir en:</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleShare("tiktok")}
                className="flex items-center gap-2"
              >
                <IconBrandTiktok className="h-4 w-4" />
                TikTok
              </Button>

              <Button
                variant="outline"
                onClick={() => handleShare("facebook")}
                className="flex items-center gap-2"
              >
                <IconBrandFacebook className="h-4 w-4" />
                Facebook
              </Button>

              <Button
                variant="outline"
                onClick={() => handleShare("whatsapp")}
                className="flex items-center gap-2"
              >
                <IconBrandWhatsapp className="h-4 w-4" />
                WhatsApp
              </Button>

              <Button
                variant="outline"
                onClick={() => handleShare("x")}
                className="flex items-center gap-2"
              >
                <IconBrandX className="h-4 w-4" />
                X
              </Button>

              <Button
                variant="outline"
                onClick={() => handleShare("native")}
                className="flex items-center gap-2 col-span-2"
              >
                <Share2 className="h-4 w-4" />
                Más opciones
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
