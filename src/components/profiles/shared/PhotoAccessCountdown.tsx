/**
 * Cuenta atrás EN VIVO (tick de 1 s, HH:MM:SS) del acceso concedido a
 * una galería (24 h desde la aceptación, TTL ANONYMOUS_PHOTO_ACCESS_TTL_MS
 * en friends.ts). Ronda 11, stream A (1f).
 *
 * Causa raíz del hallazgo (1f) del test de la ronda 10: la cuenta atrás
 * existía pero NO se veía en ninguna de las dos superficies que el test
 * miró:
 * - Perfil anónimo, pestaña "Ver Galería": el bloque ya calculaba los ms
 *   restantes, pero con formato "23 h 12 min" (cambia cada minuto) y un
 *   tick de 30 s — en un test corto parecía texto estático; y siendo el
 *   DUEÑO (viewer === owner) el helper devuelve null, así que siempre
 *   caía en el texto estático "1 acceso concedido expira a las 24 h".
 * - Perfil de pareja: ProfileCouple NUNCA sincronizaba el estado de la
 *   solicitud aceptada (`privateImageAccess` nacía en "none" y solo se
 *   ponía en "pending" al enviar), así que el acceso concedido no se
 *   reflejaba en la galería en absoluto.
 * Aquí el tick es de 1 s y el formato HH:MM:SS, que cambia cada segundo
 * y se ve tickear; el dueño ve la lista de accesos que él concedió.
 */
import { useEffect, useRef, useState } from "react";
import {
  formatRemainingHHMMSS,
  getAnonymousGalleryAccessRemainingMs,
} from "@/lib/anonymous";
import {
  listAnonymousPhotoAccessGrantedBy,
  listPhotoAccessGrantedTo,
} from "@/lib/friends";

/**
 * Reloj en vivo: parte de `remainingMs` y descuenta cada segundo desde
 * su propio `expiresAt` (sin depender de que el padre re-renderice).
 * Al llegar a cero llama `onExpire` una sola vez y muestra "expirado".
 */
export function LiveCountdown({
  remainingMs,
  onExpire,
  className,
}: {
  remainingMs: number;
  onExpire?: () => void;
  className?: string;
}) {
  const expiresAtRef = useRef<number>(Date.now() + Math.max(0, remainingMs));
  const [leftMs, setLeftMs] = useState<number>(remainingMs);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiresAtRef.current = Date.now() + Math.max(0, remainingMs);
    expiredRef.current = false;
    setLeftMs(remainingMs);
  }, [remainingMs]);

  useEffect(() => {
    if (remainingMs <= 0) return;
    const timer = window.setInterval(() => {
      const left = expiresAtRef.current - Date.now();
      setLeftMs(left);
      if (left <= 0) {
        window.clearInterval(timer);
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current?.();
        }
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingMs]);

  if (leftMs <= 0) {
    return (
      <span className={className} data-testid="live-countdown">
        expirado
      </span>
    );
  }
  return (
    <span className={className} data-testid="live-countdown">
      {formatRemainingHHMMSS(leftMs)}
    </span>
  );
}

/**
 * Cuenta atrás del acceso que ESTE espectador tiene concedido a la
 * galería del dueño. Null (nada que contar) si no hay acceso vigente:
 * el padre pasa `fallback` para el texto estático de "pide acceso".
 */
export function PhotoAccessCountdown({
  viewerId,
  ownerId,
  onExpire,
  fallback,
  className,
}: {
  viewerId: string;
  ownerId: string;
  onExpire?: () => void;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const remainingMs =
    viewerId && ownerId
      ? getAnonymousGalleryAccessRemainingMs(viewerId, ownerId, nowMs)
      : null;
  if (remainingMs === null) {
    return <>{fallback ?? null}</>;
  }
  return (
    <p className={className}>
      Acceso a la galería concedido:{" "}
      <span className="font-semibold">
        <LiveCountdown
          remainingMs={remainingMs}
          onExpire={() => {
            // Al expirar, re-calcular: el acceso ya no es vigente y el
            // bloque vuelve al aviso de pedir acceso.
            setNowMs(Date.now());
            onExpire?.();
          }}
        />
      </span>{" "}
      · expira a las 24 h de concedido
    </p>
  );
}

/**
 * Lista de accesos a SU galería limitada que el dueño ya concedió y
 * siguen vigentes, cada uno con su cuenta atrás en vivo. Null si no
 * hay ninguno. Espejo del bloque del perfil propio del anónimo en
 * ProfileSingle, reutilizable en la galería de la pareja.
 */
export function GrantedGalleryAccessList({
  ownerId,
  className,
}: {
  ownerId: string;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const granted = ownerId
    ? listAnonymousPhotoAccessGrantedBy(ownerId, nowMs)
    : [];
  useEffect(() => {
    if (!ownerId) return;
    // Releer la lista cada 30 s para que los expirados desaparezcan
    // solos; cada fila tickea cada segundo por su cuenta.
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [ownerId]);
  if (granted.length === 0) return null;
  return (
    <div className={className}>
      <p className="font-semibold">Acceso a tu galería limitada</p>
      <ul className="mt-1 space-y-1">
        {granted.map((access) => (
          <li key={access.viewerId}>
            {access.viewerName} ·{" "}
            <span className="font-semibold">
              <LiveCountdown
                remainingMs={access.remainingMs}
                onExpire={() => setNowMs(Date.now())}
              />
            </span>{" "}
            · expira a las 24 h de concedido
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ronda 12 (stream A, punto 3a): accesos a OTRAS galerías que ESTE
 * espectador tiene concedidos y siguen vigentes, cada uno con su
 * cuenta atrás en vivo. Es lo que faltaba en la propia pestaña "Ver
 * Galería" del anónimo: el acceso que LE concedieron (p. ej. la
 * pareja le aceptó ver sus fotos) no vive en su galería — la lista de
 * accesos que ÉL concedió (GrantedGalleryAccessList) estaba vacía y
 * la pestaña no mostraba ninguna cuenta atrás, solo título,
 * descripción y "Subir Imagen". Null si no tiene ningún acceso.
 */
export function MyGrantedGalleryAccessList({
  viewerId,
  className,
}: {
  viewerId: string;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const held = viewerId ? listPhotoAccessGrantedTo(viewerId, nowMs) : [];
  useEffect(() => {
    if (!viewerId) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [viewerId]);
  if (held.length === 0) return null;
  return (
    <div className={className}>
      <p className="font-semibold">Accesos que te concedieron</p>
      <ul className="mt-1 space-y-1">
        {held.map((access) => (
          <li key={access.ownerId}>
            {access.ownerName} ·{" "}
            <span className="font-semibold">
              <LiveCountdown
                remainingMs={access.remainingMs}
                onExpire={() => setNowMs(Date.now())}
              />
            </span>{" "}
            · expira a las 24 h de concedido
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ronda 12 (stream A, punto 3a): el estado completo de la galería
 * limitada del anónimo en su propia pestaña "Ver Galería": los
 * accesos que ÉL concedió + los accesos que LE concedieron, cada uno
 * con su cuenta atrás en vivo. Sin ningún acceso vigente, una línea
 * explícita (no un hueco vacío): sin ella no se distingue "sin
 * accesos" de "la cuenta atrás no carga".
 */
export function AnonymousOwnGalleryAccess({
  ownerId,
  viewerId,
  className,
}: {
  ownerId: string;
  viewerId: string;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const grantedByMe = ownerId
    ? listAnonymousPhotoAccessGrantedBy(ownerId, nowMs)
    : [];
  const grantedToMe = viewerId ? listPhotoAccessGrantedTo(viewerId, nowMs) : [];
  if (grantedByMe.length === 0 && grantedToMe.length === 0) {
    return (
      <p className={className}>
        Aún no hay accesos a la galería concedidos: cuando aceptes una solicitud
        o te concedan acceso a otra galería, la cuenta atrás de 24 h aparecerá
        aquí.
      </p>
    );
  }
  return (
    <div className={className}>
      {grantedByMe.length > 0 && <GrantedGalleryAccessList ownerId={ownerId} />}
      {grantedToMe.length > 0 && (
        <MyGrantedGalleryAccessList viewerId={viewerId} />
      )}
    </div>
  );
}
