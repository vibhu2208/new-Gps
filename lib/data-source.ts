/** When true, API routes read local JSON/CSV instead of MongoDB. */
export function useLocalData(): boolean {
  return process.env.USE_LOCAL_DATA === 'true';
}
