import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Plus } from "lucide-react";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ClubEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  registeredCount?: number;
  imageUrl?: string;
  isVip?: boolean;
  price?: number;
  currency?: string;
}

interface ClubProfileEventsProps {
  events: ClubEvent[];
  isOwner?: boolean;
  onCreateEvent?: () => void;
}

export const ClubProfileEvents: React.FC<ClubProfileEventsProps> = ({
  events,
  isOwner = false,
  onCreateEvent,
}) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);

  const filteredEvents = filter === 'all' 
    ? events 
    : filter === 'upcoming' 
    ? upcomingEvents 
    : pastEvents;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Eventos</h3>
              <p className="text-white/60 text-sm">
                {upcomingEvents.length} {upcomingEvents.length === 1 ? 'próximo' : 'próximos'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Filter */}
            <div className="flex bg-white/10 rounded-lg p-1">
              {(['all', 'upcoming', 'past'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todos' : f === 'upcoming' ? 'Próximos' : 'Pasados'}
                </button>
              ))}
            </div>

            {isOwner && onCreateEvent && (
              <Button
                onClick={onCreateEvent}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Evento
              </Button>
            )}
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">
              {filter === 'all' 
                ? 'No hay eventos disponibles' 
                : filter === 'upcoming' 
                ? 'No hay eventos próximos' 
                : 'No hay eventos pasados'}
            </p>
            {isOwner && filter === 'all' && (
              <Button
                onClick={onCreateEvent}
                variant="outline"
                className="mt-4 border-white/30 text-white hover:bg-white/10"
              >
                Crear Primer Evento
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Event Image */}
                  {event.imageUrl && (
                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-1">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-white/60 text-sm mb-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {event.isVip && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                          VIP
                        </Badge>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span>{formatDate(event.date)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span>
                          {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span>
                            {event.registeredCount || 0}/{event.capacity}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {event.price !== undefined && (
                      <div className="mt-3">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {event.currency || '$'}{event.price.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
