import { memo } from "react";

import { BrandPattern } from "./BrandPattern";

/**
 * Marka ekranlarinin (acilis, MB Shop / MB Fit gecisi) zemini: duz marka siyahi uzerinde cok soluk,
 * birbirine bagli geometrik ikon deseni. Zemin rengini ust bilesen verir; burada isik ya da gradyan yoktur.
 */
export const BrandBackdrop = memo(function BrandBackdrop({ variant = "fit" }: { variant?: "fit" | "shop" }) {
  return <BrandPattern variant={variant} />;
});
