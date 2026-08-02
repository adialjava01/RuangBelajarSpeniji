const line = '1,"Budi Santoso",10260,budi@smp.sch.id,VII-A,L';
const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
let match;
const parts = [];
while ((match = regex.exec(line)) !== null) {
  if (match.index === regex.lastIndex) regex.lastIndex++;
  parts.push((match[1] ?? match[2] ?? '').trim());
}
console.log(parts);

const line2 = '1,Budi,10260,budi@smp.sch.id,VII-A,L';
const parts2 = [];
let match2;
while ((match2 = regex.exec(line2)) !== null) {
  if (match2.index === regex.lastIndex) regex.lastIndex++;
  parts2.push((match2[1] ?? match2[2] ?? '').trim());
}
console.log(parts2);
