import React from "react";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: string;
  birthDate: string;
  gender: string;
  interestedIn: string;
  bio: string;
  role: string;
  accountType: string;
  phone: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerNickname: string;
  partnerAge: string;
  partnerBirthDate: string;
  partnerGender: string;
  partnerInterestedIn: string;
  partnerBio: string;
  location: string;
  acceptTerms: boolean;
  shareLocation: boolean;
  selectedInterests: string[];
  preferredTheme: string;
  profileTheme: string;
}

interface RegisterFormProps {
  formData: FormData;
  handleInputChange: (field: string, value: string | boolean | string[]) => void;
  handleSignUp: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  handleInputChange,
  handleSignUp,
  isLoading,
}) => {
  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {/* Tipo de cuenta */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={formData.accountType === "single" ? "default" : "outline"}
          onClick={() => handleInputChange("accountType", "single")}
          className={`${
            formData.accountType === "single"
              ? "bg-linear-to-r from-purple-600 to-blue-600 text-white"
              : "bg-white/10 border-white/20 text-white/70 hover:text-white"
          }`}
        >
          Soltero/a
        </Button>
        <Button
          type="button"
          variant={formData.accountType === "couple" ? "default" : "outline"}
          onClick={() => handleInputChange("accountType", "couple")}
          className={`${
            formData.accountType === "couple"
              ? "bg-linear-to-r from-purple-600 to-blue-600 text-white"
              : "bg-white/10 border-white/20 text-white/70 hover:text-white"
          }`}
        >
          Pareja
        </Button>
      </div>

      {/* Información personal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-white font-medium">
            Nombre
          </Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            required
            placeholder="Tu nombre"
            className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-white font-medium">
            Apellido
          </Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            required
            placeholder="Tu apellido"
            className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname" className="text-white font-medium">
          Apodo
        </Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          value={formData.nickname}
          onChange={(e) => handleInputChange("nickname", e.target.value)}
          required
          placeholder="Tu apodo"
          className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="age" className="text-white font-medium">
            Edad
          </Label>
          <Input
            id="age"
            name="age"
            type="number"
            value={formData.age}
            onChange={(e) => handleInputChange("age", e.target.value)}
            required
            min="18"
            placeholder="18+"
            className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-white font-medium">
            Género
          </Label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            required
            className="w-full h-10 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          >
            <option value="">Seleccionar</option>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interestedIn" className="text-white font-medium">
          Interesado en
        </Label>
        <select
          id="interestedIn"
          name="interestedIn"
          value={formData.interestedIn}
          onChange={(e) => handleInputChange("interestedIn", e.target.value)}
          required
          className="w-full h-10 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
        >
          <option value="">Seleccionar</option>
          <option value="male">Hombres</option>
          <option value="female">Mujeres</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-white font-medium">
          Biografía
        </Label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange("bio", e.target.value)}
          required
          placeholder="Cuéntanos sobre ti..."
          rows={3}
          className="w-full px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
        />
      </div>

      {/* Información de pareja (solo si es pareja) */}
      {formData.accountType === "couple" && (
        <>
          <div className="border-t border-white/20 pt-4">
            <h3 className="text-white font-semibold mb-3">Información de tu pareja</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="partnerFirstName" className="text-white font-medium">
                  Nombre
                </Label>
                <Input
                  id="partnerFirstName"
                  name="partnerFirstName"
                  type="text"
                  value={formData.partnerFirstName}
                  onChange={(e) => handleInputChange("partnerFirstName", e.target.value)}
                  required
                  placeholder="Nombre"
                  className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnerLastName" className="text-white font-medium">
                  Apellido
                </Label>
                <Input
                  id="partnerLastName"
                  name="partnerLastName"
                  type="text"
                  value={formData.partnerLastName}
                  onChange={(e) => handleInputChange("partnerLastName", e.target.value)}
                  required
                  placeholder="Apellido"
                  className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="partnerNickname" className="text-white font-medium">
                Apodo
              </Label>
              <Input
                id="partnerNickname"
                name="partnerNickname"
                type="text"
                value={formData.partnerNickname}
                onChange={(e) => handleInputChange("partnerNickname", e.target.value)}
                required
                placeholder="Apodo"
                className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="partnerAge" className="text-white font-medium">
                  Edad
                </Label>
                <Input
                  id="partnerAge"
                  name="partnerAge"
                  type="number"
                  value={formData.partnerAge}
                  onChange={(e) => handleInputChange("partnerAge", e.target.value)}
                  required
                  min="18"
                  placeholder="18+"
                  className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnerGender" className="text-white font-medium">
                  Género
                </Label>
                <select
                  id="partnerGender"
                  name="partnerGender"
                  value={formData.partnerGender}
                  onChange={(e) => handleInputChange("partnerGender", e.target.value)}
                  required
                  className="w-full h-10 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                >
                  <option value="">Seleccionar</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="partnerInterestedIn" className="text-white font-medium">
                Interesado en
              </Label>
              <select
                id="partnerInterestedIn"
                name="partnerInterestedIn"
                value={formData.partnerInterestedIn}
                onChange={(e) => handleInputChange("partnerInterestedIn", e.target.value)}
                required
                className="w-full h-10 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
              >
                <option value="">Seleccionar</option>
                <option value="male">Hombres</option>
                <option value="female">Mujeres</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div className="space-y-2 mt-3">
              <Label htmlFor="partnerBio" className="text-white font-medium">
                Biografía
              </Label>
              <textarea
                id="partnerBio"
                name="partnerBio"
                value={formData.partnerBio}
                onChange={(e) => handleInputChange("partnerBio", e.target.value)}
                required
                placeholder="Cuéntanos sobre tu pareja..."
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
              />
            </div>
          </div>
        </>
      )}

      {/* Credenciales */}
      <div className="border-t border-white/20 pt-4">
        <h3 className="text-white font-semibold mb-3">Credenciales</h3>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white font-medium">
            Correo electrónico
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
            placeholder="tu@email.com"
            className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white font-medium">
            Contraseña
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            required
            minLength={6}
            placeholder="Tu contraseña"
            className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
          />
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="flex items-start space-x-2">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) => handleInputChange("acceptTerms", e.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
        />
        <Label htmlFor="acceptTerms" className="text-white/90 text-sm">
          Acepto los términos y condiciones y la política de privacidad
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:scale-105"
        disabled={isLoading}
        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
      >
        {isLoading ? "Registrando..." : "Registrarse"}
      </Button>
    </form>
  );
};

export default RegisterForm;
