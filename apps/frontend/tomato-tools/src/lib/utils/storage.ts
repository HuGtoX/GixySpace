/**
 * 本地缓存工具类
 * @param key 缓存键
 * @param value 缓存值
 * @param seconds 过期时间(秒)
 */
export function setItem(
  key: string,
  value: any,
  seconds?: number,
  storage: Storage = localStorage,
) {
  storage.setItem(
    key,
    JSON.stringify({
      timestamp: seconds ? Date.now() + seconds * 1000 : 0,
      value,
    }),
  );
}

export function getItem(key: string, storage: Storage = localStorage) {
  const item = storage.getItem(key);

  if (item) {
    const { timestamp, value } = JSON.parse(item);
    if (timestamp === 0 || timestamp - Date.now() > 0) {
      return value;
    }
    removeItem(key, storage);
  }
  return null;
}
export function removeItem(key: string, storage: Storage = localStorage) {
  storage.removeItem(key);
}

class CacheStorage {
  storageType: Storage = localStorage;

  constructor(type?: Storage) {
    if (type) {
      this.storageType = type;
    }
  }

  setItem(key: string, value: any, seconds?: number) {
    setItem(key, value, seconds, this.storageType);
  }
  getItem(key: string) {
    return getItem(key, this.storageType);
  }
}

export default CacheStorage;
