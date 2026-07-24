import fs from 'node:fs';
import path from 'node:path';
const jspdfMod = await import('jspdf');
const D: any = (jspdfMod as any).default;
D.API.save = function(filename: string) {
  const ab = this.output('arraybuffer');
  const outPath = path.resolve('public/sample-audit-report.pdf');
  fs.writeFileSync(outPath, Buffer.from(ab));
  console.log('WROTE', outPath, 'pages=', this.internal.getNumberOfPages(), 'filename=', filename);
};
const { generateAnalysisPdf } = await import(path.resolve('src/lib/generatePdf.ts'));
const result = JSON.parse(fs.readFileSync('/tmp/result.json', 'utf8'));
await generateAnalysisPdf(result, 'https://www.castellanocosmeticsurgery.com/');
