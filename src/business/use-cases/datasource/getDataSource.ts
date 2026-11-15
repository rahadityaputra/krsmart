import {
  getAllDataSources,
  getDataSourceById,
  getSubjectsOfDataSource,
} from "../../../data/repository/dataSourceRepository";
import type { DataSource } from "../../types/datasource.types";
import type { Schedule } from "../../types/scedule.types";

export const getDataSources = (): DataSource[] => getAllDataSources();

export const getDataSource = (id: string): DataSource | null =>
  getDataSourceById(id);

export const getSchedules = (dataSourceId: string): Schedule[] =>
  getSubjectsOfDataSource(dataSourceId);