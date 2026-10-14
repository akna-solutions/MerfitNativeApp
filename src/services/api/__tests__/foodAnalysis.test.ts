import { installFormDataPatch } from "expo/src/winter/FormData";

import { apiRequest } from "../client";
import { analyzeFoodPhoto } from "../foodAnalysis";

jest.mock("../client", () => ({ apiRequest: jest.fn() }));
jest.mock("expo-file-system", () => ({
  // expo-file-system File'inin Blob arayuzu: expo/fetch dosya parcasini bytes() ile okur.
  File: class {
    readonly uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get name() {
      return this.uri.split("/").pop() ?? "";
    }
    get type() {
      return "image/jpeg";
    }
    async bytes() {
      return new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    }
  },
}));

const requestMock = apiRequest as jest.MockedFunction<typeof apiRequest>;

// Cihazdaki global FormData: React Native FormData + Expo yamasi (expo/src/winter/runtime.native.ts).
// Jest'te Node'un FormData'si olur; cihaz davranisini sinamak icin ayni yamali sinif kullanilir.
const NodeFormData = globalThis.FormData;
beforeAll(() => {
  const RNFormData = jest.requireActual("react-native/Libraries/Network/FormData").default;
  installFormDataPatch(RNFormData);
  globalThis.FormData = RNFormData;
});
afterAll(() => {
  globalThis.FormData = NodeFormData;
});

type Part = [string, unknown];
const partsOf = (form: FormData) => (form as unknown as { _parts: Part[] })._parts;

/**
 * expo/fetch (SDK 57 global fetch) dosya parcasini yalnizca Blob ya da bytes() saglayan nesne olarak kabul eder;
 * React Native'in { uri, name, type } nesnesinde "Unsupported FormDataPart implementation" hatasi verir
 * (node_modules/expo/src/winter/fetch/convertFormData.ts).
 */
const isAcceptedByExpoFetch = (part: unknown) =>
  typeof part === "string" || part instanceof Blob || (typeof part === "object" && part !== null && "bytes" in part);

describe("analyzeFoodPhoto", () => {
  it("fotografi expo/fetch'in okuyabildigi dosya olarak 'photo' alaninda gonderir", async () => {
    requestMock.mockResolvedValue({});

    await analyzeFoodPhoto({ uri: "file:///cache/abc.jpg", mimeType: "image/jpeg", fileName: "meal.jpg" });

    const [path, options] = requestMock.mock.calls[0];
    expect(path).toBe("/api/food-analysis/analyze");
    const parts = partsOf(options?.body as FormData);
    expect(parts).toHaveLength(1);
    const [name, file] = parts[0];
    expect(name).toBe("photo");
    expect(isAcceptedByExpoFetch(file)).toBe(true);
    expect((file as { type: string }).type).toBe("image/jpeg");
    await expect((file as { bytes: () => Promise<Uint8Array> }).bytes()).resolves.toEqual(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  });

  it("eski { uri } nesnesi expo/fetch'in kabul ettigi bir parca degildi (hatanin nedeni)", () => {
    expect(isAcceptedByExpoFetch({ uri: "file:///x.jpg", name: "x.jpg", type: "image/jpeg" })).toBe(false);
  });
});
