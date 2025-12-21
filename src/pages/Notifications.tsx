import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Bell } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-purple-500/20 p-6 rounded-full mb-6">
        <Bell className="w-16 h-16 text-purple-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">Notificaciones</h1>
      <p className="text-white/70 mb-8 max-w-md">
        No tienes notificaciones nuevas en este momento.
      </p>
      <Button 
        onClick={() => navigate(-1)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        Volver
      </Button>
    </div>
  );
};

export default Notifications;
