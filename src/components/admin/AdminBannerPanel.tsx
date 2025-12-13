/**
 * AdminBannerPanel - Panel de Administración de Banners
 * =====================================================
 * Descripción: Interfaz para gestionar banners desde el panel admin
 * Fecha: 12 Dic 2025
 * Versión: v3.8.0
 * 
 * Características:
 * - CRUD completo de banners
 * - Vista de lista y formulario de edición
 * - Activar/Desactivar banners
 * - Solo acceso admin
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import { BannerManagementService, BannerConfig, CreateBannerInput } from '@/services/BannerManagementService';
import { logger } from '@/lib/logger';

// ============================================================================
// TIPOS
// ============================================================================

type BannerType = 'beta' | 'news' | 'announcement' | 'maintenance' | 'custom';

interface FormData extends CreateBannerInput {
  banner_type: BannerType;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AdminBannerPanel: React.FC = () => {
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    banner_type: 'announcement',
    title: '',
    description: '',
    is_active: true,
    show_close_button: true,
    background_color: 'from-purple-600 to-blue-600',
    text_color: 'text-white',
    icon_type: 'bell',
    cta_text: '',
    cta_link: '',
    priority: 0,
  });

  // Cargar banners al montar
  useEffect(() => {
    loadBanners();
  }, []);

  // ============================================================================
  // FUNCIONES
  // ============================================================================

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await BannerManagementService.getAllBanners();
      setBanners(data);
      logger.info('✅ Banners cargados', { count: data.length });
    } catch (error) {
      logger.error('❌ Error cargando banners:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      logger.warn('⚠️ Título requerido');
      return;
    }

    try {
      const newBanner = await BannerManagementService.createBanner(formData);
      if (newBanner) {
        setBanners([newBanner, ...banners]);
        resetForm();
        logger.info('✅ Banner creado exitosamente');
      }
    } catch (error) {
      logger.error('❌ Error creando banner:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleUpdate = async (bannerId: string) => {
    try {
      const updated = await BannerManagementService.updateBanner(bannerId, formData);
      if (updated) {
        setBanners(banners.map(b => (b.id === bannerId ? updated : b)));
        resetForm();
        logger.info('✅ Banner actualizado exitosamente');
      }
    } catch (error) {
      logger.error('❌ Error actualizando banner:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('¿Eliminar este banner?')) return;

    try {
      const success = await BannerManagementService.deleteBanner(bannerId);
      if (success) {
        setBanners(banners.filter(b => b.id !== bannerId));
        logger.info('✅ Banner eliminado exitosamente');
      }
    } catch (error) {
      logger.error('❌ Error eliminando banner:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleToggleVisibility = async (banner: BannerConfig) => {
    try {
      const updated = await BannerManagementService.toggleBannerVisibility(
        banner.id,
        !banner.is_active
      );
      if (updated) {
        setBanners(banners.map(b => (b.id === banner.id ? updated : b)));
        logger.info('✅ Visibilidad actualizada');
      }
    } catch (error) {
      logger.error('❌ Error toggling visibility:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleEdit = (banner: BannerConfig) => {
    setFormData({
      banner_type: banner.banner_type as BannerType,
      title: banner.title,
      description: banner.description ?? '',
      is_active: Boolean(banner.is_active),
      show_close_button: Boolean(banner.show_close_button),
      background_color: banner.background_color ?? 'from-purple-600 to-blue-600',
      text_color: banner.text_color,
      icon_type: banner.icon_type,
      cta_text: banner.cta_text ?? '',
      cta_link: banner.cta_link ?? '',
      priority: banner.priority ?? 0,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      banner_type: 'announcement',
      title: '',
      description: '',
      is_active: true,
      show_close_button: true,
      background_color: 'from-purple-600 to-blue-600',
      text_color: 'text-white',
      icon_type: 'bell',
      cta_text: '',
      cta_link: '',
      priority: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-8 text-center text-slate-400">
          Cargando banners...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Banners</h2>
          <p className="text-slate-400 text-sm mt-1">
            Administra los banners que se muestran en la plataforma
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Banner
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingId ? 'Editar Banner' : 'Crear Nuevo Banner'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de Banner */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo de Banner
              </label>
              <select
                value={formData.banner_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    banner_type: e.target.value as BannerType,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
              >
                <option value="beta">Beta</option>
                <option value="news">Noticias</option>
                <option value="announcement">Anuncio</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                placeholder="Ej: ¡Acceso Exclusivo Beta!"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                placeholder="Descripción del banner"
                rows={3}
              />
            </div>

            {/* Grid de opciones */}
            <div className="grid grid-cols-2 gap-4">
              {/* Activo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === 'active',
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              {/* Mostrar botón cerrar */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Botón Cerrar
                </label>
                <select
                  value={formData.show_close_button ? 'yes' : 'no'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      show_close_button: e.target.value === 'yes',
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                >
                  <option value="yes">Mostrar</option>
                  <option value="no">Ocultar</option>
                </select>
              </div>

              {/* Color de fondo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gradiente
                </label>
                <select
                  value={formData.background_color ?? 'from-purple-600 to-blue-600'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      background_color: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                  <option value="from-purple-600 to-blue-600">Purple → Blue</option>
                  <option value="from-green-600 to-emerald-600">Green → Emerald</option>
                  <option value="from-red-600 to-pink-600">Red → Pink</option>
                  <option value="from-yellow-600 to-orange-600">Yellow → Orange</option>
                  <option value="from-slate-700 to-slate-900">Slate</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prioridad
                </label>
                <input
                  type="number"
                  value={formData.priority ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  min={0}
                  max={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Texto CTA
                </label>
                <input
                  type="text"
                  value={formData.cta_text || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cta_text: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  placeholder="Ej: Más Información"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link CTA
                </label>
                <input
                  type="text"
                  value={formData.cta_link || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cta_link: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                  placeholder="Ej: /premium"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() =>
                  editingId ? handleUpdate(editingId) : handleCreate()
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Banners */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-8 text-center text-slate-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No hay banners configurados
            </CardContent>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card
              key={banner.id}
              className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {banner.title}
                      </h3>
                      <Badge
                        variant={banner.is_active ? 'default' : 'secondary'}

                        className={
                          banner.is_active
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-slate-600/20 text-slate-400'
                        }
                      >
                        {banner.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {banner.banner_type}
                      </Badge>
                    </div>
                    {banner.description && (
                      <p className="text-slate-400 text-sm mb-2">
                        {banner.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Prioridad: {banner.priority}</span>
                      <span>Actualizado: {banner.updated_at ? new Date(banner.updated_at).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleVisibility(banner)}
                      className="text-slate-400 hover:text-white"
                    >
                      {banner.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(banner)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(banner.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
