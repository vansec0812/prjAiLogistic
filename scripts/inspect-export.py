import pymupdf as fitz
from pathlib import Path
pdf=fitz.open('output/qa/export.pdf')
texts=[]
for i,page in enumerate(pdf):
    page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(f'output/qa/pdf-page-{i+1}.png')
    texts.append(page.get_text())
text='\n'.join(texts)
assert 'Hướng dẫn đóng gói' in text
assert all(f'{i}.' in text for i in range(1,7))
assert 'Snapshot' in text
print(f'PDF: {len(pdf)} pages; six steps, Vietnamese text and pinned snapshot present.')
Path('output/qa/pdf-text.txt').write_text(text,encoding='utf-8')
