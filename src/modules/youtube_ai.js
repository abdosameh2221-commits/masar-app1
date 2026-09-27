/**
 * مختبر أوتوميشن اليوتيوب ومولد السكريبتات الذكي لتطبيق مسار 2.0
 * YouTube Automation & AI Script Co-Pilot
 */

import { storage } from '../services/storage.js';

export class YouTubeAIModule {
  constructor() {
    this.STAGES = [
      { id: 'ideas', name: 'أفكار المحتوى 💡', color: 'border-amber-400 bg-amber-50 text-amber-700' },
      { id: 'scripting', name: 'كتابة السكريبت ✍️', color: 'border-blue-400 bg-blue-50 text-blue-700' },
      { id: 'ai_gen', name: 'توليد بالـ AI 🤖', color: 'border-purple-400 bg-purple-50 text-purple-700' },
      { id: 'editing', name: 'المونتاج والإخراج 🎬', color: 'border-pink-400 bg-pink-50 text-pink-700' },
      { id: 'published', name: 'مجدول / منشور 🚀', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' }
    ];
  }

  addVideo(video) {
    storage.update(data => {
      video.id = 'vid_' + Date.now();
      video.createdAt = new Date().toISOString().split('T')[0];
      video.script = video.script || '';
      data.youtubeLab.videoProjects.push(video);
    });
  }

  updateVideoStage(videoId, newStage) {
    storage.update(data => {
      const vid = data.youtubeLab.videoProjects.find(v => v.id === videoId);
      if (vid) {
        vid.stage = newStage;
      }
    });
  }

  updateVideoScript(videoId, scriptText) {
    storage.update(data => {
      const vid = data.youtubeLab.videoProjects.find(v => v.id === videoId);
      if (vid) {
        vid.script = scriptText;
      }
    });
  }

  deleteVideo(videoId) {
    storage.update(data => {
      data.youtubeLab.videoProjects = data.youtubeLab.videoProjects.filter(v => v.id !== videoId);
    });
  }

  addChannel(channelName, niche) {
    storage.update(data => {
      data.youtubeLab.channels.push({
        id: 'ch_' + Date.now(),
        name: channelName,
        niche: niche || 'Automation & Tech',
        subscribers: 'جاري النمو'
      });
    });
  }

  // مولد سكريبت يوتيوب أوتوميشن ذكي وتلقائي
  generateScriptTemplate(title, format = 'shorts') {
    if (format === 'shorts') {
      return `🎬 سكريبت شورتس / ريلز سريع (أوتوميشن)
العنوان: ${title}

1️⃣ الخطاف لجذب الانتباه (0:00 - 0:03):
"لو بتضيع ساعات في ${title.slice(0, 30)}، الحركة دي هتغير يومك للأبد!"

2️⃣ إثارة الفضول والمشكلة (0:03 - 0:12):
"أغلب الناس لسه بتعمل الحاجات دي يدوي، بينما بأداة ذكاء اصطناعي واحدة تقدر تخلصها في 5 ثواني بس وبضغطة زر واحدة."

3️⃣ الشرح العملي والخطوات (0:12 - 0:45):
- الخطوة 1: ادخل على الأداة أو السكريبت المخصص.
- الخطوة 2: اكتب البرومبت المناسب وحدد المخرجات.
- الخطوة 3: شوف النتيجة المذهلة اللي وفرت عليك ساعات شغل!

4️⃣ الخاتمة والدعوة للتفاعل (0:45 - 0:55):
"احفظ الفيديو ده عشان هتحتاجه، وقولي في التعليقات عايز شرح تفصيلي عن إيه المرة الجاية؟ ومتنساش الفولو عشان يوصلك كل جديد في عالم الـ AI!"`;
    } else {
      return `🎥 هيكل فيديو طويل تفصيلي
العنوان: ${title}

📌 المقدمة والـ Hook (الدقيقة 0 - 1:30):
- لقطة تشويقية للنتيجة النهائية قبل الشرح.
- ترحيب سريع وشرح القيمة اللي المشاهد هيخرج بيها من الفيديو.

📌 الفصل الأول: الأدوات المطلوبة والإعداد (الدقيقة 1:30 - 4:00):
- شرح مبسط للأدوات والروابط.

📌 الفصل الثاني: التطبيق العملي خطوة بخطوة (الدقيقة 4:00 - 9:00):
- مشاركة الشاشة والشرح العملي وتوضيح الأخطاء الشائعة وحلها.

📌 الفصل الثالث: الخلاصة وتطوير الفكرة (الدقيقة 9:00 - 11:00):
- نصيحة احترافية للمشاهدين.

📌 الخاتمة (الدقيقة 11:00 - 12:00):
- تلخيص سريع ودعوة للاشتراك وتفعيل الجرس.`;
    }
  }

  logLearningSession(topic, durationMin, notes) {
    storage.update(data => {
      if (!data.youtubeLab.learningLog) data.youtubeLab.learningLog = [];
      data.youtubeLab.learningLog.unshift({
        id: 'learn_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        topic,
        durationMin: Number(durationMin),
        notes: notes || ''
      });
    });
  }

  deleteLearningLog(logId) {
    storage.update(data => {
      data.youtubeLab.learningLog = (data.youtubeLab.learningLog || []).filter(l => l.id !== logId);
    });
  }

  getTotalLearningHours() {
    const data = storage.getData();
    const logs = data.youtubeLab.learningLog || [];
    const totalMins = logs.reduce((acc, curr) => acc + (curr.durationMin || 0), 0);
    return (totalMins / 60).toFixed(1);
  }

  checkSafeTimeAdherence() {
    const data = storage.getData();
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = (data.youtubeLab.learningLog || []).filter(l => l.date === today);
    const totalTodayMins = todayLogs.reduce((acc, curr) => acc + (curr.durationMin || 0), 0);

    const safeLimitMins = 60;
    return {
      totalTodayMins,
      safeLimitMins,
      isExceeded: totalTodayMins > safeLimitMins,
      remainingSafeMins: Math.max(0, safeLimitMins - totalTodayMins)
    };
  }
}

export const youtubeAIModule = new YouTubeAIModule();
