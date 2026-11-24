import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

export interface CoupleMemberPreferences {
  name: string;
  likes: string[];
  dependsOn?: string[];
}

interface CouplePreferencesSectionProps {
  members: [CoupleMemberPreferences, CoupleMemberPreferences];
}

/**
 * Preferencias por miembro con etiquetas (modelo del video).
 * "Me gusta" son los intereses del miembro; "Depende de la situación" solo
 * se muestra cuando hay datos. Sin datos, estado vacío honesto.
 */
export const CouplePreferencesSection: React.FC<
  CouplePreferencesSectionProps
> = ({ members }) => {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-fuchsia-400" />
          Preferencias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const likes = member.likes ?? [];
            const dependsOn = member.dependsOn ?? [];
            const empty = likes.length === 0 && dependsOn.length === 0;

            return (
              <div
                key={member.name}
                className="p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <p className="font-semibold text-white mb-3">{member.name}</p>

                {empty ? (
                  <p className="text-xs text-white/50">
                    Sin preferencias registradas por ahora.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {likes.length > 0 && (
                      <div>
                        <p className="text-xs text-white/50 mb-1.5">
                          Me gusta
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {likes.map((tag) => (
                            <Badge
                              key={tag}
                              className="bg-fuchsia-500/20 text-fuchsia-100 border-fuchsia-400/30 font-normal"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {dependsOn.length > 0 && (
                      <div>
                        <p className="text-xs text-white/50 mb-1.5">
                          Depende de la situación
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {dependsOn.map((tag) => (
                            <Badge
                              key={tag}
                              className="bg-blue-500/20 text-blue-100 border-blue-400/30 font-normal"
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CouplePreferencesSection;
