import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, ThumbsDown } from "lucide-react";

interface SingleLookingForSectionProps {
  lookingFor: string[];
  ageRange?: string | null;
  relationshipStatus: string;
  likes: string[];
  dislikes: string[];
}

/**
 * "Buscamos" + "Situación sentimental" + "Me gusta / No me gusta" para
 * 1 usuario (espejo de CoupleLookingForSection, modelo del video). Las
 * etiquetas vienen del perfil (looking_for / intereses); sin datos,
 * estado vacío honesto.
 */
export const SingleLookingForSection: React.FC<
  SingleLookingForSectionProps
> = ({ lookingFor, ageRange, relationshipStatus, likes, dislikes }) => {
  return (
    <Card className="bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 text-slate-900 dark:text-white">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-fuchsia-400" />
          Buscamos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5">
            Buscamos
          </p>
          {lookingFor.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {lookingFor.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-purple-500/15 text-purple-800 border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-100 dark:border-purple-400/30 font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {ageRange && (
                <Badge className="bg-slate-900/5 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-white/80 dark:border-white/20 font-normal">
                  {ageRange}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-white/60">
              Aún no defines qué buscas.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5">
            Situación sentimental
          </p>
          <Badge className="bg-emerald-500/15 text-emerald-800 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30 font-normal">
            {relationshipStatus}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-emerald-400" />
            Me gusta
          </p>
          {likes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {likes.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-emerald-500/15 text-emerald-800 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/30 font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-white/60">
              Aún no defines qué te gusta.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5 flex items-center gap-1">
            <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
            No me gusta
          </p>
          {dislikes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dislikes.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-red-500/15 text-red-800 border-red-500/40 dark:bg-red-500/20 dark:text-red-100 dark:border-red-400/30 font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-white/60">
              Aún no defines qué no te gusta.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SingleLookingForSection;
