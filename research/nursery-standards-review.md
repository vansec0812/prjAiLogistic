# Nursery standards / postharvest review

Reviewed 2026-10-18 (Asia/Saigon). **UNREVIEWED** means read by an engineer, pending horticultural review. This note is a short paraphrase with locators, not a reproduced standard, approved SOP, training dataset, or published rule. No app, corpus, thresholds, SOP, or assets changed.

## AH-2025 — AmericanHort

- Primary [PDF](https://americanhort.org/wp-content/uploads/2026/02/nursery-stock-standards.pdf), 116 pages; [publisher landing page](https://americanhort.org/education/american-nursery-stock-standards/). Both accessible. PDF cover confirms **American Standard for Nursery Stock, ANSI Z60.2-2025**, approved April 17, 2025. Landing/Annex A also mention April 12: unresolved date inconsistency; retain cover metadata.
- Read: cover, copyright, Annex B (iv-v), §§1.1.3–1.2.2.3 (printed pp.1–7). Visually checked PDF pp.1–2,18,24–26. PDF p.24 = printed p.5.
- Rights: ©2025 AmericanHort; reproduction/retrieval requires written permission (PDF p.2). Training/indexing permission **NOT_CONFIRMED**. Full PDF kept only in temporary review storage, outside repository.

Candidate claims — all **UNREVIEWED**:

| ID | Paraphrase | Locator in linked PDF |
| --- | --- | --- |
| AH-M01 | Container-grown plant height starts at soil line; this excludes the container base. | §1.2.2.1, p.5 |
| AH-M02 | Spread is an average; leaf inclusion depends on plant type. | §1.2.2.1, p.5; Figure 2 |
| AH-M03 | Shrub/evergreen sizing can exclude tallest tips. | §§1.2.2.2–.3, pp.6–7 |
| AH-S01 | Scope is professional nursery-stock trade terminology, not retail-consumer transactions. | Annex B.A, p.iv (informative) |

## USDA-AH66-2016 — Terril A. Nell sections

- Primary [PDF](https://www.govinfo.gov/content/pkg/GOVPUB-A-PURL-gpo87416/pdf/GOVPUB-A-PURL-gpo87416.pdf), 792 pages; [GovInfo record](https://www.govinfo.gov/app/details/GOVPUB-A-PURL-gpo87416). HTTP download succeeded; web PDF parser failed. **The Commercial Storage of Fruits, Vegetables, and Florist and Nursery Stocks**, USDA-ARS Agriculture Handbook 66, revised February 2016; editors Gross, Wang, Saltveit.
- Fully read and rendered: **Flowering Potted Plants**, pp.722–724 (PDF732–734), Tables 1–2; **Foliage Plants**, pp.725–726 (PDF735–736), Table 1. Both authored by Terril A. Nell.
- Rights: p.iii states free Internet access; no training/image licence established. **NOT_CONFIRMED**. No full PDF committed.

Candidate claims — all **UNREVIEWED**:

| ID | Paraphrase | Locator in linked PDF |
| --- | --- | --- |
| UN-F01 | Cultivar, production conditions and shipping stresses affect flowering-plant quality; deterioration can appear after delivery. | p.722 |
| UN-F02 | Ethylene response varies with species, variety, concentration, temperature and exposure duration. | p.724, Table 2 footnote 1 |
| UN-L01 | Foliage guidance involves acclimatization and simulated dark transport. | p.725 |
| UN-L02 | Table 1 concerns acclimatized potted plants in refrigerated vans; blank duration entries mean unknown tolerance. | p.726, heading/footnotes 1–2 |

## PlantCare interpretation and questions for review

Các mục sau là suy luận thiết kế cần duyệt, không phải câu trích từ tài liệu:

- Tách rõ `plantHeightFromSoil` (đo thực vật) và `overallHeightFromPotBase` (chiều cao toàn bộ để xét không gian hộp). Không cộng thêm chiều cao chậu vào số đo đã bắt đầu từ đáy chậu. Cần hướng dẫn người đo chọn đúng mốc và chụp bằng chứng có thước.
- Không dùng average spread hoặc chiều cao thương mại thay kích thước bao ngoài lớn nhất để kiểm fit. Cây, lá, hoa, cọc, chậu và các phần nhô ra đều cần được xét trong tư thế vận chuyển thực. Đây là đề xuất vận hành; hai nguồn chưa xác nhận SOP đo kiện PlantCare.
- Không chuyển bảng nhiệt thương mại sang ngưỡng chung cho `FOLIAGE`/`FLOWERING`, mọi cultivar hay bưu kiện Việt Nam. Không coi nhiệt độ dự báo ngoài trời là nhiệt độ cây/khí trong kiện; không suy hướng dẫn thuốc xử lý từ tài liệu thành chỉ dẫn người dùng.
- Cần chuyên gia quyết định: loài/giống nào thuộc scope; mốc đo và phần nhô ra; tình trạng acclimatization; cách xác minh nhiệt độ trong kiện; giới hạn hành trình; tiêu chí kiểm lúc nhận và sau nhận. Cần publisher xác nhận quyền dùng corpus/ảnh/training trước khi sao chép hoặc index toàn văn.

## Reproducibility

Read-only review with `pypdf` extraction and `pypdfium2` page rendering; no PDF authoring. Relevant pages and all table footnotes inspected, not all 792/116 pages. Download SHA-256:

- AmericanHort: `d5c5d97700e57494bd0120c385f49e9632661ae52ced5acb3209d35d5d797b44`
- USDA: `2ff5d0b6dd5824d1dd7e30fd8182271b0a0abda8640c55fce2887d2c231e7f8c`

Neither source establishes approval of PlantCare rules, local carrier acceptance, packaging performance, or image accuracy. Numeric temperature tables were deliberately not transcribed into claims or engine configuration.
