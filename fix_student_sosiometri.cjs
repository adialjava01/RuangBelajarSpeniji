const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  "  const [showSosiometriForm, setShowSosiometriForm] = useState(false);\n  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);\n  const [showKarirForm, setShowKarirForm] = useState(false);",
  "  const [showSosiometriForm, setShowSosiometriForm] = useState(false);\n  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);\n  const mySociometry = sociometries.find(s => s.studentNis === currentStudent.nis);\n  useEffect(() => {\n    if (showSosiometriForm) {\n      setSelectedFriends(mySociometry?.friendsWith || []);\n    }\n  }, [showSosiometriForm, mySociometry]);\n  const [showKarirForm, setShowKarirForm] = useState(false);"
);

// Replace the submit handler for sociometry to update if it exists
code = code.replace(
  "                      if (onAddSociometry) {\n                        onAddSociometry({\n                          studentNis: currentStudent.nis,\n                          classId: currentStudent.classId,\n                          friendsWith: selectedFriends\n                        });\n                      }\n                      setShowSosiometriForm(false);\n                      toast.success('Sosiometri Berhasil Disimpan!');",
  "                      if (mySociometry && onUpdateSociometry) {\n                        onUpdateSociometry(mySociometry.id, { friendsWith: selectedFriends });\n                        toast.success('Pilihan Teman Berhasil Diperbarui!');\n                      } else if (onAddSociometry) {\n                        onAddSociometry({\n                          studentNis: currentStudent.nis,\n                          classId: currentStudent.classId,\n                          friendsWith: selectedFriends\n                        });\n                        toast.success('Sosiometri Berhasil Disimpan!');\n                      }\n                      setShowSosiometriForm(false);"
);

// Also add a delete button if it already exists
code = code.replace(
  "                  <button onClick={() => setShowSosiometriForm(false)} className=\"px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition\">\n                    Batal\n                  </button>",
  "                  {mySociometry && onDeleteSociometry && (\n                    <button \n                      onClick={() => {\n                        if (window.confirm('Hapus data sosiometrimu?')) {\n                          onDeleteSociometry(mySociometry.id);\n                          setShowSosiometriForm(false);\n                          toast.success('Data Sosiometri Dihapus!');\n                        }\n                      }} \n                      className=\"mr-auto px-5 py-2.5 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition\">\n                      Hapus Data\n                    </button>\n                  )}\n                  <button onClick={() => setShowSosiometriForm(false)} className=\"px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition\">\n                    Batal\n                  </button>"
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
