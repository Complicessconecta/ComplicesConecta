import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  createClubEvent,
  loadClubEvents,
  loadClubMembers,
  type ClubEventItem,
  type ClubMemberItem,
} from "@/services/clubs/clubContentService";

// Datos de respaldo cuando Supabase no devuelve clubs (tabla vacía / RLS).
// Las fotos son las mismas del catálogo público (PUBLIC_CLUBS en
// @/pages/ClubsPublic): cada club tiene UNA foto distinta — Eden Noir
// (1514525253161) no se repite en ningún otro club (ronda 7, punto 7).
// Antes este respaldo no tenía foto ni slug y la tabla no mostraba
// ninguna imagen, así que en /clubs/demo los clubs eran solo texto.
const MOCK_CLUBS = [
  {
    id: "demo-1",
    slug: "demo",
    name: "Club Demo CómplicesConecta",
    city: "CDMX",
    rating: 4.8,
    checkIns: 420,
    isActive: true,
    isVerified: true,
    category: "premium",
    createdAt: "2026-01-26",
    coverImageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400",
  },
  {
    id: "demo-2",
    slug: "noche-vip-lounge",
    name: "Noche VIP Lounge",
    city: "Guadalajara",
    rating: 4.5,
    checkIns: 234,
    isActive: true,
    isVerified: true,
    category: "standard",
    createdAt: "2026-01-25",
    coverImageUrl:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400",
  },
  {
    id: "demo-3",
    slug: "mystic-garden",
    name: "Mystic Garden",
    city: "Monterrey",
    rating: 4.2,
    checkIns: 145,
    isActive: false,
    isVerified: false,
    category: "standard",
    createdAt: "2026-01-24",
    coverImageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
  },
  {
    // Ronda 7, punto 7: "Eden Noir" no existía en este respaldo (la
    // tabla de /clubs/demo solo listaba Club Demo, Noche VIP Lounge y
    // Mystic Garden) aunque sí está en el catálogo público. Foto
    // distinta a las de los otros tres (la misma portada que en
    // PUBLIC_CLUBS, 1514525253161).
    id: "demo-4",
    slug: "eden-noir",
    name: "Eden Noir Club",
    city: "CDMX",
    rating: 4.9,
    checkIns: 980,
    isActive: true,
    isVerified: true,
    category: "premium",
    createdAt: "2026-01-23",
    coverImageUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  },
];

interface SimpleClub {
  id: string;
  slug?: string | undefined;
  name: string;
  city: string;
  rating: number;
  checkIns: number;
  isActive: boolean;
  isVerified: boolean;
  category: string;
  createdAt: string;
  /** Portada del club (foto distinta por club); sin ella la tabla muestra un icono. */
  coverImageUrl?: string | null;
}

const ClubAdminPanelSimple: React.FC = () => {
  const [clubs, setClubs] = useState<SimpleClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Eventos y miembros del club seleccionado: leen/escriben las tablas
  // club_events y club_members (migración 20261124030000) con respaldo demo.
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [events, setEvents] = useState<ClubEventItem[]>([]);
  const [members, setMembers] = useState<ClubMemberItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventPrice, setNewEventPrice] = useState("");

  useEffect(() => {
    if (clubs.length > 0 && !selectedClubId) {
      const first = clubs[0];
      if (first) setSelectedClubId(first.id);
    }
  }, [clubs, selectedClubId]);

  useEffect(() => {
    if (!selectedClubId) return;
    let cancelled = false;
    setEventsLoading(true);
    void Promise.all([
      loadClubEvents(selectedClubId),
      loadClubMembers(selectedClubId),
    ]).then(([{ items: ev }, { items: mb }]) => {
      if (cancelled) return;
      setEvents(ev);
      setMembers(mb);
      setEventsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedClubId]);

  // Cargar clubs reales de Supabase; sin datos se usa el respaldo demo.
  // La consulta compite contra un timeout de 3 s: sin él, una BD lenta
  // dejaba ~10 s en "Cargando clubs..." antes de mostrar el respaldo.
  const loadClubs = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("clubs")
        .select(
          "id, slug, name, city, cover_image_url, rating_average, check_in_count, is_active, verified_at, membership_tier, created_at",
        )
        .order("created_at", { ascending: false });
      const { data, error } = await Promise.race([
        query,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout cargando clubs")), 3000),
        ),
      ]);
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped: SimpleClub[] = data.map((row) => ({
          id: row.id,
          slug: (row as { slug?: string | null }).slug ?? undefined,
          name: row.name,
          city: row.city,
          rating: row.rating_average ?? 0,
          checkIns: row.check_in_count ?? 0,
          isActive: row.is_active ?? false,
          isVerified: Boolean(row.verified_at),
          category: row.membership_tier ?? "standard",
          createdAt: row.created_at,
          coverImageUrl:
            (row as { cover_image_url?: string | null }).cover_image_url ??
            null,
        }));
        setClubs(mapped);
      } else {
        setClubs(MOCK_CLUBS);
      }
    } catch (error) {
      logger.warn("ClubAdminPanel: usando respaldo demo", {
        error: String(error),
      });
      setClubs(MOCK_CLUBS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClubs();
  }, []);

  // Filtrar clubs
  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && club.isActive) ||
      (statusFilter === "inactive" && !club.isActive) ||
      (statusFilter === "verified" && club.isVerified) ||
      (statusFilter === "unverified" && !club.isVerified);

    return matchesSearch && matchesStatus;
  });

  // Eliminar club (real en Supabase; el demo no se puede borrar).
  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (
      !confirm(`¿Estás seguro de que deseas eliminar el club "${clubName}"?`)
    ) {
      return;
    }
    if (clubId.startsWith("demo-")) {
      setClubs(clubs.filter((club) => club.id !== clubId));
      return;
    }
    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    if (error) {
      logger.error("Error deleting club", { error: String(error) });
      alert(`No se pudo eliminar el club: ${error.message}`);
      return;
    }
    await loadClubs();
  };

  // Toggle estado del club (real en Supabase).
  const handleToggleStatus = async (clubId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (clubId.startsWith("demo-")) {
      setClubs(
        clubs.map((club) =>
          club.id === clubId ? { ...club, isActive: newStatus } : club,
        ),
      );
      return;
    }
    const { error } = await supabase
      .from("clubs")
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq("id", clubId);
    if (error) {
      logger.error("Error toggling club", { error: String(error) });
      alert(`No se pudo actualizar el club: ${error.message}`);
      return;
    }
    await loadClubs();
  };

  const getStatusBadge = (club: SimpleClub) => {
    if (!club.isActive) {
      return <Badge variant="destructive">Suspendido</Badge>;
    }
    if (club.isVerified) {
      return <Badge variant="default">Verificado</Badge>;
    }
    return <Badge variant="secondary">No Verificado</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive"> = {
      premium: "default",
      standard: "secondary",
    };
    return (
      <Badge variant={colors[category] || "secondary"}>
        {category.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando clubs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Administración de Clubs
          </h2>
          <p className="text-muted-foreground">
            Gestiona todos los clubs de la plataforma (Modo Demo)
          </p>
        </div>
        <Button onClick={() => alert("Crear nuevo club (Demo)")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Club
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clubs.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clubs.filter((c) => c.isVerified).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {clubs.filter((c) => !c.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="verified">Verificados</option>
              <option value="unverified">No Verificados</option>
            </select>
            <Button variant="outline">Exportar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Clubs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clubs ({filteredClubs.length})</CardTitle>
          <CardDescription>
            Lista de todos los clubs registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white">
              <thead>
                <tr className="bg-purple-100 dark:bg-purple-950/80">
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Foto
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Nombre
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Ciudad
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Categoría
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Estado
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Rating
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Check-ins
                  </th>
                  <th className="border border-slate-200 dark:border-white/15 px-4 py-2 text-left text-slate-900 dark:text-white">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClubs.map((club) => (
                  <tr
                    key={club.id}
                    className="hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2">
                      {club.coverImageUrl ? (
                        <img
                          src={club.coverImageUrl}
                          alt={club.name}
                          className="h-12 w-16 object-cover rounded-md"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded-md bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                          <Building className="h-5 w-5 text-slate-500 dark:text-white/50" />
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2 font-medium text-slate-900 dark:text-white">
                      {club.name}
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2 text-slate-700 dark:text-white/90">
                      {club.city}
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2">
                      {getCategoryBadge(club.category)}
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2">
                      {getStatusBadge(club)}
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span>{club.rating}</span>
                        <span className="text-slate-500 dark:text-white/60">
                          ({club.checkIns})
                        </span>
                      </div>
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2 text-slate-700 dark:text-white/90">
                      {club.checkIns}
                    </td>
                    <td className="border border-slate-200 dark:border-white/15 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            alert(`Ver detalles de ${club.name} (Demo)`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert(`Editar ${club.name} (Demo)`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(club.id, club.isActive)
                          }
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClub(club.id, club.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Eventos y miembros del club seleccionado */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos y miembros</CardTitle>
          <CardDescription>
            Eventos (club_events) y miembros (club_members) del club
            seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white dark:border-white/20 dark:bg-purple-950/60 px-3 py-2 text-slate-900 dark:text-white"
          >
            {clubs.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="bg-white text-slate-900 dark:bg-purple-950 dark:text-white"
              >
                {c.name} — {c.city}
              </option>
            ))}
          </select>

          {eventsLoading ? (
            <p className="text-slate-600 dark:text-white/70 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando eventos y
              miembros...
            </p>
          ) : (
            <>
              <div>
                <h4 className="text-slate-900 dark:text-white font-semibold mb-2">
                  Eventos ({events.length})
                </h4>
                {events.length === 0 ? (
                  <p className="text-slate-500 dark:text-white/60 text-sm">
                    Sin eventos para este club.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {events.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-slate-900 dark:text-white font-medium truncate">
                            {ev.title}
                          </p>
                          <p className="text-slate-500 dark:text-white/60 text-xs">
                            {new Date(ev.date).toLocaleDateString("es-MX")}{" "}
                            {ev.startTime ? `· ${ev.startTime}` : ""} ·{" "}
                            {ev.registeredCount}/{ev.capacity} registrados
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {ev.isVip ? "VIP" : `$${ev.price}`}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form
                className="flex flex-wrap gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newEventTitle.trim() || !newEventDate || !selectedClubId)
                    return;
                  const created = await createClubEvent({
                    clubId: selectedClubId,
                    title: newEventTitle.trim(),
                    eventDate: newEventDate,
                    price: Number(newEventPrice) || 0,
                  });
                  setEvents((prev) => [created, ...prev]);
                  setNewEventTitle("");
                  setNewEventDate("");
                  setNewEventPrice("");
                }}
              >
                <input
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Título del evento"
                  className="flex-1 min-w-[160px] rounded-lg border border-slate-300 bg-white dark:border-white/20 dark:bg-purple-950/60 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
                />
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white dark:border-white/20 dark:bg-purple-950/60 px-3 py-2 text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min={0}
                  value={newEventPrice}
                  onChange={(e) => setNewEventPrice(e.target.value)}
                  placeholder="Precio $"
                  className="w-28 rounded-lg border border-slate-300 bg-white dark:border-white/20 dark:bg-purple-950/60 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
                />
                <Button type="submit" variant="love">
                  <Plus className="h-4 w-4 mr-1" /> Crear evento
                </Button>
              </form>

              <div>
                <h4 className="text-slate-900 dark:text-white font-semibold mb-2">
                  Miembros ({members.length})
                </h4>
                {members.length === 0 ? (
                  <p className="text-slate-500 dark:text-white/60 text-sm">
                    Sin miembros registrados.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 px-3 py-2"
                      >
                        <span className="text-slate-900 dark:text-white truncate">
                          {m.displayName}
                        </span>
                        <Badge variant="secondary">
                          {m.role} · {m.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubAdminPanelSimple;
