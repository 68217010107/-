import React, { useMemo, useRef, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FolderPlus,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { createDemoStudentAvatarDataUrl } from './OfficialEmblems';
import { CameraAndPhotoInput } from './CameraAndPhotoInput';
import { ConfirmDialog } from './ConfirmDialog';
import {
  ClassroomGroup,
  Gender,
  HomeVisitRecord,
  StudentPrefix,
  StudentRecord,
  VisitSchedule,
} from '../types/homeVisit';

interface StudentManagerProps {
  classes: ClassroomGroup[];
  students: StudentRecord[];
  visits: HomeVisitRecord[];
  schedules: VisitSchedule[];
  defaultTeacherName: string;
  defaultAcademicYear: string;
  onSaveStudent: (student: StudentRecord) => void;
  onDeleteStudent: (studentId: string) => void;
  onImportStudents: (newStudents: StudentRecord[]) => void;
  onSaveClass: (cls: ClassroomGroup) => void;
  onDeleteClass: (classId: string) => void;
  onOpenVisitForm: (studentId: string) => void;
  onOpenScheduleModal: (studentId: string) => void;
  onOpenPdfForStudent: (studentId: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  classes,
  students,
  visits,
  schedules,
  defaultTeacherName,
  defaultAcademicYear,
  onSaveStudent,
  onDeleteStudent,
  onImportStudents,
  onSaveClass,
  onDeleteClass,
  onOpenVisitForm,
  onOpenScheduleModal,
  onOpenPdfForStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visited' | 'scheduled' | 'unvisited'>(
    'all'
  );
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Student Modal state
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  // Class Modal state
  const [editingClass, setEditingClass] = useState<ClassroomGroup | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);

  // Delete confirmations
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<StudentRecord | null>(null);
  const [deleteClassTarget, setDeleteClassTarget] = useState<ClassroomGroup | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const visitByStudent = useMemo(() => {
    const map = new Map<string, HomeVisitRecord>();
    visits.forEach((v) => {
      if (v.status === 'completed') map.set(v.studentId, v);
    });
    return map;
  }, [visits]);

  const scheduleByStudent = useMemo(() => {
    const map = new Map<string, VisitSchedule>();
    schedules.forEach((s) => {
      if (s.status === 'upcoming' || s.status === 'completed_pending_record') {
        map.set(s.studentId, s);
      }
    });
    return map;
  }, [schedules]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassroomGroup>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (selectedClassFilter !== 'all' && s.classId !== selectedClassFilter) return false;

      const hasVisit = visitByStudent.has(s.id);
      const hasSchedule = scheduleByStudent.has(s.id);
      if (statusFilter === 'visited' && !hasVisit) return false;
      if (statusFilter === 'scheduled' && (hasVisit || !hasSchedule)) return false;
      if (statusFilter === 'unvisited' && (hasVisit || hasSchedule)) return false;

      if (!q) return true;
      const fullName = `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.citizenId.includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    });
  }, [students, selectedClassFilter, statusFilter, searchQuery, visitByStudent, scheduleByStudent]);

  const openAddStudent = (presetClassId?: string) => {
    const targetClassId =
      presetClassId ||
      (selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || 'cls-default');
    setEditingStudent({
      id: `stu-${Date.now()}`,
      studentCode: String(69400 + students.length + 1),
      prefix: 'เด็กชาย',
      firstName: '',
      lastName: '',
      gender: 'male',
      citizenId: '',
      classId: targetClassId,
      birthDate: '2016-05-01',
      phone: '',
      address: '',
      avatarDataUrl: '',
      createdAt: new Date().toISOString(),
    });
    setStudentModalOpen(true);
  };

  const openEditStudent = (student: StudentRecord) => {
    setEditingStudent({ ...student });
    setStudentModalOpen(true);
  };

  const handleSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.firstName.trim() || !editingStudent.lastName.trim()) {
      return;
    }
    const finalAvatar =
      editingStudent.avatarDataUrl ||
      createDemoStudentAvatarDataUrl(
        `${editingStudent.firstName}`,
        editingStudent.gender === 'male' ? '#0F766E' : '#0369A1'
      );
    onSaveStudent({
      ...editingStudent,
      citizenId: editingStudent.citizenId.replace(/\D/g, '').slice(0, 13),
      avatarDataUrl: finalAvatar,
    });
    setStudentModalOpen(false);
    setEditingStudent(null);
  };

  const openAddClass = () => {
    setEditingClass({
      id: `cls-${Date.now()}`,
      name: '',
      shortName: '',
      homeroomTeacher: defaultTeacherName,
      academicYear: defaultAcademicYear,
      note: '',
    });
    setClassModalOpen(true);
  };

  const handleSubmitClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.name.trim()) return;
    onSaveClass({
      ...editingClass,
      shortName: editingClass.shortName.trim() || editingClass.name.trim(),
    });
    setClassModalOpen(false);
    setEditingClass(null);
  };

  const handleExportCsv = () => {
    const header = [
      'รหัสนักเรียน',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'เพศ',
      'เลขบัตรประชาชน',
      'ห้องเรียน',
      'เบอร์โทรศัพท์',
      'ที่อยู่',
      'สถานะเยี่ยมบ้าน',
      'พิกัดละติจูด',
      'พิกัดลองจิจูด',
    ];
    const rows = filteredStudents.map((s) => {
      const cls = classMap.get(s.classId);
      const visit = visitByStudent.get(s.id);
      return [
        s.studentCode,
        s.prefix,
        s.firstName,
        s.lastName,
        s.gender === 'male' ? 'ชาย' : 'หญิง',
        s.citizenId,
        cls?.shortName || cls?.name || '-',
        s.phone,
        s.address,
        visit ? 'เยี่ยมบ้านแล้ว' : 'ยังไม่เยี่ยมบ้าน',
        visit?.gps ? String(visit.gps.lat) : '',
        visit?.gps ? String(visit.gps.lng) : '',
      ]
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',');
    });
    const bom = '\uFEFF';
    const csvContent = bom + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ทะเบียนนักเรียนและการเยี่ยมบ้าน_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length <= 1) return;

      const defaultClassId =
        selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || 'cls-p4-1';
      const imported: StudentRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(',')
          .map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 4) continue;
        const [code, rawPrefix, firstName, lastName, rawGender, cid, classShort, phone, addr] =
          cols;
        if (!firstName) continue;

        const matchedClass = classes.find(
          (c) => c.shortName === classShort || c.name === classShort
        );
        const prefix: StudentPrefix =
          rawPrefix === 'เด็กหญิง' || rawPrefix === 'นางสาว' || rawPrefix === 'นาย'
            ? rawPrefix
            : 'เด็กชาย';
        const gender: Gender =
          rawGender === 'หญิง' || prefix === 'เด็กหญิง' || prefix === 'นางสาว'
            ? 'female'
            : 'male';

        imported.push({
          id: `stu-imp-${Date.now()}-${i}`,
          studentCode: code || String(69500 + i),
          prefix,
          firstName,
          lastName: lastName || '-',
          gender,
          citizenId: (cid || '').replace(/\D/g, '').slice(0, 13),
          classId: matchedClass?.id || defaultClassId,
          birthDate: '2016-01-01',
          phone: phone || '',
          address: addr || '',
          avatarDataUrl: createDemoStudentAvatarDataUrl(
            firstName,
            gender === 'male' ? '#0F766E' : '#0369A1'
          ),
          createdAt: new Date().toISOString(),
        });
      }

      if (imported.length > 0) {
        onImportStudents(imported);
        setFeedbackMsg(`นำเข้ารายชื่อนักเรียนสำเร็จ ${imported.length} คน`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const renderStudentRow = (s: StudentRecord) => {
    const cls = classMap.get(s.classId);
    const visit = visitByStudent.get(s.id);
    const sched = scheduleByStudent.get(s.id);

    return (
      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <img
              src={
                s.avatarDataUrl ||
                createDemoStudentAvatarDataUrl(
                  s.firstName,
                  s.gender === 'male' ? '#0F766E' : '#0369A1'
                )
              }
              alt={`${s.prefix}${s.firstName}`}
              referrerPolicy="no-referrer"
              className="w-9 h-11 rounded object-cover border border-slate-200 shrink-0 bg-slate-100"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {s.prefix}
                {s.firstName} {s.lastName}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                <span>รหัส {s.studentCode}</span>
                <span aria-hidden="true">·</span>
                <span>{cls?.shortName || 'ไม่ระบุห้อง'}</span>
                <span aria-hidden="true">·</span>
                <span>{s.gender === 'male' ? 'ชาย' : 'หญิง'}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-slate-600 font-mono-tabular whitespace-nowrap">
          {s.citizenId
            ? s.citizenId.replace(
                /^(\d)(\d{4})(\d{5})(\d{2})(\d)$/,
                '$1-$2-$3-$4-$5'
              )
            : '—'}
        </td>
        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
          <div>{s.address || 'ยังไม่ระบุที่อยู่'}</div>
          {visit?.gps && (
            <div className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-mono-tabular mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {visit.gps.lat.toFixed(5)}, {visit.gps.lng.toFixed(5)}
            </div>
          )}
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
          {visit ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>เยี่ยมบ้านแล้ว ({visit.visitDate})</span>
            </div>
          ) : sched ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {sched.status === 'completed_pending_record'
                  ? 'เยี่ยมแล้ว · รอบันทึกผล'
                  : `นัดหมาย ${sched.scheduledDate} ${sched.scheduledTime}`}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">ยังไม่ได้เยี่ยมบ้าน</span>
          )}
        </td>
        <td className="py-3 px-4 text-right whitespace-nowrap">
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onOpenVisitForm(s.id)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              {visit ? 'แก้ไขบันทึกเยี่ยมบ้าน' : 'บันทึกเยี่ยมบ้าน'}
            </button>
            <button
              type="button"
              onClick={() => onOpenScheduleModal(s.id)}
              title="นัดหมายเยี่ยมบ้าน"
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenPdfForStudent(s.id)}
              title="ส่งออก PDF รายบุคคล"
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openEditStudent(s)}
              title="แก้ไขข้อมูลนักเรียน"
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteStudentTarget(s)}
              title="ลบรายชื่อนักเรียน"
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Classroom / Homeroom Overview Strip */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              กลุ่มห้องเรียน / ชั้นเรียนประจำชั้น
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการห้องเรียนและแยกกลุ่มนักเรียนตามชั้นเรียนเพื่อสรุปรายงานรายห้อง
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddClass}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              เพิ่มห้องเรียน
            </button>
            <button
              type="button"
              onClick={() => openAddStudent()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              เพิ่มนักเรียนใหม่
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setSelectedClassFilter('all')}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selectedClassFilter === 'all'
                ? 'border-teal-700 bg-teal-50/40'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-900">ทุกห้องเรียนรวมกัน</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {students.length} คน
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              เยี่ยมบ้านแล้ว {visitByStudent.size} จาก {students.length} คน
            </div>
          </button>

          {classes.map((cls) => {
            const clsStudents = students.filter((s) => s.classId === cls.id);
            const clsVisited = clsStudents.filter((s) => visitByStudent.has(s.id)).length;
            const isSelected = selectedClassFilter === cls.id;
            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassFilter(cls.id)}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-teal-700 bg-teal-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{cls.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      ครูประจำชั้น: {cls.homeroomTeacher || '-'}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClass({ ...cls });
                        setClassModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="แก้ไขห้องเรียน"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {classes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteClassTarget(cls)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="ลบห้องเรียน"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100 tabular-nums">
                  <span>นักเรียน {clsStudents.length} คน</span>
                  <span className="font-medium text-teal-800">
                    เยี่ยมแล้ว {clsVisited}/{clsStudents.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Toolbar: Search, Status Segmented Filter, View Mode, CSV */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ-นามสกุล, รหัสนักเรียน, เลขบัตรประชาชน หรือที่อยู่..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'visited', label: 'เยี่ยมแล้ว' },
                  { id: 'scheduled', label: 'นัดหมายแล้ว' },
                  { id: 'unvisited', label: 'ยังไม่เยี่ยม' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Segmented Grouping Mode */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แยกตามห้องเรียน
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ตารางรวม
              </button>
            </div>

            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              นำเข้า CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCsv}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              ส่งออก CSV
            </button>
          </div>
        </div>

        {/* Student Roster Content */}
        {filteredStudents.length === 0 ? (
          <div className="py-14 text-center space-y-3 border-t border-slate-100">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">ไม่พบรายชื่อนักเรียนตามเงื่อนไขที่เลือก</p>
              <p className="text-xs text-slate-500">
                คุณครูสามารถเพิ่มรายชื่อนักเรียนใหม่ หรือล้างตัวกรองเพื่อดูรายชื่อทั้งหมด
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddStudent()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              เพิ่มนักเรียนคนแรก
            </button>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-6 pt-2">
            {classes
              .filter((c) => selectedClassFilter === 'all' || c.id === selectedClassFilter)
              .map((cls) => {
                const groupStudents = filteredStudents.filter((s) => s.classId === cls.id);
                if (groupStudents.length === 0) return null;
                return (
                  <div key={cls.id} className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-900">{cls.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          ครูประจำชั้น {cls.homeroomTeacher || '-'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-600 tabular-nums">
                          {groupStudents.length} คน
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAddStudent(cls.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มนักเรียนในห้องนี้
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                            <th className="py-2.5 px-4">ชื่อ - นามสกุล / ห้องเรียน</th>
                            <th className="py-2.5 px-4">เลขบัตรประชาชน</th>
                            <th className="py-2.5 px-4">ที่อยู่และพิกัด GPS</th>
                            <th className="py-2.5 px-4">สถานะการเยี่ยมบ้าน</th>
                            <th className="py-2.5 px-4 text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {groupStudents.map(renderStudentRow)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4">ชื่อ - นามสกุล / ห้องเรียน</th>
                  <th className="py-3 px-4">เลขบัตรประชาชน</th>
                  <th className="py-3 px-4">ที่อยู่และพิกัด GPS</th>
                  <th className="py-3 px-4">สถานะการเยี่ยมบ้าน</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(renderStudentRow)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Student Modal */}
      {studentModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitStudent}
            className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {students.some((s) => s.id === editingStudent.id)
                  ? 'แก้ไขข้อมูลนักเรียน'
                  : 'เพิ่มข้อมูลนักเรียนใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setStudentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <CameraAndPhotoInput
                  label="รูปถ่ายนักเรียน"
                  sublabel="แสดงบนมุมขวาบนของแบบบันทึกหน้า 1"
                  value={editingStudent.avatarDataUrl}
                  onChange={(url) =>
                    setEditingStudent({ ...editingStudent, avatarDataUrl: url })
                  }
                  aspectClass="aspect-[3/4]"
                  maxWidthPx={600}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 content-start">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รหัสประจำตัวนักเรียน
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.studentCode}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, studentCode: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ระดับชั้น / ห้องเรียน
                  </label>
                  <select
                    value={editingStudent.classId}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, classId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={editingStudent.prefix}
                    onChange={(e) => {
                      const prefix = e.target.value as StudentPrefix;
                      const gender: Gender =
                        prefix === 'เด็กหญิง' || prefix === 'นางสาว' ? 'female' : 'male';
                      setEditingStudent({ ...editingStudent, prefix, gender });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เพศ</label>
                  <select
                    value={editingStudent.gender}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        gender: e.target.value as Gender,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ชื่อนักเรียน *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.firstName}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, firstName: e.target.value })
                    }
                    placeholder="กรอกชื่อจริง"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.lastName}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, lastName: e.target.value })
                    }
                    placeholder="กรอกนามสกุล"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขประจำตัวประชาชน (13 หลัก)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={editingStudent.citizenId}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        citizenId: e.target.value.replace(/\D/g, '').slice(0, 13),
                      })
                    }
                    placeholder="1160800XXXXXX"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อผู้ปกครอง
                  </label>
                  <input
                    type="text"
                    value={editingStudent.phone}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, phone: e.target.value })
                    }
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ที่อยู่ปัจจุบันสำหรับการลงพื้นที่เยี่ยมบ้าน
                  </label>
                  <textarea
                    rows={2}
                    value={editingStudent.address}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, address: e.target.value })
                    }
                    placeholder="บ้านเลขที่ หมู่ ตำบล อำเภอ จังหวัด..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStudentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
              >
                บันทึกข้อมูลนักเรียน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Classroom Modal */}
      {classModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitClass}
            className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {classes.some((c) => c.id === editingClass.id)
                  ? 'แก้ไขห้องเรียน / ชั้นเรียน'
                  : 'เพิ่มห้องเรียน / ชั้นเรียนใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setClassModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อระดับชั้นเต็ม (แสดงในปกรายงานและบันทึกข้อความ) *
                </label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="เช่น ประถมศึกษาปีที่ 4/1"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อย่อห้อง</label>
                  <input
                    type="text"
                    value={editingClass.shortName}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, shortName: e.target.value })
                    }
                    placeholder="เช่น ป.4/1"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ปีการศึกษา</label>
                  <input
                    type="text"
                    value={editingClass.academicYear}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, academicYear: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อครูประจำชั้น
                </label>
                <input
                  type="text"
                  value={editingClass.homeroomTeacher}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, homeroomTeacher: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={editingClass.note}
                  onChange={(e) => setEditingClass({ ...editingClass, note: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setClassModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap"
              >
                บันทึกห้องเรียน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Student Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteStudentTarget)}
        title="ยืนยันการลบข้อมูลนักเรียน"
        description={
          deleteStudentTarget
            ? `คุณต้องการลบรายชื่อ "${deleteStudentTarget.prefix}${deleteStudentTarget.firstName} ${deleteStudentTarget.lastName}" รวมถึงข้อมูลบันทึกการเยี่ยมบ้านและตารางนัดหมายที่เกี่ยวข้องหรือไม่?`
            : ''
        }
        confirmLabel="ลบข้อมูลนักเรียน"
        onConfirm={() => {
          if (deleteStudentTarget) {
            onDeleteStudent(deleteStudentTarget.id);
            setDeleteStudentTarget(null);
          }
        }}
        onCancel={() => setDeleteStudentTarget(null)}
      />

      {/* Delete Class Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteClassTarget)}
        title="ยืนยันการลบห้องเรียน"
        description={
          deleteClassTarget
            ? `คุณต้องการลบห้องเรียน "${deleteClassTarget.name}" หรือไม่? นักเรียนที่อยู่ในห้องนี้จะถูกย้ายไปยังห้องเรียนหลักโดยอัตโนมัติ`
            : ''
        }
        confirmLabel="ลบห้องเรียน"
        onConfirm={() => {
          if (deleteClassTarget) {
            onDeleteClass(deleteClassTarget.id);
            if (selectedClassFilter === deleteClassTarget.id) {
              setSelectedClassFilter('all');
            }
            setDeleteClassTarget(null);
          }
        }}
        onCancel={() => setDeleteClassTarget(null)}
      />
    </div>
  );
};
