/** Strip MongoDB fields so documents are safe for NextResponse.json */
export function serializeDoc<T extends Record<string, unknown>>(doc: T | null): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest as T;
}

export function serializeDocs<T extends Record<string, unknown>>(docs: T[]): T[] {
  return docs.map((doc) => serializeDoc(doc) as T);
}
