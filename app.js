:root {
  --bg: #0f0b1a;
  --card: #2a1650;
  --card2: #3b1f73;
  --ac: #a855f7;
  --tx: #f3eefc;
  --mu: #a99bc9;
  --ok: #34d399;
  --no: #f87171;
  --bd: #4c2b8f;
  color-scheme: dark;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--tx);
  font-family: "Segoe UI", Tahoma, Arial, sans-serif;
  min-height: 100vh;
  padding-bottom: 90px;
}

.wrap {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px;
}

h1 {
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  color: var(--tx);
}

/* حلقة التقدم */
.ring {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: conic-gradient(var(--ac) calc(var(--p, 0) * 1%), var(--card) 0);
}

.ring div {
  width: 122px;
  height: 122px;
  border-radius: 50%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.ring b {
  font-size: 32px;
  line-height: 1;
}

.ring span {
  font-size: 12px;
  color: var(--mu);
  margin-top: 4px;
}

/* الستوريات */
.stories {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 6px 4px 16px;
  margin-bottom: 10px;
  align-items: center;
}

.st {
  flex: none;
  width: 64px;
  text-align: center;
  font-size: 11px;
  color: var(--mu);
  cursor: pointer;
  background: none;
  border: 0;
  font-family: inherit;
}

.st i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--bd);
  background: var(--card) center/cover no-repeat;
  font-style: normal;
  font-size: 20px;
  margin-bottom: 4px;
  color: var(--tx);
}

.st.has i {
  border-color: var(--ac);
}

.st.today i {
  border-style: dashed;
  border-color: var(--ok);
}

.st.add-story i {
  border-style: dotted;
  border-color: var(--mu);
  font-size: 28px;
  color: var(--ac);
}

/* العناوين والأزرار */
.hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 12px;
}

.hd h2 {
  font-size: 18px;
  color: var(--tx);
}

.btn {
  background: var(--ac);
  color: #fff;
  border: 0;
  border-radius: 12px;
  padding: 10px 16px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.btn.g {
  background: var(--card2);
}

.pct {
  color: var(--mu);
  font-size: 13px;
  margin-bottom: 6px;
}

.bar {
  height: 8px;
  background: var(--card);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.bar div {
  height: 100%;
  background: var(--ac);
  width: 0;
  transition: width 0.3s;
}

/* قائمة التحديات */
.grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tk {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(145deg, var(--card2), var(--card));
  border: 2px solid var(--bd);
  border-radius: 16px;
  padding: 14px 16px;
  gap: 12px;
  transition: border-color 0.2s;
}

.tk.success {
  border-color: var(--ok);
}

.tk.fail {
  border-color: var(--no);
}

.tk-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.tk .e {
  font-size: 28px;
}

.tk .n {
  font-size: 15px;
  font-weight: 600;
  color: var(--tx);
  word-break: break-word;
}

.tk-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.act-btn {
  background: var(--bg);
  border: 1px solid var(--bd);
  color: var(--mu);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.act-btn.success-btn.active {
  background: var(--ok);
  color: #052e1d;
  border-color: var(--ok);
  font-weight: bold;
}

.act-btn.fail-btn.active {
  background: var(--no);
  color: #450a0a;
  border-color: var(--no);
  font-weight: bold;
}

.tool-ic {
  background: none;
  border: 0;
  color: var(--mu);
  font-size: 15px;
  cursor: pointer;
  padding: 6px;
}

/* بطاقة مكافأة الأسبوع */
.reward-box {
  background: linear-gradient(145deg, #251346, #1a0d33);
  border: 1px solid var(--bd);
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.reward-box.unlocked {
  border-color: var(--ok);
  box-shadow: 0 0 15px rgba(52, 211, 153, 0.12);
}

/* شريط التنقل السفلي */
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #1a1130;
  border-top: 1px solid var(--bd);
  z-index: 10;
}

.nav button {
  flex: 1;
  background: none;
  border: 0;
  color: var(--mu);
  padding: 14px 0;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.nav button.a {
  color: #fff;
  font-weight: 700;
  box-shadow: inset 0 3px var(--ac);
}

/* الأرشيف */
.wk {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 14px;
}

.wk button {
  flex: none;
  background: var(--card);
  color: var(--tx);
  border: 0;
  border-radius: 20px;
  padding: 8px 14px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.wk button.a {
  background: var(--ac);
}

.days {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* النوافذ المنبثقة */
.ov {
  position: fixed;
  inset: 0;
  background: rgba(5, 2, 12, 0.85);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 16px;
}

.ov.s {
  display: flex;
}

.md {
  background: #1c1233;
  border: 1px solid var(--bd);
  border-radius: 18px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
}

.md h3 {
  margin-bottom: 14px;
  font-size: 18px;
}

input[type=text], textarea, select {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: 10px;
  color: var(--tx);
  padding: 12px;
  font: inherit;
  font-size: 15px;
  outline: none;
  margin-top: 4px;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

.emo {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.emo button {
  font-size: 22px;
  background: var(--card);
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}

.emo button.a {
  border-color: var(--ac);
}

.row {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.row .btn {
  flex: 1;
}

/* شاشة الستوري */
.sv {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 30;
  display: none;
  flex-direction: column;
}

.sv.s {
  display: flex;
}

.sv .top {
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.sv .mid {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 10px;
  position: relative;
}

.sv .mid img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  object-fit: contain;
}

.sv .note-box {
  position: absolute;
  bottom: 20px;
  background: rgba(0,0,0,0.7);
  padding: 10px 16px;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  max-width: 80%;
  text-align: center;
}

.sv .bot {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sv .x {
  background: none;
  border: 0;
  color: #fff;
  font-size: 26px;
  cursor: pointer;
}

.ph {
  color: var(--mu);
  text-align: center;
}

.ba {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.ba figure {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: var(--mu);
}

.ba img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  background: var(--card);
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 13px;
  display: none;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.hide {
  display: none !important;
}

.fin {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}
