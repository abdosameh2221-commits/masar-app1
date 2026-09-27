/**
 * وحدة العادات اليومية والنوم والترويح لتطبيق مسار
 * Habits, Sleep Cycles Calculator & Guilt-Free Outings Tracker
 */

import { storage } from '../services/storage.js';

export class HabitsModule {
  // تبديل حالة عادة لليوم
  toggleHabit(habitId) {
    storage.update(data => {
      const habit = data.habits.list.find(h => h.id === habitId);
      if (habit) {
        habit.completedToday = !habit.completedToday;
        if (habit.completedToday) {
          habit.streak = (habit.streak || 0) + 1;
        } else {
          habit.streak = Math.max(0, (habit.streak || 1) - 1);
        }
      }
    });
  }

  // إضافة عادة جديدة
  addHabit(title, category = 'health') {
    storage.update(data => {
      data.habits.list.push({
        id: 'h_' + Date.now(),
        title,
        category,
        streak: 0,
        completedToday: false
      });
    });
  }

  // حذف عادة
  deleteHabit(habitId) {
    storage.update(data => {
      data.habits.list = data.habits.list.filter(h => h.id !== habitId);
    });
  }

  // تسجيل دورة نوم
  logSleep(bedtime, wakeTime, quality = 'جيد') {
    storage.update(data => {
      const [bh, bm] = bedtime.split(':').map(Number);
      const [wh, wm] = wakeTime.split(':').map(Number);
      
      let bedMinutes = bh * 60 + bm;
      let wakeMinutes = wh * 60 + wm;
      if (wakeMinutes <= bedMinutes) {
        wakeMinutes += 24 * 60; // إذا نام قبل منتصف الليل واستيقظ بعده
      }
      
      const totalMinutes = wakeMinutes - bedMinutes;
      const totalHours = Number((totalMinutes / 60).toFixed(1));

      if (!data.habits.sleepLogs) data.habits.sleepLogs = [];
      data.habits.sleepLogs.unshift({
        id: 'sleep_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        bedtime,
        wakeTime,
        totalHours,
        quality
      });
    });
  }

  deleteSleepLog(logId) {
    storage.update(data => {
      data.habits.sleepLogs = (data.habits.sleepLogs || []).filter(l => l.id !== logId);
    });
  }

  // حساب أفضل مواعيد الاستيقاظ بناءً على دورات النوم (90 دقيقة للدورة)
  calculateOptimalWakeTimes(bedtimeStr) {
    if (!bedtimeStr) return [];
    const [h, m] = bedtimeStr.split(':').map(Number);
    const bedDate = new Date();
    bedDate.setHours(h, m, 0, 0);

    // إضافة 15 دقيقة كوقت استغراق في النوم
    const sleepStart = new Date(bedDate.getTime() + 15 * 60000);

    const cycles = [
      { count: 4, label: '6 ساعات (4 دورات - مناسب لأيام الدروس والمذاكرة)' },
      { count: 5, label: '7.5 ساعة (5 دورات - مثالي لطاقة الدماغ والتركيز)' },
      { count: 6, label: '9 ساعات (6 دورات - نوم عميق ومريح لأيام العطلات)' }
    ];

    return cycles.map(c => {
      const wakeTime = new Date(sleepStart.getTime() + (c.count * 90) * 60000);
      const hours = wakeTime.getHours();
      const mins = String(wakeTime.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'م' : 'ص';
      const formattedH = hours % 12 || 12;
      return {
        cycles: c.count,
        time: `${formattedH}:${mins} ${period}`,
        label: c.label
      };
    });
  }

  // تسجيل خروج وترويح عن النفس (للحفاظ على الصحة النفسية وتجنب الاحتراق)
  logOuting(title, durationHours, notes) {
    storage.update(data => {
      if (!data.habits.outings) data.habits.outings = [];
      data.habits.outings.unshift({
        id: 'out_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        title,
        durationHours: Number(durationHours),
        notes: notes || ''
      });
    });
  }

  deleteOuting(outingId) {
    storage.update(data => {
      data.habits.outings = (data.habits.outings || []).filter(o => o.id !== outingId);
    });
  }

  // حساب مؤشر التوازن والإنتاجية الإجمالي لليوم (0 - 100%)
  calculateOverallDailyScore() {
    const data = storage.getData();

    // 1. الصلوات (30 نقطة)
    const prayers = data.prayers;
    const prayerCount = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(p => prayers[p]).length;
    const prayerScore = (prayerCount / 5) * 30;

    // 2. مهام الثانوية (40 نقطة)
    const tasks = data.thanawya.dailyTasks || [];
    const completedTasks = tasks.filter(t => t.completed).length;
    const thanawyaScore = tasks.length > 0 ? (completedTasks / tasks.length) * 40 : 20;

    // 3. العادات الإيجابية (20 نقطة)
    const habits = data.habits.list || [];
    const completedHabits = habits.filter(h => h.completedToday).length;
    const habitScore = habits.length > 0 ? (completedHabits / habits.length) * 20 : 10;

    // 4. الورد القرآني والأذكار (10 نقاط)
    let spiritualScore = 0;
    if (prayers.quranPages >= prayers.quranTarget) spiritualScore += 5;
    if (prayers.adhkarMorning || prayers.adhkarEvening) spiritualScore += 5;

    const total = Math.min(100, Math.round(prayerScore + thanawyaScore + habitScore + spiritualScore));
    return {
      score: total,
      prayerScore: Math.round(prayerScore),
      thanawyaScore: Math.round(thanawyaScore),
      habitScore: Math.round(habitScore),
      spiritualScore
    };
  }
}

export const habitsModule = new HabitsModule();
