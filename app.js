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

// تفعيل التخزين المؤقت للعمل السريع حتى مع ضعف الإنترنت
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

// الحالة الأساسية للتطبيق
let S = {
  start: null,
  tasks: [],
  days: {},
  stories: {},
  ba: []
};

let editId = null;
let selEmoji = EMOJIS[0];
let curStoryDay = 1;
let tempImg = "";

// دالة الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// حساب رقم اليوم الحالي من أصل 90 يوماً تلقائياً
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
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// 3. حفظ البيانات في Firestore
async function save() {
  try {
    await docRef.set(S, { merge: true });
  } catch (e) {
    console.error("خطأ في الحفظ السحابي:", e);
    showToast("⚠️ تعذر الحفظ في السحابة، تأكد من تفعيل Firestore");
  }
}

// 4. تحميل البيانات من Firestore عند فتح الموقع
async function initApp() {
  showToast("⏳ جاري المزامنة مع السحابة...");
  try {
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      S.start = data.start || todayStr();
      S.tasks = (data.tasks && data.tasks.length > 0) ? data.tasks : [...DEFAULT_TASKS];
      S.days = data.days || {};
      S.stories = data.stories || {};
      S.ba = data.ba || [];
      if (!data.tasks || data.tasks.length === 0) await save();
    } else {
      // أول تشغيل للموقع: تهيئة التاريخ والتحديات الستة وحفظها فوراً في السحابة
      S.start = todayStr();
      S.tasks = [...DEFAULT_TASKS];
      await save();
    }
    showToast("✅ تمت المزامنة بنجاح");
  } catch (e) {
    console.error("خطأ في الاتصال بـ Firestore:", e);
    S.start = todayStr();
    S.tasks = [...DEFAULT_TASKS];
    showToast("⚠️ تعذر الاتصال بقاعدة البيانات (تأكد من وضع الاختبار)");
  }
  render();
}

// ضغط الصور قبل الحفظ لتجنب تجاوز حد المستند في Firestore (1MB)
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

// 5. تحديث الواجهة الرسومية بالكامل
function render() {
  const dn = getDayNum();
  document.getElementById("dn").textContent = dn;
  const ringPct = Math.round((dn / 90) * 100);
  document.getElementById("ring").style.background = `conic-gradient(#8b5cf6 ${ringPct}%, #1e1b2e ${ringPct}%)`;

  // رسم شريط الستوريات اليومية
  const storiesEl = document.getElementById("stories");
  storiesEl.innerHTML = "";
  for (let i = 1; i <= dn; i++) {
    const hasStory = !!S.stories[i];
    const div = document.createElement("div");
    div.className = "st" + (hasStory ? " has" : "") + (i === dn ? " cur" : "");
    div.innerHTML = `<div class="av">${hasStory && S.stories[i].img ? `<img src="${S.stories[i].img}">` : `<span>${i}</span>`}</div><small>يوم ${i}</small>`;
    div.onclick = () => openStory(i);
    storiesEl.appendChild(div);
  }

  // رسم بطاقات التحديات والمهام
  const doneList = S.days[dn] || [];
  const tasksEl = document.getElementById("tasks");
  tasksEl.innerHTML = "";
  S.tasks.forEach(t => {
    const isDone = doneList.includes(t.id);
    const card = document.createElement("div");
    card.className = "card" + (isDone ? " done" : "");
    card.innerHTML = `
      <div class="top-c">
        <span class="ico">${t.e}</span>
        <div class="acts">
          <button class="ib" onclick="event.stopPropagation(); editTask('${t.id}')">✏️</button>
          <button class="ib" onclick="event.stopPropagation(); delTask('${t.id}')">🗑️</button>
        </div>
      </div>
      <div class="ttl">${t.n}</div>
      <div class="chk">${isDone ? "✓ مكتمل" : "اضغط للإنجاز"}</div>
    `;
    card.onclick = () => toggleTask(t.id);
    tasksEl.appendChild(card);
  });

  // تحديث شريط نسبة الإنجاز اليومي
  const total = S.tasks.length;
  const completed = doneList.filter(id => S.tasks.some(t => t.id === id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById("pct").textContent = `إنجاز اليوم: ${completed} من ${total} (${pct}%)`;
  document.getElementById("bar").style.width = pct + "%";

  renderArchive(dn);
}

async function toggleTask(id) {
  const dn = getDayNum();
  if (!S.days[dn]) S.days[dn] = [];
  const idx = S.days[dn].indexOf(id);
  if (idx > -1) S.days[dn].splice(idx, 1);
  else S.days[dn].push(id);
  render();
  await save();
}

// إدارة إضافة وتعديل وحذف التحديات
function openTaskModal(task = null) {
  editId = task ? task.id : null;
  document.getElementById("tmT").textContent = task ? "تعديل التحدي" : "تحدي جديد";
  document.getElementById("tmN").value = task ? task.n : "";
  selEmoji = task ? task.e : EMOJIS[0];
  const emoEl = document.getElementById("emo");
  emoEl.innerHTML = EMOJIS.map(e => `<span class="${e === selEmoji ? "a" : ""}" onclick="selectEmoji('${e}')">${e}</span>`).join("");
  document.getElementById("tm").classList.add("show");
}

window.selectEmoji = (e) => {
  selEmoji = e;
  document.querySelectorAll("#emo span").forEach(el => el.classList.toggle("a", el.textContent === e));
};

window.editTask = (id) => {
  const t = S.tasks.find(x => x.id === id);
  if (t) openTaskModal(t);
};

window.delTask = async (id) => {
  if (!confirm("هل تريد حذف هذا التحدي؟")) return;
  S.tasks = S.tasks.filter(x => x.id !== id);
  render();
  await save();
  showToast("تم حذف التحدي");
};

document.getElementById("addBtn").onclick = () => openTaskModal();
document.getElementById("tmC").onclick = () => document.getElementById("tm").classList.remove("show");
document.getElementById("tmS").onclick = async () => {
  const name = document.getElementById("tmN").value.trim();
  if (!name) return showToast("اكتب اسم التحدي أولاً");
  if (editId) {
    const t = S.tasks.find(x => x.id === editId);
    if (t) { t.n = name; t.e = selEmoji; }
  } else {
    S.tasks.push({ id: "t" + Date.now(), n: name, e: selEmoji });
  }
  document.getElementById("tm").classList.remove("show");
  render();
  await save();
  showToast("تم حفظ التحدي في السحابة ✅");
};

// إدارة الستوريات اليومية
function openStory(day) {
  curStoryDay = day;
  const st = S.stories[day] || { img: "", note: "" };
  tempImg = st.img || "";
  document.getElementById("svT").textContent = `ستوري اليوم ${day}`;
  document.getElementById("svN").value = st.note || "";
  document.getElementById("svM").innerHTML = tempImg ? `<img src="${tempImg}">` : `<div class="empty">لا توجد صورة مرفقة لهذا اليوم</div>`;
  document.getElementById("sv").classList.add("show");
}

document.getElementById("svX").onclick = () => document.getElementById("sv").classList.remove("show");

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
  document.getElementById("sv").classList.remove("show");
  render();
  await save();
  showToast("تم حفظ الستوري سحابياً 📸");
};

// الأرشيف وقبل وبعد
let selWeek = 1;
function renderArchive(dn) {
  const wkEl = document.getElementById("wk");
  wkEl.innerHTML = "";
  for (let w = 1; w <= 13; w++) {
    const b = document.createElement("button");
    b.className = "wb" + (w === selWeek ? " a" : "");
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
    item.className = "wday" + (has ? " has" : "");
    item.innerHTML = `<b>يوم ${d}</b><span>${has ? "📸 عرض" : "فارغ"}</span>`;
    item.onclick = () => openStory(d);
    wdaysEl.appendChild(item);
  }

  const baEl = document.getElementById("ba");
  baEl.innerHTML = S.ba.map((item, idx) => `
    <div class="ba-c">
      <img src="${item.img}">
      <div class="ba-f"><span>يوم ${item.day}</span><button onclick="delBa(${idx})">🗑️</button></div>
    </div>
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

// التنقل بين الرئيسية والأرشيف
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

// تشغيل التطبيق
initApp();
