import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/shared/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Shield, 
  Mail,
  Calendar,
  MapPin,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  location?: string;
  bio?: string;
  is_premium?: boolean;
  is_verified?: boolean;
  created_at: string;
  last_seen?: string;
  status: 'active' | 'suspended' | 'banned' | 'pending';
  reports_count?: number;
  account_type?: string;
}

interface UserFilters {
  status: string;
  isPremium: string;
  isVerified: string;
  ageRange: string;
  gender: string;
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilters>({
    status: 'all',
    isPremium: 'all',
    isVerified: 'all',
    ageRange: 'all',
    gender: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // New User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserType, setNewUserType] = useState('single');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadUsers();

    // Realtime subscription
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('Realtime update:', payload);
        loadUsers(); // Reload to ensure consistency, or optimistically update
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filters]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      if (!supabase) return;
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
            title: "Error",
            description: "No se pudieron cargar los usuarios",
            variant: "destructive"
        });
      } else {
        const processedUsers = (profiles || []).map(profile => ({
          id: profile.id,
          name: profile.display_name || profile.first_name || 'Usuario',
          email: profile.email || 'No disponible', // Note: email might not be in profiles depending on schema, but we use what we have
          age: profile.age || undefined,
          gender: profile.gender || undefined,
          location: profile.location || 'No especificada',
          bio: profile.bio || undefined,
          is_premium: profile.is_premium || false,
          is_verified: profile.is_verified || false,
          created_at: profile.created_at || new Date().toISOString(),
          last_seen: profile.last_seen || undefined,
          status: profile.suspended ? 'suspended' : 'active', // Derived status
          reports_count: 0, // Need separate query for reports if needed
          account_type: profile.account_type
        }));
        setUsers(processedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || user.status === filters.status;
      const matchesPremium = filters.isPremium === 'all' || 
                            (filters.isPremium === 'premium' && user.is_premium) ||
                            (filters.isPremium === 'free' && !user.is_premium);
      const matchesVerified = filters.isVerified === 'all' ||
                             (filters.isVerified === 'verified' && user.is_verified) ||
                             (filters.isVerified === 'unverified' && !user.is_verified);
      const matchesGender = filters.gender === 'all' || user.gender === filters.gender;
      
      let matchesAge = true;
      if (filters.ageRange !== 'all' && user.age) {
        const age = user.age;
        switch (filters.ageRange) {
          case '18-24':
            matchesAge = age >= 18 && age <= 24;
            break;
          case '25-34':
            matchesAge = age >= 25 && age <= 34;
            break;
          case '35-44':
            matchesAge = age >= 35 && age <= 44;
            break;
          case '45+':
            matchesAge = age >= 45;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesPremium && matchesVerified && matchesGender && matchesAge;
    });

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
      if (!newUserEmail || !newUserPassword || !newUserName) {
          toast({ title: "Error", description: "Todos los campos son obligatorios", variant: "destructive" });
          return;
      }

      setIsCreatingUser(true);
      try {
          const { data, error } = await supabase.functions.invoke('create-user', {
              body: {
                  email: newUserEmail,
                  password: newUserPassword,
                  name: newUserName,
                  profileType: newUserType
              }
          });

          if (error) throw error;

          toast({ title: "Éxito", description: "Usuario creado correctamente" });
          setShowAddUserModal(false);
          setNewUserEmail('');
          setNewUserPassword('');
          setNewUserName('');
          loadUsers(); // Refresh list
      } catch (error: any) {
          console.error('Error creating user:', error);
          toast({ title: "Error", description: error.message || "No se pudo crear el usuario", variant: "destructive" });
      } finally {
          setIsCreatingUser(false);
      }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'verify' | 'delete') => {
    if (!confirm('¿Estás seguro de realizar esta acción?')) return;

    try {
      if (action === 'suspend' || action === 'activate') {
          const { error } = await supabase.functions.invoke('suspend-user', {
              body: {
                  userId,
                  action,
                  reason: 'Admin action'
              }
          });
          if (error) throw error;
      } else if (action === 'delete') {
          const { error } = await supabase.functions.invoke('delete-user', {
              body: { userId }
          });
          if (error) throw error;
      } else if (action === 'verify') {
           // Direct DB update for simple verify
           const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
           if (error) throw error;
      }

      toast({
        title: "Acción completada",
        description: `Acción ${action} realizada con éxito`,
      });
      loadUsers();
    } catch (error) {
      console.error('Error performing user action:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la acción",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: User['status']) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
      suspended: { label: 'Suspendido', className: 'bg-red-100 text-red-800' },
      banned: { label: 'Baneado', className: 'bg-red-900 text-white' },
      pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'suspended':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'banned':
        return <Ban className="w-4 h-4 text-red-900" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Gestión de Usuarios
          </h2>
          <p className="text-gray-600">
            Administra usuarios, perfiles y acciones de moderación
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border px-2 py-1 rounded">
            Total: {users.length}
          </Badge>
          <Badge className="border px-2 py-1 rounded">
            Activos: {users.filter(u => u.status === 'active').length}
          </Badge>
          
          <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Usuario
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Nombre completo" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="correo@ejemplo.com" type="email" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contraseña</label>
                        <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="********" type="password" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Perfil</label>
                        <Select value={newUserType} onValueChange={setNewUserType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Soltero/a</SelectItem>
                                <SelectItem value="couple">Pareja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreateUser} disabled={isCreatingUser} className="w-full">
                        {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                    </Button>
                </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre, email o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.status} onValueChange={(value: string) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="suspended">Suspendidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Suscripción</label>
              <Select value={filters.isPremium} onValueChange={(value: string) => setFilters({...filters, isPremium: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verificación</label>
              <Select value={filters.isVerified} onValueChange={(value: string) => setFilters({...filters, isVerified: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="unverified">No verificados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Usuarios ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando usuarios...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron usuarios</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{user.name}</h4>
                            {user.is_verified && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                            {user.is_premium && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Premium</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{user.account_type || 'single'}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1" title={user.id}>
                                <span className="font-mono text-xs opacity-50">ID: {user.id.substring(0, 8)}...</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </span>
                            {user.age && (
                              <span>{user.age} años</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.status)}
                          {getStatusBadge(user.status)}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedUser(user)}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Acciones para {user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-2">
                              <Button 
                                variant="outline"
                                className="justify-start"
                                onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Perfil (Pestaña nueva)
                              </Button>
                              
                              {user.status === 'active' && (
                                <Button 
                                  variant="outline"
                                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Suspender Usuario
                                </Button>
                              )}
                              
                              {(user.status === 'suspended' || user.status === 'banned') && (
                                <Button 
                                  variant="outline"
                                  className="justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activar Usuario
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline"
                                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleUserAction(user.id, 'delete')}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar Permanentemente
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
