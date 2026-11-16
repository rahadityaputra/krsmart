import { removeView } from "../../../data/repository/viewRepository";

export interface DeleteViewResult {
  success: boolean;
  error?: string;
}

export const deleteView = (id: string): DeleteViewResult => {
  if (!id.trim()) {
    return { success: false, error: "ID view tidak boleh kosong." };
  }

  const removed = removeView(id);
  if (!removed) {
    return { success: false, error: "View tidak ditemukan." };
  }

  return { success: true };
};
