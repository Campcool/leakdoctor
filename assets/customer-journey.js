(function () {
  "use strict";
  const themes = [
    "aircon",
    "washer",
    "homeclean",
    "water-tank",
    "pipe-cleaning",
    "leak-repair",
  ];
  const theme = themes.find((t) =>
    document.body.classList.contains("ld-theme-" + t),
  );
  function addServiceEntry() {
    if (theme) {
      const serviceNames = {
        aircon: "冷氣清洗",
        washer: "洗衣機清洗",
        homeclean: "居家清潔",
        "water-tank": "水塔清洗",
        "pipe-cleaning": "水管清洗",
        "leak-repair": "漏水檢測與修補",
      };
      const first = document.querySelector("main>section");
      if (first) {
        const entry = document.createElement("section");
        entry.className = "ld-service-start";
        entry.setAttribute("aria-label", "服務詢價與預約步驟");
        entry.innerHTML =
          '<div><span class="ld-start-label">開始預約，先把需求整理好</span><h2>不用一次知道所有細節。</h2><p>先選服務、填地區與希望時段。設備照片到 LINE 再補充，核對草稿後才確認預約。</p><ol><li><b>1</b> 整理需求</li><li><b>2</b> LINE 傳送與補照片</li><li><b>3</b> 確認內容與檔期</li></ol></div><div class="ld-start-action"><button type="button">整理我的服務需求 →</button><small>固定項目依公開牌價；特殊機型與現場條件先評估。</small></div>';
        entry.querySelector("button").onclick = () => {
          window.ldOpenQuote(theme);
        };
        first.after(entry);
      }
    }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", addServiceEntry, {
      once: true,
    });
  else addServiceEntry();
  const form = document.getElementById("ld-q-form");
  if (!form || form.dataset.journey) return;
  form.dataset.journey = "1";
  const $ = (id) => document.getElementById(id);
  const subtitle = document.querySelector(".ld-q-sub");
  if (subtitle)
    subtitle.textContent =
      "三個步驟整理需求。先選服務，最後再留聯絡資料；確認內容後才安排施工。";
  const title = $("ld-q-title");
  if (title) title.textContent = "把需求說清楚，預約更省心";
  const progress = document.createElement("ol");
  progress.className = "ld-q-progress";
  progress.setAttribute("aria-label", "詢價步驟");
  const names = ["選擇服務", "地區與時間", "確認與聯絡"];
  names.forEach((name, i) => {
    const li = document.createElement("li");
    li.textContent = i + 1 + " " + name;
    progress.appendChild(li);
  });
  form.prepend(progress);
  const groups = names.map((name, i) => {
    const field = document.createElement("fieldset");
    field.className = "ld-q-step";
    field.dataset.step = i;
    const legend = document.createElement("legend");
    legend.textContent = name;
    field.appendChild(legend);
    progress.after(field);
    return field;
  });
  // Place sequentially; preserve the existing handlers, fields and optional detail controls.
  groups.forEach((g) => form.appendChild(g));
  [$("ld-f-service"), $("ld-detail-toggle"), $("ld-q-detail-section")]
    .filter(Boolean)
    .forEach((el) => groups[0].appendChild(el));
  [
    $("ld-f-addr"),
    $("ld-q-date").closest(".ld-q-field"),
    $("ld-q-note").closest(".ld-q-field"),
  ].forEach((el) => groups[1].appendChild(el));
  const checklist = document.createElement("div");
  checklist.className = "ld-q-prep";
  groups[1].appendChild(checklist);
  const summary = document.createElement("div");
  summary.className = "ld-q-summary";
  groups[2].appendChild(summary);
  [
    $("ld-f-name"),
    $("ld-f-phone"),
    ...form.querySelectorAll(".ld-q-privacy"),
    form.querySelector(".ld-q-submit"),
  ]
    .filter(Boolean)
    .forEach((el) => groups[2].appendChild(el));
  const controls = document.createElement("div");
  controls.className = "ld-q-step-controls";
  const back = document.createElement("button");
  back.type = "button";
  back.textContent = "← 上一步";
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "繼續 →";
  next.className = "ld-q-next";
  controls.append(back, next);
  form.appendChild(controls);
  form.appendChild($("ld-q-status"));
  form.appendChild(form.querySelector(".ld-q-note"));
  $("ld-q-date").setAttribute("aria-label", "希望服務日期");
  $("ld-q-time").setAttribute("aria-label", "希望服務時段");
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  $("ld-q-date").min = localDate;
  let step = 0;
  function show(value, focus) {
    step = value;
    groups.forEach((g, i) => (g.hidden = i !== step));
    Array.from(progress.children).forEach((el, i) => {
      el.setAttribute("aria-current", i === step ? "step" : "false");
      el.classList.toggle("done", i < step);
    });
    back.hidden = step === 0;
    next.hidden = step === 2;
    const service = $("ld-q-service").value;
    const prep = {
      冷氣清洗:
        "到 LINE 可補充：室內機與室外機照片、機型、台數，以及是否有漏水或異味。",
      洗衣機清洗:
        "到 LINE 可補充：正面及型號貼紙照片、直立或滾筒、是否含烘乾。",
      居家清潔:
        "到 LINE 可補充：清潔區域、坪數與現場照片；日常維護與深度清潔的安排不同。",
      水塔清洗: "到 LINE 可補充：水塔材質、容量、所在樓層與出入動線。",
      水管清洗: "到 LINE 可補充：住家或整棟、樓層與出水異常狀況。",
      漏水檢測與修補:
        "到 LINE 可補充：漏水位置照片、發生時間，以及晴天或雨天是否不同；先評估再報價。",
    };
    checklist.textContent =
      prep[service] ||
      "不知道機型或處理方式也可以，先描述現場狀況，之後再到 LINE 補充照片。";
    summary.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = service || "尚未選擇服務";
    const info = document.createElement("p");
    info.textContent = [
      $("ld-q-addr").value || "地區稍後補充",
      $("ld-q-date").value,
      $("ld-q-time").value,
    ]
      .filter(Boolean)
      .join(" · ");
    const note = document.createElement("small");
    note.textContent =
      "儲存需求 → LINE 按傳送 → 核對草稿並確認預約。實際價格與檔期依服務條件確認。";
    summary.append(strong, info, note);
    if (focus) {
      const el = groups[step].querySelector(
        "button,input:not([type=hidden]),select,textarea",
      );
      if (el) el.focus();
    }
  }
  function advance() {
    if (step === 0 && !$("ld-q-service").value) {
      $("ld-f-service").classList.add("ld-invalid");
      $("ld-f-service").querySelector("button").focus();
      return;
    }
    if (
      step === 1 &&
      $("ld-q-date").value &&
      $("ld-q-date").value < localDate
    ) {
      $("ld-q-status").textContent = "希望日期已過，請選擇未來日期或先留空。";
      $("ld-q-date").focus();
      return;
    }
    show(Math.min(2, step + 1), true);
    if (window.ldTrack)
      window.ldTrack("quote_step", {
        step: step + 1,
        service: $("ld-q-service").value,
        page: location.pathname,
      });
  }
  next.onclick = advance;
  back.onclick = () => show(Math.max(0, step - 1), true);
  form.addEventListener(
    "submit",
    function (e) {
      if (step < 2) {
        e.preventDefault();
        e.stopImmediatePropagation();
        advance();
      }
    },
    true,
  );
  function invalidateReceipt() {
    const submit = form.querySelector(".ld-q-submit");
    if (submit) delete submit.dataset.saved;
    const receipt = $("ld-q-receipt");
    if (receipt) receipt.remove();
    $("ld-q-status").textContent = "";
  }
  form.addEventListener("input", invalidateReceipt);
  form.addEventListener("change", function (e) {
    if (e.target.tagName === "SELECT") invalidateReceipt();
  });
  form.addEventListener("click", function (e) {
    if (e.target.closest(".ld-service-choice")) invalidateReceipt();
  });
  // Keep step 3 open when returning from LINE; reopening the same modal preserves its receipt.
  show(0, false);
})();
