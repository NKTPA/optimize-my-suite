import fs from 'node:fs';
import { generateAnalysisPdf } from '../src/lib/generatePdf';
import { jsPDF } from 'jspdf';

const OUT = '/dev-server/public/sample-audit-report.pdf';
(jsPDF as any).API.save = function() {
  const buf = Buffer.from(this.output('arraybuffer'));
  fs.writeFileSync(OUT, buf);
  console.log('WROTE', OUT, buf.length, 'bytes, pages=', this.internal.getNumberOfPages());
  return this;
};

const data = JSON.parse(fs.readFileSync('/tmp/sample/anon.json','utf8'));
await generateAnalysisPdf(data, 'https://www.lakeside-aesthetics.example.com/');
