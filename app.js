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
  if (typeof firebase !== "undefined") {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (firebase.firestore) {
      db = firebase.firestore();
      docRef = db.collection("challenge90").doc("user_main_data");
    }
  }
} catch (e) {
  console.error("Firebase setup error:", e);
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
let curStoryDay = 3;
let activeStoryIndex = null;
let tempImg = "";
let selWeek = 1;
let tempWeekSuggestion = {};
let syncReady = false;

function $(id) {
  return document.getElementById(id);
}

function formatYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return formatYMD(new Date());
}

function parseYMD(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
}

// اليوم الحالي هو اليوم الثالث، إذن البداية قبل يومين من اليوم الحالي
function day3StartStr() {
  const now = new Date();
  const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
  return formatYMD(dt);
}

function getDayNum() {
  const s = parseYMD(S.start);
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (!s) return 3;
  const diff = Math.floor((t.getTime() - s.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(90, diff));
}

function getDayOfWeek(dayNum) {
  const s = parseYMD(S.start);
  if (!s) return new Date().getDay();
  const dt = new Date(s.getFullYear(), s.getMonth(), s.getDate() + (dayNum - 1), 0, 0, 0, 0);
  return dt.getDay();
}

function showToast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.style.display = "none";
  }, 2500);
}

function saveLocal() {
  try {
    localStorage.setItem("challenge90_state_v4", JSON.stringify(S));
  } catch (e) {
    console.warn("LocalStorage warning:", e);
  }
}

async function saveCloud() {
  saveLocal();
  if (!docRef || !syncReady) return;
  try {
    await docRef.set(JSON.parse(JSON.stringify(S)), { merge: true });
  } catch (e) {
    console.warn("Firestore save warning:", e);
  }
}

function normalizeStories(raw) {
  const res = {};
  if (!raw || typeof raw !== "object") return res;
  for (const k of Object.keys(raw)) {
    const v = raw[k];
    if (Array.isArray(v)) {
      res[k] = v;
    } else if (v && typeof v === "object") {
      res[k] = [v];
    }
  }
  return res;
}

function hasAnyProgressData(d) {
  if (!d || typeof d !== "object") return false;
  const hasStories = d.stories && Object.keys(d.stories).length > 0;
  const hasDayTasks = d.dayTasks && Object.keys(d.dayTasks).length > 0;
  const hasDayStatus = d.dayStatus && Object.keys(d.dayStatus).length > 0;
  const hasBa = Array.isArray(d.ba) && d.ba.length > 0;
  return Boolean(hasStories || hasDayTasks || hasDayStatus || hasBa);
}

function hydrateState(data) {
  const d = data && typeof data === "object" ? data : {};

  // إذا كان هناك تاريخ بداية محفوظ مسبقاً نستخدمه، وإلا نضبطه ليكون اليوم الحالي هو اليوم الثالث
  if (d.start && parseYMD(d.start)) {
    S.start = d.start;
  } else if (!S.start) {
    S.start = day3StartStr();
  }

  S.tasks =
    Array.isArray(d.tasks) && d.tasks.length > 0
      ? d.tasks
      : DEFAULT_TASKS.map((t) => ({ id: t.id, n: t.n, e: t.e, days: [...t.days] }));
  S.dayStatus = d.dayStatus && typeof d.dayStatus === "object" ? d.dayStatus : {};
  S.dayTasks = d.dayTasks && typeof d.dayTasks === "object" ? d.dayTasks : {};
  S.stories = normalizeStories(d.stories);
  S.rewards = Array.isArray(d.rewards) ? d.rewards : [];
  S.weekRewards = d.weekRewards && typeof d.weekRewards === "object" ? d.weekRewards : {};
  S.ba = Array.isArray(d.ba) ? d.ba : [];

  // إذا كانت هناك بيانات سابقة محفوظة وكان start يعطي يوماً أقل من 3، نضبط start ليكون اليوم 3 مع الحفاظ على كل البيانات
  const currentCalcDay = getDayNum();
  if (!d.start && hasAnyProgressData(d) && currentCalcDay < 3) {
    S.start = day3StartStr();
  }
}

function compressImg(file, maxW = 700, quality = 0.65) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
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
      img.onerror = () => resolve("");
      img.src = ev.target.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function render() {
  const dn = getDayNum();
  if ($("dn")) $("dn").textContent = dn;

  if ($("ring")) {
    $("ring").style.setProperty("--p", Math.round((dn / 90) * 100));
  }

  if (!S.dayTasks[dn]) {
    S.dayTasks[dn] = JSON.parse(JSON.stringify(S.tasks));
  }
  if (!S.dayStatus[dn]) {
    S.dayStatus[dn] = {};
  }

  const storiesEl = $("stories");
  if (storiesEl) {
    storiesEl.innerHTML = "";
    const list = S.stories[dn] || [];
    list.forEach((st, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "st has";
      btn.innerHTML = `<i style="${st.img ? `background-image:url('${st.img}')` : ""}">${st.img ? "" : "📝"}</i>ستوري ${idx + 1}`;
      btn.addEventListener("click", () => viewExistingStory(dn, idx));
      storiesEl.appendChild(btn);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "st add-story today";
    addBtn.innerHTML = `<i>+</i>إضافة`;
    addBtn.addEventListener("click", () => openNewStoryModal(dn));
    storiesEl.appendChild(addBtn);
  }

  const dow = getDayOfWeek(dn);
  const baseTasks = S.dayTasks[dn] || S.tasks;
  const activeTasks = baseTasks.filter((t) => !Array.isArray(t.days) || t.days.includes(dow));
  const statusMap = S.dayStatus[dn] || {};

  const tasksEl = $("tasks");
  if (tasksEl) {
    tasksEl.innerHTML = "";
    if (!activeTasks.length) {
      tasksEl.innerHTML = `<div class="ph" style="padding:18px;">لا توجد مهام مجدولة لهذا اليوم.</div>`;
    } else {
      activeTasks.forEach((t) => {
        const st = statusMap[t.id];
        const card = document.createElement("div");
        card.className = "tk" + (st === "success" ? " success" : st === "fail" ? " fail" : "");

        const info = document.createElement("div");
        info.className = "tk-info";
        info.innerHTML = `<span class="e">${t.e || "🔥"}</span><span class="n">${t.n}</span>`;

        const actions = document.createElement("div");
        actions.className = "tk-actions";

        const okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.className = "act-btn success-btn" + (st === "success" ? " active" : "");
        okBtn.textContent = "✓ نجاح";
        okBtn.addEventListener("click", () => toggleStatus(t.id, "success"));

        const noBtn = document.createElement("button");
        noBtn.type = "button";
        noBtn.className = "act-btn fail-btn" + (st === "fail" ? " active" : "");
        noBtn.textContent = "✕ فشل";
        noBtn.addEventListener("click", () => toggleStatus(t.id, "fail"));

        const edBtn = document.createElement("button");
        edBtn.type = "button";
        edBtn.className = "tool-ic";
        edBtn.title = "تعديل";
        edBtn.textContent = "✏️";
        edBtn.addEventListener("click", () => openTaskModal(t));

        const dlBtn = document.createElement("button");
        dlBtn.type = "button";
        dlBtn.className = "tool-ic";
        dlBtn.title = "حذف";
        dlBtn.textContent = "🗑️";
        dlBtn.addEventListener("click", () => deleteTask(t.id));

        actions.appendChild(okBtn);
        actions.appendChild(noBtn);
        actions.appendChild(edBtn);
        actions.appendChild(dlBtn);

        card.appendChild(info);
        card.appendChild(actions);
        tasksEl.appendChild(card);
      });
    }
  }

  const total = activeTasks.length;
  const doneCount = Object.keys(statusMap).filter(
    (id) => activeTasks.some((t) => t.id === id) && statusMap[id] === "success"
  ).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  if ($("pct")) $("pct").textContent = `إنجاز اليوم: ${doneCount} من ${total} نجاح (${pct}%)`;
  if ($("bar")) $("bar").style.width = `${pct}%`;

  renderArchive(dn);
}

async function toggleStatus(taskId, status) {
  const dn = getDayNum();
  if (!S.dayStatus[dn]) S.dayStatus[dn] = {};
  if (S.dayStatus[dn][taskId] === status) {
    delete S.dayStatus[dn][taskId];
  } else {
    S.dayStatus[dn][taskId] = status;
  }
  render();
  await saveCloud();
}

function openTaskModal(task = null) {
  editId = task ? task.id : null;
  if ($("tmT")) $("tmT").textContent = task ? "تعديل التحدي" : "تحدي جديد";
  if ($("tmN")) $("tmN").value = task ? task.n : "";
  selEmoji = task && task.e ? task.e : EMOJIS[0];

  const schedEl = $("taskSchedule");
  if (schedEl) {
    const daysArr = task && Array.isArray(task.days) ? task.days : [0, 1, 2, 3, 4, 5, 6];
    if (daysArr.length === 7) schedEl.value = "all";
    else if (daysArr.length === 1 && daysArr[0] === 5) schedEl.value = "fri";
    else if (daysArr.length === 2 && daysArr.includes(5) && daysArr.includes(6)) schedEl.value = "weekend";
    else schedEl.value = "sat_thu";
  }

  const emoEl = $("emo");
  if (emoEl) {
    emoEl.innerHTML = "";
    EMOJIS.forEach((em) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = em === selEmoji ? "a" : "";
      b.textContent = em;
      b.addEventListener("click", () => {
        selEmoji = em;
        emoEl.querySelectorAll("button").forEach((x) => x.classList.toggle("a", x.textContent === em));
      });
      emoEl.appendChild(b);
    });
  }

  if ($("tm")) $("tm").classList.add("s");
}

async function deleteTask(taskId) {
  if (!confirm("هل تريد حذف هذا التحدي من القائمة الحالية والمستقبلية؟")) return;
  S.tasks = S.tasks.filter((t) => t.id !== taskId);
  const dn = getDayNum();
  if (S.dayTasks[dn]) {
    S.dayTasks[dn] = S.dayTasks[dn].filter((t) => t.id !== taskId);
  }
  render();
  await saveCloud();
  showToast("تم حذف التحدي");
}

function renderRewardsModalList() {
  const box = $("rewardsList");
  if (!box) return;
  box.innerHTML = "";
  if (!S.rewards.length) {
    box.innerHTML = `<div class="ph" style="padding:10px;">لا توجد مكافآت مضافة بعد.</div>`;
    return;
  }
  S.rewards.forEach((r, idx) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex; justify-content:space-between; align-items:center; background:var(--card); padding:10px 14px; border-radius:10px; border:1px solid var(--bd);";
    const span = document.createElement("span");
    span.textContent = `🎁 ${r}`;

    const del = document.createElement("button");
    del.type = "button";
    del.style.cssText = "background:none; border:0; color:var(--no); cursor:pointer; font-size:16px;";
    del.textContent = "🗑️";
    del.addEventListener("click", async () => {
      S.rewards.splice(idx, 1);
      renderRewardsModalList();
      renderArchive(getDayNum());
      await saveCloud();
      showToast("تم حذف المكافأة");
    });

    row.appendChild(span);
    row.appendChild(del);
    box.appendChild(row);
  });
}

function viewExistingStory(day, index) {
  curStoryDay = day;
  activeStoryIndex = index;
  const list = S.stories[day] || [];
  const st = list[index];
  if (!st) return;

  if ($("svT")) $("svT").textContent = `ستوري يوم ${day} (${index + 1}/${list.length})`;
  if ($("svM")) {
    $("svM").innerHTML = `
      ${st.img ? `<img src="${st.img}" alt="ستوري" />` : `<div class="ph">ستوري نصي</div>`}
      ${st.note ? `<div class="note-box">${st.note}</div>` : ""}
    `;
  }
  if ($("storyInputArea")) $("storyInputArea").style.display = "none";
  if ($("storyDeleteBtn")) $("storyDeleteBtn").style.display = "flex";
  if ($("sv")) $("sv").classList.add("s");
}

function openNewStoryModal(day) {
  curStoryDay = day;
  activeStoryIndex = null;
  tempImg = "";
  if ($("svT")) $("svT").textContent = `إضافة ستوري ليوم ${day}`;
  if ($("svM")) $("svM").innerHTML = `<div class="ph">اختر صورة من الكاميرا أو المعرض</div>`;
  if ($("svN")) $("svN").value = "";
  if ($("fiCam")) $("fiCam").value = "";
  if ($("fiGal")) $("fiGal").value = "";
  if ($("storyInputArea")) $("storyInputArea").style.display = "flex";
  if ($("storyDeleteBtn")) $("storyDeleteBtn").style.display = "none";
  if ($("sv")) $("sv").classList.add("s");
}

async function handleStoryPick(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  tempImg = await compressImg(file);
  if ($("svM")) {
    $("svM").innerHTML = tempImg
      ? `<img src="${tempImg}" alt="معاينة" />`
      : `<div class="ph">تعذر تحميل الصورة</div>`;
  }
}

function openArchiveDayDetail(day) {
  if ($("ddTitle")) $("ddTitle").textContent = `سجل اليوم ${day}`;

  const ddStoriesEl = $("ddStories");
  if (ddStoriesEl) {
    ddStoriesEl.innerHTML = "";
    const list = S.stories[day] || [];
    list.forEach((st, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "st has";
      btn.innerHTML = `<i style="${st.img ? `background-image:url('${st.img}')` : ""}">${st.img ? "" : "📝"}</i>ستوري ${idx + 1}`;
      btn.addEventListener("click", () => viewExistingStory(day, idx));
      ddStoriesEl.appendChild(btn);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "st add-story";
    addBtn.innerHTML = `<i>+</i>إضافة`;
    addBtn.addEventListener("click", () => openNewStoryModal(day));
    ddStoriesEl.appendChild(addBtn);
  }

  const ddTasksEl = $("ddTasksList");
  if (ddTasksEl) {
    ddTasksEl.innerHTML = "";
    const dow = getDayOfWeek(day);
    const rawTasks = S.dayTasks[day];
    const statusMap = S.dayStatus[day] || {};

    if (!Array.isArray(rawTasks)) {
      ddTasksEl.innerHTML = `<div class="ph" style="padding:10px;">لا يوجد سجل محفوظ لهذا اليوم.</div>`;
    } else {
      const scheduled = rawTasks.filter((t) => !Array.isArray(t.days) || t.days.includes(dow));
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
  }

  if ($("dayDetailModal")) $("dayDetailModal").classList.add("s");
}

function renderArchive(dn) {
  const wkEl = $("wk");
  if (wkEl) {
    wkEl.innerHTML = "";
    for (let w = 1; w <= 13; w++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = w === selWeek ? "a" : "";
      b.textContent = `أسبوع ${w}`;
      b.addEventListener("click", () => {
        selWeek = w;
        renderArchive(dn);
      });
      wkEl.appendChild(b);
    }
  }

  const startD = (selWeek - 1) * 7 + 1;
  const endD = Math.min(90, selWeek * 7);

  let weekTotal = 0;
  let weekSuccess = 0;
  for (let d = startD; d <= endD; d++) {
    if (Array.isArray(S.dayTasks[d])) {
      const dow = getDayOfWeek(d);
      const tList = S.dayTasks[d].filter((t) => !Array.isArray(t.days) || t.days.includes(dow));
      const sMap = S.dayStatus[d] || {};
      weekTotal += tList.length;
      weekSuccess += tList.filter((t) => sMap[t.id] === "success").length;
    }
  }

  const weekPct = weekTotal > 0 ? Math.round((weekSuccess / weekTotal) * 100) : 0;
  const cardEl = $("weekRewardCard");
  if (cardEl) {
    cardEl.innerHTML = "";
    const claimed = S.weekRewards[selWeek];
    const suggested = tempWeekSuggestion[selWeek];

    if (claimed) {
      cardEl.className = "reward-box unlocked";
      cardEl.innerHTML = `
        <div style="font-size:12px; color:var(--ok); font-weight:bold;">🏆 مكافأة الأسبوع ${selWeek} المعتمدة (${weekPct}%)</div>
        <div style="font-size:16px; font-weight:bold; margin-top:4px;">🎁 ${claimed}</div>
      `;
    } else if (weekPct >= 70) {
      cardEl.className = "reward-box unlocked";
      if (!S.rewards.length) {
        cardEl.innerHTML = `
          <div style="font-size:13px; color:var(--ok); font-weight:bold;">🎉 إنجاز رائع (${weekPct}%) في الأسبوع ${selWeek}</div>
          <div style="font-size:12px; color:var(--mu); margin-top:4px;">أضف مكافآتك من (🎁 قائمة المكافآت) لسحب مكافأة.</div>
        `;
      } else if (!suggested) {
        const wrapDiv = document.createElement("div");
        wrapDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center; gap:10px;";
        wrapDiv.innerHTML = `
          <div>
            <div style="font-size:13px; color:var(--ok); font-weight:bold;">🎉 مبروك! حققت ${weekPct}% في الأسبوع ${selWeek}</div>
            <div style="font-size:12px; color:var(--mu); margin-top:2px;">اسحب مكافأة من قائمتك</div>
          </div>
        `;
        const pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.className = "btn";
        pickBtn.style.cssText = "padding:8px 12px; font-size:13px;";
        pickBtn.textContent = "🎁 اسحب مكافأتك";
        pickBtn.addEventListener("click", () => {
          tempWeekSuggestion[selWeek] = S.rewards[Math.floor(Math.random() * S.rewards.length)];
          renderArchive(dn);
        });
        wrapDiv.appendChild(pickBtn);
        cardEl.appendChild(wrapDiv);
      } else {
        cardEl.innerHTML = `
          <div style="font-size:12px; color:var(--ok); font-weight:bold;">✨ المكافأة المقترحة (${weekPct}%):</div>
          <div style="font-size:16px; font-weight:bold; margin:6px 0;">🎁 ${suggested}</div>
        `;
        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex; gap:8px; margin-top:8px;";

        const okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.className = "btn";
        okBtn.style.cssText = "flex:1; padding:8px; font-size:13px;";
        okBtn.textContent = "✅ اعتماد المكافأة";
        okBtn.addEventListener("click", async () => {
          S.weekRewards[selWeek] = suggested;
          delete tempWeekSuggestion[selWeek];
          renderArchive(dn);
          await saveCloud();
          showToast("🎉 تم اعتماد المكافأة");
        });

        const reBtn = document.createElement("button");
        reBtn.type = "button";
        reBtn.className = "btn g";
        reBtn.style.cssText = "padding:8px 12px; font-size:13px;";
        reBtn.textContent = "🔄 اقتراح آخر";
        reBtn.addEventListener("click", () => {
          let pool = [...S.rewards];
          if (pool.length > 1) pool = pool.filter((x) => x !== suggested);
          tempWeekSuggestion[selWeek] = pool[Math.floor(Math.random() * pool.length)];
          renderArchive(dn);
        });

        btnRow.appendChild(okBtn);
        btnRow.appendChild(reBtn);
        cardEl.appendChild(btnRow);
      }
    } else {
      cardEl.className = "reward-box";
      cardEl.innerHTML = `
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

  const wdaysEl = $("wdays");
  if (wdaysEl) {
    wdaysEl.innerHTML = "";
    for (let d = startD; d <= endD; d++) {
      const hasStories = Array.isArray(S.stories[d]) && S.stories[d].length > 0;
      const hasRecord = Array.isArray(S.dayTasks[d]);
      const count = hasStories ? S.stories[d].length : 0;

      let summary = "فارغ";
      if (hasRecord) {
        const dow = getDayOfWeek(d);
        const tList = S.dayTasks[d].filter((t) => !Array.isArray(t.days) || t.days.includes(dow));
        const sMap = S.dayStatus[d] || {};
        const okCount = tList.filter((t) => sMap[t.id] === "success").length;
        summary = `${okCount}/${tList.length} نجاح`;
      }

      const item = document.createElement("div");
      item.className = "tk" + (hasStories || hasRecord ? " success" : "");
      item.style.cssText = "cursor:pointer; padding:12px 6px; text-align:center; display:block;";
      item.innerHTML = `
        <div class="e" style="font-size:22px">${hasStories ? "📸" : hasRecord ? "📋" : "📅"}</div>
        <div class="n" style="font-size:13px; margin-top:4px;">يوم ${d}</div>
        <div style="font-size:10px; color:var(--mu); margin-top:2px;">${summary}${hasStories ? ` • ${count} ستوري` : ""}</div>
      `;
      item.addEventListener("click", () => openArchiveDayDetail(d));
      wdaysEl.appendChild(item);
    }
  }

  const baEl = $("ba");
  if (baEl) {
    baEl.innerHTML = "";
    S.ba.forEach((item, idx) => {
      const fig = document.createElement("figure");
      fig.innerHTML = `<img src="${item.img}" alt="تطور" />`;
      const cap = document.createElement("figcaption");
      cap.textContent = `يوم ${item.day} `;
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.style.cssText = "background:none; border:0; color:#f87171; cursor:pointer;";
      delBtn.textContent = "🗑️";
      delBtn.addEventListener("click", async () => {
        S.ba.splice(idx, 1);
        render();
        await saveCloud();
      });
      cap.appendChild(delBtn);
      fig.appendChild(cap);
      baEl.appendChild(fig);
    });
  }
}

function bindUI() {
  if ($("addBtn")) $("addBtn").addEventListener("click", () => openTaskModal());
  if ($("tmC")) $("tmC").addEventListener("click", () => $("tm").classList.remove("s"));

  if ($("tmS")) {
    $("tmS").addEventListener("click", async () => {
      const name = $("tmN") ? $("tmN").value.trim() : "";
      if (!name) return showToast("اكتب اسم التحدي أولاً");

      const sched = $("taskSchedule") ? $("taskSchedule").value : "all";
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

      if ($("tm")) $("tm").classList.remove("s");
      render();
      await saveCloud();
      showToast("تم حفظ التحدي ✅");
    });
  }

  if ($("manageRewardsBtn")) {
    $("manageRewardsBtn").addEventListener("click", () => {
      renderRewardsModalList();
      if ($("rewardsModal")) $("rewardsModal").classList.add("s");
    });
  }
  if ($("closeRewardsX")) $("closeRewardsX").addEventListener("click", () => $("rewardsModal").classList.remove("s"));
  if ($("closeRewardsBtn")) $("closeRewardsBtn").addEventListener("click", () => $("rewardsModal").classList.remove("s"));

  if ($("addRewardBtn")) {
    $("addRewardBtn").addEventListener("click", async () => {
      const inp = $("newRewardInput");
      const val = inp ? inp.value.trim() : "";
      if (!val) return showToast("اكتب المكافأة أولاً");
      S.rewards.push(val);
      inp.value = "";
      renderRewardsModalList();
      renderArchive(getDayNum());
      await saveCloud();
      showToast("تمت إضافة المكافأة 🎁");
    });
  }

  if ($("closeDayDetailX")) $("closeDayDetailX").addEventListener("click", () => $("dayDetailModal").classList.remove("s"));
  if ($("closeDayDetailBtn")) $("closeDayDetailBtn").addEventListener("click", () => $("dayDetailModal").classList.remove("s"));

  if ($("svX")) $("svX").addEventListener("click", () => $("sv").classList.remove("s"));
  if ($("fiCam")) $("fiCam").addEventListener("change", handleStoryPick);
  if ($("fiGal")) $("fiGal").addEventListener("change", handleStoryPick);

  if ($("svS")) {
    $("svS").addEventListener("click", async () => {
      const note = $("svN") ? $("svN").value.trim() : "";
      if (!tempImg && !note) return showToast("أضف صورة أو ملاحظة أولاً");

      if (!S.stories[curStoryDay]) S.stories[curStoryDay] = [];
      S.stories[curStoryDay].push({ id: "st_" + Date.now(), img: tempImg, note, date: todayStr() });
      tempImg = "";

      if ($("sv")) $("sv").classList.remove("s");
      render();
      if ($("dayDetailModal") && $("dayDetailModal").classList.contains("s")) {
        openArchiveDayDetail(curStoryDay);
      }
      await saveCloud();
      showToast("تم حفظ الستوري 📸");
    });
  }

  if ($("delStoryBtn")) {
    $("delStoryBtn").addEventListener("click", async () => {
      if (activeStoryIndex === null || activeStoryIndex === undefined) return;
      if (!confirm("هل تريد حذف هذا الستوري نهائياً؟")) return;

      if (S.stories[curStoryDay]) {
        S.stories[curStoryDay].splice(activeStoryIndex, 1);
        if (!S.stories[curStoryDay].length) {
          delete S.stories[curStoryDay];
        }
      }
      if ($("sv")) $("sv").classList.remove("s");
      render();
      if ($("dayDetailModal") && $("dayDetailModal").classList.contains("s")) {
        openArchiveDayDetail(curStoryDay);
      }
      await saveCloud();
      showToast("تم حذف الستوري");
    });
  }

  if ($("fiBa")) {
    $("fiBa").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const img = await compressImg(file, 650, 0.65);
      if (!img) return showToast("تعذر قراءة الصورة");
      S.ba.push({ day: getDayNum(), img, date: todayStr() });
      render();
      await saveCloud();
      showToast("تمت إضافة صورة التطور ✅");
    });
  }

  if ($("n1")) {
    $("n1").addEventListener("click", () => {
      if ($("home")) $("home").classList.remove("hide");
      if ($("archive")) $("archive").classList.add("hide");
      $("n1").classList.add("a");
      if ($("n2")) $("n2").classList.remove("a");
    });
  }

  if ($("n2")) {
    $("n2").addEventListener("click", () => {
      if ($("home")) $("home").classList.add("hide");
      if ($("archive")) $("archive").classList.remove("hide");
      $("n2").classList.add("a");
      if ($("n1")) $("n1").classList.remove("a");
      renderArchive(getDayNum());
    });
  }
}

async function startApp() {
  bindUI();

  let localData = null;
  try {
    const raw =
      localStorage.getItem("challenge90_state_v4") ||
      localStorage.getItem("challenge90_state_v3") ||
      localStorage.getItem("challenge90_state_v2");
    if (raw) {
      localData = JSON.parse(raw);
      hydrateState(localData);
    } else {
      hydrateState({ start: day3StartStr() });
    }
  } catch (_) {
    hydrateState({ start: day3StartStr() });
  }

  render();

  if (!docRef) {
    syncReady = true;
    await saveCloud();
    return;
  }

  try {
    const snap = await docRef.get();
    syncReady = true;
    if (snap && snap.exists) {
      const cloudData = snap.data() || {};
      const merged = {
        ...localData,
        ...cloudData,
        start: cloudData.start || (localData && localData.start) || day3StartStr()
      };
      hydrateState(merged);
      render();
      if (!cloudData.start && S.start) {
        await saveCloud();
      }
    } else {
      await saveCloud();
    }
  } catch (e) {
    syncReady = true;
    console.warn("Initial cloud sync notice:", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
