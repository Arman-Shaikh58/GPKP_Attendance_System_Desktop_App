// electronStoreService.ts (Renderer)

// SET
export async function setValue(key: string, value: any) {
  return await window.storeAPI.set(key, value);
}

// GET
export async function getValue(key: string) {
  return await window.storeAPI.get(key);
}

// DELETE
export async function deleteValue(key: string) {
  return await window.storeAPI.delete(key);
}

// CHECK EXISTENCE
export async function hasKey(key: string) {
  return await window.storeAPI.has(key);
}

// CLEAR ALL
export async function clearAll() {
  return await window.storeAPI.clear();
}
