import { HttpAgent } from "@icp-sdk/core/agent";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

let storageClientCache: StorageClient | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (storageClientCache) return storageClientCache;
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(console.warn);
  }
  storageClientCache = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
  return storageClientCache;
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const client = await getStorageClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { hash } = await client.putFile(bytes, onProgress);
  return hash;
}

export async function getFileURL(fileId: string): Promise<string> {
  const client = await getStorageClient();
  return client.getDirectURL(fileId);
}

export async function uploadDataURL(
  dataUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const client = await getStorageClient();
  const { hash } = await client.putFile(bytes, onProgress);
  return hash;
}
