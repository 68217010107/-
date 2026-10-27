import React, { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  FileDown,
  LocateFixed,
  MapPin,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  AGENCY_SUPPORT_OPTIONS,
  DEPENDENCY_OPTIONS,
  ELECTRONIC_USAGE_OPTIONS,
  FAMILY_MEMBER_ROWS,
  FAMILY_RELATION_LEVELS,
  FARMING_LAND_OPTIONS,
  GAMING_RISK_OPTIONS,
  HEALTH_RISK_OPTIONS,
  HOBBY_OPTIONS,
  HOUSEHOLD_CHORE_OPTIONS,
  HOUSING_CONDITION_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INFORMANT_OPTIONS,
  LEAVE_CHILD_OPTIONS,
  PARENTAL_STATUS_OPTIONS,
  PHOTO_ATTACHMENT_TYPES,
  SCHOOL_SUPPORT_OPTIONS,
  SEXUAL_RISK_OPTIONS,
  SUBSTANCE_RISK_OPTIONS,
  TRAVEL_MODE_OPTIONS,
  VIOLENCE_RISK_OPTIONS,
  WELFARE_SAFETY_OPTIONS,
} from '../constants/formOptions';
import { createBlankHomeVisit } from '../data/seedData';
import {
  ClassroomGroup,
  HomeVisitRecord,
  HouseholdMember,
  SchoolSettings,
  StudentRecord,
} from '../types/homeVisit';
import { calcHouseholdTotals, calcMemberMonthlyTotal } from '../utils/summaryAnalytics';
import { CameraAndPhotoInput } from './CameraAndPhotoInput';
import { SignaturePad } from './SignaturePad';

interface HomeVisitFormModalProps {
  student: StudentRecord;
  classroom?: ClassroomGroup;
  existingVisit?: HomeVisitRecord;
  settings: SchoolSettings;
  onSave: (visit: HomeVisitRecord, updatedStudentAvatar?: string) => void;
  onSaveAndExportPdf: (visit: HomeVisitRecord, updatedStudentAvatar?: string) => void;
  onClose: () => void;
}

export const HomeVisitFormModal: React.FC<HomeVisitFormModalProps> = ({
  student,
  classroom,
  existingVisit,
  settings,
  onSave,
  onSaveAndExportPdf,
  onClose,
}) => {
  const [form, setForm] = useState<HomeVisitRecord>(() => {
    if (existingVisit) {
      return JSON.parse(JSON.stringify(existingVisit));
    }
    const blank = createBlankHomeVisit(
      student.id,
      classroom?.homeroomTeacher || settings.teacherName,
      settings.teacherPosition
    );
    blank.guardianLastName = student.lastName;
    blank.guardianPhone = student.phone;
    return blank;
  });

  const [studentAvatar, setStudentAvatar] = useState<string>(student.avatarDataUrl || '');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState<string>(form.gps ? String(form.gps.lat) : '');
  const [manualLng, setManualLng] = useState<string>(form.gps ? String(form.gps.lng) : '');

  const totals = useMemo(() => calcHouseholdTotals(form), [form]);

  const toggleItem = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const handleCaptureGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS กรุณากรอกละติจูด/ลองจิจูดด้วยตนเอง');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = pos.coords.accuracy ? Number(pos.coords.accuracy.toFixed(1)) : null;
        setManualLat(String(lat));
        setManualLng(String(lng));
        setForm((prev) => ({
          ...prev,
          gps: {
            lat,
            lng,
            accuracy: acc,
            capturedAt: new Date().toISOString(),
            addressNote: prev.gps?.addressNote || student.address || '',
            source: 'gps',
          },
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          `ไม่สามารถดึงพิกัดอัตโนมัติได้ (${err.message}) คุณครูสามารถกรอกค่าพิกัดด้านล่างได้ทันที`
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleApplyManualGps = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setGpsError('กรุณากรอกตัวเลขละติจูดและลองจิจูดให้ถูกต้อง เช่น 15.088420 และ 100.861240');
      return;
    }
    setGpsError(null);
    setForm((prev) => ({
      ...prev,
      gps: {
        lat,
        lng,
        accuracy: prev.gps?.accuracy ?? null,
        capturedAt: new Date().toISOString(),
        addressNote: prev.gps?.addressNote || student.address || '',
        source: 'manual',
      },
    }));
  };

  const updateHouseholdRow = (idx: number, patch: Partial<HouseholdMember>) => {
    setForm((prev) => {
      const next = [...prev.householdMembers];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, householdMembers: next };
    });
  };

  const addHouseholdRow = () => {
    if (form.householdMembers.length >= 10) return;
    setForm((prev) => ({
      ...prev,
      householdMembers: [
        ...prev.householdMembers,
        {
          id: `hm-${Date.now()}`,
          relation: '',
          age: '',
          hasDisability: false,
          incomeSalary: 0,
          incomeAgriculture: 0,
          incomeBusiness: 0,
          incomeWelfare: 0,
          incomeOther: 0,
        },
      ],
    }));
  };

  const removeHouseholdRow = (idx: number) => {
    if (form.householdMembers.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.filter((_, i) => i !== idx),
    }));
  };

  const finalizeVisit = (): HomeVisitRecord => ({
    ...form,
    updatedAt: new Date().toISOString(),
    status: 'completed',
  });

  const steps = [
    { id: 0, title: '1. นักเรียนและผู้ปกครอง' },
    { id: 1, title: '2. ครัวเรือนและรายได้' },
    { id: 2, title: '3. ความสัมพันธ์ครอบครัว' },
    { id: 3, title: '4. พฤติกรรมและความเสี่ยง' },
    { id: 4, title: '5. ภาพถ่าย · GPS · ลายเซ็น' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 truncate">
              แบบบันทึกการเยี่ยมบ้าน: {student.prefix}
              {student.firstName} {student.lastName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 tabular-nums">
              <span>รหัส {student.studentCode}</span>
              <span aria-hidden="true">·</span>
              <span>{classroom?.name || 'ไม่ระบุชั้นเรียน'}</span>
              <span aria-hidden="true">·</span>
              <span>วันที่เยี่ยม {form.visitDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(s.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeStep === s.id
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 0: Student & Guardian */}
          {activeStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-200">
                <div className="md:col-span-1">
                  <CameraAndPhotoInput
                    label="รูปถ่ายนักเรียน (หน้า 1)"
                    value={studentAvatar}
                    onChange={setStudentAvatar}
                    aspectClass="aspect-[3/4]"
                    maxWidthPx={600}
                  />
                </div>

                <div className="md:col-span-3 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        วันที่ออกเยี่ยมบ้าน
                      </label>
                      <input
                        type="date"
                        value={form.visitDate}
                        onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        สถานะบิดามารดาของนักเรียน (เชื่อมโยงรายงานสรุปข้อ 6–9 อัตโนมัติ)
                      </label>
                      <select
                        value={form.parentalStatus}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            parentalStatus: e.target.value as HomeVisitRecord['parentalStatus'],
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        {PARENTAL_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">
                      ข้อ 1. ข้อมูลนักเรียน: {student.prefix}
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="tabular-nums">
                      ชั้น {classroom?.shortName || '-'} · เลขบัตรประชาชน{' '}
                      {student.citizenId || 'ยังไม่ระบุ'} · ที่อยู่ {student.address || '-'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        ข้อ 2. ข้อมูลผู้ปกครองนักเรียน
                      </h3>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.noGuardian}
                          onChange={(e) => setForm({ ...form, noGuardian: e.target.checked })}
                          className="rounded border-slate-300 text-teal-700"
                        />
                        ไม่มีผู้ปกครอง
                      </label>
                    </div>

                    {!form.noGuardian && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            ชื่อผู้ปกครอง
                          </label>
                          <input
                            type="text"
                            value={form.guardianFirstName}
                            onChange={(e) =>
                              setForm({ ...form, guardianFirstName: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            นามสกุลผู้ปกครอง
                          </label>
                          <input
                            type="text"
                            value={form.guardianLastName}
                            onChange={(e) =>
                              setForm({ ...form, guardianLastName: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            เบอร์โทรศัพท์
                          </label>
                          <input
                            type="text"
                            value={form.guardianPhone}
                            onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            ความสัมพันธ์กับนักเรียน
                          </label>
                          <input
                            type="text"
                            value={form.guardianRelation}
                            onChange={(e) =>
                              setForm({ ...form, guardianRelation: e.target.value })
                            }
                            placeholder="เช่น บิดา, มารดา, ยาย"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            อาชีพ
                          </label>
                          <input
                            type="text"
                            value={form.guardianOccupation}
                            onChange={(e) =>
                              setForm({ ...form, guardianOccupation: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            การศึกษาสูงสุด
                          </label>
                          <input
                            type="text"
                            value={form.guardianEducation}
                            onChange={(e) =>
                              setForm({ ...form, guardianEducation: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            เลขบัตรประชาชนผู้ปกครอง (13 หลัก)
                          </label>
                          <input
                            type="text"
                            maxLength={13}
                            disabled={form.noGuardianCitizenId}
                            value={form.guardianCitizenId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                guardianCitizenId: e.target.value.replace(/\D/g, '').slice(0, 13),
                              })
                            }
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular disabled:bg-slate-100"
                          />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.noGuardianCitizenId}
                              onChange={(e) =>
                                setForm({ ...form, noGuardianCitizenId: e.target.checked })
                              }
                              className="rounded border-slate-300 text-teal-700"
                            />
                            ไม่มีบัตรประจำตัวประชาชน
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.stateWelfareRegistered}
                          onChange={(e) =>
                            setForm({ ...form, stateWelfareRegistered: e.target.checked })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        เคยลงทะเบียนเพื่อสวัสดิการแห่งรัฐ (ลงทะเบียนคนจน)
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isPoorScreening}
                          onChange={(e) =>
                            setForm({ ...form, isPoorScreening: e.target.checked })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        เข้าเกณฑ์คัดกรองนักเรียนยากจน (กรอกตารางรายได้ข้อ 3)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Household Members & Status */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      ข้อ 3. จำนวนสมาชิกในครัวเรือน (รวมตัวนักเรียน)
                    </h3>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={form.householdMemberCount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          householdMemberCount: Math.max(1, parseInt(e.target.value || '1', 10)),
                        })
                      }
                      className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                    />
                    <span className="text-xs text-slate-600">คน</span>
                  </div>

                  <button
                    type="button"
                    onClick={addHouseholdRow}
                    disabled={form.householdMembers.length >= 10}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มแถวสมาชิก ({form.householdMembers.length}/10)
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2 text-center w-10">คนที่</th>
                        <th className="py-2 px-2 text-left min-w-[120px]">ความสัมพันธ์</th>
                        <th className="py-2 px-2 text-center w-16">อายุ</th>
                        <th className="py-2 px-2 text-center w-20">พิการ</th>
                        <th className="py-2 px-2 text-right w-24">เงินเดือน</th>
                        <th className="py-2 px-2 text-right w-24">เกษตร</th>
                        <th className="py-2 px-2 text-right w-24">ธุรกิจ</th>
                        <th className="py-2 px-2 text-right w-24">สวัสดิการรัฐ</th>
                        <th className="py-2 px-2 text-right w-24">แหล่งอื่น</th>
                        <th className="py-2 px-2 text-right w-28">รวม/เดือน</th>
                        <th className="py-2 px-2 w-9"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.householdMembers.map((m, idx) => (
                        <tr key={m.id}>
                          <td className="py-1.5 px-2 text-center font-mono-tabular text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={m.relation}
                              onChange={(e) =>
                                updateHouseholdRow(idx, { relation: e.target.value })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={m.age}
                              onChange={(e) => updateHouseholdRow(idx, { age: e.target.value })}
                              className="w-full px-2 py-1 text-center rounded border border-slate-200 font-mono-tabular"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={m.hasDisability}
                              onChange={(e) =>
                                updateHouseholdRow(idx, { hasDisability: e.target.checked })
                              }
                              className="rounded border-slate-300 text-teal-700"
                            />
                          </td>
                          {(
                            [
                              'incomeSalary',
                              'incomeAgriculture',
                              'incomeBusiness',
                              'incomeWelfare',
                              'incomeOther',
                            ] as const
                          ).map((field) => (
                            <td key={field} className="py-1.5 px-2">
                              <input
                                type="number"
                                min={0}
                                value={m[field] || 0}
                                onChange={(e) =>
                                  updateHouseholdRow(idx, {
                                    [field]: Math.max(0, Number(e.target.value || 0)),
                                  })
                                }
                                className="w-full px-2 py-1 text-right rounded border border-slate-200 font-mono-tabular"
                              />
                            </td>
                          ))}
                          <td className="py-1.5 px-2 text-right font-semibold font-mono-tabular text-slate-900">
                            {calcMemberMonthlyTotal(m).toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            {form.householdMembers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeHouseholdRow(idx)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                      <tr>
                        <td colSpan={9} className="py-2 px-3 text-right">
                          รวมรายได้ครัวเรือนต่อเดือน
                        </td>
                        <td className="py-2 px-2 text-right font-mono-tabular">
                          {totals.totalMonthly.toLocaleString()} บาท
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={9} className="py-2 px-3 text-right">
                          รายได้ครัวเรือนเฉลี่ยต่อคน (หารด้วยสมาชิก {totals.memberCount} คน)
                        </td>
                        <td className="py-2 px-2 text-right font-mono-tabular text-teal-800">
                          {(
                            Math.round((totals.totalMonthly / totals.memberCount) * 100) / 100
                          ).toLocaleString()}{' '}
                          บาท
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Section 4 */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  ข้อ 4. สถานะของครัวเรือน (เฉพาะบุคคลที่อาศัยในบ้านปัจจุบัน)
                </h3>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">4.1 ครัวเรือนมีภาระพึ่งพิง</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEPENDENCY_OPTIONS.map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.dependencyFlags.includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              dependencyFlags: toggleItem(form.dependencyFlags, opt),
                            })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">4.2 ประเภทที่อยู่อาศัย</p>
                  <div className="flex flex-wrap gap-5">
                    {HOUSING_TYPE_OPTIONS.map((opt) => (
                      <label key={opt.value} className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="housingType"
                          checked={form.housingType === opt.value}
                          onChange={() => setForm({ ...form, housingType: opt.value })}
                          className="text-teal-700"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">4.3 สภาพที่อยู่อาศัย</p>
                  <div className="space-y-1.5">
                    {HOUSING_CONDITION_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.housingConditions.includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              housingConditions: toggleItem(form.housingConditions, opt),
                            })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">4.4 ยานพาหนะของครอบครัว</p>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      {(
                        [
                          { key: 'vehicleCar', label: 'รถยนต์ส่วนบุคคล' },
                          { key: 'vehiclePickup', label: 'รถปิกอัพ/รถบรรทุกเล็ก/รถตู้' },
                          {
                            key: 'vehicleTractor',
                            label: 'รถไถ/เกี่ยวข้าว/รถอีแต๋น/รถอื่นๆ ประเภทเดียวกัน',
                          },
                        ] as const
                      ).map((v) => (
                        <div key={v.key} className="flex items-center justify-between gap-2 py-1">
                          <span>- {v.label}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                checked={form[v.key] === true}
                                onChange={() => setForm({ ...form, [v.key]: true })}
                              />
                              มี
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                checked={form[v.key] === false}
                                onChange={() => setForm({ ...form, [v.key]: false })}
                              />
                              ไม่มี
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      4.5 เป็นเกษตรกร มีที่ดินทำกิน (รวมเช่า)
                    </p>
                    <div className="space-y-1.5">
                      {FARMING_LAND_OPTIONS.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.farmingLandFlags.includes(opt)}
                            onChange={() =>
                              setForm({
                                ...form,
                                farmingLandFlags: toggleItem(form.farmingLandFlags, opt),
                              })
                            }
                            className="rounded border-slate-300 text-teal-700"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Family Relationships (Section 5) */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    5.1 เวลาอยู่ร่วมกัน (ชั่วโมง/วัน)
                  </label>
                  <input
                    type="text"
                    value={form.hoursTogetherPerDay}
                    onChange={(e) => setForm({ ...form, hoursTogetherPerDay: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ภาพรวมสภาพครอบครัว (สำหรับรายงานสรุปข้อ 5.1 และ 5.2)
                  </label>
                  <div className="flex items-center gap-5 pt-2 text-xs text-slate-700">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.familyAtmosphere === 'warm'}
                        onChange={() => setForm({ ...form, familyAtmosphere: 'warm' })}
                      />
                      สภาพครอบครัวอบอุ่น
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.familyAtmosphere === 'broken'}
                        onChange={() => setForm({ ...form, familyAtmosphere: 'broken' })}
                      />
                      สภาพครอบครัวแตกแยก / มีปัญหาความสัมพันธ์
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  5.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว
                </p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 px-3 text-left">สมาชิก</th>
                        {FAMILY_RELATION_LEVELS.map((lvl) => (
                          <th key={lvl} className="py-2 px-3 text-center">
                            {lvl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {FAMILY_MEMBER_ROWS.map((row) => (
                        <tr key={row.key}>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{row.label}</span>
                              {row.key === 'other' && (
                                <input
                                  type="text"
                                  value={form.relationOtherLabel}
                                  onChange={(e) =>
                                    setForm({ ...form, relationOtherLabel: e.target.value })
                                  }
                                  placeholder="ระบุ..."
                                  className="px-2 py-0.5 text-xs rounded border border-slate-200 w-32"
                                />
                              )}
                            </div>
                          </td>
                          {FAMILY_RELATION_LEVELS.map((lvl) => (
                            <td key={lvl} className="py-2 px-3 text-center">
                              <input
                                type="radio"
                                name={`rel-${row.key}`}
                                checked={form.relations[row.key] === lvl}
                                onChange={() =>
                                  setForm({
                                    ...form,
                                    relations: { ...form.relations, [row.key]: lvl },
                                  })
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  5.3 กรณีผู้ปกครองไม่อยู่บ้านฝากเด็กนักเรียนอยู่บ้านกับใคร
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                  {LEAVE_CHILD_OPTIONS.map((opt) => (
                    <label key={opt.value} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.leaveChildWith === opt.value}
                        onChange={() => setForm({ ...form, leaveChildWith: opt.value })}
                      />
                      {opt.label}
                    </label>
                  ))}
                  {form.leaveChildWith === 'other' && (
                    <input
                      type="text"
                      value={form.leaveChildOther}
                      onChange={(e) => setForm({ ...form, leaveChildOther: e.target.value })}
                      placeholder="ระบุ..."
                      className="px-2.5 py-1 text-xs rounded border border-slate-300"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    5.4 รายได้เฉลี่ยต่อคน (กรณีไม่ยากจน)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.nonPoorAvgMonthlyIncomePerPerson}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nonPoorAvgMonthlyIncomePerPerson: Number(e.target.value || 0),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    5.5 นักเรียนได้รับค่าใช้จ่ายจาก
                  </label>
                  <input
                    type="text"
                    value={form.studentExpenseFrom}
                    onChange={(e) => setForm({ ...form, studentExpenseFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ทำงานหารายได้พิเศษ (อาชีพ)
                  </label>
                  <input
                    type="text"
                    value={form.studentPartTimeJob}
                    onChange={(e) => setForm({ ...form, studentPartTimeJob: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      รายได้/วัน
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.studentDailyEarned}
                      onChange={(e) =>
                        setForm({ ...form, studentDailyEarned: Number(e.target.value || 0) })
                      }
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      เงินมาเรียน/วัน
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.studentDailyAllowance}
                      onChange={(e) =>
                        setForm({ ...form, studentDailyAllowance: Number(e.target.value || 0) })
                      }
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    5.6 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {SCHOOL_SUPPORT_OPTIONS.map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.schoolSupportNeeded.includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              schoolSupportNeeded: toggleItem(form.schoolSupportNeeded, opt),
                            })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {form.schoolSupportNeeded.includes('อื่นๆ') && (
                    <input
                      type="text"
                      value={form.schoolSupportOther}
                      onChange={(e) => setForm({ ...form, schoolSupportOther: e.target.value })}
                      placeholder="ระบุความช่วยเหลืออื่นๆ..."
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                    />
                  )}
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-red-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.needsUrgentHelp}
                        onChange={(e) => setForm({ ...form, needsUrgentHelp: e.target.checked })}
                        className="rounded border-slate-300 text-red-600"
                      />
                      ต้องได้รับการช่วยเหลือเร่งด่วน (แสดงในรายงานสรุปข้อ 15)
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-800">
                    5.7 ความช่วยเหลือที่ครอบครัวเคยได้รับหรือต้องการจากหน่วยงาน
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {AGENCY_SUPPORT_OPTIONS.map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.agencySupportReceived.includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              agencySupportReceived: toggleItem(form.agencySupportReceived, opt),
                            })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {form.agencySupportReceived.includes('อื่นๆ') && (
                    <input
                      type="text"
                      value={form.agencySupportOther}
                      onChange={(e) => setForm({ ...form, agencySupportOther: e.target.value })}
                      placeholder="ระบุหน่วยงานหรือสวัสดิการ..."
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  5.8 ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน
                </label>
                <textarea
                  rows={2}
                  value={form.parentConcerns}
                  onChange={(e) => setForm({ ...form, parentConcerns: e.target.value })}
                  placeholder="ระบุข้อห่วงใยหรือสิ่งที่ผู้ปกครองฝากให้ครูช่วยดูแล..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Behavior & Risk Factors (Section 6.1 - 6.11) */}
          {activeStep === 3 && (
            <div className="space-y-5">
              {(
                [
                  {
                    title: '6.1 สุขภาพ',
                    options: HEALTH_RISK_OPTIONS,
                    field: 'healthRisks',
                  },
                  {
                    title: '6.2 สวัสดิการหรือความปลอดภัย',
                    options: WELFARE_SAFETY_OPTIONS,
                    field: 'welfareSafetyRisks',
                  },
                ] as const
              ).map((group) => (
                <div key={group.field} className="space-y-2 pb-4 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{group.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {group.options.map((opt) => (
                      <label key={opt} className="inline-flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[group.field].includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              [group.field]: toggleItem(form[group.field], opt),
                            })
                          }
                          className="mt-0.5 rounded border-slate-300 text-teal-700"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* 6.3 Travel */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  6.3 ระยะทางและการเดินทางระหว่างบ้านไปโรงเรียน (ไป/กลับ)
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">ระยะทาง (กม.)</label>
                    <input
                      type="text"
                      value={form.distanceKm}
                      onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">เวลา (ชั่วโมง)</label>
                    <input
                      type="text"
                      value={form.travelHours}
                      onChange={(e) => setForm({ ...form, travelHours: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">เวลา (นาที)</label>
                    <input
                      type="text"
                      value={form.travelMinutes}
                      onChange={(e) => setForm({ ...form, travelMinutes: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 font-mono-tabular"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  {TRAVEL_MODE_OPTIONS.map((mode) => (
                    <label key={mode} className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="travelMode"
                        checked={form.travelMode === mode}
                        onChange={() => setForm({ ...form, travelMode: mode })}
                      />
                      {mode}
                    </label>
                  ))}
                  {form.travelMode === 'อื่นๆ' && (
                    <input
                      type="text"
                      value={form.travelModeOther}
                      onChange={(e) => setForm({ ...form, travelModeOther: e.target.value })}
                      placeholder="ระบุวิธีเดินทาง..."
                      className="px-2.5 py-1 text-xs rounded border border-slate-300"
                    />
                  )}
                </div>
              </div>

              {(
                [
                  {
                    title: '6.4 ภาระงานความรับผิดชอบของนักเรียนที่มีต่อครอบครัว',
                    options: HOUSEHOLD_CHORE_OPTIONS,
                    field: 'householdChores',
                  },
                  {
                    title: '6.5 กิจกรรมยามว่างหรืองานอดิเรก',
                    options: HOBBY_OPTIONS,
                    field: 'hobbies',
                  },
                  {
                    title: '6.6 พฤติกรรมการใช้สารเสพติด',
                    options: SUBSTANCE_RISK_OPTIONS,
                    field: 'substanceRisks',
                  },
                  {
                    title: '6.7 พฤติกรรมการใช้ความรุนแรง',
                    options: VIOLENCE_RISK_OPTIONS,
                    field: 'violenceRisks',
                  },
                  {
                    title: '6.8 พฤติกรรมทางเพศ',
                    options: SEXUAL_RISK_OPTIONS,
                    field: 'sexualRisks',
                  },
                  {
                    title: '6.9 การติดเกม',
                    options: GAMING_RISK_OPTIONS,
                    field: 'gamingRisks',
                  },
                ] as const
              ).map((group) => (
                <div key={group.field} className="space-y-2 pb-4 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{group.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {group.options.map((opt) => (
                      <label key={opt} className="inline-flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[group.field].includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              [group.field]: toggleItem(form[group.field], opt),
                            })
                          }
                          className="mt-0.5 rounded border-slate-300 text-teal-700"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900">
                    6.10 การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.internetAccess === 'can_access'}
                        onChange={() => setForm({ ...form, internetAccess: 'can_access' })}
                      />
                      สามารถเข้าถึง Internet ได้จากที่บ้าน
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.internetAccess === 'cannot_access'}
                        onChange={() => setForm({ ...form, internetAccess: 'cannot_access' })}
                      />
                      ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900">
                    6.11 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์
                  </p>
                  <div className="space-y-1.5">
                    {ELECTRONIC_USAGE_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.electronicDeviceUsage.includes(opt)}
                          onChange={() =>
                            setForm({
                              ...form,
                              electronicDeviceUsage: toggleItem(form.electronicDeviceUsage, opt),
                            })
                          }
                          className="rounded border-slate-300 text-teal-700"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ปัญหาด้านอื่นๆ ที่พบเพิ่มเติม (แสดงในรายงานสรุปข้อ 14 ถ้ามี)
                </label>
                <input
                  type="text"
                  value={form.otherProblemNote}
                  onChange={(e) => setForm({ ...form, otherProblemNote: e.target.value })}
                  placeholder="เว้นว่างไว้หากไม่มีปัญหาอื่นเพิ่มเติม"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
          )}

          {/* STEP 4: GPS, House Photos, Informant & Teacher Signoff */}
          {activeStep === 4 && (
            <div className="space-y-6">
              {/* GPS Recording Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-700" />
                      บันทึกพิกัดจีพีเอส (GPS) บ้านนักเรียน
                    </h3>
                    <p className="text-xs text-slate-500">
                      กดปุ่มดึงพิกัดปัจจุบันขณะลงพื้นที่ หรือกรอกละติจูด/ลองจิจูดด้วยตนเอง
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    {gpsLoading ? 'กำลังค้นหาสัญญาณดาวเทียม...' : 'ดึงพิกัด GPS ปัจจุบัน'}
                  </button>
                </div>

                {gpsError && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {gpsError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ละติจูด (Latitude)
                    </label>
                    <input
                      type="text"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="เช่น 15.088420"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ลองจิจูด (Longitude)
                    </label>
                    <input
                      type="text"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      placeholder="เช่น 100.861240"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      จุดสังเกตบ้านนักเรียน
                    </label>
                    <input
                      type="text"
                      value={form.gps?.addressNote || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          gps: prev.gps
                            ? { ...prev.gps, addressNote: e.target.value }
                            : {
                                lat: parseFloat(manualLat) || 15.08842,
                                lng: parseFloat(manualLng) || 100.86124,
                                accuracy: null,
                                capturedAt: new Date().toISOString(),
                                addressNote: e.target.value,
                                source: 'manual',
                              },
                        }))
                      }
                      placeholder="เช่น ซอยข้างวัดโคกเจริญ"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleApplyManualGps}
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                    >
                      อัปเดตค่าพิกัด
                    </button>
                  </div>
                </div>

                {form.gps && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-700 tabular-nums">
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                      <Check className="w-4 h-4" />
                      บันทึกพิกัดแล้ว: {form.gps.lat.toFixed(6)}, {form.gps.lng.toFixed(6)}
                      {form.gps.accuracy ? ` (ความแม่นยำ ±${form.gps.accuracy} ม.)` : ''}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${form.gps.lat},${form.gps.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:underline font-medium"
                    >
                      เปิดดูตำแหน่งบนแผนที่
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Photo Attachment Type + 2 Official Photos */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900">
                    กรุณาระบุประเภทภาพถ่ายบ้านนักเรียนที่แนบมา (หน้า 4/4)
                  </p>
                  <div className="space-y-1.5">
                    {PHOTO_ATTACHMENT_TYPES.map((pt) => (
                      <label key={pt.value} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="photoAttachmentType"
                          checked={form.photoAttachmentType === pt.value}
                          onChange={() => setForm({ ...form, photoAttachmentType: pt.value })}
                          className="mt-0.5"
                        />
                        <span>{pt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CameraAndPhotoInput
                    label="รูปที่ 1 ภาพถ่ายสภาพบ้านนักเรียน"
                    sublabel="ถ่ายให้เห็นหลังคาและฝาบ้านอย่างชัดเจน"
                    value={form.photoExteriorDataUrl}
                    onChange={(url) => setForm({ ...form, photoExteriorDataUrl: url })}
                  />
                  <CameraAndPhotoInput
                    label="รูปที่ 2 ภาพถ่ายภายในบ้านนักเรียน"
                    sublabel="สภาพความเป็นอยู่และพื้นที่พักอาศัยภายในบ้าน"
                    value={form.photoInteriorDataUrl}
                    onChange={(url) => setForm({ ...form, photoInteriorDataUrl: url })}
                  />
                </div>
              </div>

              {/* Informant & Teacher Signoff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900">
                    ผู้ให้ข้อมูลนักเรียนและคำรับรองผู้ปกครอง (ท้ายหน้า 3)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">ความสัมพันธ์</label>
                      <select
                        value={form.informantRelation}
                        onChange={(e) => setForm({ ...form, informantRelation: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        {INFORMANT_OPTIONS.map((inf) => (
                          <option key={inf} value={inf}>
                            {inf}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        ชื่อ-สกุลผู้ปกครอง/ผู้แทน (ตัวบรรจง)
                      </label>
                      <input
                        type="text"
                        value={form.informantFullName}
                        onChange={(e) => setForm({ ...form, informantFullName: e.target.value })}
                        placeholder="เช่น นายสมศักดิ์ แสนดี"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                  <SignaturePad
                    label="ลายมือชื่อผู้ปกครอง / ผู้ให้ข้อมูล"
                    value={form.informantSignatureDataUrl}
                    onChange={(sig) => setForm({ ...form, informantSignatureDataUrl: sig })}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900">
                    คำรับรองครูผู้เยี่ยมบ้าน (ท้ายหน้า 4)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">ชื่อ-สกุลผู้รับรอง</label>
                      <input
                        type="text"
                        value={form.signoffTeacherName}
                        onChange={(e) => setForm({ ...form, signoffTeacherName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">ตำแหน่ง</label>
                      <input
                        type="text"
                        value={form.signoffTeacherPosition}
                        onChange={(e) =>
                          setForm({ ...form, signoffTeacherPosition: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={form.signoffDay}
                      onChange={(e) => setForm({ ...form, signoffDay: e.target.value })}
                      placeholder="วันที่"
                      className="px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono-tabular"
                    />
                    <input
                      type="text"
                      value={form.signoffMonth}
                      onChange={(e) => setForm({ ...form, signoffMonth: e.target.value })}
                      placeholder="เดือน"
                      className="px-2.5 py-1.5 text-xs rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={form.signoffYear}
                      onChange={(e) => setForm({ ...form, signoffYear: e.target.value })}
                      placeholder="พ.ศ."
                      className="px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono-tabular"
                    />
                  </div>
                  <SignaturePad
                    label="ลายมือชื่อครูผู้เยี่ยมบ้าน"
                    value={form.teacherSignatureDataUrl}
                    onChange={(sig) => setForm({ ...form, teacherSignatureDataUrl: sig })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep((s) => s - 1)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                ย้อนกลับหมวดก่อนหน้า
              </button>
            )}
            {activeStep < steps.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((s) => s + 1)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-teal-700 text-teal-800 bg-teal-50 hover:bg-teal-100 whitespace-nowrap"
              >
                ไปหมวดถัดไป
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => onSaveAndExportPdf(finalizeVisit(), studentAvatar)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              บันทึกและส่งออก PDF
            </button>
            <button
              type="button"
              onClick={() => onSave(finalizeVisit(), studentAvatar)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
