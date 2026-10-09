function _1(md){return(
md`# Politigraph`
)}

function _2(md){return(
md`Data from  [https://politigraph.wevis.info/docs](https://politigraph.wevis.info/docs)`
)}

function _motionEvent1(__query,FileAttachment,invalidation){return(
__query(FileAttachment("parliament_trans.csv"),{from:{table:"parliament_votes_en_2023_2025_light"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

function _4(md){return(
md`## Visualization Here`
)}

function _creatorFilter(Inputs,creators,ALL){return(
Inputs.select(creators, {
  label: "พรรคผู้เสนอญัตติ",
  value: ALL,
  format: d => d === ALL ? "— ทั้งหมด —" : d
})
)}

function _categoryFilter(Inputs,pre){return(
Inputs.checkbox(pre.categories, {
  label: "เลือกหมวดญัตติ (เลือกหลายค่าได้)",
  value: []  // ยังไม่เลือก = แสดงทั้งหมด
})
)}

function _chart(d3,motions_fast,data_view)
{
  // ===== helpers & sources =====
  const sameDay = (a,b)=>d3.timeDay.floor(a).getTime()===d3.timeDay.floor(b).getTime();
  const M = motions_fast;          // ✅ summary แบบเร็ว (มติ)
  const DATA = data_view;          // ✅ ดาต้าดิบหลังกรอง ใช้ตอน tooltip/panel/stacked bar

  // ===== layout =====
  const TITLE_H = 10;              // ความสูงพื้นที่หัวกราฟ
  const W = 1000, H = 780;
  const margin = { top: 60 + TITLE_H, right: 20, bottom: 30, left: 60 };

  // ===== font & anim =====
  const FONT_FAMILY = "'IBM Plex Sans Thai', 'Sarabun', system-ui, sans-serif";
  const T = 280, E = 'cubic-bezier(.2,.7,.1,1)';

  // ===== scales =====
  const years = [...new Set(M.map(d=>d.year))].sort((a,b)=>d3.descending(a,b));
  const x = d3.scaleBand().domain(years).range([margin.left, W-margin.right]).padding(0.25);
  const maxDoy = d3.max(M, d=>d.dayOfYear) ?? 366;
  const y = d3.scaleLinear().domain([1, maxDoy]).range([H - margin.bottom, margin.top]);
  const rMotion = () => 10;

  // ===== colors =====
  const NEON_GREEN="#2a5f9e", NEON_RED="#b23a2e", GRAY="#bcbcb6";
  const PURPLE_GRAY="#555555", DARK_GRAY="#e6e6e2";
  const colorVoteTH = v => ({
    "เห็นด้วย": NEON_GREEN,
    "ไม่เห็นด้วย": NEON_RED,
    "งดออกเสียง": GRAY,
    "ไม่ลงคะแนนเสียง": PURPLE_GRAY,
    "ลา / ขาดลงมติ": DARK_GRAY
  }[v] || GRAY);
  
  const colorNormal = d => d.motion_result === "ผ่าน" ? NEON_GREEN : NEON_RED;

  // ===== pre-position nodes =====
  M.forEach(d => { d.tx = x(d.year) + x.bandwidth()/2; d.ty = y(d.dayOfYear); d.x = d.tx; d.y = d.ty; });

  // ===== container =====
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.width = W + "px";
  container.style.height = H + "px";
  container.style.overflow = "hidden";
  container.style.fontFamily = FONT_FAMILY;

  // ===== SVG =====
  const svg = d3.create("svg")
    .attr("viewBox", [0,0,W,H])
    .style("position","absolute")
    .style("inset","0")
    .style("z-index","0")
    .style("transition","transform 400ms ease")
    .style("font-family", FONT_FAMILY);

  svg.append("rect").attr("fill","#ffffff").attr("width",W).attr("height",H)
    .on("click", () => resetAll());

  // ===== axes grid =====
  svg.append("g").attr("stroke","#ececea").attr("stroke-opacity",1)
    .selectAll("line").data(d3.range(1, maxDoy, 14)).join("line")
      .attr("x1", margin.left).attr("x2", W - margin.right)
      .attr("y1", d=>y(d)).attr("y2", d=>y(d));

  // Axes
  const xAxis = g => g.attr("transform", `translate(0,${margin.top - 20})`)
    .call(d3.axisTop(x).tickSizeOuter(0))
    .call(g=>g.selectAll("text").attr("fill","#333333").style("font-size","13px").style("font-weight",600))
    .call(g=>g.selectAll(".domain").attr("stroke","#bdbdb8").attr("opacity",1))
    .call(g=>g.selectAll(".tick line").attr("stroke","#bdbdb8").attr("opacity",1));

  const yearRef = years[0] ?? new Date().getFullYear();
  const months = d3.timeMonths(new Date(yearRef,0,1), new Date(yearRef+1,0,1));
  const ticks = months.map(d => ({doy: d3.timeDay.count(d3.timeYear(d), d)+1, label: d3.timeFormat("%m-%d")(d)}));
  ticks.push({doy: d3.timeDay.count(new Date(yearRef,0,1), new Date(yearRef,11,31))+1, label: "12-31"});

  const yAxis = g => g.attr("transform", `translate(${margin.left - 10},0)`)
    .call(d3.axisLeft(d3.scalePoint().domain(ticks.map(t=>t.doy)).range([H - margin.bottom, margin.top]))
      .tickFormat((_,i)=>ticks[i]?.label ?? "").tickSize(0))
    .call(g=>g.selectAll("text").attr("fill","#555555").style("font-size","11px"))
    .call(g=>g.selectAll(".domain").remove());

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);

  // ===== defs (soft halo glow + font enforce) =====
  const defs = svg.append("defs");
  // glow when hover
  defs.append("filter")
    .attr("id","softGlow")
    .attr("filterUnits","userSpaceOnUse")
    .attr("x",-1000)
    .attr("y",-1000)
    .attr("width",1700)
    .attr("height",1700)
    .append("feGaussianBlur")
      .attr("in","SourceGraphic")
      .attr("stdDeviation",10);
  defs.append("style").text(`text, .tick text, .pname, .value { font-family: ${FONT_FAMILY}; }`);

  // permanent glow separated by each color
  function makeGlowFilter(id, color) {
  const f = defs.append("filter")
    .attr("id", id)
    .attr("x", "-40%").attr("y", "-40%")
    .attr("width", "200%").attr("height", "200%");
  
  f.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 4)
    .attr("result", "blur");

  f.append("feFlood")
    .attr("flood-color", color)
    .attr("result", "flood");

  f.append("feComposite")
    .attr("in", "flood")
    .attr("in2", "blur")
    .attr("operator", "in")
    .attr("result", "glowColor");

  const merge = f.append("feMerge");
  merge.append("feMergeNode").attr("in", "glowColor");
  merge.append("feMergeNode").attr("in", "SourceGraphic");
  }

  makeGlowFilter("greenGlow", "#4bde65"); // pass
  makeGlowFilter("redGlow", "#f27c7c"); // not pass
  
  // pulse when hovering
svg.append("style").text(`
  @keyframes pulseGlow {
    0%, 100% { stroke-width: 2px; }
    50%      { stroke-width: 7px; }
  }

  circle.motion.pulse-glow {
    animation: pulseGlow 1.8s ease-in-out infinite;
    stroke: currentColor; stroke-opacity: .25;
    transform-origin: center;
  }
`);

  
  // ===== title =====
  svg.append("text")
    .attr("x", W/2)
    .attr("y", margin.top - TITLE_H - 15)
    .attr("text-anchor","middle")
    .attr("fill","#cee8ff")
    .attr("font-size",26)
    .attr("font-weight",700)
    .text("");

  // ===== legend (เลื่อนขึ้นลงปรับ yOffset ได้) =====
  const legendYOffset = -10; // ปรับตรงนี้ได้ (+ ลง, - ขึ้น)
  const legend = svg.append("g").attr("transform", `translate(${W - 190}, ${margin.top - 50 + legendYOffset})`);
  [["มติผ่าน",NEON_GREEN],["มติไม่ผ่าน",NEON_RED]].forEach((d,i)=>{
    const g = legend.append("g").attr("transform", `translate(${i*95},0)`);
    g.append("circle").attr("r",5).attr("fill",d[1]).attr("cy",-4);
    g.append("text").attr("x",10).attr("y",2).text(d[0]).attr("font-size",12).attr("fill","#333333");
  });

  // ===== layers =====
  const gMain = svg.append("g");
  const gHalo = svg.append("g").attr("class","halo-layer").attr("pointer-events","none"); // 👈 ฮาโล่
  const overlay = svg.append("g");

  // ===== tooltip (ลอยบนสุด) =====
  const tip = d3.select(document.body).append("div")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("background", "#ffffff").style("border", "1px solid #dcdcd8")
    .style("color", "#111111")
    .style("padding", "10px 14px")
    .style("border-radius", "4px")
    .style("line-height", "1.45")
    .style("font-family", FONT_FAMILY)
    .style("font-size", "12px")
    .style("z-index", "9999")
    .style("box-shadow", "0 8px 28px rgba(0,0,0,0.12)")
    .style("max-width", "320px");

  // ===== hint =====
  const hint = svg.append("g").attr("pointer-events","none").attr("opacity",1).attr("transform",`translate(${W/2},${H/2})`);
  hint.append("rect")
    .attr("x",-170).attr("y",-24).attr("rx",3).attr("ry",3)
    .attr("width",340).attr("height",48)
    .attr("fill","rgba(17,17,17,0.86)");
  hint.append("text").attr("text-anchor","middle").attr("fill","#ffffff").attr("font-size",13).attr("y",4)
    .text("คลิกที่จุดญัตติเพื่อซูม • คลิกพื้นหลังเพื่อรีเซ็ต");
  const dismissHint = () => hint.interrupt().transition().duration(400).attr("opacity",0).remove();
  svg.on("mousedown.hint", dismissHint);
  svg.on("wheel.hint", dismissHint, {passive:true});
  hint.transition().delay(2200).duration(1000).attr("opacity",0).remove();

  // ===== state =====
  let focusedMotion = null;
  let isPanelOpen = false;
  let lastSegments = null;
  let barSvg = null;
  let isBarLocked = false;

  // ===== panel =====
  const panel = document.createElement("div");
  panel.style.position="absolute";
  panel.style.top="0";
  panel.style.right="0";
  panel.style.height=H+"px";
  panel.style.width="360px";
  panel.style.background="#ffffff";
  panel.style.color="#111111";
  panel.style.padding="24px 22px";
  panel.style.overflow="auto";
  panel.style.backdropFilter="blur(6px)";
  panel.style.transition=`transform ${T}ms ${E}`;
  panel.style.transform="translateX(110%)";
  panel.style.zIndex = "20";
  panel.style.willChange = "transform";
  panel.style.fontFamily = FONT_FAMILY;

  // ===== bottomBar (stacked bar host) =====
  const bottomBar = document.createElement("div");
  bottomBar.style.position = "absolute";
  bottomBar.style.left = "20px";
  bottomBar.style.right = "20px";
  bottomBar.style.bottom = "12px";
  bottomBar.style.pointerEvents = "none";
  bottomBar.style.zIndex = "30"; // ✅ สูงกว่า SVG/overlay
  bottomBar.style.transition = `right ${T}ms ${E}`;
  bottomBar.style.fontFamily = FONT_FAMILY;

  container.appendChild(svg.node());
  container.appendChild(panel);
  container.appendChild(bottomBar);

  // ===== nodes (Motion) — hover glow เป็นวงกลมฮาโล่ =====
  function updateNodeCursor() { nodes.style("cursor", focusedMotion ? "default" : "zoom-in"); }

  let haloEl = null; // 👈 reuse ฮาโล่
  let hoverTimeout = null;

  const nodes = gMain.selectAll("circle.motion").data(M).join("circle")
    .attr("class","motion")
    .attr("fill", d => colorNormal(d))
    .attr("color", d => d.motion_result === "ผ่าน" ? NEON_GREEN : NEON_RED)
    .attr("r", rMotion())
    .attr("stroke", "#ffffff").attr("stroke-width", 2)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("filter", d => 
    null
  ) // permanent glow
    .style("cursor","zoom-in")
    .on("mouseenter", function(e, d) {
      if (focusedMotion && d !== focusedMotion) return;
      if (d.timeoutId) { clearTimeout(d.timeoutId); d.timeoutId = null; }
  d3.select(this).classed("pulse-glow", true); // start pulsing ถ้ามี timeout ค้างอยู่ ให้ยกเลิก

      // ---- คำนวณค่าจาก DATA สำหรับ tooltip ----
      const rowsThisMotion = DATA.filter(r =>
        r.motion === d.motion_name && sameDay(new Date(r.start_date), d.date)
      );

      // จำนวนพรรคที่ลงมติ (นับ unique voter_party ที่มีในมตินี้ ไม่สน option)
      const partyCount = new Set(rowsThisMotion.map(r => r.voter_party)).size;

      // จำนวนผู้เข้าประชุม = นับทุกคนยกเว้น option = "ลา / ขาดลงมติ"
      const attendees = rowsThisMotion.filter(r => r.voter_option !== "ลา / ขาดลงมติ").length;

      const fDate = d3.timeFormat("%Y-%m-%d");
      const resultText = d.motion_result === "ผ่าน" ? "ผ่านเสียงส่วนมาก" : "ไม่ผ่านเสียงส่วนมาก";

      const html = `
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;">${d.motion_name}</div>
        <div>วันที่ลงมติ : <span style="opacity:.9">${fDate(d.date)}</span></div>
        <div>สถานะมติ : <b style="color:${d.motion_result === "ผ่าน" ? NEON_GREEN : NEON_RED};">${resultText}</b></div>
        <div>จำนวนพรรคที่ลงมติ : <b>${partyCount.toLocaleString()}</b></div>
        <div>จำนวนผู้เข้าประชุม : <b>${attendees.toLocaleString()}</b></div>
      `;
      tip.html(html).style("display","block");

      // ---- วาดฮาโล่วงกลม (blur) ----
      const haloColor = d.motion_result === "ผ่าน" ? NEON_GREEN : NEON_RED;
      const r0 = rMotion(d) || 10;

      if (!haloEl) {
        haloEl = gMain.append("circle")
          .attr("class", "motion-halo")
          .attr("pointer-events","none")
          .attr("filter", "url(#softGlow)")
          .attr("opacity", 0);
      }

      haloEl
        .attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", r0 * 2.2)                // ปรับได้ 2.0–3.0
        .attr("fill", haloColor)
        .transition().duration(120)
        .attr("opacity", 0.22);

      // เติมสีตัวจุดให้สว่างขึ้นนิดหน่อย (ไม่ใช้ฟิลเตอร์)
      d3.select(e.currentTarget)
        .attr("fill", haloColor);
    })
    .on("mousemove", e => {
      const pad = 14;
      tip.style("left", (e.clientX + pad) + "px")
         .style("top", (e.clientY + pad) + "px");
    })
    .on("mouseleave", function(e, d) {
      if (focusedMotion && d !== focusedMotion) return;
      tip.style("display", "none");

      if (haloEl) {
        haloEl.transition().duration(120).attr("opacity", 0);
      }
      d3.select(e.currentTarget)
        .attr("fill", colorNormal(d));
      
      if (d !== focusedMotion) {  // only remove pulse if not focused
        const el = d3.select(this);
        d.timeoutId = setTimeout(() => {
            el.classed("pulse-glow", false);
            d.timeoutId = null;
        }, 2000);
      }
    })
    .on("click", (e, d) => { e.stopPropagation(); if (focusedMotion) return; focusMotion(d); });

  // force
    d3.forceSimulation(M)
      .force("x", d3.forceX(d => d.tx).strength(0.2))
      .force("y", d3.forceY(d => d.ty).strength(0.2))
      .force("collide", d3.forceCollide(d => rMotion(d) + 4).iterations(2)) // 👈 กันชนแน่นขึ้น
      .on("tick", () => {
        // 👇 หนีบให้อยู่ในขอบกราฟ
        M.forEach(d => {
          const r = rMotion(d);
          d.x = Math.max(margin.left + r, Math.min(W - margin.right - r, d.x));
          d.y = Math.max(margin.top + r, Math.min(H - margin.bottom - r, d.y));
        });
        nodes.attr("cx", d => d.x).attr("cy", d => d.y);
      });


  // ===== panel open/close =====
  function openPanel() {
    isPanelOpen = true;
    requestAnimationFrame(() => {
      bottomBar.style.right = (360 + 28) + "px"; // หดบาร์เพื่อเว้นที่ panel
      panel.style.transform = "translateX(0)";
      svg.node().style.transform="translateX(-180px) scale(0.93)";
      panel.style.borderLeft="1px solid #dcdcd8";
      panel.style.boxShadow="-16px 0 40px rgba(0,0,0,0.08)";
    });
  }
  function closePanel() {
    isPanelOpen = false;
    requestAnimationFrame(() => {
      bottomBar.style.right = "20px";                 // ยืดบาร์กลับ
      panel.style.transform = "translateX(110%)";     // ยุบ panel
      svg.node().style.transform="translateX(0) scale(1)";
      panel.style.borderLeft="none";
      panel.style.boxShadow="none";
      panel.innerHTML = "";                           // ล้างเนื้อหา panel
    });
  }

  // ===== panel content =====
  function renderMemberGrid(partyName, motionTitle, motionDate, rows) {
    const order = { "เห็นด้วย":1, "ไม่เห็นด้วย":2, "งดออกเสียง":3, "ไม่ลงคะแนนเสียง":4, "ลา / ขาดลงมติ":5 };
    rows.sort((a,b)=> order[a.voter_option]-order[b.voter_option]);
  
    const agree = rows.filter(r=>r.voter_option==="เห็นด้วย").length;
    const disagree = rows.filter(r=>r.voter_option==="ไม่เห็นด้วย").length;
    const total = agree + disagree || 1;
    const agreePct = (agree/total)*100;
    const disagreePct = (disagree/total)*100;
    const EXT = 6
  
    // 🔁 กลับด้านตำแหน่งเส้น (เส้นขยับจากขวา → ซ้าย เมื่อ agree มากขึ้น)
    const linePct = Math.max(0, Math.min(100, 100 - agreePct));
  
    const header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #dcdcd8;">
        <div>
          <div style="font-family:'Noto Serif Thai',serif;font-weight:600;font-size:22px;line-height:1.25">${partyName}</div>
          <div style="color:#555555;font-size:12px;margin-top:6px;line-height:1.5">${motionTitle} · ${motionDate}</div>
        </div>
        <button id="btnClosePanel" style="background:transparent;color:#111111;border:1px solid #bdbdb8;padding:4px 14px;border-radius:999px;cursor:pointer;flex:none;font-family:${FONT_FAMILY};">ปิด</button>
      </div>
    
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;letter-spacing:.08em;margin-bottom:8px;color:#555555">สัดส่วน เห็นด้วย / ไม่เห็นด้วย</div>
    
        <!-- ชั้นนอก: ไม่ปิด overflow เพื่อให้เส้นยื่นได้ -->
        <div style="position:relative;height:8px;border-radius:4px;">
          
          <!-- พื้นหลังไล่สี: อยู่ชั้นใน และปิด overflow เพื่อให้มุมมน -->
          <div style="
            position:absolute; inset:0;
            border-radius:4px; overflow:hidden;
            background:linear-gradient(to right,${NEON_GREEN},${NEON_RED});
          "></div>
    
          <!-- เส้นชี้: อยู่ชั้นนอก จึงยื่นออกได้ -->
          <div style="
            position:absolute;
            left:${linePct}%;
            top:-${EXT}px;                 /* ยื่นขึ้น */
            height:${8 + EXT*2}px;        /* สูงกว่า bar */
            width:2px;
            background:#111111;
            transform:translateX(-1px);    /* จัดให้อยู่กึ่งกลางพิกัด percentage */
            pointer-events:none;
          "></div>
        </div>
    
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px;color:#333333;">
          <span><b style="color:${NEON_GREEN}">${agreePct.toFixed(1)}%</b> เห็นด้วย</span>
          <span>ไม่เห็นด้วย <b style="color:${NEON_RED}">${disagreePct.toFixed(1)}%</b></span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:18px;font-size:11px;color:#333333;">
          ${Object.keys(order).map(k => `<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:2px;background:${colorVoteTH(k)};border:1px solid rgba(17,17,17,.12)"></i>${k}</span>`).join("")}
        </div>
      </div>
    `;
  
    const cells = rows.map((r,i)=>`
      <div class="cell" data-i="${i}"
        style="width:18px;height:18px;border-radius:2px;background:${colorVoteTH(r.voter_option)};
        border:1px solid rgba(17,17,17,.10);"></div>`).join("");
  
    const grid = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(18px,1fr));gap:6px;">${cells}</div>`;
    panel.innerHTML = header + grid;
  
    const cellEls = panel.querySelectorAll(".cell");
    cellEls.forEach((el,i)=>{
      el.addEventListener("mouseenter", ev => {
        const r = rows[i];
        tip.html(`${r.voter_name}<br>${r.voter_party}<br>${r.voter_option}`).style("display","block");
      });
      el.addEventListener("mousemove", ev => tip.style("left",(ev.clientX+10)+"px").style("top",(ev.clientY+10)+"px"));
      el.addEventListener("mouseleave", () => tip.style("display","none"));
    });
  
    if (!isPanelOpen) openPanel();
    panel.querySelector("#btnClosePanel").onclick = e => { e.stopPropagation(); closePanel(); };
  }


  // ===== stacked bar (bottom) =====
  const partyColor = d3.scaleOrdinal(["#c08a1e","#14907a","#8a4f9e"]);

  function renderDistributionBar(md) {
    if (isBarLocked && barSvg) return;
  
    // ✅ ใช้ DATA (data_view) + คอลัมน์ใหม่
    const rows = DATA.filter(d => d.motion === md.motion_name && sameDay(new Date(d.start_date), md.date));
  
    // รวม "เห็นด้วย/ไม่เห็นด้วย/งดออกเสียง/ไม่ลงคะแนนเสียง" ต่อพรรค (ไม่รวม ลา/ขาด)
    const byParty = d3.rollup(
      rows,
      v => {
        const c = d3.rollup(v, vv => vv.length, d => d.voter_option);
        return (c.get("เห็นด้วย")||0) + (c.get("ไม่เห็นด้วย")||0) + (c.get("งดออกเสียง")||0) + (c.get("ไม่ลงคะแนนเสียง")||0);
      },
      d => d.voter_party
    );
  
    // เอาเฉพาะ Top 3 ที่เหลือรวมเป็น "อื่น ๆ"
    const TOP_N = 3;
    let items = [...byParty].map(([party, cnt]) => ({party, count: cnt}))
                            .sort((a,b)=>d3.descending(a.count,b.count));
    const topN = items.slice(0, TOP_N);
    const othersCount = d3.sum(items.slice(TOP_N), d=>d.count);
    const dataBar = othersCount > 0 ? [...topN, {party:"อื่น ๆ", count: othersCount}] : topN;
  
    const total = d3.sum(dataBar, d=>d.count) || 1;
    let cum = 0;
    lastSegments = dataBar.map(d => {
      const pct = d.count/total;
      const seg = { ...d, pct, x0:cum, x1:cum+pct }; cum += pct; return seg;
    });
  
    if (!barSvg) {
      bottomBar.innerHTML = "";
      barSvg = d3.select(bottomBar).append("svg")
        .attr("height", 92).style("width","100%").style("display","block").style("margin","0 auto").style("pointer-events","auto");
      barSvg.append("rect").attr("class","bg").attr("rx",4).attr("fill","#ffffff").attr("stroke","#dcdcd8");
      barSvg.append("g").attr("class","segs");
      barSvg.append("g").attr("class","vals");
      barSvg.append("g").attr("class","names");
    }
    drawBar(0);
  }


  function clearDistributionBar(){ lastSegments=null; if (barSvg) { barSvg.remove(); barSvg=null; } }

  function drawBar(duration=0){
    if (!barSvg || !lastSegments) return;
    const BW = Math.max(480, Math.floor(bottomBar.clientWidth || 0));
    const BH = 92;
    barSvg.attr("viewBox", `0 0 ${BW} ${BH}`);
    barSvg.select("rect.bg").attr("x",0).attr("y",0).attr("width",BW).attr("height",BH);

    const pad = 12, y0 = 22, HBAR = 32;
    const xs = d3.scaleLinear().domain([0,1]).range([pad, BW - pad]);

    // segs
    const segSel = barSvg.select(".segs").selectAll("rect.seg").data(lastSegments, d=>d.party);
    segSel.join(
      enter => enter.append("rect").attr("class","seg")
        .attr("y",y0).attr("height",HBAR).attr("rx",3)
        .attr("stroke","#ffffff").attr("stroke-width",2)
        .attr("fill", d => d.party==="อื่น ๆ" ? "#a8a8a2" : partyColor(d.party))
        .attr("x", d => xs(d.x0)).attr("width", d => Math.max(1, xs(d.x1)-xs(d.x0))),
      update => (duration ? segSel.transition().duration(duration) : segSel)
        .attr("x", d => xs(d.x0)).attr("width", d => Math.max(1, xs(d.x1)-xs(d.x0)))
    );

    // values
    const LABEL_MIN_W = 46;
    const valSel = barSvg.select(".vals").selectAll("text.value").data(lastSegments, d=>d.party);
    valSel.join(
      enter => enter.append("text").attr("class","value").attr("text-anchor","middle").attr("fill","#fff").attr("font-weight",600).attr("font-size",12)
        .text(d => `${Math.round(d.pct*100)}% (${d.count})`)
        .attr("y", y0 + HBAR/2 + 4).attr("x", d => (xs(d.x0)+xs(d.x1))/2)
        .style("display", d => (xs(d.x1)-xs(d.x0)) >= LABEL_MIN_W ? "block" : "none"),
      update => (duration ? valSel.transition().duration(duration) : valSel)
        .attr("x", d => (xs(d.x0)+xs(d.x1))/2)
        .style("display", d => (xs(d.x1)-xs(d.x0)) >= LABEL_MIN_W ? "block" : "none")
    );

    // names
    const nameSel = barSvg.select(".names").selectAll("text.pname").data(lastSegments, d=>d.party);
    nameSel.join(
      enter => enter.append("text").attr("class","pname").attr("text-anchor","middle").attr("fill","#333333").attr("font-weight",500).attr("font-size",12)
        .text(d => d.party).attr("y", y0 + HBAR + 22).attr("x", d => (xs(d.x0)+xs(d.x1))/2),
      update => (duration ? nameSel.transition().duration(duration) : nameSel)
        .attr("x", d => (xs(d.x0)+xs(d.x1))/2)
    );
  }

  // ===== redraw bar เมื่อ bottomBar transition จบ =====
  const onBottomBarTransitionEnd = (ev) => {
    if (ev.propertyName === 'right') {
      drawBar(T); // animate ยืด/หดบาร์ให้ลื่น
    }
  };
  bottomBar.addEventListener('transitionend', onBottomBarTransitionEnd);

  // ===== reset/focus =====
  function resetAll(){
    focusedMotion = null;
    isBarLocked = false;
    overlay.selectAll("*").remove();
    
    if (haloEl) haloEl.attr("opacity",0); // ซ่อนฮาโล่เมื่อรีเซ็ต
    nodes.attr("fill", d=>colorNormal(d))
      .attr("opacity",1);
    
  // กำหนดค่า default transform สำหรับ gMain และ overlay
  gMain.transition().duration(600).attr("transform", "translate(0,0) scale(1)");
  overlay.transition().duration(600).attr("transform", "translate(0,0) scale(1)");
    
    closePanel();
    clearDistributionBar();
    updateNodeCursor();
  }

  function focusMotion(md){
    clearDistributionBar();
    isBarLocked = true;

    focusedMotion = md;

    nodes.classed("pulse-glow", d => d===md);
    
    nodes.transition().duration(400)
      .attr("fill", d=>d===md ? colorNormal(d) : "#e3e3e0")
      .attr("opacity", d=>d===md ? 1 : 0.55);

    const k = 5, tx = W/2 - k*md.x, ty = H/2 - k*md.y;
    gMain.transition().duration(800).attr("transform",`translate(${tx},${ty}) scale(${k})`);
    overlay.transition().duration(800).attr("transform",`translate(${tx},${ty}) scale(${k})`)
      .on("end", () => showParties(md, k));
    showParties(md, k);

    renderDistributionBar(md);
    updateNodeCursor();
  }

  // ===== party nodes =====
  function showParties(md, k) {
    overlay.selectAll("*").remove();

    // ✅ ใช้ DATA (data_view)
    const rows = DATA.filter(d => d.motion === md.motion_name && sameDay(new Date(d.start_date), md.date));
    const byParty = d3.group(rows, d => d.voter_party);

    const partyAgg = [...byParty].map(([party, recs]) => {
      const counts = d3.rollup(recs, v => v.length, v => v.voter_option);
      const agree = counts.get("เห็นด้วย") || 0;
      const disagree = counts.get("ไม่เห็นด้วย") || 0;
      const abstain = counts.get("งดออกเสียง") || 0;
      const novote = counts.get("ไม่ลงคะแนนเสียง") || 0;
      const totalVoted = agree + disagree + abstain + novote; // ไม่รวม ลา/ขาด
      const color = agree > disagree ? NEON_GREEN : (disagree > agree ? NEON_RED : GRAY);
      return { party, color, recs, agree, disagree, abstain, totalVoted };
    });

    const center = { x: md.x, y: md.y };
    const maxVote = d3.max(partyAgg, d => d.totalVoted) || 1;
    const rScale = d3.scaleSqrt().domain([0, maxVote]).range([6 / k, 40 / k]);

    const n = partyAgg.length;
    const angle = d3.scaleLinear().domain([0, n]).range([0, 2*Math.PI]);
    const baseR = 180 / k;
    partyAgg.forEach((d,i) => { const a = angle(i); d.x = center.x + baseR*Math.cos(a); d.y = center.y + baseR*Math.sin(a); });

    const linkG = overlay.append("g", ":first-child")
      .attr("stroke","rgba(17,17,17,.22)")
      .attr("stroke-width", Math.max(1.0/k,0.6));

    const links = linkG.selectAll("line")
      .data(partyAgg)
      .join("line")
      .attr("x1", center.x)
      .attr("y1", center.y)
      .attr("x2", d => d.x)
      .attr("y2", center.y); // start from center
    
    const gParty = overlay.append("g")
      .attr("class","party-layer")
      .selectAll("g.party")
      .data(partyAgg)
      .join("g")
      .attr("class","party")
      .attr("transform", d => `translate(${center.x},${center.y})`) // start from center
      .style("opacity",0)
      .call(d3.drag()
            .on("start",dragstarted)
            .on("drag",dragged)
            .on("end",dragended));
        
    // create circle and text for each g.party
gParty.append("circle")
  .attr("r", d => rScale(d.totalVoted))
  .attr("fill", d => d.color)
  .attr("stroke", "#ffffff")
  .attr("stroke-width", 1.5 / k)
  .style("cursor", "pointer")
  .on("click", (e, d) => {
    e.stopPropagation();
    nodes.classed("pulse-glow", false);
        if (focusedMotion) focusedMotion.timeoutId && clearTimeout(focusedMotion.timeoutId);
        const f = d3.timeFormat("%Y-%m-%d");
        renderMemberGrid(d.party, md.motion_name, f(md.date), d.recs);

    // ===== create glow filter =====
function makePartyGlowFilter(id, color) {
  // ถ้า filter มีอยู่แล้ว return
  if (d3.select(`#${id}`).size()) return;

  const f = svg.select("defs").append("filter")
    .attr("id", id)
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

  f.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 20) // ปรับความฟุ้ง
    .attr("result", "blur");

  f.append("feFlood")
    .attr("flood-color", color)
    .attr("flood-opacity", 0.01)
    .attr("result", "color");

  f.append("feComposite")
    .attr("in", "color")
    .attr("in2", "blur")
    .attr("operator", "in")
    .attr("result", "glow");

  const merge = f.append("feMerge");
  merge.append("feMergeNode").attr("in", "glow");
  merge.append("feMergeNode").attr("in", "SourceGraphic");
}

    // ลบ glow ของทุก node ก่อน
    gParty.selectAll(".glow-ring").remove();

    const nodeG = d3.select(e.currentTarget.parentNode);

    const glowId = `partyGlow-${d.party.replace(/\s+/g,"")}`;
    makePartyGlowFilter(glowId, d.color);

    const r = rScale(d.totalVoted);
    const circumference = 2 * Math.PI * (r+1);

    // glow ring
    const glowRing = nodeG.append("circle")
      .attr("class", "glow-ring")
      .attr("r", r+0.5)
      .attr("fill", "none")
      .attr("stroke", d.color)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", `0 ${circumference}`)
      .style("filter", `url(#${glowId})`);

    function animateGlowRing(ring) {
      ring.transition()
        .duration(3000)
        .ease(d3.easeCubicInOut)
        .attrTween("stroke-dasharray", () => t => `${circumference*t} ${circumference*(1-t)}`)
        .on("end", () => animateGlowRing(ring));
    }
    animateGlowRing(glowRing);
  });
      

    gParty.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("font-weight", 600)
      .attr("font-size", `${10 / k}px`)
      .style("cursor","pointer")
      .text(d => d.totalVoted)
      .on("mouseenter", (e) => d3.select(e.currentTarget).style("opacity", 0.85))
      .on("mouseleave", (e) => d3.select(e.currentTarget).style("opacity", 1))
      .on("click", (e, d) => {
        e.stopPropagation();
        nodes.classed("pulse-glow", false);
        if (focusedMotion) focusedMotion.timeoutId && clearTimeout(focusedMotion.timeoutId);
        const f = d3.timeFormat("%Y-%m-%d");
        renderMemberGrid(d.party, md.motion_name, f(md.date), d.recs);
      });

    gParty.append("text")
      .attr("text-anchor","middle")
      .attr("dy", d => -rScale(d.totalVoted) - (14 / k))
      .attr("fill", "#111111")
      .attr("font-size", `${10 / k}px`)
      .text(d => d.party);

    // staggered transition
    const EDGE_DURATION = 400;
    const NODE_DURATION = 400;
    const STAGGER = 50;

const edges = linkG.selectAll("line")
  .data(partyAgg)
  .join("line")
  .attr("x1", center.x)
  .attr("y1", center.y)
  .attr("x2", d => {
      const dx = d.x - center.x;
      const dy = d.y - center.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const r = rScale(d.totalVoted);
      return center.x + dx/dist * (dist - r);
  })
  .attr("y2", d => {
      const dx = d.x - center.x;
      const dy = d.y - center.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const r = rScale(d.totalVoted);
      return center.y + dy/dist * (dist - r);
  });

    // sort partAgg vote descending
    const partyAggSorted = partyAgg.slice().sort((a,b) => d3.descending(a.totalVoted, b.totalVoted));

partyAggSorted.forEach((d,i) => {
  const edges = linkG.selectAll("line").filter(edgeD => edgeD.party === d.party);
  const nodesG = gParty.filter(nodeD => nodeD.party === d.party);

edges.transition()
  .delay(i * STAGGER)
  .duration(EDGE_DURATION)
  .attr("x2", d => center.x + (d.x - center.x)/Math.sqrt((d.x-center.x)**2 + (d.y-center.y)**2) * (baseR))
  .attr("y2", d => center.y + (d.y - center.y)/Math.sqrt((d.x-center.x)**2 + (d.y-center.y)**2) * (baseR))
  .on("end", () => {
    nodesG.transition()
      .duration(NODE_DURATION)
      .style("opacity", 1)
      .attr("transform", `translate(${d.x},${d.y})`);
  });
});

    const simulation = d3.forceSimulation(partyAgg)
      .force("x", d3.forceX(center.x).strength(0.01))
      .force("y", d3.forceY(center.y).strength(0.01))
      .force("collide", d3.forceCollide(d => rScale(d.totalVoted) + 10 / k))
      .alphaDecay(0.07)
      .on("tick", () => {
          gParty.attr("transform", d => `translate(${d.x},${d.y})`);

  links.attr("x2", d => {
    const dx = d.x - center.x;
    const dy = d.y - center.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const r = rScale(d.totalVoted); // radius ของ node
    return center.x + dx / dist * (dist - r);
  })
  .attr("y2", d => {
    const dx = d.x - center.x;
    const dy = d.y - center.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const r = rScale(d.totalVoted);
    return center.y + dy / dist * (dist - r);
  });
      });

    function dragstarted(event, d){ if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; }
    function dragged(event, d){ d.fx=event.x; d.fy=event.y; }
    function dragended(event, d){ if (!event.active) simulation.alphaTarget(0); d.fx=null; d.fy=null; }
  }

  // ===== return =====
  return container;
}


function _motions_fast(fast){return(
fast.motions_fast
)}

function _motions(d3,fast,data)
{
  const timeDay = d3.timeDay, timeYear = d3.timeYear;

  // --- 1) ชี้ชื่อคอลัมน์ ---
  const COL = {
    date: "start_date",
    motion: "motion",
    vote: "voter_option",
    party: "voter_party",
    member: "voter_name",
    category: "motion_categories",
    creator: "creator_name"
  };

  // --- 2) Helper ---
  const normalizeVote = (s) => {
    const t = (s ?? "").toString().trim();
    if (t === "เห็นด้วย") return "เห็นด้วย";
    if (t === "ไม่เห็นด้วย") return "ไม่เห็นด้วย";
    if (t === "งดออกเสียง") return "งดออกเสียง";
    if (t === "ไม่ลงคะแนนเสียง") return "ไม่ลงคะแนนเสียง";
    if (t === "ลา / ขาดลงมติ") return "ลา / ขาดลงมติ";
    return "ลา / ขาดลงมติ";
  };
  const dayIso = (d) => {
    const dt = new Date(d);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
      .toISOString()
      .slice(0, 10);
  };

  // --- 3) ใช้ข้อมูลที่ถูกกรองแล้ว (จาก fast) ---
  const source = (fast && fast.data_view) ? fast.data_view : data;

  // --- 4) Rollup ตาม motion + วันที่ (ตัดเวลา) ---
  const groups = d3.rollups(
    source,
    v => {
      const dt = new Date(v[0][COL.date]);
      const year = dt.getFullYear();
      const doy = timeDay.count(timeYear(dt), dt) + 1;

      const byVote = d3.rollup(v, vv => vv.length, d => normalizeVote(d[COL.vote]));
      const members = new Set(v.map(d => d[COL.member])).size;
      const parties = new Set(v.map(d => d[COL.party])).size;

      const agree    = byVote.get("เห็นด้วย") || 0;
      const disagree = byVote.get("ไม่เห็นด้วย") || 0;
      const abstain  = byVote.get("งดออกเสียง") || 0;
      const novote   = byVote.get("ไม่ลงคะแนนเสียง") || 0;
      const absent   = byVote.get("ลา / ขาดลงมติ") || 0;

      const motion_result = agree > disagree + abstain + novote ? "ผ่าน" : "ไม่ผ่าน";

        return {
        date: dt,
        year,
        dayOfYear: doy,
        motion_name: v[0][COL.motion],
        motion_result,
        เห็นด้วย: agree,
        ไม่เห็นด้วย: disagree,
        งดออกเสียง: abstain,
        ไม่ลงคะแนนเสียง: novote,
        "ลา / ขาดลงมติ": absent,
        members,
        parties,
        total_votes: v.length,
        creator: v[0][COL.creator],
        categories: v[0][COL.category]
        };
    },
    d => `${d[COL.motion]}__${dayIso(d[COL.date])}`
  ).map(d => d[1]);

  return groups;
}


function _data_view(fast){return(
fast.data_view
)}

function _fast(pre,categoryFilter,creatorFilter,ALL){return(
(function () {
  const { rows, catIndex, motionIndex, motionsMeta, creatorIndex } = pre;

  const selCats = categoryFilter ?? [];           // multi
  const selCreator = (typeof creatorFilter !== "undefined" ? creatorFilter : ALL);
  const useCreator = selCreator && selCreator !== ALL;

  // ---------- สร้างมาสก์ของแต่ละตัวกรอง ----------
  let maskCat = null;
  if (selCats.length) {
    maskCat = new Uint8Array(rows.length);
    for (const c of selCats) {
      const idxs = catIndex.get(c);
      if (!idxs) continue;
      for (const i of idxs) maskCat[i] = 1;
    }
  }

  let maskCreator = null;
  if (useCreator) {
    const idxs = creatorIndex.get(selCreator);
    if (idxs && idxs.length) {
      maskCreator = new Uint8Array(rows.length);
      for (const i of idxs) maskCreator[i] = 1;
    } else {
      // เลือกผู้เสนอฯ แล้วแต่ไม่พบในดัชนี → ทำให้ผลว่าง
      maskCreator = new Uint8Array(rows.length); // ทั้งหมด = 0
    }
  }

  // ---------- รวมมาสก์ (AND) ----------
  let mask = null;
  if (maskCat && maskCreator) {
    mask = new Uint8Array(rows.length);
    for (let i = 0; i < rows.length; i++) mask[i] = (maskCat[i] & maskCreator[i]);
  } else {
    mask = maskCat || maskCreator; // ตัวใดตัวหนึ่ง หรือไม่มีเลย (null)
  }

  // ---------- data_view: แถวดิบหลังกรอง ----------
  const data_view = !mask
    ? rows.map(r => r.raw)
    : rows.filter((_, i) => mask[i]).map(r => r.raw);

  // ---------- motions_fast: aggregate แบบเร็ว ----------
  const out = [];
  for (const [key, idxs] of motionIndex) {
    let agree=0, disagree=0, abstain=0, novote=0, absent=0, total=0;
    const memberSet = new Set();
    const partySet  = new Set();

    for (const i of idxs) {
      if (mask && !mask[i]) continue;
      const r = rows[i];
      total++;
      memberSet.add(r.member);
      partySet.add(r.party);
      switch (r.voteN) {
        case "เห็นด้วย": agree++; break;
        case "ไม่เห็นด้วย": disagree++; break;
        case "งดออกเสียง": abstain++; break;
        case "ไม่ลงคะแนนเสียง": novote++; break;
        case "ลา / ขาดลงมติ": absent++; break;
      }
    }
    if (total === 0) continue;

    const meta = motionsMeta.get(key);
    const motion_result = agree > disagree ? "ผ่าน" : "ไม่ผ่าน";

    out.push({
      date: meta.date,
      year: meta.year,
      dayOfYear: meta.dayOfYear,
      motion_name: meta.motion_name,
      motion_result,
      เห็นด้วย: agree,
      ไม่เห็นด้วย: disagree,
      งดออกเสียง: abstain,
      ไม่ลงคะแนนเสียง: novote,
      "ลา / ขาดลงมติ": absent,
      members: memberSet.size,
      parties: partySet.size,
      total_votes: total
    });
  }

  return { data_view, motions_fast: out };
})()
)}

function _pre(d3,data_norm)
{
  const timeDay = d3.timeDay, timeYear = d3.timeYear;

  // ===== 1) อ้างอิงคอลัมน์จากชุดข้อมูลปัจจุบัน (ใช้ data_norm) =====
  const COL = {
    date: "start_date",
    motion: "motion",
    vote: "voter_option",
    party: "voter_party",
    member: "voter_name",
    cats:  "motion_categories",
    creator: "creator_name"         // ← ใช้ค่าที่ถูกแทนใน data_norm แล้ว
  };

  // ===== 2) Helper =====
  const splitCats = (v) => {
    if (Array.isArray(v)) return v.map(String);
    const s = (v ?? "").toString().trim();
    if (!s) return [];
    // รองรับกรณีเป็น JSON array ในสตริง
    try {
      if (s.startsWith("[") && s.endsWith("]")) {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(String);
      }
    } catch {}
    // รองรับตัวคั่นหลายแบบ , | / ; ฯลฯ
    return s.split(/[,\|/;；、，]/).map(t => t.trim()).filter(Boolean);
  };

  const normalizeVote = (s) => {
    const t = (s ?? "").toString().trim();
    if (t === "เห็นด้วย") return "เห็นด้วย";
    if (t === "ไม่เห็นด้วย") return "ไม่เห็นด้วย";
    if (t === "งดออกเสียง") return "งดออกเสียง";
    if (t === "ไม่ลงคะแนนเสียง") return "ไม่ลงคะแนนเสียง";
    if (t === "ลา / ขาดลงมติ") return "ลา / ขาดลงมติ";
    return "ลา / ขาดลงมติ";
  };

  // ตัดเวลาออก เพื่อให้ key ของ motion คงที่ใน “วันเดียวกัน”
  const dayIso = (d) => {
    const dt = new Date(d);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
      .toISOString()
      .slice(0, 10);
  };
  const motionKeyOf = (r) => `${r[COL.motion]}__${dayIso(r[COL.date])}`;

  // ===== 3) สร้างโครงสร้างดัชนี =====
  const src = data_norm;                          // ใช้ข้อมูลที่ normalize แล้ว
  const N = src.length;
  const rows = new Array(N);

  const catIndex     = new Map();                 // cat -> indices
  const motionIndex  = new Map();                 // motionKey -> indices
  const creatorIndex = new Map();                 // creator_name (effective) -> indices
  const motionsMeta  = new Map();                 // motionKey -> {date, year, dayOfYear, motion_name}

  for (let i = 0; i < N; i++) {
    const r = src[i];
    const dt = new Date(r[COL.date]);
    const year = dt.getFullYear();
    const doy = timeDay.count(timeYear(dt), dt) + 1;

    const cats = splitCats(r[COL.cats]);
    const motionKey = motionKeyOf(r);
    const voteN = normalizeVote(r[COL.vote]);
    const creatorEff = (r[COL.creator] ?? "— ไม่ระบุ —").toString().trim() || "— ไม่ระบุ —";

    rows[i] = {
      i,
      raw: r,                    // เก็บแถวดิบไว้ใช้ tooltip/panel
      dt, year, doy,
      motionKey,
      voteN,
      party:  r[COL.party],
      member: r[COL.member],
      creator: creatorEff,
      cats
    };

    // --- ดัชนีหมวดหมู่ ---
    const cc = cats.length ? cats : ["— ไม่ระบุหมวด —"];
    for (const c of cc) {
      if (!catIndex.has(c)) catIndex.set(c, []);
      catIndex.get(c).push(i);
    }

    // --- ดัชนีผู้เสนอญัตติ (หลัง normalize) ---
    if (!creatorIndex.has(creatorEff)) creatorIndex.set(creatorEff, []);
    creatorIndex.get(creatorEff).push(i);

    // --- ดัชนี motion + meta ---
    if (!motionIndex.has(motionKey)) motionIndex.set(motionKey, []);
    motionIndex.get(motionKey).push(i);

    if (!motionsMeta.has(motionKey)) {
      motionsMeta.set(motionKey, {
        date: dt,
        year,
        dayOfYear: doy,
        motion_name: r[COL.motion]
      });
    }
  }

  // ===== 4) รายการสำหรับ UI =====
  const categories = Array.from(catIndex.keys()).sort(d3.ascending);
  const creators   = Array.from(creatorIndex.keys()).sort(d3.ascending);

  // ส่งออกครบ: ใช้ได้ทั้ง filter/motions/chart
  return { rows, catIndex, motionIndex, motionsMeta, categories, creatorIndex, creators };
}


function _creators(data_norm,ALL,d3)
{
  const MISSING = "— ไม่ระบุ —";
  const s = new Set();
  for (const d of data_norm) {
    let name = d.creator_name?.trim();
    if (!name) name = MISSING;
    s.add(name);
  }
  return [ALL, ...Array.from(s).sort(d3.ascending)];
}


function _data_norm(data,d3)
{
  // --- helper: key กลุ่ม (motion + วันเดียวกัน แบบตัดเวลา) ---
  const dayKey = (d) => {
    const dt = new Date(d.start_date);
    const iso = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
      .toISOString()
      .slice(0, 10);
    return `${d.motion}__${iso}`;
  };

  // --- สร้างดัชนี "พรรคล่าสุดของคนในปีนั้น" จากทั้ง dataset ---
  // key: `${person}__${year}` -> { party, lastDate }
  const latestPartyByPersonYear = new Map();
  for (const r of data) {
    const voter = r.voter_name?.trim();
    const party = r.voter_party?.trim();
    const dt = new Date(r.start_date);
    if (!voter || !party || isNaN(dt)) continue;

    const key = `${voter}__${dt.getFullYear()}`;
    const prev = latestPartyByPersonYear.get(key);
    if (!prev || dt > prev.lastDate) {
      latestPartyByPersonYear.set(key, { party, lastDate: dt });
    }
  }

  // --- จับกลุ่มตาม motion + วันเดียวกัน ---
  const groups = d3.group(data, dayKey);
  const out = [];

  for (const [key, rows] of groups) {
    // เลือก creator หลักของกลุ่ม (mode)
    let creatorCounts = new Map();
    for (const r of rows) {
      const c = (r.creator_name ?? "").trim();
      if (!c) continue;
      creatorCounts.set(c, (creatorCounts.get(c) || 0) + 1);
    }
    let groupCreator = null;
    if (creatorCounts.size) {
      groupCreator = Array.from(creatorCounts.entries())
        .sort((a, b) => d3.descending(a[1], b[1]))[0][0];
    } else {
      out.push(...rows);
      continue;
    }

    const groupDate = new Date(rows[0].start_date);
    const groupYear = groupDate.getFullYear();

    // วิธีหลัก: ถ้าในกลุ่มมี creator==voter & มี voter_party → ใช้พรรคนั้นแทนทั้งกลุ่ม
    let replacement = null;
    for (const r of rows) {
      const creator = r.creator_name?.trim();
      const voter   = r.voter_name?.trim();
      const party   = r.voter_party?.trim();
      if (creator && voter && party && creator === voter && creator === groupCreator) {
        replacement = party;
        break;
      }
    }

    // Fallback: หา "พรรคล่าสุดในปีเดียวกัน" จากทั้ง dataset
    if (!replacement) {
      const idxKey = `${groupCreator}__${groupYear}`;
      const rec = latestPartyByPersonYear.get(idxKey);
      if (rec?.party) replacement = rec.party;
    }

    // เขียนผลลัพธ์กลุ่ม
    if (replacement) {
      for (const r of rows) out.push({ ...r, creator_name: replacement });
    } else {
      out.push(...rows);
    }
  }

  // --- ขั้นสุดท้าย (manual override): map รายชื่อ → พรรค ตามที่กำหนด ---
  const MANUAL_MAP = new Map([
    ["คมเดช ไชยศิวามงคล", "พรรคเพื่อไทย"],
    ["จุติ ไกรฤกษ์", "พรรครวมไทยสร้างชาติ"],
    ["ชัยธวัช ตุลาธน", "พรรคก้าวไกล"],
    ["พิธา ลิ้มเจริญรัตน์", "พรรคก้าวไกล"],
    ["พิสิฐ ลี้อาธรรม", "พรรคประชาธิปัตย์"],
    ["มัลลิกา บุญมีตระกูล มหาสุข", "พรรคประชาธิปัตย์"],
    ["วิโรจน์ ลักขณาอดิศร", "พรรคก้าวไกล"],
    ["ศุภชัย ใจสมุทร", "พรรคภูมิใจไทย"],
    ["สมชาติ เตชถาวรเจริญ", "พรรคก้าวไกล"],
    ["องอาจ คล้ามไพบูลย์", "พรรคประชาธิปัตย์"],
    ["อนุชา บูรพชัยศรี", "พรรครวมไทยสร้างชาติ"],
    ["เทพไท เสนพงศ์", "พรรคประชาธิปัตย์"],
  ]);

  for (const r of out) {
    const name = r.creator_name?.trim();
    if (name && MANUAL_MAP.has(name)) {
      r.creator_name = MANUAL_MAP.get(name);
    }
  }

  return out;
}


function _ALL(){return(
"— ทั้งหมด —"
)}

async function _data(FileAttachment){return(
await FileAttachment("parliament_trans.csv").csv({typed:true})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.define("module 1", async () => runtime.module((await import("./a2e58f97fd5e8d7c@756.js")).default));
  const fileAttachments = new Map([
    ["parliament_trans.csv", {url: new URL("./files/12f39e77615062901b9750bd14ac8a5fd454d9b357c1c28034f7cc8332afbc79fa61e3bb7ea6df5c9f633c5dc3fe564059eeb03cfe7ec4e714de898d1f2b23a3.csv", import.meta.url), mimeType: "text/csv"}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("motionEvent1")).define("motionEvent1", ["__query","FileAttachment","invalidation"], _motionEvent1);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("viewof creatorFilter")).define("viewof creatorFilter", ["Inputs","creators","ALL"], _creatorFilter);
  main.variable(observer("creatorFilter")).define("creatorFilter", ["Generators", "viewof creatorFilter"], (G, _) => G.input(_));
  main.variable(observer("viewof categoryFilter")).define("viewof categoryFilter", ["Inputs","pre"], _categoryFilter);
  main.variable(observer("categoryFilter")).define("categoryFilter", ["Generators", "viewof categoryFilter"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["d3","motions_fast","data_view"], _chart);
  main.variable(observer("motions_fast")).define("motions_fast", ["fast"], _motions_fast);
  main.variable(observer("motions")).define("motions", ["d3","fast","data"], _motions);
  main.variable(observer("data_view")).define("data_view", ["fast"], _data_view);
  main.variable(observer("fast")).define("fast", ["pre","categoryFilter","creatorFilter","ALL"], _fast);
  main.variable(observer("pre")).define("pre", ["d3","data_norm"], _pre);
  main.variable(observer("creators")).define("creators", ["data_norm","ALL","d3"], _creators);
  main.variable(observer("data_norm")).define("data_norm", ["data","d3"], _data_norm);
  main.variable(observer("ALL")).define("ALL", _ALL);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.define("Inputs", ["module 1", "@variable"], (_, v) => v.import("Inputs", _));
  return main;
}
