/**
 * Ask the browser not to evict this app's data. iOS Safari can clear data for sites
 * left unused for 7 days, unless the app is installed to the Home Screen.
 * Returns false when storage is not guaranteed, so the parent UI can warn.
 */
export async function requestPersistentStorage(
  storage: Pick<StorageManager, 'persist' | 'persisted'> | undefined = navigator.storage,
): Promise<boolean> {
  if (!storage?.persist) return false;
  try {
    return (await storage.persisted()) || (await storage.persist());
  } catch {
    return false;
  }
}
