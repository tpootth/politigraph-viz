# project_politic — Thai parliament voting data viz

แต่ละพรรคโหวตมติในสภายังไงบ้าง (2020–2025) ข้อมูลจาก [Politigraph (WeVis)](https://politigraph.wevis.info/docs)
ต่อยอดจาก Observable notebook [@politigraphtest/rada_leela](https://observablehq.com/@politigraphtest/rada_leela)

## โครงสร้าง

| path | คืออะไร |
|---|---|
| `site/` | หน้าเว็บที่ deploy ขึ้น GitHub Pages (Observable runtime + notebook module + data) |
| `site/files/12f39e…csv` | `parliament_trans.csv` ข้อมูลโหวต 107,826 แถว (ชื่อไฟล์เป็น hash ตามที่ notebook อ้างอิง) |
| `observable/rada_leela/` | export ดิบจาก Observable (`rada_leela_source.js` = โค้ดทุก cell) |
| `notebooks/` | Python notebooks สำหรับ EDA / เตรียมข้อมูล |
| `data/` | ข้อมูล raw/processed (ไม่ commit) |
| `.github/workflows/deploy-pages.yml` | GitHub Action: push `main` ที่แก้ `site/**` แล้ว deploy อัตโนมัติ |

## รันในเครื่อง

```bash
cd site && python3 -m http.server 8000
```

แล้วเปิด http://localhost:8000

## Deploy

1. push repo นี้ขึ้น GitHub
2. Settings → Pages → Source: **GitHub Actions**
3. push เข้า `main` แล้ว workflow จะ deploy ให้ เว็บอยู่ที่ `https://<user>.github.io/<repo>/`

## Dataset columns

`classification` (MP_1 / MP_3), `start_date`, `motion`, `motion_nickname`, `voter_party`,
`voter_option` (เห็นด้วย / ไม่เห็นด้วย / งดออกเสียง / ลา / ขาดลงมติ / ไม่ลงคะแนนเสียง),
`voter_name`, `motion_categories`, `creator_name`

180 ญัตติ · 1,340 ผู้ลงมติ · 46 พรรค/กลุ่ม · 2020-01-11 → 2025-10-21
