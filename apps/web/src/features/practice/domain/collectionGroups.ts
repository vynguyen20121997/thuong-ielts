export const COLLECTION_GROUPS = [
  { id: "key-practice", label: "Bộ Key Practice (10-18)" },
  { id: "vol", label: "Bộ VOL (1-10)" },
  { id: "guide", label: "Bộ Guide" },
  { id: "train-1", label: "Bộ Train 1" },
  { id: "train-2", label: "Bộ Train 2" },
] as const;

export function matchesCollectionGroup(collection: string, group: string): boolean {
  const value = collection.trim().toLowerCase();
  if (group === "key-practice") return /^key practice (1[0-8])$/.test(value);
  if (group === "vol") return /^vol (?:[1-9]|10)$/.test(value);
  if (group === "guide") return value === "guide";
  if (group === "train-1") return value === "train 1";
  if (group === "train-2") return value === "train 2";
  return false;
}
