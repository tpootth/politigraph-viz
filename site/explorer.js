const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('th-TH');
const options = ['เห็นด้วย', 'ไม่เห็นด้วย', 'งดออกเสียง', 'ไม่ลงคะแนนเสียง', 'ลา / ขาดลงมติ'];
const colors = ['#2a5f9e', '#b23a2e', '#947119', '#64558c', '#9da7b5'];
let current = [], module;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function segment(value, total, color, label) {
  const node = element('span');
  node.style.width = `${total ? value / total * 100 : 0}%`;
  node.style.background = color;
  node.title = `${label}: ${fmt(value)}`;
  node.setAttribute('aria-label', node.title);
  return node;
}
function bounded(id, min, max, fallback) {
  const input = $(id);
  const value = input.value === '' ? fallback : Number(input.value);
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));
}
function applyFilters() {
  let from = bounded('year-from', 2563, 2568, 2563);
  let to = bounded('year-to', 2563, 2568, 2568);
  if (from > to) [from, to] = [to, from];
  $('year-from').value = from; $('year-to').value = to;
  const minimum = bounded('minimum', 0, 800, 0);
  $('minimum-value').value = minimum;
  module.redefine('exploreSettings', {from: from - 543, to: to - 543, minimum, search: $('motion-search').value.trim()});
}
function applyDisplay() {
  const radius = bounded('radius', 4, 18, 10), height = bounded('height', 480, 1100, 780);
  $('radius-value').value = radius; $('height-value').value = height;
  module.redefine('displaySettings', {radius, height});
}
export function setupExplorer(main) {
  module = main;
  ['year-from', 'year-to'].forEach(id => $(id).addEventListener('change', applyFilters));
  let timer;
  ['minimum', 'motion-search'].forEach(id => $(id).addEventListener('input', () => {
    if (id === 'minimum') $('minimum-value').value = $('minimum').value;
    clearTimeout(timer); timer = setTimeout(applyFilters, 180);
  }));
  ['radius', 'height'].forEach(id => $(id).addEventListener('change', applyDisplay));
  ['radius', 'height'].forEach(id => $(id).addEventListener('input', () => $(id + '-value').value = $(id).value));
  $('top-count').addEventListener('change', renderRanking);
  $('reset-explorer').addEventListener('click', async () => {
    clearTimeout(timer);
    for (const [id, value] of Object.entries({'year-from':2563,'year-to':2568,minimum:0,radius:10,height:780,'motion-search':'','top-count':8})) $(id).value = value;
    for (const name of ['creatorFilter', 'categoryFilter']) {
      const view = await main.value('viewof ' + name);
      view.value = name === 'creatorFilter' ? await main.value('ALL') : [];
      view.dispatchEvent(new Event('input', {bubbles:true}));
    }
    applyFilters(); applyDisplay();
  });
}
export function updateOverview(motions) {
  current = motions;
  $('filter-state').textContent = motions.length ? `แสดง ${fmt(motions.length)} ครั้ง · รวม ${fmt(motions.reduce((s,d) => s+d.total_votes,0))} เสียงที่บันทึก` : 'ไม่พบข้อมูล ลองลดเสียงขั้นต่ำหรือเปลี่ยนตัวกรอง';
  const host = $('year-bars'); host.replaceChildren();
  const years = Array.from({length:6}, (_,i) => 2020+i);
  const groups = years.map(year => motions.filter(d => d.year === year));
  const max = Math.max(1, ...groups.map(g => g.length));
  years.forEach((year, i) => {
    const group = groups[i], pass = group.filter(d => d.motion_result === 'ผ่าน').length;
    const row = element('button', undefined, 'year-row'); row.type = 'button';
    row.title = `กรองปี ${year+543}: ผ่าน ${pass} ไม่ผ่าน ${group.length-pass}`;
    row.append(element('span', year+543));
    const track = element('span', undefined, 'bar-track');
    track.append(segment(pass,max,colors[0],'ผ่าน'), segment(group.length-pass,max,colors[1],'ไม่ผ่าน'));
    row.append(track, element('strong', fmt(group.length)));
    row.addEventListener('click', () => { $('year-from').value = year+543; $('year-to').value = year+543; applyFilters(); });
    host.append(row);
  });
  const legend = element('div', undefined, 'legend');
  ['มติผ่าน','มติไม่ผ่าน'].forEach((text,i) => { const label = element('span', text); label.style.borderColor = colors[i]; legend.append(label); });
  host.append(legend);
  const votes = $('vote-bars'); votes.replaceChildren();
  const counts = options.map(key => motions.reduce((s,d) => s+(d[key] || 0),0));
  const total = counts.reduce((a,b)=>a+b,0);
  const stack = element('div', undefined, 'vote-stack');
  options.forEach((key,i)=>stack.append(segment(counts[i],total,colors[i],key))); votes.append(stack);
  options.forEach((key,i) => {
    const row = element('div', undefined, 'vote-row');
    const label = element('span',key); label.style.borderColor = colors[i];
    row.append(label,element('strong',fmt(counts[i])),element('span',`${total ? (counts[i]/total*100).toFixed(1) : '0.0'}%`)); votes.append(row);
  });
  renderRanking();
}
function renderRanking() {
  const count = bounded('top-count',1,50,8); $('top-count').value = count;
  const host = $('motion-ranking'); host.replaceChildren();
  if (!current.length) { host.append(element('p','ไม่มีญัตติที่ตรงกับตัวกรอง')); return; }
  [...current].sort((a,b) => Math.abs(a['เห็นด้วย']-a['ไม่เห็นด้วย'])-Math.abs(b['เห็นด้วย']-b['ไม่เห็นด้วย'])).slice(0,count).forEach(d => {
    const row = element('details',undefined,'motion-row');
    const summary = element('summary');
    const date = new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric'}).format(d.date);
    summary.append(element('span',d.motion_name),element('strong',`ห่าง ${fmt(Math.abs(d['เห็นด้วย']-d['ไม่เห็นด้วย']))} เสียง`));
    row.append(summary,element('p',`${date} · ${d.motion_result} · ${fmt(d.total_votes)} เสียงที่บันทึก`));
    const bar = element('div',undefined,'vote-stack');
    options.forEach((key,i)=>bar.append(segment(d[key] || 0,d.total_votes,colors[i],key)));
    row.append(bar,element('p', options.map(key=>`${key} ${fmt(d[key] || 0)}`).join(' · '))); host.append(row);
  });
}
