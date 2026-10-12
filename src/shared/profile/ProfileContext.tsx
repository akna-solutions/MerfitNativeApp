import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../../services/api/client";
import * as profileApi from "../../services/api/profile";
import { ProfileResponse, UpdateProfileRequest as ApiUpdateProfileRequest } from "../../services/api/types";
import { EMPTY_PROFILE_DATA } from "./mockData";
import { ProfileData, TrainingLocation, Weekday, WEEKDAYS } from "./types";

type ProfileContextValue = {
  profile: ProfileData;
  updateProfile: (patch: Partial<ProfileData>) => void;
  /** GET /api/profile su an calisiyor mu. */
  isLoading: boolean;
  /** Bu oturumda profil en az bir kez basariyla yuklendi mi. false iken `profile` bos veridir. */
  isLoaded: boolean;
  /** Son yukleme hatasi (kullaniciya gosterilecek metin), yoksa null. */
  error: string | null;
  /** Profili sunucudan yeniden yukler (orn. Profil sekmesine her donuste). */
  reload: () => void;
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
    trainingLocation: (response.trainingLocation ?? null) as TrainingLocation | null,
    workoutDurationMin: response.workoutDurationMin,
    trainingDaysPerWeek: response.trainingDaysPerWeek ?? 0,
    trainingDays: (response.trainingDays ?? []).filter((day): day is Weekday =>
      WEEKDAYS.includes(day as Weekday),
    ),
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
  const [, month, day] = currentDateOfBirth ? currentDateOfBirth.split("-") : [];
  const mm = month || "01";
  const dd = day || "01";
  return `${currentYear - age}-${mm}-${dd}`;
}

function mapPatchToApiRequest(patch: Partial<ProfileData>, current: ProfileData): ApiUpdateProfileRequest {
  // equipment backend'de antrenman yerinden turetilen salt okunur bir alandir; geri gonderilmez.
  // trainingDays kullanicinin sectigi gunlerdir; backend haftalik gun sayisini bu listeden turetir.
  const { age, equipment: _equipment, ...rest } = patch;
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
  const { status, sessionVersion, forceSignOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Yalnizca en son baslatilan istegin sonucu state'e yazilir (oturum degisimi / hizli yeniden
  // yukleme sirasinda eski bir yanitin yeni kullanicinin profilini ezmemesi icin).
  const requestIdRef = useRef(0);
  // Devam eden PUT sayisi. Kaydet + geri don akisinda sekmeye donus reload'u PUT'tan once
  // eski veriyi getirip kaydedilen degeri ezmesin diye, PUT bitene kadar reload atlanir
  // (PUT yaniti zaten guncel profili dondurur).
  const pendingWritesRef = useRef(0);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    profileApi
      .getProfile()
      .then((response) => {
        if (requestId !== requestIdRef.current) return;
        setProfile(mapToProfileData(response));
        setIsLoaded(true);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        if (err instanceof ApiError && err.isUnauthorized) {
          // Token suresi dolmus/gecersiz: client.ts token'lari temizledi; oturumu da kapat ki
          // kullanici tekrar giris yapinca profil yeniden yuklensin.
          forceSignOut();
          return;
        }
        console.warn("Profil yuklenemedi:", err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Profil bilgilerin yüklenemedi. Lütfen tekrar dene.",
        );
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
  }, [forceSignOut]);

  useEffect(() => {
    // Her oturum degisiminde (login/register/logout) onceki kullanicinin profili hemen silinir;
    // yeni oturumun gercek profili gelene kadar ekranlar yukleniyor durumunu gosterir.
    requestIdRef.current++;
    setProfile(EMPTY_PROFILE_DATA);
    setIsLoaded(false);
    setError(null);
    setIsLoading(false);

    if (status !== "signedIn") return;
    load();
  }, [status, sessionVersion, load]);

  const reload = useCallback(() => {
    if (status !== "signedIn" || pendingWritesRef.current > 0) return;
    load();
  }, [status, load]);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const updateProfile = useCallback((patch: Partial<ProfileData>) => {
    const prev = profileRef.current;
    const next = { ...prev, ...patch };
    profileRef.current = next;
    setProfile(next);

    const requestId = requestIdRef.current;
    pendingWritesRef.current++;
    profileApi
      .updateProfile(mapPatchToApiRequest(patch, prev))
      .then((response) => {
        // Sunucunun hesapladigi alanlar (yas, ekipman kategorisi, ...) icin yaniti esas al;
        // arada oturum degistiyse veya profil yeniden yuklendiyse eski yaniti yok say.
        if (requestId === requestIdRef.current) setProfile(mapToProfileData(response));
      })
      .catch((err) => {
        console.warn("Profil kaydedilemedi:", err);
        if (requestId === requestIdRef.current) {
          setError("Değişikliklerin kaydedilemedi. Lütfen tekrar dene.");
        }
      })
      .finally(() => {
        pendingWritesRef.current--;
      });
  }, []);

  const value = useMemo(
    () => ({ profile, updateProfile, isLoading, isLoaded, error, reload }),
    [profile, updateProfile, isLoading, isLoaded, error, reload],
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
