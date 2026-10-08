import type { DBSchema } from "idb";
import { clearStores } from "./mutations.ts";
import { createDBOpener } from "./open.ts";

// The app's IndexedDB schema. Minispiele keeps its state (settings, scores,
// favourites, saves) in Zod-validated localStorage and has no stores yet; this
// is the web-base storage seam, ready for the first one.
export interface AppSchema extends DBSchema {
  // Delete this index signature once real stores exist: while it is here any
  // string typechecks as a store name and every value is `unknown`.
  [storeName: string]: { key: IDBValidKey; value: unknown };
}

export const getDB = createDBOpener<AppSchema>({
  // Keep the name and version this database already shipped with: a new name
  // would start every user with an empty database. ("app" predates the per-app
  // naming rule; nothing opens it yet, so a rename is safe only while that holds.)
  name: "app",
  version: 1,
  upgrade(db, oldVersion) {
    // The migration ladder. `oldVersion` is 0 on a fresh install, so a new user
    // runs every step and an existing one only the steps they're missing.
    // Never edit a step that has shipped: bump `version` and add a new
    // `if (oldVersion < N)` below the last one.
    if (oldVersion < 1) {
      // v1 shipped without stores.
    }
    void db;
  },
});

/** Wipe every store (tests' `beforeEach`, a "delete all data" action). */
export async function clearAll(): Promise<void> {
  await clearStores(await getDB());
}

export { notifyMutation } from "./mutations.ts";
