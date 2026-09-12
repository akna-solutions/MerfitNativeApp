import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "../auth/AuthContext";
import * as profileApi from "../../services/api/profile";
import { ProfileResponse, UpdateProfileRequest as ApiUpdateProfileRequest } from "../../services/api/types";
import { INITIAL_PROFILE_DATA } from "./mockData";
import { ProfileData } from "./types";

type ProfileContextValue = {
  profile: ProfileData;
  updateProfile: (patch: Partial<ProfileData>) => void;
  isLoading: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function mapToProfileData(response: ProfileResponse): ProfileData {
  return {
    firstName: response.firstName,
    lastName: response.lastName,
    username: response.username,
    email: response.email,
    dateOfBirth: response.dateOfBirth,
    gender: response.gender as ProfileData["gender"],
    age: response.age,
    height: response.height,
    weight: response.weight,
    targetWeight: response.targetWeight,
    goal: response.goal as ProfileData["goal"],
    experienceLevel: response.experienceLevel as ProfileData["experienceLevel"],
    equipment: response.equipment as ProfileData["equipment"],
    workoutDurationMin: response.workoutDurationMin,
    trainingDays: response.trainingDays as ProfileData["trainingDays"],
    unitSystem: response.unitSystem as ProfileData["unitSystem"],
    appearance: response.appearance as ProfileData["appearance"],
    notifications: response.notifications,
    privacy: response.privacy,
    stats: response.stats,
  };
}

/**
 * "age" alani UserProfile'da ayrica saklanmiyor - backend DateOfBirth'ten hesapliyor
 * (bkz. MerfitCustomerApi ProfileService). Kullanici sadece yasini degistirdiginde
 * (personal-information ekrani), mevcut dogum gunu/ayini koruyarak yaklasik bir
 * dateOfBirth turetiyoruz ki ekran degismeden calismaya devam etsin.
 */
function deriveDateOfBirthFromAge(age: number, currentDateOfBirth: string): string {
  const currentYear = new Date().getFullYear();
  const [, month, day] = currentDateOfBirth.split("-");
  const mm = month ?? "01";
  const dd = day ?? "01";
  return `${currentYear - age}-${mm}-${dd}`;
}

function mapPatchToApiRequest(patch: Partial<ProfileData>, current: ProfileData): ApiUpdateProfileRequest {
  const { age, ...rest } = patch;
  const request: ApiUpdateProfileRequest = { ...rest };

  if (age !== undefined && patch.dateOfBirth === undefined) {
    request.dateOfBirth = deriveDateOfBirthFromAge(age, current.dateOfBirth);
  }

  return request;
}

/**
 * Profile alt ekranları (Goals, Body Measurements, Notifications, Privacy, ...)
 * ayrı route'lar olduğu için state'in kendi component'lerinde değil,
 * app kökünde (bkz. _layout.tsx) tutulması gerekiyor - aksi halde bir
 * ayarı değiştirip geri dönünce kaybolurdu.
 *
 * Kullanıcı giriş yapınca gerçek profil GET /api/profile'dan yüklenir; updateProfile
 * çağrıları önce local state'i (optimistic) günceller, ardından PUT /api/profile'ı
 * arka planda tetikler - böylece çağıran ekranlar (updateProfile(patch); router.back())
 * hiç değişmeden aynı şekilde çalışmaya devam eder.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE_DATA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "signedIn") return;
    let isMounted = true;
    setIsLoading(true);
    profileApi
      .getProfile()
      .then((response) => {
        if (isMounted) setProfile(mapToProfileData(response));
      })
      .catch(() => {
        // Sessizce yut - ekranlar INITIAL_PROFILE_DATA ile calismaya devam eder,
        // kullanici bir sonraki ziyarette tekrar denenir.
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [status]);

  const updateProfile = useCallback((patch: Partial<ProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      profileApi.updateProfile(mapPatchToApiRequest(patch, prev)).catch(() => {
        // Sessizce yut - bir sonraki GET /api/profile'da gercek durum senkronize olur.
      });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ profile, updateProfile, isLoading }),
    [profile, updateProfile, isLoading],
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
