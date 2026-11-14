import {
  getAllDataSources,
  getDataSourceById,
  getActiveDataSource,
  getActiveDataSourceId,
  getSubjectsOfDataSource,
} from "../../../data/repository/dataSourceRepository";
import type { DataSourceMeta, DataSource } from "../../../data/repository/dataSourceRepository";
import type { Course } from "../../types/course.types";

/**
 * Ambil semua data source (metadata saja, tanpa subjects).
 */
export const getDataSources = (): DataSourceMeta[] => {
  return getAllDataSources();
};

/**
 * Ambil satu data source lengkap (beserta subjects) berdasarkan id.
 * Return null kalau tidak ditemukan.
 */
export const getDataSource = (id: string): DataSource | null => {
  return getDataSourceById(id);
};

/**
 * Ambil data source yang sedang aktif (lengkap).
 * Return null kalau belum ada yang di-set aktif.
 */
export const getActiveDS = (): DataSource | null => {
  return getActiveDataSource();
};

/**
 * Ambil id data source yang sedang aktif.
 */
export const getActiveDSId = (): string | null => {
  return getActiveDataSourceId();
};

/**
 * Ambil daftar subjects dari data source tertentu.
 */
export const getSubjects = (dataSourceId: string): Course[] => {
  return getSubjectsOfDataSource(dataSourceId);
};
