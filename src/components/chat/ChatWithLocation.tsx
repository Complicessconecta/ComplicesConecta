import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Send, Share2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string | null;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const LOCATION_MARKER = "📍 Ubicación compartida:";
const LOCATION_URL_PATTERN =
  /https:\/\/maps\.google\.com\/\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;

const getLocationUrl = (location: NonNullable<Message["location"]>) =>
  `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

const parseLocation = (content: string): Message["location"] => {
  const match = content.match(LOCATION_URL_PATTERN);
  if (!match) return undefined;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }

  return { latitude, longitude };
};

interface ChatWithLocationProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export const ChatWithLocation = ({
  conversationId,
  currentUserId,
  otherUser,
}: ChatWithLocationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    location,
    getCurrentLocation,
    calculateDistance,
    isLoading: locationLoading,
  } = useGeolocation();
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    try {
      if (!supabase) {
        logger.error("Supabase no está disponible");
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at")
        .eq("room_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const senderIds = [
        ...new Set(
          data
            .map((message) => message.sender_id)
            .filter((senderId): senderId is string => senderId !== null),
        ),
      ];
      const profilesByUserId = new Map<
        string,
        { first_name: string | null; last_name: string | null; name: string }
      >();

      if (senderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, name")
          .in("user_id", senderIds);

        if (profilesError) throw profilesError;
        for (const profile of profiles || []) {
          profilesByUserId.set(profile.user_id, profile);
        }
      }

      const formattedMessages: Message[] = data.map((msg) => {
        const profile = msg.sender_id
          ? profilesByUserId.get(msg.sender_id)
          : undefined;
        const location = parseLocation(msg.content);
        return {
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id || "",
          sender_name:
            `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
            profile?.name ||
            "Usuario",
          created_at: msg.created_at,
          ...(location ? { location } : {}),
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      logger.error("Error fetching messages:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [conversationId]);

  const subscribeToMessages = useCallback(() => {
    if (!supabase) {
      logger.error("Supabase no está disponible");
      return () => {};
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages(); // Refetch to get sender details
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (includeLocation = false) => {
    if (!newMessage.trim() && !includeLocation) return;

    setIsLoading(true);
    try {
      const content =
        includeLocation && location
          ? `${newMessage.trim() ? `${newMessage.trim()}\n` : ""}${LOCATION_MARKER} ${getLocationUrl(location)}`
          : newMessage.trim();

      if (!supabase) {
        logger.error("Supabase no está disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo enviar el mensaje.",
        });
        return;
      }

      const { error } = await supabase.from("messages").insert({
        room_id: conversationId,
        sender_id: currentUserId,
        content,
      });

      if (error) throw error;

      setNewMessage("");

      if (includeLocation) {
        toast({
          title: "Ubicación compartida",
          description: "Tu ubicación actual ha sido enviada.",
        });
      }
    } catch (error) {
      logger.error("Error sending message:", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shareLocation = async () => {
    if (!location) {
      await getCurrentLocation();
      return;
    }
    await sendMessage(true);
  };

  const formatDistance = (msgLocation: {
    latitude: number;
    longitude: number;
  }) => {
    if (!location) return null;
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      msgLocation.latitude,
      msgLocation.longitude,
    );
    return `${distance} km de distancia`;
  };

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [conversationId, fetchMessages, subscribeToMessages]);

  return (
    <Card className="h-150 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{otherUser.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              En línea
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] space-y-2`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.sender_id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">
                    {message.location
                      ? message.content
                          .replace(LOCATION_URL_PATTERN, "")
                          .replace(LOCATION_MARKER, "")
                          .trim() || "📍 Ubicación compartida"
                      : message.content}
                  </p>
                  {message.location && (
                    <div className="mt-2 p-2 rounded bg-background/20 border">
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>Ubicación compartida</span>
                      </div>
                      <a
                        href={getLocationUrl(message.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs underline"
                      >
                        Abrir mapa
                      </a>
                      {location && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {formatDistance(message.location)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {message.created_at
                    ? new Date(message.created_at).toLocaleTimeString()
                    : ""}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={shareLocation}
              disabled={locationLoading || isLoading}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {location ? "Compartir ubicación" : "Obtener ubicación"}
            </Button>
            {location && (
              <Badge variant="secondary" className="text-xs">
                Ubicación disponible
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

