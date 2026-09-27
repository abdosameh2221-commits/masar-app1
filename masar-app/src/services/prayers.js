/**
 * محرك حساب وتتبع مواقيت الصلاة لتطبيق مسار
 * Masar Prayer Times & Spiritual Engine (Egypt Standard: Lat 30.0444, Lng 31.2357)
 */

import { storage } from './storage.js';

export class PrayerService {
  constructor() {
    // إحداثيات القاهرة (المتوسط لجمهورية مصر العربية)
    this.latitude = 30.0444;
    this.longitude = 31.2357;
    this.timezone = 2; // مصر عادة UTC+2 (أو +3 مع التوقيت الصيفي)
  }

  // حساب مواقيت الصلاة ليوم محدد
  getPrayerTimes(date = new Date()) {
    // الكشف التلقائي عن فرق التوقيت للجهاز
    const timezoneOffset = -date.getTimezoneOffset() / 60;
    
    // خوارزمية فلكية دقيقة لمواقيت الصلاة وفق الهيئة المصرية العامة للمساحة
    // زاوية الفجر: 19.5°، زاوية العشاء: 17.5°
    const dayOfYear = this.getDayOfYear(date);
    const times = this.calculateTimes(dayOfYear, timezoneOffset);

    return [
      { id: 'fajr', name: 'الفجر', arabicName: 'صلاة الفجر', time: times.fajr, icon: '🌅' },
      { id: 'sunrise', name: 'الشروق', arabicName: 'شروق الشمس', time: times.sunrise, icon: '☀️' },
      { id: 'dhuhr', name: 'الظهر', arabicName: 'صلاة الظهر', time: times.dhuhr, icon: '🌞' },
      { id: 'asr', name: 'العصر', arabicName: 'صلاة العصر', time: times.asr, icon: '🌤️' },
      { id: 'maghrib', name: 'المغرب', arabicName: 'صلاة المغرب', time: times.maghrib, icon: '🌇' },
      { id: 'isha', name: 'العشاء', arabicName: 'صلاة العشاء', time: times.isha, icon: '🌙' }
    ];
  }

  // معرفة الصلاة القادمة والوقت المتبقي
  getNextPrayer(date = new Date()) {
    const prayers = this.getPrayerTimes(date).filter(p => p.id !== 'sunrise');
    const nowMinutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

    for (let prayer of prayers) {
      const [h, m] = prayer.time.split(':').map(Number);
      const prayerMinutes = h * 60 + m;
      if (prayerMinutes > nowMinutes) {
        const diffMinutes = Math.round(prayerMinutes - nowMinutes);
        const hoursLeft = Math.floor(diffMinutes / 60);
        const minsLeft = diffMinutes % 60;
        return {
          currentOrNext: prayer,
          isNext: true,
          diffMinutes,
          formattedLeft: `${hoursLeft > 0 ? hoursLeft + ' س و ' : ''}${minsLeft} د`
        };
      }
    }

    // إذا انتهت صلوات اليوم، فالصلاة القادمة هي فجر الغد
    const fajr = prayers[0];
    const [fh, fm] = fajr.time.split(':').map(Number);
    const fajrTomorrowMins = (24 * 60 - nowMinutes) + (fh * 60 + fm);
    const hoursLeft = Math.floor(fajrTomorrowMins / 60);
    const minsLeft = Math.round(fajrTomorrowMins % 60);

    return {
      currentOrNext: fajr,
      isNext: true,
      diffMinutes: fajrTomorrowMins,
      formattedLeft: `${hoursLeft > 0 ? hoursLeft + ' س و ' : ''}${minsLeft} د`
    };
  }

  // تنسيق الوقت إلى نظام 12 ساعة بالعربية (مثال: 04:30 ص)
  format12Hour(time24) {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? 'م' : 'ص';
    hour = hour % 12 || 12;
    return `${hour}:${minStr} ${period}`;
  }

  // تشغيل نغمة تنبيه صوتية لطيفة (Web Audio API بدون ملفات خارجية)
  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(523.25, 0, 0.4);  // C5
      playTone(659.25, 0.2, 0.4); // E5
      playTone(783.99, 0.4, 0.8); // G5
    } catch (e) {
      console.log('الصوت غير مفعل:', e);
    }
  }

  // دوال الحساب الفلكي
  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  calculateTimes(dayOfYear, timezone) {
    // زاوية ميل الشمس (Declination)
    const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
    const declination = 23.45 * Math.sin(B) * (Math.PI / 180);
    
    // معادلة الوقت (Equation of Time بالدقائق)
    const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

    // زاوية خط العرض بالراديان
    const latRad = this.latitude * (Math.PI / 180);

    // زوال الشمس (الظهر)
    const solarNoon = 12 + (4 * (15 * timezone - this.longitude) - EoT) / 60;

    // زوايا الحساب
    const fajrAngle = 19.5 * (Math.PI / 180); // الهيئة المصرية
    const ishaAngle = 17.5 * (Math.PI / 180); // الهيئة المصرية
    const sunriseAngle = 0.833 * (Math.PI / 180); // الشروق والغروب القياسي

    // حساب زاوية العصر (المذهب الشافعي/الجمهور: ظل الشيء مثله)
    const asrAltitude = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - declination))));

    const calcHourAngle = (angle, isAbove) => {
      const cosH = (Math.sin(angle * (isAbove ? 1 : -1)) - Math.sin(latRad) * Math.sin(declination)) /
                   (Math.cos(latRad) * Math.cos(declination));
      if (cosH > 1 || cosH < -1) return 0;
      return Math.acos(cosH) * (180 / Math.PI) / 15;
    };

    const asrHourAngle = Math.acos((Math.sin(asrAltitude) - Math.sin(latRad) * Math.sin(declination)) /
                         (Math.cos(latRad) * Math.cos(declination))) * (180 / Math.PI) / 15;

    const fajrH = calcHourAngle(fajrAngle, false);
    const sunH = calcHourAngle(sunriseAngle, false);
    const ishaH = calcHourAngle(ishaAngle, false);

    const formatHour = (decHour) => {
      let h = Math.floor(decHour);
      let m = Math.round((decHour - h) * 60);
      if (m >= 60) { h += 1; m = 0; }
      h = (h + 24) % 24;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return {
      fajr: formatHour(solarNoon - fajrH),
      sunrise: formatHour(solarNoon - sunH),
      dhuhr: formatHour(solarNoon),
      asr: formatHour(solarNoon + asrHourAngle),
      maghrib: formatHour(solarNoon + sunH),
      isha: formatHour(solarNoon + ishaH)
    };
  }
}

export const prayerService = new PrayerService();
