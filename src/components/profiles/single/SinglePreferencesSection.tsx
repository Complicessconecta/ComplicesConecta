import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

interface SinglePreferencesSectionProps {
  name: string;
  likes: string[];
  dependsOn?: string[];
}

/**
 * Mis Intereses de 1 usuario con etiquetas (espejo de
 * CouplePreferencesSection, modelo del video). "Me gusta" son los
 * intereses del perfil; "Depende de la situación" solo se muestra cuando
 * hay datos. Sin datos, estado vacío honesto.
 */
export const SinglePreferencesSection: React.FC<
  SinglePreferencesSectionProps
> = ({ name, likes, dependsOn = [] }) => {
  const empty = likes.length === 0 && dependsOn.length === 0;

  return (
    <Card className="bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 text-slate-900 dark:text-white">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-fuchsia-400" />
          Mis Intereses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-slate-900/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
          <p className="font-semibold text-slate-900 dark:text-white mb-3">
            {name}
          </p>

          {empty ? (
            <p className="text-xs text-slate-500 dark:text-white/50">
              Sin preferencias registradas por ahora.
            </p>
          ) : (
            <div className="space-y-3">
              {likes.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5">
                    Me gusta
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {likes.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-fuchsia-500/15 text-fuchsia-800 border-fuchsia-500/40 dark:bg-fuchsia-500/20 dark:text-fuchsia-100 dark:border-fuchsia-400/30 font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {dependsOn.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5">
                    Depende de la situación
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {dependsOn.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-blue-500/15 text-blue-800 border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-400/30 font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SinglePreferencesSection;
