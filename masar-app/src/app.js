/**
 * تطبيق مسار 2.0 - المحرك الرئيسي وربط واجهة المستخدم المشرقة
 * Masar App Orchestrator (Light Mint Edition)
 */

import { storage } from './services/storage.js';
import { prayerService } from './services/prayers.js';
import { thanawyaModule } from './modules/thanawya.js';
import { youtubeAIModule } from './modules/youtube_ai.js';
import { habitsModule } from './modules/habits.js';
import { aiAdvisor } from './modules/ai_advisor.js';

class MasarApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.init();
  }

  init() {
    this.initTabs();

    storage.subscribe(() => {
      this.render();
    });

    this.initEventListeners();

    setInterval(() => {
      this.renderHeaderBadges();
      this.renderPrayers();
    }, 60000);

    this.render();
  }

  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    window.switchTab = (tab) => this.switchTab(tab);
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('bg-emerald-600', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('shadow-md', isActive);
      btn.classList.toggle('text-slate-600', !isActive);
      btn.classList.toggle('hover:bg-emerald-50', !isActive);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  render() {
    this.renderHeaderBadges();
    this.renderDashboard();
    this.renderPrayers();
    this.renderThanawya();
    this.renderYouTubeAI();
    this.renderHabits();
    this.renderSettings();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // =========================================================================
  // 1. الشريط العلوي
  // =========================================================================
  renderHeaderBadges() {
    const data = storage.getData();
    const isOffline = thanawyaModule.isTodayOfflineDay();
    const nextPrayerInfo = prayerService.getNextPrayer();
    const scoreData = habitsModule.calculateOverallDailyScore();

    const userName = data.profile.name || 'عبدو';
    const topNameEl = document.getElementById('top-user-name');
    const heroNameEl = document.getElementById('hero-user-name');
    if (topNameEl) topNameEl.textContent = userName;
    if (heroNameEl) heroNameEl.textContent = userName;

    const quickDayText = document.getElementById('quick-day-text');
    if (quickDayText) {
      if (isOffline) {
        quickDayText.innerHTML = '<span class="text-amber-800">🎒 اليوم نزول سناتر</span>';
      } else {
        quickDayText.innerHTML = '<span class="text-emerald-800">💻 اليوم أونلاين ومذاكرة</span>';
      }
    }

    const quickPrayerText = document.getElementById('quick-prayer-text');
    if (quickPrayerText && nextPrayerInfo) {
      const p = nextPrayerInfo.currentOrNext;
      const formattedTime = prayerService.format12Hour(p.time);
      quickPrayerText.textContent = `${p.arabicName}: ${formattedTime} (متبقي ${nextPrayerInfo.formattedLeft})`;
    }

    const quickScoreEl = document.getElementById('quick-daily-score');
    if (quickScoreEl) {
      quickScoreEl.textContent = `${scoreData.score}%`;
    }
  }

  // =========================================================================
  // 2. لوحة التحكم
  // =========================================================================
  renderDashboard() {
    const data = storage.getData();
    const isOffline = thanawyaModule.isTodayOfflineDay();

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = today.toLocaleDateString('ar-EG', options);
    const heroDateEl = document.getElementById('hero-date-text');
    if (heroDateEl) heroDateEl.textContent = dateStr;

    const daysLeft = thanawyaModule.getDaysUntilExams();
    const countdownEl = document.getElementById('countdown-days');
    if (countdownEl) countdownEl.textContent = daysLeft;

    // الإحصائيات
    const prayers = data.prayers;
    const prayersDone = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(p => prayers[p]).length;
    document.getElementById('stat-prayers-done').textContent = prayersDone;
    document.getElementById('stat-prayers-bar').style.width = `${(prayersDone / 5) * 100}%`;

    const tasks = data.thanawya.dailyTasks || [];
    const tasksDone = tasks.filter(t => t.completed).length;
    document.getElementById('stat-tasks-done').textContent = tasksDone;
    document.getElementById('stat-tasks-total').textContent = `/ ${tasks.length}`;
    document.getElementById('stat-tasks-bar').style.width = tasks.length > 0 ? `${(tasksDone / tasks.length) * 100}%` : '0%';

    const habits = data.habits.list || [];
    const habitsDone = habits.filter(h => h.completedToday).length;
    document.getElementById('stat-habits-done').textContent = habitsDone;
    document.getElementById('stat-habits-total').textContent = `/ ${habits.length}`;
    document.getElementById('stat-habits-bar').style.width = habits.length > 0 ? `${(habitsDone / habits.length) * 100}%` : '0%';

    const ytAdherence = youtubeAIModule.checkSafeTimeAdherence();
    document.getElementById('stat-youtube-mins').textContent = ytAdherence.totalTodayMins;
    const ytPercent = Math.min(100, (ytAdherence.totalTodayMins / ytAdherence.safeLimitMins) * 100);
    const ytBar = document.getElementById('stat-youtube-bar');
    ytBar.style.width = `${ytPercent}%`;
    ytBar.className = ytAdherence.isExceeded ? 'bg-red-500 h-full rounded-full transition-all' : 'bg-purple-500 h-full rounded-full transition-all';

    // كارت وضع اليوم
    const dayCard = document.getElementById('dashboard-day-card');
    if (dayCard) {
      if (isOffline) {
        dayCard.className = 'rounded-2xl p-5 border border-amber-200 bg-amber-50/70 mint-card';
        dayCard.innerHTML = `
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <span>🎒</span>
                <span>نظام اليوم: يوم نزول للسناتر والدروس</span>
              </div>
              <h4 class="text-base font-black text-slate-900">تأكد من شحن طاقتك وتجهيز حقيبة الدروس!</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                لديك مشاوير وسناتر اليوم. لا ترهق نفسك بمذاكرة شاقة قبل النزول مباشرة، ركّز على حضور الذهن في الحصة وتدوين ملاحظات المستر، واجعل المذاكرة الرئيسية في أيام الأونلاين.
              </p>
            </div>
            <button onclick="window.switchTab('thanawya')" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex-shrink-0 shadow-sm transition-colors">
              عرض جدول السناتر
            </button>
          </div>
        `;
      } else {
        dayCard.className = 'rounded-2xl p-5 border border-emerald-200 bg-emerald-50/60 mint-card';
        dayCard.innerHTML = `
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <span>💻</span>
                <span>نظام اليوم: يوم أونلاين ومذاكرة منزلية عميقة</span>
              </div>
              <h4 class="text-base font-black text-slate-900">يومك الذهبي لإنجاز الواجبات وتكثيف الحل!</h4>
              <p class="text-xs text-slate-600 leading-relaxed">
                أنت في بيئتك الهادئة بدون إهدار وقت في المواصلات. ابدأ بالمهام العاجلة، واستخدم مؤقت البومودورو لإنجاز الفصول الصعبة (الفيزياء، الكيمياء، الرياضة).
              </p>
            </div>
            <button onclick="window.switchTab('thanawya')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex-shrink-0 shadow-sm transition-colors">
              ابدأ جلسة تركيز
            </button>
          </div>
        `;
      }
    }

    // المهام السريعة
    const tasksList = document.getElementById('dashboard-tasks-list');
    if (tasksList) {
      if (tasks.length === 0) {
        tasksList.innerHTML = `<div class="text-xs text-slate-400 text-center py-4">لا توجد مهام مسجلة لليوم. اضغط على إدارة المهام لإضافة موادك!</div>`;
      } else {
        tasksList.innerHTML = tasks.slice(0, 4).map(task => {
          const subject = data.thanawya.subjects.find(s => s.id === task.subjectId);
          const subName = subject ? subject.name : 'مادة';
          return `
            <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
              <div class="flex items-center gap-3">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="window.toggleTask('${task.id}')" class="custom-checkbox">
                <div>
                  <div class="text-xs font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}">${task.title}</div>
                  <div class="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">${subName}</span>
                    <span>⏱️ ${task.durationMin} دقيقة</span>
                    ${task.isUrgent ? '<span class="text-red-600 font-bold">عاجل 🔥</span>' : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // نصائح المستشار الذكي
    const tipsContainer = document.getElementById('ai-advisor-tips');
    if (tipsContainer) {
      const tips = aiAdvisor.getSmartAdvice();
      tipsContainer.innerHTML = tips.map(tip => `
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <span>${tip.icon}</span>
            <span>${tip.title}</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">${tip.text}</p>
        </div>
      `).join('');
    }

    // الملاحظات السريعة
    const notesList = document.getElementById('quick-notes-list');
    if (notesList) {
      const notes = data.quickNotes || [];
      if (notes.length === 0) {
        notesList.innerHTML = '<div class="text-[11px] text-slate-400 text-center py-2">لا توجد ملاحظات سريعة.</div>';
      } else {
        notesList.innerHTML = notes.map(note => `
          <div class="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
            <span class="flex-1">${note.text}</span>
            <button onclick="window.deleteQuickNote('${note.id}')" class="text-slate-400 hover:text-red-500 text-xs">✕</button>
          </div>
        `).join('');
      }
    }
  }

  // =========================================================================
  // 3. ركن الصلوات
  // =========================================================================
  renderPrayers() {
    const data = storage.getData();
    const prayerTimes = prayerService.getPrayerTimes();
    const nextPrayerInfo = prayerService.getNextPrayer();
    const prayersData = data.prayers;

    const hijriEl = document.getElementById('prayers-hijri-date');
    if (hijriEl) {
      try {
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date());
        hijriEl.textContent = hijriDate;
      } catch (e) {
        hijriEl.textContent = 'جمهورية مصر العربية';
      }
    }

    const grid = document.getElementById('prayers-grid');
    if (grid) {
      grid.innerHTML = prayerTimes.map(prayer => {
        const isSunrise = prayer.id === 'sunrise';
        const isDone = !isSunrise && prayersData[prayer.id];
        const isNext = nextPrayerInfo && nextPrayerInfo.currentOrNext.id === prayer.id;
        const formattedTime = prayerService.format12Hour(prayer.time);

        return `
          <div class="mint-card p-4 text-center space-y-2 border transition-all ${
            isNext ? 'border-emerald-500 bg-emerald-50/80 shadow-md shadow-emerald-500/10' :
            isDone ? 'border-teal-300 bg-teal-50/50' : 'border-slate-200'
          }">
            <div class="text-2xl">${prayer.icon}</div>
            <div class="text-sm font-black text-slate-900">${prayer.name}</div>
            <div class="text-xs font-mono font-bold text-slate-600">${formattedTime}</div>

            ${isSunrise ? `
              <div class="text-[10px] text-slate-400 pt-2 font-medium">وقت الإشراق</div>
            ` : `
              <button onclick="window.togglePrayer('${prayer.id}')" class="w-full mt-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                isDone ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
              }">
                ${isDone ? '✓ تم الأداء' : 'تسجيل الصلاة'}
              </button>
            `}
          </div>
        `;
      }).join('');
    }

    const quranPages = prayersData.quranPages || 0;
    const quranCountEl = document.getElementById('quran-pages-count');
    const quranBadgeEl = document.getElementById('quran-pages-badge');
    if (quranCountEl) quranCountEl.textContent = quranPages;
    if (quranBadgeEl) quranBadgeEl.textContent = `${quranPages} / ${prayersData.quranTarget || 4} صفحات`;

    const morningCheck = document.getElementById('adhkar-morning-check');
    const eveningCheck = document.getElementById('adhkar-evening-check');
    if (morningCheck) morningCheck.checked = !!prayersData.adhkarMorning;
    if (eveningCheck) eveningCheck.checked = !!prayersData.adhkarEvening;
  }

  // =========================================================================
  // 4. مذاكرة الثانوية وبنك نقاط الضعف
  // =========================================================================
  renderThanawya() {
    const data = storage.getData();
    const currentMode = data.thanawya.currentMode || 'auto';
    const isOffline = thanawyaModule.isTodayOfflineDay();

    ['auto', 'offline', 'online'].forEach(mode => {
      const btn = document.getElementById(`mode-${mode}-btn`);
      if (btn) {
        const isActive = currentMode === mode;
        btn.className = isActive ?
          'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-800 shadow-sm border border-slate-200' :
          'px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors';
      }
    });

    // المحتوى المشروط
    const modeContainer = document.getElementById('thanawya-dynamic-mode-view');
    if (modeContainer) {
      if (isOffline) {
        const todayDayIndex = new Date().getDay();
        const scheduleToday = (data.thanawya.offlineSchedule || []).find(s => s.day === todayDayIndex);
        const items = scheduleToday ? scheduleToday.items : [];

        modeContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div class="mint-card p-5 space-y-4 border-r-4 border-r-amber-500">
              <div class="flex items-center gap-2">
                <span class="text-xl">🎒</span>
                <div>
                  <h4 class="font-black text-slate-900 text-sm">محتويات حقيبة النزول اليوم</h4>
                  <p class="text-[11px] text-slate-500">راجع أدواتك قبل الخروج من المنزل</p>
                </div>
              </div>

              <div class="space-y-2 text-xs text-slate-700">
                <label class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <input type="checkbox" checked class="custom-checkbox">
                  <span>مذكرات السنتر المطلوبة والواجب المحلول</span>
                </label>
                <label class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <input type="checkbox" checked class="custom-checkbox">
                  <span>الآلة الحاسبة وكشكول الملاحظات الإضافي</span>
                </label>
                <label class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <input type="checkbox" class="custom-checkbox">
                  <span>شحن الهاتف بالكامل وزجاجة ماء</span>
                </label>
                <label class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <input type="checkbox" class="custom-checkbox">
                  <span>سماعات أذن للاستماع لأذكار أو مراجعة في الطريق</span>
                </label>
              </div>
            </div>

            <div class="md:col-span-2 mint-card p-5 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xl">📍</span>
                  <div>
                    <h4 class="font-black text-slate-900 text-sm">جدول مواعيد سناتر اليوم</h4>
                    <p class="text-[11px] text-slate-500">انطلق قبل موعد الدرس بـ 25 دقيقة لتفادي الزحام</p>
                  </div>
                </div>
                <button onclick="window.openAddOfflineCenterModal()" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors">
                  <span>+ إضافة موعد سنتر</span>
                </button>
              </div>

              <div class="space-y-3">
                ${items.length === 0 ? `
                  <div class="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl border border-slate-200">
                    لا توجد مواعيد سناتر مسجلة لليوم الحالي. يمكنك إضافة مواعيدك من الزر أعلاه!
                  </div>
                ` : items.map((it, idx) => `
                  <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-black text-slate-900">${it.title}</span>
                        <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-xs font-bold">${it.time}</span>
                      </div>
                      <p class="text-xs text-slate-500">${it.notes || 'لا توجد ملاحظات إضافية'}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">مؤكد</span>
                      <button onclick="window.deleteOfflineCenterItem(${todayDayIndex}, ${idx})" title="حذف هذا الموعد" class="text-slate-400 hover:text-red-500 p-1.5 text-xs rounded-lg hover:bg-red-50 transition-colors">🗑️</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        `;
      } else {
        const tasks = data.thanawya.dailyTasks || [];

        modeContainer.innerHTML = `
          <div class="mint-card p-6 space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 class="text-base font-black text-slate-900">قائمة مهام المذاكرة المنزلية والأونلاين</h4>
                <p class="text-xs text-slate-500">قسم وقتك إلى كتل بومودورو محددة، وركز على حل الأسئلة</p>
              </div>
              <button onclick="window.openAddTaskModal()" class="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>إضافة مهمة مذاكرة جديدة</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              ${tasks.length === 0 ? `
                <div class="col-span-2 text-center text-xs text-slate-400 py-6">
                  لا توجد مهام مسجلة. اضغط على الزر أعلاه لإضافة أول مهمة لمذاكرة اليوم!
                </div>
              ` : tasks.map(task => {
                const sub = (data.thanawya.subjects || []).find(s => s.id === task.subjectId);
                const subName = sub ? sub.name : 'مادة عامة';
                return `
                  <div class="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border ${task.completed ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'} transition-all">
                    <div class="flex items-start gap-3 flex-1">
                      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="window.toggleTask('${task.id}')" class="custom-checkbox mt-0.5">
                      <div class="space-y-1">
                        <div class="text-xs font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}">${task.title}</div>
                        <div class="flex items-center gap-2 text-[10px] text-slate-500">
                          <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">${subName}</span>
                          <span>⏱️ ${task.durationMin} دقيقة</span>
                          ${task.isUrgent ? '<span class="text-red-600 font-bold">عاجل 🔥</span>' : ''}
                        </div>
                      </div>
                    </div>
                    <button onclick="window.deleteTask('${task.id}')" class="text-slate-400 hover:text-red-500 p-1 text-xs">✕</button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    }

    // بنك نقاط الضعف
    const weakContainer = document.getElementById('weak-points-container');
    if (weakContainer) {
      const weakPoints = data.thanawya.weakPoints || [];
      if (weakPoints.length === 0) {
        weakContainer.innerHTML = '<div class="col-span-3 text-xs text-slate-400 text-center py-4">ممتاز! لم تسجل أي أخطاء أو نقاط ضعف بعد.</div>';
      } else {
        weakContainer.innerHTML = weakPoints.map(wp => {
          const sub = (data.thanawya.subjects || []).find(s => s.id === wp.subjectId);
          const subName = sub ? sub.name : 'مادة';
          return `
            <div class="p-3.5 rounded-2xl bg-slate-50 border ${wp.resolved ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200'} space-y-2">
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">${subName}</span>
                <button onclick="window.deleteWeakPoint('${wp.id}')" class="text-slate-400 hover:text-red-500 text-xs">✕</button>
              </div>
              <p class="text-xs font-bold ${wp.resolved ? 'line-through text-slate-400' : 'text-slate-800'}">${wp.topic}</p>
              <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                <span class="text-slate-400">${wp.date}</span>
                <button onclick="window.toggleWeakPoint('${wp.id}')" class="font-bold ${wp.resolved ? 'text-emerald-700' : 'text-amber-700 hover:underline'}">
                  ${wp.resolved ? '✓ تم إتقانها' : 'مراجعة وحل'}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // المواد
    const subjectsContainer = document.getElementById('subjects-container');
    if (subjectsContainer) {
      const subjects = data.thanawya.subjects || [];
      if (subjects.length === 0) {
        subjectsContainer.innerHTML = '<div class="col-span-3 text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl border border-slate-200">لا توجد مواد مسجلة حالياً. اضغط على "+ إضافة مادة" لإدخال موادك الخاصة!</div>';
      } else {
        subjectsContainer.innerHTML = subjects.map(sub => {
          const percent = Math.min(100, Math.round(((sub.completedChapters || 0) / (sub.totalChapters || 1)) * 100));
          const exams = sub.exams || [];
          const latestExam = exams.length > 0 ? exams[exams.length - 1] : null;

          return `
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-black text-slate-900 text-sm">${sub.name}</h4>
                  <div class="text-[11px] text-slate-500">${sub.teacher || 'أستاذ المادة'}</div>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${percent >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                    ${percent}%
                  </span>
                  <button onclick="window.deleteSubject('${sub.id}')" title="حذف هذه المادة" class="text-slate-400 hover:text-red-500 p-1 text-xs rounded-lg hover:bg-red-50 transition-colors">🗑️</button>
                </div>
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>أنجزت ${sub.completedChapters} من ${sub.totalChapters} فصول</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                <div class="flex items-center gap-1.5">
                  <button onclick="window.changeChapters('${sub.id}', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold flex items-center justify-center">-</button>
                  <span class="px-1 text-slate-800 font-bold">${sub.completedChapters} فصول</span>
                  <button onclick="window.changeChapters('${sub.id}', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold flex items-center justify-center">+</button>
                </div>

                <button onclick="window.openAddExamModal('${sub.id}')" class="text-emerald-700 hover:text-emerald-800 font-bold">
                  + رصد درجة امتحان
                </button>
              </div>

              ${latestExam ? `
                <div class="text-[10px] p-2 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-between shadow-sm">
                  <span>آخر امتحان: ${latestExam.title}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-black ${latestExam.score / latestExam.maxScore >= 0.85 ? 'text-emerald-600' : 'text-amber-600'}">
                      ${latestExam.score} / ${latestExam.maxScore}
                    </span>
                    <button onclick="window.deleteExamScore('${sub.id}', '${latestExam.id}')" title="حذف الامتحان" class="text-slate-400 hover:text-red-500 px-1">✕</button>
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }

    const sessions = data.thanawya.studySessionsToday || [];
    const sessionsCountEl = document.getElementById('pomodoro-today-count');
    if (sessionsCountEl) {
      sessionsCountEl.textContent = sessions.length;
      const totalMins = sessions.length * 50;
      const hours = (totalMins / 60).toFixed(1);
      document.getElementById('pomodoro-sessions-summary').innerHTML = `
        أنجزت اليوم: <span class="text-emerald-700 font-black">${sessions.length}</span> جلسة تركيز (${hours} ساعة مذاكرة صافية)
      `;
    }
  }

  // =========================================================================
  // 5. مختبر اليوتيوب والـ AI
  // =========================================================================
  renderYouTubeAI() {
    const data = storage.getData();
    const ytAdherence = youtubeAIModule.checkSafeTimeAdherence();

    const ytTimeEl = document.getElementById('yt-time-today');
    if (ytTimeEl) ytTimeEl.textContent = ytAdherence.totalTodayMins;

    const safetyStatusEl = document.getElementById('yt-safety-status');
    if (safetyStatusEl) {
      if (ytAdherence.isExceeded) {
        safetyStatusEl.innerHTML = '<span class="text-red-600 font-bold">⚠️ تجاوزت الحد الآمن (أوقف اليوتيوب وركز على الثانوية)</span>';
      } else {
        safetyStatusEl.innerHTML = `<span class="text-emerald-700 font-bold">✓ متبقي ${ytAdherence.remainingSafeMins} دقيقة آمنة لليوم</span>`;
      }
    }

    const totalHoursEl = document.getElementById('total-learning-hours');
    if (totalHoursEl) totalHoursEl.textContent = youtubeAIModule.getTotalLearningHours();

    const kanbanBoard = document.getElementById('kanban-board');
    if (kanbanBoard) {
      const stages = youtubeAIModule.STAGES;
      const videos = data.youtubeLab.videoProjects || [];

      kanbanBoard.innerHTML = stages.map(stage => {
        const stageVideos = videos.filter(v => v.stage === stage.id);
        return `
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3 flex flex-col min-h-[220px] shadow-sm">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="text-xs font-bold text-slate-800">${stage.name}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">${stageVideos.length}</span>
            </div>

            <div class="space-y-2 flex-1">
              ${stageVideos.length === 0 ? `
                <div class="text-[11px] text-slate-400 text-center py-6">فارغ</div>
              ` : stageVideos.map(vid => {
                const ch = (data.youtubeLab.channels || []).find(c => c.id === vid.channelId);
                const chName = ch ? ch.name : 'قناة أوتوميشن';
                return `
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs hover:border-emerald-300 transition-colors">
                    <div class="font-bold text-slate-900">${vid.title}</div>
                    ${vid.script ? `<div class="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">✓ يوجد سكريبت جاهز</div>` : ''}
                    <div class="text-[10px] text-slate-500">${vid.notes || ''}</div>
                    
                    <div class="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span class="text-[9px] text-purple-700 px-1.5 py-0.5 rounded-md bg-purple-50 font-bold">${chName}</span>
                      
                      <div class="flex items-center gap-1">
                        <button onclick="window.advanceVideoStage('${vid.id}', -1)" title="المرحلة السابقة" class="text-slate-400 hover:text-slate-800 px-1 text-xs">‹</button>
                        <button onclick="window.advanceVideoStage('${vid.id}', 1)" title="المرحلة التالية" class="text-emerald-600 hover:text-emerald-700 px-1 text-xs font-black">›</button>
                        <button onclick="window.deleteVideo('${vid.id}')" title="حذف" class="text-slate-400 hover:text-red-500 px-1 text-[10px]">✕</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    const learningList = document.getElementById('learning-log-list');
    if (learningList) {
      const logs = data.youtubeLab.learningLog || [];
      if (logs.length === 0) {
        learningList.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">لم تسجل أي جلسات بعد.</div>';
      } else {
        learningList.innerHTML = logs.map(l => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div class="space-y-0.5">
              <div class="font-bold text-slate-900">${l.topic}</div>
              <div class="text-[10px] text-slate-500">${l.notes || ''}</div>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px]">⏱️ ${l.durationMin} دقيقة</span>
              <span class="text-[10px] text-slate-400 font-mono">${l.date}</span>
              <button onclick="window.deleteLearningLog('${l.id}')" title="حذف" class="text-slate-400 hover:text-red-500 px-1 text-xs">✕</button>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // =========================================================================
  // 6. العادات والنوم
  // =========================================================================
  renderHabits() {
    const data = storage.getData();
    const habits = data.habits.list || [];

    const habitsContainer = document.getElementById('habits-list-container');
    if (habitsContainer) {
      if (habits.length === 0) {
        habitsContainer.innerHTML = '<div class="col-span-3 text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl border border-slate-200">لا توجد عادات مسجلة. اضغط على "+ إضافة عادة جديدة" لإدخال عاداتك!</div>';
      } else {
        habitsContainer.innerHTML = habits.map(h => `
          <div class="mint-card p-4 flex items-center justify-between border ${h.completedToday ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200'} transition-all">
            <div class="flex items-center gap-3">
              <input type="checkbox" ${h.completedToday ? 'checked' : ''} onchange="window.toggleHabit('${h.id}')" class="custom-checkbox">
              <div>
                <div class="text-xs font-bold ${h.completedToday ? 'text-emerald-800' : 'text-slate-900'}">${h.title}</div>
                <div class="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>🔥 الالتزام المتتالي:</span>
                  <span class="font-bold text-amber-600">${h.streak || 0} أيام</span>
                </div>
              </div>
            </div>
            <button onclick="window.deleteHabit('${h.id}')" class="text-slate-400 hover:text-red-500 text-xs p-1">✕</button>
          </div>
        `).join('');
      }
    }

    this.updateSleepCycles();

    const sleepLogsContainer = document.getElementById('sleep-history-list');
    if (sleepLogsContainer) {
      const logs = data.habits.sleepLogs || [];
      if (logs.length === 0) {
        sleepLogsContainer.innerHTML = '<span class="text-[11px] text-slate-400">لا توجد سجلات نوم مسجلة.</span>';
      } else {
        sleepLogsContainer.innerHTML = logs.slice(0, 5).map(l => `
          <div class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
            <span>🌙 ${l.bedtime} → ${l.wakeTime}</span>
            <span class="font-bold text-indigo-700">(${l.totalHours} س)</span>
            <span class="text-emerald-700 font-bold">• ${l.quality}</span>
            <button onclick="window.deleteSleepLog('${l.id}')" title="حذف هذا السجل" class="text-slate-400 hover:text-red-500 text-xs mr-1">✕</button>
          </div>
        `).join('');
      }
    }

    const outingsList = document.getElementById('outings-list');
    if (outingsList) {
      const outings = data.habits.outings || [];
      if (outings.length === 0) {
        outingsList.innerHTML = '<div class="col-span-2 text-xs text-slate-400 text-center py-3">لا توجد خروجات مسجلة.</div>';
      } else {
        outingsList.innerHTML = outings.map(o => `
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div class="flex items-center justify-between font-bold text-slate-900">
              <span>☕ ${o.title}</span>
              <div class="flex items-center gap-2">
                <span class="text-slate-500 text-[11px] font-normal">${o.durationHours} ساعات</span>
                <button onclick="window.deleteOuting('${o.id}')" title="حذف" class="text-slate-400 hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
            <p class="text-[10px] text-slate-500">${o.notes || ''}</p>
          </div>
        `).join('');
      }
    }
  }

  updateSleepCycles() {
    const bedtimeInput = document.getElementById('bedtime-calculator-input');
    const wakeResultsEl = document.getElementById('optimal-wake-results');
    if (!bedtimeInput || !wakeResultsEl) return;

    const bedtime = bedtimeInput.value || '23:30';
    const cycles = habitsModule.calculateOptimalWakeTimes(bedtime);

    wakeResultsEl.innerHTML = cycles.map(c => `
      <div class="p-3 rounded-2xl bg-white border border-emerald-200 text-center space-y-1 shadow-sm">
        <div class="text-lg font-black text-emerald-700">${c.time}</div>
        <div class="text-[10px] text-slate-500 font-bold">${c.label}</div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 7. الإعدادات
  // =========================================================================
  renderSettings() {
    const data = storage.getData();
    const prof = data.profile;

    const nameInput = document.getElementById('settings-name');
    const goalInput = document.getElementById('settings-goal');
    const streamInput = document.getElementById('settings-stream');
    const examDateInput = document.getElementById('settings-exam-date');

    if (nameInput) nameInput.value = prof.name || 'عبدو';
    if (goalInput) goalInput.value = prof.goal || 'كلية حاسبات وذكاء اصطناعي 🎯';
    if (streamInput) streamInput.value = prof.stream || 'علمي رياضة';
    if (examDateInput) examDateInput.value = prof.examDate || '2027-06-15';

    const offlineCheckboxes = document.querySelectorAll('input[name="offlineDay"]');
    const offlineDays = prof.offlineDays || [0, 3];
    offlineCheckboxes.forEach(cb => {
      cb.checked = offlineDays.includes(Number(cb.value));
    });
  }

  // =========================================================================
  // 8. ربط المستمعين والأحداث
  // =========================================================================
  initEventListeners() {
    const startBtn = document.getElementById('main-pomodoro-start');
    const pauseBtn = document.getElementById('main-pomodoro-pause');
    const resetBtn = document.getElementById('main-pomodoro-reset');
    const timerDisplay = document.getElementById('main-pomodoro-timer');
    const modeLabel = document.getElementById('pomodoro-mode-label');

    const dashTimerDisplay = document.getElementById('dash-pomodoro-timer');
    const dashStartBtn = document.getElementById('dash-pomodoro-btn');

    const updateTimerViews = (state) => {
      if (timerDisplay) timerDisplay.textContent = state.formattedTime;
      if (dashTimerDisplay) dashTimerDisplay.textContent = state.formattedTime;
      if (modeLabel) {
        modeLabel.textContent = state.mode === 'study' ? 'جلسة تركيز ومذاكرة' : 'استراحة مستحقة';
        modeLabel.className = state.mode === 'study' ? 'text-xs font-black uppercase tracking-wider text-emerald-700 mb-2' : 'text-xs font-black uppercase tracking-wider text-teal-700 mb-2';
      }
      if (startBtn) {
        startBtn.textContent = state.running ? 'جارية...' : 'بدء التركيز';
      }
      if (dashStartBtn) {
        dashStartBtn.textContent = state.running ? 'إيقاف مؤقت' : 'ابدأ الجلسة';
      }
    };

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!thanawyaModule.pomodoroRunning) {
          thanawyaModule.startPomodoro(updateTimerViews, (st) => {
            updateTimerViews(st);
            this.showToast('انتهت جلسة التركيز بنجاح! خذ استراحة ☕');
            this.render();
          });
          updateTimerViews(thanawyaModule.getPomodoroState());
        }
      });
    }

    if (dashStartBtn) {
      dashStartBtn.addEventListener('click', () => {
        if (thanawyaModule.pomodoroRunning) {
          thanawyaModule.pausePomodoro(updateTimerViews);
        } else {
          thanawyaModule.startPomodoro(updateTimerViews, (st) => {
            updateTimerViews(st);
            this.showToast('انتهت جلسة التركيز بنجاح! خذ استراحة ☕');
            this.render();
          });
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        thanawyaModule.pausePomodoro(updateTimerViews);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        thanawyaModule.resetPomodoro(50, 'study');
        updateTimerViews(thanawyaModule.getPomodoroState());
      });
    }

    // التحكم في الأصوات البيئية
    window.setAmbientSound = (type) => {
      thanawyaModule.setAmbientSoundType(type);
      ['rain', 'waves', 'none'].forEach(t => {
        const btn = document.getElementById(`ambient-${t}-btn`);
        if (btn) {
          if (t === type) {
            btn.className = 'px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold transition-colors';
          } else {
            btn.className = 'px-3 py-1.5 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors';
          }
        }
      });
      this.showToast(`تم ضبط صوت التركيز: ${type === 'rain' ? 'مطر هادئ 🌧️' : type === 'waves' ? 'أمواج وطبيعة 🌊' : 'صامت 🔇'}`);
    };

    // حفظ الملاحظات
    const saveNoteBtn = document.getElementById('save-quick-note-btn');
    const noteInput = document.getElementById('quick-note-input');
    if (saveNoteBtn && noteInput) {
      saveNoteBtn.addEventListener('click', () => {
        const text = noteInput.value.trim();
        if (text) {
          storage.update(data => {
            if (!data.quickNotes) data.quickNotes = [];
            data.quickNotes.unshift({ id: 'n_' + Date.now(), text, timestamp: Date.now() });
          });
          noteInput.value = '';
          this.showToast('تم حفظ الملاحظة السريعة!');
        }
      });
    }

    // الورد القرآني
    const quranMinus = document.getElementById('quran-minus-btn');
    const quranPlus = document.getElementById('quran-plus-btn');
    if (quranMinus) {
      quranMinus.addEventListener('click', () => {
        storage.update(data => {
          data.prayers.quranPages = Math.max(0, (data.prayers.quranPages || 0) - 1);
        });
      });
    }
    if (quranPlus) {
      quranPlus.addEventListener('click', () => {
        storage.update(data => {
          data.prayers.quranPages = (data.prayers.quranPages || 0) + 1;
        });
        prayerService.playChime();
        this.showToast('تقبل الله وبارك في وقتك وفهمك! 📖');
      });
    }

    // أذكار الصباح والمساء
    const morningCheck = document.getElementById('adhkar-morning-check');
    if (morningCheck) {
      morningCheck.addEventListener('change', (e) => {
        storage.update(data => { data.prayers.adhkarMorning = e.target.checked; });
        this.showToast(e.target.checked ? 'تم تسجيل أذكار الصباح ☀️' : 'تم الإلغاء');
      });
    }

    const eveningCheck = document.getElementById('adhkar-evening-check');
    if (eveningCheck) {
      eveningCheck.addEventListener('change', (e) => {
        storage.update(data => { data.prayers.adhkarEvening = e.target.checked; });
        this.showToast(e.target.checked ? 'تم تسجيل أذكار المساء 🌙' : 'تم الإلغاء');
      });
    }

    // حاسبة النوم
    const bedtimeInput = document.getElementById('bedtime-calculator-input');
    if (bedtimeInput) {
      bedtimeInput.addEventListener('input', () => this.updateSleepCycles());
    }

    // نموذج الإعدادات
    const profileForm = document.getElementById('profile-settings-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('settings-name').value.trim();
        const goal = document.getElementById('settings-goal').value.trim();
        const stream = document.getElementById('settings-stream').value;
        const examDate = document.getElementById('settings-exam-date').value;
        const offlineDays = Array.from(document.querySelectorAll('input[name="offlineDay"]:checked')).map(cb => Number(cb.value));

        storage.update(data => {
          data.profile.name = name || 'عبدو';
          data.profile.goal = goal;
          data.profile.stream = stream;
          data.profile.examDate = examDate;
          data.profile.offlineDays = offlineDays;
        });

        this.showToast('تم حفظ تعديلات ملفك بنجاح! 🎯');
      });
    }

    // تصدير واستيراد
    const exportBtn = document.getElementById('export-backup-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        storage.exportBackup();
        this.showToast('تم تنزيل النسخة الاحتياطية (ملف JSON)');
      });
    }

    const importInput = document.getElementById('import-backup-file');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = storage.importBackup(event.target.result);
            if (res.success) {
              this.showToast('تم استيراد بياناتك بنجاح!');
            } else {
              alert(res.error);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    const resetBtnEl = document.getElementById('reset-defaults-btn');
    if (resetBtnEl) {
      resetBtnEl.addEventListener('click', () => {
        if (confirm('هل أنت متأكد من استعادة البيانات الافتراضية؟')) {
          storage.resetToDefault();
          this.showToast('تمت استعادة البيانات الافتراضية');
        }
      });
    }

    const clearAllBtn = document.getElementById('clear-all-blank-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('هل أنت متأكد؟ سيتم مسح كل البيانات والبدء بصفحة فارغة تماماً.')) {
          storage.clearAllDataToBlank();
          this.showToast('تم مسح البيانات والبدء بصفحة فارغة!');
        }
      });
    }

    this.exposeGlobalHelpers();
  }

  exposeGlobalHelpers() {
    window.togglePrayer = (prayerId) => {
      storage.update(data => {
        data.prayers[prayerId] = !data.prayers[prayerId];
      });
      prayerService.playChime();
      this.showToast('تقبل الله صلاتك ورزقك البركة!');
    };

    window.toggleTask = (taskId) => {
      thanawyaModule.toggleTask(taskId);
      this.showToast('تم تحديث حالة المهمة');
    };

    window.deleteTask = (taskId) => {
      thanawyaModule.deleteTask(taskId);
      this.showToast('تم حذف المهمة');
    };

    window.setThanawyaMode = (mode) => {
      thanawyaModule.setDayMode(mode);
      this.showToast(`تم التبديل إلى: ${mode === 'offline' ? 'يوم نزول دروس' : mode === 'online' ? 'يوم أونلاين ومذاكرة' : 'النمط التلقائي'}`);
    };

    window.changeChapters = (subjectId, delta) => {
      const data = storage.getData();
      const sub = data.thanawya.subjects.find(s => s.id === subjectId);
      if (sub) {
        thanawyaModule.updateSubjectProgress(subjectId, (sub.completedChapters || 0) + delta);
        this.showToast('تم تحديث تقدم المادة');
      }
    };

    window.toggleWeakPoint = (id) => {
      thanawyaModule.toggleWeakPoint(id);
      this.showToast('تم تحديث حالة نقطة الضعف');
    };

    window.deleteWeakPoint = (id) => {
      thanawyaModule.deleteWeakPoint(id);
      this.showToast('تم الحذف من بنك نقاط الضعف');
    };

    window.deleteQuickNote = (noteId) => {
      storage.update(data => {
        data.quickNotes = (data.quickNotes || []).filter(n => n.id !== noteId);
      });
      this.showToast('تم حذف الملاحظة');
    };

    window.toggleHabit = (habitId) => {
      habitsModule.toggleHabit(habitId);
      this.showToast('تم تحديث العادة');
    };

    window.deleteHabit = (habitId) => {
      habitsModule.deleteHabit(habitId);
      this.showToast('تم حذف العادة');
    };

    window.deleteSubject = (id) => {
      thanawyaModule.deleteSubject(id);
      this.showToast('تم حذف المادة');
    };

    window.deleteExamScore = (subId, exId) => {
      thanawyaModule.deleteExamScore(subId, exId);
      this.showToast('تم حذف الامتحان');
    };

    window.deleteOfflineCenterItem = (day, idx) => {
      thanawyaModule.deleteOfflineItem(day, idx);
      this.showToast('تم حذف الموعد');
    };

    window.deleteLearningLog = (id) => {
      youtubeAIModule.deleteLearningLog(id);
      this.showToast('تم حذف جلسة التعلم');
    };

    window.deleteSleepLog = (id) => {
      habitsModule.deleteSleepLog(id);
      this.showToast('تم حذف سجل النوم');
    };

    window.deleteOuting = (id) => {
      habitsModule.deleteOuting(id);
      this.showToast('تم حذف الخروج');
    };

    window.advanceVideoStage = (videoId, direction) => {
      const data = storage.getData();
      const stages = youtubeAIModule.STAGES;
      const vid = data.youtubeLab.videoProjects.find(v => v.id === videoId);
      if (vid) {
        const curIdx = stages.findIndex(s => s.id === vid.stage);
        const nextIdx = curIdx + direction;
        if (nextIdx >= 0 && nextIdx < stages.length) {
          youtubeAIModule.updateVideoStage(videoId, stages[nextIdx].id);
          this.showToast(`تم النقل إلى: ${stages[nextIdx].name}`);
        }
      }
    };

    window.deleteVideo = (videoId) => {
      youtubeAIModule.deleteVideo(videoId);
      this.showToast('تم حذف مشروع الفيديو');
    };

    this.initModalHelpers();
  }

  initModalHelpers() {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');

    const openModal = (htmlContent) => {
      modalContent.innerHTML = htmlContent;
      modalContainer.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    };

    window.closeModal = () => {
      modalContainer.classList.add('hidden');
    };

    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        window.closeModal();
      }
    });

    // 1. إضافة مهمة مذاكرة
    window.openAddTaskModal = () => {
      const data = storage.getData();
      const subjects = data.thanawya.subjects || [];

      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">إضافة مهمة مذاكرة جديدة</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-task-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">عنوان المهمة:</label>
            <input type="text" id="task-title" required placeholder="مثال: حل شيت مسائل قوانين كيرشوف" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">المادة:</label>
              <select id="task-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white">
                ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">المدة المتوقعة (بالدقائق):</label>
              <input type="number" id="task-duration" value="50" min="10" step="5" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white">
            </div>
          </div>
          <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input type="checkbox" id="task-urgent" class="custom-checkbox">
            <span class="text-xs text-red-600 font-bold">مهمة عاجلة ذات أولوية قصوى 🔥</span>
          </label>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm">إضافة المهمة</button>
          </div>
        </form>
      `);

      document.getElementById('modal-task-form').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const subjectId = document.getElementById('task-subject').value;
        const durationMin = Number(document.getElementById('task-duration').value);
        const isUrgent = document.getElementById('task-urgent').checked;

        thanawyaModule.addTask({ title, subjectId, durationMin, isUrgent });
        window.closeModal();
        this.showToast('تمت إضافة المهمة بنجاح!');
      };
    };

    // 2. تسجيل نقطة ضعف / خطأ في الامتحان
    window.openAddWeakPointModal = () => {
      const data = storage.getData();
      const subjects = data.thanawya.subjects || [];

      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">تسجيل نقطة ضعف أو خطأ في الامتحان 🎯</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-weakpoint-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">المادة:</label>
            <select id="weak-subject" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
              ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">الجزئية أو السؤال الذي وقعت فيه:</label>
            <input type="text" id="weak-topic" required placeholder="مثال: مسائل المقاومة المكافئة عند غلق وفتح المفتاح" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
          </div>
          <p class="text-[11px] text-slate-500">ستبقى هذه الجزئية في بنك نقاط الضعف حتى تقوم بمراجعتها وحلها وتحديدها كمتقنة!</p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm">حفظ في بنك الأخطاء</button>
          </div>
        </form>
      `);

      document.getElementById('modal-weakpoint-form').onsubmit = (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('weak-subject').value;
        const topic = document.getElementById('weak-topic').value.trim();

        thanawyaModule.addWeakPoint(subjectId, topic);
        window.closeModal();
        this.showToast('تمت إضافة النقطة لبنك المراجعة الذكي!');
      };
    };

    // 3. مولد سكريبتات اليوتيوب بالـ AI
    window.openScriptGeneratorModal = () => {
      const data = storage.getData();
      const channels = data.youtubeLab.channels || [];

      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="text-lg">🤖</span>
            <h3 class="text-base font-black text-slate-900">مولد سكريبتات اليوتيوب الذكي للأوتوميشن</h3>
          </div>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">عنوان أو فكرة الفيديو:</label>
            <input type="text" id="gen-script-title" placeholder="مثال: كيف تصنع فيديو كامل بالذكاء الاصطناعي في 5 دقائق" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">نوع الفيديو:</label>
              <select id="gen-script-format" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
                <option value="shorts">شورتس / ريلز سريع (60 ثانية) ⚡</option>
                <option value="long">فيديو طويل تفصيلي (10 دقائق) 🎥</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">القناة المستهدفة:</label>
              <select id="gen-script-channel" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
                ${channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <button type="button" id="btn-do-generate" class="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
            <span>✨ توليد السكريبت والـ Hook الآن</span>
          </button>

          <div class="space-y-1 pt-1">
            <label class="text-xs font-bold text-slate-700">السكريبت المولد:</label>
            <textarea id="gen-script-result" rows="7" placeholder="سيظهر السكريبت المهيكل هنا تلقائياً..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none resize-none"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إغلاق</button>
            <button type="button" id="btn-save-as-project" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm">إضافة كمشروع لخط الإنتاج 🚀</button>
          </div>
        </div>
      `);

      const doGenBtn = document.getElementById('btn-do-generate');
      const titleInput = document.getElementById('gen-script-title');
      const formatSelect = document.getElementById('gen-script-format');
      const resultArea = document.getElementById('gen-script-result');
      const saveBtn = document.getElementById('btn-save-as-project');

      doGenBtn.onclick = () => {
        const title = titleInput.value.trim() || 'أقوى أدوات الذكاء الاصطناعي للأوتوميشن';
        const format = formatSelect.value;
        const script = youtubeAIModule.generateScriptTemplate(title, format);
        resultArea.value = script;
        this.showToast('تم توليد السكريبت بنجاح! ✨');
      };

      saveBtn.onclick = () => {
        const title = titleInput.value.trim() || 'فيديو أوتوميشن ذكي';
        const channelId = document.getElementById('gen-script-channel').value;
        const script = resultArea.value;

        youtubeAIModule.addVideo({
          title,
          channelId,
          stage: 'scripting',
          notes: 'سكريبت مولد بالـ AI جاهز للتسجيل',
          script
        });
        window.closeModal();
        this.showToast('تمت إضافة الفيديو مع السكريبت لقسم كتابة السكريبتات! 🚀');
      };
    };

    // 4. رصد امتحان
    window.openAddExamModal = (subjectId) => {
      const data = storage.getData();
      const sub = data.thanawya.subjects.find(s => s.id === subjectId);
      if (!sub) return;

      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">رصد درجة امتحان: ${sub.name}</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-exam-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">عنوان الامتحان / الباب:</label>
            <input type="text" id="exam-title" required placeholder="مثال: شامل الباب الثاني" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">درجتك:</label>
              <input type="number" id="exam-score" required min="0" step="0.5" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">الدرجة النهائية:</label>
              <input type="number" id="exam-max" value="60" required min="1" step="0.5" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm">حفظ الدرجة</button>
          </div>
        </form>
      `);

      document.getElementById('modal-exam-form').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('exam-title').value.trim();
        const score = document.getElementById('exam-score').value;
        const maxScore = document.getElementById('exam-max').value;

        thanawyaModule.addExamScore(subjectId, title, score, maxScore);
        window.closeModal();
        this.showToast('تم حفظ نتيجة الامتحان بنجاح!');
      };
    };

    // 5. إضافة فكرة فيديو
    window.openAddVideoModal = () => {
      const data = storage.getData();
      const channels = data.youtubeLab.channels || [];

      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">إضافة فكرة فيديو / مشروع جديد</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-video-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">عنوان الفيديو / الفكرة:</label>
            <input type="text" id="video-title" required placeholder="مثال: كيف تبني نظام أوتوميشن ذكي للملفات" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-purple-500">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">القناة:</label>
              <select id="video-channel" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
                ${channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">المرحلة المبدئية:</label>
              <select id="video-stage" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
                <option value="ideas">أفكار 💡</option>
                <option value="scripting">كتابة سكريبت ✍️</option>
                <option value="ai_gen">توليد بالـ AI 🤖</option>
                <option value="editing">مونتاج 🎬</option>
              </select>
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">ملاحظات سريعة:</label>
            <textarea id="video-notes" rows="2" placeholder="ملاحظات حول الأدوات..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none resize-none"></textarea>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm">إضافة لخط الإنتاج</button>
          </div>
        </form>
      `);

      document.getElementById('modal-video-form').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('video-title').value.trim();
        const channelId = document.getElementById('video-channel').value;
        const stage = document.getElementById('video-stage').value;
        const notes = document.getElementById('video-notes').value.trim();

        youtubeAIModule.addVideo({ title, channelId, stage, notes });
        window.closeModal();
        this.showToast('تمت إضافة الفيديو لخط الإنتاج 🚀');
      };
    };

    // 6. جلسة تعلم برمجة
    window.openLogLearningModal = () => {
      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">تسجيل جلسة تعلم برمجة / AI</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-learning-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">الموضوع الذي تعلمته:</label>
            <input type="text" id="learn-topic" required placeholder="مثال: بايثون وأتمتة المهام" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-purple-500">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">المدة (بالدقائق):</label>
            <input type="number" id="learn-duration" value="45" max="90" min="15" step="5" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">أهم ما طبقته:</label>
            <input type="text" id="learn-notes" placeholder="تطبيق سكريبت عملي..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm">تسجيل الجلسة</button>
          </div>
        </form>
      `);

      document.getElementById('modal-learning-form').onsubmit = (e) => {
        e.preventDefault();
        const topic = document.getElementById('learn-topic').value.trim();
        const durationMin = document.getElementById('learn-duration').value;
        const notes = document.getElementById('learn-notes').value.trim();

        youtubeAIModule.logLearningSession(topic, durationMin, notes);
        window.closeModal();
        this.showToast('عاش يا بطل! خطوة أخرى نحو كلية حاسبات 💻');
      };
    };

    // 7. نوم الأمس
    window.openLogSleepModal = () => {
      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">تسجيل نوم الأمس وساعات الراحة</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-sleep-form" class="space-y-3.5 pt-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">ساعة النوم:</label>
              <input type="time" id="sleep-bed" value="23:30" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">ساعة الاستيقاظ:</label>
              <input type="time" id="sleep-wake" value="05:30" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">جودة النوم والنشاط:</label>
            <select id="sleep-quality" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
              <option value="ممتاز ونشيط">ممتاز ونشيط ⚡</option>
              <option value="جيد">جيد 👍</option>
              <option value="متوسط">متوسط 😐</option>
              <option value="مرهق ومتقطع">مرهق ومتقطع 😴</option>
            </select>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm">حفظ السجل</button>
          </div>
        </form>
      `);

      document.getElementById('modal-sleep-form').onsubmit = (e) => {
        e.preventDefault();
        const bed = document.getElementById('sleep-bed').value;
        const wake = document.getElementById('sleep-wake').value;
        const quality = document.getElementById('sleep-quality').value;

        habitsModule.logSleep(bed, wake, quality);
        window.closeModal();
        this.showToast('تم تسجيل بيانات النوم بنجاح 🌙');
      };
    };

    // 8. عادة جديدة
    window.openAddHabitModal = () => {
      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">إضافة عادة يومية جديدة</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-habit-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">اسم العادة:</label>
            <input type="text" id="habit-title" required placeholder="مثال: قراءة 10 دقائق في كتاب مفيد" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">تصنيف العادة:</label>
            <select id="habit-category" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
              <option value="health">صحة وجسم 💧</option>
              <option value="spiritual">روحانيات وصلاة 🕌</option>
              <option value="mind">تطوير ذهني وعقل 🧠</option>
              <option value="sleep">نوم وراحة 🌙</option>
            </select>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm">إضافة العادة</button>
          </div>
        </form>
      `);

      document.getElementById('modal-habit-form').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('habit-title').value.trim();
        const category = document.getElementById('habit-category').value;

        habitsModule.addHabit(title, category);
        window.closeModal();
        this.showToast('تمت إضافة العادة بنجاح!');
      };
    };

    // 9. خروج ترويحي
    window.openLogOutingModal = () => {
      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">تسجيل خروج وترويح منضبط (Guilt-Free)</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-outing-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">النشاط الترويحي:</label>
            <input type="text" id="outing-title" required placeholder="مثال: لعب كورة / مشي مع الأصدقاء / كافيه" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">المدة بالساعات:</label>
            <input type="number" id="outing-hours" value="2" min="0.5" max="6" step="0.5" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">ملاحظات وأثرها النفسي:</label>
            <input type="text" id="outing-notes" placeholder="شحن طاقة ممتاز لمواصلة الأسبوع بقوة" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium">
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm">تسجيل</button>
          </div>
        </form>
      `);

      document.getElementById('modal-outing-form').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('outing-title').value.trim();
        const hours = document.getElementById('outing-hours').value;
        const notes = document.getElementById('outing-notes').value.trim();

        habitsModule.logOuting(title, hours, notes);
        window.closeModal();
        this.showToast('خروج مبارك وشحن طاقة مستحق! ☕');
      };
    };

    // 10. إضافة مادة
    window.openAddSubjectModal = () => {
      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">إضافة مادة دراسية جديدة</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-subject-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">اسم المادة:</label>
            <input type="text" id="sub-name" required placeholder="مثال: الجيولوجيا وعلوم البيئة" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">اسم الأستاذ / المنصة:</label>
            <input type="text" id="sub-teacher" placeholder="مثال: أستاذ المادة" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">إجمالي الفصول:</label>
              <input type="number" id="sub-total" value="8" min="1" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">الفصول المنجزة حالياً:</label>
              <input type="number" id="sub-done" value="0" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm">إضافة المادة</button>
          </div>
        </form>
      `);

      document.getElementById('modal-subject-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('sub-name').value.trim();
        const teacher = document.getElementById('sub-teacher').value.trim();
        const totalChapters = Number(document.getElementById('sub-total').value);
        const completedChapters = Number(document.getElementById('sub-done').value);

        thanawyaModule.addSubject({ name, teacher, totalChapters, completedChapters });
        window.closeModal();
        this.showToast('تمت إضافة المادة بنجاح!');
      };
    };

    // 11. موعد سنتر
    window.openAddOfflineCenterModal = () => {
      openModal(`
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 class="text-base font-black text-slate-900">إضافة موعد سنتر ليوم النزول</h3>
          <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form id="modal-center-form" class="space-y-3.5 pt-2">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">يوم النزول:</label>
            <select id="center-day" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
              <option value="0">الأحد</option>
              <option value="1">الإثنين</option>
              <option value="2">الثلاثاء</option>
              <option value="3">الأربعاء</option>
              <option value="4">الخميس</option>
              <option value="5">الجمعة</option>
              <option value="6">السبت</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">اسم السنتر والمادة:</label>
            <input type="text" id="center-title" required placeholder="مثال: سنتر الأوائل - فيزياء" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">الميعاد:</label>
            <input type="text" id="center-time" required placeholder="مثال: 02:00 م - 04:30 م" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">المطلوب تجهيزه:</label>
            <input type="text" id="center-notes" placeholder="مثال: تسليم شيت الباب الأول + امتحان تسميع" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium">
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="window.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">إلغاء</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm">إضافة الموعد</button>
          </div>
        </form>
      `);

      document.getElementById('modal-center-form').onsubmit = (e) => {
        e.preventDefault();
        const dayIndex = Number(document.getElementById('center-day').value);
        const title = document.getElementById('center-title').value.trim();
        const time = document.getElementById('center-time').value.trim();
        const notes = document.getElementById('center-notes').value.trim();

        thanawyaModule.addOfflineItem(dayIndex, { title, time, notes });
        window.closeModal();
        this.showToast('تمت إضافة موعد السنتر بنجاح!');
      };
    };
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.masarApp = new MasarApp();
});
