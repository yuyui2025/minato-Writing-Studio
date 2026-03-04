declare module "fflate" {
  export function unzipSync(data: Uint8Array): Record<string, Uint8Array>;
  export function gzipSync(data: Uint8Array): Uint8Array;
  export function gunzipSync(data: Uint8Array): Uint8Array;
}
