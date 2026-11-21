import Svg, { Path, Rect } from "react-native-svg";

import { aspectOf, BRAND_BLUE, BRAND_WHITE, BrandShape, MONOGRAM, WORDMARK, WORDMARK_SHOP } from "./brandMark";

type Props = {
  /** Genislik (dp); yukseklik orana gore hesaplanir. */
  width: number;
  /** Harflerin rengi: koyu zeminde beyaz (varsayilan), acik zeminde koyu. */
  color?: string;
  /** Vurgu cizgisinin rengi; varsayilan marka mavisi. */
  accent?: string;
  testID?: string;
};

function BrandShapeSvg({ shape, width, color = BRAND_WHITE, accent = BRAND_BLUE, testID }: Props & { shape: BrandShape }) {
  const [x, y, w, h] = shape.viewBox;
  return (
    <Svg
      testID={testID}
      width={width}
      height={width * aspectOf(shape)}
      viewBox={`${x} ${y} ${w} ${h}`}
      accessibilityRole="image"
      accessibilityLabel="MB Fit"
    >
      {shape.paths.map((d) => (
        <Path key={d.slice(0, 24)} d={d} fill={color} />
      ))}
      <Rect {...shape.bar} fill={accent} />
    </Svg>
  );
}

/** "MB | FIT" yazi logosu (kalin MB, ince mavi ayirac, hafif FIT); `variant="shop"` ile "MB | SHOP". */
export function BrandWordmark({ variant = "fit", ...props }: Props & { variant?: "fit" | "shop" }) {
  return <BrandShapeSvg shape={variant === "shop" ? WORDMARK_SHOP : WORDMARK} {...props} />;
}

/** Uygulama ikonundaki "MB" monogrami (altinda kisa mavi cizgi). */
export function BrandMonogram(props: Props) {
  return <BrandShapeSvg shape={MONOGRAM} {...props} />;
}
