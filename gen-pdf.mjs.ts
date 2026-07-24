import fs from 'node:fs';
import path from 'node:path';

// Monkey-patch jsPDF.save to write file
const jspdfMod = await import('jspdf');
const JsPDFCtor: any = (jspdfMod as any).default || (jspdfMod as any).jsPDF;
JsPDFCtor.prototype.save = function(filename: string) {
  const ab = this.output('arraybuffer');
  const outPath = process.env.OUT_PATH || path.resolve('public/sample-audit-report.pdf');
  fs.writeFileSync(outPath, Buffer.from(ab));
  console.log('WROTE', outPath, 'pages=', this.internal.getNumberOfPages(), 'filename=', filename);
};

const { generateAnalysisPdf } = await import(path.resolve('src/lib/generatePdf.ts'));
const result = JSON.parse(fs.readFileSync('/tmp/result.json', 'utf8'));
console.log('scores:', result.summary?.overallScore, 'msg=', result.messaging?.score, 'seo=', result.seo?.score);
await generateAnalysisPdf(result, 'https://www.castellanocosmeticsurgery.com/');
