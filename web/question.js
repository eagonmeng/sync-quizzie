async function fetchJSON(url, options) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const params = new URLSearchParams(location.search);
const activation = params.get("activation");
const quiz = params.get("quiz");

const USER_ID = localStorage.getItem("quizzie_user") || (localStorage.setItem("quizzie_user", crypto.randomUUID()), localStorage.getItem("quizzie_user"));

const main = document.getElementById("main");

function _makeOptionRow(letter, label, option, countText) {
  const row = document.createElement("div"); row.className = "option-row";
  const circle = document.createElement("span"); circle.className = "circle"; circle.onclick = async () => { await fetchJSON(`/api/activations/${activation}/choose`, { method: "POST", body: JSON.stringify({ option, user: USER_ID }) }); poll(); };
  const l = document.createElement("span"); l.textContent = letter;
  const t = document.createElement("span"); t.textContent = label;
  const c = document.createElement("span"); c.className = "muted"; c.textContent = countText || "";
  row.append(circle, l, t, c); return row;
}

async function poll() {
  if (activation) {
    const data = await fetchJSON(`/api/activations/${activation}`);
    renderQuestion(data, data.options, data.showResults);
  } else if (quiz) {
    const data = await fetchJSON(`/api/display/${quiz}`);
    main.innerHTML = "";
    const title = document.createElement("h2"); title.textContent = data.title; main.append(title);
    for (const q of data.questions) {
      const section = document.createElement("div"); section.className = "question";
      const h = document.createElement("div"); h.className = "text"; h.textContent = q.text; section.append(h);
      const list = document.createElement("div"); list.className = "options";
      q.options.forEach((o) => {
        const row = document.createElement("div"); row.className = "option-row";
        const circle = document.createElement("span"); circle.className = "circle"; circle.onclick = async () => { if (q.activation) await fetchJSON(`/api/activations/${q.activation}/choose`, { method: "POST", body: JSON.stringify({ option: o.option, user: USER_ID }) }); };
        const l = document.createElement("span"); l.textContent = o.letter;
        const t = document.createElement("span"); t.textContent = o.label;
        const c = document.createElement("span"); c.className = "muted"; c.textContent = `${o.count}/${o.total}`;
        row.append(circle, l, t, c); list.append(row);
      });
      section.append(list); main.append(section);
    }
  }
}

function renderQuestion(activationData, optionsData, showResults){
  main.innerHTML = "";
  const header = document.createElement("div");
  const h = document.createElement("h2"); h.textContent = activationData.question.text; header.append(h);
  // Right-aligned share panel with QR + base + URL
  const share = document.createElement("div"); share.className = "share-panel";
  const qr = document.createElement("img"); qr.className = "qr";
  const shareBaseInput = document.createElement("input"); shareBaseInput.type = "text"; shareBaseInput.placeholder = location.origin; shareBaseInput.value = (localStorage.getItem("quizzie_share_base") || location.origin);
  shareBaseInput.onchange = () => { const v = shareBaseInput.value.trim().replace(/\/$/, ""); localStorage.setItem("quizzie_share_base", v); poll(); };
  const updateQR = () => {
    const shareBase = (localStorage.getItem("quizzie_share_base") || location.origin).replace(/\/$/, "");
    const url = `${shareBase}/question.html?activation=${activation}`;
    qr.src = `/api/qr?url=${encodeURIComponent(url)}&format=svg`;
    urlText.textContent = url;
  };
  const baseRow = document.createElement("div"); baseRow.className = "row";
  const baseLbl = document.createElement("span"); baseLbl.className = "muted hint"; baseLbl.textContent = "Share base:";
  baseRow.append(baseLbl, shareBaseInput);
  const urlText = document.createElement("div"); urlText.className = "muted hint";
  share.append(qr, urlText, baseRow);
  header.append(share);
  updateQR();
  main.append(header);
  const options = document.createElement("div"); options.className = "options";
  optionsData.forEach((o) => {
    const row = document.createElement("div"); row.className = "option-row";
    const circle = document.createElement("span"); circle.className = "circle"; circle.onclick = async () => { await fetchJSON(`/api/activations/${activation}/choose`, { method: "POST", body: JSON.stringify({ option: o.option, user: USER_ID }) }); document.querySelectorAll('.option-row').forEach(el=>el.classList.remove('selected')); row.classList.add('selected'); poll(); };
    const l = document.createElement("span"); l.textContent = o.letter;
    const t = document.createElement("span"); t.textContent = o.label;
    const c = document.createElement("span"); c.className = "muted"; c.textContent = showResults ? `${o.count}/${o.total}` : "";
    row.append(circle, l, t, c); options.append(row);
  });
  main.append(options);

  // Navigation across questions of the same quiz
  if (activationData.quiz) {
    const nav = document.createElement("div"); nav.style.display = "flex"; nav.style.gap = "8px"; nav.style.marginTop = "12px";
    const prev = document.createElement("button"); prev.className = "btn"; prev.textContent = "Prev";
    const next = document.createElement("button"); next.className = "btn"; next.textContent = "Next";
    prev.onclick = () => navigateSibling(activationData.quiz, activationData.question.question, -1, !!showResults);
    next.onclick = () => navigateSibling(activationData.quiz, activationData.question.question, 1, !!showResults);
    nav.append(prev, next); main.append(nav);
  }
}

async function navigateSibling(quizId, currentQuestionId, delta, shouldShowResults){
  const data = await fetchJSON(`/api/display/${quizId}`);
  const idx = data.questions.findIndex(q => q.question === currentQuestionId);
  if (idx === -1) return;
  const target = data.questions[(idx + data.questions.length + delta) % data.questions.length];
  let actId = target.activation;
  if (!actId){
    // auto-activate target question so it can accept votes
    const resp = await fetchJSON(`/api/questions/${target.question}/activate`, { method: "POST" });
    actId = (resp && (resp.activation?.activation || resp.activation || resp.id || resp.Activation || resp.Activate)) || undefined;
  }
  if (!actId) return;
  if (shouldShowResults) {
    await fetchJSON(`/api/activations/${actId}/show`, { method: "POST" });
  }
  location.href = `/question.html?activation=${actId}`;
}

async function load() {
  await poll();
}

load();


