import { describe, it, expect, beforeEach } from "vitest";
import { addDataSource, activateDataSource } from "../../../src/business/use-cases/datasource/addDataSource";
import { clearDataSources, getActiveDataSourceId, getAllDataSources } from "../../../src/data/repository/dataSourceRepository";

// Sample data teks mentah valid: 1 mata kuliah (Bela Negara)
const VALID_RAW_DATA = `INFORMATIKA\t100210092\tBela Negara dan Widya Mwat Yasa\tIF-A\t2\t46\tSenin 07:30-09:15\tPatt.II-3D
Dosen 001`;

describe("Use Case: addDataSource", () => {
  beforeEach(() => {
    // Siapkan mock in-memory localStorage untuk testing di environment Node.js
    const store: Record<string, string> = {};
    (globalThis as unknown as { window: { localStorage: Storage } }).window = {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = String(value);
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          for (const key in store) delete store[key];
        },
        key: (_index: number) => null,
        length: 0,
      },
    };
    clearDataSources();
  });

  it("gagal menambahkan datasource jika nama kosong", () => {
    const result = addDataSource({
      name: "   ",
      raw: VALID_RAW_DATA,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Nama data source tidak boleh kosong.");
    expect(result.dataSource).toBeUndefined();
  });

  it("gagal menambahkan datasource jika raw data kosong", () => {
    const result = addDataSource({
      name: "Jadwal Semester Ganjil",
      raw: "   ",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Data mentah tidak boleh kosong.");
  });

  it("gagal menambahkan datasource jika format raw tidak dikenali oleh parser", () => {
    const result = addDataSource({
      name: "Jadwal Salah",
      raw: "Ini baris acak yang tidak sesuai format parser",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Gagal mem-parse data/);
  });

  it("berhasil menambahkan datasource valid dan otomatis jadi active jika pertama kali", () => {
    const result = addDataSource({
      name: "Jadwal 2026",
      raw: VALID_RAW_DATA,
    });

    expect(result.success).toBe(true);
    expect(result.dataSource).toBeDefined();
    expect(result.dataSource?.name).toBe("Jadwal 2026");
    expect(result.dataSource?.subjectCount).toBe(1);
    expect(result.dataSource?.subjects.length).toBe(1);
    expect(result.dataSource?.subjects[0]?.name).toBe("Bela Negara dan Widya Mwat Yasa");

    // Pastikan tersimpan dan menjadi data source aktif
    const activeId = getActiveDataSourceId();
    expect(activeId).toBe(result.dataSource?.id);

    const all = getAllDataSources();
    expect(all.length).toBe(1);
    expect(all[0]?.name).toBe("Jadwal 2026");
  });

  it("dapat mengaktifkan datasource tertentu dengan activateDataSource", () => {
    const ds1 = addDataSource({ name: "DS 1", raw: VALID_RAW_DATA });
    const ds2 = addDataSource({ name: "DS 2", raw: VALID_RAW_DATA });

    expect(ds1.dataSource).toBeDefined();
    expect(ds2.dataSource).toBeDefined();

    // Default aktif adalah ds1 (yang pertama kali dibuat)
    expect(getActiveDataSourceId()).toBe(ds1.dataSource?.id);

    // Pindah aktif ke ds2
    if (ds2.dataSource) {
      const success = activateDataSource(ds2.dataSource.id);
      expect(success).toBe(true);
      expect(getActiveDataSourceId()).toBe(ds2.dataSource.id);
    }
  });
});
