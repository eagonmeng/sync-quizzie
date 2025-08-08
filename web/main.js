async function fetchJSON(url, options) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function load() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  const quizzes = await fetchJSON("/api/quizzes");
  (quizzes || []).forEach((q) => {
    const row = document.createElement("div");
    row.className = "quiz-row";
    const del = document.createElement("span");
    del.className = "trash"; del.textContent = "🗑️";
    del.onclick = async () => { await fetchJSON(`/api/quizzes/${q.quiz}`, { method: "DELETE" }); load(); };
    const a = document.createElement("a"); a.href = `/quiz.html?quiz=${q.quiz}`; a.textContent = q.title; a.style.fontSize = "20px";
    row.append(del, a);
    main.append(row);
  });

  const addRow = document.createElement("div"); addRow.className = "quiz-row";
  const plus = document.createElement("button"); plus.className = "btn"; plus.textContent = "+";
  const input = document.createElement("input"); input.type = "text"; input.placeholder = "enter name of new quiz";
  const add = async () => {
    const title = input.value.trim();
    if (!title) return;
    await fetchJSON("/api/quizzes", { method: "POST", body: JSON.stringify({ title }) });
    input.value = "";
    load();
  };
  plus.onclick = add;
  input.onkeydown = (e) => { if (e.key === "Enter") add(); };
  addRow.append(plus, input); main.append(addRow);

  if (!quizzes || quizzes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No quizzes yet. Enter a name and press + to create your first quiz.";
    main.append(empty);
  }
}

load();


