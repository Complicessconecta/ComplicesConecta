import { useState, useEffect } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Volume2, EyeOff, Users, Lock } from "lucide-react";
import { ChatRoomService, ChatRoom } from "@/services/chat/ChatRoomService";
import { logger } from "@/lib/logger";

interface PrivateRoomManagementProps {
  userId: string;
  isPremium: boolean;
}

export const PrivateRoomManagement = ({ userId, isPremium }: PrivateRoomManagementProps) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tokenCost: 1,
    maxMembers: 100,
  });

  // Cargar salas privadas del usuario
  useEffect(() => {
    loadRooms();
  }, [userId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const userRooms = await ChatRoomService.getUserPrivateRooms(userId);
      setRooms(userRooms);
    } catch (error) {
      logger.error("Error cargando salas privadas:", { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      logger.warn("Nombre de sala requerido");
      return;
    }

    try {
      // Solo usuarios premium pueden crear salas privadas
      if (!isPremium) {
        logger.warn("Solo usuarios premium pueden crear salas privadas");
        return;
      }

      const newRoom = await ChatRoomService.createPrivateRoom(
        formData.name,
        formData.description,
        formData.tokenCost,
        formData.maxMembers,
        userId
      );

      if (newRoom) {
        setRooms([...rooms, newRoom]);
        setShowCreateForm(false);
        setFormData({ name: "", description: "", tokenCost: 1, maxMembers: 100 });
      }
    } catch (error) {
      logger.error("Error creando sala privada:", { error });
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta sala? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const success = await ChatRoomService.deletePrivateRoom(roomId, userId);
      if (success) {
        setRooms(rooms.filter((r) => r.id !== roomId));
      }
    } catch (error) {
      logger.error("Error eliminando sala privada:", { error });
    }
  };

  const handleMuteRoom = async (roomId: string) => {
    try {
      const success = await ChatRoomService.muteRoom(roomId, userId);
      if (success) {
        logger.info("Sala silenciada", { roomId });
      }
    } catch (error) {
      logger.error("Error silenciando sala:", { error });
    }
  };

  const handleHideRoom = async (roomId: string) => {
    try {
      const success = await ChatRoomService.hideRoom(roomId, userId);
      if (success) {
        logger.info("Sala ocultada", { roomId });
      }
    } catch (error) {
      logger.error("Error ocultando sala:", { error });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-white/70">Cargando salas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Mis Salas Privadas
            </CardTitle>
            <CardDescription className="text-white/70">
              Gestiona tus salas de chat privadas
            </CardDescription>
          </div>
          {isPremium && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Sala
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario de creación */}
        {showCreateForm && (
          <Card className="bg-black/20 border-white/10">
            <CardContent className="p-4">
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <Label className="text-white">Nombre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre de la sala"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    required
                  />
                </div>
                <div>
                  <Label className="text-white">Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la sala"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Costo en Tokens</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.tokenCost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tokenCost: parseInt(e.target.value) || 0 })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Máximo de Miembros</Label>
                    <Input
                      type="number"
                      min="2"
                      max="500"
                      value={formData.maxMembers}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 100 })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Crear Sala
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de salas */}
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tienes salas privadas</p>
            {isPremium && (
              <p className="text-sm mt-2">Crea tu primera sala privada para empezar</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-black/20 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{room.name}</h3>
                      {room.description && (
                        <p className="text-white/70 text-sm mb-2">{room.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.participants?.length || 0} miembros
                        </span>
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {(room.token_cost ?? 0) > 0 ? `${room.token_cost} tokens` : "Gratis"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMuteRoom(room.id)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        title="Silenciar sala"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleHideRoom(room.id)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        title="Ocultar sala"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Eliminar sala"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mensaje para usuarios no premium */}
        {!isPremium && (
          <div className="text-center py-4 text-white/70 text-sm">
            <p>Los usuarios premium pueden crear salas privadas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
