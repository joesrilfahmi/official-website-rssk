"use client";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Profile } from "@/config/profile";
import { supabase } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertCircle,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface UnitPelayanan {
  id: string;
  title: string;
}

interface KritikSaran {
  id: string;
  nama: string;
  no_hp: string;
  unit_pelayanan_id: string;
  pesan: string;
  rating: number | null;
  status: "read" | "unread";
  is_anonymus: boolean;
  is_readed: boolean;
  created_at: string;
  unit_pelayanan?: { id: string; title: string };
}

const MAX_DATE_RANGE_DAYS = 90;

export default function LaporanKritikSaran() {
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>(
    [],
  );
  const [reportData, setReportData] = useState<KritikSaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">(
    "all",
  );
  const [unitFilter, setUnitFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dateRangeError, setDateRangeError] = useState<string>("");

  // Validate date range
  const validateDateRange = useCallback(
    (from: Date | undefined, to: Date | undefined): boolean => {
      setDateRangeError("");

      if (!from || !to) {
        return true;
      }

      if (from > to) {
        setDateRangeError(
          "Tanggal awal tidak boleh lebih besar dari tanggal akhir",
        );
        return false;
      }

      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > MAX_DATE_RANGE_DAYS) {
        setDateRangeError(
          `Rentang tanggal maksimal ${MAX_DATE_RANGE_DAYS} hari`,
        );
        return false;
      }

      return true;
    },
    [],
  );

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    validateDateRange(date, dateTo);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    validateDateRange(dateFrom, date);
  };

  // Load initial data (unit pelayanan only)
  const loadMasterData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("unit_pelayanan")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;

      setUnitPelayananList(data || []);
    } catch (error) {
      console.error("Error loading master data:", error);
      toast.error("Gagal memuat data master");
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  const handleLoadData = async () => {
    if (!validateDateRange(dateFrom, dateTo)) {
      toast.error("Rentang tanggal tidak valid");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Memuat data laporan...");

    try {
      let query = supabase
        .from("kritik_saran")
        .select(
          `
          *,
          unit_pelayanan:unit_pelayanan_id(id, title)
        `,
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (unitFilter !== "all") {
        query = query.eq("unit_pelayanan_id", unitFilter);
      }

      if (ratingFilter !== "all") {
        query = query.eq("rating", parseInt(ratingFilter));
      }

      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startDate.toISOString());
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setReportData(data || []);
      toast.success(`Berhasil memuat ${data?.length || 0} data`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Gagal memuat data laporan", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= (rating || 0)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    setExporting(true);
    const loadingToast = toast.loading("Mengekspor ke Excel...");

    try {
      const headerData: (string | number)[][] = [
        [Profile.shortName],
        [Profile.subtitle],
        [Profile.address],
        [""],
      ];

      const hasFilters =
        statusFilter !== "all" ||
        unitFilter !== "all" ||
        ratingFilter !== "all" ||
        dateFrom ||
        dateTo;

      if (hasFilters) {
        headerData.push(["Filter yang Diterapkan:"]);

        if (statusFilter !== "all") {
          headerData.push([
            `Status: ${statusFilter === "read" ? "Sudah Dibaca" : "Belum Dibaca"}`,
          ]);
        }
        if (unitFilter !== "all") {
          const unit = unitPelayananList.find((u) => u.id === unitFilter);
          headerData.push([`Unit Pelayanan: ${unit?.title || "-"}`]);
        }
        if (ratingFilter !== "all") {
          headerData.push([`Rating: ${ratingFilter}`]);
        }
        if (dateFrom || dateTo) {
          headerData.push([
            `Periode: ${dateFrom ? dateFrom.toLocaleDateString("id-ID") : "..."} s/d ${dateTo ? dateTo.toLocaleDateString("id-ID") : "..."}`,
          ]);
        }

        headerData.push([""]);
      }

      headerData.push([
        "No",
        "Nama",
        "No HP",
        "Unit Pelayanan",
        "Rating",
        "Status",
        "Pesan",
        "Tanggal",
      ]);

      const excelData = reportData.map((item, index) => [
        index + 1,
        item.nama,
        item.no_hp,
        item.unit_pelayanan?.title || "-",
        item.rating || "-",
        item.status === "read" ? "Sudah Dibaca" : "Belum Dibaca",
        item.pesan,
        formatDateTime(item.created_at),
      ]);

      const finalData = [...headerData, ...excelData];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(finalData);

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      ];

      ws["!merges"] = merges;

      ws["!cols"] = [
        { wch: 5 }, // No
        { wch: 20 }, // Nama
        { wch: 15 }, // No HP
        { wch: 25 }, // Unit
        { wch: 10 }, // Rating
        { wch: 15 }, // Status
        { wch: 40 }, // Pesan
        { wch: 20 }, // Tanggal
      ];

      const headerRowCount = headerData.length;
      for (let i = 0; i < headerRowCount; i++) {
        for (let j = 0; j < 8; j++) {
          const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
          if (!ws[cellRef]) continue;

          ws[cellRef].s = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Kritik & Saran");

      const filename = `Laporan_Kritik_Saran_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success("Berhasil mengekspor ke Excel", { id: loadingToast });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Gagal mengekspor ke Excel", { id: loadingToast });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    setExporting(true);
    const loadingToast = toast.loading("Mengekspor ke PDF...");

    try {
      const doc = new jsPDF("l", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(Profile.shortName, pageWidth / 2, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(Profile.subtitle, pageWidth / 2, 21, { align: "center" });

      doc.setFontSize(9);
      doc.text(Profile.address, pageWidth / 2, 26, { align: "center" });

      doc.setLineWidth(0.5);
      doc.line(14, 30, pageWidth - 14, 30);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Data: ${reportData.length}`, pageWidth / 2, 38, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      let yPos = 46;

      const hasFilters =
        statusFilter !== "all" ||
        unitFilter !== "all" ||
        ratingFilter !== "all" ||
        dateFrom ||
        dateTo;

      if (hasFilters) {
        doc.text("Filter yang Diterapkan:", 14, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");

        if (statusFilter !== "all") {
          doc.text(
            `• Status: ${statusFilter === "read" ? "Sudah Dibaca" : "Belum Dibaca"}`,
            14,
            yPos,
          );
          yPos += 5;
        }

        if (unitFilter !== "all") {
          const unit = unitPelayananList.find((u) => u.id === unitFilter);
          doc.text(`• Unit Pelayanan: ${unit?.title || "-"}`, 14, yPos);
          yPos += 5;
        }

        if (ratingFilter !== "all") {
          doc.text(`• Rating: ${ratingFilter}`, 14, yPos);
          yPos += 5;
        }

        if (dateFrom || dateTo) {
          const dateText = `• Periode: ${dateFrom ? dateFrom.toLocaleDateString("id-ID") : "..."} s/d ${dateTo ? dateTo.toLocaleDateString("id-ID") : "..."}`;
          doc.text(dateText, 14, yPos);
          yPos += 5;
        }

        yPos += 3;
      }

      const tableData = reportData.map((item, index) => [
        index + 1,
        item.nama,
        item.no_hp,
        item.unit_pelayanan?.title || "-",
        item.rating !== null ? item.rating.toString() : "-",
        item.status === "read" ? "Dibaca" : "Belum",
        item.pesan.length > 60
          ? item.pesan.substring(0, 57) + "..."
          : item.pesan,
        new Date(item.created_at).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      ]);

      autoTable(doc, {
        head: [
          [
            "No",
            "Nama",
            "No HP",
            "Unit",
            "Rating",
            "Status",
            "Pesan",
            "Tanggal",
          ],
        ],
        body: tableData,
        startY: yPos,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "left",
          font: "helvetica",
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" }, // No
          1: { cellWidth: 30 }, // Nama
          2: { cellWidth: 25 }, // No HP
          3: { cellWidth: 40 }, // Unit
          4: { cellWidth: 15, halign: "center" }, // Rating
          5: { cellWidth: 15, halign: "center" }, // Status
          6: { cellWidth: 75 }, // Pesan
          7: { cellWidth: 30 }, // Tanggal
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { top: 10, right: 14, bottom: 20, left: 14 },
        didDrawPage: () => {
          const pageCount = doc.getNumberOfPages();
          const pageNumber = doc.getCurrentPageInfo().pageNumber;

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(128, 128, 128);

          doc.text(
            `Halaman ${pageNumber} dari ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
          );

          doc.text(
            `Dicetak: ${new Date().toLocaleString("id-ID")}`,
            pageWidth - 14,
            doc.internal.pageSize.height - 10,
            { align: "right" },
          );

          doc.setTextColor(0, 0, 0);
        },
      });

      const filename = `Laporan_Kritik_Saran_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);

      toast.success("Berhasil mengekspor ke PDF", { id: loadingToast });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Gagal mengekspor ke PDF", { id: loadingToast });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Laporan Kritik & Saran
        </h1>
        <p className="text-muted-foreground mt-1">
          Cetak dan ekspor laporan kritik & saran
        </p>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Row 1: Status, Unit, Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "read" | "unread") =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="read">Sudah Dibaca</SelectItem>
                    <SelectItem value="unread">Belum Dibaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Unit Pelayanan</Label>
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit</SelectItem>
                    {unitPelayananList.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rating</Label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Rating</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="3">⭐⭐⭐</SelectItem>
                    <SelectItem value="2">⭐⭐</SelectItem>
                    <SelectItem value="1">⭐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Awal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom
                        ? dateFrom.toLocaleDateString("id-ID")
                        : "Pilih tanggal awal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={handleDateFromChange}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Tanggal Akhir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo
                        ? dateTo.toLocaleDateString("id-ID")
                        : "Pilih tanggal akhir"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={handleDateToChange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Date Range Error */}
            {dateRangeError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {dateRangeError}
                </p>
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Rentang tanggal maksimal {MAX_DATE_RANGE_DAYS} hari untuk
                performa optimal
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 self-end sm:self-auto pt-2">
              <Button
                onClick={handleLoadData}
                disabled={loading || !!dateRangeError}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuat Data...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Muat Data
                  </>
                )}
              </Button>

              {reportData.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    disabled={exporting}
                    className="bg-green-600 hover:bg-green-700 text-white hover:text-white"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>

                  <Button
                    variant="outline"
                    onClick={exportToPDF}
                    disabled={exporting}
                    className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Laporan ({reportData.length} data)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium text-sm w-16">
                      No
                    </th>
                    <th className="p-3 text-left font-medium text-sm">Nama</th>
                    <th className="p-3 text-left font-medium text-sm">No HP</th>
                    <th className="p-3 text-left font-medium text-sm">Unit</th>
                    <th className="p-3 text-left font-medium text-sm">
                      Rating
                    </th>
                    <th className="p-3 text-left font-medium text-sm">
                      Status
                    </th>
                    <th className="p-3 text-left font-medium text-sm min-w-[200px]">
                      Pesan
                    </th>
                    <th className="p-3 text-left font-medium text-sm">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium text-sm">{index + 1}</td>
                      <td className="p-3 text-sm">{item.nama}</td>
                      <td className="p-3 text-sm">{item.no_hp}</td>
                      <td className="p-3 text-sm">
                        {item.unit_pelayanan?.title || "-"}
                      </td>
                      <td className="p-3 text-sm">
                        {renderStars(item.rating)}
                      </td>
                      <td className="p-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "read"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                          }`}
                        >
                          {item.status === "read" ? "Dibaca" : "Belum"}
                        </span>
                      </td>
                      <td className="p-3 text-sm max-w-[300px]">
                        <p className="line-clamp-2">{item.pesan}</p>
                      </td>
                      <td className="p-3 text-sm whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && reportData.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Belum ada data</p>
              <p className="text-sm mt-1">
                Klik &quot;Muat Data&quot; untuk menampilkan laporan
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
