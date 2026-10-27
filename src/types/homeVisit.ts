export type StudentPrefix = 'เด็กชาย' | 'เด็กหญิง' | 'นาย' | 'นางสาว';
export type Gender = 'male' | 'female';

export interface ClassroomGroup {
  id: string;
  name: string;
  shortName: string;
  homeroomTeacher: string;
  academicYear: string;
  note: string;
}

export interface StudentRecord {
  id: string;
  studentCode: string;
  prefix: StudentPrefix;
  firstName: string;
  lastName: string;
  gender: Gender;
  citizenId: string;
  classId: string;
  birthDate: string;
  phone: string;
  address: string;
  avatarDataUrl: string;
  createdAt: string;
}

export interface HouseholdMember {
  id: string;
  relation: string;
  age: string;
  hasDisability: boolean;
  incomeSalary: number;
  incomeAgriculture: number;
  incomeBusiness: number;
  incomeWelfare: number;
  incomeOther: number;
}

export type FamilyRelationLevel = 'สนิทสนม' | 'เฉยๆ' | 'ห่างเหิน' | 'ขัดแย้ง' | 'ไม่มี';

export type ParentalStatus =
  | 'together'
  | 'divorced'
  | 'father_deceased'
  | 'mother_deceased'
  | 'both_deceased'
  | 'not_with_parents';

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  capturedAt: string;
  addressNote: string;
  source: 'gps' | 'manual';
}

export interface FamilyRelationsMap {
  father: FamilyRelationLevel;
  mother: FamilyRelationLevel;
  brother: FamilyRelationLevel;
  sister: FamilyRelationLevel;
  grandparents: FamilyRelationLevel;
  relatives: FamilyRelationLevel;
  other: FamilyRelationLevel;
}

export interface HomeVisitRecord {
  id: string;
  studentId: string;
  visitDate: string;
  updatedAt: string;
  status: 'draft' | 'completed';

  // Section 2: Guardian & Family Status
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  noGuardian: boolean;
  guardianRelation: string;
  guardianOccupation: string;
  guardianEducation: string;
  guardianCitizenId: string;
  noGuardianCitizenId: boolean;
  stateWelfareRegistered: boolean;
  isPoorScreening: boolean;
  parentalStatus: ParentalStatus;

  // Section 3: Household Members & Income (Poor screening)
  householdMemberCount: number;
  householdMembers: HouseholdMember[];

  // Section 4: Household Status
  dependencyFlags: string[];
  housingType: 'own' | 'rent' | 'other';
  housingConditions: string[];
  vehicleCar: boolean;
  vehiclePickup: boolean;
  vehicleTractor: boolean;
  farmingLandFlags: string[];

  // Section 5: Family Relationships
  hoursTogetherPerDay: string;
  familyAtmosphere: 'warm' | 'broken';
  relations: FamilyRelationsMap;
  relationOtherLabel: string;
  leaveChildWith: 'relatives' | 'neighbor' | 'alone' | 'other';
  leaveChildOther: string;
  nonPoorAvgMonthlyIncomePerPerson: number;
  studentExpenseFrom: string;
  studentPartTimeJob: string;
  studentDailyEarned: number;
  studentDailyAllowance: number;
  schoolSupportNeeded: string[];
  schoolSupportOther: string;
  needsUrgentHelp: boolean;
  agencySupportReceived: string[];
  agencySupportOther: string;
  parentConcerns: string;

  // Section 6: Behavior & Risks (6.1 - 6.11)
  healthRisks: string[];
  welfareSafetyRisks: string[];
  distanceKm: string;
  travelHours: string;
  travelMinutes: string;
  travelMode: string;
  travelModeOther: string;
  householdChores: string[];
  householdChoresOther: string;
  hobbies: string[];
  hobbiesOther: string;
  substanceRisks: string[];
  violenceRisks: string[];
  sexualRisks: string[];
  gamingRisks: string[];
  internetAccess: 'can_access' | 'cannot_access';
  electronicDeviceUsage: string[];
  otherProblemNote: string;

  // Informant & Signatures (Page 3 & Page 4)
  informantRelation: string;
  informantFullName: string;
  informantSignatureDataUrl: string;
  photoAttachmentType:
    | 'parents_house'
    | 'relative_house'
    | 'shelter_dorm'
    | 'school_sign_fallback';
  photoExteriorDataUrl: string;
  photoInteriorDataUrl: string;
  gps: GPSLocation | null;
  teacherNotes: string;
  signoffTeacherName: string;
  signoffTeacherPosition: string;
  signoffDay: string;
  signoffMonth: string;
  signoffYear: string;
  teacherSignatureDataUrl: string;
}

export interface VisitSchedule {
  id: string;
  studentId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  endTime: string; // HH:mm
  reminderMinutesBefore: number;
  status: 'upcoming' | 'completed_pending_record' | 'recorded' | 'cancelled';
  note: string;
  upcomingNotified: boolean;
  postVisitNotified: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'upcoming_reminder' | 'record_prompt' | 'system';
  title: string;
  message: string;
  studentId?: string;
  scheduleId?: string;
  createdAt: string;
  read: boolean;
  actionLabel?: string;
}

export type IndividualSectionId =
  | 'header_student_guardian'
  | 'household_income_table'
  | 'household_status'
  | 'family_relationship'
  | 'health_safety_travel'
  | 'behavior_risk_factors'
  | 'informant_signature'
  | 'gps_location_card'
  | 'house_photos_signoff';

export type SummarySectionId =
  | 'cover_page'
  | 'official_memo'
  | 'summary_stats_part1'
  | 'summary_stats_part2'
  | 'student_gps_roster';

export interface PdfSectionItem<T extends string = string> {
  id: T;
  label: string;
  description: string;
  enabled: boolean;
}

export interface PdfCustomLayoutConfig {
  id: string;
  name: string;
  mode: 'individual' | 'summary';
  orientation: 'portrait' | 'landscape';
  fontScale: 'compact' | 'standard' | 'large';
  numeralStyle: 'thai' | 'arabic';
  flowMode: 'official_paginated' | 'continuous_compact';
  showCitizenIdMask: boolean;
  showGpsCoordinates: boolean;
  showSignatures: boolean;
  individualSections: PdfSectionItem<IndividualSectionId>[];
  summarySections: PdfSectionItem<SummarySectionId>[];
}

export interface SchoolSettings {
  schoolName: string;
  district: string;
  province: string;
  educationArea: string;
  academicYear: string;
  visitRound: string;
  visitPeriodText: string;
  memoNumber: string;
  memoDate: string;
  teacherName: string;
  teacherPosition: string;
  directorName: string;
  directorPosition: string;
  unvisitedReason: string;
  partnerAgencies: string;
  dataUtilization: string;
  obstaclesAndSuggestions: string;
  generalComments: string;
}

export interface AppDatabaseState {
  settings: SchoolSettings;
  classes: ClassroomGroup[];
  students: StudentRecord[];
  visits: HomeVisitRecord[];
  schedules: VisitSchedule[];
  notifications: AppNotification[];
  pdfPresets: PdfCustomLayoutConfig[];
}
