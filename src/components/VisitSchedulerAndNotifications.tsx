import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  ClipboardEdit,
  Clock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppNotification,
  ClassroomGroup,
  HomeVisitRecord,
  StudentRecord,
  VisitSchedule,
} from '../types/homeVisit';
import { ConfirmDialog } from './ConfirmDialog';

interface VisitSchedulerAndNotificationsProps {
  classes: ClassroomGroup[];
  students: StudentRecord[];
  visits: HomeVisitRecord[];
  schedules: VisitSchedule[];
  notifications: AppNotification[];
  initialStudentIdForModal?: string | null;
  onClearInitialStudent?: () => void;
  onSaveSchedule: (schedule: VisitSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onMarkVisitCompleted: (scheduleId: string) => void;
  onTriggerTestNotification: (type: 'upcoming_reminder' | 'record_prompt') => void;
  onMarkNotificationRead: (notifId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenVisitForm: (studentId: string) => void;
}

export const VisitSchedulerAndNotifications: React.FC<
  VisitSchedulerAndNotificationsProps
> = ({
  classes,
  students,
  visits,
  schedules,
  notifications,
  initialStudentIdForModal,
  onClearInitialStudent,
  onSaveSchedule,
  onDeleteSchedule,
  onMarkVisitCompleted,
  onTriggerTestNotification,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenVisitForm,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [modalOpen, setModalOpen] = useState<boolean>(Boolean(initialStudentIdForModal));
  const [editingSchedule, setEditingSchedule] = useState<VisitSchedule>(() => ({
    id: `sch-${Date.now()}`,
    studentId: initialStudentIdForModal || students[0]?.id || '',
    scheduledDate: todayStr,
    scheduledTime: '16:30',
    endTime: '17:15',
    reminderMinutesBefore: 30,
    status: 'upcoming',
    note: '',
    upcomingNotified: false,
    postVisitNotified: false,
    createdAt: new Date().toISOString(),
  }));

  const [filterTab, setFilterTab] = useState<
    'all' | 'upcoming' | 'completed_pending_record' | 'recorded'
  >('all');
  const [deleteTarget, setDeleteTarget] = useState<VisitSchedule | null>(null);
  const [browserPerm, setBrowserPerm] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  React.useEffect(() => {
    if (initialStudentIdForModal) {
      setEditingSchedule({
        id: `sch-${Date.now()}`,
        studentId: initialStudentIdForModal,
        scheduledDate: todayStr,
        scheduledTime: '16:30',
        endTime: '17:15',
        reminderMinutesBefore: 30,
        status: 'upcoming',
        note: '',
        upcomingNotified: false,
        postVisitNotified: false,
        createdAt: new Date().toISOString(),
      });
      setModalOpen(true);
      onClearInitialStudent?.();
    }
  }, [initialStudentIdForModal, onClearInitialStudent, todayStr]);

  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRecord>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassroomGroup>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const visitedSet = useMemo(() => {
    const set = new Set<string>();
    visits.forEach((v) => {
      if (v.status === 'completed') set.add(v.studentId);
    });
    return set;
  }, [visits]);

  const openCreateModal = () => {
    const unvisitedFirst = students.find((s) => !visitedSet.has(s.id)) || students[0];
    setEditingSchedule({
      id: `sch-${Date.now()}`,
      studentId: unvisitedFirst?.id || '',
      scheduledDate: todayStr,
      scheduledTime: '16:30',
      endTime: '17:15',
      reminderMinutesBefore: 30,
      status: 'upcoming',
      note: '',
      upcomingNotified: false,
      postVisitNotified: false,
      createdAt: new Date().toISOString(),
    });
    setModalOpen(true);
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setBrowserPerm(perm);
    } catch {
      // ignore in restricted iframe
    }
  };

  const sortedSchedules = useMemo(() => {
    return [...schedules]
      .filter((s) => {
        if (filterTab === 'all') return true;
        return s.status === filterTab;
      })
      .sort((a, b) =>
        `${a.scheduledDate}T${a.scheduledTime}`.localeCompare(
          `${b.scheduledDate}T${b.scheduledTime}`
        )
      );
  }, [schedules, filterTab]);

  const pendingRecordCount = schedules.filter(
    (s) => s.status === 'completed_pending_record'
  ).length;
  const upcomingCount = schedules.filter((s) => s.status === 'upcoming').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule.studentId) return;
    onSaveSchedule(editingSchedule);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              ตารางนัดหมายและระบบแจ้งเตือนการเยี่ยมบ้าน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตั้งเวลาแจ้งเตือนล่วงหน้าก่อนลงพื้นที่ และแจ้งเตือนอัตโนมัติให้ครูบันทึกข้อมูลหลังเยี่ยมบ้านเสร็จสิ้น
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {browserPerm !== 'unsupported' && browserPerm !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <BellRing className="w-3.5 h-3.5" />
                เปิดแจ้งเตือนเบราว์เซอร์
              </button>
            )}

            <button
              type="button"
              onClick={() => onTriggerTestNotification('upcoming_reminder')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              ทดสอบเตือนก่อนเยี่ยมบ้าน
            </button>

            <button
              type="button"
              onClick={() => onTriggerTestNotification('record_prompt')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <ClipboardEdit className="w-3.5 h-3.5" />
              ทดสอบเตือนบันทึกผล
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              สร้างนัดหมายเยี่ยมบ้าน
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500">นัดหมายที่กำลังจะถึง</span>
            <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
              {upcomingCount} รายการ
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80">
            <span className="text-xs text-amber-900">เยี่ยมบ้านแล้ว · รอบันทึกข้อมูล</span>
            <p className="text-xl font-bold text-amber-900 mt-1 tabular-nums">
              {pendingRecordCount} รายการ
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500">การแจ้งเตือนที่ยังไม่ได้อ่าน</span>
            <p className="text-xl font-bold text-teal-800 mt-1 tabular-nums">
              {notifications.filter((n) => !n.read).length} รายการ
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 cols: Schedule Table */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">รายการนัดหมายลงพื้นที่</h3>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'upcoming', label: 'กำลังจะถึง' },
                  { id: 'completed_pending_record', label: 'รอบันทึกผล' },
                  { id: 'recorded', label: 'บันทึกเสร็จแล้ว' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    filterTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {sortedSchedules.length === 0 ? (
            <div className="py-12 text-center space-y-2 border-t border-slate-100">
              <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">ยังไม่มีตารางนัดหมายในหมวดนี้</p>
              <p className="text-xs text-slate-500">
                กดปุ่ม "สร้างนัดหมายเยี่ยมบ้าน" เพื่อกำหนดวันเวลาและตั้งการแจ้งเตือนล่วงหน้า
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {sortedSchedules.map((sch) => {
                const stu = studentMap.get(sch.studentId);
                if (!stu) return null;
                const cls = classMap.get(stu.classId);

                return (
                  <div
                    key={sch.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-900">
                          {stu.prefix}
                          {stu.firstName} {stu.lastName}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {cls?.shortName || 'ไม่ระบุห้อง'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
                        <span>วันที่ {sch.scheduledDate}</span>
                        <span className="text-slate-400">·</span>
                        <span>
                          เวลา {sch.scheduledTime} – {sch.endTime} น.
                        </span>
                        <span className="text-slate-400">·</span>
                        <span>เตือนล่วงหน้า {sch.reminderMinutesBefore} นาที</span>
                      </div>

                      {sch.note && <p className="text-xs text-slate-500">{sch.note}</p>}

                      <div className="pt-0.5">
                        {sch.status === 'upcoming' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
                            <Clock className="w-3.5 h-3.5" />
                            รอลงพื้นที่ตามนัดหมาย
                          </span>
                        )}
                        {sch.status === 'completed_pending_record' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <ClipboardEdit className="w-3.5 h-3.5" />
                            ลงพื้นที่เสร็จแล้ว · กรุณาบันทึกผลการเยี่ยมบ้าน
                          </span>
                        )}
                        {sch.status === 'recorded' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            บันทึกแบบฟอร์มเยี่ยมบ้านครบถ้วนแล้ว
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sch.status === 'upcoming' && (
                        <button
                          type="button"
                          onClick={() => onMarkVisitCompleted(sch.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-600 text-amber-800 bg-amber-50 hover:bg-amber-100 whitespace-nowrap"
                        >
                          เยี่ยมบ้านเสร็จแล้ว
                        </button>
                      )}

                      {sch.status !== 'recorded' && (
                        <button
                          type="button"
                          onClick={() => onOpenVisitForm(stu.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap"
                        >
                          บันทึกผลเยี่ยมบ้าน
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sch)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="ลบนัดหมาย"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 1 col: Notification Feed */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">กล่องข้อความแจ้งเตือน</h3>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={onMarkAllNotificationsRead}
                className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap"
              >
                ทำเครื่องหมายว่าอ่านทั้งหมด
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">ยังไม่มีประวัติการแจ้งเตือน</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-3.5 space-y-2 ${!n.read ? 'bg-teal-50/30 -mx-3 px-3 rounded-lg' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <span className="text-[11px] text-slate-400 font-mono-tabular whitespace-nowrap shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 pt-0.5">
                    {n.studentId && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          onOpenVisitForm(n.studentId!);
                        }}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        {n.actionLabel || 'เปิดแบบบันทึกเยี่ยมบ้าน'} →
                      </button>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => onMarkNotificationRead(n.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-700"
                      >
                        รับทราบ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">สร้างนัดหมายเยี่ยมบ้านนักเรียน</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลือกนักเรียนที่ต้องการไปเยี่ยมบ้าน *
                </label>
                <select
                  required
                  value={editingSchedule.studentId}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, studentId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {students.map((s) => {
                    const cls = classMap.get(s.classId);
                    const done = visitedSet.has(s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        [{cls?.shortName || '-'}] {s.prefix}
                        {s.firstName} {s.lastName} {done ? '(เยี่ยมแล้ว)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">วันที่นัดหมาย</label>
                  <input
                    type="date"
                    required
                    value={editingSchedule.scheduledDate}
                    onChange={(e) =>
                      setEditingSchedule({ ...editingSchedule, scheduledDate: e.target.value })
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เวลาเริ่ม</label>
                  <input
                    type="time"
                    required
                    value={editingSchedule.scheduledTime}
                    onChange={(e) =>
                      setEditingSchedule({ ...editingSchedule, scheduledTime: e.target.value })
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    required
                    value={editingSchedule.endTime}
                    onChange={(e) =>
                      setEditingSchedule({ ...editingSchedule, endTime: e.target.value })
                    }
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  การแจ้งเตือนล่วงหน้าก่อนถึงเวลานัด
                </label>
                <select
                  value={editingSchedule.reminderMinutesBefore}
                  onChange={(e) =>
                    setEditingSchedule({
                      ...editingSchedule,
                      reminderMinutesBefore: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value={0}>แจ้งเตือนทันทีเมื่อถึงเวลานัด</option>
                  <option value={15}>แจ้งเตือนล่วงหน้า 15 นาที</option>
                  <option value={30}>แจ้งเตือนล่วงหน้า 30 นาที</option>
                  <option value={60}>แจ้งเตือนล่วงหน้า 1 ชั่วโมง</option>
                  <option value={1440}>แจ้งเตือนล่วงหน้า 1 วัน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  บันทึกช่วยจำ / จุดนัดพบผู้ปกครอง
                </label>
                <textarea
                  rows={2}
                  value={editingSchedule.note}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, note: e.target.value })
                  }
                  placeholder="เช่น โทรแจ้งคุณแม่ก่อนเดินทาง บ้านอยู่ใกล้ศาลากลางหมู่บ้าน"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap"
              >
                บันทึกตารางนัดหมาย
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="ยืนยันการลบตารางนัดหมาย"
        description="คุณต้องการลบรายการนัดหมายเยี่ยมบ้านนี้ใช่หรือไม่?"
        confirmLabel="ลบนัดหมาย"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteSchedule(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
