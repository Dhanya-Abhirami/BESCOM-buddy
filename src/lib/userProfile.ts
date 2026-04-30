export type UserProfile = {
  name: string;
  phone: string;
  address: string;
  location: string;
  nearestStation: string;
  agentId: string;
  bescomNumber: string;
  bescomHoldFingerprint: string;     // base64-encoded Uint32Array
  bescomHoldDurationSec: number;     // metadata only
};

const STORAGE_KEY = "bescom-agent-profile-v1";

export const defaultProfile: UserProfile = {
  name: "",
  phone: "",
  address: "",
  location: "",
  nearestStation: "",
  agentId: "",
  bescomNumber: "",
  bescomHoldFingerprint: "",
  bescomHoldDurationSec: 0,
};

export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
