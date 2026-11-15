import {
  getDataSourceById,
  updateDataSource as updateDataSourceInRepository,
} from "../../../data/repository/dataSourceRepository";
import type { DataSourceChanges } from "../../../data/repository/dataSourceRepository";
import type { DataSource } from "../../types/datasource.types";

export interface UpdateDataSourceResult {
  success: boolean;
  dataSource?: DataSource;
  error?: string;
}

export const editDataSource = (
  id: string,
  changes: DataSourceChanges
): UpdateDataSourceResult => {
  if (!id.trim()) {
    return { success: false, error: "ID data source tidak boleh kosong." };
  }

  if (changes.name === undefined && changes.raw === undefined) {
    return { success: false, error: "Tidak ada perubahan yang diberikan." };
  }

  if (changes.name !== undefined && changes.name.trim().length === 0) {
    return { success: false, error: "Nama data source tidak boleh kosong." };
  }

  if (changes.raw !== undefined && changes.raw.trim().length === 0) {
    return { success: false, error: "Teks jadwal tidak boleh kosong." };
  }

  if (!getDataSourceById(id)) {
    return { success: false, error: "Data source tidak ditemukan." };
  }

  const updated = updateDataSourceInRepository(id, changes);
  if (!updated) {
    return {
      success: false,
      error:
        "Gagal memperbarui data source. Pastikan format teks dari Bima UPN benar dan penyimpanan browser tidak penuh.",
    };
  }

  return { success: true, dataSource: updated };
};