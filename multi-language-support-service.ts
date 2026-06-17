/**
 * Multi-Language Support Service - MediVac WACHS v9.4
 * Translation support for AHD forms in common WA languages
 */

// Types
export type SupportedLanguage = 
  | 'en-AU'  // English (Australian) - Default
  | 'zh-CN'  // Mandarin Chinese (Simplified)
  | 'vi-VN'  // Vietnamese
  | 'it-IT'  // Italian
  | 'ar-SA'  // Arabic
  | 'el-GR'  // Greek
  | 'ko-KR'  // Korean
  | 'hi-IN'; // Hindi

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  completeness: number; // Percentage of translations complete
}

export interface TranslationKey {
  key: string;
  category: string;
  englishText: string;
  translations: Partial<Record<SupportedLanguage, string>>;
}

// Haptic feedback simulation
const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  console.log(`Haptic: ${type}`);
};

class MultiLanguageSupportService {
  private currentLanguage: SupportedLanguage = 'en-AU';
  private translations: Map<string, TranslationKey> = new Map();
  private userPreferences: Map<string, SupportedLanguage> = new Map();

  constructor() {
    this.initializeTranslations();
  }

  // Language Information
  getSupportedLanguages(): LanguageInfo[] {
    return [
      { code: 'en-AU', name: 'English (Australian)', nativeName: 'English', direction: 'ltr', flag: '🇦🇺', completeness: 100 },
      { code: 'zh-CN', name: 'Mandarin Chinese', nativeName: '简体中文', direction: 'ltr', flag: '🇨🇳', completeness: 95 },
      { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', flag: '🇻🇳', completeness: 90 },
      { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', flag: '🇮🇹', completeness: 88 },
      { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦', completeness: 85 },
      { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr', flag: '🇬🇷', completeness: 82 },
      { code: 'ko-KR', name: 'Korean', nativeName: '한국어', direction: 'ltr', flag: '🇰🇷', completeness: 80 },
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳', completeness: 75 },
    ];
  }

  getLanguageInfo(code: SupportedLanguage): LanguageInfo | null {
    return this.getSupportedLanguages().find(l => l.code === code) || null;
  }

  // Current Language Management
  setLanguage(code: SupportedLanguage): boolean {
    const lang = this.getLanguageInfo(code);
    if (!lang) return false;
    
    this.currentLanguage = code;
    triggerHaptic('medium');
    return true;
  }

  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getDirection(): 'ltr' | 'rtl' {
    const lang = this.getLanguageInfo(this.currentLanguage);
    return lang?.direction || 'ltr';
  }

  // Translation Functions
  translate(key: string, fallback?: string): string {
    const translation = this.translations.get(key);
    if (!translation) return fallback || key;
    
    const text = translation.translations[this.currentLanguage];
    if (text) return text;
    
    // Fallback to English
    return translation.englishText || fallback || key;
  }

  t(key: string, fallback?: string): string {
    return this.translate(key, fallback);
  }

  // Translate with variables
  translateWithVars(key: string, vars: Record<string, string>, fallback?: string): string {
    let text = this.translate(key, fallback);
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), value);
    });
    return text;
  }

  // Get all translations for a category
  getTranslationsByCategory(category: string): TranslationKey[] {
    return Array.from(this.translations.values()).filter(t => t.category === category);
  }

  // User Preferences
  setUserLanguagePreference(userId: string, language: SupportedLanguage): void {
    this.userPreferences.set(userId, language);
    triggerHaptic('light');
  }

  getUserLanguagePreference(userId: string): SupportedLanguage {
    return this.userPreferences.get(userId) || 'en-AU';
  }

  // Initialize all translations
  private initializeTranslations(): void {
    // AHD Form Labels
    this.addTranslation('ahd.title', 'AHD Form', 'Advanced Health Directive', {
      'zh-CN': '预先医疗指示',
      'vi-VN': 'Chỉ thị Y tế Trước',
      'it-IT': 'Direttiva Sanitaria Anticipata',
      'ar-SA': 'التوجيه الصحي المسبق',
      'el-GR': 'Προκαταβολική Οδηγία Υγείας',
      'ko-KR': '사전의료지시서',
      'hi-IN': 'अग्रिम स्वास्थ्य निर्देश',
    });

    this.addTranslation('ahd.subtitle', 'AHD Form', 'Western Australia', {
      'zh-CN': '西澳大利亚州',
      'vi-VN': 'Tây Úc',
      'it-IT': 'Australia Occidentale',
      'ar-SA': 'غرب أستراليا',
      'el-GR': 'Δυτική Αυστραλία',
      'ko-KR': '서호주',
      'hi-IN': 'पश्चिमी ऑस्ट्रेलिया',
    });

    // Personal Details Section
    this.addTranslation('personal.title', 'Personal Details', 'Personal Details', {
      'zh-CN': '个人信息',
      'vi-VN': 'Thông tin Cá nhân',
      'it-IT': 'Dati Personali',
      'ar-SA': 'البيانات الشخصية',
      'el-GR': 'Προσωπικά Στοιχεία',
      'ko-KR': '개인 정보',
      'hi-IN': 'व्यक्तिगत विवरण',
    });

    this.addTranslation('personal.fullName', 'Personal Details', 'Full Name', {
      'zh-CN': '全名',
      'vi-VN': 'Họ và Tên',
      'it-IT': 'Nome Completo',
      'ar-SA': 'الاسم الكامل',
      'el-GR': 'Πλήρες Όνομα',
      'ko-KR': '성명',
      'hi-IN': 'पूरा नाम',
    });

    this.addTranslation('personal.dateOfBirth', 'Personal Details', 'Date of Birth', {
      'zh-CN': '出生日期',
      'vi-VN': 'Ngày Sinh',
      'it-IT': 'Data di Nascita',
      'ar-SA': 'تاريخ الميلاد',
      'el-GR': 'Ημερομηνία Γέννησης',
      'ko-KR': '생년월일',
      'hi-IN': 'जन्म तिथि',
    });

    this.addTranslation('personal.address', 'Personal Details', 'Address', {
      'zh-CN': '地址',
      'vi-VN': 'Địa chỉ',
      'it-IT': 'Indirizzo',
      'ar-SA': 'العنوان',
      'el-GR': 'Διεύθυνση',
      'ko-KR': '주소',
      'hi-IN': 'पता',
    });

    this.addTranslation('personal.phone', 'Personal Details', 'Phone Number', {
      'zh-CN': '电话号码',
      'vi-VN': 'Số Điện thoại',
      'it-IT': 'Numero di Telefono',
      'ar-SA': 'رقم الهاتف',
      'el-GR': 'Αριθμός Τηλεφώνου',
      'ko-KR': '전화번호',
      'hi-IN': 'फ़ोन नंबर',
    });

    this.addTranslation('personal.email', 'Personal Details', 'Email Address', {
      'zh-CN': '电子邮件地址',
      'vi-VN': 'Địa chỉ Email',
      'it-IT': 'Indirizzo Email',
      'ar-SA': 'عنوان البريد الإلكتروني',
      'el-GR': 'Διεύθυνση Email',
      'ko-KR': '이메일 주소',
      'hi-IN': 'ईमेल पता',
    });

    // Treatment Decision Maker Section
    this.addTranslation('tdm.title', 'Treatment Decision Maker', 'Treatment Decision Maker', {
      'zh-CN': '治疗决策者',
      'vi-VN': 'Người Quyết định Điều trị',
      'it-IT': 'Responsabile delle Decisioni Terapeutiche',
      'ar-SA': 'صانع قرار العلاج',
      'el-GR': 'Υπεύθυνος Αποφάσεων Θεραπείας',
      'ko-KR': '치료 결정권자',
      'hi-IN': 'उपचार निर्णय निर्माता',
    });

    this.addTranslation('tdm.description', 'Treatment Decision Maker', 'The person who will make healthcare decisions on your behalf if you cannot make them yourself.', {
      'zh-CN': '当您无法自行做出决定时，代表您做出医疗保健决定的人。',
      'vi-VN': 'Người sẽ đưa ra quyết định chăm sóc sức khỏe thay mặt bạn nếu bạn không thể tự quyết định.',
      'it-IT': 'La persona che prenderà decisioni sanitarie per tuo conto se non puoi prenderle tu stesso.',
      'ar-SA': 'الشخص الذي سيتخذ قرارات الرعاية الصحية نيابة عنك إذا لم تتمكن من اتخاذها بنفسك.',
      'el-GR': 'Το άτομο που θα λαμβάνει αποφάσεις υγειονομικής περίθαλψης για λογαριασμό σας αν δεν μπορείτε να τις λάβετε εσείς.',
      'ko-KR': '본인이 결정을 내릴 수 없을 때 대신 의료 결정을 내릴 사람입니다.',
      'hi-IN': 'वह व्यक्ति जो आपकी ओर से स्वास्थ्य संबंधी निर्णय लेगा यदि आप स्वयं नहीं ले सकते।',
    });

    this.addTranslation('tdm.relationship', 'Treatment Decision Maker', 'Relationship to You', {
      'zh-CN': '与您的关系',
      'vi-VN': 'Quan hệ với Bạn',
      'it-IT': 'Relazione con Te',
      'ar-SA': 'العلاقة بك',
      'el-GR': 'Σχέση με Εσάς',
      'ko-KR': '본인과의 관계',
      'hi-IN': 'आपसे संबंध',
    });

    // Values and Wishes Section
    this.addTranslation('values.title', 'Values and Wishes', 'My Values and Wishes', {
      'zh-CN': '我的价值观和愿望',
      'vi-VN': 'Giá trị và Mong muốn của Tôi',
      'it-IT': 'I Miei Valori e Desideri',
      'ar-SA': 'قيمي ورغباتي',
      'el-GR': 'Οι Αξίες και οι Επιθυμίες μου',
      'ko-KR': '나의 가치관과 소망',
      'hi-IN': 'मेरे मूल्य और इच्छाएं',
    });

    this.addTranslation('values.qualityOfLife', 'Values and Wishes', 'What does quality of life mean to you?', {
      'zh-CN': '生活质量对您意味着什么？',
      'vi-VN': 'Chất lượng cuộc sống có ý nghĩa gì với bạn?',
      'it-IT': 'Cosa significa per te la qualità della vita?',
      'ar-SA': 'ماذا تعني جودة الحياة بالنسبة لك؟',
      'el-GR': 'Τι σημαίνει για εσάς η ποιότητα ζωής;',
      'ko-KR': '삶의 질이란 무엇을 의미합니까?',
      'hi-IN': 'जीवन की गुणवत्ता का आपके लिए क्या अर्थ है?',
    });

    this.addTranslation('values.importantActivities', 'Values and Wishes', 'What activities or abilities are most important to you?', {
      'zh-CN': '哪些活动或能力对您最重要？',
      'vi-VN': 'Những hoạt động hoặc khả năng nào quan trọng nhất với bạn?',
      'it-IT': 'Quali attività o capacità sono più importanti per te?',
      'ar-SA': 'ما هي الأنشطة أو القدرات الأكثر أهمية بالنسبة لك؟',
      'el-GR': 'Ποιες δραστηριότητες ή ικανότητες είναι πιο σημαντικές για εσάς;',
      'ko-KR': '어떤 활동이나 능력이 가장 중요합니까?',
      'hi-IN': 'कौन सी गतिविधियां या क्षमताएं आपके लिए सबसे महत्वपूर्ण हैं?',
    });

    this.addTranslation('values.fears', 'Values and Wishes', 'What are your fears or concerns about future healthcare?', {
      'zh-CN': '您对未来医疗保健有什么担忧或顾虑？',
      'vi-VN': 'Bạn có những lo ngại gì về chăm sóc sức khỏe trong tương lai?',
      'it-IT': 'Quali sono le tue paure o preoccupazioni riguardo all\'assistenza sanitaria futura?',
      'ar-SA': 'ما هي مخاوفك أو قلقك بشأن الرعاية الصحية المستقبلية؟',
      'el-GR': 'Ποιοι είναι οι φόβοι ή οι ανησυχίες σας για τη μελλοντική υγειονομική περίθαλψη;',
      'ko-KR': '미래 의료에 대한 두려움이나 우려는 무엇입니까?',
      'hi-IN': 'भविष्य की स्वास्थ्य देखभाल के बारे में आपकी चिंताएं क्या हैं?',
    });

    // Treatment Decisions Section
    this.addTranslation('treatment.title', 'Treatment Decisions', 'Treatment Decisions', {
      'zh-CN': '治疗决定',
      'vi-VN': 'Quyết định Điều trị',
      'it-IT': 'Decisioni Terapeutiche',
      'ar-SA': 'قرارات العلاج',
      'el-GR': 'Αποφάσεις Θεραπείας',
      'ko-KR': '치료 결정',
      'hi-IN': 'उपचार निर्णय',
    });

    this.addTranslation('treatment.cpr', 'Treatment Decisions', 'Cardiopulmonary Resuscitation (CPR)', {
      'zh-CN': '心肺复苏术 (CPR)',
      'vi-VN': 'Hồi sức Tim phổi (CPR)',
      'it-IT': 'Rianimazione Cardiopolmonare (RCP)',
      'ar-SA': 'الإنعاش القلبي الرئوي',
      'el-GR': 'Καρδιοπνευμονική Αναζωογόνηση (ΚΑΡΠΑ)',
      'ko-KR': '심폐소생술 (CPR)',
      'hi-IN': 'कार्डियोपल्मोनरी रिससिटेशन (सीपीआर)',
    });

    this.addTranslation('treatment.ventilation', 'Treatment Decisions', 'Mechanical Ventilation', {
      'zh-CN': '机械通气',
      'vi-VN': 'Thông khí Cơ học',
      'it-IT': 'Ventilazione Meccanica',
      'ar-SA': 'التنفس الاصطناعي',
      'el-GR': 'Μηχανικός Αερισμός',
      'ko-KR': '기계적 환기',
      'hi-IN': 'यांत्रिक वेंटिलेशन',
    });

    this.addTranslation('treatment.nutrition', 'Treatment Decisions', 'Artificial Nutrition', {
      'zh-CN': '人工营养',
      'vi-VN': 'Dinh dưỡng Nhân tạo',
      'it-IT': 'Nutrizione Artificiale',
      'ar-SA': 'التغذية الاصطناعية',
      'el-GR': 'Τεχνητή Διατροφή',
      'ko-KR': '인공 영양',
      'hi-IN': 'कृत्रिम पोषण',
    });

    this.addTranslation('treatment.hydration', 'Treatment Decisions', 'Artificial Hydration', {
      'zh-CN': '人工补液',
      'vi-VN': 'Bù nước Nhân tạo',
      'it-IT': 'Idratazione Artificiale',
      'ar-SA': 'الترطيب الاصطناعي',
      'el-GR': 'Τεχνητή Ενυδάτωση',
      'ko-KR': '인공 수분 공급',
      'hi-IN': 'कृत्रिम जलयोजन',
    });

    this.addTranslation('treatment.dialysis', 'Treatment Decisions', 'Dialysis', {
      'zh-CN': '透析',
      'vi-VN': 'Lọc máu',
      'it-IT': 'Dialisi',
      'ar-SA': 'غسيل الكلى',
      'el-GR': 'Αιμοκάθαρση',
      'ko-KR': '투석',
      'hi-IN': 'डायलिसिस',
    });

    this.addTranslation('treatment.antibiotics', 'Treatment Decisions', 'Antibiotics', {
      'zh-CN': '抗生素',
      'vi-VN': 'Kháng sinh',
      'it-IT': 'Antibiotici',
      'ar-SA': 'المضادات الحيوية',
      'el-GR': 'Αντιβιοτικά',
      'ko-KR': '항생제',
      'hi-IN': 'एंटीबायोटिक्स',
    });

    this.addTranslation('treatment.palliative', 'Treatment Decisions', 'Palliative Care', {
      'zh-CN': '姑息治疗',
      'vi-VN': 'Chăm sóc Giảm nhẹ',
      'it-IT': 'Cure Palliative',
      'ar-SA': 'الرعاية التلطيفية',
      'el-GR': 'Παρηγορητική Φροντίδα',
      'ko-KR': '완화 치료',
      'hi-IN': 'प्रशामक देखभाल',
    });

    // Preferences
    this.addTranslation('preference.want', 'Preferences', 'I Want This Treatment', {
      'zh-CN': '我想要这种治疗',
      'vi-VN': 'Tôi Muốn Điều trị Này',
      'it-IT': 'Voglio Questo Trattamento',
      'ar-SA': 'أريد هذا العلاج',
      'el-GR': 'Θέλω Αυτή τη Θεραπεία',
      'ko-KR': '이 치료를 원합니다',
      'hi-IN': 'मुझे यह उपचार चाहिए',
    });

    this.addTranslation('preference.doNotWant', 'Preferences', 'I Do Not Want This Treatment', {
      'zh-CN': '我不想要这种治疗',
      'vi-VN': 'Tôi Không Muốn Điều trị Này',
      'it-IT': 'Non Voglio Questo Trattamento',
      'ar-SA': 'لا أريد هذا العلاج',
      'el-GR': 'Δεν Θέλω Αυτή τη Θεραπεία',
      'ko-KR': '이 치료를 원하지 않습니다',
      'hi-IN': 'मुझे यह उपचार नहीं चाहिए',
    });

    this.addTranslation('preference.undecided', 'Preferences', 'Undecided', {
      'zh-CN': '未决定',
      'vi-VN': 'Chưa Quyết định',
      'it-IT': 'Indeciso',
      'ar-SA': 'غير محدد',
      'el-GR': 'Αναποφάσιστος',
      'ko-KR': '미정',
      'hi-IN': 'अनिर्णीत',
    });

    // Witness Section
    this.addTranslation('witness.title', 'Witness', 'Witness Declaration', {
      'zh-CN': '见证人声明',
      'vi-VN': 'Tuyên bố của Nhân chứng',
      'it-IT': 'Dichiarazione del Testimone',
      'ar-SA': 'إعلان الشاهد',
      'el-GR': 'Δήλωση Μάρτυρα',
      'ko-KR': '증인 선언',
      'hi-IN': 'गवाह घोषणा',
    });

    this.addTranslation('witness.occupation', 'Witness', 'Occupation', {
      'zh-CN': '职业',
      'vi-VN': 'Nghề nghiệp',
      'it-IT': 'Professione',
      'ar-SA': 'المهنة',
      'el-GR': 'Επάγγελμα',
      'ko-KR': '직업',
      'hi-IN': 'व्यवसाय',
    });

    // Signature Section
    this.addTranslation('signature.title', 'Signature', 'Signature', {
      'zh-CN': '签名',
      'vi-VN': 'Chữ ký',
      'it-IT': 'Firma',
      'ar-SA': 'التوقيع',
      'el-GR': 'Υπογραφή',
      'ko-KR': '서명',
      'hi-IN': 'हस्ताक्षर',
    });

    this.addTranslation('signature.date', 'Signature', 'Date', {
      'zh-CN': '日期',
      'vi-VN': 'Ngày',
      'it-IT': 'Data',
      'ar-SA': 'التاريخ',
      'el-GR': 'Ημερομηνία',
      'ko-KR': '날짜',
      'hi-IN': 'तारीख',
    });

    this.addTranslation('signature.location', 'Signature', 'Location', {
      'zh-CN': '位置',
      'vi-VN': 'Vị trí',
      'it-IT': 'Posizione',
      'ar-SA': 'الموقع',
      'el-GR': 'Τοποθεσία',
      'ko-KR': '위치',
      'hi-IN': 'स्थान',
    });

    // Buttons and Actions
    this.addTranslation('action.next', 'Actions', 'Next', {
      'zh-CN': '下一步',
      'vi-VN': 'Tiếp theo',
      'it-IT': 'Avanti',
      'ar-SA': 'التالي',
      'el-GR': 'Επόμενο',
      'ko-KR': '다음',
      'hi-IN': 'अगला',
    });

    this.addTranslation('action.back', 'Actions', 'Back', {
      'zh-CN': '返回',
      'vi-VN': 'Quay lại',
      'it-IT': 'Indietro',
      'ar-SA': 'رجوع',
      'el-GR': 'Πίσω',
      'ko-KR': '뒤로',
      'hi-IN': 'वापस',
    });

    this.addTranslation('action.save', 'Actions', 'Save', {
      'zh-CN': '保存',
      'vi-VN': 'Lưu',
      'it-IT': 'Salva',
      'ar-SA': 'حفظ',
      'el-GR': 'Αποθήκευση',
      'ko-KR': '저장',
      'hi-IN': 'सहेजें',
    });

    this.addTranslation('action.submit', 'Actions', 'Submit', {
      'zh-CN': '提交',
      'vi-VN': 'Gửi',
      'it-IT': 'Invia',
      'ar-SA': 'إرسال',
      'el-GR': 'Υποβολή',
      'ko-KR': '제출',
      'hi-IN': 'जमा करें',
    });

    this.addTranslation('action.print', 'Actions', 'Print', {
      'zh-CN': '打印',
      'vi-VN': 'In',
      'it-IT': 'Stampa',
      'ar-SA': 'طباعة',
      'el-GR': 'Εκτύπωση',
      'ko-KR': '인쇄',
      'hi-IN': 'प्रिंट',
    });

    this.addTranslation('action.email', 'Actions', 'Email', {
      'zh-CN': '电子邮件',
      'vi-VN': 'Email',
      'it-IT': 'Email',
      'ar-SA': 'بريد إلكتروني',
      'el-GR': 'Email',
      'ko-KR': '이메일',
      'hi-IN': 'ईमेल',
    });

    this.addTranslation('action.sign', 'Actions', 'Sign Document', {
      'zh-CN': '签署文件',
      'vi-VN': 'Ký Tài liệu',
      'it-IT': 'Firma Documento',
      'ar-SA': 'توقيع المستند',
      'el-GR': 'Υπογραφή Εγγράφου',
      'ko-KR': '문서 서명',
      'hi-IN': 'दस्तावेज़ पर हस्ताक्षर करें',
    });

    // Instructions
    this.addTranslation('instruction.witnessRequired', 'Instructions', 'Two witnesses are required to sign this document.', {
      'zh-CN': '需要两名见证人签署此文件。',
      'vi-VN': 'Cần hai nhân chứng ký tài liệu này.',
      'it-IT': 'Sono necessari due testimoni per firmare questo documento.',
      'ar-SA': 'مطلوب شاهدين للتوقيع على هذه الوثيقة.',
      'el-GR': 'Απαιτούνται δύο μάρτυρες για να υπογράψουν αυτό το έγγραφο.',
      'ko-KR': '이 문서에 서명하려면 두 명의 증인이 필요합니다.',
      'hi-IN': 'इस दस्तावेज़ पर हस्ताक्षर करने के लिए दो गवाहों की आवश्यकता है।',
    });

    this.addTranslation('instruction.gpsRequired', 'Instructions', 'Your location will be recorded with your signature.', {
      'zh-CN': '您的位置将与您的签名一起记录。',
      'vi-VN': 'Vị trí của bạn sẽ được ghi lại cùng với chữ ký.',
      'it-IT': 'La tua posizione verrà registrata con la tua firma.',
      'ar-SA': 'سيتم تسجيل موقعك مع توقيعك.',
      'el-GR': 'Η τοποθεσία σας θα καταγραφεί μαζί με την υπογραφή σας.',
      'ko-KR': '서명과 함께 위치가 기록됩니다.',
      'hi-IN': 'आपके हस्ताक्षर के साथ आपका स्थान रिकॉर्ड किया जाएगा।',
    });
  }

  private addTranslation(
    key: string,
    category: string,
    englishText: string,
    translations: Partial<Record<SupportedLanguage, string>>
  ): void {
    this.translations.set(key, {
      key,
      category,
      englishText,
      translations: { 'en-AU': englishText, ...translations },
    });
  }

  // Get all translation keys
  getAllKeys(): string[] {
    return Array.from(this.translations.keys());
  }

  // Get translation completeness for a language
  getCompleteness(language: SupportedLanguage): number {
    if (language === 'en-AU') return 100;
    
    let total = 0;
    let translated = 0;
    
    this.translations.forEach(t => {
      total++;
      if (t.translations[language]) translated++;
    });
    
    return total > 0 ? Math.round((translated / total) * 100) : 0;
  }

  // Analytics
  getAnalytics(): {
    totalLanguages: number;
    totalTranslations: number;
    averageCompleteness: number;
    byLanguage: { language: string; completeness: number }[];
    byCategory: { category: string; count: number }[];
  } {
    const languages = this.getSupportedLanguages();
    const categories = new Map<string, number>();
    
    this.translations.forEach(t => {
      categories.set(t.category, (categories.get(t.category) || 0) + 1);
    });

    const totalCompleteness = languages.reduce((sum, l) => sum + l.completeness, 0);

    return {
      totalLanguages: languages.length,
      totalTranslations: this.translations.size,
      averageCompleteness: totalCompleteness / languages.length,
      byLanguage: languages.map(l => ({ language: l.name, completeness: l.completeness })),
      byCategory: Array.from(categories.entries()).map(([category, count]) => ({ category, count })),
    };
  }

  // Reset for testing
  reset(): void {
    this.currentLanguage = 'en-AU';
    this.userPreferences.clear();
  }
}

export const multiLanguageSupportService = new MultiLanguageSupportService();
