import { HomeVisitRecord, HouseholdMember, StudentRecord } from '../types/homeVisit';

export function calcMemberMonthlyTotal(m: HouseholdMember): number {
  return (
    (Number(m.incomeSalary) || 0) +
    (Number(m.incomeAgriculture) || 0) +
    (Number(m.incomeBusiness) || 0) +
    (Number(m.incomeWelfare) || 0) +
    (Number(m.incomeOther) || 0)
  );
}

export function calcHouseholdTotals(visit: HomeVisitRecord) {
  const totalMonthly = visit.householdMembers.reduce(
    (sum, m) => sum + calcMemberMonthlyTotal(m),
    0
  );
  const count = Math.max(1, Number(visit.householdMemberCount) || visit.householdMembers.length || 1);
  const avgPerPerson = visit.isPoorScreening
    ? Math.round((totalMonthly / count) * 100) / 100
    : Number(visit.nonPoorAvgMonthlyIncomePerPerson) || 0;

  return {
    totalMonthly,
    memberCount: count,
    avgPerPerson,
  };
}

export interface SummaryStatisticsResult {
  totalStudents: number;
  visitedTotal: number;
  visitedMale: number;
  visitedFemale: number;
  unvisitedTotal: number;
  warmFamilyCount: number;
  brokenFamilyCount: number;
  bothParentsDeceasedCount: number;
  oneParentDeceasedCount: number;
  parentsDivorcedCount: number;
  notWithParentsCount: number;
  learningProblemCount: number;
  healthProblemCount: number;
  anyRiskBehaviorCount: number;
  riskHealthSubCount: number;
  riskSubstanceSubCount: number;
  riskViolenceSubCount: number;
  riskTravelSubCount: number;
  riskSexualSubCount: number;
  riskGamingSubCount: number;
  riskOtherSubCount: number;
  economicProblemCount: number;
  otherProblemCount: number;
  otherProblemsList: string[];
  urgentHelpCount: number;
  urgentStudents: StudentRecord[];
  collectedParentConcerns: string[];
}

export function computeSummaryStatistics(
  students: StudentRecord[],
  visits: HomeVisitRecord[]
): SummaryStatisticsResult {
  const visitByStudent = new Map<string, HomeVisitRecord>();
  for (const v of visits) {
    if (v.status === 'completed') {
      visitByStudent.set(v.studentId, v);
    }
  }

  let visitedMale = 0;
  let visitedFemale = 0;
  let warmFamilyCount = 0;
  let brokenFamilyCount = 0;
  let bothParentsDeceasedCount = 0;
  let oneParentDeceasedCount = 0;
  let parentsDivorcedCount = 0;
  let notWithParentsCount = 0;
  let learningProblemCount = 0;
  let healthProblemCount = 0;

  let anyRiskBehaviorCount = 0;
  let riskHealthSubCount = 0;
  let riskSubstanceSubCount = 0;
  let riskViolenceSubCount = 0;
  let riskTravelSubCount = 0;
  let riskSexualSubCount = 0;
  let riskGamingSubCount = 0;
  let riskOtherSubCount = 0;

  let economicProblemCount = 0;
  let otherProblemCount = 0;
  const otherProblemsList: string[] = [];
  let urgentHelpCount = 0;
  const urgentStudents: StudentRecord[] = [];
  const collectedParentConcerns: string[] = [];

  for (const stu of students) {
    const v = visitByStudent.get(stu.id);
    if (!v) continue;

    if (stu.gender === 'male') visitedMale++;
    else visitedFemale++;

    if (v.familyAtmosphere === 'broken') brokenFamilyCount++;
    else warmFamilyCount++;

    if (v.parentalStatus === 'both_deceased') bothParentsDeceasedCount++;
    if (v.parentalStatus === 'father_deceased' || v.parentalStatus === 'mother_deceased') {
      oneParentDeceasedCount++;
    }
    if (
      v.parentalStatus === 'divorced' ||
      v.welfareSafetyRisks.includes('พ่อแม่แยกทางกัน หรือแต่งงานใหม่')
    ) {
      parentsDivorcedCount++;
    }
    if (v.parentalStatus === 'not_with_parents') {
      notWithParentsCount++;
    }

    if (v.schoolSupportNeeded.includes('ด้านการเรียน')) {
      learningProblemCount++;
    }

    const hasHealthRisk = v.healthRisks.length > 0;
    if (hasHealthRisk) {
      healthProblemCount++;
      riskHealthSubCount++;
    }

    const hasSubstance = v.substanceRisks.length > 0;
    if (hasSubstance) riskSubstanceSubCount++;

    const hasViolence =
      v.violenceRisks.length > 0 ||
      v.welfareSafetyRisks.includes('มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว') ||
      v.welfareSafetyRisks.includes('ถูกทารุณ/ทำร้ายจากบุคคลในครอบครัว/เพื่อนบ้าน');
    if (hasViolence) riskViolenceSubCount++;

    const dist = parseFloat(v.distanceKm || '0');
    const travelMin =
      (parseInt(v.travelHours || '0', 10) || 0) * 60 +
      (parseInt(v.travelMinutes || '0', 10) || 0);
    const hasTravelRisk = dist >= 10 || travelMin >= 45;
    if (hasTravelRisk) riskTravelSubCount++;

    const hasSexual =
      v.sexualRisks.length > 0 || v.welfareSafetyRisks.includes('ถูกล่วงละเมิดทางเพศ');
    if (hasSexual) riskSexualSubCount++;

    const hasGaming = v.gamingRisks.length > 0;
    if (hasGaming) riskGamingSubCount++;

    const hasOtherRisk =
      v.electronicDeviceUsage.length > 0 ||
      v.hobbies.includes('แว้น / สก๊อย') ||
      v.hobbies.includes('ไปร้านสนุกเกอร์');
    if (hasOtherRisk) riskOtherSubCount++;

    if (
      hasHealthRisk ||
      hasSubstance ||
      hasViolence ||
      hasTravelRisk ||
      hasSexual ||
      hasGaming ||
      hasOtherRisk
    ) {
      anyRiskBehaviorCount++;
    }

    const { avgPerPerson } = calcHouseholdTotals(v);
    if (
      v.isPoorScreening ||
      v.stateWelfareRegistered ||
      v.schoolSupportNeeded.includes('ด้านเศรษฐกิจ (เช่น ขอรับทุน)') ||
      (avgPerPerson > 0 && avgPerPerson < 3000)
    ) {
      economicProblemCount++;
    }

    if (v.otherProblemNote && v.otherProblemNote.trim().length > 0) {
      otherProblemCount++;
      otherProblemsList.push(
        `${stu.prefix}${stu.firstName} ${stu.lastName}: ${v.otherProblemNote.trim()}`
      );
    }

    if (v.needsUrgentHelp) {
      urgentHelpCount++;
      urgentStudents.push(stu);
    }

    if (v.parentConcerns && v.parentConcerns.trim().length > 0) {
      collectedParentConcerns.push(
        `${stu.prefix}${stu.firstName} ${stu.lastName}: ${v.parentConcerns.trim()}`
      );
    }
  }

  const visitedTotal = visitedMale + visitedFemale;
  const totalStudents = students.length;
  const unvisitedTotal = Math.max(0, totalStudents - visitedTotal);

  return {
    totalStudents,
    visitedTotal,
    visitedMale,
    visitedFemale,
    unvisitedTotal,
    warmFamilyCount,
    brokenFamilyCount,
    bothParentsDeceasedCount,
    oneParentDeceasedCount,
    parentsDivorcedCount,
    notWithParentsCount,
    learningProblemCount,
    healthProblemCount,
    anyRiskBehaviorCount,
    riskHealthSubCount,
    riskSubstanceSubCount,
    riskViolenceSubCount,
    riskTravelSubCount,
    riskSexualSubCount,
    riskGamingSubCount,
    riskOtherSubCount,
    economicProblemCount,
    otherProblemCount,
    otherProblemsList,
    urgentHelpCount,
    urgentStudents,
    collectedParentConcerns,
  };
}
