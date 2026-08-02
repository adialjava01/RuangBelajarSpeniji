const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');
code = code.replace(
  'import { Play, CheckCircle, Clock, Search, BookOpen, AlertCircle, FileText, ChevronRight, X, AlertTriangle, Send } from \'lucide-react\';',
  'import { Play, CheckCircle, Clock, Search, BookOpen, AlertCircle, FileText, ChevronRight, X, AlertTriangle, Send, Heart, MessageSquare } from \'lucide-react\';'
);
fs.writeFileSync('src/components/StudentPanel.tsx', code);
