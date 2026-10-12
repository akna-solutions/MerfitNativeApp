import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { getMySubscription } from "../../services/api/subscription";
import { MySubscriptionResponse } from "../../services/api/types";
import { useAuth } from "../auth/AuthContext";
import { PlusPurchaseModal } from "./components/PlusPurchaseModal";
import { PlusFeature } from "./types";

type PlusContextValue = {
  isPlusUser: boolean;
  /** GET /api/subscription yaniti; henuz yuklenmediyse veya alinamadiysa null. */
  subscription: MySubscriptionResponse | null;
  /** Abonelik bilgisini backend'den yeniden ceker; basarisiz olursa hata firlatir. */
  reloadSubscription: () => Promise<void>;
  openPlusModal: (feature?: PlusFeature) => void;
  closePlusModal: () => void;
  /** Dev/test helper - gerçek uygulamada sadece purchase/restore sonrası set edilir. */
  setPlusUser: (value: boolean) => void;
};

const PlusContext = createContext<PlusContextValue | null>(null);

/**
 * Her ekran kendi Plus modal state'ini yönetmez - tek instance burada,
 * app kökünde (_layout.tsx) render edilir. Herhangi bir ekran
 * usePlus().openPlusModal('FEATURE_KEY') çağırarak açabilir.
 */
export function PlusProvider({ children }: { children: ReactNode }) {
  const { status, sessionVersion } = useAuth();
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [subscription, setSubscription] = useState<MySubscriptionResponse | null>(null);
  const [modalFeature, setModalFeature] = useState<PlusFeature | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const reloadSubscription = useCallback(async () => {
    const response = await getMySubscription();
    setSubscription(response);
    setIsPlusUser(response.isPlus);
  }, []);

  // Plus uyeligi backend'deki Subscription kaydindan gelir; her oturumda yeniden okunur.
  useEffect(() => {
    setSubscription(null);
    setIsPlusUser(false);
    if (status !== "signedIn") return;
    reloadSubscription().catch(() => {
      // Alinamazsa kullanici ucretsiz plan gibi gorur; Aboneligi Yonet ekrani tekrar dener.
    });
  }, [status, sessionVersion, reloadSubscription]);

  const openPlusModal = useCallback((feature?: PlusFeature) => {
    setModalFeature(feature ?? null);
    setModalVisible(true);
  }, []);

  const closePlusModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const value = useMemo<PlusContextValue>(
    () => ({
      isPlusUser,
      subscription,
      reloadSubscription,
      openPlusModal,
      closePlusModal,
      setPlusUser: setIsPlusUser,
    }),
    [isPlusUser, subscription, reloadSubscription, openPlusModal, closePlusModal],
  );

  return (
    <PlusContext.Provider value={value}>
      {children}
      <PlusPurchaseModal
        visible={modalVisible}
        feature={modalFeature}
        onClose={closePlusModal}
        onPurchased={() => {
          setIsPlusUser(true);
          setModalVisible(false);
        }}
      />
    </PlusContext.Provider>
  );
}

export function usePlus() {
  const ctx = useContext(PlusContext);
  if (!ctx) {
    throw new Error("usePlus() must be used within a <PlusProvider>");
  }
  return ctx;
}
