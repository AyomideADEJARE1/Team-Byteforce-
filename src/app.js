const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[c],
  );
const STATUS = {
  sub: ["Submitted", "bl"],
  rev: ["In review", "wn"],
  asg: ["Assigned", "tl"],
  prg: ["In progress", "bl"],
  res: ["Resolved", "ok"],
  rej: ["Rejected", "dg"],
};
const PRIORITY = {
  low: ["Low", "bl"],
  med: ["Medium", "wn"],
  high: ["High", "dg"],
  urg: ["Urgent", "dg"],
};
const badge = (m, k) => `<span class="b ${m[k][1]}">${m[k][0]}</span>`;
const refNumber = (id) => "SL-2026-" + String(id).padStart(4, "0");
const CATEGORIES = [
  "Power & lighting",
  "Water & plumbing",
  "Road / walkway",
  "Waste / sanitation",
  "Facilities",
  "Safety & security",
];
const LOCATIONS = [
  "Library Road",
  "Hostel Block C",
  "Science Complex",
  "Student Centre",
  "North Gate",
  "Main Hall",
];
const DEPARTMENTS = [
  ["Facilities & Maintenance", "Facilities, repairs, campus infrastructure", "4 hrs", 14, 6],
  ["Electrical Services", "Lighting, power faults, electrical safety", "2 hrs", 8, 4],
  ["Water & Plumbing", "Leaks, water supply, drainage", "4 hrs", 5, 3],
  ["Sanitation", "Waste collection and cleanliness", "6 hrs", 9, 5],
  ["Campus Security", "Safety reports and security equipment", "Immediate", 4, 7],
];
const STAFF_NAMES = ["Chidi Okafor", "Amina Bello", "Tunde Adeyemi"];
/*
 * Incidents. Field names are short on purpose (they are saved to localStorage as-is):
 * t title, c category, l location, p priority (low|med|high|urg), s status (sub|rev|asg|prg|res|rej),
 * w "when" label, m reported by the signed-in student, d description, dist distance label,
 * ph has photo, dept assigned department, due due-date label.
 */
let incidents = [
  {
    id: 248,
    t: "Broken streetlight",
    c: "Power & lighting",
    l: "Library Road",
    p: "high",
    s: "rev",
    w: "12 min ago",
    m: 1,
    d: "The streetlight by the main library entrance has been off for three nights. The path gets very dark after evening classes.",
    dist: "120 m",
    ph: 1,
  },
  {
    id: 239,
    t: "Streetlight outage",
    c: "Power & lighting",
    l: "Library Road",
    p: "high",
    s: "rev",
    w: "53 min ago",
    d: "Lights are out near the library entrance after dark.",
    dist: "120 m",
  },
  {
    id: 234,
    t: "Water leakage",
    c: "Water & plumbing",
    l: "Hostel Block C",
    p: "med",
    s: "asg",
    w: "34 min ago",
    d: "Pipe leaking in the corridor.",
    dist: "240 m",
    dept: "Water & Plumbing",
    due: "Today",
  },
  {
    id: 230,
    t: "Damaged walkway",
    c: "Facilities",
    l: "Science Complex",
    p: "low",
    s: "prg",
    w: "2 days ago",
    m: 1,
    d: "Cracked tiles outside the lab entrance.",
    dist: "350 m",
    dept: "Facilities & Maintenance",
    due: "Tomorrow",
  },
  {
    id: 228,
    t: "Overflowing bin",
    c: "Waste / sanitation",
    l: "Student Centre",
    p: "med",
    s: "asg",
    w: "4 days ago",
    m: 1,
    d: "Bins by the food court are overflowing.",
    dist: "410 m",
    dept: "Sanitation",
    due: "Today",
  },
  {
    id: 225,
    t: "Faulty security light",
    c: "Power & lighting",
    l: "North Gate",
    p: "high",
    s: "prg",
    w: "3 hrs ago",
    d: "Security light flickers all night.",
    dist: "600 m",
    dept: "Electrical Services",
    due: "Today",
  },
  {
    id: 211,
    t: "Leaking water pipe",
    c: "Water & plumbing",
    l: "Hostel Block C",
    p: "med",
    s: "res",
    w: "Yesterday",
    m: 1,
    d: "Burst pipe in the bathroom.",
    dist: "240 m",
  },
];
/*
 * App state (not all of it is saved).
 * d = draft report {c category, d description, l location, ph photo name, diff "different issue", ac confirmed category}
 * f = admin queue filters {s status, c category, p priority, q text}
 * N = notifications {t title, x detail, w when, u unread}   pairs = duplicate review [newId, matchId, % similar]
 * aud = history log   err = form errors   mf/mq = my-reports filter/search   eq = explore search
 * rl/em = sign-in role/email   tab = settings tab   dsel/dp = department screen selection   last = newest incident id
 */
let state = {
  role: null,
  d: {
    c: "",
    d: "",
    l: "",
    ph: "",
    diff: 0,
  },
  busy: 0,
  f: {
    s: "",
    c: "",
    p: "",
    q: "",
  },
  pairs: [
    [248, 239, 82],
    [230, 225, 64],
    [234, 211, 51],
  ],
  aud: [],
  tab: "Departments",
  N: [
    {
      t: "Your report is under review",
      x: "SL-2026-0248 · Broken streetlight",
      w: "10 min ago",
      u: 1,
    },
    {
      t: "Your report was assigned",
      x: "SL-2026-0234 · Water leakage",
      w: "1 hour ago",
      u: 1,
    },
    {
      t: "Issue marked resolved",
      x: "SL-2026-0211 · Hostel Block C",
      w: "3 hours ago",
      u: 0,
    },
  ],
  err: {},
};
const findIncident = (id) => incidents.find((i) => i.id == id);
const saveDraft = () => {
  try {
    sessionStorage.setItem("sl-draft", JSON.stringify(state.d));
  } catch (e) {}
};
try {
  const d = sessionStorage.getItem("sl-draft");
  if (d) Object.assign(state.d, JSON.parse(d));
} catch (e) {}
const STORAGE_KEY = "sl-data-v1";
const saveData = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        I: incidents,
        N: state.N,
        aud: state.aud,
        pairs: state.pairs,
      }),
    );
  } catch (e) {}
};
const loadData = () => {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (d && d.I) {
      incidents.length = 0;
      incidents.push(...d.I);
      state.N = d.N;
      state.aud = d.aud;
      state.pairs = d.pairs;
    }
  } catch (e) {}
};
loadData();
addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY) return;
  loadData();
  if (!document.activeElement.matches("input,textarea,select")) {
    render.skipFocus = 1;
    render();
  }
});
function toast(m) {
  const t = document.getElementById("toast");
  t.textContent = m;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2800);
}
const goTo = (h) => {
  location.hash = h;
};
const LOGO = `<svg viewBox="0 0 72 72" width="38" height="38" aria-hidden="true"><path d="M42 12A20 20 0 1 0 46 52" fill="none" style="stroke:var(--h)" stroke-width="9" stroke-linecap="round"/><path d="M26 60A20 20 0 1 0 30 20" fill="none" stroke="#6D9DFF" stroke-width="9" stroke-linecap="round" transform="translate(6 -2)"/></svg>`;
/* Demo only: simple keyword rules standing in for a real AI model. */
const suggestFromText = (t) => {
  const x = (t || "").toLowerCase();
  let c = /light|power|electric|bulb/.test(x)
    ? CATEGORIES[0]
    : /water|leak|pipe|tap/.test(x)
      ? CATEGORIES[1]
      : /road|walk|pothole|tile/.test(x)
        ? CATEGORIES[2]
        : /bin|waste|trash|refuse|dirty/.test(x)
          ? CATEGORIES[3]
          : CATEGORIES[4];
  return {
    c,
    p: /dark|fire|flood|spark|unsafe|burst|night/.test(x) ? "high" : "med",
    sum: (t || "").split(/[.!?]/)[0].slice(0, 100),
  };
};

/* ---------- student ---------- */
const studentNav = (a) => `<nav class="bn" aria-label="Main"><div>${[
  ["home", "⌂", "Home"],
  ["mine", "☰", "My reports"],
  ["rep", "＋", "Report"],
  ["explore", "◎", "Explore"],
]
  .map(
    ([k, i, l]) =>
      `<button data-go="#/s/${k}" ${a === k ? "aria-current=page" : ""}><i>${i}</i>${l}</button>`,
  )
  .join("")}</div>
</nav>
`;
const studentHeader = (
  t,
  sub,
) => `<header class="row" style="cursor:default"><div style="display:flex;gap:10px;align-items:center">${LOGO}<div><b style="font:700 19px Manrope;color:var(--h)">${t}</b>${
  sub
    ? `<div class="s x">${sub}</div>
`
    : ""
}</div>
</div>
<button class="ic bl" data-go="#/s/prof" aria-label="Profile and settings" style="border:0;cursor:pointer">A</button></header>
`;
const backLink = (h, l) => `<button class="lnk" data-go="${h}">← ${l || "Back"}</button>`;
const STATUS_ICONS = {
  rev: ["wn", "↗"],
  res: ["ok", "✓"],
  prg: ["bl", "↗"],
  asg: ["tl", "↗"],
  sub: ["bl", "↗"],
  rej: ["dg", "✕"],
};
const reportCard = (
  i,
) => `<button class="card row" data-go="#/s/inc/${i.id}"><span class="ic ${STATUS_ICONS[i.s][0]}" aria-hidden="true">${STATUS_ICONS[i.s][1]}</span><div><b>${escapeHtml(i.t)}</b><div class="s x">${escapeHtml(i.l)} · ${i.w}</div>
</div>
${badge(STATUS, i.s)}</button>`;
const studentScreens = {
  home: () => `<div class="m">${studentHeader("SignalLoop", "From report to resolution")}<div><h1>Good morning, Azeez 👋</h1>
<p class="s">Help make your campus safer and better.</p>
</div>

<div class="hero"><h2>See a problem on campus?</h2>
<p>Tell us what happened. We’ll help route it to the right team.</p>
<button class="btn pri" data-go="#/s/rep">＋ Report an issue</button></div>

<div class="row" style="cursor:default"><h2>Your campus at a glance</h2>
<button class="lnk" data-go="#/s/explore">View all</button></div>

<div class="g2"><div class="card"><span class="ic tl" aria-hidden="true">◷</span><h1 style="margin-top:8px">${12 + incidents.filter((i) => i.s == "rev").length - 3}</h1>
<span class="s">Open reports</span></div>
<div class="card"><span class="ic ok" aria-hidden="true">✓</span><h1 style="margin-top:8px">${48 + incidents.filter((i) => i.s == "res").length - 1}</h1>
<span class="s">Resolved this month</span></div>
</div>

<div class="row" style="cursor:default"><h2>Recent updates</h2>
<button class="lnk" data-go="#/s/notes">See all</button></div>
${incidents
  .filter((i) => i.m)
  .slice(0, 3)
  .map((i) => reportCard(i))
  .join("")}${studentNav("home")}</div>
`,
  mine: () => {
    const f = state.mf || "all",
      l = incidents.filter(
        (i) =>
          i.m &&
          (f == "all" || (f == "prog" ? ["rev", "asg", "prg", "sub"].includes(i.s) : i.s == "res")),
      );
    return `<div class="m">${studentHeader("SignalLoop")}<div><h1>My reports</h1>
<p class="s">Track the issues you’ve reported.</p>
</div>

<input id="mq" placeholder="Search your reports" aria-label="Search your reports" value="${escapeHtml(state.mq || "")}"><div class="fl">${[
      ["all", "All"],
      ["prog", "In progress"],
      ["res", "Resolved"],
    ]
      .map(
        ([k, t]) =>
          `<button class="pill" data-act="mf" data-v="${k}" aria-pressed="${f == k}">${t}</button>`,
      )
      .join("")}</div>

<div id="ml" style="display:grid;gap:12px">${myReportsList()}</div>
<button class="btn pri" data-go="#/s/rep">＋ Report a new issue</button>${studentNav("mine")}</div>
`;
  },
  rep: () => {
    const d = state.d,
      e = state.err;
    return `<div class="m">${backLink("#/s/home")}<div><h1>Report an issue</h1>
<p class="s">Share what you noticed. You can use your voice.</p>
</div>
<div class="g2" style="grid-template-columns:repeat(3,1fr);gap:8px" aria-label="Step 1 of 3"><div class="bar"><i style="width:100%;background:var(--teal)"></i></div>
<div class="bar"></div>
<div class="bar"></div>
</div>

<h2>What kind of problem is it?</h2>
<div class="g2" role="group" aria-label="Category">${CATEGORIES.slice(0, 4)
      .map(
        (c) =>
          `<button class="chip" data-act="cat" data-v="${c}" aria-pressed="${d.c == c}">${c}</button>`,
      )
      .join("")}</div>
${
  e.c
    ? `<p class="err" role="alert">${e.c}</p>
`
    : ""
}
<h2>Describe what happened</h2>
<div class="card"><textarea id="desc" aria-label="Describe what happened" placeholder="E.g. The streetlight near the library has been off for three nights…" ${e.d ? 'aria-invalid="true"' : ""}>${escapeHtml(d.d)}</textarea><button class="btn tl" style="margin-top:10px" data-act="voice">🎙 Describe with voice</button><p class="s x" style="margin-top:6px">Voice is optional; you can edit the text afterwards.</p>
</div>
${
  e.d
    ? `<p class="err" role="alert">${e.d}</p>
`
    : ""
}
<h2>Where is it?</h2>
<select id="loc" aria-label="Campus location" ${e.l ? 'aria-invalid="true"' : ""}><option value="">Choose campus location</option>${LOCATIONS.map((l) => `<option ${d.l == l ? "selected" : ""}>${l}</option>`).join("")}</select>${
      e.l
        ? `<p class="err" role="alert">${e.l}</p>
`
        : ""
    }
<h2>Add a photo (optional)</h2>
<label style="all:unset;display:block"><span class="card" style="display:block;cursor:pointer;color:var(--tlT);font-weight:600">＋ ${d.ph ? escapeHtml(d.ph) : "Add photo or take a picture"}</span><input type="file" id="ph" accept="image/*" hidden></label>
<button class="btn pri" data-act="next">Continue →</button><p class="s x" style="text-align:center">Your details are only shared with the campus team handling this report.</p>
${studentNav("rep")}</div>
`;
  },
  rev: () => {
    const d = state.d,
      a = suggestFromText(d.d),
      c = d.ac || d.c || a.c,
      dup = d.l ? incidents.filter((i) => i.l == d.l && i.s != "res").slice(0, 1) : [];
    return `<div class="m">${backLink("#/s/rep")}<div><h1>Review your report</h1>
<p class="s">We’ve organised the details. Please check them before sending.</p>
</div>

<div class="ai"><b>✦ AI-assisted summary</b><p style="margin-top:6px">${escapeHtml(a.sum) || "No summary available"}.</p>
<p class="s x" style="margin-top:6px">Demo suggestion from simple keyword rules. You can change everything.</p>
</div>

<h2>Possible matching reports</h2>
<p class="s">Check whether someone has already reported this issue.</p>
${
  dup
    .map(
      (
        i,
      ) => `<div class="card"><b>${escapeHtml(i.t)} — ${escapeHtml(i.l)}</b><div class="s x">Reported ${i.w} · ${i.dist} away</div>
<div style="margin-top:8px">${badge(STATUS, i.s)}</div>
</div>
`,
    )
    .join("") || '<p class="s">No similar reports found nearby.</p>'
}
<button class="card row" data-act="diff" aria-pressed="${!!d.diff}"><span class="ic tl" aria-hidden="true">${d.diff ? "✓" : "＋"}</span><div>This is a different issue</div>
</button>
<h2>Suggested category</h2>
<div class="card row" style="cursor:default"><select id="ac" aria-label="Category" style="border:0;padding:0">${CATEGORIES.map((x) => `<option ${x == c ? "selected" : ""}>${x}</option>`).join("")}</select></div>
<p class="s x">AI suggestions can be changed. A campus team reviews your report.</p>

<button class="btn pri" data-act="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Submitting…" : "Submit report →"}</button><button class="lnk" style="width:100%" data-act="draft">Save as draft</button></div>
`;
  },
  conf: () => {
    const i = findIncident(state.last) || incidents[0];
    return `<div class="m" style="text-align:center"><div class="ic tl" style="width:120px;height:120px;margin:40px auto 0;font-size:48px" aria-hidden="true">✓</div>
<h1>Report submitted!</h1>
<p class="s">Thanks for helping improve your campus.</p>

<div class="card" style="text-align:left"><span class="s x">YOUR REFERENCE NUMBER</span><h1 style="margin:6px 0">${refNumber(i.id)}</h1>
<span class="s x">Keep this number to track progress.</span></div>

<div style="text-align:left"><h2>What happens next?</h2>
${[
  "Campus team reviews the details",
  "The report is assigned to a team",
  "You’ll get updates as it progresses",
]
  .map(
    (
      t,
      n,
    ) => `<p style="display:flex;gap:12px;align-items:center;margin-top:12px"><span class="ic bl" style="width:36px;height:36px">${n + 1}</span>${t}</p>
`,
  )
  .join("")}</div>

<button class="btn pri" data-go="#/s/inc/${i.id}">Track my report</button><button class="lnk" data-go="#/s/explore">Explore campus reports</button></div>
`;
  },
  inc: (a) => {
    const i = findIncident(a);
    if (!i) return studentScreens.mine();
    const steps = [
        ["Report received", "Your report was received by SignalLoop."],
        ["Under review", "Campus operations is checking the details."],
        [
          "Assigned to " + (i.dept || "maintenance"),
          i.dept ? "Work is being scheduled." : "We’ll notify you when a team is assigned.",
        ],
        ["Resolved", "The work is complete."],
      ],
      n = {
        sub: 1,
        rev: 2,
        asg: 3,
        prg: 3,
        res: 4,
        rej: 2,
      }[i.s];
    return `<div class="m">${backLink("#/s/mine", "My reports")}<h1>${escapeHtml(i.t)}</h1>
<div>${badge(STATUS, i.s)}</div>
<p class="s">${refNumber(i.id)} · Reported ${i.w}</p>

<div class="card row" style="cursor:default"><span class="ic tl" aria-hidden="true">⌖</span><div><b>${escapeHtml(i.l)}</b><div class="s">${escapeHtml(i.d).slice(0, 60)}</div>
</div>
</div>
<h2>Progress updates</h2>
<ol class="tl2">${steps
      .map(
        (
          s,
          k,
        ) => `<li><span class="ic" ${k < n ? "" : 'style="background:var(--bd);color:var(--t2)"'}>${k < n ? "✓" : "○"}</span><div><b>${s[0]}</b><div class="s x">${k < n ? "Done" : "Pending"}</div>
<div class="s">${s[1]}</div>
</div>
</li>
`,
      )
      .join("")}</ol>

<div class="ai"><b>Have more details to add?</b><br><button class="lnk" data-act="addup">Add update →</button></div>
${studentNav("mine")}</div>
`;
  },
  explore: () => `<div class="m">${studentHeader("Explore campus")}<div><h1>Campus reports</h1>
<p class="s">See what’s happening around your campus.</p>
</div>
<input id="eq" placeholder="Search by issue or location" aria-label="Search by issue or location" value="${escapeHtml(state.eq || "")}">
<div class="card" style="height:170px;position:relative;background:var(--tlS)" role="img" aria-label="Simplified campus map with three report markers"><span class="b" style="background:var(--sf);position:absolute;top:12px;left:12px">Map view</span>${[
    ["High", "#DC4C4C", 20, 40],
    ["Medium", "#F5A623", 45, 70],
    ["Low", "#16B8A6", 70, 35],
  ]
    .map(
      (m, n) =>
        `<span class="ic" style="position:absolute;left:${m[2]}%;top:${m[3]}%;width:36px;height:36px;background:${m[1]};color:#101D33">${n + 1}</span>`,
    )
    .join("")}</div>

<div class="row" style="cursor:default"><h2>Nearby reports</h2>
<span class="s">Sorted by distance</span></div>
<div id="el" style="display:grid;gap:12px">${exploreList()}</div>
${studentNav("explore")}</div>
`,
  notes:
    () => `<div class="m">${backLink("#/s/home")}<div class="row" style="cursor:default"><h1>Notifications</h1>
<button class="lnk" data-act="readall">Mark all as read</button></div>
${state.N.map(
  (
    n,
  ) => `<div class="card row" style="cursor:default"><span class="ic ${n.u ? "bl" : "ok"}" aria-hidden="true">${n.u ? "●" : "✓"}</span><div><b>${escapeHtml(n.t)}</b><div class="s x">${escapeHtml(n.x)}</div>
<div class="s x" style="margin-top:6px">${n.w}${n.u ? " · unread" : ""}</div>
</div>
</div>
`,
).join("")}<p class="s x">In-app updates only. Push and email delivery aren’t set up yet.</p>
${studentNav("home")}</div>
`,
  prof: () => `<div class="m">${backLink("#/s/home")}<h1>Profile &amp; settings</h1>
<div class="card row" style="cursor:default"><span class="ic bl" style="width:64px;height:64px;font-size:24px">A</span><div><h2>Azeez Shaibu</h2>
<div class="s">student@university.edu</div>
<span class="b tl">Student</span></div>
</div>
<p class="s x">PREFERENCES</p>
${[
  ["Personal information", "Name, email and campus"],
  ["Notifications", "Manage report update alerts"],
  ["Privacy & visibility", "Choose what other people see"],
  ["Language", "English · Nigerian Pidgin"],
  ["Help & support", "FAQs and contact information"],
]
  .map(
    ([
      a,
      b,
    ]) => `<button class="card row" data-act="soon" data-v="${a}"><div><b>${a.replace("&", "&amp;")}</b><div class="s x">${b.replace("&", "&amp;")}</div>
</div>
›</button>`,
  )
  .join(
    "",
  )}<button class="btn" style="color:var(--dgT);border:0;background:none" data-act="out">Sign out</button><p class="s x" style="text-align:center">SignalLoop · Version 1.0 (demo)</p>
<p class="s x" style="text-align:center">Not an emergency service. In an emergency contact campus security directly.</p>
${studentNav("home")}</div>
`,
};
const myReportsList = () => {
  const f = state.mf || "all",
    q = (state.mq || "").toLowerCase(),
    l = incidents.filter(
      (i) =>
        i.m &&
        (f == "all" || (f == "prog" ? i.s != "res" : i.s == "res")) &&
        (i.t + i.l).toLowerCase().includes(q),
    );
  return (
    l.map((i) => reportCard(i)).join("") ||
    '<div class="card s">No reports match. Try another filter or file a new report.</div>'
  );
};
const exploreList = () => {
  const q = (state.eq || "").toLowerCase(),
    l = incidents
      .filter((i) => i.s != "res" && (i.t + i.l).toLowerCase().includes(q))
      .sort((a, b) => parseInt(a.dist) - parseInt(b.dist));
  return (
    l
      .map(
        (
          i,
        ) => `<div class="card row" style="cursor:default"><div><b>${escapeHtml(i.t)}</b><div class="s x">${escapeHtml(i.l)} · ${i.dist}</div>
</div>
${badge(PRIORITY, i.p)}</div>
`,
      )
      .join("") || '<div class="card s">No reports found.</div>'
  );
};
const signInScreen =
  () => `<div class="au"><div style="background:var(--navy);color:#fff;text-align:center;padding:48px 20px"><div style="display:inline-block;background:#fff;border-radius:50%;padding:4px">${LOGO.replace('style="stroke:var(--h)"', 'stroke="#101D33"')}</div>
<div style="font:700 34px Manrope;margin-top:10px">SignalLoop</div>
<div style="color:#CBD5E1">From report to resolution</div>
</div>
<form class="m" id="si" novalidate style="padding-bottom:30px"><div><h1>Welcome back</h1>
<p class="s">Sign in to report and track campus issues.</p>
</div>

<div><label for="em">Email address</label><input id="em" type="email" autocomplete="username" placeholder="name@university.edu" value="${state.em || ""}"><div id="e1" class="err" role="alert"></div>
<label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password"><div id="e2" class="err" role="alert"></div>
</div>

<fieldset style="border:0;padding:0;margin:0"><legend class="s x">DEMO: CHOOSE A ROLE</legend><div class="fl"><button type="button" class="pill" data-act="role" data-v="s" aria-pressed="${state.rl != "a"}">Student</button><button type="button" class="pill" data-act="role" data-v="a" aria-pressed="${state.rl == "a"}">Campus admin</button></div>
</fieldset>

<button class="btn pri" type="submit">Sign in →</button><button type="button" class="btn" data-act="soon" data-v="University SSO">Continue with university SSO</button><p class="s x" style="text-align:center">Need access? Contact your campus administrator.<br>Demo build: no real authentication or server is connected.</p>
</form>
</div>
`;


const ADMIN_NAV = [
  ["ov", "Overview"],
  ["queue", "Incident queue"],
  ["dup", "Duplicate review"],
  ["dept", "Departments"],
  ["work", "Maintenance"],
  ["ana", "Analytics"],
  ["set", "Settings"],
];
const adminShell = (
  a,
  crumb,
  body,
) => `<div class="pg"><nav class="sb" aria-label="Main"><div class="lg">${LOGO.replace('style="stroke:var(--h)"', 'stroke="#fff"')}<div>SignalLoop<small>CAMPUS OPERATIONS</small></div>
</div>
${ADMIN_NAV.map(([k, t]) => `<button data-go="#/a/${k}" ${a == k ? "aria-current=page" : ""}>${t}</button>`).join("")}<button data-act="out" style="margin-top:auto">Sign out</button></nav>
<div class="mn"><div class="tb"><span class="s x">Campus operations / ${crumb}</span><div class="fl" style="flex-wrap:nowrap;align-items:center;justify-content:flex-end"><input id="gq" type="search" aria-label="Search incidents" placeholder="Search incidents…"><span class="ic bl" style="width:36px;height:36px">AO</span></div>
</div>
<main class="ct">${body}</main></div>
</div>
`;
const pageHeader = (t, s, btn) => `<div class="hd"><div><h1 tabindex="-1">${t}</h1>
<p class="s">${s}</p>
</div>
${btn || ""}</div>
`;
const statCard = (
  a,
  b,
  c,
  k,
) => `<div class="card"><span class="s">${a}</span><div class="row" style="cursor:default"><b>${b}</b><span class="x ${k || "s"}" style="font-weight:600">${c || ""}</span></div>
</div>
`;
const countByStatus = (s) => incidents.filter((i) => i.s == s).length;
const incidentTable = (
  l,
) => `<div class="tw"><table><thead><tr><th>Incident</th><th>Category</th><th>Location</th><th>Priority</th><th>Status</th><th>Reported</th></tr>
</thead><tbody>${
  l
    .map(
      (
        i,
      ) => `<tr data-go="#/a/triage/${i.id}" tabindex="0"><td><b>${escapeHtml(i.t)}</b></td><td class="s">${escapeHtml(i.c)}</td><td class="s">${escapeHtml(i.l)}</td><td>${badge(PRIORITY, i.p)}</td><td>${badge(STATUS, i.s)}</td><td class="s x">${i.w}</td></tr>
`,
    )
    .join("") || '<tr><td colspan="6" class="s">No incidents match these filters.</td></tr>'
}</tbody></table></div>
`;
const filteredQueue = () => {
  const f = state.f,
    q = f.q.toLowerCase();
  return incidents.filter(
    (i) =>
      (!f.s || i.s == f.s) &&
      (!f.c || i.c == f.c) &&
      (!f.p || i.p == f.p) &&
      (i.t + i.l).toLowerCase().includes(q),
  );
};
const selectField = (id, opts, v, ph) =>
  `<select id="${id}" aria-label="${ph || id}">${ph ? `<option value="">${ph}</option>` : ""}${opts.map((o) => `<option value="${o[0] ?? o}" ${(o[0] ?? o) == v ? "selected" : ""}>${o[1] ?? o}</option>`).join("")}</select>`;
const barRow = (
  l,
  p,
  c,
) => `<div style="margin-top:12px"><div class="row" style="cursor:default"><span>${l}</span><span class="s x">${p}</span></div>
<div class="bar"><i style="width:${typeof p == "number" ? Math.min(100, p * 1.2) : p}%;background:${c}"></i></div>
</div>
`;
const adminScreens = {
  ov: () =>
    adminShell(
      "ov",
      "Overview",
      pageHeader(
        "Good morning, Admin",
        "Here’s what’s happening across your campus today.",
        `<button class="btn pri fit" data-go="#/a/queue">＋ New incident</button>`,
      ) +
        `<div class="k">${statCard("Total reports", 241 + incidents.length, "+12.8%", "bl") + statCard("Awaiting review", 15 + countByStatus("rev"), "Needs action", "wn") + statCard("In progress", 32 + countByStatus("prg"), "5 teams", "tl") + statCard("Resolved this month", 195 + countByStatus("res"), "+8.4%", "ok")}</div>

<div class="cols"><div class="card"><div class="row" style="cursor:default"><div><h2>Incident activity</h2>
<span class="s x">Reports submitted vs. resolved</span></div>
<span class="b bl">Last 7 days</span></div>
<div class="ch" role="img" aria-label="Bar chart: Saturday highest" style="margin-top:14px">${[40, 55, 35, 70, 48, 85, 60].map((h, n) => `<i class="${n == 5 ? "on" : ""}" style="height:${h}%" title="${h}"></i>`).join("")}</div>
<div class="row s x" style="cursor:default;margin-top:6px">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("")}</div>
</div>

<div class="card"><h2>Reports by category</h2>
<span class="s x">Most common campus issues</span>${barRow("Facilities & repairs", 76, "var(--teal)") + barRow("Power & lighting", 58, "#6D9DFF") + barRow("Water & plumbing", 42, "#F5A623") + barRow("Safety & security", 29, "#DC4C4C")}</div>
</div>

<div class="card"><div class="row" style="cursor:default"><h2>Needs your attention</h2>
<button class="lnk" data-go="#/a/queue">View all incidents →</button></div>
${incidentTable(incidents.filter((i) => i.s == "rev").slice(0, 4))}</div>
`,
    ),
  queue: () =>
    adminShell(
      "queue",
      "Incident queue",
      pageHeader(
        "Incident queue",
        "Review, triage and route reports to the right campus team.",
        `<button class="btn pri fit" data-go="#/a/queue">＋ Add incident</button>`,
      ) +
        `<div class="k">${statCard("All reports", 241 + incidents.length, "Across campus", "tl") + statCard("Awaiting review", 15 + countByStatus("rev"), "Needs action", "wn") + statCard("High priority", incidents.filter((i) => i.p == "high").length + 4, "Urgent", "dg") + statCard("Unassigned", incidents.filter((i) => !i.dept && i.s != "res").length + 9, "Needs routing", "bl")}</div>

<div class="card"><div class="fl">${
          selectField(
            "fs",
            Object.entries(STATUS).map(([k, v]) => [k, v[0]]),
            state.f.s,
            "All statuses",
          ) +
          selectField("fc", CATEGORIES, state.f.c, "All categories") +
          selectField(
            "fp",
            Object.entries(PRIORITY).map(([k, v]) => [k, v[0]]),
            state.f.p,
            "Any priority",
          )
        }<input id="fq" placeholder="Search by title or location" aria-label="Search by title or location" value="${escapeHtml(state.f.q)}"></div>
<p class="s x" style="margin:12px 0" id="fn"></p>
<div id="qt">${incidentTable(filteredQueue())}</div>
</div>
`,
    ),
  triage: (a) => {
    const i = findIncident(a);
    if (!i) return adminScreens.queue();
    const ai = suggestFromText(i.d),
      dup = incidents.filter((x) => x.id != i.id && x.l == i.l && x.s != "res")[0],
      au = state.aud.filter((x) => x.id == i.id);
    return adminShell(
      "queue",
      "Incident queue / Incident detail",
      pageHeader(
        "Incident triage",
        "Review the report, confirm AI suggestions and assign the right response team.",
      ) +
        `<div class="row" style="cursor:default;justify-content:flex-start;flex-wrap:wrap">${badge(STATUS, i.s)}<span class="s">${refNumber(i.id)} · Submitted ${i.w}</span></div>

<div class="cols"><div style="display:grid;gap:18px"><div class="card"><h2>${escapeHtml(i.t)} near ${escapeHtml(i.l)}</h2>
<p class="s x" style="margin:4px 0 14px">Reported by Student · Location: ${escapeHtml(i.l)}</p>
<span class="s x">REPORT DESCRIPTION</span><p style="margin:6px 0 14px">${escapeHtml(i.d)}</p>
${i.ph ? '<span class="b bl">Photo attached</span>' : ""}</div>

${
  dup
    ? `<div class="card"><h2>Potential duplicate reports</h2>
<p class="s">1 report has a similar location and description.</p>
<div class="row" style="cursor:default;margin-top:10px"><b>${refNumber(dup.id)} · ${escapeHtml(dup.t)} · ${escapeHtml(dup.l)}</b></div>
<div class="row" style="cursor:default;margin-top:8px"><span class="b wn">82% similar</span><button class="lnk" data-go="#/a/dup">Review match →</button></div>
</div>
`
    : ""
}
${
  au.length
    ? `<div class="card"><h2>History</h2>
${au
  .map(
    (x) => `<p class="s" style="margin-top:8px">${x.m}</p>
`,
  )
  .join("")}</div>
`
    : ""
}</div>

<div style="display:grid;gap:18px;align-content:start"><div class="ai"><h2>✦ AI recommendations</h2>
<label>Suggested category (editable)</label>${selectField("tc", CATEGORIES, i.c)}<label>Suggested priority (editable)</label>${selectField(
          "tp",
          Object.entries(PRIORITY).map(([k, v]) => [k, v[0]]),
          i.p,
        )}<p class="s x" style="margin-top:10px">Suggestions are editable; confirm before assignment. Demo rule-based suggestion: ${ai.c}, ${PRIORITY[ai.p][0]}.</p>
</div>

<div class="card"><h2>Assignment</h2>
<label for="td">Department</label>${selectField(
          "td",
          DEPARTMENTS.map((d) => d[0]),
          i.dept,
          "Choose department",
        )}<label for="ta">Assignee</label>${selectField("ta", STAFF_NAMES, "", "Choose team member")}<div id="te" class="err" role="alert"></div>
<button class="btn pri" style="margin-top:14px" data-act="assign" data-v="${i.id}">Confirm assignment</button></div>
</div>
</div>
`,
    );
  },
  dup: () => {
    const p = state.pairs[0];
    const body = p
      ? (() => {
          const A = findIncident(p[0]),
            B = findIncident(p[1]);
          return `<span class="b wn fit" style="width:fit-content">${state.pairs.length} pair${state.pairs.length > 1 ? "s" : ""} awaiting review</span><div class="two">${[
            [A, "NEW REPORT", badge(PRIORITY, A.p)],
            [B, "POTENTIAL MATCH", `<span class="b wn">${p[2]}% similarity</span>`],
          ]
            .map(
              ([
                r,
                l,
                b,
              ]) => `<div class="card"><span class="s x">${l}</span><h2 style="margin:6px 0">${escapeHtml(r.t)}</h2>
<p class="s x">${escapeHtml(r.l)} · Reported ${r.w}</p>
<p style="margin:12px 0">${escapeHtml(r.d)}</p>
${b}</div>
`,
            )
            .join("")}</div>
<div class="ai"><b>✦ Why this was suggested</b><p style="margin-top:6px">Location and description overlap; confirm with a human review before linking.</p>
</div>
<div class="fl"><button class="btn pri" data-act="link">Link as duplicate</button><button class="btn" data-act="sep">Keep separate</button></div>
`;
        })()
      : `<div class="card s">All caught up. No duplicate pairs are waiting for review.</div>
`;
    return adminShell(
      "dup",
      "Duplicate review",
      pageHeader(
        "Duplicate review",
        "Compare similar reports before linking them into a single incident.",
      ) + body,
    );
  },
  dept: () => {
    const t = state.dsel
      ? findIncident(state.dsel)
      : incidents.find((i) => !i.dept && i.s != "res");
    return adminShell(
      "dept",
      "Departments",
      pageHeader(
        "Department assignment",
        "Route incidents to the team best placed to resolve them.",
      ) +
        `<div class="cols"><div class="card"><h2>Campus departments</h2>
<span class="s x">Current workload and available team members</span>${DEPARTMENTS.map(
          (
            d,
            n,
          ) => `<div class="row" style="cursor:default;border-top:1px solid var(--bd);padding:14px 0;margin-top:10px"><div><b>${d[0]}</b><div class="s x">${d[3]} active · ${d[4]} members</div>
</div>
${n == (t && t.c == "Power & lighting" ? 1 : 0) ? '<span class="b tl">Recommended</span>' : `<button class="b bl" style="border:0;cursor:pointer" data-act="pick" data-v="${d[0]}">Assign</button>`}</div>
`,
        ).join("")}</div>

<div style="display:grid;gap:18px;align-content:start">${
          t
            ? `<div class="ai"><span class="s x">SELECTED INCIDENT</span><h2 style="margin:6px 0">${escapeHtml(t.t)}</h2>
<p class="s">${escapeHtml(t.l)}</p>
<div style="margin:8px 0">${badge(PRIORITY, t.p)}</div>
<p>Electrical Services or Facilities & Maintenance may be suitable.</p>
</div>
<div class="card"><h2>Assign a team member</h2>
<label for="td">Choose department</label>${selectField(
                "td",
                DEPARTMENTS.map((d) => d[0]),
                state.dp || "",
              )}<label for="ta">Choose team member</label>${selectField("ta", STAFF_NAMES, "", "Select a person")}<label for="tdue">Set due date</label>${selectField("tdue", ["Today", "Tomorrow", "This week"], "Today")}<div id="te" class="err" role="alert"></div>
</div>
<button class="btn pri" data-act="assign" data-v="${t.id}">Save assignment</button>`
            : '<div class="card s">Every open incident is assigned.</div>'
        }</div>
</div>
`,
    );
  },
  work: () => {
    const l = incidents.filter((i) => i.dept && i.s != "res");
    return adminShell(
      "work",
      "Maintenance queue",
      pageHeader(
        "Maintenance work queue",
        "Work assigned to your team, with priority and due-date visibility.",
        `<button class="btn pri fit" ${l[0] ? `data-go="#/a/res/${l[0].id}"` : "disabled"}>＋ Add work update</button>`,
      ) +
        `<div class="k">${statCard("Assigned to my team", l.length + 21) + statCard("High priority", l.filter((i) => i.p == "high").length + 4) + statCard("Due today", l.filter((i) => i.due == "Today").length + 5) + statCard("Completed this week", 31 + countByStatus("res") - 1)}</div>
<div class="card"><h2>Assigned work</h2>
<span class="s x">Click a task to record progress or resolve it</span><div class="tw"><table><thead><tr><th>Task</th><th>Incident</th><th>Priority</th><th>Due</th><th>Status</th></tr>
</thead><tbody>${
          l
            .map(
              (
                i,
              ) => `<tr data-go="#/a/res/${i.id}" tabindex="0"><td><b>${escapeHtml(i.t)}</b></td><td class="s">${escapeHtml(i.l)}</td><td>${badge(PRIORITY, i.p)}</td><td class="s">${i.due || "—"}</td><td>${badge(STATUS, i.s)}</td></tr>
`,
            )
            .join("") || '<tr><td colspan="5" class="s">No open work assigned.</td></tr>'
        }</tbody></table></div>
<p class="s x" style="margin-top:12px">Offline sync isn’t implemented in this build; updates are saved only while connected.</p>
</div>
`,
    );
  },
  res: (a) => {
    const i = findIncident(a);
    if (!i) return adminScreens.work();
    return adminShell(
      "work",
      "Maintenance / Resolution",
      pageHeader(
        "Update resolution",
        "Record the work completed and notify the reporter with a clear status update.",
      ) +
        `<div class="cols"><div style="display:grid;gap:18px"><div class="card"><h2>${escapeHtml(i.t)}</h2>
<p class="s">${escapeHtml(i.l)} · Assigned to ${escapeHtml(i.dept || "—")}</p>
<div style="margin-top:8px">${badge(STATUS, i.s)}</div>
</div>
<div class="card"><h2>Resolution details</h2>
<label for="rn">Work completed</label><textarea id="rn" placeholder="Describe the work completed, parts replaced, and any follow-up needed."></textarea><div id="re" class="err" role="alert"></div>
<label>After photo (optional)</label><label style="all:unset;display:block"><span class="card" style="display:block;cursor:pointer" id="rp">＋ Attach a photo of the completed work</span><input type="file" accept="image/*" hidden></label><label style="display:flex;gap:10px;align-items:center;text-transform:none;font-size:14px;color:var(--tx);margin-top:16px"><input id="rm" type="checkbox" checked style="width:20px"> Send a resolution update to the reporter</label></div>
</div>

<div style="display:grid;gap:14px;align-content:start"><div class="ai"><h2>✓ Ready to resolve?</h2>
<p style="margin:10px 0">Once confirmed, the report will be marked resolved and the reporter will receive an update.</p>
<span class="s x">FINAL STATUS</span><div><span class="b ok">Resolved</span></div>
</div>
<button class="btn pri" data-act="resolve" data-v="${i.id}">Mark as resolved</button><button class="lnk" data-act="note" data-v="${i.id}">Save update without resolving</button></div>
</div>
`,
    );
  },
  ana: () =>
    adminShell(
      "ana",
      "Analytics",
      pageHeader(
        "Campus incident analytics",
        "Understand recurring problems, response times and resolution outcomes.",
        `<span class="b bl">Last 30 days</span>`,
      ) +
        `<div class="k">${statCard("Reports received", 684, "+14%", "ok") + statCard("Median first response", "2.4 hrs", "−18%", "ok") + statCard("Resolution rate", "86%", "+6%", "ok") + statCard("Overdue incidents", 12, "Needs action", "dg")}</div>
<div class="cols"><div class="card"><h2>Reports over time</h2>
<span class="s x">Submitted and resolved by week</span><div class="ch" role="img" aria-label="Weekly reports, peak in week 8" style="margin-top:14px">${[45, 60, 50, 75, 68, 90, 72, 100, 66, 85].map((h, n) => `<i class="${n == 7 ? "on" : ""}" style="height:${h}%"></i>`).join("")}</div>
</div>
<div class="card"><h2>Resolution by category</h2>
${[
  ["Facilities", 88, "var(--teal)"],
  ["Power & lighting", 81, "#6D9DFF"],
  ["Water & plumbing", 92, "#16A36A"],
  ["Sanitation", 74, "#F5A623"],
]
  .map(
    (
      c,
    ) => `<div style="margin-top:12px"><div class="row" style="cursor:default"><span>${c[0]}</span><span class="s x">${c[1]}%</span></div>
<div class="bar"><i style="width:${c[1]}%;background:${c[2]}"></i></div>
</div>
`,
  )
  .join("")}</div>
</div>
<div class="card"><h2>Insights to act on</h2>
<div class="k" style="margin-top:12px"><div class="ai"><b>Recurring location</b><p>Library Road has 18% more lighting reports than last month.</p>
</div>
<div class="wn" style="border-radius:18px;padding:16px"><b>Response bottleneck</b><p>Facilities has 12 overdue incidents requiring review.</p>
</div>
<div class="ok" style="border-radius:18px;padding:16px"><b>Positive trend</b><p>Water & plumbing resolution time improved by 22%.</p>
</div>
</div>
<p class="s x" style="margin-top:10px">Analytics figures are sample data in this demo.</p>
</div>
`,
    ),
  set: () =>
    adminShell(
      "set",
      "Settings",
      pageHeader(
        "Departments & system settings",
        "Manage routing rules, campus teams, report categories and service expectations.",
      ) +
        `<div class="fl" role="tablist">${["Departments", "Categories", "Priority rules", "Notifications"].map((t) => `<button class="pill" role="tab" data-act="tab" data-v="${t}" aria-pressed="${state.tab == t}">${t}</button>`).join("")}</div>
<div class="card">${
          state.tab == "Departments"
            ? `<div class="row" style="cursor:default"><div><h2>Department directory</h2>
<span class="s x">Set ownership, service hours and escalation routes.</span></div>
<button class="btn pri fit" data-act="soon" data-v="Add department">＋ Add department</button></div>
${DEPARTMENTS.map(
  (
    d,
  ) => `<div class="card row" style="cursor:default;margin-top:12px;border-radius:12px"><div><b>${d[0]}</b><div class="s x">${d[1]}</div>
</div>
<div><span class="s x">FIRST RESPONSE</span><br><b>${d[2]}</b></div>
<span class="b ok">Active</span><button class="lnk" data-act="soon" data-v="Editing">Edit →</button></div>
`,
).join("")}`
            : `<h2>${state.tab}</h2>
<p class="s" style="margin-top:8px">${state.tab == "Categories" ? CATEGORIES.join(" · ") : state.tab == "Priority rules" ? "Low, Medium, High and Urgent. Rule editing isn’t built yet." : "In-app notifications on status changes. Email and push aren’t configured."}</p>
`
        }</div>
<div class="ai">ⓘ AI can suggest a department, but administrators keep final control over assignment and escalation.</div>
`,
    ),
};

/* ---------- router ---------- */
function render() {
  saveData();
  const [, r, p, a] = location.hash.replace("#", "").split("/");
  const app = document.getElementById("app");
  if (!state.role && !r) {
    app.innerHTML = signInScreen();
    return;
  }
  if (r == "a") {
    state.role = "a";
    app.innerHTML = (adminScreens[p] || adminScreens.ov)(a);
  } else if (r == "s") {
    state.role = "s";
    app.innerHTML = (studentScreens[p] || studentScreens.home)(a);
  } else app.innerHTML = signInScreen();
  const h = app.querySelector("h1");
  if (h && !render.skipFocus) {
    h.setAttribute("tabindex", "-1");
    h.focus({
      preventScroll: true,
    });
  }
  render.skipFocus = 0;
  scrollTo(0, 0);
  const fn = document.getElementById("fn");
  if (fn) fn.textContent = `Showing ${filteredQueue().length} of ${241 + incidents.length} reports`;
}
addEventListener("hashchange", render);
const logUpdate = (i, m) => {
  state.aud.push({
    id: i.id,
    m: `${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })} · ${m}`,
  });
  if (i.m)
    state.N.unshift({
      t: m.includes("esolved") ? "Issue marked resolved" : "Your report was updated",
      x: refNumber(i.id) + " · " + i.t,
      w: "Just now",
      u: 1,
    });
};
const fieldValue = (id) => (document.getElementById(id) || {}).value;
/* Click handlers, looked up by the data-act attribute on the clicked element. */
const actions = {
  mf: (e) => {
    state.mf = e.dataset.v;
    render.skipFocus = 1;
    render();
  },
  cat: (e) => {
    state.d.c = e.dataset.v;
    state.err.c = "";
    saveDraft();
    render.skipFocus = 1;
    render();
  },
  voice: () => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) return toast("Voice input isn’t available in this browser. Please type instead.");
    const r = new R();
    r.onresult = (x) => {
      state.d.d = (fieldValue("desc") + " " + x.results[0][0].transcript).trim();
      saveDraft();
      render.skipFocus = 1;
      render();
    };
    r.onerror = () => toast("Couldn’t hear that. Please try again or type.");
    r.start();
    toast("Listening… you can edit the text afterwards.");
  },
  next: () => {
    state.d.d = fieldValue("desc");
    state.d.l = fieldValue("loc");
    const e = {};
    if (!state.d.c) e.c = "Please choose a category.";
    if (state.d.d.trim().length < 10) e.d = "Please describe the issue in at least 10 characters.";
    if (!state.d.l) e.l = "Please choose a campus location.";
    state.err = e;
    saveDraft();
    if (Object.keys(e).length) {
      render.skipFocus = 1;
      render();
      const x = document.querySelector(".err");
      x &&
        x.scrollIntoView({
          block: "center",
        });
      return;
    }
    state.d.ac = "";
    goTo("#/s/rev");
  },
  diff: () => {
    state.d.diff = !state.d.diff;
    render.skipFocus = 1;
    render();
  },
  draft: () => {
    state.d.ac = fieldValue("ac");
    saveDraft();
    toast("Draft saved on this device. It is not submitted yet.");
  },
  submit: () => {
    state.d.ac = fieldValue("ac");
    state.busy = 1;
    render.skipFocus = 1;
    render();
    setTimeout(() => {
      const id = Math.max(...incidents.map((i) => i.id)) + 1,
        a = suggestFromText(state.d.d);
      incidents.unshift({
        id,
        t: a.sum.slice(0, 40) || "New report",
        c: state.d.ac || state.d.c,
        l: state.d.l,
        p: a.p,
        s: "rev",
        w: "Just now",
        m: 1,
        d: state.d.d,
        dist: "0 m",
        ph: state.d.ph,
      });
      state.last = id;
      state.busy = 0;
      state.d = {
        c: "",
        d: "",
        l: "",
        ph: "",
        diff: 0,
      };
      saveDraft();
      goTo("#/s/conf");
    }, 900);
  },
  addup: () => toast("Adding updates to a report isn’t built yet."),
  readall: () => {
    state.N.forEach((n) => (n.u = 0));
    render.skipFocus = 1;
    render();
  },
  soon: (e) => toast(e.dataset.v + " isn’t available in this demo yet."),
  role: (e) => {
    state.rl = e.dataset.v;
    state.em = fieldValue("em");
    render.skipFocus = 1;
    render();
  },
  out: () => {
    state.role = null;
    goTo("#/");
  },
  assign: (e) => {
    const i = findIncident(e.dataset.v),
      d = fieldValue("td"),
      a = fieldValue("ta");
    if (!d || !a) {
      document.getElementById("te").textContent = "Choose a department and a team member first.";
      return;
    }
    if (document.getElementById("tc")) {
      i.c = fieldValue("tc");
      i.p = fieldValue("tp");
    }
    i.dept = d;
    i.s = "asg";
    i.due = fieldValue("tdue") || "Today";
    state.dsel = null;
    logUpdate(i, `Assigned to ${d} (${a}); priority ${PRIORITY[i.p][0]}`);
    toast("Assignment saved.");
    goTo("#/a/queue");
  },
  pick: (e) => {
    state.dp = e.dataset.v;
    render.skipFocus = 1;
    render();
  },
  link: () => {
    const p = state.pairs.shift(),
      b = findIncident(p[1]);
    logUpdate(findIncident(p[0]), `Linked as duplicate of ${refNumber(b.id)}`);
    toast("Reports linked. History preserved.");
    render.skipFocus = 1;
    render();
  },
  sep: () => {
    const p = state.pairs.shift();
    logUpdate(findIncident(p[0]), `Kept separate from ${refNumber(p[1])}`);
    toast("Kept as separate incidents.");
    render.skipFocus = 1;
    render();
  },
  tab: (e) => {
    state.tab = e.dataset.v;
    render.skipFocus = 1;
    render();
  },
  resolve: (e) => {
    const i = findIncident(e.dataset.v);
    if (fieldValue("rn").trim().length < 5) {
      document.getElementById("re").textContent =
        "Please describe the work completed before resolving.";
      return;
    }
    i.s = "res";
    i.w = "Just now";
    logUpdate(i, "Marked resolved: " + fieldValue("rn").trim().slice(0, 60));
    toast(
      document.getElementById("rm").checked ? "Resolved. Reporter updated in-app." : "Resolved.",
    );
    goTo("#/a/work");
  },
  note: (e) => {
    const i = findIncident(e.dataset.v);
    if (fieldValue("rn").trim().length < 3) {
      document.getElementById("re").textContent = "Add a progress note first.";
      return;
    }
    i.s = "prg";
    logUpdate(i, "Progress: " + fieldValue("rn").trim().slice(0, 60));
    toast("Update saved.");
    goTo("#/a/work");
  },
};

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-act]");
  if (a && actions[a.dataset.act]) {
    e.preventDefault();
    return actions[a.dataset.act](a);
  }
  const g = e.target.closest("[data-go]");
  if (g) goTo(g.dataset.go);
});
document.addEventListener("keydown", (e) => {
  if (e.key == "Enter" && e.target.matches("tr[data-go]")) goTo(e.target.dataset.go);
  if (e.key == "Enter" && e.target.id == "gq") {
    state.f.q = e.target.value;
    goTo("#/a/queue");
    render();
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id == "mq") {
    state.mq = t.value;
    document.getElementById("ml").innerHTML = myReportsList();
  } else if (t.id == "eq") {
    state.eq = t.value;
    document.getElementById("el").innerHTML = exploreList();
  } else if (t.id == "fq") {
    state.f.q = t.value;
    document.getElementById("qt").innerHTML = incidentTable(filteredQueue());
    document.getElementById("fn").textContent =
      `Showing ${filteredQueue().length} of ${241 + incidents.length} reports`;
  }
});
document.addEventListener("change", (e) => {
  const t = e.target,
    m = {
      fs: "s",
      fc: "c",
      fp: "p",
    }[t.id];
  if (m) {
    state.f[m] = t.value;
    document.getElementById("qt").innerHTML = incidentTable(filteredQueue());
    document.getElementById("fn").textContent =
      `Showing ${filteredQueue().length} of ${241 + incidents.length} reports`;
  } else if (t.id == "ph" && t.files[0]) {
    state.d.ph = t.files[0].name;
    saveDraft();
    render.skipFocus = 1;
    render();
  } else if (t.id == "td" && document.getElementById("tdue")) {
    state.dp = t.value;
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id != "si") return;
  e.preventDefault();
  const em = fieldValue("em").trim(),
    pw = fieldValue("pw");
  state.em = em;
  const a = !/^\S+@\S+\.\S+$/.test(em),
    b = !pw;
  document.getElementById("e1").textContent = a ? "Enter a valid email address." : "";
  document.getElementById("e2").textContent = b ? "Enter your password." : "";
  if (a || b) return;
  state.role = state.rl == "a" ? "a" : "s";
  goTo(state.role == "a" ? "#/a/ov" : "#/s/home");
});
render();
