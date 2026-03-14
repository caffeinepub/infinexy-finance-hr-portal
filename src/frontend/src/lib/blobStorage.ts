import { HttpAgent } from "@icp-sdk/core/agent";
import type { backendInterface } from "../backend";
import { loadConfig } from "../config";
import { createActorWithConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

let storageClientCache: StorageClient | null = null;
let actorCache: backendInterface | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (storageClientCache) return storageClientCache;
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  storageClientCache = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
  return storageClientCache;
}

async function getActor(): Promise<backendInterface> {
  if (actorCache) return actorCache;
  actorCache = await createActorWithConfig();
  return actorCache;
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB. Please compress the file and try again.`,
    );
  }
  onProgress?.(10);
  const storageClient = await getStorageClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  onProgress?.(30);
  const { hash } = await storageClient.putFile(bytes, (pct) => {
    // map 30–95% to the storage upload progress
    onProgress?.(30 + Math.round(pct * 0.65));
  });
  onProgress?.(100);
  return hash;
}

const urlCache = new Map<string, string>();

export async function getFileURL(fileId: string): Promise<string> {
  if (urlCache.has(fileId)) return urlCache.get(fileId)!;

  // New-style IDs: sha256 hashes from external blob storage
  if (fileId.startsWith("sha256:")) {
    const storageClient = await getStorageClient();
    const url = await storageClient.getDirectURL(fileId);
    urlCache.set(fileId, url);
    return url;
  }

  // Legacy IDs: doc_X from direct canister storage
  const actor = await getActor();
  const result = await actor.getDocumentBlob(fileId);
  if (!result) throw new Error("Document not found");
  const bytes = result as unknown as Uint8Array;
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy.buffer]);
  const url = URL.createObjectURL(blob);
  urlCache.set(fileId, url);
  return url;
}

export async function uploadDataURL(
  dataUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], "signature.png", { type: "image/png" });
  return uploadFile(file, onProgress);
}
