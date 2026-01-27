import { Capacitor } from "@capacitor/core";
import { SSLCertificateChecker } from "capacitor-ssl-pinning";

type PinnedHostConfig = {
  host: string;
  fingerprintSha256: string;
};

type PinningConfig = {
  hosts: PinnedHostConfig[];
  enforceHttpsInProd: boolean;
  enforceHostAllowlistInProd: boolean;
};

const DEFAULT_PINNING_CONFIG: PinningConfig = {
  hosts: [],
  enforceHttpsInProd: true,
  enforceHostAllowlistInProd: true,
};

function normalizeFingerprint(fingerprint: string): string {
  return fingerprint.replace(/:/g, "").trim().toLowerCase();
}

function getPinningConfigFromEnv(): PinningConfig {
  const rawHosts = import.meta.env.VITE_PINNED_CERT_HOSTS;
  const rawFingerprints = import.meta.env.VITE_PINNED_CERT_FINGERPRINTS;

  const enforceHttpsInProd = import.meta.env.VITE_ENFORCE_HTTPS_IN_PROD !== "false";
  const enforceHostAllowlistInProd = import.meta.env.VITE_ENFORCE_HOST_ALLOWLIST_IN_PROD !== "false";

  if (!rawHosts || !rawFingerprints) {
    return {
      ...DEFAULT_PINNING_CONFIG,
      enforceHttpsInProd,
      enforceHostAllowlistInProd,
    };
  }

  const hosts = rawHosts
    .split(",")
    .map((v: string) => v.trim())
    .filter((v: string) => v.length > 0);

  const fingerprints = rawFingerprints
    .split(",")
    .map((v: string) => v.trim())
    .filter((v: string) => v.length > 0);

  const paired: PinnedHostConfig[] = hosts
    .map((host: string, idx: number) => {
      const fp = fingerprints[idx];
      if (!fp) return undefined;
      return {
        host,
        fingerprintSha256: fp,
      };
    })
    .filter((v: PinnedHostConfig | undefined): v is PinnedHostConfig => Boolean(v));

  return {
    hosts: paired,
    enforceHttpsInProd,
    enforceHostAllowlistInProd,
  };
}

export class CertificatePinning {
  private static readonly cache = new Map<string, boolean>();

  static async validateRequestUrl(url: string): Promise<void> {
    const config = getPinningConfigFromEnv();

    const parsed = new URL(url);

    if (import.meta.env.PROD && config.enforceHttpsInProd && parsed.protocol !== "https:") {
      throw new Error("Blocked non-HTTPS request in production");
    }

    if (import.meta.env.PROD && config.enforceHostAllowlistInProd && config.hosts.length > 0) {
      const allowed = config.hosts.some((h) => h.host === parsed.hostname);
      if (!allowed) {
        throw new Error("Blocked request to non-allowlisted host");
      }
    }

    const pinned = config.hosts.find((h) => h.host === parsed.hostname);

    if (!pinned) {
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const cacheKey = `${parsed.hostname}:${normalizeFingerprint(pinned.fingerprintSha256)}`;
    const cached = this.cache.get(cacheKey);
    if (cached === true) return;

    const res = await SSLCertificateChecker.checkCertificate({
      url: `${parsed.protocol}//${parsed.hostname}`,
      fingerprint: pinned.fingerprintSha256,
    });

    const matched = res.fingerprintMatched === true;
    this.cache.set(cacheKey, matched);

    if (!matched) {
      throw new Error("Certificate pinning validation failed");
    }
  }
}
