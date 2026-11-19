const firebaseConfig = {
  apiKey: "AIzaSyD9HJhxKpFGdJ3tgXj-2k_gVTVJtI0ltlI",
  authDomain: "goij-add78.firebaseapp.com",
  projectId: "goij-add78",
  storageBucket: "goij-add78.firebasestorage.app",
  messagingSenderId: "181333877345",
  appId: "1:181333877345:web:5731cbc0f9da64ace40020",
  measurementId: "G-WSDM2XFGY1"
};

let db = null;
let docRef = null;

try {
  if (typeof firebase !== "undefined" && firebase.apps && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  if (typeof firebase !== "undefined" && firebase.firestore) {
    db = firebase.firestore();
    db.enablePersistence().catch(() => {});
    docRef = db.collection("challenge90").doc("user_main_data");
  }
} catch (err) {
  console.warn("Firebase init notice:", err);
}

const DEFAULT_TASKS = [
  { id: "d0", n: "الصلاة", e: "🕌", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "d1", n: "القرآن", e: "📖", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "d2", n: "الدراسة", e: "📚", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "d3", n: "الرياضة", e: "💪", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "d4", n: "منصة نهل", e: "🎓", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "d5", n: "ترك العادات السرية", e: "🚫", days: [0, 1, 2, 3, 4, 5, 6] }
];

const EMOJIS = ["🔥", "🕌", "📖", "📚", "💪", "🎓", "🚫", "💧", "🏃", "🧠", "✍️", "💤", "🥗", "💻", "🎯", "⭐"];

let S = {
  start: null,
  tasks: [],
  dayStatus: {},
  dayTasks: {},
  stories: {},
  rewards: [],
  weekRewards: {},
  ba: []
};

let editId = null;
let selEmoji = EMOJIS[0];
let curStoryDay = 1;
let activeStoryIndex = null;
let tempImg = "";
let selWeek = 1;
let tempWeekSuggestion = {};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDayNum() {
  if (!S.start) return 1;
  const s = new Date(`${S.start}T00:00:00`);
  const t = new Date(`${todayStr()}T00:00:00`);
  const diff = Math.floor((t - s) / 86400000) + 1;
  return Math.max(1, Math.min(90, diff));
}

function getDayOfWeek(dayNum) {
  if (!S.start) return new Date().getDay();
  const s = new Date(`${S.start}T00:00:00`);
  s.setDate(s.getDate() + (dayNum - 1));
  return s.getDay();
}

function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    el.style.display = "none";
  }, 2400);
}

async function save() {
  try {
    localStorage.setItem("challenge90_backup", JSON.stringify(S));
  } catch (_) {}

  if (!docRef) return;
  try {
    await docRef.set(S, { merge: true });
  } catch (e) {
    console.warn("Cloud save warning:", e);
    showToast("⚠️ تعذر الحفظ في السحابة، تم الحفظ محلياً");
  }
}

function normalizeStories(rawStories) {
  const out = {};
  if (!rawStories || typeof rawStories !== "object") return out;
  for (const key of Object.keys(rawStories)) {
    const val = rawStories[key];
    if (Array.isArray(val)) {
      out[key] = val;
    } else if (val && typeof val === "object") {
      out[key] = [val];
    }
  }
  return out;
}

function applyLoadedData(data) {
  S.start = (data && data.start) || todayStr();
  S.tasks = (data && Array.isArray(data.tasks) && data.tasks.length > 0)
    ? data.tasks
    : DEFAULT_TASKS.map((t) => ({ ...t, days: [...t.days] }));
  S.dayStatus = (data && data.dayStatus && typeof data.dayStatus === "object") ? data.dayStatus : {};
  S.dayTasks = (data && data.dayTasks && typeof data.dayTasks === "object") ? data.dayTasks : {};
  S.stories = normalizeStories(data && data.stories);
  S.rewards = (data && Array.isArray(data.rewards)) ? data.rewards : [];
  S.weekRewards = (data && data.weekRewards && typeof data.weekRewards === "object") ? data.weekRewards : {};
  S.ba = (data && Array.isArray(data.ba)) ? data.ba : [];
}

async function initApp() {
  // عرض فوري للبيانات الافتراضية أو المحلية حتى لا تبقى الشاشة فارغة أبداً
  let loadedFromLocal = false;
  try {
    const localRaw = localStorage.getItem("challenge90_backup");
    if (localRaw) {
      applyLoadedData(JSON.parse(localRaw));
      loadedFromLocal = true;
    } else {
      applyLoadedData({});
    }
  } catch (_) {
    applyLoadedData({});
  }
  render();

  if (!docRef) return;
  showToast("⏳ جاري المزامنة...");

  try {
    const snap = await Promise.race([
      docRef.get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000))
    ]);

    if (snap && snap.exists) {
      applyLoadedData(snap.data());
      if (!snap.data().tasks || snap.data().tasks.length === 0) {
        await save();
      }
      showToast("✅ تمت المزامنة");
    } else if (!loadedFromLocal) {
      applyLoadedData({});
      await save();
      showToast("✅ تم تهيئة التحدي");
    }
  } catch (_) {
    showToast("ℹ️ يعمل بالوضع المحلي حالياً");
  }
  render();
}

function compressImg(file, maxW = 700, quality = 0.65) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function render() {
  try {
    const dn = getDayNum();
    const dnEl = document.getElementById("dn");
    if (dnEl) dnEl.textContent = dn;

    const ringEl = document.getElementById("ring");
    if (ringEl) {
      ringEl.style.setProperty("--p", Math.round((dn / 90) * 100));
    }

    if (!S.dayTasks[dn]) {
      S.dayTasks[dn] = JSON.parse(JSON.stringify(S.tasks));
    }
    if (!S.dayStatus[dn]) {
      S.dayStatus[dn] = {};
    }

    // شريط الستوريات لليوم الحالي
    const storiesEl = document.getElementById("stories");
    if (storiesEl) {
      storiesEl.innerHTML = "";
      const dayStories = S.stories[dn] || [];
      dayStories.forEach((st, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "st has";
        btn.innerHTML = `<i style="${st.img ? `background-image:url('${st.img}')` : ""}">${st.img ? "" : "📝"}</i>ستوري ${idx + 1}`;
        btn.onclick = () => viewExistingStory(dn, idx);
        storiesEl.appendChild(btn);
      });

      const addSt = document.createElement("button");
      addSt.type = "button";
      addSt.className = "st add-story today";
      addSt.innerHTML = `<i>+</i>إضافة`;
      addSt.onclick = () => openNewStoryModal(dn);
      storiesEl.appendChild(addSt);
    }

    // قائمة المهام المجدولة لليوم الحالي
    const currentDow = getDayOfWeek(dn);
    const baseTasks = S.dayTasks[dn] || S.tasks;
    const activeTasks = baseTasks.filter((t) => !t.days || t.days.includes(currentDow));
    const statusMap = S.dayStatus[dn] || {};

    const tasksEl = document.getElementById("tasks");
    if (tasksEl) {
      tasksEl.innerHTML = "";
      if (activeTasks.length === 0) {
        tasksEl.innerHTML = `<div class="ph" style="padding:20px;">لا توجد مهام مجدولة لهذا اليوم. أضف تحدياً جديداً من الزر بالأعلى.</div>`;
      } else {
        activeTasks.forEach((t) => {
          const st = statusMap[t.id];
          const card = document.createElement("div");
          card.className = "tk" + (st === "success" ? " success" : st === "fail" ? " fail" : "");
          card.innerHTML = `
            <div class="tk-info">
              <span class="e">${t.e || "🔥"}</span>
              <span class="n">${t.n}</span>
            </div>
            <div class="tk-actions">
              <button type="button" class="act-btn success-btn ${st === "success" ? "active" : ""}" onclick="setTaskStatus('${t.id}', 'success')">✓ نجاح</button>
              <button type="button" class="act-btn fail-btn ${st === "fail" ? "active" : ""}" onclick="setTaskStatus('${t.id}', 'fail')">✕ فشل</button>
              <button type="button" class="tool-ic" title="تعديل" onclick="editTask('${t.id}')">✏️</button>
              <button type="button" class="tool-ic" title="حذف" onclick="delTask('${t.id}')">🗑️</button>
            </div>
          `;
          tasksEl.appendChild(card);
        });
      }
    }

    const total = activeTasks.length;
    const completed = Object.keys(statusMap).filter((id) => activeTasks.some((t) => t.id === id) && statusMap[id] === "success").length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    const pctEl = document.getElementById("pct");
    const barEl = document.getElementById("bar");
    if (pctEl) pctEl.textContent = `إنجاز اليوم: ${completed} من ${total} نجاح (${pct}%)`;
    if (barEl) barEl.style.width = `${pct}%`;

    renderArchive(dn);
  } catch (err) {
    console.error("Render error:", err);
  }
}

window.setTaskStatus = async function (id, status) {
  const dn = getDayNum();
  if (!S.dayStatus[dn]) S.dayStatus[dn] = {};
  if (S.dayStatus[dn][id] === status) {
    delete S.dayStatus[dn][id];
  } else {
    S.dayStatus[dn][id] = status;
  }
  render();
  await save();
};

function openTaskModal(task = null) {
  editId = task ? task.id : null;
  document.getElementById("tmT").textContent = task ? "تعديل التحدي" : "تحدي جديد";
  document.getElementById("tmN").value = task ? task.n : "";
  selEmoji = task && task.e ? task.e : EMOJIS[0];

  const schedEl = document.getElementById("taskSchedule");
  const daysArr = task && Array.isArray(task.days) ? task.days : [0, 1, 2, 3, 4, 5, 6];
  if (daysArr.length === 7) schedEl.value = "all";
  else if (daysArr.length === 1 && daysArr[0] === 5) schedEl.value = "fri";
  else if (daysArr.length === 2 && daysArr.includes(5) && daysArr.includes(6)) schedEl.value = "weekend";
  else schedEl.value = "sat_thu";

  const emoEl = document.getElementById("emo");
  emoEl.innerHTML = EMOJIS.map((e) => `<button type="button" class="${e === selEmoji ? "a" : ""}" onclick="selectEmoji('${e}')">${e}</button>`).join("");
  document.getElementById("tm").classList.add("s");
}

window.selectEmoji = function (e) {
  selEmoji = e;
  document.querySelectorAll("#emo button").forEach((el) => el.classList.toggle("a", el.textContent === e));
};

window.editTask = function (id) {
  const t = S.tasks.find((x) => x.id === id);
  if (t) openTaskModal(t);
};

window.delTask = async function (id) {
  if (!confirm("هل تريد حذف هذا التحدي من القائمة المستقبلية؟")) return;
  S.tasks = S.tasks.filter((x) => x.id !== id);
  const dn = getDayNum();
  if (S.dayTasks[dn]) {
    S.dayTasks[dn] = S.dayTasks[dn].filter((x) => x.id !== id);
  }
  render();
  await save();
  showToast("تم حذف التحدي");
};

// إدارة المكافآت
function renderRewardsList() {
  const listEl = document.getElementById("rewardsList");
  if (!listEl) return;
  if (!S.rewards.length) {
    listEl.innerHTML = `<div class="ph" style="padding:12px;">لا توجد مكافآت بعد. أضف مكافأتك الأولى بالأعلى.</div>`;
    return;
  }
  listEl.innerHTML = S.rewards.map((r, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card); padding:10px 14px; border-radius:10px; border:1px solid var(--bd);">
      <span style="font-size:14px;">🎁 ${r}</span>
      <button type="button" onclick="deleteReward(${idx})" style="background:none; border:0; color:var(--no); cursor:pointer; font-size:16px;">🗑️</button>
    </div>
  `).join("");
}

window.deleteReward = async function (idx) {
  S.rewards.splice(idx, 1);
  renderRewardsList();
  renderArchive(getDayNum());
  await save();
  showToast("تم حذف المكافأة");
};

window.pickRandomReward = function (week) {
  if (!S.rewards.length) {
    showToast("أضف مكافآت أولاً من زر (قائمة المكافآت)");
    return;
  }
  let pool = [...S.rewards];
  if (pool.length > 1 && tempWeekSuggestion[week]) {
    pool = pool.filter((r) => r !== tempWeekSuggestion[week]);
  }
  tempWeekSuggestion[week] = pool[Math.floor(Math.random() * pool.length)];
  renderArchive(getDayNum());
};

window.claimWeekReward = async function (week) {
  const chosen = tempWeekSuggestion[week];
  if (!chosen) return;
  S.weekRewards[week] = chosen;
  delete tempWeekSuggestion[week];
  renderArchive(getDayNum());
  await save();
  showToast("🎉 تم اعتماد مكافأة الأسبوع");
};

// الستوريات
function viewExistingStory(day, index) {
  curStoryDay = day;
  activeStoryIndex = index;
  const list = S.stories[day] || [];
  const st = list[index];
  if (!st) return;

  document.getElementById("svT").textContent = `ستوري يوم ${day} (${index + 1}/${list.length})`;
  document.getElementById("svM").innerHTML = `
    ${st.img ? `<img src="${st.img}" alt="ستوري" />` : `<div class="ph">ستوري نصي</div>`}
    ${st.note ? `<div class="note-box">${st.note}</div>` : ""}
  `;
  document.getElementById("storyInputArea").style.display = "none";
  document.getElementById("storyDeleteBtn").style.display = "flex";
  document.getElementById("sv").classList.add("s");
}

function openNewStoryModal(day) {
  curStoryDay = day;
  activeStoryIndex = null;
  tempImg = "";
  document.getElementById("svT").textContent = `إضافة ستوري ليوم ${day}`;
  document.getElementById("svM").innerHTML = `<div class="ph">اختر صورة من الكاميرا أو المعرض</div>`;
  document.getElementById("svN").value = "";
  document.getElementById("storyInputArea").style.display = "flex";
  document.getElementById("storyDeleteBtn").style.display = "none";
  document.getElementById("sv").classList.add("s");
}

async function handleStoryFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  tempImg = await compressImg(file);
  document.getElementById("svM").innerHTML = `<img src="${tempImg}" alt="معاينة" />`;
}

// تفاصيل اليوم في الأرشيف
function openArchiveDayDetail(day) {
  document.getElementById("ddTitle").textContent = `سجل اليوم ${day}`;

  const ddStoriesEl = document.getElementById("ddStories");
  ddStoriesEl.innerHTML = "";
  const dayStories = S.stories[day] || [];

  dayStories.forEach((st, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "st has";
    btn.innerHTML = `<i style="${st.img ? `background-image:url('${st.img}')` : ""}">${st.img ? "" : "📝"}</i>ستوري ${idx + 1}`;
    btn.onclick = () => viewExistingStory(day, idx);
    ddStoriesEl.appendChild(btn);
  });

  const addSt = document.createElement("button");
  addSt.type = "button";
  addSt.className = "st add-story";
  addSt.innerHTML = `<i>+</i>إضافة`;
  addSt.onclick = () => openNewStoryModal(day);
  ddStoriesEl.appendChild(addSt);

  const ddTasksEl = document.getElementById("ddTasksList");
  ddTasksEl.innerHTML = "";

  const dayDow = getDayOfWeek(day);
  const rawTasks = S.dayTasks[day];
  const statusMap = S.dayStatus[day] || {};

  if (!rawTasks) {
    ddTasksEl.innerHTML = `<div class="ph" style="padding:10px;">لا يوجد سجل محفوظ لهذا اليوم بعد.</div>`;
  } else {
    const scheduled = rawTasks.filter((t) => !t.days || t.days.includes(dayDow));
    if (!scheduled.length) {
      ddTasksEl.innerHTML = `<div class="ph" style="padding:10px;">لم تكن هناك مهام مجدولة في هذا اليوم.</div>`;
    } else {
      scheduled.forEach((t) => {
        const st = statusMap[t.id];
        let badge = `<span style="font-size:12px; color:var(--mu); background:var(--bg); padding:4px 10px; border-radius:8px;">— لم يُحدد</span>`;
        let borderColor = "var(--bd)";

        if (st === "success") {
          badge = `<span style="font-size:12px; color:#052e1d; background:var(--ok); font-weight:bold; padding:4px 10px; border-radius:8px;">✓ نجاح</span>`;
          borderColor = "var(--ok)";
        } else if (st === "fail") {
          badge = `<span style="font-size:12px; color:#450a0a; background:var(--no); font-weight:bold; padding:4px 10px; border-radius:8px;">✕ فشل</span>`;
          borderColor = "var(--no)";
        }

        const row = document.createElement("div");
        row.style.cssText = `display:flex; align-items:center; justify-content:space-between; background:var(--card); border:1px solid ${borderColor}; border-radius:12px; padding:10px 14px;`;
        row.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:20px;">${t.e || "🔥"}</span>
            <span style="font-size:14px; font-weight:600;">${t.n}</span>
          </div>
          ${badge}
        `;
        ddTasksEl.appendChild(row);
      });
    }
  }

  document.getElementById("dayDetailModal").classList.add("s");
}

function renderArchive(dn) {
  const wkEl = document.getElementById("wk");
  if (wkEl) {
    wkEl.innerHTML = "";
    for (let w = 1; w <= 13; w++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = w === selWeek ? "a" : "";
      b.textContent = `أسبوع ${w}`;
      b.onclick = () => {
        selWeek = w;
        renderArchive(dn);
      };
      wkEl.appendChild(b);
    }
  }

  const startD = (selWeek - 1) * 7 + 1;
  const endD = Math.min(90, selWeek * 7);

  let weekTotal = 0;
  let weekSuccess = 0;
  for (let d = startD; d <= endD; d++) {
    if (S.dayTasks[d]) {
      const dayDow = getDayOfWeek(d);
      const tList = S.dayTasks[d].filter((t) => !t.days || t.days.includes(dayDow));
      const sMap = S.dayStatus[d] || {};
      weekTotal += tList.length;
      weekSuccess += tList.filter((t) => sMap[t.id] === "success").length;
    }
  }

  const weekPct = weekTotal > 0 ? Math.round((weekSuccess / weekTotal) * 100) : 0;
  const rewardCardEl = document.getElementById("weekRewardCard");
  if (rewardCardEl) {
    const claimed = S.weekRewards[selWeek];
    const suggested = tempWeekSuggestion[selWeek];

    if (claimed) {
      rewardCardEl.className = "reward-box unlocked";
      rewardCardEl.innerHTML = `
        <div style="font-size:12px; color:var(--ok); font-weight:bold;">🏆 مكافأة الأسبوع ${selWeek} المعتمدة (${weekPct}%)</div>
        <div style="font-size:16px; font-weight:bold; margin-top:4px;">🎁 ${claimed}</div>
      `;
    } else if (weekPct >= 70) {
      rewardCardEl.className = "reward-box unlocked";
      if (!S.rewards.length) {
        rewardCardEl.innerHTML = `
          <div style="font-size:13px; color:var(--ok); font-weight:bold;">🎉 إنجاز رائع (${weekPct}%) في الأسبوع ${selWeek}</div>
          <div style="font-size:12px; color:var(--mu); margin-top:4px;">أضف مكافآتك من (🎁 قائمة المكافآت) لاختيار واحدة.</div>
        `;
      } else if (!suggested) {
        rewardCardEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div>
              <div style="font-size:13px; color:var(--ok); font-weight:bold;">🎉 مبروك! حققت ${weekPct}% في الأسبوع ${selWeek}</div>
              <div style="font-size:12px; color:var(--mu); margin-top:2px;">اسحب مكافأة من قائمتك</div>
            </div>
            <button type="button" class="btn" style="padding:8px 12px; font-size:13px;" onclick="pickRandomReward(${selWeek})">🎁 اسحب مكافأتك</button>
          </div>
        `;
      } else {
        rewardCardEl.innerHTML = `
          <div style="font-size:12px; color:var(--ok); font-weight:bold;">✨ المكافأة المقترحة (${weekPct}%):</div>
          <div style="font-size:16px; font-weight:bold; margin:6px 0;">🎁 ${suggested}</div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button type="button" class="btn" style="flex:1; padding:8px; font-size:13px;" onclick="claimWeekReward(${selWeek})">✅ اعتماد المكافأة</button>
            <button type="button" class="btn g" style="padding:8px 12px; font-size:13px;" onclick="pickRandomReward(${selWeek})">🔄 اقتراح آخر</button>
          </div>
        `;
      }
    } else {
      rewardCardEl.className = "reward-box";
      rewardCardEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:13px; font-weight:bold;">📊 تقييم الأسبوع ${selWeek}: ${weekPct}%</div>
            <div style="font-size:12px; color:var(--mu); margin-top:2px;">حقق 70% فأكثر لفتح مكافأة الأسبوع.</div>
          </div>
          <span style="font-size:20px;">🔒</span>
        </div>
      `;
    }
  }

  const wdaysEl = document.getElementById("wdays");
  if (wdaysEl) {
    wdaysEl.innerHTML = "";
    for (let d = startD; d <= endD; d++) {
      const hasStories = S.stories[d] && S.stories[d].length > 0;
      const hasRecord = !!S.dayTasks[d];
      const count = hasStories ? S.stories[d].length : 0;

      let summaryText = "فارغ";
      if (hasRecord) {
        const dayDow = getDayOfWeek(d);
        const tList = S.dayTasks[d].filter((t) => !t.days || t.days.includes(dayDow));
        const sMap = S.dayStatus[d] || {};
        const okCount = tList.filter((t) => sMap[t.id] === "success").length;
        summaryText = `${okCount}/${tList.length} نجاح`;
      }

      const item = document.createElement("div");
      item.className = "tk" + (hasStories || hasRecord ? " success" : "");
      item.style.cssText = "cursor:pointer; padding:12px 6px; text-align:center; display:block;";
      item.innerHTML = `
        <div class="e" style="font-size:22px">${hasStories ? "📸" : hasRecord ? "📋" : "📅"}</div>
        <div class="n" style="font-size:13px; margin-top:4px;">يوم ${d}</div>
        <div style="font-size:10px; color:var(--mu); margin-top:2px;">${summaryText}${hasStories ? ` • ${count} ستوري` : ""}</div>
      `;
      item.onclick = () => openArchiveDayDetail(d);
      wdaysEl.appendChild(item);
    }
  }

  const baEl = document.getElementById("ba");
  if (baEl) {
    baEl.innerHTML = S.ba.map((item, idx) => `
      <figure>
        <img src="${item.img}" alt="تطور" />
        <figcaption>يوم ${item.day} <button type="button" onclick="delBa(${idx})" style="background:none; border:0; color:#f87171; cursor:pointer;">🗑️</button></figcaption>
      </figure>
    `).join("");
  }
}

window.delBa = async function (idx) {
  S.ba.splice(idx, 1);
  render();
  await save();
};

function bindEvents() {
  document.getElementById("addBtn").onclick = () => openTaskModal();
  document.getElementById("tmC").onclick = () => document.getElementById("tm").classList.remove("s");

  document.getElementById("tmS").onclick = async () => {
    const name = document.getElementById("tmN").value.trim();
    if (!name) return showToast("اكتب اسم التحدي أولاً");

    const sched = document.getElementById("taskSchedule").value;
    let targetDays = [0, 1, 2, 3, 4, 5, 6];
    if (sched === "sat_thu") targetDays = [0, 1, 2, 3, 4, 6];
    else if (sched === "fri") targetDays = [5];
    else if (sched === "weekend") targetDays = [5, 6];

    const dn = getDayNum();
    if (editId) {
      S.tasks.forEach((t) => {
        if (t.id === editId) {
          t.n = name;
          t.e = selEmoji;
          t.days = targetDays;
        }
      });
      if (S.dayTasks[dn]) {
        S.dayTasks[dn].forEach((t) => {
          if (t.id === editId) {
            t.n = name;
            t.e = selEmoji;
            t.days = targetDays;
          }
        });
      }
    } else {
      const newTask = { id: "t" + Date.now(), n: name, e: selEmoji, days: targetDays };
      S.tasks.push(newTask);
      if (S.dayTasks[dn]) {
        S.dayTasks[dn].push(newTask);
      }
    }

    document.getElementById("tm").classList.remove("s");
    render();
    await save();
    showToast("تم حفظ التحدي ✅");
  };

  document.getElementById("manageRewardsBtn").onclick = () => {
    renderRewardsList();
    document.getElementById("rewardsModal").classList.add("s");
  };
  document.getElementById("closeRewardsX").onclick = () => document.getElementById("rewardsModal").classList.remove("s");
  document.getElementById("closeRewardsBtn").onclick = () => document.getElementById("rewardsModal").classList.remove("s");

  document.getElementById("addRewardBtn").onclick = async () => {
    const inp = document.getElementById("newRewardInput");
    const val = inp.value.trim();
    if (!val) return showToast("اكتب اسم المكافأة أولاً");
    S.rewards.push(val);
    inp.value = "";
    renderRewardsList();
    renderArchive(getDayNum());
    await save();
    showToast("تمت إضافة المكافأة 🎁");
  };

  document.getElementById("closeDayDetailX").onclick = () => document.getElementById("dayDetailModal").classList.remove("s");
  document.getElementById("closeDayDetailBtn").onclick = () => document.getElementById("dayDetailModal").classList.remove("s");

  document.getElementById("svX").onclick = () => document.getElementById("sv").classList.remove("s");
  document.getElementById("fiCam").onchange = handleStoryFile;
  document.getElementById("fiGal").onchange = handleStoryFile;

  document.getElementById("svS").onclick = async () => {
    const note = document.getElementById("svN").value.trim();
    if (!tempImg && !note) return showToast("أضف صورة أو ملاحظة أولاً");

    if (!S.stories[curStoryDay]) S.stories[curStoryDay] = [];
    S.stories[curStoryDay].push({ id: "st_" + Date.now(), img: tempImg, note, date: todayStr() });
    tempImg = "";

    document.getElementById("sv").classList.remove("s");
    render();
    if (document.getElementById("dayDetailModal").classList.contains("s")) {
      openArchiveDayDetail(curStoryDay);
    }
    await save();
    showToast("تم حفظ الستوري 📸");
  };

  document.getElementById("delStoryBtn").onclick = async () => {
    if (activeStoryIndex === null || activeStoryIndex === undefined) return;
    if (!confirm("هل تريد حذف هذا الستوري نهائياً؟")) return;

    if (S.stories[curStoryDay]) {
      S.stories[curStoryDay].splice(activeStoryIndex, 1);
      if (!S.stories[curStoryDay].length) {
        delete S.stories[curStoryDay];
      }
    }
    document.getElementById("sv").classList.remove("s");
    render();
    if (document.getElementById("dayDetailModal").classList.contains("s")) {
      openArchiveDayDetail(curStoryDay);
    }
    await save();
    showToast("تم حذف الستوري");
  };

  document.getElementById("fiBa").onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = await compressImg(file, 650, 0.65);
    S.ba.push({ day: getDayNum(), img, date: todayStr() });
    render();
    await save();
    showToast("تمت إضافة صورة التطور ✅");
  };

  document.getElementById("n1").onclick = () => {
    document.getElementById("home").classList.remove("hide");
    document.getElementById("archive").classList.add("hide");
    document.getElementById("n1").classList.add("a");
    document.getElementById("n2").classList.remove("a");
  };

  document.getElementById("n2").onclick = () => {
    document.getElementById("home").classList.add("hide");
    document.getElementById("archive").classList.remove("hide");
    document.getElementById("n2").classList.add("a");
    document.getElementById("n1").classList.remove("a");
    renderArchive(getDayNum());
  };
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initApp();
});
