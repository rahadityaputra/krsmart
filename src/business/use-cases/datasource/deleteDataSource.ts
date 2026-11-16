import { removeDataSource } from "../../../data/repository/dataSourceRepository";

export interface DeleteDataSourceResult {
  success: boolean;
  error?: string;
}

export const deleteDataSource = (id: string): DeleteDataSourceResult => {
  if (!id.trim()) {
    return { success: false, error: "ID data source tidak boleh kosong." };
  }

  const removed = removeDataSource(id);
  if (!removed) {
    return { success: false, error: "Data source tidak ditemukan." };
  }

  return { success: true };
};
