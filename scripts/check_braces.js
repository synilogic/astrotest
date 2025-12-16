import fs from 'fs';
const file = './html/welcome/welcomeController.js';
const s = fs.readFileSync(file,'utf8');
const lines = s.split(/\r?\n/);
let balance = 0;
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  const open = (line.match(/{/g) || []).length;
  const close = (line.match(/}/g) || []).length;
  balance += open - close;
  if (balance < 0) {
    console.log(`Balance went negative at line ${i+1}: ${line}`);
    break;
  }
}
console.log('Final balance:', balance);