# One-off restyle of the exported Observable chart cell (neon dark -> editorial light).
# Already applied to site/cb14db9ba9975405@525.js; rerun only on a fresh export:
#   python3 scripts/restyle_chart.py site/cb14db9ba9975405@525.js

import sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
R = [
 # fonts & layout
 ('''const FONT_FAMILY = "Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif";''',
  '''const FONT_FAMILY = "'IBM Plex Sans Thai', 'Sarabun', system-ui, sans-serif";'''),
 ('const TITLE_H = 65;', 'const TITLE_H = 10;'),
 # palette
 ('const NEON_GREEN="#39ff14", NEON_RED="#fa0f0f", GRAY="#9e9e9e";', 'const NEON_GREEN="#2a5f9e", NEON_RED="#b23a2e", GRAY="#bcbcb6";'),
 ('const PURPLE_GRAY="#5a1b5d", DARK_GRAY="#424242";', 'const PURPLE_GRAY="#555555", DARK_GRAY="#e6e6e2";'),
 ('''d.motion_result === "ผ่าน" ? "#2dc446" : "#c72828"''', '''d.motion_result === "ผ่าน" ? NEON_GREEN : NEON_RED'''),
 # surface, grid, axes
 ('svg.append("rect").attr("fill","#0b1824")', 'svg.append("rect").attr("fill","#ffffff")'),
 ('svg.append("g").attr("stroke","#bcd").attr("stroke-opacity",0.07)', 'svg.append("g").attr("stroke","#ececea").attr("stroke-opacity",1)'),
 ('.call(g=>g.selectAll("text").attr("fill","#dde3ea"))', '.call(g=>g.selectAll("text").attr("fill","#333333").style("font-size","13px").style("font-weight",600))'),
 ('.call(g=>g.selectAll(".domain").attr("stroke","#99aab5").attr("opacity",0.2))', '.call(g=>g.selectAll(".domain").attr("stroke","#bdbdb8").attr("opacity",1))'),
 ('.call(g=>g.selectAll(".tick line").attr("stroke","#99aab5").attr("opacity",0.2));', '.call(g=>g.selectAll(".tick line").attr("stroke","#bdbdb8").attr("opacity",1));'),
 ('.call(g=>g.selectAll("text").attr("fill","#cfd7df").style("font-size","11px"))', '.call(g=>g.selectAll("text").attr("fill","#555555").style("font-size","11px"))'),
 # pulse: a quiet ring instead of a neon flash
 ('''    0%   { filter: brightness(1) drop-shadow(0 0 3px currentColor); }
    50%  { filter: brightness(2) drop-shadow(0 0 20px currentColor); }
    100% { filter: brightness(1) drop-shadow(0 0 3px currentColor); }''',
  '''    0%, 100% { stroke-width: 2px; }
    50%      { stroke-width: 7px; }'''),
 ('''    animation: pulseGlow 1.5s ease-in-out infinite;''', '''    animation: pulseGlow 1.8s ease-in-out infinite;
    stroke: currentColor; stroke-opacity: .25;'''),
 # in-chart title removed (the page header carries it)
 ('.text("แต่ละพรรคโหวตมติยังไงบ้างน้าา");', '.text("");'),
 # legend
 ('[["ผ่าน","#2fb546"],["ไม่ผ่าน","#bf3737"]]', '[["มติผ่าน",NEON_GREEN],["มติไม่ผ่าน",NEON_RED]]'),
 ('''g.append("circle").attr("r",6).attr("fill",d[1]).attr("cy",-2).attr("opacity",0.9);''', '''g.append("circle").attr("r",5).attr("fill",d[1]).attr("cy",-4);'''),
 ('''.text(d[0]).attr("font-size",11).attr("fill","#e7edf3");''', '''.text(d[0]).attr("font-size",12).attr("fill","#333333");'''),
 # tooltip
 ('.style("background", "rgba(15,15,20,0.88)")', '.style("background", "#ffffff").style("border", "1px solid #dcdcd8")'),
 ('.style("color", "#e8f0ff")', '.style("color", "#111111")'),
 ('.style("padding", "8px 10px")\n    .style("border-radius", "8px")', '.style("padding", "10px 14px")\n    .style("border-radius", "4px")'),
 ('.style("box-shadow", "0 2px 8px rgba(0,0,0,0.4)")', '.style("box-shadow", "0 8px 28px rgba(0,0,0,0.12)")'),
 # hint
 ('.attr("x",-170).attr("y",-26).attr("rx",10).attr("ry",10)', '.attr("x",-170).attr("y",-24).attr("rx",3).attr("ry",3)'),
 ('.attr("width",340).attr("height",52)', '.attr("width",340).attr("height",48)'),
 ('.attr("fill","rgba(255,255,255,0.06)").attr("stroke","rgba(255,255,255,0.12)");', '.attr("fill","rgba(17,17,17,0.86)");'),
 ('hint.append("text").attr("text-anchor","middle").attr("fill","#cfd7df").attr("font-size",14)', 'hint.append("text").attr("text-anchor","middle").attr("fill","#ffffff").attr("font-size",13)'),
 # panel
 ('panel.style.background="rgba(12,14,20,0.97)";', 'panel.style.background="#ffffff";'),
 ('panel.style.color="#e7edf3";', 'panel.style.color="#111111";'),
 ('panel.style.padding="16px";', 'panel.style.padding="24px 22px";'),
 ('panel.style.borderLeft="1px solid rgba(255,255,255,0.08)";', 'panel.style.borderLeft="1px solid #dcdcd8";'),
 ('panel.style.boxShadow="0 0 30px rgba(0,0,0,0.4)";', 'panel.style.boxShadow="-16px 0 40px rgba(0,0,0,0.08)";'),
 # motion dots: no permanent glow, surface ring between overlapping marks
 ('''d.motion_result === "ผ่าน" ? "url(#greenGlow)" :
    d.motion_result === "ไม่ผ่าน" ? "url(#redGlow)" :
    null''', 'null'),
 ('''    .attr("r", rMotion())
    .attr("cx", d => d.x)''', '''    .attr("r", rMotion())
    .attr("stroke", "#ffffff").attr("stroke-width", 2)
    .attr("cx", d => d.x)'''),
 ('.attr("opacity", 0.75);', '.attr("opacity", 0.22);'),
 # panel header
 ('''<div style="font-weight:700;font-size:16px">${partyName}</div>
          <div style="opacity:.75;font-size:12px;margin-top:2px">${motionTitle} · ${motionDate}</div>''',
  '''<div style="font-family:'Noto Serif Thai',serif;font-weight:600;font-size:22px;line-height:1.25">${partyName}</div>
          <div style="color:#555555;font-size:12px;margin-top:6px;line-height:1.5">${motionTitle} · ${motionDate}</div>'''),
 ('display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;', 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #dcdcd8;'),
 ('background:#222;color:#e7edf3;border:1px solid #444;padding:6px 10px;border-radius:8px;cursor:pointer;', 'background:transparent;color:#111111;border:1px solid #bdbdb8;padding:4px 14px;border-radius:999px;cursor:pointer;flex:none;'),
 ('<div style="font-size:12px;margin-bottom:4px;opacity:.75">สัดส่วนคะแนน เห็นด้วย vs ไม่เห็นด้วย</div>', '<div style="font-size:11px;letter-spacing:.08em;margin-bottom:8px;color:#555555">สัดส่วน เห็นด้วย / ไม่เห็นด้วย</div>'),
 ('<div style="position:relative;height:16px;border-radius:8px;">', '<div style="position:relative;height:8px;border-radius:4px;">'),
 ('border-radius:8px; overflow:hidden;', 'border-radius:4px; overflow:hidden;'),
 ('height:${16 + EXT*2}px;', 'height:${8 + EXT*2}px;'),
 ('            background:#fff;\n', '            background:#111111;\n'),
 ('''<div style="font-size:11px;margin-top:4px;opacity:.7;">
          เห็นด้วย: ${agreePct.toFixed(1)}% | ไม่เห็นด้วย: ${disagreePct.toFixed(1)}%
        </div>''',
  '''<div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px;color:#333333;">
          <span><b style="color:${NEON_GREEN}">${agreePct.toFixed(1)}%</b> เห็นด้วย</span>
          <span>ไม่เห็นด้วย <b style="color:${NEON_RED}">${disagreePct.toFixed(1)}%</b></span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:18px;font-size:11px;color:#333333;">
          ${Object.keys(order).map(k => `<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:2px;background:${colorVoteTH(k)};border:1px solid rgba(17,17,17,.12)"></i>${k}</span>`).join("")}
        </div>'''),
 ('border:1px solid rgba(0,0,0,.35);"></div>`).join("");', 'border:1px solid rgba(17,17,17,.10);"></div>`).join("");'),
 ('style="width:18px;height:18px;border-radius:3px;', 'style="width:18px;height:18px;border-radius:2px;'),
 # distribution bar
 ('const partyColor = d3.scaleOrdinal(d3.schemeTableau10);', 'const partyColor = d3.scaleOrdinal(["#c08a1e","#14907a","#8a4f9e"]);'),
 ('barSvg.append("rect").attr("class","bg").attr("rx",10).attr("fill","rgba(255,255,255,0.05)");', 'barSvg.append("rect").attr("class","bg").attr("rx",4).attr("fill","#ffffff").attr("stroke","#dcdcd8");'),
 ('''.attr("y",y0).attr("height",HBAR).attr("rx",6)
        .attr("fill", d => d.party==="อื่น ๆ" ? "#6b7280" : partyColor(d.party))''',
  '''.attr("y",y0).attr("height",HBAR).attr("rx",3)
        .attr("stroke","#ffffff").attr("stroke-width",2)
        .attr("fill", d => d.party==="อื่น ๆ" ? "#a8a8a2" : partyColor(d.party))'''),
 ('.attr("fill","#fff").attr("font-weight",800).attr("font-size",12)', '.attr("fill","#fff").attr("font-weight",600).attr("font-size",12)'),
 ('.attr("fill","#e7edf3").attr("font-weight",700).attr("font-size",12)', '.attr("fill","#333333").attr("font-weight",500).attr("font-size",12)'),
 # focus mode
 ('.attr("fill", d=>d===md ? colorNormal(d) : "#444")', '.attr("fill", d=>d===md ? colorNormal(d) : "#e3e3e0")'),
 ('.attr("opacity", d=>d===md ? 1 : 0.3);', '.attr("opacity", d=>d===md ? 1 : 0.55);'),
 ('.attr("stroke","rgba(255,255,255,.25)")', '.attr("stroke","rgba(17,17,17,.22)")'),
 ('''  .attr("stroke", "#222")
  .attr("stroke-width", 0.1 / k)''', '''  .attr("stroke", "#ffffff")
  .attr("stroke-width", 1.5 / k)'''),
 ('''      .attr("fill", "#000")
      .attr("font-weight", 600)''', '''      .attr("fill", "#fff")
      .attr("font-weight", 600)'''),
 ('''      .attr("fill", "#e7edf3")
      .attr("font-size", `${10 / k}px`)
      .text(d => d.party);''', '''      .attr("fill", "#111111")
      .attr("font-size", `${10 / k}px`)
      .text(d => d.party);'''),
]
for old, new in R:
    n = s.count(old)
    if n != 1:
        sys.exit(f"expected 1 match, got {n}: {old[:70]!r}")
    s = s.replace(old, new)
open(p, "w", encoding="utf-8").write(s)
print("patched", len(R))
