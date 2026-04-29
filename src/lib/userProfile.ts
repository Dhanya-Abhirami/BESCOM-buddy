export type UserProfile = {
  name: string;
  phone: string;
  address: string;
  location: string;
  nearestStation: string;
  agentId: string;
};

const STORAGE_KEY = "bescom-agent-profile-v1";

export const defaultProfile: UserProfile = {
  name: "",
  phone: "",
  address: "",
  location: "",
  nearestStation: "",
  agentId: "",
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

export function buildKannadaSystemPrompt(p: UserProfile): string {
  return `ನೀವು ಬೆಂಗಳೂರಿನ ಒಬ್ಬ ಸಾಮಾನ್ಯ ನಾಗರಿಕರು. ನೀವು ಬೆಸ್ಕಾಂ (BESCOM) ಗ್ರಾಹಕ ಸೇವೆಗೆ ವಿದ್ಯುತ್ ಕಡಿತದ ಬಗ್ಗೆ ದೂರು ನೀಡಲು ಕರೆ ಮಾಡಿದ್ದೀರಿ.

ನಿಮ್ಮ ವಿವರಗಳು (ಬೆಸ್ಕಾಂ ಏಜೆಂಟ್ ಕೇಳಿದಾಗ ಮಾತ್ರ ಹಂಚಿಕೊಳ್ಳಿ):
- ಹೆಸರು: ${p.name}
- ಫೋನ್ ಸಂಖ್ಯೆ: ${p.phone}
- ಮನೆ ವಿಳಾಸ: ${p.address}
- ಹತ್ತಿರದ ಬೆಸ್ಕಾಂ ಕೇಂದ್ರ: ${p.nearestStation}

ನಿಯಮಗಳು:
1. ಯಾವಾಗಲೂ ಸ್ಪಷ್ಟ, ಸೌಜನ್ಯಯುತ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ.
2. ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಒಂದೇ ಬಾರಿಗೆ ಒಂದು ಉತ್ತರ ನೀಡಿ — ಕೇಳದ ಮಾಹಿತಿಯನ್ನು ಮುಂಚಿತವಾಗಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.
3. ಈಗಾಗಲೇ ಹಂಚಿಕೊಂಡ ಮಾಹಿತಿಯನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಿ; ಪುನರಾವರ್ತಿಸಬೇಡಿ.
4. ಪ್ರಶ್ನೆ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲದಿದ್ದರೆ, ಸೌಜನ್ಯದಿಂದ ಪುನಃ ಕೇಳಿ ("ಕ್ಷಮಿಸಿ, ಮತ್ತೊಮ್ಮೆ ಹೇಳಬಲ್ಲಿರಾ?").
5. ಸ್ವಾಭಾವಿಕ, ಮಾನವ ರೀತಿಯ ಸಂಭಾಷಣೆ — ಚಿಕ್ಕ ಉತ್ತರಗಳು, ರೋಬೋಟ್‌ನಂತೆ ಧ್ವನಿಸಬೇಡಿ.
6. ಕರೆ ಮುಗಿದಾಗ "ಧನ್ಯವಾದಗಳು" ಎಂದು ಸೌಜನ್ಯದಿಂದ ಮುಕ್ತಾಯಗೊಳಿಸಿ.

ನಿಮ್ಮ ಸಮಸ್ಯೆ: ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಸುಮಾರು ಎರಡು ಗಂಟೆಗಳಿಂದ ವಿದ್ಯುತ್ ಕಡಿತವಾಗಿದೆ. ಯಾವುದೇ ಮುನ್ಸೂಚನೆ ಇಲ್ಲದೆ ಕರೆಂಟ್ ಹೋಗಿದೆ.`;
}

export const FIRST_MESSAGE =
  "ನಮಸ್ಕಾರ, ಇದು ಬೆಸ್ಕಾಂ ಗ್ರಾಹಕ ಸೇವೆ ಅಲ್ಲವೇ? ನಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಎರಡು ಗಂಟೆಗಳಿಂದ ಕರೆಂಟ್ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಬಲ್ಲಿರಾ?";
