export * from "./types";
export * from "./interfaces/IRepository";
export * from "./adapters/GoogleSheetsAdapter";

import { GoogleSheetsDatabase, GoogleSheetsConfig } from "./adapters/GoogleSheetsAdapter";
import { IDatabase } from "./interfaces/IRepository";

export function createDatabase(config: GoogleSheetsConfig): IDatabase {
  return new GoogleSheetsDatabase(config);
}