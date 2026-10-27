import React from 'react';
import {
  AGENCY_SUPPORT_OPTIONS,
  DEPENDENCY_OPTIONS,
  ELECTRONIC_USAGE_OPTIONS,
  FAMILY_MEMBER_ROWS,
  FAMILY_RELATION_LEVELS,
  FARMING_LAND_OPTIONS,
  formatNum,
  GAMING_RISK_OPTIONS,
  HEALTH_RISK_OPTIONS,
  HOBBY_OPTIONS,
  HOUSEHOLD_CHORE_OPTIONS,
  HOUSING_CONDITION_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  INFORMANT_OPTIONS,
  LEAVE_CHILD_OPTIONS,
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
  IndividualSectionId,
  PdfCustomLayoutConfig,
  SchoolSettings,
  StudentRecord,
  SummarySectionId,
} from '../types/homeVisit';
import {
  calcHouseholdTotals,
  calcMemberMonthlyTotal,
  computeSummaryStatistics,
} from '../utils/summaryAnalytics';
import { GarudaMemoEmblemSvg, ObecEmblemSvg } from './OfficialEmblems';

const BoxMark: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => (
  <span className="inline-flex items-start gap-1.5 leading-snug">
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-800 text-[10px] font-bold leading-none mt-0.5 shrink-0">
      {checked ? '✓' : ''}
    </span>
    <span>{label}</span>
  </span>
);

const RadioMark: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => (
  <span className="inline-flex items-center gap-1.5 leading-snug">
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-800 shrink-0">
      {checked && <span className="w-2 h-2 rounded-full bg-slate-900 block" />}
    </span>
    <span>{label}</span>
  </span>
);

const CitizenIdBoxes: React.FC<{
  cid: string;
  masked: boolean;
  numStyle: 'thai' | 'arabic';
}> = ({ cid, masked, numStyle }) => {
  const clean = (cid || '').replace(/\D/g, '').padEnd(13, ' ');
  const chars = clean.slice(0, 13).split('');
  const displayChars = chars.map((ch, idx) => {
    if (ch === ' ') return '';
    if (masked && idx >= 5 && idx <= 9) return '•';
    return formatNum(ch, numStyle);
  });

  const groups = [
    [0],
    [1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11],
    [12],
  ];

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {groups.map((grp, gIdx) => (
        <React.Fragment key={gIdx}>
          <span className="inline-flex">
            {grp.map((idx) => (
              <span
                key={idx}
                className="w-4 h-5 border border-slate-700 -ml-px first:ml-0 inline-flex items-center justify-center text-[11px] font-semibold leading-none"
              >
                {displayChars[idx]}
              </span>
            ))}
          </span>
          {gIdx < groups.length - 1 && <span className="text-xs">-</span>}
        </React.Fragment>
      ))}
    </span>
  );
};

interface IndividualPdfPagesProps {
  student: StudentRecord;
  classroom?: ClassroomGroup;
  visit?: HomeVisitRecord;
  settings: SchoolSettings;
  layoutConfig: PdfCustomLayoutConfig;
}

export const IndividualPdfPages: React.FC<IndividualPdfPagesProps> = ({
  student,
  classroom,
  visit: propVisit,
  settings,
  layoutConfig,
}) => {
  const visit =
    propVisit ||
    createBlankHomeVisit(
      student.id,
      classroom?.homeroomTeacher || settings.teacherName,
      settings.teacherPosition
    );

  const numStyle = layoutConfig.numeralStyle;
  const n = (val: string | number) => formatNum(val, numStyle);
  const totals = calcHouseholdTotals(visit);

  const fontSizeClass =
    layoutConfig.fontScale === 'compact'
      ? 'text-[11px]'
      : layoutConfig.fontScale === 'large'
      ? 'text-[13.5px]'
      : 'text-[12px]';

  const pageClass =
    layoutConfig.orientation === 'landscape' ? 'a4-page-landscape' : 'a4-page';

  // Render individual modular blocks
  const renderBlock = (id: IndividualSectionId) => {
    switch (id) {
      case 'header_student_guardian':
        return (
          <div key={id} className="space-y-2.5">
            <div className="text-[11px] text-slate-700 space-y-0.5 pb-1">
              <p className="font-bold text-slate-900">คำชี้แจง :</p>
              <p className="pl-4">
                • แบบบันทึกการเยี่ยมบ้านฉบับนี้รวมการคัดกรองนักเรียนยากจนเข้าด้วยกัน เพื่อให้คุณครูสามารถลงพื้นที่ได้พร้อมกันในครั้งเดียว
              </p>
              <p className="pl-4">
                • การตอบแบบสอบถาม : หากเป็นตัวเลือก ○ หมายถึง ให้ตอบเพียงข้อเดียว และ หากเป็นตัวเลือก ☐ หมายถึง ให้ตอบได้มากกว่า 1 ข้อ
              </p>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    โรงเรียน <strong className="border-b border-dotted border-slate-500 px-2">{settings.schoolName}</strong>
                  </span>
                  <span>
                    สพป./สพม. <strong className="border-b border-dotted border-slate-500 px-2">{settings.educationArea}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    {n(1)}. ชื่อนักเรียน{' '}
                    <strong className="border-b border-dotted border-slate-500 px-2">
                      {student.prefix}
                      {student.firstName}
                    </strong>
                  </span>
                  <span>
                    นามสกุล{' '}
                    <strong className="border-b border-dotted border-slate-500 px-2">
                      {student.lastName}
                    </strong>
                  </span>
                  <span>
                    ชั้น{' '}
                    <strong className="border-b border-dotted border-slate-500 px-2">
                      {classroom?.shortName || classroom?.name || '-'}
                    </strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="pl-3">เลขที่บัตรประชาชน</span>
                  <CitizenIdBoxes
                    cid={student.citizenId}
                    masked={layoutConfig.showCitizenIdMask}
                    numStyle={numStyle}
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      {n(2)}. ชื่อผู้ปกครองนักเรียน{' '}
                      <strong className="border-b border-dotted border-slate-500 px-2">
                        {visit.noGuardian ? '-' : visit.guardianFirstName || '-'}
                      </strong>
                    </span>
                    <span>
                      นามสกุล{' '}
                      <strong className="border-b border-dotted border-slate-500 px-2">
                        {visit.noGuardian ? '-' : visit.guardianLastName || '-'}
                      </strong>
                    </span>
                    <span>
                      เบอร์โทรศัพท์{' '}
                      <strong className="border-b border-dotted border-slate-500 px-2">
                        {visit.noGuardian ? '-' : n(visit.guardianPhone || '-')}
                      </strong>
                    </span>
                    <RadioMark checked={visit.noGuardian} label="ไม่มีผู้ปกครอง" />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-3">
                    <span>
                      ความสัมพันธ์กับนักเรียน{' '}
                      <strong className="border-b border-dotted border-slate-500 px-2">
                        {visit.guardianRelation || '-'}
                      </strong>
                    </span>
                    <span>
                      อาชีพ{' '}
                      <strong className="border-b border-dotted border-slate-500 px-2">
                        {visit.guardianOccupation || '-'}
                      </strong>
                    </span>
                    <span>
                      การศึกษาสูงสุด{' '}
                      <strong className="border-b border-dotted border-slate-500 px-2">
                        {visit.guardianEducation || '-'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pl-3">
                    <span>เลขที่บัตรประชาชน</span>
                    <CitizenIdBoxes
                      cid={visit.noGuardianCitizenId ? '' : visit.guardianCitizenId}
                      masked={layoutConfig.showCitizenIdMask}
                      numStyle={numStyle}
                    />
                    <RadioMark
                      checked={visit.noGuardianCitizenId}
                      label="ไม่มีบัตรประจำตัวประชาชน"
                    />
                  </div>

                  <div className="pl-3">
                    <RadioMark
                      checked={visit.stateWelfareRegistered}
                      label="เคยลงทะเบียนเพื่อสวัสดิการแห่งรัฐ (ลงทะเบียนคนจน)"
                    />
                  </div>
                </div>
              </div>

              {/* Student Portrait Frame */}
              <div className="w-24 h-30 border border-slate-800 shrink-0 flex flex-col items-center justify-center overflow-hidden bg-slate-50">
                {student.avatarDataUrl ? (
                  <img
                    src={student.avatarDataUrl}
                    alt="รูปถ่ายนักเรียน"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[11px] text-slate-600 leading-tight p-2">
                    <p>รูปถ่าย</p>
                    <p className="mt-2">นักเรียน</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'household_income_table': {
        const paddedRows = Array.from({ length: 10 }, (_, idx) => visit.householdMembers[idx]);
        return (
          <div key={id} className="space-y-1.5">
            <p>
              {n(3)}. จำนวนสมาชิกในครัวเรือน (รวมตัวนักเรียน){' '}
              <strong className="border-b border-dotted border-slate-600 px-3">
                {n(visit.householdMemberCount)}
              </strong>{' '}
              คน มีรายละเอียดดังนี้ (กรอกเฉพาะนักเรียนยากจนเท่านั้น)
            </p>

            <table className="w-full border-collapse border border-slate-800 text-[10.5px]">
              <thead>
                <tr className="bg-slate-50">
                  <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-8">
                    คนที่
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-1.5 py-1 text-center">
                    ความสัมพันธ์กับนักเรียน
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-9">
                    อายุ
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-16">
                    ความพิการทางร่างกาย/สติปัญญา (✓ หรือ -)
                  </th>
                  <th colSpan={5} className="border border-slate-800 px-1 py-1 text-center">
                    รายได้เฉลี่ยต่อเดือนแยกตามประเภท (บาท/เดือน)
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-18">
                    รายได้รวมเฉลี่ยต่อเดือน
                  </th>
                </tr>
                <tr className="bg-slate-50 text-[9.5px]">
                  <th className="border border-slate-800 px-1 py-1 text-center">ค่าจ้าง เงินเดือน</th>
                  <th className="border border-slate-800 px-1 py-1 text-center">
                    อาชีพเกษตร (หลังหักค่าใช้จ่าย)
                  </th>
                  <th className="border border-slate-800 px-1 py-1 text-center">
                    ธุรกิจส่วนตัว (หลังหักค่าใช้จ่าย)
                  </th>
                  <th className="border border-slate-800 px-1 py-1 text-center">
                    สวัสดิการจากรัฐ/เอกชน
                  </th>
                  <th className="border border-slate-800 px-1 py-1 text-center">
                    รายได้จากแหล่งอื่น
                  </th>
                </tr>
              </thead>
              <tbody>
                {paddedRows.map((row, idx) => {
                  const rowSum = row ? calcMemberMonthlyTotal(row) : 0;
                  const showRow = visit.isPoorScreening && row && (row.relation || rowSum > 0);
                  return (
                    <tr key={idx} className="h-5">
                      <td className="border border-slate-800 text-center">{n(idx + 1)}</td>
                      <td className="border border-slate-800 px-1.5">
                        {showRow ? row.relation : ''}
                      </td>
                      <td className="border border-slate-800 text-center">
                        {showRow && row.age ? n(row.age) : ''}
                      </td>
                      <td className="border border-slate-800 text-center">
                        {showRow ? (row.hasDisability ? '✓' : '-') : ''}
                      </td>
                      <td className="border border-slate-800 px-1 text-right">
                        {showRow && row.incomeSalary ? n(row.incomeSalary.toLocaleString()) : ''}
                      </td>
                      <td className="border border-slate-800 px-1 text-right">
                        {showRow && row.incomeAgriculture
                          ? n(row.incomeAgriculture.toLocaleString())
                          : ''}
                      </td>
                      <td className="border border-slate-800 px-1 text-right">
                        {showRow && row.incomeBusiness
                          ? n(row.incomeBusiness.toLocaleString())
                          : ''}
                      </td>
                      <td className="border border-slate-800 px-1 text-right">
                        {showRow && row.incomeWelfare
                          ? n(row.incomeWelfare.toLocaleString())
                          : ''}
                      </td>
                      <td className="border border-slate-800 px-1 text-right">
                        {showRow && row.incomeOther ? n(row.incomeOther.toLocaleString()) : ''}
                      </td>
                      <td className="border border-slate-800 px-1 text-right font-semibold">
                        {showRow ? n(rowSum.toLocaleString()) : ''}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-slate-50/60">
                  <td colSpan={9} className="border border-slate-800 px-2 py-1">
                    รวมรายได้ครัวเรือน (รายการที่ {n(1)} - {n(10)})
                  </td>
                  <td className="border border-slate-800 px-1.5 py-1 text-right">
                    {visit.isPoorScreening ? n(totals.totalMonthly.toLocaleString()) : '-'}
                  </td>
                </tr>
                <tr className="font-bold bg-slate-50/60">
                  <td colSpan={9} className="border border-slate-800 px-2 py-1">
                    รายได้ครัวเรือนเฉลี่ยต่อคน (รวมรายได้ครัวเรือน หารด้วยจำนวนสมาชิกทั้งหมด)
                  </td>
                  <td className="border border-slate-800 px-1.5 py-1 text-right">
                    {visit.isPoorScreening ? n(totals.avgPerPerson.toLocaleString()) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }

      case 'household_status':
        return (
          <div key={id} className="space-y-1.5">
            <p className="font-bold">
              {n(4)}. สถานะของครัวเรือน กรอกเฉพาะบุคคลที่อาศัยในบ้านปัจจุบัน
            </p>
            <div className="pl-3 space-y-1.5">
              <div>
                <span className="font-medium">{n('4.1')}. ครัวเรือนมีภาระพึ่งพิง ดังนี้</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-4 pt-0.5">
                  {DEPENDENCY_OPTIONS.map((opt) => (
                    <BoxMark
                      key={opt}
                      checked={visit.dependencyFlags.includes(opt)}
                      label={opt}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="font-medium">{n('4.2')}. ประเภทที่อยู่อาศัย ดังนี้</span>
                {HOUSING_TYPE_OPTIONS.map((opt) => (
                  <RadioMark
                    key={opt.value}
                    checked={visit.housingType === opt.value}
                    label={opt.label}
                  />
                ))}
              </div>

              <div>
                <span className="font-medium">{n('4.3')}. สภาพที่อยู่อาศัย ดังนี้</span>
                <div className="space-y-0.5 pl-4 pt-0.5">
                  {HOUSING_CONDITION_OPTIONS.map((opt) => (
                    <div key={opt}>
                      <BoxMark
                        checked={visit.housingConditions.includes(opt)}
                        label={opt}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-medium">{n('4.4')}. ยานพาหนะของครอบครัว</span>
                <div className="pl-4 space-y-0.5 max-w-lg">
                  {[
                    { label: 'รถยนต์ส่วนบุคคล', val: visit.vehicleCar },
                    { label: 'รถปิกอัพ/รถบรรทุกเล็ก/รถตู้', val: visit.vehiclePickup },
                    {
                      label: 'รถไถ/เกี่ยวข้าว/รถอีแต๋น/รถอื่นๆ ประเภทเดียวกัน',
                      val: visit.vehicleTractor,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <span>- {item.label}</span>
                      <span className="inline-flex items-center gap-4">
                        <RadioMark checked={item.val === true} label="มี" />
                        <RadioMark checked={item.val === false} label="ไม่มี" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="font-medium">{n('4.5')}. เป็นเกษตรกร มีที่ดินทำกิน (รวมเช่า)</span>
                {FARMING_LAND_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.farmingLandFlags.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'family_relationship':
        return (
          <div key={id} className="space-y-2">
            <p className="font-bold">{n(5)}. ความสัมพันธ์ในครอบครัว</p>
            <div className="pl-3 space-y-2">
              <p>
                {n('5.1')}. สมาชิกในครอบครัวมีเวลาอยู่ร่วมกัน{' '}
                <strong className="border-b border-dotted border-slate-600 px-3">
                  {n(visit.hoursTogetherPerDay || '-')}
                </strong>{' '}
                ชั่วโมง/วัน ({visit.familyAtmosphere === 'warm' ? 'ครอบครัวอบอุ่น' : 'ครอบครัวแตกแยก'})
              </p>

              <div className="space-y-1">
                <p>{n('5.2')}. ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว</p>
                <table className="w-full border-collapse border border-slate-800 text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-800 px-2 py-1 text-left">สมาชิก</th>
                      {FAMILY_RELATION_LEVELS.map((lvl) => (
                        <th key={lvl} className="border border-slate-800 px-2 py-1 text-center w-16">
                          {lvl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FAMILY_MEMBER_ROWS.map((row) => (
                      <tr key={row.key}>
                        <td className="border border-slate-800 px-2 py-0.5">
                          {row.label}
                          {row.key === 'other' && visit.relationOtherLabel
                            ? ` (${visit.relationOtherLabel})`
                            : ''}
                        </td>
                        {FAMILY_RELATION_LEVELS.map((lvl) => (
                          <td key={lvl} className="border border-slate-800 text-center py-0.5">
                            {visit.relations[row.key] === lvl ? '✓' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1">
                <p>
                  {n('5.3')}. กรณีที่ผู้ปกครองไม่อยู่บ้านฝากเด็กนักเรียนอยู่บ้านกับใคร (ตอบเพียง {n(1)} ข้อ)
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pl-3">
                  {LEAVE_CHILD_OPTIONS.map((opt) => (
                    <RadioMark
                      key={opt.value}
                      checked={visit.leaveChildWith === opt.value}
                      label={
                        opt.value === 'other' && visit.leaveChildOther
                          ? `${opt.label} ระบุ ${visit.leaveChildOther}`
                          : opt.label
                      }
                    />
                  ))}
                </div>
              </div>

              <p>
                {n('5.4')}. รายได้ครัวเรือนเฉลี่ยต่อคน{' '}
                <strong className="border-b border-dotted border-slate-600 px-3">
                  {!visit.isPoorScreening
                    ? n((visit.nonPoorAvgMonthlyIncomePerPerson || 0).toLocaleString())
                    : '-'}
                </strong>{' '}
                บาท (กรณีนักเรียนไม่ยากจน)
              </p>

              <p>
                {n('5.5')}. นักเรียนได้รับค่าใช้จ่ายจาก{' '}
                <strong className="border-b border-dotted border-slate-600 px-2">
                  {visit.studentExpenseFrom || '-'}
                </strong>{' '}
                อาชีพพิเศษ{' '}
                <strong className="border-b border-dotted border-slate-600 px-2">
                  {visit.studentPartTimeJob || '-'}
                </strong>{' '}
                รายได้วันละ{' '}
                <strong className="border-b border-dotted border-slate-600 px-2">
                  {n(visit.studentDailyEarned || 0)}
                </strong>{' '}
                บาท ได้เงินมาโรงเรียนวันละ{' '}
                <strong className="border-b border-dotted border-slate-600 px-2">
                  {n(visit.studentDailyAllowance || 0)}
                </strong>{' '}
                บาท
              </p>

              <div>
                <p>{n('5.6')}. สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pl-3 pt-0.5">
                  {SCHOOL_SUPPORT_OPTIONS.map((opt) => (
                    <BoxMark
                      key={opt}
                      checked={visit.schoolSupportNeeded.includes(opt)}
                      label={
                        opt === 'อื่นๆ' && visit.schoolSupportOther
                          ? `อื่นๆ (${visit.schoolSupportOther})`
                          : opt
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <p>{n('5.7')}. ความช่วยเหลือที่ครอบครัวเคยได้รับจากหน่วยงานหรือต้องการได้รับการช่วยเหลือ</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pl-3 pt-0.5">
                  {AGENCY_SUPPORT_OPTIONS.map((opt) => (
                    <BoxMark
                      key={opt}
                      checked={visit.agencySupportReceived.includes(opt)}
                      label={
                        opt === 'อื่นๆ' && visit.agencySupportOther
                          ? `อื่นๆ (${visit.agencySupportOther})`
                          : opt
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <p>{n('5.8')}. ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน</p>
                <p className="border-b border-dotted border-slate-500 min-h-[22px] px-2 text-slate-800">
                  {visit.parentConcerns || '-'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'health_safety_travel':
        return (
          <div key={id} className="space-y-2">
            <p className="font-bold">{n(6)}. พฤติกรรมและความเสี่ยง</p>
            <div className="pl-3 space-y-2">
              <div>
                <p className="font-medium">{n('6.1')}. สุขภาพ</p>
                <div className="grid grid-cols-3 gap-x-3 gap-y-1 pl-3 pt-0.5">
                  {HEALTH_RISK_OPTIONS.map((opt) => (
                    <BoxMark
                      key={opt}
                      checked={visit.healthRisks.includes(opt)}
                      label={opt}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="font-medium">{n('6.2')}. สวัสดิการหรือความปลอดภัย</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-3 pt-0.5">
                  {WELFARE_SAFETY_OPTIONS.map((opt) => (
                    <BoxMark
                      key={opt}
                      checked={visit.welfareSafetyRisks.includes(opt)}
                      label={opt}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p>
                  {n('6.3')}. ระยะทางระหว่างบ้านไปโรงเรียน (ไป/กลับ){' '}
                  <strong className="border-b border-dotted border-slate-600 px-2">
                    {n(visit.distanceKm || '0')}
                  </strong>{' '}
                  กิโลเมตร ใช้เวลาเดินทาง{' '}
                  <strong className="border-b border-dotted border-slate-600 px-2">
                    {n(visit.travelHours || '0')}
                  </strong>{' '}
                  ชม.{' '}
                  <strong className="border-b border-dotted border-slate-600 px-2">
                    {n(visit.travelMinutes || '0')}
                  </strong>{' '}
                  นาที
                </p>
                <p className="pl-3">การเดินทางของนักเรียนไปโรงเรียน (ตอบเพียง {n(1)} ข้อ)</p>
                <div className="grid grid-cols-4 gap-x-3 gap-y-1 pl-3">
                  {TRAVEL_MODE_OPTIONS.map((mode) => (
                    <RadioMark
                      key={mode}
                      checked={visit.travelMode === mode}
                      label={
                        mode === 'อื่นๆ' && visit.travelModeOther
                          ? `อื่นๆ (${visit.travelModeOther})`
                          : mode
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'behavior_risk_factors':
        return (
          <div key={id} className="space-y-2 pl-3">
            <div>
              <p className="font-medium">
                {n('6.4')}. ภาระงานความรับผิดชอบของนักเรียนที่มีต่อครอบครัว
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3 pt-0.5">
                {HOUSEHOLD_CHORE_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.householdChores.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.5')}. กิจกรรมยามว่างหรืองานอดิเรก</p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 pl-3 pt-0.5">
                {HOBBY_OPTIONS.map((opt) => (
                  <BoxMark key={opt} checked={visit.hobbies.includes(opt)} label={opt} />
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.6')}. พฤติกรรมการใช้สารเสพติด</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-3 pt-0.5">
                {SUBSTANCE_RISK_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.substanceRisks.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.7')}. พฤติกรรมการใช้ความรุนแรง</p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 pl-3 pt-0.5">
                {VIOLENCE_RISK_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.violenceRisks.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.8')}. พฤติกรรมทางเพศ</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-3 pt-0.5">
                {SEXUAL_RISK_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.sexualRisks.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.9')}. การติดเกม</p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 pl-3 pt-0.5">
                {GAMING_RISK_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.gamingRisks.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.10')}. การเข้าถึงสื่อคอมพิวเตอร์และอินเทอร์เน็ตที่บ้าน</p>
              <div className="flex flex-wrap gap-6 pl-3 pt-0.5">
                <BoxMark
                  checked={visit.internetAccess === 'can_access'}
                  label="สามารถเข้าถึง Internet ได้จากที่บ้าน"
                />
                <BoxMark
                  checked={visit.internetAccess === 'cannot_access'}
                  label="ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน"
                />
              </div>
            </div>

            <div>
              <p className="font-medium">{n('6.11')}. การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-3 pt-0.5">
                {ELECTRONIC_USAGE_OPTIONS.map((opt) => (
                  <BoxMark
                    key={opt}
                    checked={visit.electronicDeviceUsage.includes(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'informant_signature':
        return (
          <div key={id} className="space-y-3 pt-2">
            <div>
              <p className="font-bold">ผู้ให้ข้อมูลนักเรียน</p>
              <div className="grid grid-cols-6 gap-y-1 gap-x-2 pl-4 pt-1">
                {INFORMANT_OPTIONS.map((inf) => (
                  <RadioMark
                    key={inf}
                    checked={visit.informantRelation === inf}
                    label={inf}
                  />
                ))}
              </div>
            </div>

            {layoutConfig.showSignatures && (
              <div className="flex justify-end pt-2">
                <div className="text-center space-y-1 w-72">
                  <p>ขอรับรองว่าข้อมูลดังกล่าวเป็นจริง</p>
                  {visit.informantSignatureDataUrl ? (
                    <img
                      src={visit.informantSignatureDataUrl}
                      alt="ลายมือชื่อผู้ปกครอง"
                      className="h-10 mx-auto object-contain"
                    />
                  ) : (
                    <div className="h-7" />
                  )}
                  <p>
                    ลงชื่อผู้ปกครอง/ผู้แทน........................................................
                  </p>
                  <p>
                    ( {visit.informantFullName || '........................................................'} )
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'gps_location_card':
        if (!layoutConfig.showGpsCoordinates) return null;
        return (
          <div
            key={id}
            className="border border-slate-700 rounded p-2.5 bg-slate-50/60 flex items-center justify-between gap-4 text-[11px]"
          >
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">
                พิกัดตำแหน่งบ้านนักเรียน (GPS Coordinates)
              </p>
              {visit.gps ? (
                <>
                  <p className="font-mono-tabular">
                    ละติจูด (Lat): <strong>{visit.gps.lat.toFixed(6)}</strong> · ลองจิจูด (Lng):{' '}
                    <strong>{visit.gps.lng.toFixed(6)}</strong>
                    {visit.gps.accuracy ? ` · ความแม่นยำ ±${visit.gps.accuracy} ม.` : ''}
                  </p>
                  <p className="text-slate-600">
                    จุดสังเกต/ที่อยู่: {visit.gps.addressNote || student.address || '-'}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">ยังไม่ได้บันทึกค่าพิกัดจีพีเอส</p>
              )}
            </div>
            {visit.gps && (
              <div className="text-right font-mono-tabular text-[10px] text-slate-600 shrink-0">
                <p>maps.google.com</p>
                <p>
                  ?q={visit.gps.lat.toFixed(5)},{visit.gps.lng.toFixed(5)}
                </p>
              </div>
            )}
          </div>
        );

      case 'house_photos_signoff':
        return (
          <div key={id} className="space-y-3">
            <div className="text-center font-bold text-sm">
              ภาพถ่ายบ้านนักเรียนที่ได้รับการเยี่ยมบ้าน
            </div>

            <p>
              <strong>ชื่อ - นามสกุลนักเรียน</strong>{' '}
              <span className="border-b border-dotted border-slate-600 px-4">
                {student.prefix}
                {student.firstName} {student.lastName} (ชั้น {classroom?.shortName || '-'})
              </span>
            </p>

            <div className="space-y-1">
              <p className="font-medium">กรุณาระบุ ภาพถ่ายที่แนบมาคือ</p>
              <div className="pl-6 space-y-1">
                {PHOTO_ATTACHMENT_TYPES.map((pt) => (
                  <div key={pt.value}>
                    <BoxMark
                      checked={visit.photoAttachmentType === pt.value}
                      label={pt.label}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-center font-bold">รูปที่ {n(1)} ภาพถ่ายสภาพบ้านนักเรียน</p>
              <div className="w-full h-[58mm] border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-50">
                {visit.photoExteriorDataUrl ? (
                  <img
                    src={visit.photoExteriorDataUrl}
                    alt="ภาพถ่ายสภาพบ้านนักเรียน"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-500 text-xs">มีหลังคาและฝาบ้านด้วย</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-center font-bold">รูปที่ {n(2)} ภาพถ่ายภายในบ้านนักเรียน</p>
              <div className="w-full h-[58mm] border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-50">
                {visit.photoInteriorDataUrl ? (
                  <img
                    src={visit.photoInteriorDataUrl}
                    alt="ภาพถ่ายภายในบ้านนักเรียน"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-500 text-xs">ภาพถ่ายภายในบ้านนักเรียน</span>
                )}
              </div>
            </div>

            {layoutConfig.showSignatures && (
              <div className="border border-slate-800 p-3 mt-2">
                <p className="font-bold">
                  ขอรับรองว่าข้อมูล และภาพถ่ายบ้านของนักเรียนเป็นความจริง
                </p>
                <div className="pl-28 space-y-1 pt-2">
                  {visit.teacherSignatureDataUrl && (
                    <img
                      src={visit.teacherSignatureDataUrl}
                      alt="ลายมือชื่อครู"
                      className="h-9 object-contain ml-14"
                    />
                  )}
                  <p>(ลงชื่อ)....................................................................................</p>
                  <p>
                    ( {visit.signoffTeacherName || settings.teacherName} )
                  </p>
                  <p>
                    ตำแหน่ง{' '}
                    <span className="border-b border-dotted border-slate-600 px-4">
                      {visit.signoffTeacherPosition || settings.teacherPosition}
                    </span>{' '}
                    (ครูหรือผู้อำนวยการโรงเรียน)
                  </p>
                  <p>
                    วันที่{' '}
                    <span className="border-b border-dotted border-slate-600 px-3">
                      {n(visit.signoffDay || '-')}
                    </span>{' '}
                    เดือน{' '}
                    <span className="border-b border-dotted border-slate-600 px-4">
                      {visit.signoffMonth || '-'}
                    </span>{' '}
                    พ.ศ.{' '}
                    <span className="border-b border-dotted border-slate-600 px-3">
                      {n(visit.signoffYear || settings.academicYear)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const enabledSections = layoutConfig.individualSections.filter((s) => s.enabled);

  // If official paginated 4-page layout is chosen AND default order is used, group into crisp official pages;
  // Otherwise, paginate dynamically according to the user's custom section order!
  const pageGroups: IndividualSectionId[][] = [];

  if (layoutConfig.flowMode === 'official_paginated') {
    const groupDefs: IndividualSectionId[][] = [
      ['header_student_guardian', 'household_income_table', 'household_status'],
      ['family_relationship', 'health_safety_travel'],
      ['behavior_risk_factors', 'informant_signature'],
      ['gps_location_card', 'house_photos_signoff'],
    ];
    const orderIndex = new Map(enabledSections.map((s, idx) => [s.id, idx]));

    // Check if user reordered sections relative to default
    const defaultIds = [
      'header_student_guardian',
      'household_income_table',
      'household_status',
      'family_relationship',
      'health_safety_travel',
      'behavior_risk_factors',
      'informant_signature',
      'gps_location_card',
      'house_photos_signoff',
    ];
    const enabledIds = enabledSections.map((s) => s.id);
    const isStandardOrder = enabledIds.every((id, i) => {
      if (i === 0) return true;
      return defaultIds.indexOf(enabledIds[i - 1]) < defaultIds.indexOf(id);
    });

    if (isStandardOrder) {
      for (const grp of groupDefs) {
        const active = grp.filter((id) => orderIndex.has(id));
        if (active.length > 0) pageGroups.push(active);
      }
    } else {
      // Custom order pagination (2-3 sections per A4 page)
      let current: IndividualSectionId[] = [];
      for (const sec of enabledSections) {
        if (sec.id === 'house_photos_signoff') {
          if (current.length > 0) pageGroups.push(current);
          pageGroups.push([sec.id]);
          current = [];
        } else {
          current.push(sec.id);
          if (current.length >= 2) {
            pageGroups.push(current);
            current = [];
          }
        }
      }
      if (current.length > 0) pageGroups.push(current);
    }
  } else {
    // Continuous compact mode: pack up to 3 sections per sheet, keeping house_photos_signoff cleanly framed
    let current: IndividualSectionId[] = [];
    for (const sec of enabledSections) {
      if (sec.id === 'house_photos_signoff' && current.length >= 2) {
        pageGroups.push(current);
        current = [sec.id];
      } else {
        current.push(sec.id);
        if (current.length >= 3) {
          pageGroups.push(current);
          current = [];
        }
      }
    }
    if (current.length > 0) pageGroups.push(current);
  }

  return (
    <>
      {pageGroups.map((group, pIdx) => (
        <div
          key={pIdx}
          data-pdf-page="true"
          className={`${pageClass} ${fontSizeClass} p-[14mm] flex flex-col justify-between shadow-sm border border-slate-200 mx-auto`}
        >
          <div className="space-y-3">
            {/* Official Page Top Header */}
            <div className="relative pb-2 border-b border-slate-900 flex items-center justify-center">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                บันทึกการเยี่ยมบ้าน
              </h1>
              <span className="absolute right-0 top-1 text-xs text-slate-700">
                หน้า {n(pIdx + 1)}/{n(pageGroups.length)}
              </span>
            </div>

            {/* Sections */}
            <div className="space-y-3.5">{group.map((secId) => renderBlock(secId))}</div>
          </div>
        </div>
      ))}
    </>
  );
};

interface SummaryPdfPagesProps {
  settings: SchoolSettings;
  classes: ClassroomGroup[];
  students: StudentRecord[];
  visits: HomeVisitRecord[];
  selectedClassId: string;
  layoutConfig: PdfCustomLayoutConfig;
}

export const SummaryPdfPages: React.FC<SummaryPdfPagesProps> = ({
  settings,
  classes,
  students,
  visits,
  selectedClassId,
  layoutConfig,
}) => {
  const targetStudents =
    selectedClassId === 'all'
      ? students
      : students.filter((s) => s.classId === selectedClassId);

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const classTitle = selectedClassObj
    ? `ระดับชั้น${selectedClassObj.name}`
    : 'รวมทุกระดับชั้นเรียน';
  const shortClassTitle = selectedClassObj ? selectedClassObj.name : 'ทุกระดับชั้น';
  const teacherDisplay = selectedClassObj?.homeroomTeacher || settings.teacherName;

  const stats = computeSummaryStatistics(targetStudents, visits);
  const numStyle = layoutConfig.numeralStyle;
  const n = (val: string | number) => formatNum(val, numStyle);

  const pageClass =
    layoutConfig.orientation === 'landscape' ? 'a4-page-landscape' : 'a4-page';

  const visitMap = new Map<string, HomeVisitRecord>();
  visits.forEach((v) => {
    if (v.status === 'completed') visitMap.set(v.studentId, v);
  });

  const enabledSections = layoutConfig.summarySections.filter((s) => s.enabled);

  const renderSummaryPage = (secId: SummarySectionId, idx: number) => {
    switch (secId) {
      case 'cover_page':
        return (
          <div
            key={secId}
            data-pdf-page="true"
            className={`${pageClass} p-[22mm] flex flex-col items-center justify-between text-center shadow-sm border border-slate-200 mx-auto`}
          >
            <div className="pt-4 flex flex-col items-center space-y-5">
              <ObecEmblemSvg className="w-24 h-28" />
              <div className="space-y-2.5 pt-2">
                <h1 className="text-3xl font-bold text-slate-900">รายงานสรุปการเยี่ยมบ้าน</h1>
                <p className="text-xl font-bold text-slate-800">{classTitle}</p>
                <p className="text-xl font-bold text-slate-800">
                  ปีการศึกษา {n(settings.academicYear)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xl font-bold text-slate-900">{teacherDisplay}</p>
              <p className="text-base font-semibold text-slate-800">
                ตำแหน่ง {settings.teacherPosition}
              </p>
            </div>

            <div className="space-y-1.5 pb-4 text-base font-bold text-slate-900">
              <p>{settings.schoolName}</p>
              <p>{settings.educationArea}</p>
              <p>สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ</p>
            </div>
          </div>
        );

      case 'official_memo':
        return (
          <div
            key={secId}
            data-pdf-page="true"
            className={`${pageClass} p-[20mm] text-[15px] leading-relaxed flex flex-col justify-between shadow-sm border border-slate-200 mx-auto`}
          >
            <div className="space-y-5">
              {/* Garuda + บันทึกข้อความ */}
              <div className="relative flex items-end justify-center pb-2">
                <div className="absolute left-0 bottom-0">
                  <GarudaMemoEmblemSvg className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">บันทึกข้อความ</h2>
              </div>

              <div className="space-y-1.5 border-b border-slate-900 pb-3">
                <p>
                  <strong>ส่วนราชการ</strong>&nbsp;&nbsp;{settings.schoolName}
                </p>
                <div className="flex items-center justify-between gap-4">
                  <p>
                    <strong>ที่</strong>&nbsp;&nbsp;{n(settings.memoNumber)}
                  </p>
                  <p>
                    <strong>วันที่</strong>&nbsp;&nbsp;{n(settings.memoDate)}
                  </p>
                </div>
                <p>
                  <strong>เรื่อง</strong>&nbsp;&nbsp;รายงานสรุปการเยี่ยมบ้านนักเรียน ปีการศึกษา{' '}
                  {n(settings.academicYear)}
                </p>
              </div>

              <p>
                <strong>เรียน</strong>&nbsp;&nbsp;{settings.directorPosition}
              </p>

              <p className="indent-12 text-justify leading-8">
                ข้าพเจ้า {teacherDisplay} ตำแหน่ง {settings.teacherPosition}{' '}
                ได้รับมอบหมายให้เป็นครูประจำชั้น{shortClassTitle} ซึ่งมีนักเรียนจำนวน{' '}
                {n(stats.totalStudents)} คน เพื่อดำเนินการตามระบบดูแลช่วยเหลือนักเรียน ในระหว่างเดือน{' '}
                {n(settings.visitPeriodText)} ข้าพเจ้าได้ออกเยี่ยมบ้านนักเรียนทั้งสิ้น{' '}
                {n(stats.visitedTotal)} คน ได้รับฟังปัญหาจากผู้ปกครองและแจ้งพฤติกรรมของนักเรียนให้ผู้ปกครองทราบเพื่อช่วยกันดูแลช่วยเหลือนักเรียนต่อไป
              </p>

              <p className="indent-12">จึงเรียนมาเพื่อโปรดทราบ</p>

              {layoutConfig.showSignatures && (
                <div className="flex justify-end pt-6">
                  <div className="text-center space-y-1 w-72">
                    <p>ลงชื่อ...................................................ผู้รายงาน</p>
                    <p>({teacherDisplay})</p>
                  </div>
                </div>
              )}

              <div className="pt-8 space-y-4">
                <p className="font-bold">ความเห็นของผู้บริหารสถานศึกษา</p>
                <div className="border-b border-dotted border-slate-500 h-6" />
                <div className="border-b border-dotted border-slate-500 h-6" />
                <div className="border-b border-dotted border-slate-500 h-6" />

                {layoutConfig.showSignatures && (
                  <div className="flex justify-end pt-6">
                    <div className="text-center space-y-1 w-72">
                      <p>ลงชื่อ...........................................................</p>
                      <p>({settings.directorName})</p>
                      <p>{settings.directorPosition}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'summary_stats_part1':
        return (
          <div
            key={secId}
            data-pdf-page="true"
            className={`${pageClass} p-[18mm] text-[14px] leading-relaxed shadow-sm border border-slate-200 mx-auto`}
          >
            <div className="text-center space-y-1 pb-3 border-b border-slate-900">
              <h2 className="text-lg font-bold">แบบสรุปรายงานการเยี่ยมบ้านนักเรียน</h2>
              <p className="font-bold">
                ครั้งที่ {n(settings.visitRound)} ปีการศึกษา {n(settings.academicYear)}
              </p>
              <p className="font-bold">
                ชื่อสถานศึกษา {settings.schoolName} {settings.district} {settings.province}
              </p>
              <p className="font-bold">{shortClassTitle}</p>
            </div>

            <div className="pt-4 space-y-2">
              <p>
                {n(1)}. จำนวนนักเรียนทั้งหมด{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.totalStudents)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(2)}. จำนวนนักเรียนที่สถานศึกษาออกเยี่ยมบ้าน{' '}
                <strong className="border-b border-dotted border-slate-600 px-3">
                  {n(stats.visitedTotal)}
                </strong>{' '}
                คน เป็นชาย{' '}
                <strong className="border-b border-dotted border-slate-600 px-3">
                  {n(stats.visitedMale)}
                </strong>{' '}
                คน เป็นหญิง{' '}
                <strong className="border-b border-dotted border-slate-600 px-3">
                  {n(stats.visitedFemale)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(3)}. จำนวนนักเรียนที่ออกเยี่ยมบ้าน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.visitedTotal)}
                </strong>{' '}
                คน
              </p>
              <div>
                <p>
                  {n(4)}. จำนวนนักเรียนที่ไม่ได้ออกเยี่ยมบ้าน{' '}
                  <strong className="border-b border-dotted border-slate-600 px-4">
                    {n(stats.unvisitedTotal)}
                  </strong>{' '}
                  คน
                </p>
                <p className="pl-4">สาเหตุที่ไม่ได้ออกเยี่ยมบ้าน</p>
                <p className="border-b border-dotted border-slate-500 min-h-[24px] px-3 text-slate-700">
                  {stats.unvisitedTotal > 0 ? settings.unvisitedReason : '-'}
                </p>
              </div>

              <div className="space-y-1">
                <p>
                  {n(5)}. สภาพครอบครัวนักเรียนที่สถานศึกษาไปเยี่ยมบ้าน เช่น อบอุ่น / แตกแยก ระบุจำนวน
                </p>
                <p className="pl-8">
                  {n('5.1')} สภาพครอบครัวอบอุ่น{' '}
                  <strong className="border-b border-dotted border-slate-600 px-4">
                    {n(stats.warmFamilyCount)}
                  </strong>{' '}
                  คน
                </p>
                <p className="pl-8">
                  {n('5.2')} สภาพครอบครัวแตกแยก{' '}
                  <strong className="border-b border-dotted border-slate-600 px-4">
                    {n(stats.brokenFamilyCount)}
                  </strong>{' '}
                  คน
                </p>
              </div>

              <p>
                {n(6)}. พบว่านักเรียนที่บิดาและมารดาเสียชีวิต จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.bothParentsDeceasedCount)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(7)}. พบว่านักเรียนที่มีบิดาหรือมารดาเสียชีวิต จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.oneParentDeceasedCount)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(8)}. พบว่านักเรียนที่บิดาและมารดาเลิกร้างกัน จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.parentsDivorcedCount)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(9)}. พบว่านักเรียนมิได้อาศัยอยู่กับบิดาหรือมารดาของตนเอง จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.notWithParentsCount)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(10)}. พบว่านักเรียนเสี่ยงหรือมีปัญหาด้านการเรียน จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.learningProblemCount)}
                </strong>{' '}
                คน
              </p>
              <p>
                {n(11)}. พบว่านักเรียนมีปัญหาด้านสุขภาพ จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.healthProblemCount)}
                </strong>{' '}
                คน
              </p>

              <div className="space-y-1">
                <p>
                  {n(12)}. พบว่านักเรียนมีพฤติกรรมเสี่ยง จำนวน{' '}
                  <strong className="border-b border-dotted border-slate-600 px-4">
                    {n(stats.anyRiskBehaviorCount)}
                  </strong>{' '}
                  คน
                </p>
                <div className="pl-10 space-y-0.5">
                  {[
                    { label: '- สุขภาพ', count: stats.riskHealthSubCount },
                    { label: '- การใช้สารเสพติด', count: stats.riskSubstanceSubCount },
                    { label: '- ความรุนแรง', count: stats.riskViolenceSubCount },
                    { label: '- การเดินทางมาเรียน', count: stats.riskTravelSubCount },
                    { label: '- ด้านเพศ', count: stats.riskSexualSubCount },
                    { label: '- การติดเกม', count: stats.riskGamingSubCount },
                    { label: '- อื่น ๆ', count: stats.riskOtherSubCount },
                  ].map((sub) => (
                    <div key={sub.label} className="grid grid-cols-2 max-w-sm">
                      <span>{sub.label}</span>
                      <span>
                        จำนวน{' '}
                        <strong className="border-b border-dotted border-slate-600 px-3">
                          {n(sub.count)}
                        </strong>{' '}
                        คน
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary_stats_part2':
        return (
          <div
            key={secId}
            data-pdf-page="true"
            className={`${pageClass} p-[18mm] text-[14px] leading-relaxed flex flex-col justify-between shadow-sm border border-slate-200 mx-auto`}
          >
            <div className="space-y-3">
              <p>
                {n(13)}. พบว่านักเรียนมีปัญหาด้านเศรษฐกิจ จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.economicProblemCount)}
                </strong>{' '}
                คน
              </p>

              <div>
                <p>
                  {n(14)}. พบว่านักเรียนมีปัญหาด้านอื่น ๆ จำนวน{' '}
                  <strong className="border-b border-dotted border-slate-600 px-4">
                    {n(stats.otherProblemCount)}
                  </strong>{' '}
                  คน
                </p>
                <p className="pl-6">
                  ระบุปัญหาที่พบ:{' '}
                  <span className="border-b border-dotted border-slate-500 px-2">
                    {stats.otherProblemsList.length > 0
                      ? stats.otherProblemsList.join(' / ')
                      : '-'}
                  </span>
                </p>
              </div>

              <p>
                {n(15)}. นักเรียนที่ต้องได้รับการช่วยเหลือ เร่งด่วน จำนวน{' '}
                <strong className="border-b border-dotted border-slate-600 px-4">
                  {n(stats.urgentHelpCount)}
                </strong>{' '}
                คน
              </p>

              <p>
                {n(16)}. หน่วยงาน / สหวิชาชีพ / องค์กร ที่ร่วมเยี่ยมบ้าน{' '}
                <span className="border-b border-dotted border-slate-600 px-2">
                  {settings.partnerAgencies || '-'}
                </span>
              </p>

              <div>
                <p>{n(17)}. การนำข้อมูลเยี่ยมบ้านนักเรียนไปใช้ประโยชน์ อย่างไร</p>
                <p className="border-b border-dotted border-slate-500 min-h-[44px] px-2 text-slate-800">
                  {settings.dataUtilization || '-'}
                </p>
              </div>

              <div>
                <p>{n(18)}. ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน</p>
                <p className="border-b border-dotted border-slate-500 min-h-[48px] px-2 text-slate-800">
                  {stats.collectedParentConcerns.length > 0
                    ? stats.collectedParentConcerns.join(' | ')
                    : '-'}
                </p>
              </div>

              <div>
                <p>{n(19)}. ปัญหา / อุปสรรค / ข้อเสนอแนะ</p>
                <p className="border-b border-dotted border-slate-500 min-h-[44px] px-2 text-slate-800">
                  {settings.obstaclesAndSuggestions || '-'}
                </p>
              </div>

              <div>
                <p>{n(20)}. ความคิดเห็นและข้อเสนอแนะ</p>
                <p className="border-b border-dotted border-slate-500 min-h-[44px] px-2 text-slate-800">
                  {settings.generalComments || '-'}
                </p>
              </div>
            </div>

            {layoutConfig.showSignatures && (
              <div className="flex justify-end pt-8 pb-4">
                <div className="text-center space-y-1 w-72">
                  <p>ลงชื่อ ........................................................ผู้ให้ข้อมูล</p>
                  <p>( {teacherDisplay} )</p>
                  <p>ครูประจำชั้น</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'student_gps_roster':
        return (
          <div
            key={`${secId}-${idx}`}
            data-pdf-page="true"
            className={`${pageClass} p-[16mm] text-[12px] space-y-4 shadow-sm border border-slate-200 mx-auto`}
          >
            <div className="text-center border-b border-slate-900 pb-2">
              <h2 className="text-base font-bold">
                ภาคผนวก: ทะเบียนรายชื่อนักเรียนและพิกัดจีพีเอส (GPS) การเยี่ยมบ้าน
              </h2>
              <p className="text-xs text-slate-700">
                {settings.schoolName} · {shortClassTitle} · ปีการศึกษา {n(settings.academicYear)}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-800 px-2 py-1.5 text-center w-10">ลำดับ</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-left">ชื่อ - นามสกุล</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-left">ผู้ปกครอง / โทรศัพท์</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-center">สถานะเยี่ยม</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-center">พิกัด GPS (Lat, Lng)</th>
                </tr>
              </thead>
              <tbody>
                {targetStudents.map((stu, sIdx) => {
                  const v = visitMap.get(stu.id);
                  return (
                    <tr key={stu.id}>
                      <td className="border border-slate-800 px-2 py-1 text-center">
                        {n(sIdx + 1)}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 font-medium">
                        {stu.prefix}
                        {stu.firstName} {stu.lastName}
                      </td>
                      <td className="border border-slate-800 px-2 py-1">
                        {v
                          ? `${v.guardianFirstName} ${v.guardianLastName} (${v.guardianPhone || '-'})`
                          : stu.phone || '-'}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 text-center">
                        {v ? `เยี่ยมแล้ว (${n(v.visitDate)})` : 'ยังไม่เยี่ยม'}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 text-center font-mono-tabular">
                        {v?.gps ? `${v.gps.lat.toFixed(5)}, ${v.gps.lng.toFixed(5)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return <>{enabledSections.map((sec, idx) => renderSummaryPage(sec.id, idx))}</>;
};
