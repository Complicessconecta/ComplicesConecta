import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Camera, X, Users, MapPin, AlertCircle, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "@/components/profiles/shared/ImageUpload";
import { SAFE_INTERESTS } from "@/lib/lifestyle-interests";
import { ExplicitInterestsEditor } from "@/components/settings/ExplicitInterestsEditor";
import { useGeolocation } from "@/hooks/useGeolocation";
import { logger } from "@/lib/logger";
import { resolveDemoAccountType } from "@/lib/app-config";
import { supabase } from "@/integrations/supabase/client";
import { useDemoThemeConfig, useProfileTheme } from "@/features/profile/useProfileTheme";
import { motion } from "framer-motion";

const EditProfileCouple = () => {
  // Valores que el perfil de pareja ya muestra en demo (ProfileCouple):
  // los títulos de intereses de respaldo, la bio visible y las galerías
  // actual (3 públicas + 4 privadas). El editor debe precargarlos: antes
  // dejaba bio e intereses en [] y Guardar escribía [] en demo_user, con
  // lo que el perfil perdía los intereses y el "Completo" bajaba de 83% a
  // 67% (full test 2026-11-24).
  const DEMO_COUPLE_INTEREST_TITLES = [
    "Lifestyle Exclusivo",
    "Eventos VIP",
    "Privacidad Total",
    "Verificación Real",
    "Chat Encriptado",
    "Match Inteligente",
  ] as const;
  const DEMO_COUPLE_BIO =
    "Una pareja aventurera que busca nuevas experiencias y conexiones auténticas.";
  const DEMO_PARTNER_BIO = "Usuario de demostración.";
  const DEMO_COUPLE_PUBLIC_IMAGES = [
    "/assets/people/couple/c1.jpg",
    "/assets/people/couple/c2.jpg",
    "/assets/people/couple/c3.jpg",
  ];
  const DEMO_COUPLE_PRIVATE_IMAGES = [
    "/assets/people/couple/privado/privadocouple1.jpg",
    "/assets/people/couple/privado/privadocouple2.jpg",
    "/assets/people/couple/privado/privadocouple3.jpg",
    "/assets/people/couple/privado/privadocouple4.jpg",
  ];

  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    coupleName: "",
    location: "",
    bio: "",
    interests: [] as string[],
    explicitInterests: [] as string[],
    partner1: {
      firstName: "",
      lastName: "",
      nickname: "",
      age: "",
      profession: "",
      bio: "",
      avatar: "",
      interests: [] as string[],
      publicImages: [] as string[],
      privateImages: [] as string[],
    },
    partner2: {
      firstName: "",
      lastName: "",
      nickname: "",
      age: "",
      profession: "",
      bio: "",
      avatar: "",
      interests: [] as string[],
      publicImages: [] as string[],
      privateImages: [] as string[],
    },
  });

  // Demo theme configuration
  const { demoTheme, setDemoTheme, navbarStyle, setNavbarStyle } =
    useDemoThemeConfig();
  const themeConfig = useProfileTheme("couple", ["male", "female"], demoTheme);

  const {
    location,
    error: locationError,
    isLoading: locationLoading,
    getCurrentLocation,
  } = useGeolocation();
  const locationStatus: "idle" | "loading" | "success" | "error" =
    locationLoading
      ? "loading"
      : locationError
        ? "error"
        : location
          ? "success"
          : "idle";

  const derivedLocation = useMemo(() => {
    if (!location) return "";
    const mockCities = [
      "Ciudad de México",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana",
      "León",
      "Juárez",
      "Torreón",
      "Querétaro",
      "Mérida",
    ];
    const seed = Math.abs(
      Math.floor(location.latitude * 1000 + location.longitude * 1000),
    );
    return mockCities[seed % mockCities.length] || "";
  }, [location]);

  const availableInterests = SAFE_INTERESTS;

  // Poblar el formulario con la identidad demo guardada en `demo_user`.
  // Los campos que el demo no trae usan los valores canónicos del perfil
  // demo (Carmen 25 / Roberto 28, CDMX, México), los mismos que muestra
  // ProfileCouple. Nunca se inventa una pareja: sin identidad usable no
  // se genera ningún mock.
  const applyCoupleDemoIdentity = (user: any) => {
    const asString = (value: unknown): string =>
      typeof value === "string" ? value : "";
    const asStringArray = (value: unknown): string[] =>
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
        ? (value as string[])
        : [];
    const partner = (stored: any, firstName: string, age: string, fallbackInterests: string[]) => {
      const nameParts = asString(stored?.name).split(" ");
      const storedInterests = asStringArray(stored?.interests);
      return {
        firstName:
          asString(stored?.firstName) ||
          asString(stored?.first_name) ||
          nameParts[0] ||
          firstName,
        lastName:
          asString(stored?.lastName) ||
          asString(stored?.last_name) ||
          nameParts.slice(1).join(" "),
        nickname: asString(stored?.nickname),
        age:
          stored?.age !== undefined && stored?.age !== null
            ? String(stored.age)
            : age,
        profession: asString(stored?.profession),
        // Sin bio guardada, la que el perfil ya muestra en demo.
        bio: asString(stored?.bio) || DEMO_PARTNER_BIO,
        avatar: asString(stored?.avatar) || asString(stored?.avatar_url),
        // Sin intereses guardados, los que el perfil ya muestra en demo:
        // Guardar sin cambios no debe escribir [] y bajar el "Completo".
        interests:
          storedInterests.length > 0 ? storedInterests : fallbackInterests,
        publicImages: asStringArray(stored?.publicImages),
        privateImages: asStringArray(stored?.privateImages),
      };
    };

    const storedInterests = asStringArray(user.interests);
    setProfile(user);
    setFormData({
      coupleName:
        asString(user.name) ||
        asString(user.coupleName) ||
        asString(user.couple_name) ||
        "Carmen & Roberto",
      location: asString(user.location) || "CDMX, México",
      // Sin bio guardada, la que el perfil ya muestra en demo.
      bio: asString(user.bio) || asString(user.couple_bio) || DEMO_COUPLE_BIO,
      interests:
        storedInterests.length > 0
          ? storedInterests
          : [...DEMO_COUPLE_INTEREST_TITLES],
      explicitInterests: asStringArray(user.explicitInterests),
      partner1: partner(user.partner1, "Carmen", "25", [
        DEMO_COUPLE_INTEREST_TITLES[0],
        DEMO_COUPLE_INTEREST_TITLES[2],
        DEMO_COUPLE_INTEREST_TITLES[4],
      ]),
      partner2: partner(user.partner2, "Roberto", "28", [
        DEMO_COUPLE_INTEREST_TITLES[1],
        DEMO_COUPLE_INTEREST_TITLES[3],
        DEMO_COUPLE_INTEREST_TITLES[5],
      ]),
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Verificar autenticación demo y cargar perfil del usuario
        const demoAuth = localStorage.getItem("demo_authenticated");
        const demoUser = localStorage.getItem("demo_user");

        if (demoAuth !== "true" || !demoUser) {
          navigate("/auth");
          return;
        }

        const user = JSON.parse(demoUser);

        // El demo_user guardado cambia de forma según quién lo escribió
        // (ver EditProfileSingle): resolver el tipo con todas las
        // variantes o el editor cae en el mock aleatorio.
        const demoType =
          resolveDemoAccountType(user) ??
          (localStorage.getItem("userType") === "couple"
            ? "couple"
            : localStorage.getItem("userType") === "single"
              ? "single"
              : null);

        // Sesión de single en el editor de pareja: ir al editor de single,
        // nunca mostrar un mock aleatorio.
        if (demoType === "single") {
          navigate("/edit-profile-single");
          return;
        }

        if (demoType === "couple") {
          applyCoupleDemoIdentity(user);
          return;
        }

        // Sesión demo sin tipo resoluble: ir a /auth, no inventar persona.
        navigate("/auth");
      } catch (error) {
        logger.error("Error cargando perfil de pareja:", {
          error: String(error),
        });
        // En caso de error, si hay sesión demo intentar con la identidad
        // guardada; si no, ir a /auth. Nunca un mock aleatorio.
        try {
          const demoUser = localStorage.getItem("demo_user");
          if (
            localStorage.getItem("demo_authenticated") === "true" &&
            demoUser
          ) {
            const user = JSON.parse(demoUser);
            if (resolveDemoAccountType(user) === "couple") {
              applyCoupleDemoIdentity(user);
              return;
            }
            if (resolveDemoAccountType(user) === "single") {
              navigate("/edit-profile-single");
              return;
            }
          }
        } catch {
          // demo_user corrupto: caer a /auth
        }
        navigate("/auth");
      }
    };

    loadProfile();
  }, [navigate]);

  const handleInputChange = (
    field: string,
    value: string,
    partner?: "partner1" | "partner2",
  ) => {
    if (partner) {
      setFormData((prev) => ({
        ...prev,
        [partner]: {
          ...prev[partner],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const toggleInterest = (
    interest: string,
    partner?: "partner1" | "partner2",
  ) => {
    if (partner) {
      setFormData((prev) => ({
        ...prev,
        [partner]: {
          ...prev[partner],
          interests: prev[partner].interests.includes(interest)
            ? prev[partner].interests.filter((i) => i !== interest)
            : [...prev[partner].interests, interest],
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        interests: prev.interests.includes(interest)
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      }));
    }
  };

  const handleLocationDetection = () => {
    getCurrentLocation();
  };

  const handleImageUploaded = (
    partner: "partner1" | "partner2",
    type: "avatar" | "public" | "private",
    url: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [partner]: {
        ...prev[partner],
        [type === "avatar"
          ? "avatar"
          : type === "public"
            ? "publicImages"
            : "privateImages"]:
          type === "avatar"
            ? url
            : [
                ...prev[partner][
                  type === "public" ? "publicImages" : "privateImages"
                ],
                url,
              ],
      },
    }));
    logger.info(`Imagen ${type} subida para ${partner}`, {
      partner,
      type,
      url,
    });
  };

  const handleImageError = (error: string) => {
    logger.error("Error subiendo imagen", { error });
  };

  const handleRemoveGalleryImage = (
    partner: "partner1" | "partner2",
    type: "public" | "private",
    url: string,
  ) => {
    const key = type === "public" ? "publicImages" : "privateImages";
    setFormData((prev) => ({
      ...prev,
      [partner]: {
        ...prev[partner],
        [key]: prev[partner][key].filter((u) => u !== url),
      },
    }));
  };

  // Fotos actuales de la pareja (las que ya muestra el perfil) + las
  // añadidas en esta sesión. Las actuales son de solo lectura aquí: el
  // editor antes mostraba las zonas vacías aunque el perfil tiene
  // contenido. Solo las añadidas se pueden quitar (X).
  const renderGalleryStrip = (
    currentImages: string[],
    addedImages: string[],
    partner: "partner1" | "partner2",
    type: "public" | "private",
  ) => {
    const all = [...currentImages, ...addedImages];
    if (all.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {all.map((url) => {
          const isAdded = addedImages.includes(url);
          return (
            <div
              key={`${type}-${url}`}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20"
            >
              <img
                src={url}
                alt="Foto de la pareja"
                className="w-full h-full object-cover"
              />
              {isAdded && (
                <button
                  type="button"
                  aria-label="Quitar foto añadida"
                  onClick={() =>
                    handleRemoveGalleryImage(partner, type, url)
                  }
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white hover:bg-black/90"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleSave = async () => {
    // Antes solo registraba y navegaba: la selección de intereses se perdía
    // y el perfil seguía mostrando los títulos demo. Ahora persiste en la
    // misma fuente que lee el perfil.
    const demoAuth =
      typeof window !== "undefined" &&
      window.localStorage.getItem("demo_authenticated") === "true";
    if (demoAuth) {
      try {
        const demoUser = JSON.parse(
          window.localStorage.getItem("demo_user") || "{}",
        );
        // Guardar el formulario COMPLETO en la misma fuente que lee el
        // perfil y el editor: antes solo se persistían los intereses y
        // cualquier cambio de bio, nombre, ubicación o fotos se perdía al
        // guardar (y Guardar sin cambios escribía intereses []).
        const updatedUser = {
          ...demoUser,
          name: formData.coupleName,
          coupleName: formData.coupleName,
          couple_name: formData.coupleName,
          location: formData.location,
          bio: formData.bio,
          couple_bio: formData.bio,
          interests: formData.interests ?? [],
          explicitInterests: formData.explicitInterests ?? [],
          partner1: {
            ...(demoUser.partner1 ?? {}),
            ...formData.partner1,
            interests: formData.partner1?.interests ?? [],
          },
          partner2: {
            ...(demoUser.partner2 ?? {}),
            ...formData.partner2,
            interests: formData.partner2?.interests ?? [],
          },
        };
        window.localStorage.setItem("demo_user", JSON.stringify(updatedUser));
        logger.info("Perfil de pareja guardado (demo)");
      } catch (error) {
        logger.error("Error guardando perfil de pareja en demo", {
          error: String(error),
        });
      }
      navigate("/profile-couple");
      return;
    }
    // Producción: mismas columnas que lee el perfil (couple_profiles).
    if (profile?.id && supabase) {
      const { error } = await supabase
        .from("couple_profiles")
        .update({
          his_interests: formData.partner1?.interests ?? [],
          her_interests: formData.partner2?.interests ?? [],
          couple_interests: formData.interests ?? [],
        })
        .eq("id", profile.id);
      if (error) {
        logger.error("Error guardando intereses de pareja", {
          error: error.message,
        });
      }
    }
    navigate("/profile-couple");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-fuchsia-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeConfig.backgroundClass} pb-20`}>
      {/* Header: con wrap; en móvil el título ocupa su propia línea para
          que "Volver al perfil" + "Guardar" no lo recorten ("E..."). */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            onClick={() => navigate("/profile-couple")}
            className="shrink-0 whitespace-nowrap text-white hover:bg-white/20 bg-transparent border-none"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al perfil
          </Button>
          <h1 className="order-3 w-full text-center text-xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:order-none sm:w-auto sm:flex-1">
            <Users className="h-5 w-5" />
            Editar Perfil de Pareja
          </h1>
          <Button
            onClick={handleSave}
            className="shrink-0 whitespace-nowrap bg-linear-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-24 space-y-6 max-w-4xl">
        {/* Fotos de la pareja */}
        <Card className="bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border-purple-300/30 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-400" />
              Fotos de la pareja
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="w-full h-40">
                  <ImageUpload
                    onImageUploaded={(url) =>
                      handleImageUploaded("partner1", "avatar", url)
                    }
                    onError={handleImageError}
                    userId={`${profile.id}-partner1`}
                    currentImage={formData.partner1.avatar}
                    type="profile"
                    profileType="couple"
                    partnerName={formData.partner1.firstName}
                    className="w-full h-full"
                  />
                </div>
                <p className="text-center text-sm text-white">
                  {formData.partner1.firstName} (Ella)
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-40">
                  <ImageUpload
                    onImageUploaded={(url) =>
                      handleImageUploaded("partner2", "avatar", url)
                    }
                    onError={handleImageError}
                    userId={`${profile.id}-partner2`}
                    currentImage={formData.partner2.avatar}
                    type="profile"
                    profileType="couple"
                    partnerName={formData.partner2.firstName}
                    className="w-full h-full"
                  />
                </div>
                <p className="text-center text-sm text-white">
                  {formData.partner2.firstName} (Él)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información general de la pareja */}
        <Card className="bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border-purple-300/30 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-white mb-4">
              Información general
            </h3>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nombre de la pareja
              </label>
              <Input
                value={formData.coupleName}
                onChange={(e) =>
                  handleInputChange("coupleName", e.target.value)
                }
                placeholder="Ej: Ana & Carlos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ubicación
              </label>
              <div className="space-y-2">
                <Input
                  value={formData.location || derivedLocation}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Ciudad donde viven"
                />
                {locationError && (
                  <div className="flex items-center text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Error al detectar ubicación
                  </div>
                )}
                <Button
                  type="button"
                  onClick={handleLocationDetection}
                  disabled={locationStatus === "loading"}
                  className="w-full border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700 px-3 py-1 text-sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {locationStatus === "loading"
                    ? "Detectando..."
                    : "Reintentar detección de ubicación"}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sobre nosotros
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Cuéntanos sobre ustedes como pareja, qué buscan..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-white/80 mt-2">
                {formData.bio.length}/500 caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Partner 1 (Ella) */}
        <Card className="bg-linear-to-br from-fuchsia-500/20 to-rose-500/20 backdrop-blur-md border-l-4 border-fuchsia-400 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-white mb-4">
              Información de Ella
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre
                </label>
                <Input
                  value={formData.partner1.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value, "partner1")
                  }
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Apellido
                </label>
                <Input
                  value={formData.partner1.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value, "partner1")
                  }
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Apodo
                </label>
                <Input
                  value={formData.partner1.nickname}
                  onChange={(e) =>
                    handleInputChange("nickname", e.target.value, "partner1")
                  }
                  placeholder="Apodo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Edad
                </label>
                <Input
                  type="number"
                  value={formData.partner1.age}
                  onChange={(e) =>
                    handleInputChange("age", e.target.value, "partner1")
                  }
                  placeholder="Edad"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Profesión
              </label>
              <Input
                value={formData.partner1.profession}
                onChange={(e) =>
                  handleInputChange("profession", e.target.value, "partner1")
                }
                placeholder="Profesión"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Descripción personal
              </label>
              <Textarea
                value={formData.partner1.bio}
                onChange={(e) =>
                  handleInputChange("bio", e.target.value, "partner1")
                }
                placeholder="Descripción personal..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Galería de imágenes para Partner 1 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Galería de Imágenes
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/80 mb-2">
                    Imágenes Públicas
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 mx-auto text-white/60 mb-2" />
                    <div className="w-full h-32">
                      <ImageUpload
                        onImageUploaded={(url) =>
                          handleImageUploaded("partner1", "public", url)
                        }
                        onError={handleImageError}
                        userId={`${profile.id}-partner1-public`}
                        type="gallery"
                        profileType="couple"
                        partnerName={formData.partner1.firstName}
                        className="w-full h-full"
                      />
                    </div>
                    {renderGalleryStrip(
                      DEMO_COUPLE_PUBLIC_IMAGES,
                      formData.partner1.publicImages,
                      "partner1",
                      "public",
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-2">
                    Imágenes Privadas
                  </p>
                  <div className="border-2 border-dashed border-fuchsia-300 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 mx-auto text-fuchsia-400 mb-2" />
                    <div className="w-full h-32">
                      <ImageUpload
                        onImageUploaded={(url) =>
                          handleImageUploaded("partner1", "private", url)
                        }
                        onError={handleImageError}
                        userId={`${profile.id}-partner1-private`}
                        type="gallery"
                        profileType="couple"
                        partnerName={formData.partner1.firstName}
                        className="w-full h-full"
                      />
                    </div>
                    {renderGalleryStrip(
                      DEMO_COUPLE_PRIVATE_IMAGES,
                      formData.partner1.privateImages,
                      "partner1",
                      "private",
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Intereses individuales para Partner 1 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Intereses Lifestyle
              </label>
              <p className="text-xs text-white/80 mb-3">
                Selecciona sus intereses para encontrar matches compatibles
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-fuchsia-50">
                {availableInterests.map((interest) => (
                  <Badge
                    key={interest}
                    className={`cursor-pointer transition-all text-xs ${
                      formData.partner1.interests.includes(interest)
                        ? "bg-linear-to-r from-fuchsia-500 to-rose-500 text-white shadow-md"
                        : "hover:bg-fuchsia-100 text-gray-800 border border-fuchsia-200"
                    }`}
                    onClick={() => toggleInterest(interest, "partner1")}
                  >
                    {interest}
                    {formData.partner1.interests.includes(interest) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-white/80 mt-2">
                {formData.partner1.interests.length}/10 seleccionados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Partner 2 (Él) */}
        <Card className="bg-linear-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md border-l-4 border-purple-400 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-white mb-4">Información de Él</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre
                </label>
                <Input
                  value={formData.partner2.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value, "partner2")
                  }
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Apellido
                </label>
                <Input
                  value={formData.partner2.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value, "partner2")
                  }
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Apodo
                </label>
                <Input
                  value={formData.partner2.nickname}
                  onChange={(e) =>
                    handleInputChange("nickname", e.target.value, "partner2")
                  }
                  placeholder="Apodo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Edad
                </label>
                <Input
                  type="number"
                  value={formData.partner2.age}
                  onChange={(e) =>
                    handleInputChange("age", e.target.value, "partner2")
                  }
                  placeholder="Edad"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Profesión
              </label>
              <Input
                value={formData.partner2.profession}
                onChange={(e) =>
                  handleInputChange("profession", e.target.value, "partner2")
                }
                placeholder="Profesión"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Descripción personal
              </label>
              <Textarea
                value={formData.partner2.bio}
                onChange={(e) =>
                  handleInputChange("bio", e.target.value, "partner2")
                }
                placeholder="Descripción personal..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Galería de imágenes para Partner 2 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Galería de Imágenes
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/80 mb-2">
                    Imágenes Públicas
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 mx-auto text-white/60 mb-2" />
                    <div className="w-full h-32">
                      <ImageUpload
                        onImageUploaded={(url) =>
                          handleImageUploaded("partner2", "public", url)
                        }
                        onError={handleImageError}
                        userId={`${profile.id}-partner2-public`}
                        type="gallery"
                        profileType="couple"
                        partnerName={formData.partner2.firstName}
                        className="w-full h-full"
                      />
                    </div>
                    {renderGalleryStrip(
                      DEMO_COUPLE_PUBLIC_IMAGES,
                      formData.partner2.publicImages,
                      "partner2",
                      "public",
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-2">
                    Imágenes Privadas
                  </p>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
                    <Camera className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                    <div className="w-full h-32">
                      <ImageUpload
                        onImageUploaded={(url) =>
                          handleImageUploaded("partner2", "private", url)
                        }
                        onError={handleImageError}
                        userId={`${profile.id}-partner2-private`}
                        type="gallery"
                        profileType="couple"
                        partnerName={formData.partner2.firstName}
                        className="w-full h-full"
                      />
                    </div>
                    {renderGalleryStrip(
                      DEMO_COUPLE_PRIVATE_IMAGES,
                      formData.partner2.privateImages,
                      "partner2",
                      "private",
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Intereses individuales para Partner 2 */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Intereses Lifestyle
              </label>
              <p className="text-xs text-white/80 mb-3">
                Selecciona sus intereses para encontrar matches compatibles
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-blue-50">
                {availableInterests.map((interest) => (
                  <Badge
                    key={interest}
                    className={`cursor-pointer transition-all text-xs ${
                      formData.partner2.interests.includes(interest)
                        ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                        : "hover:bg-blue-100 text-gray-800 border border-blue-200"
                    }`}
                    onClick={() => toggleInterest(interest, "partner2")}
                  >
                    {interest}
                    {formData.partner2.interests.includes(interest) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-white/80 mt-2">
                {formData.partner2.interests.length}/10 seleccionados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Intereses compartidos */}
        <Card className="bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border-purple-300/30 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">
              Intereses compartidos
            </h3>
            <p className="text-sm text-white/80 mb-4">
              Seleccionen hasta 6 intereses que los representen como pareja
            </p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
              {availableInterests.map((interest) => (
                <Badge
                  key={interest}
                  className={`cursor-pointer transition-all text-contrast ${
                    formData.interests.includes(interest)
                      ? "bg-linear-to-r from-fuchsia-500 to-purple-500 text-white shadow-md"
                      : "hover:bg-gray-200 text-gray-800 border border-gray-300"
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                  {formData.interests.includes(interest) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-white/80 mt-2">
              {formData.interests.length}/6 seleccionados
            </p>
          </CardContent>
        </Card>

        {/* 🔒 Intereses Explícitos (Post-Registro) */}
        <ExplicitInterestsEditor
          selectedInterests={formData.explicitInterests}
          onInterestsChange={(interests) =>
            setFormData((prev) => ({ ...prev, explicitInterests: interests }))
          }
          onSave={handleSave}
          className="bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border-purple-300/30"
        />

        {/* 🎨 Personalización Visual */}
        <Card className="bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border-purple-300/30 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              🎨 Personalización Visual
            </h3>

            {/* Selector de Tema */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/90 mb-2 block">
                  Tema de Colores
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDemoTheme("light")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      demoTheme === "light"
                        ? "border-yellow-400 bg-linear-to-br from-fuchsia-300 via-purple-200 to-indigo-200"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sun className="h-4 w-4" />
                      <span
                        className={
                          demoTheme === "light" ? "text-gray-900" : "text-white"
                        }
                      >
                        ☀️ Claro
                      </span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDemoTheme("dark")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      demoTheme === "dark"
                        ? "border-purple-400 bg-linear-to-br from-gray-900 via-gray-800 to-black"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Moon className="h-4 w-4" />
                      🌙 Oscuro
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Selector de Navbar */}
              <div>
                <label className="text-sm text-white/90 mb-2 block">
                  Estilo de Navegación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNavbarStyle("transparent")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      navbarStyle === "transparent"
                        ? "border-blue-400 bg-transparent"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Eye className="h-4 w-4" />
                      Transparente
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNavbarStyle("solid")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      navbarStyle === "solid"
                        ? "border-purple-400 bg-linear-to-r from-purple-600 to-fuchsia-600"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <EyeOff className="h-4 w-4" />
                      Sólida
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de privacidad */}
        <Card className="bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-md border-purple-300/30 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">
              Configuración de privacidad
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Mostrar edades</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-white/20 border-white/30"
                  title="Mostrar edades en perfil"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Mostrar ubicación</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-white/20 border-white/30"
                  title="Mostrar ubicación en perfil"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">
                  Aparecer en búsquedas
                </span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-white/20 border-white/30"
                  title="Aparecer en resultados de búsqueda"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">
                  Solo parejas verificadas
                </span>
                <input
                  type="checkbox"
                  className="rounded bg-white/20 border-white/30"
                  title="Solo mostrar parejas verificadas"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfileCouple;

