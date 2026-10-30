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
import { ApiError, isApiError } from "../../services/api/client";
import { isLowBodyFatConfirmationError } from "../bodyComposition/bodyFat";
import * as profileApi from "../../services/api/profile";
import {
    FitnessProfileRequest,
    ProfileResponse,
    UpdateProfileRequest as ApiUpdateProfileRequest,
} from "../../services/api/types";
import { EMPTY_PROFILE_DATA } from "./mockData";
import { Goal, ProfileData, TrainingLocation, Weekday, WEEKDAYS } from "./types";

/** Hedef degisikliginin sonucu. */
export type ChangeGoalResult =
  | { status: "saved" }
  /** Sunucu dusuk yag orani uyarisinin acikca onaylanmasini istiyor; hedef kaydedilmedi. */
  | { status: "confirmationRequired"; message: string }
  | { status: "error"; message: string };

type ProfileContextValue = {
  profile: ProfileData;
  updateProfile: (patch: Partial<ProfileData>) => void;
  /**
   * Hedefi kaydeder. Iyimser guncelleme yapilmaz: sunucu dusuk yag orani onayi isteyebilir ve hedef
   * kullanici acikca onaylamadan degismemelidir.
   */
  changeGoal: (goal: Goal, options?: { confirmLowBodyFatWarning?: boolean }) => Promise<ChangeGoalResult>;
  /**
   * Yalnizca alisveris icin kayit olmus kullanicinin fitness profilini tamamlar (POST /api/profile/fitness) ve
   * yanittaki profili uygular. Hatalari (dusuk yag orani onayi, dogrulama) cagirana firlatir.
   */
  completeFitnessProfile: (request: FitnessProfileRequest) => Promise<void>;
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
    emailConfirmed: response.emailConfirmed,
    // Alani gondermeyen (eski) backend'de herkes tamamlanmis sayilir; MB Fit ekranlari kilitlenmez.
    fitnessProfileCompleted: response.fitnessProfileCompleted ?? true,
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
  const today = new Date();
  const [, month, day] = currentDateOfBirth ? currentDateOfBirth.split("-") : [];
  const mm = month || "01";
  const dd = day || "01";
  // Dogum gunu bu yil henuz gelmediyse bir yil once dogmus olmali; aksi halde backend
  // girilen yastan bir eksik hesaplar (orn. 27 yazilir, profilde 26 gorunur).
  const birthdayPassed =
    today.getMonth() + 1 > Number(mm) ||
    (today.getMonth() + 1 === Number(mm) && today.getDate() >= Number(dd));
  const year = today.getFullYear() - age - (birthdayPassed ? 0 : 1);
  // 29 Subat artik olmayan bir yila dusmesin (backend gecersiz tarihi yok sayar).
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const safeDay = mm === "02" && dd === "29" && !isLeap ? "28" : dd;
  return `${year}-${mm}-${safeDay}`;
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

  const changeGoal = useCallback(
    async (goal: Goal, options?: { confirmLowBodyFatWarning?: boolean }): Promise<ChangeGoalResult> => {
      const requestId = requestIdRef.current;
      pendingWritesRef.current++;
      try {
        const response = await profileApi.updateProfile({
          goal,
          ...(options?.confirmLowBodyFatWarning ? { confirmLowBodyFatWarning: true } : {}),
        });
        if (requestId === requestIdRef.current) {
          const next = mapToProfileData(response);
          profileRef.current = next;
          setProfile(next);
        }
        return { status: "saved" };
      } catch (err) {
        if (isLowBodyFatConfirmationError(err)) {
          return { status: "confirmationRequired", message: (err as ApiError).message };
        }
        console.warn("Hedef kaydedilemedi:", err);
        return {
          status: "error",
          message: isApiError(err) && err.message ? err.message : "Hedefin kaydedilemedi. Lütfen tekrar dene.",
        };
      } finally {
        pendingWritesRef.current--;
      }
    },
    [],
  );

  const completeFitnessProfile = useCallback(async (request: FitnessProfileRequest) => {
    const requestId = requestIdRef.current;
    pendingWritesRef.current++;
    try {
      const response = await profileApi.completeFitnessProfile(request);
      if (requestId === requestIdRef.current) {
        const next = mapToProfileData(response);
        profileRef.current = next;
        setProfile(next);
        setIsLoaded(true);
      }
    } finally {
      pendingWritesRef.current--;
    }
  }, []);

  const value = useMemo(
    () => ({ profile, updateProfile, changeGoal, completeFitnessProfile, isLoading, isLoaded, error, reload }),
    [profile, updateProfile, changeGoal, completeFitnessProfile, isLoading, isLoaded, error, reload],
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
