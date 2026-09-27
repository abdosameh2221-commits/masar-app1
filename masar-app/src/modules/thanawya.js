/**
 * وحدة إدارة ومذاكرة الثانوية العامة لتطبيق مسار 2.0
 * Thanawya Hub: Offline vs Online Day Modes, Pomodoro with Ambient Sounds, Exam Weak Points
 */

import { storage } from '../services/storage.js';

export class ThanawyaModule {
  constructor() {
    this.pomodoroTimer = null;
    this.pomodoroRemainingSeconds = 50 * 60;
    this.pomodoroMode = 'study'; // 'study' أو 'break'
    this.pomodoroRunning = false;
    
    // محرك الأصوات البيئية للتركيز
    this.audioCtx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.currentAmbientSound = 'none'; // 'rain', 'waves', 'clock', 'none'
  }

  isTodayOfflineDay() {
    const data = storage.getData();
    if (data.thanawya.currentMode === 'offline') return true;
    if (data.thanawya.currentMode === 'online') return false;

    const todayIndex = new Date().getDay();
    const offlineDays = data.profile.offlineDays || [0, 3];
    return offlineDays.includes(todayIndex);
  }

  setDayMode(mode) {
    storage.update(data => {
      data.thanawya.currentMode = mode;
    });
  }

  getDaysUntilExams() {
    const data = storage.getData();
    const examDate = new Date(data.profile.examDate || '2027-06-15');
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // إدارة المواد
  addSubject(subject) {
    storage.update(data => {
      subject.id = 'sub_' + Date.now();
      subject.completedChapters = subject.completedChapters || 0;
      subject.exams = [];
      data.thanawya.subjects.push(subject);
    });
  }

  updateSubjectProgress(subjectId, completedChapters) {
    storage.update(data => {
      const sub = data.thanawya.subjects.find(s => s.id === subjectId);
      if (sub) {
        sub.completedChapters = Math.max(0, Math.min(sub.totalChapters, completedChapters));
      }
    });
  }

  addExamScore(subjectId, examTitle, score, maxScore) {
    storage.update(data => {
      const sub = data.thanawya.subjects.find(s => s.id === subjectId);
      if (sub) {
        if (!sub.exams) sub.exams = [];
        sub.exams.push({
          id: 'ex_' + Date.now(),
          title: examTitle,
          score: Number(score),
          maxScore: Number(maxScore),
          date: new Date().toISOString().split('T')[0]
        });
      }
    });
  }

  // حذف مادة دراسية بالكامل مع مهامها ونقاط ضعفها
  deleteSubject(subjectId) {
    storage.update(data => {
      data.thanawya.subjects = (data.thanawya.subjects || []).filter(s => s.id !== subjectId);
      data.thanawya.dailyTasks = (data.thanawya.dailyTasks || []).filter(t => t.subjectId !== subjectId);
      data.thanawya.weakPoints = (data.thanawya.weakPoints || []).filter(w => w.subjectId !== subjectId);
    });
  }

  // حذف درجة امتحان
  deleteExamScore(subjectId, examId) {
    storage.update(data => {
      const sub = (data.thanawya.subjects || []).find(s => s.id === subjectId);
      if (sub && sub.exams) {
        sub.exams = sub.exams.filter(e => e.id !== examId);
      }
    });
  }

  // إدارة بنك نقاط الضعف والأخطاء في الامتحانات
  addWeakPoint(subjectId, topic) {
    storage.update(data => {
      if (!data.thanawya.weakPoints) data.thanawya.weakPoints = [];
      data.thanawya.weakPoints.unshift({
        id: 'wp_' + Date.now(),
        subjectId,
        topic,
        resolved: false,
        date: new Date().toISOString().split('T')[0]
      });
    });
  }

  toggleWeakPoint(id) {
    storage.update(data => {
      const wp = (data.thanawya.weakPoints || []).find(w => w.id === id);
      if (wp) {
        wp.resolved = !wp.resolved;
      }
    });
  }

  deleteWeakPoint(id) {
    storage.update(data => {
      data.thanawya.weakPoints = (data.thanawya.weakPoints || []).filter(w => w.id !== id);
    });
  }

  // إدارة مهام المذاكرة اليومية
  addTask(task) {
    storage.update(data => {
      task.id = 'task_' + Date.now();
      task.completed = false;
      data.thanawya.dailyTasks.push(task);
    });
  }

  toggleTask(taskId) {
    storage.update(data => {
      const t = data.thanawya.dailyTasks.find(item => item.id === taskId);
      if (t) {
        t.completed = !t.completed;
      }
    });
  }

  deleteTask(taskId) {
    storage.update(data => {
      data.thanawya.dailyTasks = data.thanawya.dailyTasks.filter(item => item.id !== taskId);
    });
  }

  // جدول النزول
  addOfflineItem(dayIndex, item) {
    storage.update(data => {
      let daySchedule = data.thanawya.offlineSchedule.find(d => d.day === dayIndex);
      if (!daySchedule) {
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        daySchedule = { day: dayIndex, dayName: dayNames[dayIndex], items: [] };
        data.thanawya.offlineSchedule.push(daySchedule);
      }
      daySchedule.items.push(item);
    });
  }

  deleteOfflineItem(dayIndex, itemIndex) {
    storage.update(data => {
      const daySchedule = (data.thanawya.offlineSchedule || []).find(d => d.day === dayIndex);
      if (daySchedule && daySchedule.items) {
        daySchedule.items.splice(itemIndex, 1);
      }
    });
  }

  // بومودورو المذاكرة
  startPomodoro(onTick, onComplete) {
    if (this.pomodoroRunning) return;
    this.pomodoroRunning = true;

    // تشغيل الصوت البيئي المختار إن وجد
    if (this.pomodoroMode === 'study') {
      this.playAmbientSound(this.currentAmbientSound);
    }

    this.pomodoroTimer = setInterval(() => {
      if (this.pomodoroRemainingSeconds > 0) {
        this.pomodoroRemainingSeconds--;
        if (onTick) onTick(this.getPomodoroState());
      } else {
        this.stopPomodoro();
        this.stopAmbientSound();
        this.playTimerBell();
        
        if (this.pomodoroMode === 'study') {
          this.logCompletedSession();
          this.pomodoroMode = 'break';
          this.pomodoroRemainingSeconds = 10 * 60;
        } else {
          this.pomodoroMode = 'study';
          this.pomodoroRemainingSeconds = 50 * 60;
        }

        if (onComplete) onComplete(this.getPomodoroState());
      }
    }, 1000);
  }

  pausePomodoro(onTick) {
    this.stopPomodoro();
    this.stopAmbientSound();
    if (onTick) onTick(this.getPomodoroState());
  }

  resetPomodoro(minutes = 50, mode = 'study') {
    this.stopPomodoro();
    this.stopAmbientSound();
    this.pomodoroMode = mode;
    this.pomodoroRemainingSeconds = minutes * 60;
  }

  stopPomodoro() {
    if (this.pomodoroTimer) {
      clearInterval(this.pomodoroTimer);
      this.pomodoroTimer = null;
    }
    this.pomodoroRunning = false;
  }

  getPomodoroState() {
    const mins = Math.floor(this.pomodoroRemainingSeconds / 60);
    const secs = this.pomodoroRemainingSeconds % 60;
    return {
      running: this.pomodoroRunning,
      mode: this.pomodoroMode,
      formattedTime: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      remainingSeconds: this.pomodoroRemainingSeconds,
      ambient: this.currentAmbientSound
    };
  }

  logCompletedSession() {
    storage.update(data => {
      if (!data.thanawya.studySessionsToday) data.thanawya.studySessionsToday = [];
      data.thanawya.studySessionsToday.push({
        id: 'sess_' + Date.now(),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        durationMin: 50
      });
    });
  }

  // =========================================================================
  // محرك الأصوات البيئية المهدئة للتركيز (Synthesized Ambient Focus Engine)
  // =========================================================================
  setAmbientSoundType(type) {
    this.currentAmbientSound = type;
    if (this.pomodoroRunning && this.pomodoroMode === 'study') {
      this.playAmbientSound(type);
    }
  }

  playAmbientSound(type) {
    this.stopAmbientSound();
    if (!type || type === 'none') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.ambientGain = this.audioCtx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

      if (type === 'rain') {
        // صوت مطر هادئ مولد باستخدام Pink Noise + LowPass Filter
        const bufferSize = this.audioCtx.sampleRate * 2;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoise = this.audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.audioCtx.destination);
        whiteNoise.start();
        this.ambientSource = whiteNoise;

      } else if (type === 'waves') {
        // صوت أمواج مهدئة عبر مذبذب بتردد منخفض
        const osc = this.audioCtx.createOscillator();
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, this.audioCtx.currentTime); // دورة بطيئة للأمواج
        lfoGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

        lfo.connect(this.ambientGain.gain);
        osc.connect(this.ambientGain);
        this.ambientGain.connect(this.audioCtx.destination);

        osc.start();
        lfo.start();
        this.ambientSource = osc;
      }
    } catch (e) {
      console.log('تعذر تشغيل الصوت البيئي:', e);
    }
  }

  stopAmbientSound() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
    }
  }

  playTimerBell() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  }
}

export const thanawyaModule = new ThanawyaModule();
