/**
 * المستشار الذكي لتطبيق مسار
 * Smart Advisor & AI Study Co-Pilot (Prepared for Gemini API Integration)
 */

import { storage } from '../services/storage.js';
import { habitsModule } from './habits.js';
import { thanawyaModule } from './thanawya.js';

export class AIAdvisor {
  // تحليل الحالة الحالية وتقديم نصائح ديناميكية ذكية لعبدو
  getSmartAdvice() {
    const data = storage.getData();
    const isOffline = thanawyaModule.isTodayOfflineDay();
    const scoreData = habitsModule.calculateOverallDailyScore();
    const tasks = data.thanawya.dailyTasks || [];
    const urgentTasks = tasks.filter(t => !t.completed && t.isUrgent);
    const hourNow = new Date().getHours();

    const tips = [];

    // 1. نصيحة الصلاة والبركة
    if (!data.prayers.fajr && hourNow >= 6) {
      tips.push({
        type: 'spiritual',
        icon: '🌅',
        title: 'بركة اليوم تبدأ بالفجر',
        text: 'إذا فاتتك صلاة الفجر حاضر، صلها قضاءً الآن وابدأ يومك بركعتين وأذكار، البركة في البكور!'
      });
    } else if (data.prayers.fajr) {
      tips.push({
        type: 'spiritual',
        icon: '✨',
        title: 'استيقاظ مبارك!',
        text: 'أداء الفجر يعطيك أعلى طاقة ذهنية ونقاء ذهني، استغل الساعات الأولى في أصعب مادة (فيزياء أو رياضيات).'
      });
    }

    // 2. نصيحة نمط اليوم (نزول دروس vs أونلاين)
    if (isOffline) {
      tips.push({
        type: 'study',
        icon: '🎒',
        title: 'اليوم يوم نزول وسناتر',
        text: 'تأكد من شحن هاتفك، وأخذ مذكرات السناتر والآلة الحاسبة. استغل وقت المواصلات في قراءة الأذكار أو الاستماع لمراجعة خفيفة، ولا ترهق نفسك بمذاكرة دسمة قبل موعد السنتر مباشرة.'
      });
    } else {
      tips.push({
        type: 'study',
        icon: '💻',
        title: 'اليوم يوم أونلاين ومذاكرة منزلية',
        text: 'فرصتك الذهبية للإنجاز! وزّع يومك إلى جلسات بومودورو (50 دقيقة تركيز + 10 دقائق حركة). ابدأ فوراً بالمهام العاجلة.'
      });
    }

    // 3. نصيحة الموازنة بين اليوتيوب والثانوية
    const todayLogs = (data.youtubeLab.learningLog || []).filter(l => l.date === new Date().toISOString().split('T')[0]);
    const totalTodayMins = todayLogs.reduce((acc, curr) => acc + (curr.durationMin || 0), 0);

    if (totalTodayMins >= 60) {
      tips.push({
        type: 'balance',
        icon: '⚠️',
        title: 'وصلت للحد الآمن لليوتيوب اليوم',
        text: 'قضيت 60 دقيقة في شغف التقنية واليوتيوب، ممتاز جداً! الآن أوقف كل شيء وركّز كامل طاقتك على مواد الثانوية العامة، فحاسبات تنتظرك بمجموعك أولاً!'
      });
    } else {
      tips.push({
        type: 'tech',
        icon: '🚀',
        title: 'طريقك لكلية حاسبات',
        text: `خصصت اليوم ${totalTodayMins} دقيقة للبرمجة. الاستمرار اليومي لـ 30-45 دقيقة يصنع فارقاً هائلاً دون أن يسرق وقت الثانوية.`
      });
    }

    // 4. نصيحة المهام العاجلة
    if (urgentTasks.length > 0) {
      tips.push({
        type: 'urgent',
        icon: '🔥',
        title: `لديك ${urgentTasks.length} مهمة عاجلة اليوم`,
        text: `الأولوية الآن لـ: "${urgentTasks[0].title}". أنهها أولاً وستشعر براحة نفسية لبقية اليوم.`
      });
    }

    return tips;
  }

  /**
   * دالة مجهزة للتطوير المستقبلي للربط مع Gemini API
   * يمكنك تفعيلها مستقبلاً بإدخال مفتاح الـ API الخاص بك
   */
  async generateAIStudyPlanWithGemini(apiKey, prompt) {
    if (!apiKey) {
      return {
        success: false,
        message: 'يرجى إدخال Gemini API Key في إعدادات التطبيق للاستفادة من الذكاء الاصطناعي الحي.'
      };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `أنت مرشد أكاديمي ذكي لطالب ثانوية عامة مصري اسمه عبدو، طموحه دخول كلية حاسبات وذكاء اصطناعي. قدم له نصيحة مخصصة أو خطة سريعة بناءً على هذا المعطى:\n${prompt}`
            }]
          }]
        })
      });

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, reply };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { success: false, message: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ' + error.message };
    }
  }
}

export const aiAdvisor = new AIAdvisor();
