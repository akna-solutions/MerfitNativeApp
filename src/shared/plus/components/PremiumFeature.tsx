import { ReactNode } from "react";

type Props = {
  feature: string;
  children: ReactNode;
  borderRadius?: number;
};

/**
 * Premium kilidi kaldırıldı - artık tüm özellikler herkese açık.
 * Component, çağıran ekranları değiştirmemek için passthrough olarak bırakıldı.
 */
export function PremiumFeature({ children }: Props) {
  return <>{children}</>;
}
