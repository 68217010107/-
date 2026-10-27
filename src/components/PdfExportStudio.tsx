import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Download,
  FileCheck2,
  Loader2,
  Printer,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { domToJpeg } from 'modern-screenshot';
import {
  DEFAULT_INDIVIDUAL_SECTIONS,
  DEFAULT_SUMMARY_SECTIONS,
} from '../constants/formOptions';
import {
  ClassroomGroup,
  HomeVisitRecord,
  PdfCustomLayoutConfig,
  SchoolSettings,
  StudentRecord,
} from '../types/homeVisit';
import { IndividualPdfPages, SummaryPdfPages } from './PdfDocumentRenderer';

interface PdfExportStudioProps {
  settings: SchoolSettings;
  classes: ClassroomGroup[];
  students: StudentRecord[];
  visits: HomeVisitRecord[];
  presets: PdfCustomLayoutConfig[];
  initialMode?: 'individual' | 'summary';
  initialStudentId?: string | null;
  initialSummaryClassId?: string;
  onSavePreset: (preset: PdfCustomLayoutConfig) => void;
}

export const PdfExportStudio: React.FC<PdfExportStudioProps> = ({
  settings,
  classes,
  students,
  visits,
  presets,
  initialMode = 'individual',
  initialStudentId,
  initialSummaryClassId = 'all',
  onSavePreset,
}) => {
  const [reportMode, setReportMode] = useState<'individual' | 'summary'>(initialMode);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [selectedSummaryClassId, setSelectedSummaryClassId] =
    useState<string>(initialSummaryClassId);

  const [config, setConfig] = useState<PdfCustomLayoutConfig>(() => {
    const base = presets[0];
    if (base) {
      return JSON.parse(JSON.stringify({ ...base, mode: initialMode }));
    }
    return {
      id: 'active-config',
      name: 'มาตรฐาน สพฐ. ครบทุกหน้า',
      mode: initialMode,
      orientation: 'portrait',
      fontScale: 'standard',
      numeralStyle: 'arabic',
      flowMode: 'official_paginated',
      showCitizenIdMask: false,
      showGpsCoordinates: true,
      showSignatures: true,
      individualSections: DEFAULT_INDIVIDUAL_SECTIONS.map((s) => ({ ...s })),
      summarySections: DEFAULT_SUMMARY_SECTIONS.map((s) => ({ ...s })),
    };
  });

  const [presetNameInput, setPresetNameInput] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setReportMode('individual');
    }
  }, [initialStudentId]);

  React.useEffect(() => {
    if (initialSummaryClassId) {
      setSelectedSummaryClassId(initialSummaryClassId);
    }
  }, [initialSummaryClassId]);

  React.useEffect(() => {
    setReportMode(initialMode);
  }, [initialMode]);

  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  const currentClass = useMemo(
    () => classes.find((c) => c.id === currentStudent?.classId),
    [classes, currentStudent]
  );

  const currentVisit = useMemo(
    () => visits.find((v) => v.studentId === currentStudent?.id),
    [visits, currentStudent]
  );

  const moveIndividualSection = (index: number, dir: -1 | 1) => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= config.individualSections.length) return;
    const copy = [...config.individualSections];
    const [removed] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, removed);
    setConfig({ ...config, individualSections: copy });
  };

  const moveSummarySection = (index: number, dir: -1 | 1) => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= config.summarySections.length) return;
    const copy = [...config.summarySections];
    const [removed] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, removed);
    setConfig({ ...config, summarySections: copy });
  };

  const handleResetDefault = () => {
    setConfig({
      ...config,
      orientation: 'portrait',
      fontScale: 'standard',
      numeralStyle: reportMode === 'summary' ? 'thai' : 'arabic',
      flowMode: 'official_paginated',
      showCitizenIdMask: false,
      showGpsCoordinates: true,
      showSignatures: true,
      individualSections: DEFAULT_INDIVIDUAL_SECTIONS.map((s) => ({ ...s })),
      summarySections: DEFAULT_SUMMARY_SECTIONS.map((s) => ({ ...s })),
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;
    setConfig(JSON.parse(JSON.stringify(found)));
  };

  const handleSaveCustomPreset = () => {
    const label = presetNameInput.trim();
    if (!label) return;
    const newPreset: PdfCustomLayoutConfig = {
      ...JSON.parse(JSON.stringify(config)),
      id: `preset-${Date.now()}`,
      name: label,
      mode: reportMode,
    };
    onSavePreset(newPreset);
    setPresetNameInput('');
    setExportStatus(`บันทึกรูปแบบ "${label}" เรียบร้อยแล้ว`);
    setTimeout(() => setExportStatus(null), 3500);
  };

  const handleDownloadPdf = async () => {
    if (!previewContainerRef.current || isGeneratingPdf) return;
    const pageNodes = Array.from(
      previewContainerRef.current.querySelectorAll<HTMLElement>('[data-pdf-page="true"]')
    );
    if (pageNodes.length === 0) return;

    setIsGeneratingPdf(true);
    setExportStatus(`กำลังสร้างไฟล์ PDF จำนวน ${pageNodes.length} หน้า...`);

    try {
      const isLandscape = config.orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidthMm = isLandscape ? 297 : 210;
      const pageHeightMm = isLandscape ? 210 : 297;

      for (let i = 0; i < pageNodes.length; i++) {
        setExportStatus(`กำลังประมวลผลหน้าที่ ${i + 1} จาก ${pageNodes.length}...`);
        const node = pageNodes[i];
        const dataUrl = await domToJpeg(node, {
          quality: 0.92,
          scale: 2,
          backgroundColor: '#ffffff',
        });

        if (i > 0) {
          pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
        }
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
      }

      const fileName =
        reportMode === 'individual' && currentStudent
          ? `แบบบันทึกการเยี่ยมบ้าน_${currentStudent.firstName}_${currentStudent.lastName}.pdf`
          : `รายงานสรุปการเยี่ยมบ้าน_${settings.schoolName}_${settings.academicYear}.pdf`;

      pdf.save(fileName);
      setExportStatus(`ดาวน์โหลดไฟล์ "${fileName}" สำเร็จแล้ว`);
      setTimeout(() => setExportStatus(null), 4500);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportStatus('เกิดข้อผิดพลาดในการสร้างไฟล์ กรุณาใช้ปุ่มพิมพ์ A4 แทนชั่วคราว');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Studio Controls (Hidden when printing) */}
      <section className="no-print bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              สตูดิโอปรับแต่งรูปแบบและส่งออกรายงาน PDF
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกหัวข้อที่ต้องการแสดง จัดเรียงลำดับหมวดหมู่ ปรับขนาดตัวอักษร/เลขไทย และดาวน์โหลดเป็นไฟล์ PDF ได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Report Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setReportMode('individual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  reportMode === 'individual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แบบเยี่ยมบ้านรายบุคคล
              </button>
              <button
                type="button"
                onClick={() => setReportMode('summary')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  reportMode === 'summary'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายงานสรุปประจำชั้น
              </button>
            </div>

            <button
              type="button"
              onClick={handleNativePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              สั่งพิมพ์ A4
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isGeneratingPdf ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดไฟล์ PDF ทันที'}
            </button>
          </div>
        </div>

        {exportStatus && (
          <div className="px-4 py-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 shrink-0" />
            <span>{exportStatus}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Customization Controls (no-print) */}
        <aside className="no-print xl:col-span-4 bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          {/* Target Selector */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
                ข้อมูลเป้าหมายและเทมเพลต
              </h3>
              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="w-3 h-3" />
                คืนค่ามาตรฐาน
              </button>
            </div>

            {reportMode === 'individual' ? (
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  เลือกนักเรียนที่ต้องการส่งออกรายงาน
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {students.map((s) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    const hasVisit = visits.some((v) => v.studentId === s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        [{cls?.shortName || '-'}] {s.prefix}
                        {s.firstName} {s.lastName} {hasVisit ? '✓' : '(แบบฟอร์มเปล่า)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  เลือกห้องเรียนสำหรับรายงานสรุป
                </label>
                <select
                  value={selectedSummaryClassId}
                  onChange={(e) => setSelectedSummaryClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="all">สรุปรวมทุกระดับชั้น ({students.length} คน)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      เฉพาะ {c.name} ({students.filter((s) => s.classId === c.id).length} คน)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-600 mb-1">โหลดรูปแบบสำเร็จรูป (Preset)</label>
              <select
                onChange={(e) => {
                  if (e.target.value) handleApplyPreset(e.target.value);
                }}
                defaultValue=""
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="" disabled>
                  -- เลือกรูปแบบที่บันทึกไว้ --
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Layout & Formatting Options */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <h3 className="text-xs font-semibold text-slate-900">การจัดหน้ากระดาษและรูปแบบตัวเลข</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">แนวกระดาษ A4</label>
                <select
                  value={config.orientation}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      orientation: e.target.value as 'portrait' | 'landscape',
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="portrait">แนวตั้ง (Portrait)</option>
                  <option value="landscape">แนวนอน (Landscape)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">รูปแบบตัวเลข</label>
                <select
                  value={config.numeralStyle}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      numeralStyle: e.target.value as 'thai' | 'arabic',
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="arabic">เลขอารบิก (1, 2, 3)</option>
                  <option value="thai">เลขไทยราชการ (๑, ๒, ๓)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">ขนาดตัวอักษร</label>
                <select
                  value={config.fontScale}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      fontScale: e.target.value as 'compact' | 'standard' | 'large',
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="compact">กระชับ (ประหยัดพื้นที่)</option>
                  <option value="standard">มาตรฐานราชการ</option>
                  <option value="large">ขนาดใหญ่อ่านง่าย</option>
                </select>
              </div>

              {reportMode === 'individual' && (
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">การแบ่งหน้า</label>
                  <select
                    value={config.flowMode}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        flowMode: e.target.value as 'official_paginated' | 'continuous_compact',
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="official_paginated">มาตรฐาน สพฐ.</option>
                    <option value="continuous_compact">ต่อเนื่องกระชับ</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              {reportMode === 'individual' && (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showGpsCoordinates}
                      onChange={(e) =>
                        setConfig({ ...config, showGpsCoordinates: e.target.checked })
                      }
                      className="rounded border-slate-300 text-teal-700"
                    />
                    แสดงกล่องพิกัดจีพีเอส (GPS) บ้านนักเรียน
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCitizenIdMask}
                      onChange={(e) =>
                        setConfig({ ...config, showCitizenIdMask: e.target.checked })
                      }
                      className="rounded border-slate-300 text-teal-700"
                    />
                    ปิดบังเลขบัตรประชาชนบางหลัก (PDPA Privacy)
                  </label>
                </>
              )}
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSignatures}
                  onChange={(e) => setConfig({ ...config, showSignatures: e.target.checked })}
                  className="rounded border-slate-300 text-teal-700"
                />
                แสดงช่องลงลายมือชื่อและคำรับรองท้ายเอกสาร
              </label>
            </div>
          </div>

          {/* Section Selection & Ordering */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">
                เลือกหัวข้อและจัดลำดับเนื้อหาใน PDF
              </h3>
              <span className="text-[11px] text-slate-400">กดลูกศรเพื่อสลับลำดับ</span>
            </div>

            {reportMode === 'individual' ? (
              <div className="space-y-2">
                {config.individualSections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 transition-colors ${
                      sec.enabled
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    <label className="flex items-start gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={sec.enabled}
                        onChange={(e) => {
                          const next = [...config.individualSections];
                          next[idx] = { ...sec, enabled: e.target.checked };
                          setConfig({ ...config, individualSections: next });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-teal-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 leading-snug">
                          {sec.label}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          {sec.description}
                        </p>
                      </div>
                    </label>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveIndividualSection(idx, -1)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === config.individualSections.length - 1}
                        onClick={() => moveIndividualSection(idx, 1)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {config.summarySections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 transition-colors ${
                      sec.enabled
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    <label className="flex items-start gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={sec.enabled}
                        onChange={(e) => {
                          const next = [...config.summarySections];
                          next[idx] = { ...sec, enabled: e.target.checked };
                          setConfig({ ...config, summarySections: next });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-teal-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 leading-snug">
                          {sec.label}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          {sec.description}
                        </p>
                      </div>
                    </label>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSummarySection(idx, -1)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === config.summarySections.length - 1}
                        onClick={() => moveSummarySection(idx, 1)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Preset */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              บันทึกการจัดวางนี้ไว้ใช้ซ้ำ
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder="ตั้งชื่อเทมเพลต เช่น ส่งเขตพื้นที่..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={handleSaveCustomPreset}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                บันทึก
              </button>
            </div>
          </div>
        </aside>

        {/* Right Preview Area: Live A4 Sheets */}
        <div className="xl:col-span-8 bg-slate-200/70 rounded-xl p-4 sm:p-6 overflow-x-auto print-only-root">
          <div ref={previewContainerRef} className="space-y-6 min-w-fit">
            {reportMode === 'individual' ? (
              currentStudent ? (
                <IndividualPdfPages
                  student={currentStudent}
                  classroom={currentClass}
                  visit={currentVisit}
                  settings={settings}
                  layoutConfig={config}
                />
              ) : (
                <div className="bg-white rounded-xl p-12 text-center text-sm text-slate-500">
                  กรุณาเพิ่มรายชื่อนักเรียนก่อนสร้างรายงาน PDF
                </div>
              )
            ) : (
              <SummaryPdfPages
                settings={settings}
                classes={classes}
                students={students}
                visits={visits}
                selectedClassId={selectedSummaryClassId}
                layoutConfig={config}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
