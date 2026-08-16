import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { PlusPurchaseModal } from "./components/PlusPurchaseModal";
import { subscriptionService } from "./subscription/MockSubscriptionService";
import { PlusFeature } from "./types";

type PlusContextValue = {
  isPlusUser: boolean;
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
  const [isPlusUser, setIsPlusUser] = useState(false);
  const [modalFeature, setModalFeature] = useState<PlusFeature | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // TODO: gerçek backend/store bağlandığında bu ilk senkronizasyon
    // GET /subscription'a dönüşecek.
    subscriptionService.getCurrentSubscription().then((status) => {
      setIsPlusUser(status.membership === "PLUS");
    });
  }, []);

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
      openPlusModal,
      closePlusModal,
      setPlusUser: setIsPlusUser,
    }),
    [isPlusUser, openPlusModal, closePlusModal],
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
