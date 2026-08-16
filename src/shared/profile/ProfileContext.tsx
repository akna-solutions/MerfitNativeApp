import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

import { INITIAL_PROFILE_DATA } from "./mockData";
import { ProfileData } from "./types";

type ProfileContextValue = {
  profile: ProfileData;
  updateProfile: (patch: Partial<ProfileData>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Profile alt ekranları (Goals, Body Measurements, Notifications, Privacy, ...)
 * ayrı route'lar olduğu için state'in kendi component'lerinde değil,
 * app kökünde (bkz. _layout.tsx) tutulması gerekiyor - aksi halde bir
 * ayarı değiştirip geri dönünce kaybolurdu.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE_DATA);

  const updateProfile = useCallback((patch: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({ profile, updateProfile }),
    [profile, updateProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile() must be used within a <ProfileProvider>");
  }
  return ctx;
}
