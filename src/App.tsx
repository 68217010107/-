import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { HomeVisitFormModal } from './components/HomeVisitFormModal';
import { PdfExportStudio } from './components/PdfExportStudio';
import { StudentManager } from './components/StudentManager';
import { SummaryReportView } from './components/SummaryReportView';
import { VisitSchedulerAndNotifications } from './components/VisitSchedulerAndNotifications';
import { createInitialSeedState } from './data/seedData';
import {
  AppDatabaseState,
  AppNotification,
  ClassroomGroup,
  HomeVisitRecord,
  PdfCustomLayoutConfig,
  SchoolSettings,
  StudentRecord,
  VisitSchedule,
} from './types/homeVisit';

type NavSection = 'students' | 'schedules' | 'summary' | 'pdf_studio';

const LOCAL_BACKUP_KEY = 'obec_home_visit_backup_v1';

export default function App() {
  const [db, setDb] = useState<AppDatabaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavSection>('students');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Active modals & studio routing
  const [activeVisitStudentId, setActiveVisitStudentId] = useState<string | null>(null);
  const [pendingScheduleStudentId, setPendingScheduleStudentId] = useState<string | null>(null);
  const [pdfStudioInitMode, setPdfStudioInitMode] = useState<'individual' | 'summary'>(
    'individual'
  );
  const [pdfStudioStudentId, setPdfStudioStudentId] = useState<string | null>(null);
  const [pdfStudioClassId, setPdfStudioClassId] = useState<string>('all');

  // Toast alert for newly triggered notifications
  const [liveToast, setLiveToast] = useState<AppNotification | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Load initial database from server (or seed)
  useEffect(() => {
    let mounted = true;
    const loadState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const json = await res.json();
          if (json.initialized && json.data) {
            if (mounted) {
              setDb(json.data);
              setLoading(false);
            }
            return;
          }
        }
      } catch {
        // Fallback to localStorage if API unreachable
      }

      try {
        const localRaw = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw) as AppDatabaseState;
          if (mounted) {
            setDb(parsed);
            setLoading(false);
          }
          return;
        }
      } catch {
        // ignore parse error
      }

      const seeded = createInitialSeedState();
      if (mounted) {
        setDb(seeded);
        setLoading(false);
      }
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seeded),
      }).catch(() => {});
    };

    loadState();
    return () => {
      mounted = false;
    };
  }, []);

  const persistDb = useCallback((nextState: AppDatabaseState) => {
    setDb(nextState);
    try {
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(nextState));
    } catch {
      // ignore quota limits in local backup
    }
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState),
      }).catch((err) => console.error('Failed to sync state:', err));
    }, 350);
  }, []);

  const fireBrowserNotification = useCallback((notif: AppNotification) => {
    setLiveToast(notif);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, { body: notif.message });
      } catch {
        // ignore restricted environments
      }
    }
  }, []);

  // Background scheduler checking upcoming visit reminders & post-visit recording prompts
  useEffect(() => {
    if (!db) return;

    const checkSchedules = () => {
      const now = new Date();
      let mutated = false;
      const nextNotifications = [...db.notifications];
      let newestTriggered: AppNotification | null = null;

      const visitedStudentIds = new Set(
        db.visits.filter((v) => v.status === 'completed').map((v) => v.studentId)
      );

      const nextSchedules = db.schedules.map((sch) => {
        const stu = db.students.find((s) => s.id === sch.studentId);
        if (!stu) return sch;
        const cls = db.classes.find((c) => c.id === stu.classId);
        const classLabel = cls?.shortName || '';

        const startDt = new Date(`${sch.scheduledDate}T${sch.scheduledTime}:00`);
        const endDt = new Date(`${sch.scheduledDate}T${sch.endTime || sch.scheduledTime}:00`);

        let updatedSch = { ...sch };

        // 1. Check if post-visit time has passed and visit is not recorded yet
        if (
          updatedSch.status === 'upcoming' &&
          !Number.isNaN(endDt.getTime()) &&
          now.getTime() >= endDt.getTime()
        ) {
          if (visitedStudentIds.has(stu.id)) {
            updatedSch.status = 'recorded';
            mutated = true;
          } else {
            updatedSch.status = 'completed_pending_record';
            if (!updatedSch.postVisitNotified) {
              updatedSch.postVisitNotified = true;
              const promptNotif: AppNotification = {
                id: `notif-post-${Date.now()}-${sch.id}`,
                type: 'record_prompt',
                title: 'ครบเวลานัดเยี่ยมบ้าน · กรุณาบันทึกข้อมูล',
                message: `ถึงเวลาสิ้นสุดการเยี่ยมบ้าน ${stu.prefix}${stu.firstName} ${stu.lastName} (${classLabel}) กรุณาบันทึกผล ภาพถ่าย และพิกัด GPS`,
                studentId: stu.id,
                scheduleId: sch.id,
                createdAt: now.toISOString(),
                read: false,
                actionLabel: 'บันทึกผลการเยี่ยมบ้าน',
              };
              nextNotifications.unshift(promptNotif);
              newestTriggered = promptNotif;
            }
            mutated = true;
          }
          return updatedSch;
        }

        // 2. Check upcoming reminder window
        if (
          updatedSch.status === 'upcoming' &&
          !updatedSch.upcomingNotified &&
          !Number.isNaN(startDt.getTime())
        ) {
          const triggerMs = startDt.getTime() - updatedSch.reminderMinutesBefore * 60 * 1000;
          if (now.getTime() >= triggerMs && now.getTime() < endDt.getTime()) {
            updatedSch.upcomingNotified = true;
            const remNotif: AppNotification = {
              id: `notif-rem-${Date.now()}-${sch.id}`,
              type: 'upcoming_reminder',
              title: `แจ้งเตือนนัดเยี่ยมบ้าน เวลา ${updatedSch.scheduledTime} น.`,
              message: `เตรียมลงพื้นที่เยี่ยมบ้าน ${stu.prefix}${stu.firstName} ${stu.lastName} (${classLabel}) ${
                updatedSch.note ? `· ${updatedSch.note}` : ''
              }`,
              studentId: stu.id,
              scheduleId: sch.id,
              createdAt: now.toISOString(),
              read: false,
              actionLabel: 'เปิดแบบบันทึกเยี่ยมบ้าน',
            };
            nextNotifications.unshift(remNotif);
            newestTriggered = remNotif;
            mutated = true;
          }
        }

        return updatedSch;
      });

      if (mutated) {
        persistDb({
          ...db,
          schedules: nextSchedules,
          notifications: nextNotifications,
        });
        if (newestTriggered) {
          fireBrowserNotification(newestTriggered);
        }
      }
    };

    const intervalId = window.setInterval(checkSchedules, 15000);
    return () => window.clearInterval(intervalId);
  }, [db, persistDb, fireBrowserNotification]);

  // Handlers
  const handleSaveStudent = (student: StudentRecord) => {
    if (!db) return;
    const exists = db.students.some((s) => s.id === student.id);
    const nextStudents = exists
      ? db.students.map((s) => (s.id === student.id ? student : s))
      : [...db.students, student];
    persistDb({ ...db, students: nextStudents });
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!db) return;
    persistDb({
      ...db,
      students: db.students.filter((s) => s.id !== studentId),
      visits: db.visits.filter((v) => v.studentId !== studentId),
      schedules: db.schedules.filter((s) => s.studentId !== studentId),
    });
  };

  const handleImportStudents = (imported: StudentRecord[]) => {
    if (!db) return;
    persistDb({
      ...db,
      students: [...db.students, ...imported],
    });
  };

  const handleSaveClass = (cls: ClassroomGroup) => {
    if (!db) return;
    const exists = db.classes.some((c) => c.id === cls.id);
    const nextClasses = exists
      ? db.classes.map((c) => (c.id === cls.id ? cls : c))
      : [...db.classes, cls];
    persistDb({ ...db, classes: nextClasses });
  };

  const handleDeleteClass = (classId: string) => {
    if (!db) return;
    const remainingClasses = db.classes.filter((c) => c.id !== classId);
    const fallbackClassId = remainingClasses[0]?.id || 'cls-default';
    const nextStudents = db.students.map((s) =>
      s.classId === classId ? { ...s, classId: fallbackClassId } : s
    );
    persistDb({
      ...db,
      classes: remainingClasses,
      students: nextStudents,
    });
  };

  const handleSaveVisit = (
    visit: HomeVisitRecord,
    updatedAvatar?: string,
    openPdfAfter = false
  ) => {
    if (!db) return;
    const exists = db.visits.some((v) => v.studentId === visit.studentId);
    const nextVisits = exists
      ? db.visits.map((v) => (v.studentId === visit.studentId ? visit : v))
      : [...db.visits, visit];

    const nextStudents = updatedAvatar
      ? db.students.map((s) =>
          s.id === visit.studentId ? { ...s, avatarDataUrl: updatedAvatar } : s
        )
      : db.students;

    const nextSchedules = db.schedules.map((sch) =>
      sch.studentId === visit.studentId && sch.status !== 'cancelled'
        ? { ...sch, status: 'recorded' as const }
        : sch
    );

    persistDb({
      ...db,
      students: nextStudents,
      visits: nextVisits,
      schedules: nextSchedules,
    });

    setActiveVisitStudentId(null);

    if (openPdfAfter) {
      setPdfStudioInitMode('individual');
      setPdfStudioStudentId(visit.studentId);
      setActiveNav('pdf_studio');
    }
  };

  const handleSaveSchedule = (schedule: VisitSchedule) => {
    if (!db) return;
    const exists = db.schedules.some((s) => s.id === schedule.id);
    const nextSchedules = exists
      ? db.schedules.map((s) => (s.id === schedule.id ? schedule : s))
      : [...db.schedules, schedule];
    persistDb({ ...db, schedules: nextSchedules });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (!db) return;
    persistDb({
      ...db,
      schedules: db.schedules.filter((s) => s.id !== scheduleId),
    });
  };

  const handleMarkVisitCompleted = (scheduleId: string) => {
    if (!db) return;
    const target = db.schedules.find((s) => s.id === scheduleId);
    if (!target) return;
    const stu = db.students.find((s) => s.id === target.studentId);
    const cls = db.classes.find((c) => c.id === stu?.classId);
    const alreadyHasVisit = db.visits.some(
      (v) => v.studentId === target.studentId && v.status === 'completed'
    );

    const nextStatus = alreadyHasVisit ? ('recorded' as const) : ('completed_pending_record' as const);

    const nextSchedules = db.schedules.map((s) =>
      s.id === scheduleId
        ? {
            ...s,
            status: nextStatus,
            postVisitNotified: true,
            completedAt: new Date().toISOString(),
          }
        : s
    );

    const nextNotifications = [...db.notifications];
    if (!alreadyHasVisit && stu) {
      const promptNotif: AppNotification = {
        id: `notif-complete-${Date.now()}`,
        type: 'record_prompt',
        title: 'เยี่ยมบ้านเสร็จสิ้น · กรุณาบันทึกรายละเอียด',
        message: `คุณครูเยี่ยมบ้าน ${stu.prefix}${stu.firstName} ${stu.lastName} (${
          cls?.shortName || '-'
        }) เสร็จเรียบร้อยแล้ว กดเพื่อบันทึกภาพถ่าย พิกัด GPS และแบบฟอร์ม`,
        studentId: stu.id,
        scheduleId: target.id,
        createdAt: new Date().toISOString(),
        read: false,
        actionLabel: 'บันทึกผลการเยี่ยมบ้านทันที',
      };
      nextNotifications.unshift(promptNotif);
      fireBrowserNotification(promptNotif);
    }

    persistDb({
      ...db,
      schedules: nextSchedules,
      notifications: nextNotifications,
    });
  };

  const handleTriggerTestNotification = (type: 'upcoming_reminder' | 'record_prompt') => {
    if (!db) return;
    const sampleStudent =
      db.students.find((s) => !db.visits.some((v) => v.studentId === s.id)) || db.students[0];
    if (!sampleStudent) return;
    const cls = db.classes.find((c) => c.id === sampleStudent.classId);

    const newNotif: AppNotification =
      type === 'upcoming_reminder'
        ? {
            id: `notif-test-${Date.now()}`,
            type: 'upcoming_reminder',
            title: 'แจ้งเตือนล่วงหน้า: นัดเยี่ยมบ้านวันนี้ เวลา 16:30 น.',
            message: `เตรียมลงพื้นที่เยี่ยมบ้าน ${sampleStudent.prefix}${sampleStudent.firstName} ${sampleStudent.lastName} (${
              cls?.shortName || '-'
            }) ณ ${sampleStudent.address || 'บ้านพักนักเรียน'}`,
            studentId: sampleStudent.id,
            createdAt: new Date().toISOString(),
            read: false,
            actionLabel: 'เปิดแบบบันทึกเยี่ยมบ้าน',
          }
        : {
            id: `notif-test-${Date.now()}`,
            type: 'record_prompt',
            title: 'แจ้งเตือนหลังลงพื้นที่: บันทึกผลการเยี่ยมบ้าน',
            message: `การเยี่ยมบ้าน ${sampleStudent.prefix}${sampleStudent.firstName} ${sampleStudent.lastName} เสร็จสิ้นแล้ว กรุณาแนบภาพถ่ายบ้าน พิกัด GPS และลงลายมือชื่อ`,
            studentId: sampleStudent.id,
            createdAt: new Date().toISOString(),
            read: false,
            actionLabel: 'บันทึกผลการเยี่ยมบ้านทันที',
          };

    persistDb({
      ...db,
      notifications: [newNotif, ...db.notifications],
    });
    fireBrowserNotification(newNotif);
  };

  const handleMarkNotificationRead = (notifId: string) => {
    if (!db) return;
    persistDb({
      ...db,
      notifications: db.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    });
  };

  const handleMarkAllNotificationsRead = () => {
    if (!db) return;
    persistDb({
      ...db,
      notifications: db.notifications.map((n) => ({ ...n, read: true })),
    });
  };

  const handleSaveSettings = (nextSettings: SchoolSettings) => {
    if (!db) return;
    persistDb({ ...db, settings: nextSettings });
  };

  const handleSavePreset = (preset: PdfCustomLayoutConfig) => {
    if (!db) return;
    persistDb({
      ...db,
      pdfPresets: [...db.pdfPresets, preset],
    });
  };

  const unreadCount = useMemo(
    () => (db ? db.notifications.filter((n) => !n.read).length : 0),
    [db]
  );

  const activeModalStudent = useMemo(
    () => (db && activeVisitStudentId ? db.students.find((s) => s.id === activeVisitStudentId) : null),
    [db, activeVisitStudentId]
  );

  if (loading || !db) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
          <div className="space-y-2 pt-3">
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }[] = [
    {
      id: 'students',
      label: 'ทะเบียนนักเรียนและห้องเรียน',
      icon: Users,
      count: db.students.length,
    },
    {
      id: 'schedules',
      label: 'นัดหมายและแจ้งเตือนเยี่ยมบ้าน',
      icon: CalendarClock,
      count: db.schedules.filter((s) => s.status !== 'recorded' && s.status !== 'cancelled').length,
    },
    {
      id: 'summary',
      label: 'สรุปรายงานการเยี่ยมบ้าน (ข้อ 1–20)',
      icon: FileSpreadsheet,
    },
    {
      id: 'pdf_studio',
      label: 'ปรับแต่งและส่งออกไฟล์ PDF',
      icon: FileText,
    },
  ];

  const currentNavMeta = navItems.find((n) => n.id === activeNav) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col w-68 shrink-0 bg-slate-900 text-slate-200 border-r border-slate-800">
        <div className="px-6 py-5 border-b border-slate-800">
          <p className="text-base font-bold text-white tracking-tight">ระบบเยี่ยมบ้านนักเรียน</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{db.settings.schoolName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span className="text-[11px] font-mono-tabular opacity-80 shrink-0">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-200 truncate">{db.settings.teacherName}</p>
          <p className="truncate">
            ปีการศึกษา {db.settings.academicYear} · เยี่ยมแล้ว{' '}
            <span className="font-mono-tabular text-teal-400">
              {db.visits.filter((v) => v.status === 'completed').length}/{db.students.length}
            </span>{' '}
            คน
          </p>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 flex flex-col z-10">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">ระบบเยี่ยมบ้านนักเรียน</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                      active ? 'bg-teal-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract (Dashboard Header) */}
        <header className="no-print sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="เปิดเมนูนำทาง"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="text-slate-500 hidden sm:inline truncate">
                {db.settings.schoolName}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentNavMeta.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setNotifDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span>แจ้งเตือน</span>
              {unreadCount > 0 && (
                <span className="font-bold text-teal-700 font-mono-tabular">({unreadCount})</span>
              )}
            </button>

            {db.students.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const nextUnvisited =
                    db.students.find((s) => !db.visits.some((v) => v.studentId === s.id)) ||
                    db.students[0];
                  if (nextUnvisited) setActiveVisitStudentId(nextUnvisited.id);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                บันทึกเยี่ยมบ้านด่วน
              </button>
            )}
          </div>
        </header>

        {/* Live Triggered Notification Toast */}
        {liveToast && (
          <div className="no-print fixed bottom-5 right-5 z-40 max-w-sm w-full bg-slate-900 text-white rounded-xl border border-slate-700 p-4 shadow-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-teal-300">{liveToast.title}</p>
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{liveToast.message}</p>
            {liveToast.studentId && (
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sid = liveToast.studentId!;
                    handleMarkNotificationRead(liveToast.id);
                    setLiveToast(null);
                    setActiveVisitStudentId(sid);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 text-white hover:bg-teal-500"
                >
                  {liveToast.actionLabel || 'เปิดแบบบันทึกเยี่ยมบ้าน'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Viewport Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeNav === 'students' && (
            <StudentManager
              classes={db.classes}
              students={db.students}
              visits={db.visits}
              schedules={db.schedules}
              defaultTeacherName={db.settings.teacherName}
              defaultAcademicYear={db.settings.academicYear}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onOpenVisitForm={(sid) => setActiveVisitStudentId(sid)}
              onOpenScheduleModal={(sid) => {
                setPendingScheduleStudentId(sid);
                setActiveNav('schedules');
              }}
              onOpenPdfForStudent={(sid) => {
                setPdfStudioInitMode('individual');
                setPdfStudioStudentId(sid);
                setActiveNav('pdf_studio');
              }}
            />
          )}

          {activeNav === 'schedules' && (
            <VisitSchedulerAndNotifications
              classes={db.classes}
              students={db.students}
              visits={db.visits}
              schedules={db.schedules}
              notifications={db.notifications}
              initialStudentIdForModal={pendingScheduleStudentId}
              onClearInitialStudent={() => setPendingScheduleStudentId(null)}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onMarkVisitCompleted={handleMarkVisitCompleted}
              onTriggerTestNotification={handleTriggerTestNotification}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onOpenVisitForm={(sid) => setActiveVisitStudentId(sid)}
            />
          )}

          {activeNav === 'summary' && (
            <SummaryReportView
              settings={db.settings}
              classes={db.classes}
              students={db.students}
              visits={db.visits}
              onSaveSettings={handleSaveSettings}
              onOpenSummaryPdfStudio={(clsId) => {
                setPdfStudioInitMode('summary');
                setPdfStudioClassId(clsId);
                setActiveNav('pdf_studio');
              }}
              onOpenVisitForm={(sid) => setActiveVisitStudentId(sid)}
            />
          )}

          {activeNav === 'pdf_studio' && (
            <PdfExportStudio
              settings={db.settings}
              classes={db.classes}
              students={db.students}
              visits={db.visits}
              presets={db.pdfPresets}
              initialMode={pdfStudioInitMode}
              initialStudentId={pdfStudioStudentId}
              initialSummaryClassId={pdfStudioClassId}
              onSavePreset={handleSavePreset}
            />
          )}
        </main>
      </div>

      {/* Slide-over Notification Drawer */}
      {notifDrawerOpen && (
        <div className="no-print fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setNotifDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full border-l border-slate-200 flex flex-col z-10">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">ศูนย์การแจ้งเตือนการเยี่ยมบ้าน</h3>
                <p className="text-xs text-slate-500">
                  เตือนตารางนัดหมายล่วงหน้าและเตือนบันทึกผลหลังเยี่ยมบ้าน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setNotifDrawerOpen(false);
                  setActiveNav('schedules');
                }}
                className="font-medium text-teal-700 hover:underline"
              >
                จัดการตารางนัดหมายทั้งหมด →
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="text-slate-600 hover:text-slate-900"
                >
                  อ่านทั้งหมดแล้ว
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-5">
              {db.notifications.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500">ยังไม่มีรายการแจ้งเตือน</p>
              ) : (
                db.notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-4 space-y-1.5 ${!n.read ? 'bg-teal-50/30 -mx-5 px-5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                      <span className="text-[11px] text-slate-400 font-mono-tabular shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    {n.studentId && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleMarkNotificationRead(n.id);
                            setNotifDrawerOpen(false);
                            setActiveVisitStudentId(n.studentId!);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-700 text-white hover:bg-teal-800"
                        >
                          {n.actionLabel || 'บันทึกผลการเยี่ยมบ้าน'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Home Visit Form Modal */}
      {activeModalStudent && (
        <HomeVisitFormModal
          student={activeModalStudent}
          classroom={db.classes.find((c) => c.id === activeModalStudent.classId)}
          existingVisit={db.visits.find((v) => v.studentId === activeModalStudent.id)}
          settings={db.settings}
          onSave={(visit, avatar) => handleSaveVisit(visit, avatar, false)}
          onSaveAndExportPdf={(visit, avatar) => handleSaveVisit(visit, avatar, true)}
          onClose={() => setActiveVisitStudentId(null)}
        />
      )}
    </div>
  );
}
