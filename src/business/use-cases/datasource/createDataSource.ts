import {
  addDataSource as repoAddDataSource
} from "../../../data/repository/dataSourceRepository";
import type { DataSource } from "../../types/datasource.types";


export interface createDataSourceInput {
  name: string;
  raw: string;
}

export interface createDataSourceResult {
  success: boolean;
  dataSource?: DataSource;
  error?: string;
}

export const createDataSource = (input: createDataSourceInput): createDataSourceResult => {
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Nama data source tidak boleh kosong." };
  }

  if (!input.raw.trim()) {
    return { success: false, error: "Data mentah tidak boleh kosong." };
  }

  const dataSource = repoAddDataSource({ name, raw: input.raw });
  if (!dataSource) {
    return {
      success: false,
      error: "Gagal mem-parse data. Pastikan format teks sesuai dengan Bima UPN.",
    };
  }

  return { success: true, dataSource };
};
