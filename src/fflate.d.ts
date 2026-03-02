declare module "fflate" {
  export function unzipSync(data: Uint8Array): Record<string, Uint8Array>;
}
