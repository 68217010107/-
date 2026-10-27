import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileDown, Save } from 'lucide-react';
import {
  ClassroomGroup,
  HomeVisitRecord,
  SchoolSettings,
  StudentRecord,
} from '../types/homeVisit';
import { computeSummaryStatistics } from '../utils/summaryAnalytics';

interface SummaryReportViewProps {
  settings: SchoolSettings;
  classes: ClassroomGroup[];
  students: StudentRecord[];
  visits: HomeVisitRecord[];
  onSaveSettings: (nextSettings: SchoolSettings) => void;
  onOpenSummaryPdfStudio: (classFilterId: string) => void;
  onOpenVisitForm: (studentId: string) => void;
}

export const SummaryReportView: React.FC<SummaryReportViewProps> = ({
  settings,
  classes,
  students,
  visits,
  onSaveSettings,
  onOpenSummaryPdfStudio,
  onOpenVisitForm,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [draftSettings, setDraftSettings] = useState<SchoolSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  React.useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  const targetStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const stats = useMemo(
    () => computeSummaryStatistics(targetStudents, visits),
    [targetStudents, visits]
  );

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draftSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Class Filter Strip */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            สรุปรายงานการเยี่ยมบ้านออนไลน์ (ตามแบบรายงานข้อ 1–20)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ประมวลผลสถิติอัตโนมัติจากข้อมูลการเยี่ยมบ้านจริง พร้อมจัดทำปกรายงานและบันทึกข้อความเสนอผู้อำนวยการ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">สรุปรวมทุกห้องเรียน ({students.length} คน)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                เฉพาะ {c.name} ({students.filter((s) => s.classId === c.id).length} คน)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onOpenSummaryPdfStudio(selectedClassId)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            ส่งออก PDF รายงานสรุปชุดนี้
          </button>
        </div>
      </section>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500">1. นักเรียนทั้งหมด</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.totalStudents} คน
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {selectedClassObj ? selectedClassObj.name : 'รวมทุกระดับชั้น'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500">2. ออกเยี่ยมบ้านแล้ว</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {stats.visitedTotal} คน
          </p>
          <span className="text-xs text-slate-500 mt-1 block tabular-nums">
            ชาย {stats.visitedMale} คน · หญิง {stats.visitedFemale} คน
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500">13. พบปัญหาเศรษฐกิจ/ยากจน</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.economicProblemCount} คน
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            จากจำนวนที่ออกเยี่ยม {stats.visitedTotal} คน
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <span className="text-xs text-slate-500">15. ต้องช่วยเหลือเร่งด่วน</span>
          <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">
            {stats.urgentHelpCount} คน
          </p>
          <span className="text-xs text-slate-500 mt-1 block tabular-nums">
            ยังไม่ได้เยี่ยม {stats.unvisitedTotal} คน
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live 1-15 Statistical Table */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              ตารางสถิติการเยี่ยมบ้านอัตโนมัติ (ข้อ 1 – ข้อ 15)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลคำนวณแบบเรียลไทม์จากแบบบันทึกการเยี่ยมบ้านรายบุคคลของนักเรียนในกลุ่มที่เลือก
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              { label: '1. จำนวนนักเรียนทั้งหมด', val: `${stats.totalStudents} คน` },
              {
                label: '2. จำนวนนักเรียนที่สถานศึกษาออกเยี่ยมบ้าน',
                val: `${stats.visitedTotal} คน (ชาย ${stats.visitedMale} · หญิง ${stats.visitedFemale})`,
              },
              { label: '3. จำนวนนักเรียนที่ออกเยี่ยมบ้านรวม', val: `${stats.visitedTotal} คน` },
              {
                label: '4. จำนวนนักเรียนที่ไม่ได้ออกเยี่ยมบ้าน',
                val: `${stats.unvisitedTotal} คน`,
              },
              {
                label: '5.1 สภาพครอบครัวอบอุ่น',
                val: `${stats.warmFamilyCount} คน`,
              },
              {
                label: '5.2 สภาพครอบครัวแตกแยก',
                val: `${stats.brokenFamilyCount} คน`,
              },
              {
                label: '6. นักเรียนที่บิดาและมารดาเสียชีวิต',
                val: `${stats.bothParentsDeceasedCount} คน`,
              },
              {
                label: '7. นักเรียนที่มีบิดาหรือมารดาเสียชีวิต',
                val: `${stats.oneParentDeceasedCount} คน`,
              },
              {
                label: '8. นักเรียนที่บิดาและมารดาเลิกร้างกัน',
                val: `${stats.parentsDivorcedCount} คน`,
              },
              {
                label: '9. นักเรียนมิได้อาศัยอยู่กับบิดาหรือมารดาของตนเอง',
                val: `${stats.notWithParentsCount} คน`,
              },
              {
                label: '10. นักเรียนเสี่ยงหรือมีปัญหาด้านการเรียน',
                val: `${stats.learningProblemCount} คน`,
              },
              {
                label: '11. นักเรียนมีปัญหาด้านสุขภาพ',
                val: `${stats.healthProblemCount} คน`,
              },
              {
                label: '12. นักเรียนมีพฤติกรรมเสี่ยงรวม',
                val: `${stats.anyRiskBehaviorCount} คน`,
              },
              {
                label: '   - ด้านสุขภาพ',
                val: `${stats.riskHealthSubCount} คน`,
              },
              {
                label: '   - การใช้สารเสพติด',
                val: `${stats.riskSubstanceSubCount} คน`,
              },
              {
                label: '   - ความรุนแรง',
                val: `${stats.riskViolenceSubCount} คน`,
              },
              {
                label: '   - การเดินทางมาเรียน (ระยะไกล ≥ 10 กม. หรือ ≥ 45 นาที)',
                val: `${stats.riskTravelSubCount} คน`,
              },
              {
                label: '   - ด้านเพศ',
                val: `${stats.riskSexualSubCount} คน`,
              },
              {
                label: '   - การติดเกม',
                val: `${stats.riskGamingSubCount} คน`,
              },
              {
                label: '   - อื่น ๆ (เช่น ใช้สื่อเกินเวลา / แว้น / สนุกเกอร์)',
                val: `${stats.riskOtherSubCount} คน`,
              },
              {
                label: '13. นักเรียนมีปัญหาด้านเศรษฐกิจ',
                val: `${stats.economicProblemCount} คน`,
              },
              {
                label: '14. นักเรียนมีปัญหาด้านอื่น ๆ',
                val: `${stats.otherProblemCount} คน`,
              },
              {
                label: '15. นักเรียนที่ต้องได้รับการช่วยเหลือเร่งด่วน',
                val: `${stats.urgentHelpCount} คน`,
              },
            ].map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-slate-700 whitespace-pre-wrap">{item.label}</span>
                <span className="font-semibold text-slate-900 font-mono-tabular shrink-0">
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          {stats.urgentStudents.length > 0 && (
            <div className="p-4 rounded-lg bg-red-50/70 border border-red-200 space-y-2">
              <p className="text-xs font-semibold text-red-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                รายชื่อนักเรียนที่ต้องได้รับการช่วยเหลือเร่งด่วน ({stats.urgentStudents.length} คน)
              </p>
              <div className="space-y-1.5">
                {stats.urgentStudents.map((stu) => (
                  <div
                    key={stu.id}
                    className="flex items-center justify-between text-xs text-red-950"
                  >
                    <span>
                      {stu.prefix}
                      {stu.firstName} {stu.lastName} (รหัส {stu.studentCode})
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenVisitForm(stu.id)}
                      className="font-semibold underline hover:text-red-700"
                    >
                      ดูข้อมูลเยี่ยมบ้าน
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right 5 cols: Editable School & Memo Settings (Items 16-20 & Official Header) */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                ตั้งค่าข้อมูลโรงเรียน บันทึกข้อความ และข้อ 16–20
              </h3>
              <p className="text-xs text-slate-500">
                ใช้แสดงบนปกรายงาน บันทึกข้อความราชการ และท้ายรายงานสรุป
              </p>
            </div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                บันทึกแล้ว
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อสถานศึกษา</label>
              <input
                type="text"
                value={draftSettings.schoolName}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, schoolName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">อำเภอ</label>
              <input
                type="text"
                value={draftSettings.district}
                onChange={(e) => setDraftSettings({ ...draftSettings, district: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">จังหวัด</label>
              <input
                type="text"
                value={draftSettings.province}
                onChange={(e) => setDraftSettings({ ...draftSettings, province: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สังกัดสำนักงานเขตพื้นที่การศึกษา (สพป./สพม.)
              </label>
              <input
                type="text"
                value={draftSettings.educationArea}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, educationArea: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ปีการศึกษา</label>
              <input
                type="text"
                value={draftSettings.academicYear}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, academicYear: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ครั้งที่ออกเยี่ยมบ้าน
              </label>
              <input
                type="text"
                value={draftSettings.visitRound}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, visitRound: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ที่หนังสือ (บันทึกข้อความ)
              </label>
              <input
                type="text"
                value={draftSettings.memoNumber}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, memoNumber: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันที่บันทึกข้อความ
              </label>
              <input
                type="text"
                value={draftSettings.memoDate}
                onChange={(e) => setDraftSettings({ ...draftSettings, memoDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ช่วงเดือนที่ดำเนินการออกเยี่ยมบ้าน
              </label>
              <input
                type="text"
                value={draftSettings.visitPeriodText}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, visitPeriodText: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อครูผู้รายงาน
              </label>
              <input
                type="text"
                value={draftSettings.teacherName}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, teacherName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่งครู</label>
              <input
                type="text"
                value={draftSettings.teacherPosition}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, teacherPosition: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อผู้อำนวยการสถานศึกษา
              </label>
              <input
                type="text"
                value={draftSettings.directorName}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, directorName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สาเหตุที่ไม่ได้ออกเยี่ยมบ้าน (ข้อ 4 กรณีเยี่ยมไม่ครบ)
              </label>
              <textarea
                rows={2}
                value={draftSettings.unvisitedReason}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, unvisitedReason: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                16. หน่วยงาน / สหวิชาชีพ / องค์กร ที่ร่วมเยี่ยมบ้าน
              </label>
              <input
                type="text"
                value={draftSettings.partnerAgencies}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, partnerAgencies: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                17. การนำข้อมูลเยี่ยมบ้านนักเรียนไปใช้ประโยชน์อย่างไร
              </label>
              <textarea
                rows={2}
                value={draftSettings.dataUtilization}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, dataUtilization: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                19. ปัญหา / อุปสรรค / ข้อเสนอแนะ
              </label>
              <textarea
                rows={2}
                value={draftSettings.obstaclesAndSuggestions}
                onChange={(e) =>
                  setDraftSettings({
                    ...draftSettings,
                    obstaclesAndSuggestions: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                20. ความคิดเห็นและข้อเสนอแนะเพิ่มเติม
              </label>
              <textarea
                rows={2}
                value={draftSettings.generalComments}
                onChange={(e) =>
                  setDraftSettings({ ...draftSettings, generalComments: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึกข้อมูลตั้งค่ารายงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
