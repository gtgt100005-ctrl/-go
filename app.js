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
  { id: "d0", n: "الصلاة", e: "🕌" },
  { id: "d1", n: "القرآن", e: "📖" },
  { id: "d2", n: "الدراسة", e: "📚" },
  { id: "d3", n: "الرياضة", e: "💪" },
  { id: "d4", n: "منصة نهل", e: "🎓" },
  { id: "d5", n: "ترك العادات السرية", e: "🚫" }
];

const EMOJIS = ["🔥","🕌","📖","📚","💪","🎓","🚫","💧","🏃","🧠","✍️","💤","🥗","💻","🎯","⭐"];

let S = {
  start: null,
  tasks: [],
  dayStatus: {}, // يحفظ حالة كل تحدي لكل يوم: { dayNum: { taskId: 'success' أو 'fail' } }
  dayTasks: {},  // يحفظ نسخة التحديات الخاصة بكل يوم لضمان ثبات الماضي
  stories: {},
  ba: []
};

let editId = null;
let selEmoji = EMOJIS[0];
let curStoryDay = 1;
let tempImg = "";

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
      S.tasks = (data.tasks && data.tasks.length > 0) ? data.tasks : [...DEFAULT_TASKS];
      S.dayStatus = data.dayStatus || {};
      S.dayTasks = data.dayTasks || {};
      S.stories = data.stories || {};
      S.ba = data.ba || [];
      if (!data.tasks || data.tasks.length === 0) await save();
    } else {
      S.start = todayStr();
      S.tasks = [...DEFAULT_TASKS];
      await save();
    }
    showToast("✅ تمت المزامنة بنجاح");
  } catch (e) {
    console.error("خطأ في الاتصال بـ Firestore:", e);
    S.start = todayStr();
    S.tasks = [...DEFAULT_TASKS];
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

  // تثبيت نسخة التحديات لهذا اليوم إن لم تكن موجودة
  if (!S.dayTasks[dn]) {
    S.dayTasks[dn] = JSON.parse(JSON.stringify(S.tasks));
  }
  if (!S.dayStatus[dn]) {
    S.dayStatus[dn] = {};
  }

  // رسم الستوريات الأفقية
  const storiesEl = document.getElementById("stories");
  storiesEl.innerHTML = "";
  for (let i = 1; i <= dn; i++) {
    const hasStory = !!S.stories[i];
    const isToday = (i === dn);
    const btnSt = document.createElement("button");
    btnSt.className = "st" + (hasStory ? " has" : "") + (isToday ? " today" : "");
    btnSt.innerHTML = `<i style="${hasStory && S.stories[i].img ? `background-image:url(${S.stories[i].img})` : ''}">${hasStory && S.stories[i].img ? '' : i}</i>يوم ${i}`;
    btnSt.onclick = () => openStory(i);
    storiesEl.appendChild(btnSt);
  }

  // رسم بطاقات المهام بنظام النجاح والفشل
  const activeTasks = S.dayTasks[dn] || S.tasks;
  const statusMap = S.dayStatus[dn] || {};
  const tasksEl = document.getElementById("tasks");
  tasksEl.innerHTML = "";
  
  activeTasks.forEach(t => {
    const st = statusMap[t.id]; // 'success' أو 'fail' أو undefined
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
  const completed = Object.values(statusMap).filter(val => val === 'success').length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById("pct").textContent = `إنجاز اليوم: ${completed} من ${total} نجاح (${pct}%)`;
  document.getElementById("bar").style.width = pct + "%";

  renderArchive(dn);
}

async function setTaskStatus(id, status) {
  const dn = getDayNum();
  if (!S.dayStatus[dn]) S.dayStatus[dn] = {};
  // إذا ضغط نفس الزر مجدداً، يتم إلغاء الحالة
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
  document.getElementById("tmT").textContent = task ? "تعديل التحدي" : "تحدي جديد";
  document.getElementById("tmN").value = task ? task.n : "";
  selEmoji = task ? task.e : EMOJIS[0];
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
  const dn = getDayNum();
  if (editId) {
    S.tasks.forEach(t => { if (t.id === editId) { t.n = name; t.e = selEmoji; } });
    if (S.dayTasks[dn]) {
      S.dayTasks[dn].forEach(t => { if (t.id === editId) { t.n = name; t.e = selEmoji; } });
    }
  } else {
    const newTask = { id: "t" + Date.now(), n: name, e: selEmoji };
    S.tasks.push(newTask);
    if (S.dayTasks[dn]) {
      S.dayTasks[dn].push(newTask);
    }
  }
  document.getElementById("tm").classList.remove("s");
  render();
  await save();
  showToast("تم حفظ التحدي في السحابة ✅");
};

function openStory(day) {
  curStoryDay = day;
  const st = S.stories[day] || { img: "", note: "" };
  tempImg = st.img || "";
  document.getElementById("svT").textContent = `ستوري اليوم ${day}`;
  document.getElementById("svN").value = st.note || "";
  document.getElementById("svM").innerHTML = tempImg ? `<img src="${tempImg}">` : `<div class="ph">لا توجد صورة مرفقة لهذا اليوم</div>`;
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
  if (!tempImg && !note) return showToast("أضف صورة أو ملاحظة للحفظ");
  S.stories[curStoryDay] = { img: tempImg, note, date: todayStr() };
  document.getElementById("sv").classList.remove("s");
  render();
  await save();
  showToast("تم حفظ الستوري سحابياً 📸");
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
    const has = !!S.stories[d];
    const item = document.createElement("div");
    item.className = "tk" + (has ? " success" : "");
    item.style.cursor = "pointer";
    item.style.padding = "12px 6px";
    item.style.textAlign = "center";
    item.style.display = "block";
    item.innerHTML = `
      <div class="e" style="font-size:22px">${has && S.stories[d].img ? '📸' : '📅'}</div>
      <div class="n" style="font-size:13px;margin-top:4px">يوم ${d}</div>
      <div style="font-size:10px;color:var(--mu);margin-top:2px">${has ? "مكتمل" : "فارغ"}</div>
    `;
    item.onclick = () => openStory(d);
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
