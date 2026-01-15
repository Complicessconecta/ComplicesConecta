import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/forms/PhoneInput";

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
    <form onSubmit={handleSignUp} autoComplete="off" className="space-y-4">
      {/* Tipo de Cuenta */}
      <div className="space-y-2">
        <Label className="text-white font-medium">
          Tipo de Cuenta
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={
              formData.accountType === "single"
                ? "default"
                : "outline"
            }
            onClick={() =>
              handleInputChange("accountType", "single")
            }
            className={`text-sm font-semibold ${formData.accountType === "single" ? "bg-purple-600 text-white shadow-lg" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}`}
          >
            👤 Soltero/a
          </Button>
          <Button
            type="button"
            variant={
              formData.accountType === "couple"
                ? "default"
                : "outline"
            }
            onClick={() =>
              handleInputChange("accountType", "couple")
            }
            className={`text-sm font-semibold ${formData.accountType === "couple" ? "bg-purple-600 text-white shadow-lg" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}`}
          >
            💑 Pareja
          </Button>
        </div>
      </div>

      {/* Información Básica */}
      <div className="space-y-2">
        <Label
          htmlFor="firstName"
          className="text-white font-medium"
        >
          Nombre
        </Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) =>
            handleInputChange("firstName", e.target.value)
          }
          required
          placeholder="Tu nombre"
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="lastName"
          className="text-white font-medium"
        >
          Apellido
        </Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) =>
            handleInputChange("lastName", e.target.value)
          }
          required
          placeholder="Tu apellido"
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="nickname"
          className="text-white font-medium"
        >
          Nombre de Usuario
        </Label>
        <Input
          id="nickname"
          value={formData.nickname}
          onChange={(e) =>
            handleInputChange("nickname", e.target.value)
          }
          required
          placeholder="Nombre público"
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age" className="text-white font-medium">
          Edad
        </Label>
        <Input
          id="age"
          type="number"
          min="18"
          max="99"
          value={formData.age}
          onChange={(e) => handleInputChange("age", e.target.value)}
          required
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      {/* Campo de teléfono con validación MX */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-white font-medium">
          Teléfono{" "}
          <span className="text-white/60 text-sm">(México)</span>
        </Label>
        <PhoneInput
          value={formData.phone}
          onChange={(value) => handleInputChange("phone", value)}
          placeholder="55 1234 5678"
          required
          showValidation={true}
          autoFormat={true}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender" className="text-white font-medium">
          Género
        </Label>
        <select
          id="gender"
          aria-label="Selecciona tu género"
          value={formData.gender}
          onChange={(e) =>
            handleInputChange("gender", e.target.value)
          }
          required
          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
        >
          <option value="" className="bg-purple-900 text-white">
            Selecciona tu género
          </option>
          <option value="male" className="bg-purple-900 text-white">
            Masculino
          </option>
          <option
            value="female"
            className="bg-purple-900 text-white"
          >
            Femenino
          </option>
          <option
            value="non-binary"
            className="bg-purple-900 text-white"
          >
            No binario
          </option>
          <option
            value="other"
            className="bg-purple-900 text-white"
          >
            Otro
          </option>
        </select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="interestedIn"
          className="text-white font-medium"
        >
          Interesado en
        </Label>
        <select
          id="interestedIn"
          aria-label="Selecciona en quién estás interesado"
          value={formData.interestedIn}
          onChange={(e) =>
            handleInputChange("interestedIn", e.target.value)
          }
          required
          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
        >
          <option value="" className="bg-purple-900 text-white">
            Selecciona tu interés
          </option>
          <option value="male" className="bg-purple-900 text-white">
            Hombres
          </option>
          <option
            value="female"
            className="bg-purple-900 text-white"
          >
            Mujeres
          </option>
          <option value="both" className="bg-purple-900 text-white">
            Ambos
          </option>
          <option
            value="couples"
            className="bg-purple-900 text-white"
          >
            Parejas
          </option>
        </select>
      </div>

      {/* Información de Pareja - Solo si es pareja */}
      {formData.accountType === "couple" && (
        <>
          <div className="border-t border-white/20 pt-4">
            <h4 className="text-white font-medium mb-4">
              Información de tu Pareja
            </h4>

            <div className="space-y-2">
              <Label
                htmlFor="partnerFirstName"
                className="text-white font-medium"
              >
                Nombre de tu Pareja
              </Label>
              <Input
                id="partnerFirstName"
                value={formData.partnerFirstName}
                onChange={(e) =>
                  handleInputChange(
                    "partnerFirstName",
                    e.target.value,
                  )
                }
                required
                placeholder="Nombre de tu pareja"
                className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="partnerLastName"
                className="text-white font-medium"
              >
                Apellido de tu Pareja
              </Label>
              <Input
                id="partnerLastName"
                value={formData.partnerLastName}
                onChange={(e) =>
                  handleInputChange(
                    "partnerLastName",
                    e.target.value,
                  )
                }
                required
                placeholder="Apellido de tu pareja"
                className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="partnerNickname"
                className="text-white font-medium"
              >
                Nombre de Usuario de tu Pareja
              </Label>
              <Input
                id="partnerNickname"
                value={formData.partnerNickname}
                onChange={(e) =>
                  handleInputChange(
                    "partnerNickname",
                    e.target.value,
                  )
                }
                required
                placeholder="Nombre público de tu pareja"
                className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="partnerAge"
                className="text-white font-medium"
              >
                Edad de tu Pareja
              </Label>
              <Input
                id="partnerAge"
                type="number"
                min="18"
                max="99"
                value={formData.partnerAge}
                onChange={(e) =>
                  handleInputChange("partnerAge", e.target.value)
                }
                required
                className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="partnerGender"
                className="text-white font-medium"
              >
                Género de tu Pareja
              </Label>
              <select
                id="partnerGender"
                aria-label="Selecciona el género de tu pareja"
                value={formData.partnerGender}
                onChange={(e) =>
                  handleInputChange("partnerGender", e.target.value)
                }
                required
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
              >
                <option
                  value=""
                  className="bg-purple-900 text-white"
                >
                  Selecciona el género
                </option>
                <option
                  value="male"
                  className="bg-purple-900 text-white"
                >
                  Masculino
                </option>
                <option
                  value="female"
                  className="bg-purple-900 text-white"
                >
                  Femenino
                </option>
                <option
                  value="non-binary"
                  className="bg-purple-900 text-white"
                >
                  No binario
                </option>
                <option
                  value="other"
                  className="bg-purple-900 text-white"
                >
                  Otro
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="partnerInterestedIn"
                className="text-white font-medium"
              >
                Interesado en
              </Label>
              <select
                id="partnerInterestedIn"
                aria-label="Selecciona en quién está interesada tu pareja"
                value={formData.partnerInterestedIn}
                onChange={(e) =>
                  handleInputChange(
                    "partnerInterestedIn",
                    e.target.value,
                  )
                }
                required
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
              >
                <option
                  value=""
                  className="bg-purple-900 text-white"
                >
                  Selecciona el interés
                </option>
                <option
                  value="male"
                  className="bg-purple-900 text-white"
                >
                  Hombres
                </option>
                <option
                  value="female"
                  className="bg-purple-900 text-white"
                >
                  Mujeres
                </option>
                <option
                  value="both"
                  className="bg-purple-900 text-white"
                >
                  Ambos
                </option>
                <option
                  value="couples"
                  className="bg-purple-900 text-white"
                >
                  Parejas
                </option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Información Adicional */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white font-medium">
          Correo electrónico
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            handleInputChange("email", e.target.value)
          }
          required
          placeholder="tu@email.com"
          autoComplete="email"
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-white font-medium"
        >
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            handleInputChange("password", e.target.value)
          }
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-white font-medium">
          Biografía
        </Label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange("bio", e.target.value)}
          required
          rows={3}
          placeholder="Cuéntanos sobre ti..."
          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="location"
          className="text-white font-medium"
        >
          Ubicación
        </Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) =>
            handleInputChange("location", e.target.value)
          }
          required
          placeholder="Ciudad, Estado"
          className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
        />
      </div>

      {/* Términos y Condiciones */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            aria-label="Acepto los términos y condiciones"
            checked={formData.acceptTerms}
            onChange={(e) =>
              handleInputChange("acceptTerms", e.target.checked)
            }
            required
            className="rounded"
          />
          <Label
            htmlFor="acceptTerms"
            className="text-sm text-white/80"
          >
            Acepto los{" "}
            <Link
              to="/terms"
              className="text-purple-300 hover:underline"
            >
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link
              to="/privacy"
              className="text-purple-300 hover:underline"
            >
              Política de Privacidad
            </Link>
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="shareLocation"
            aria-label="Compartir mi ubicación"
            checked={formData.shareLocation}
            onChange={(e) =>
              handleInputChange("shareLocation", e.target.checked)
            }
            className="rounded"
          />
          <Label
            htmlFor="shareLocation"
            className="text-sm text-white/80"
          >
            Compartir mi ubicación para mejorar las coincidencias
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        disabled={isLoading}
        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
      >
        {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
      </Button>
    </form>
  );
};

export default RegisterForm;
