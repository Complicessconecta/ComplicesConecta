/**import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards/Card';

// Datos mock simplificados
const MOCK_CLUBS = [
  {
    id: "demo-1",
    name: "Club Demo CómplicesConecta",
    city: "CDMX",
    rating: 4.8,
    checkIns: 420,
    isActive: true,
    isVerified: true,
    category: "premium",
    createdAt: "2026-01-26"
  },
  {
    id: "demo-2", 
    name: "Noche VIP Lounge",
    city: "Guadalajara",
    rating: 4.5,
    checkIns: 234,
    isActive: true,
    isVerified: true,
    category: "standard",
    createdAt: "2026-01-25"
  },
  {
    id: "demo-3",
    name: "Mystic Garden",
    city: "Monterrey",
    rating: 4.2,
    checkIns: 145,
    isActive: false,
    isVerified: false,
    category: "standard",
    createdAt: "2026-01-24"
  }
];

interface SimpleClub {
  id: string;
  name: string;
  city: string;
  rating: number;
  checkIns: number;
  isActive: boolean;
  isVerified: boolean;
  category: string;
  createdAt: string;
}

const ClubAdminPanelSimple: React.FC = () => {
  const [clubs, setClubs] = useState<SimpleClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Cargar datos mock
  useEffect(() => {
    setTimeout(() => {
      setClubs(MOCK_CLUBS);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtrar clubs
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && club.isActive) ||
                         (statusFilter === 'inactive' && !club.isActive) ||
                         (statusFilter === 'verified' && club.isVerified) ||
                         (statusFilter === 'unverified' && !club.isVerified);

    return matchesSearch && matchesStatus;
  });

  // Eliminar club (mock)
  const handleDeleteClub = (clubId: string, clubName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el club "${clubName}"?`)) {
      return;
    }
    setClubs(clubs.filter(club => club.id !== clubId));
  };

  // Toggle estado del club (mock)
  const handleToggleStatus = (clubId: string, clubName: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setClubs(clubs.map(club => 
      club.id === clubId ? { ...club, isActive: newStatus } : club
    ));
    alert(`Club "${clubName}" ${newStatus ? 'activado' : 'suspendido'} (Demo)`);
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
      premium: 'default',
      standard: 'secondary',
    };
    return <Badge variant={colors[category] || 'secondary'}>{category.toUpperCase()}</Badge>;
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
      // {/* Header */ /**
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administración de Clubs</h2>
          <p className="text-muted-foreground">
            Gestiona todos los clubs de la plataforma (Modo Demo)
          </p>
        </div>
        <Button onClick={() => alert('Crear nuevo club (Demo)')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Club
        </Button>
      </div>

      {/* Stats Cards *//**
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
              {clubs.filter(c => c.isActive).length}
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
              {clubs.filter(c => c.isVerified).length}
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
              {clubs.filter(c => !c.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */ /**
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
            <Button variant="outline">
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clubs Table */ /**
      <Card>
        <CardHeader>
          <CardTitle>Clubs ({filteredClubs.length})</CardTitle>
          <CardDescription>
            Lista de todos los clubs registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Nombre</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Ciudad</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Categoría</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Estado</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Rating</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Check-ins</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-medium">{club.name}</td>
                    <td className="border border-gray-200 px-4 py-2">{club.city}</td>
                    <td className="border border-gray-200 px-4 py-2">{getCategoryBadge(club.category)}</td>
                    <td className="border border-gray-200 px-4 py-2">{getStatusBadge(club)}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span>{club.rating}</span>
                        <span className="text-muted-foreground">({club.checkIns})</span>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">{club.checkIns}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert(`Ver detalles de ${club.name} (Demo)`)}
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
                          onClick={() => handleToggleStatus(club.id, club.name, club.isActive)}
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
    </div>
  );
};

export default ClubAdminPanelSimple */
