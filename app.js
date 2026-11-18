// 1. إعدادات الاتصال بقاعدة بيانات Firebase Firestore
const firebaseConfig = {
  apiKey: "AIzaSyD9HJhxKpFGdJ3tgXj-2k_gVTVJtI0ltlI",
  authDomain: "goij-add78.firebaseapp.com",
  projectId: "goij-add78",
  storageBucket: "goij-add78.firebasestorage.app",
  messagingSenderId: "181333877345",
  appId: "1:181333877345:web:5731cbc0f9da64ace40020",
  measurementId: "G-WSDM2XFGY1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.enablePersistence().catch(err => console.warn("Persistence warning:", err.code));

const docRef = db.collection("challenge90").doc("user_main_data");

// 2. التحديات الافتراضية الستة
const DEFAULT_TASKS = [
  { id: "d0", n: "الصلاة", e: "🕌", days: [0,1,2,3,4,5,6] },
  { id: "d1", n: "القرآن", e: "📖", days: [0,1,2,3,4,5,6] },
  { id: "d2", n: "الدراسة", e: "📚", days: [0,1,2,3,4,5,6] },
  { id: "d3", n: "الرياضة", e: "💪", days: [0,1,2,3,4,5,6] },
  { id: "d4", n: "منصة نهل", e: "🎓", days: [0,1,2,3,4,5,6] },
  { id: "d5", n: "ترك العادات السرية", e: "🚫", days: [0,1,2,3,4,5,6] }
];

const EMOJIS = ["🔥","🕌","📖","📚","💪","🎓","🚫","💧","🏃","🧠","✍️","💤","🥗","💻","🎯","⭐"];
const DAYS_OF_WEEK = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

let S = {
  start: null,
  tasks: [],
  dayStatus: {}, 
  dayTasks: {},  
  stories: {}, // الآن يدعم مصفوفة ستوريات لكل يوم: { dayNum: [ {id, img, note} ] }
  ba: []
};

let editId = null;
let selEmoji = EMOJIS[0];
let curStoryDay = 1;
let activeStoryIndex = null;

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getDayNum() {
  if (!S.start) return 1;
  const s = new Date(S.start + "T00:00:00");
  const t = new Date(todayStr() + "T00:00:00");
  const diff = Math.floor((t - s) / 86400000) + 1;
  return Math.max(1, Math.min(90, diff));
}

function getDayOfWeek(dayNum) {
  if (!S.start) return new Date().getDay();
  const s = new Date(S.start + "T00:00:00");
  s.setDate(s.getDate() + (dayNum - 1));
  return s.getDay(); // 0 الأحد إلى 6 السبت
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => t.style.display = "none", 2500);
}

async function save() {
  try {
    await docRef.set(S, { merge: true });
  } catch (e) {
    console.error("خطأ في الحفظ السحابي:", e);
    showToast("⚠️ تعذر الحفظ في السحابة");
  }
}

async function initApp() {
  showToast("⏳ جاري المزامنة مع السحابة...");
  try {
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      S.start = data.start || todayStr();
      S.tasks = (data.tasks && data.tasks.length > 0) ? data.tasks : DEFAULT_TASKS.map(t => ({...t}));
      // توافقية مع النسخ القديمة إذا كانت الستوريات عبارة عن كائن وليست مصفوفة
      S.stories = {};
      if (data.stories) {
        for (let k in data.stories) {
          if (!Array.isArray(data.stories[k])) {
            S.stories[k] = [data.stories[k]];
          } else {
            S.stories[k] = data.stories[k];
          }
        }
      }
      S.dayStatus = data.dayStatus || {};
      S.dayTasks = data.dayTasks || {};
      S.ba = data.ba || [];
      if (!data.tasks || data.tasks.length === 0) await save();
    } else {
      S.start = todayStr();
      S.tasks = DEFAULT_TASKS.map(t => ({...t}));
      await save();
    }
    showToast("✅ تمت المزامنة بنجاح");
  } catch (e) {
    console.error("خطأ في الاتصال بـ Firestore:", e);
    S.start = todayStr();
    S.tasks = DEFAULT_TASKS.map(t => ({...t}));
    showToast("⚠️ تعذر الاتصال بقاعدة البيانات");
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
        let w = img.width, h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function render() {
  const dn = getDayNum();
  document.getElementById("dn").textContent = dn;
  
  const ringEl = document.getElementById("ring");
  if (ringEl) {
    const pctVal = Math.round((dn / 90) * 100);
    ringEl.style.setProperty('--p', pctVal);
  }

  if (!S.dayTasks[dn]) {
    S.dayTasks[dn] = JSON.parse(JSON.stringify(S.tasks));
  }
  if (!S.dayStatus[dn]) {
    S.dayStatus[dn] = {};
  }

  // رسم الستوريات الأفقية لشريط اليوم الحالي (مع دعم الستوريات المتعددة وزر الإضافة +)
  const storiesEl = document.getElementById("stories");
  storiesEl.innerHTML = "";
  
  const dayStories = S.stories[dn] || [];
  dayStories.forEach((st, idx) => {
    const btnSt = document.createElement("button");
    btnSt.className = "st has";
    btnSt.innerHTML = `<i style="background-image:url(${st.img})"></i>ستوري ${idx + 1}`;
    btnSt.onclick = () => viewExistingStory(dn, idx);
    storiesEl.appendChild(btnSt);
  });

  // زر إضافة ستوري جديد بجانب الستوريات
  const addStBtn = document.createElement("button");
  addStBtn.className = "st add-story today";
  addStBtn.innerHTML = `<i>+</i>إضافة`;
  addStBtn.onclick = () => openNewStoryModal(dn);
  storiesEl.appendChild(addStBtn);

  // تصفية مهام اليوم الحالي بناءً على الأيام المجدولة لها
  const currentDow = getDayOfWeek(dn);
  const baseTasks = S.dayTasks[dn] || S.tasks;
  const activeTasks = baseTasks.filter(t => !t.days || t.days.includes(currentDow));

  const statusMap = S.dayStatus[dn] || {};
  const tasksEl = document.getElementById("tasks");
  tasksEl.innerHTML = "";
  
  activeTasks.forEach(t => {
    const st = statusMap[t.id]; 
    const card = document.createElement("div");
    card.className = "tk" + (st === 'success' ? " success" : st === 'fail' ? " fail" : "");
    card.innerHTML = `
      <div class="tk-info">
        <span class="e">${t.e}</span>
        <span class="n">${t.n}</span>
      </div>
      <div class="tk-actions">
        <button class="act-btn success-btn ${st === 'success' ? 'active' : ''}" onclick="setTaskStatus('${t.id}', 'success')">✓ نجاح</button>
        <button class="act-btn fail-btn ${st === 'fail' ? 'active' : ''}" onclick="setTaskStatus('${t.id}', 'fail')">✕ فشل</button>
        <button class="tool-ic" onclick="editTask('${t.id}')">✏️</button>
        <button class="tool-ic" onclick="delTask('${t.id}')">🗑️</button>
      </div>
    `;
    tasksEl.appendChild(card);
  });

  const total = activeTasks.length;
  const completed = Object.keys(statusMap).filter(id => activeTasks.some(t => t.id === id) && statusMap[id] === 'success').length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById("pct").textContent = `إنجاز اليوم: ${completed} من ${total} نجاح (${pct}%)`;
  document.getElementById("bar").style.width = pct + "%";

  renderArchive(dn);
}

async function setTaskStatus(id, status) {
  const dn = getDayNum();
  if (!S.dayStatus[dn]) S.dayStatus[dn] = {};
  if (S.dayStatus[dn][id] === status) {
    delete S.dayStatus[dn][id];
  } else {
    S.dayStatus[dn][id] = status;
  }
  render();
  await save();
}

function openTaskModal(task = null) {
  editId = task ? task.id : null;
  document.getElementById("tmT").textContent = task ? "تعديل التحدي" : "تحدي جديد وسام";
  document.getElementById("tmN").value = task ? task.n : "";
  selEmoji = task ? task.e : EMOJIS[0];
  
  // تحديد أيام التكرار
  const daysArr = task && task.days ? task.days : [0,1,2,3,4,5,6];
  document.getElementById("taskSchedule").value = daysArr.length === 7 ? "all" : "custom";
  
  const emoEl = document.getElementById("emo");
  emoEl.innerHTML = EMOJIS.map(e => `<button type="button" class="${e === selEmoji ? "a" : ""}" onclick="selectEmoji('${e}')">${e}</button>`).join("");
  document.getElementById("tm").classList.add("s");
}

window.selectEmoji = (e) => {
  selEmoji = e;
  document.querySelectorAll("#emo button").forEach(el => el.classList.toggle("a", el.textContent === e));
};

window.editTask = (id) => {
  const t = S.tasks.find(x => x.id === id);
  if (t) openTaskModal(t);
};

window.delTask = async (id) => {
  if (!confirm("هل تريد حذف هذا التحدي من القائمة المستقبلية؟")) return;
  S.tasks = S.tasks.filter(x => x.id !== id);
  render();
  await save();
  showToast("تم حذف التحدي");
};

document.getElementById("addBtn").onclick = () => openTaskModal();
document.getElementById("tmC").onclick = () => document.getElementById("tm").classList.remove("s");

document.getElementById("tmS").onclick = async () => {
  const name = document.getElementById("tmN").value.trim();
  if (!name) return showToast("اكتب اسم التحدي أولاً");
  
  const sched = document.getElementById("taskSchedule").value;
  let targetDays = [0,1,2,3,4,5,6];
  if (sched === "sat_thu") targetDays = [1,2,3,4,5,6]; // السبت إلى الخميس
  else if (sched === "fri") targetDays = [5]; // الجمعة فقط
  else if (sched === "weekend") targetDays = [5,6]; // الجمعة والسبت

  const dn = getDayNum();
  if (editId) {
    S.tasks.forEach(t => { if (t.id === editId) { t.n = name; t.e = selEmoji; t.days = targetDays; } });
    if (S.dayTasks[dn]) {
      S.dayTasks[dn].forEach(t => { if (t.id === editId) { t.n = name; t.e = selEmoji; t.days = targetDays; } });
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
  showToast("تم حفظ التحدي بنجاح ✅");
};

// دوال إدارة الستوريات (عرض الستوري الحالي بحذف فقط بدون تعديل، وإضافة ستوريات متعددة)
function viewExistingStory(day, index) {
  curStoryDay = day;
  activeStoryIndex = index;
  const stList = S.stories[day] || [];
  const st = stList[index];
  if (!st) return;

  document.getElementById("svT").textContent = `ستوري يوم ${day} (${index + 1}/${stList.length})`;
  document.getElementById("svM").innerHTML = `
    <img src="${st.img}">
    ${st.note ? `<div class="note-box">${st.note}</div>` : ''}
  `;
  // إخفاء حقول الإدخال وإظهار زر الحذف فقط
  document.getElementById("storyInputArea").style.display = "none";
  document.getElementById("storyDeleteBtn").style.display = "block";
  document.getElementById("sv").classList.add("s");
}

function openNewStoryModal(day) {
  curStoryDay = day;
  activeStoryIndex = null;
  document.getElementById("svT").textContent = `إضافة ستوري ليوم ${day}`;
  document.getElementById("svM").innerHTML = `<div class="ph">اختر صورة الكاميرا أو المعرض لإضافة ستوري جديد</div>`;
  document.getElementById("svN").value = "";
  // إظهار حقول الإدخال وإخفاء زر الحذف المفرد
  document.getElementById("storyInputArea").style.display = "block";
  document.getElementById("storyDeleteBtn").style.display = "none";
  document.getElementById("sv").classList.add("s");
}

document.getElementById("svX").onclick = () => document.getElementById("sv").classList.remove("s");

async function handleStoryFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  tempImg = await compressImg(file);
  document.getElementById("svM").innerHTML = `<img src="${tempImg}">`;
}
document.getElementById("fiCam").onchange = handleStoryFile;
document.getElementById("fiGal").onchange = handleStoryFile;

document.getElementById("svS").onclick = async () => {
  const note = document.getElementById("svN").value.trim();
  if (!tempImg) return showToast("يرجى إرفاق صورة للستوري أولاً");
  
  if (!S.stories[curStoryDay]) S.stories[curStoryDay] = [];
  S.stories[curStoryDay].push({ id: "st_" + Date.now(), img: tempImg, note, date: todayStr() });
  
  tempImg = "";
  document.getElementById("sv").classList.remove("s");
  render();
  await save();
  showToast("تمت إضافة الستوري بنجاح 📸");
};

// زر حذف الستوري الحالي من النافذة المنبثقة
window.deleteCurrentStory = async () => {
  if (activeStoryIndex === null || activeStoryIndex === undefined) return;
  if (!confirm("هل تريد حذف هذا الستوري نهائياً؟")) return;

  if (S.stories[curStoryDay]) {
    S.stories[curStoryDay].splice(activeStoryIndex, 1);
    if (S.stories[curStoryDay].length === 0) {
      delete S.stories[curStoryDay];
    }
  }
  document.getElementById("sv").classList.remove("s");
  render();
  await save();
  showToast("تم حذف الستوري");
};

let selWeek = 1;
function renderArchive(dn) {
  const wkEl = document.getElementById("wk");
  wkEl.innerHTML = "";
  for (let w = 1; w <= 13; w++) {
    const b = document.createElement("button");
    b.className = (w === selWeek ? "a" : "");
    b.textContent = `أسبوع ${w}`;
    b.onclick = () => { selWeek = w; renderArchive(dn); };
    wkEl.appendChild(b);
  }

  const wdaysEl = document.getElementById("wdays");
  wdaysEl.innerHTML = "";
  const startD = (selWeek - 1) * 7 + 1;
  const endD = Math.min(90, selWeek * 7);
  for (let d = startD; d <= endD; d++) {
    const hasStories = S.stories[d] && S.stories[d].length > 0;
    const count = hasStories ? S.stories[d].length : 0;
    const item = document.createElement("div");
    item.className = "tk" + (hasStories ? " success" : "");
    item.style.cursor = "pointer";
    item.style.padding = "12px 6px";
    item.style.textAlign = "center";
    item.style.display = "block";
    item.innerHTML = `
      <div class="e" style="font-size:22px">${hasStories ? '📸' : '📅'}</div>
      <div class="n" style="font-size:13px;margin-top:4px">يوم ${d}</div>
      <div style="font-size:10px;color:var(--mu);margin-top:2px">${hasStories ? `${count} ستوري` : "فارغ"}</div>
    `;
    // عند الضغط على اليوم في الأرشيف، إذا كان لديه ستوريات يفتح الأول، وإلا يفتح نافذة إضافة ستوري
    item.onclick = () => {
      if (hasStories) {
        viewExistingStory(d, 0);
      } else {
        openNewStoryModal(d);
      }
    };
    wdaysEl.appendChild(item);
  }

  const baEl = document.getElementById("ba");
  baEl.innerHTML = S.ba.map((item, idx) => `
    <figure>
      <img src="${item.img}">
      <figcaption>يوم ${item.day} <button onclick="delBa(${idx})" style="background:none;border:0;color:#f87171;cursor:pointer">🗑️</button></figcaption>
    </figure>
  `).join("");
}

document.getElementById("fiBa").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await compressImg(file, 650, 0.65);
  S.ba.push({ day: getDayNum(), img, date: todayStr() });
  render();
  await save();
  showToast("تمت إضافة صورة التطور ✅");
};

window.delBa = async (idx) => {
  S.ba.splice(idx, 1);
  render();
  await save();
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
};

initApp();
