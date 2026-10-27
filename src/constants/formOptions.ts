import {
  FamilyRelationLevel,
  IndividualSectionId,
  PdfSectionItem,
  SummarySectionId,
} from '../types/homeVisit';

export const DEPENDENCY_OPTIONS = [
  'มีคนพิการ',
  'มีผู้สูงอายุเกิน 60 ปี',
  'เป็นพ่อ/แม่เลี้ยงเดี่ยว',
  'มีคนอายุ 15–65 ปีว่างงาน (ที่ไม่ใช่นักเรียน/นักศึกษา)',
];

export const HOUSING_TYPE_OPTIONS: { value: 'own' | 'rent' | 'other'; label: string }[] = [
  { value: 'own', label: 'บ้านของตนเอง' },
  { value: 'rent', label: 'บ้านเช่า' },
  { value: 'other', label: 'อาศัยอยู่กับผู้อื่น' },
];

export const HOUSING_CONDITION_OPTIONS = [
  'สภาพบ้านชำรุดทรุดโทรม หรือ บ้านทำจากวัสดุพื้นบ้าน เช่น ไม้ไผ่ ใบจากหรือวัสดุเหลือใช้',
  'ไม่มีห้องส้วมในที่อยู่อาศัยและบริเวณ',
];

export const FARMING_LAND_OPTIONS = ['ไม่เกิน 1 ไร่', 'ไม่มีที่ดินเป็นของตนเอง'];

export const FAMILY_RELATION_LEVELS: FamilyRelationLevel[] = [
  'สนิทสนม',
  'เฉยๆ',
  'ห่างเหิน',
  'ขัดแย้ง',
  'ไม่มี',
];

export const FAMILY_MEMBER_ROWS: {
  key: 'father' | 'mother' | 'brother' | 'sister' | 'grandparents' | 'relatives' | 'other';
  label: string;
}[] = [
  { key: 'father', label: 'บิดา' },
  { key: 'mother', label: 'มารดา' },
  { key: 'brother', label: 'พี่ชาย/น้องชาย' },
  { key: 'sister', label: 'พี่สาว/น้องสาว' },
  { key: 'grandparents', label: 'ปู่/ย่า/ตา/ยาย' },
  { key: 'relatives', label: 'ญาติ' },
  { key: 'other', label: 'อื่นๆ' },
];

export const LEAVE_CHILD_OPTIONS: {
  value: 'relatives' | 'neighbor' | 'alone' | 'other';
  label: string;
}[] = [
  { value: 'relatives', label: 'ญาติ' },
  { value: 'neighbor', label: 'เพื่อนบ้าน' },
  { value: 'alone', label: 'นักเรียนอยู่บ้านด้วยตนเอง' },
  { value: 'other', label: 'อื่น ๆ' },
];

export const SCHOOL_SUPPORT_OPTIONS = [
  'ด้านการเรียน',
  'ด้านพฤติกรรม',
  'ด้านเศรษฐกิจ (เช่น ขอรับทุน)',
  'อื่นๆ',
];

export const AGENCY_SUPPORT_OPTIONS = ['เบี้ยผู้สูงอายุ', 'เบี้ยพิการ', 'อื่นๆ'];

export const HEALTH_RISK_OPTIONS = [
  'ร่างกายไม่แข็งแรง',
  'มีโรคประจำตัวหรือเจ็บป่วยบ่อย',
  'มีภาวะทุพโภชนาการ',
  'ป่วยเป็นโรคร้ายแรง/เรื้อรัง',
  'สมรรถภาพทางร่างกายต่ำ',
];

export const WELFARE_SAFETY_OPTIONS = [
  'พ่อแม่แยกทางกัน หรือแต่งงานใหม่',
  'ที่พักอาศัยอยู่ในชุมชนแออัดหรือใกล้แหล่งมั่วสุม/สถานเริงรมย์',
  'มีบุคคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง/เรื้อรัง/ติดต่อ',
  'บุคคลในครอบครัวติดสารเสพติด',
  'บุคคลในครอบครัวเล่นการพนัน',
  'มีความขัดแย้ง/ทะเลาะกันในครอบครัว',
  'ไม่มีผู้ดูแล',
  'มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว',
  'ถูกทารุณ/ทำร้ายจากบุคคลในครอบครัว/เพื่อนบ้าน',
  'ถูกล่วงละเมิดทางเพศ',
  'เล่นการพนัน',
];

export const TRAVEL_MODE_OPTIONS = [
  'ผู้ปกครองมาส่ง',
  'รถโดยสารประจำทาง',
  'รถจักรยานยนต์',
  'รถโรงเรียน',
  'รถยนต์',
  'รถจักรยาน',
  'เดิน',
  'อื่นๆ',
];

export const HOUSEHOLD_CHORE_OPTIONS = [
  'ช่วยงานบ้าน',
  'ช่วยคนดูแลคนเจ็บป่วย/พิการ',
  'ช่วยค้าขายเล็กๆน้อยๆ',
  'ทำงานแถวบ้าน',
  'ช่วยงานในนาไร่',
  'อื่น',
];

export const HOBBY_OPTIONS = [
  'ดูทีวี / ฟังเพลง',
  'ไปเที่ยวห้าง / ดูหนัง',
  'อ่านหนังสือ',
  'ไปหาเพื่อน / เพื่อน',
  'แว้น / สก๊อย',
  'เล่นเกม คอม / มือถือ',
  'ไปสวนสาธารณะ',
  'ไปร้านสนุกเกอร์',
  'อื่น ๆ',
];

export const SUBSTANCE_RISK_OPTIONS = [
  'คบเพื่อนในกลุ่มที่ใช้สารเสพติด',
  'สมาชิกในครอบครัวข้องเกี่ยวกับยาเสพติด',
  'อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด',
  'ปัจจุบันเกี่ยวข้องกับสารเสพติด',
  'เป็นผู้ติดบุหรี่ สุรา หรือการใช้สารเสพติดอื่นๆ',
];

export const VIOLENCE_RISK_OPTIONS = [
  'มีการทะเลาะวิวาท',
  'ก้าวร้าว เกเร',
  'ทะเลาะวิวาทเป็นประจำ',
  'ทำร้ายร่างกายผู้อื่น',
  'ทำร้ายร่างกายตนเอง',
];

export const SEXUAL_RISK_OPTIONS = [
  'อยู่ในกลุ่มขายบริการ',
  'ใช้เครื่องมือสื่อสารที่เกี่ยวข้องกับด้านเพศเป็นเวลานานและบ่อยครั้ง',
  'ตั้งครรภ์',
  'ขายบริการทางเพศ',
  'หมกมุ่นในการใช้เครื่องมือสื่อสารที่เกี่ยวข้องทางเพศ',
  'มีการมั่วสุมทางเพศ',
];

export const GAMING_RISK_OPTIONS = [
  'เล่นเกมเกินวันละ 1 ชั่วโมง',
  'ขาดจินตนาการและความคิดสร้างสรรค์',
  'เก็บตัว แยกตัวจากกลุ่มเพื่อน',
  'ใช้จ่ายเงินผิดปกติ',
  'อยู่ในกลุ่มเพื่อนเล่นเกม',
  'ร้านเกมอยู่ใกล้บ้านหรือโรงเรียน',
  'ใช้เวลาเล่นเกมเกิน 2 ชั่วโมง',
  'หมกมุ่น จริงจังในการเล่นเกม',
  'ใช้เงินสิ้นเปลือง โกหก ลักขโมยเงินเพื่อเล่นเกม',
  'อื่นๆ',
];

export const ELECTRONIC_USAGE_OPTIONS = [
  'เคยใช้โทรศัพท์มือถือในระหว่างการเรียน',
  'เข้าใช้ line, Facebook, twitter หรือ chat (เกินวันละ 1 ชั่วโมง)',
  'ใช้โทรศัพท์มือถือในระหว่างเรียน 2 - 3/วัน',
  'เข้าใช้ line, Facebook, twitter หรือ chat (เกินวันละ 2 ชั่วโมง)',
];

export const INFORMANT_OPTIONS = [
  'บิดา',
  'มารดา',
  'พี่ชาย',
  'พี่สาว',
  'น้า',
  'อา',
  'ป้า',
  'ลุง',
  'ปู่',
  'ย่า',
  'ตา',
  'ยาย',
  'ทวด',
  'พ่อเลี้ยง',
  'แม่เลี้ยง',
];

export const PHOTO_ATTACHMENT_TYPES: {
  value: 'parents_house' | 'relative_house' | 'shelter_dorm' | 'school_sign_fallback';
  label: string;
}[] = [
  {
    value: 'parents_house',
    label: 'บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ/เช่า)',
  },
  {
    value: 'relative_house',
    label: 'บ้านของญาติ/ผู้ปกครองที่ไม่ใช่ญาติ',
  },
  {
    value: 'shelter_dorm',
    label: 'บ้านหรือที่พักประเภท วัด มูลนิธิ หอพัก โรงงาน อยู่กับนายจ้าง',
  },
  {
    value: 'school_sign_fallback',
    label:
      'ภาพนักเรียนและป้ายชื่อโรงเรียนเนื่องจากถ่ายภาพบ้านไม่ได้ เพราะบ้านอยู่ต่างอำเภอ/ต่างจังหวัด/ต่างประเทศ หรือไม่ได้รับอนุญาตให้ถ่ายภาพ',
  },
];

export const PARENTAL_STATUS_OPTIONS: {
  value:
    | 'together'
    | 'divorced'
    | 'father_deceased'
    | 'mother_deceased'
    | 'both_deceased'
    | 'not_with_parents';
  label: string;
}[] = [
  { value: 'together', label: 'บิดาและมารดาอยู่ร่วมกัน' },
  { value: 'divorced', label: 'บิดาและมารดาเลิกร้างกัน' },
  { value: 'father_deceased', label: 'บิดาเสียชีวิต' },
  { value: 'mother_deceased', label: 'มารดาเสียชีวิต' },
  { value: 'both_deceased', label: 'บิดาและมารดาเสียชีวิตทั้งคู่' },
  { value: 'not_with_parents', label: 'มิได้อาศัยอยู่กับบิดาหรือมารดาของตนเอง' },
];

export const DEFAULT_INDIVIDUAL_SECTIONS: PdfSectionItem<IndividualSectionId>[] = [
  {
    id: 'header_student_guardian',
    label: 'ข้อมูลนักเรียนและผู้ปกครอง (ข้อ 1–2)',
    description: 'ชื่อโรงเรียน รูปถ่ายนักเรียน เลขบัตรประชาชน และข้อมูลผู้ปกครอง',
    enabled: true,
  },
  {
    id: 'household_income_table',
    label: 'ตารางสมาชิกและรายได้ครัวเรือน (ข้อ 3)',
    description: 'รายละเอียดสมาชิก 1–10 คน และรายได้เฉลี่ยต่อเดือนแยกประเภท',
    enabled: true,
  },
  {
    id: 'household_status',
    label: 'สถานะครัวเรือนและที่อยู่อาศัย (ข้อ 4)',
    description: 'ภาระพึ่งพิง ประเภทและสภาพที่อยู่อาศัย ยานพาหนะ และที่ดินทำกิน',
    enabled: true,
  },
  {
    id: 'family_relationship',
    label: 'ความสัมพันธ์ในครอบครัวและการดูแล (ข้อ 5)',
    description: 'ตารางความสัมพันธ์ ค่าใช้จ่าย ความช่วยเหลือ และข้อห่วงใยของผู้ปกครอง',
    enabled: true,
  },
  {
    id: 'health_safety_travel',
    label: 'สุขภาพ สวัสดิการ และการเดินทาง (ข้อ 6.1–6.3)',
    description: 'สุขภาพ สวัสดิการความปลอดภัย ระยะทางและวิธีเดินทางมาเรียน',
    enabled: true,
  },
  {
    id: 'behavior_risk_factors',
    label: 'ภาระงาน งานอดิเรก และพฤติกรรมเสี่ยง (ข้อ 6.4–6.11)',
    description: 'งานรับผิดชอบ สารเสพติด ความรุนแรง เพศ การติดเกม และสื่ออิเล็กทรอนิกส์',
    enabled: true,
  },
  {
    id: 'informant_signature',
    label: 'ผู้ให้ข้อมูลและลายมือชื่อผู้ปกครอง',
    description: 'ความสัมพันธ์ผู้ให้ข้อมูลและช่องลงชื่อรับรองข้อมูลเป็นความจริง',
    enabled: true,
  },
  {
    id: 'gps_location_card',
    label: 'พิกัดจีพีเอส (GPS) และตำแหน่งบ้านนักเรียน',
    description: 'ละติจูด ลองจิจูด ความแม่นยำ วันเวลาที่บันทึก และลิงก์แผนที่',
    enabled: true,
  },
  {
    id: 'house_photos_signoff',
    label: 'ภาพถ่ายบ้านนักเรียนและคำรับรองครู (หน้า 4)',
    description: 'รูปที่ 1 สภาพบ้านภายนอก รูปที่ 2 ภายในบ้าน และลายเซ็นครูผู้เยี่ยมบ้าน',
    enabled: true,
  },
];

export const DEFAULT_SUMMARY_SECTIONS: PdfSectionItem<SummarySectionId>[] = [
  {
    id: 'cover_page',
    label: 'ปกรายงานสรุปการเยี่ยมบ้าน',
    description: 'หน้าปกทางการพร้อมตราสัญลักษณ์ สพฐ. ชื่อครู และสังกัดโรงเรียน',
    enabled: true,
  },
  {
    id: 'official_memo',
    label: 'บันทึกข้อความราชการ',
    description: 'หนังสือบันทึกข้อความเสนอผู้อำนวยการโรงเรียนพร้อมความเห็นผู้บริหาร',
    enabled: true,
  },
  {
    id: 'summary_stats_part1',
    label: 'แบบสรุปรายงาน ข้อ 1–12 (สถิติและพฤติกรรมเสี่ยง)',
    description: 'จำนวนนักเรียนที่เยี่ยม สภาพครอบครัว และสรุปความเสี่ยงรายด้าน',
    enabled: true,
  },
  {
    id: 'summary_stats_part2',
    label: 'แบบสรุปรายงาน ข้อ 13–20 (เศรษฐกิจและข้อเสนอแนะ)',
    description: 'ปัญหาเศรษฐกิจ ความช่วยเหลือเร่งด่วน ข้อห่วงใยผู้ปกครอง และลงชื่อครู',
    enabled: true,
  },
  {
    id: 'student_gps_roster',
    label: 'ภาคผนวก: ทะเบียนนักเรียนและพิกัด GPS เยี่ยมบ้าน',
    description: 'ตารางสรุปรายชื่อนักเรียน สถานะการเยี่ยมบ้าน และพิกัดละติจูด/ลองจิจูด',
    enabled: false,
  },
];

export function toThaiNumerals(input: string | number): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(input).replace(/\d/g, (d) => thaiDigits[Number(d)] ?? d);
}

export function formatNum(
  input: string | number,
  style: 'thai' | 'arabic' = 'arabic'
): string {
  return style === 'thai' ? toThaiNumerals(input) : String(input);
}
