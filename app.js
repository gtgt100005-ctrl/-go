// استيراد الدوال اللازمة من فايربيس (نسخة الـ Compat المتوافقة مع ملفات الويب العادية)
// تأكد من إضافة سكريبتات فايربيس في ملف index.html قبل هذا الملف

const firebaseConfig = {
  apiKey: "AIzaSyD9HJhxKpFGdJ3tgXj-2k_gVTVJtI0ltlI",
  authDomain: "goij-add78.firebaseapp.com",
  projectId: "goij-add78",
  storageBucket: "goij-add78.firebasestorage.app",
  messagingSenderId: "181333877345",
  appId: "1:181333877345:web:5731cbc0f9da64ace40020",
  measurementId: "G-WSDM2XFGY1"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// مرجع الوثيقة في قاعدة البيانات (نحفظ بيانات المستخدم في وثيقة موحدة لتسهيل المزامنة)
const docRef = db.collection("challenges").unauthorized ? null : db.collection("userChallenge").doc("myChallengeData");

var $=function(i){return document.getElementById(i)};
var EM=["🕌","📖","📚","💪","🎓","🚫","💧","😴","🥗","🧠","✍️","🏃","🤲","⏰","🌱","🎯"];
var S={start:null,tasks:[],done:{},stories:{},ba:[]};

function dkey(d){d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}

// جلب البيانات من فايربيس Firestore
function load(){
  docRef.get().then(function(doc) {
      if (doc.exists) {
          S = doc.data();
          if(!S.start) S.start = dkey();
          if(!S.tasks || !S.tasks.length) S.tasks = [["الصلاة","🕌"],["القرآن","📖"],["الدراسة","📚"],["الرياضة","💪"],["منصة نهل","🎓"],["ترك العادات السرية","🚫"]].map(function(t,i){return{id:"d"+i,n:t[0],e:t[1]}});
          S.done = S.done || {}; S.stories = S.stories || {}; S.ba = S.ba || [];
          render();
      } else {
          // إذا لم تكن البيانات موجودة مسبقاً، ننشئ القيم الافتراضية ونحفظها
          S.start = dkey();
          S.tasks = [["الصلاة","🕌"],["القرآن","📖"],["الدراسة","📚"],["الرياضة","💪"],["منصة نهل","🎓"],["ترك العادات السرية","🚫"]].map(function(t,i){return{id:"d"+i,n:t[0],e:t[1]}});
          S.done = {}; S.stories = {}; S.ba = [];
          save();
          render();
      }
  }).catch(function(error) {
      console.log("خطأ في جلب البيانات:", error);
      // كاحتياط لو حدث انقطاع في الاتصال، نعمل بالبيانات الافتراضية
      if(!S.start) S.start = dkey();
      render();
  });
}

// حفظ البيانات في فايربيس Firestore
function save(){
  docRef.set(S).then(function() {
      // تم الحفظ بنجاح سحابياً
  }).catch(function(error) {
      console.error("خطأ في الحفظ:", error);
      toast("تعذر الحفظ السحابي");
  });
  return true;
}

function toast(m){var t=$("toast");t.textContent=m;t.style.display="block";setTimeout(function(){t.style.display="none"},2200)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function today(){var a=new Date(S.start+"T00:00:00"),b=new Date(dkey()+"T00:00:00");var n=Math.round((b-a)/864e5)+1;return Math.max(1,Math.min(90,n))}

function render(){
 var T=today();$("dn").textContent=T;$("ring").style.setProperty("--p",(T/90*100).toFixed(1));
 var h='';for(var d=T;d>=1;d--){var s=S.stories[d];
  h+='<button class="st '+(s?'has ':'')+(d===T?'today':'')+'" data-d="'+d+'"><i style="'+(s&&s.img?'background-image:url('+s.img+')':'')+'">'+(s&&s.img?'':(d===T?'＋':d))+'</i>'+(d===T?'ستوري اليوم':'يوم '+d)+'</button>'}
 $("stories").innerHTML=h;
 var dn=S.done[dkey()]||[],c=0;
 $("tasks").innerHTML=S.tasks.map(function(t){var on=dn.indexOf(t.id)>-1;if(on)c++;
  return '<div class="tk '+(on?'on':'')+'" data-id="'+t.id+'"><span class="ck">'+(on?'✓':'')+'</span><span class="tools"><button data-ed="'+t.id+'">✏️</button><button data-del="'+t.id+'">🗑️</button></span><div class="e">'+esc(t.e)+'</div><div class="n">'+esc(t.n)+'</div></div>'}).join("");
 var p=S.tasks.length?Math.round(c/S.tasks.length*100):0;
 $("pct").textContent="إنجاز اليوم: "+c+" من "+S.tasks.length+" ("+p+"٪)";$("bar").style.width=p+"%";
 renderArch()}

$("tasks").onclick=function(ev){var el=ev.target,id;
 if(id=el.getAttribute("data-del")){if(confirm("حذف هذا التحدي؟")){S.tasks=S.tasks.filter(function(t){return t.id!==id});save();render()}return}
 if(id=el.getAttribute("data-ed")){openTM(id);return}
 var c=el.closest(".tk");if(!c)return;id=c.getAttribute("data-id");var k=dkey();S.done[k]=S.done[k]||[];
 var i=S.done[k].indexOf(id);if(i>-1)S.done[k].splice(i,1);else S.done[k].push(id);save();render()};

var edId=null,pick=EM[0];
function openTM(id){edId=id||null;var t=S.tasks.filter(function(x){return x.id===id})[0];
 $("tmT").textContent=t?"تعديل التحدي":"تحدي جديد";$("tmN").value=t?t.n:"";pick=t?t.e:EM[0];drawEmo();$("tm").classList.add("s");$("tmN").focus()}
function drawEmo(){$("emo").innerHTML=EM.map(function(e){return'<button data-e="'+e+'" class="'+(e===pick?'a':'')+'">'+e+'</button>'}).join("")}
$("emo").onclick=function(ev){var e=ev.target.getAttribute("data-e");if(e){pick=e;drawEmo()}};
$("addBtn").onclick=function(){openTM()};
$("tmC").onclick=function(){$("tm").classList.remove("s")};
$("tmS").onclick=function(){var n=$("tmN").value.trim();if(!n){toast("اكتب اسم التحدي");return}
 if(edId){S.tasks.forEach(function(t){if(t.id===edId){t.n=n;t.e=pick}})}else S.tasks.push({id:"t"+Date.now(),n:n,e:pick});
 save();$("tm").classList.remove("s");render()};

var curD=null,curImg=null;
function openSV(d){curD=d;var s=S.stories[d]||{};curImg=s.img||null;$("svT").textContent="يوم "+d+" من 90";$("svN").value=s.note||"";
 $("svN").readOnly=d!==today();$("svU").style.display=d===today()?"":"none";$("svS").style.display=d===today()?"":"none";drawSV();$("sv").classList.add("s")}
function drawSV(){$("svM").innerHTML=curImg?'<img src="'+curImg+'" alt="">':'<div class="ph">لا توجد صورة لهذا اليوم</div>'}
$("svX").onclick=function(){$("sv").classList.remove("s")};
$("stories").onclick=function(ev){var b=ev.target.closest(".st");if(b)openSV(+b.getAttribute("data-d"))};
$("svS").onclick=function(){S.stories[curD]={img:curImg,note:$("svN").value};if(save()){toast("تم الحفظ ✓");$("sv").classList.remove("s");render()}};

var fiMode=null;
function shrink(file,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var m=720,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");
 c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.7))};im.onerror=function(){toast("الملف غير مدعوم، اختر صورة")};im.src=r.result};r.readAsDataURL(file)}
["fiCam","fiGal","fiBa"].forEach(function(id){$(id).onchange=function(){var f=this.files[0];fiMode=id==="fiBa"?"b":"s";this.value="";if(!f)return;shrink(f,function(u){
 if(fiMode==="s"){curImg=u;drawSV()}
 else{var l=prompt("وصف الصورة (مثال: البداية، الأسبوع 4)","")||"";S.ba.push({img:u,label:l,date:dkey()});save();renderArch()}})}});

var wkSel=1;
function renderArch(){
 var T=today();$("wk").innerHTML=Array.apply(null,Array(13)).map(function(_,i){return'<button data-w="'+(i+1)+'" class="'+(wkSel===i+1?'a':'')+'">الأسبوع '+(i+1)+'</button>'}).join("");
 var h='';for(var d=(wkSel-1)*7+1;d<=Math.min(90,wkSel*7);d++){var s=S.stories[d];
  h+='<button class="st '+(s?'has ':'')+(d>T?'lock':'')+'" data-d="'+d+'"><i style="'+(s&&s.img?'background-image:url('+s.img+')':'')+'">'+(s&&s.img?'':d)+'</i>يوم '+d+'</button>'}
 $("wdays").innerHTML=h;
 var b=S.ba;$("cmp").innerHTML=b.length>1?'<div class="cmp"><figure><img src="'+b[0].img+'" alt="">قبل'+(b[0].label?' — '+esc(b[0].label):'')+'</figure><figure><img src="'+b[b.length-1].img+'" alt="">بعد'+(b[b.length-1].label?' — '+esc(b[b.length-1].label):'')+'</figure></div>':'<p class="ph">أضف صورتين على الأقل لتظهر المقارنة بين البداية والآن.</p>';
 $("ba").innerHTML=b.map(function(x,i){return'<figure><img src="'+x.img+'" alt="">'+esc(x.label||x.date)+' <button data-rm="'+i+'" style="background:none;border:0;color:var(--mu);cursor:pointer">🗑️</button></figure>'}).join("")}
$("wk").onclick=function(ev){var w=ev.target.getAttribute("data-w");if(w){wkSel=+w;renderArch()}};
$("wdays").onclick=function(ev){var b=ev.target.closest(".st");if(b)openSV(+b.getAttribute("data-d"))};
$("ba").onclick=function(ev){var i=ev.target.getAttribute("data-rm");if(i!==null&&confirm("حذف الصورة؟")){S.ba.splice(+i,1);save();renderArch()}};

function tab(a){$("home").classList.toggle("hide",a!==1);$("archive").classList.toggle("hide",a!==2);$("n1").className=a===1?"a":"";$("n2").className=a===2?"a":""}
$("n1").onclick=function(){tab(1)};$("n2").onclick=function(){tab(2)};

// بدء تشغيل التطبيق وجلب البيانات من فايربيس
load();
