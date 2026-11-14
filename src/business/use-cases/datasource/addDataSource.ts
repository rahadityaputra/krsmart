import {
  addDataSource as repoAddDataSource,
  setActiveDataSourceId,
} from "../../../data/repository/dataSourceRepository";
import type { DataSource } from "../../../data/repository/dataSourceRepository";

export interface AddDataSourceInput {
  name: string;
  raw: string;
}

export interface AddDataSourceResult {
  success: boolean;
  dataSource?: DataSource;
  error?: string;
}

/**
 * Use case: Tambah data source baru dari teks mentah (copy-paste Bima UPN).
 *
 * Validasi:
 * - Nama tidak boleh kosong.
 * - Raw text harus bisa di-parse menjadi minimal 1 subject.
 *
 * Setelah berhasil, data source otomatis jadi aktif jika belum ada yang aktif
 * (dihandle di repository).
 */
export const addDataSource = (input: AddDataSourceInput): AddDataSourceResult => {
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

/**
 * Use case: Set data source tertentu sebagai aktif.
 */
export const activateDataSource = (id: string): boolean => {
  return setActiveDataSourceId(id);
};
