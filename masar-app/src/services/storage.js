/**
 * خدمة التخزين المحلي والبيانات لتطبيق مسار 2.0
 * Masar Storage & State Management
 */

const STORAGE_KEY = 'masar_thanawya_app_data_v1';

// البيانات الافتراضية المخصصة لعبدو
export const DEFAULT_DATA = {
  profile: {
    name: 'عبدو',
    goal: 'كلية حاسبات وذكاء اصطناعي 🎯',
    stream: 'علمي رياضة / علوم',
    examDate: '2027-06-15',
    offlineDays: [0, 3], // الأحد والأربعاء كأيام نزول افتراضية
    targetSleepHours: 7,
    dailyStudyTargetHours: 6
  },
  
  // سجل الصلوات والروحانيات لليوم الحالي
  prayers: {
    date: new Date().toISOString().split('T')[0],
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    quranPages: 0,
    quranTarget: 4,
    adhkarMorning: false,
    adhkarEvening: false,
    history: {}
  },

  // إعدادات وبيانات الثانوية العامة
  thanawya: {
    currentMode: 'auto', // 'auto', 'offline' (نزول), 'online' (أونلاين)
    subjects: [
      { id: 'arabic', name: 'اللغة العربية', teacher: 'أستاذ المادة', totalChapters: 12, completedChapters: 3, exams: [{ title: 'شامل نحو', score: 28, maxScore: 30 }] },
      { id: 'english', name: 'اللغة الإنجليزية', teacher: 'مستر المادة', totalChapters: 12, completedChapters: 4, exams: [{ title: 'Unit 1-3 Quiz', score: 48, maxScore: 50 }] },
      { id: 'second_lang', name: 'اللغة الثانية (فرنسي/ألماني)', teacher: 'المسيو/الهير', totalChapters: 6, completedChapters: 2, exams: [] },
      { id: 'physics', name: 'الفيزياء', teacher: 'أستاذ الفيزياء', totalChapters: 8, completedChapters: 2, exams: [{ title: 'الفصل الأول كهربية', score: 55, maxScore: 60 }] },
      { id: 'chemistry', name: 'الكيمياء', teacher: 'دكتور الكيمياء', totalChapters: 5, completedChapters: 1, exams: [] },
      { id: 'math_or_bio', name: 'الرياضيات / الأحياء', teacher: 'أستاذ المادة', totalChapters: 8, completedChapters: 2, exams: [] }
    ],
    // بنك نقاط الضعف والأخطاء في الامتحانات للمراجعة قبل الامتحانات الشاملة
    weakPoints: [
      { id: 'wp1', subjectId: 'physics', topic: 'مسائل كيرشوف المعقدة وتوزيع التيارات', resolved: false, date: new Date().toISOString().split('T')[0] },
      { id: 'wp2', subjectId: 'arabic', topic: 'إعراب الممنوع من الصرف والتمييز الملفوظ', resolved: false, date: new Date().toISOString().split('T')[0] },
      { id: 'wp3', subjectId: 'chemistry', topic: 'حساب مسائل ثابت الاتزان Kc و Kp', resolved: true, date: new Date().toISOString().split('T')[0] }
    ],
    dailyTasks: [
      { id: 't1', title: 'مراجعة واجب كهربية الفيزياء وحل أسئلة بنك المعرفة', subjectId: 'physics', type: 'homework', durationMin: 60, completed: false, isUrgent: true },
      { id: 't2', title: 'حل نموذج قراءة متحررة وبلاغة ونصوص', subjectId: 'arabic', type: 'practice', durationMin: 45, completed: false, isUrgent: false },
      { id: 't3', title: 'مشاهدة محاضرة الكيمياء أونلاين وتلخيص المعادلات', subjectId: 'chemistry', type: 'lecture', durationMin: 75, completed: false, isUrgent: true }
    ],
    offlineSchedule: [
      { day: 0, dayName: 'الأحد', items: [{ time: '14:00 - 16:00', title: 'سنتر الفيزياء', notes: 'أخذ مذكرة الباب الأول + الآلة الحاسبة' }, { time: '17:00 - 19:00', title: 'سنتر الكيمياء', notes: 'تسليم شيت الواجب' }] },
      { day: 3, dayName: 'الأربعاء', items: [{ time: '15:00 - 17:00', title: 'سنتر الرياضة/الأحياء', notes: 'امتحان شامل نصف شهري' }, { time: '18:00 - 20:00', title: 'سنتر الإنجليزي', notes: 'تسميع كلمات الوحدة 3' }] }
    ],
    studySessionsToday: [],
    ambientSound: 'rain' // 'rain', 'waves', 'clock', 'none'
  },

  // إدارة قنوات اليوتيوب والـ AI Automation
  youtubeLab: {
    channels: [
      { id: 'ch1', name: 'قناة الذكاء الاصطناعي والأوتوميشن', niche: 'AI & Automation Tech', subscribers: 'جاري النمو' },
      { id: 'ch2', name: 'قناة قصص/حقائق أوتوميشن', niche: 'Faceless Automation', subscribers: 'جاري النمو' }
    ],
    videoProjects: [
      { id: 'v1', channelId: 'ch1', title: 'أفضل 5 أدوات AI مجانية تضاعف إنتاجيتك', stage: 'scripting', notes: 'التركيز على أدوات أتمتة المهام اليومية', script: 'المقدمة: هل تعلم أن الذكاء الاصطناعي يقدر يختصر 80% من مهامك؟' },
      { id: 'v2', channelId: 'ch1', title: 'كيف تبني بوت تلجرام بالذكاء الاصطناعي', stage: 'editing', notes: 'شرح عملي ومبسط مع الكود', script: '' },
      { id: 'v3', channelId: 'ch2', title: 'قصة نشأة خوارزميات الذكاء الاصطناعي', stage: 'ideas', notes: 'فكرة فيديو طويل للأسبوع القادم', script: '' }
    ],
    learningLog: [
      { id: 'l1', date: new Date().toISOString().split('T')[0], topic: 'Python Basics & Automation Scripts', durationMin: 45, notes: 'تطبيق عملي لأتمتة معالجة النصوص وملفات الفيديو' }
    ]
  },

  // العادات اليومية والنوم
  habits: {
    list: [
      { id: 'h_water', title: 'شرب 2.5 لتر ماء 💧', target: 'daily', streak: 4, completedToday: true, category: 'health' },
      { id: 'h_sleep', title: 'النوم قبل 11:30 مساءً 🌙', target: 'daily', streak: 2, completedToday: false, category: 'sleep' },
      { id: 'h_fajr', title: 'الاستيقاظ لصلاة الفجر 🌅', target: 'daily', streak: 5, completedToday: true, category: 'spiritual' },
      { id: 'h_sport', title: 'تمرين إطالة أو مشي 15 دقيقة 🏃', target: 'daily', streak: 1, completedToday: false, category: 'health' },
      { id: 'h_learn', title: 'جلسة تعلم برمجة / AI مركزة 💻', target: 'daily', streak: 3, completedToday: false, category: 'mind' }
    ],
    sleepLogs: [
      { date: new Date().toISOString().split('T')[0], bedtime: '23:30', wakeTime: '05:30', totalHours: 6.0, quality: 'ممتاز' }
    ],
    outings: [
      { date: new Date().toISOString().split('T')[0], title: 'مشوار ترفيهي مع الأصدقاء / النادي', durationHours: 2, notes: 'شحن طاقة وراحة نفسية' }
    ]
  },

  quickNotes: [
    { id: 'n1', text: 'لا تنس شراء كشكول 100 ورقة لمسائل الفيزياء الصعبة.', timestamp: Date.now() },
    { id: 'n2', text: 'فكرة فيديو يوتيوب شورت: مقارنة سريعة بين نماذج الـ AI للبرمجة.', timestamp: Date.now() }
  ]
};

class StorageService {
  constructor() {
    this.data = this.loadData();
    this.listeners = [];
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.deepMerge(DEFAULT_DATA, parsed);
      }
    } catch (e) {
      console.error('فشل قراءة البيانات من التخزين المحلي:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveData(newData = null) {
    if (newData) {
      this.data = newData;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('فشل حفظ البيانات:', e);
      return false;
    }
  }

  getData() {
    return this.data;
  }

  update(updaterFn) {
    updaterFn(this.data);
    this.saveData();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.data);
      } catch (err) {
        console.error('خطأ في إشعار المستمعين:', err);
      }
    });
  }

  exportBackup() {
    const jsonStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `masar_backup_abdo_${dateStr}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  importBackup(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported && (imported.thanawya || imported.prayers || imported.profile)) {
        this.data = this.deepMerge(DEFAULT_DATA, imported);
        this.saveData();
        return { success: true };
      }
      return { success: false, error: 'الملف لا يحتوي على بنية بيانات تطبيق مسار الصحيحة.' };
    } catch (err) {
      return { success: false, error: 'تنسيق الملف غير صالح (ليس JSON سليم).' };
    }
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData();
  }

  // مسح كافة البيانات الافتراضية والبدء بصفحة بيضاء فارغة تماماً
  clearAllDataToBlank() {
    this.data = {
      profile: {
        name: this.data.profile?.name || 'عبدو',
        goal: this.data.profile?.goal || 'كلية حاسبات وذكاء اصطناعي 🎯',
        stream: this.data.profile?.stream || 'علمي رياضة',
        examDate: this.data.profile?.examDate || '2027-06-15',
        offlineDays: this.data.profile?.offlineDays || [0, 3],
        targetSleepHours: 7,
        dailyStudyTargetHours: 6
      },
      prayers: {
        date: new Date().toISOString().split('T')[0],
        fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false,
        quranPages: 0, quranTarget: 4,
        adhkarMorning: false, adhkarEvening: false,
        history: {}
      },
      thanawya: {
        currentMode: 'auto',
        subjects: [],
        weakPoints: [],
        dailyTasks: [],
        offlineSchedule: [
          { day: 0, dayName: 'الأحد', items: [] },
          { day: 3, dayName: 'الأربعاء', items: [] }
        ],
        studySessionsToday: [],
        ambientSound: 'none'
      },
      youtubeLab: {
        channels: this.data.youtubeLab?.channels || [{ id: 'ch1', name: 'قناتي الأساسية', niche: 'Automation & Tech', subscribers: '0' }],
        videoProjects: [],
        learningLog: []
      },
      habits: {
        list: [],
        sleepLogs: [],
        outings: []
      },
      quickNotes: []
    };
    this.saveData();
  }

  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

export const storage = new StorageService();
