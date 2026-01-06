import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Construction } from "lucide-react";

const ConstructionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <Construction className="w-24 h-24 text-yellow-500 mb-6 animate-bounce" />
      <h1 className="text-3xl font-bold text-white mb-4">En Construcción</h1>
      <p className="text-white/70 mb-8 max-w-md">
        Estamos trabajando duro para traerte esta funcionalidad. ¡Vuelve pronto
        para ver las novedades!
      </p>
      <Button
        onClick={() => navigate(-1)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        Volver Atrás
      </Button>
    </div>
  );
};

// Removed default export to support tree-shaking and named imports consistency
