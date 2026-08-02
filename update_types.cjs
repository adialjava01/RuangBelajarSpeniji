const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const target = `export interface NeedsAssessment {
  id: string;
  studentNis: string;
  academicScore: number; // 1-5
  socialScore: number; // 1-5
  familyScore: number; // 1-5
  careerScore: number; // 1-5
  createdAt: string;
}`;

const replacement = `export interface NeedsAssessment {
  id: string;
  studentNis: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  q11: number;
  q12: number;
  q13: number;
  q14: number;
  q15: number;
  q16: number;
  essayEmotion: string;
  essaySocial: string;
  essayAcademic: string;
  essayCareer: string;
  createdAt: string;
}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/types.ts', code);
