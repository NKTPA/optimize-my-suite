import fs from 'node:fs';
import path from 'node:path';

const jspdfMod = await import('jspdf');
const JsPDFCtor: any = (jspdfMod as any).default || (jspdfMod as any).jsPDF;
console.log('patched', typeof JsPDFCtor?.prototype?.save);
JsPDFCtor.prototype.save = function(filename: string) {
  const ab = this.output('arraybuffer');
  const outPath = path.resolve('public/sample-audit-report.pdf');
  fs.writeFileSync(outPath, Buffer.from(ab));
  console.log('WROTE', outPath, 'pages=', this.internal.getNumberOfPages());
  return this;
};

const { generateAnalysisPdf } = await import(path.resolve('src/lib/generatePdf.ts'));
const result = JSON.parse(fs.readFileSync('/tmp/result.json', 'utf8'));
try {
  await generateAnalysisPdf(result, 'https://www.castellanocosmeticsurgery.com/');
  console.log('done');
} catch (e) {
  console.error('ERR', e);
}
