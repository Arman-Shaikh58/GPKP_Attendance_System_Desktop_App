import React, { useEffect, useState } from 'react';
import { getTeacherSubjects, createSubject, deleteSubject, Subject as ISubject } from '@/api/subject.service';
import { getClassesinfo, IClassInfo } from '@/api/class.service';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAttendanceExportData, getPracticalAttendanceExportData } from '@/api/attendance.service';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getClassName } from '@/utils/getClassName';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { useNavigate } from 'react-router-dom';

export default function Subject() {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [classes, setClasses] = useState<IClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', abbrivation: '', class_id: '' });
  const [creating, setCreating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Export State
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'lecture' | 'practical'>('lecture');
  const [isExportPending, setIsExportPending] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsData, classesData] = await Promise.all([
        getTeacherSubjects(true),
        getClassesinfo()
      ]);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.abbrivation || !newSubject.class_id) {
      toast.error("Please fill all required fields");
      return;
    }
    setCreating(true);
    try {
      await createSubject(newSubject);
      toast.success("Subject created successfully");
      setIsAddOpen(false);
      setNewSubject({ name: '', code: '', abbrivation: '', class_id: '' });
      fetchData();
    } catch (error) {
      toast.error("Failed to create subject");
    } finally {
      setCreating(false);
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteSubject(deletingId);
      toast.success("Subject deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete subject");
    } finally {
      setDeletingId(null);
    }
  }

  const handleExport = async () => {
    if (!exportingId) return;
    const subject = subjects.find(s => s._id === exportingId);
    if (!subject) return;

    setIsExportPending(true);
    try {
      const fileName = `Attendance_${subject.name}_${new Date().getTime()}.xlsx`;
      let wb = XLSX.utils.book_new();

      if (exportType === 'practical') {
        const data = await getPracticalAttendanceExportData(subject._id);

        data.batches.forEach(batch => {
          const ws_data: any[][] = [];
          const batchStudents = data.students.filter(s => s.batch_id === batch._id);
          const batchLogs = data.logs.filter(l => l.batch_id === batch._id);

          // Row 1: Title
          ws_data.push(["Government Polytechnic Kolhapur"]);

          // Row 2: Subtitle
          ws_data.push([`${data.subject.branchName} AY 20__-__ (____ TERM)`]);

          // Row 3: Class Details
          const className = getClassName(subject.year || 0, subject.branch_abbrivation || '', subject.division || '');
          ws_data.push([
            `Class : ${className} (${batch.name})`,
            "",
            `Course : ${data.subject.name}`,
            "", "",
            `Course Code: ${data.subject.code}`,
            "",
            `Course Teacher: - __________`,
            "",
            "Practical"
          ]);

          // Row 4: Headers + Dates
          const dateStrings = batchLogs.map(d => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          });
          ws_data.push(["SR NO", "ROLLNO", "NAME OF STUDENT", ...dateStrings]);

          // Row 5: Columns (Indices)
          const lectureIndices = batchLogs.map((_, i) => (i + 1).toString());
          ws_data.push(["", "", "", ...lectureIndices]);

          // Row 6+: Students
          batchStudents.forEach((student, index) => {
            let presentCount = 0;
            const row = [
              (index + 1).toString(),
              student.roll_num,
              student.name,
              ...batchLogs.map(d => {
                const isAbsent = d.absentees.includes(student.roll_num);
                if (isAbsent) {
                  presentCount++;
                  return presentCount.toString();
                } else {
                  return presentCount.toString();
                }
              })
            ];
            ws_data.push(row);
          });

          const ws = XLSX.utils.aoa_to_sheet(ws_data);

          // Merges
          const totalCols = 3 + batchLogs.length;
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Row 1 Title
            { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Row 2 Subtitle
            { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // SR NO span
            { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // ROLLNO span
            { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // NAME span
          ];

          XLSX.utils.book_append_sheet(wb, ws, batch.name);
        });

      } else {
        // Lecture Logic
        const data = await getAttendanceExportData(subject._id);

        const ws_data: any[][] = [];

        // Row 1: Title
        ws_data.push(["Government Polytechnic Kolhapur"]);

        // Row 2: Subtitle
        ws_data.push([`${data.subject.branchName} AY 20__-__ (____ TERM)`]);


        // Row 3: Class Details
        const className = getClassName(subject.year || 0, subject.branch_abbrivation || '', subject.division || '');
        ws_data.push([
          `Class : ${className}`,
          "",
          `Course : ${data.subject.name}`,
          "", "",
          `Course Code: ${data.subject.code}`,
          "",
          `Course Teacher: -`,
          "",
          "Theory"
        ]);

        // Row 4: Headers + Dates
        const dateStrings = data.dates.map(d => {
          const date = new Date(d.date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        ws_data.push(["SR NO", "ROLLNO", "NAME OF STUDENT", ...dateStrings]);

        // Row 5: Columns (Indices)
        const lectureIndices = data.dates.map((_, i) => (i + 1).toString());
        ws_data.push(["", "", "", ...lectureIndices]);

        // Row 6+: Students
        data.students.forEach((student, index) => {
          let presentCount = 0;
          const row = [
            (index + 1).toString(),
            student.roll_num,
            student.name,
            ...data.dates.map(d => {
              const status = student.attendance[d._id];
              if (status === 'P') {
                presentCount++;
                return presentCount.toString();
              } else if (status === 'A') {
                return presentCount.toString();
              } else {
                return "-";
              }
            })
          ];
          ws_data.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Merges
        const totalCols = 3 + data.dates.length;

        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Row 1 Title
          { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Row 2 Subtitle
          { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // SR NO span
          { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // ROLLNO span
          { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // NAME span
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      }

      XLSX.writeFile(wb, fileName);
      toast.success("Attendance exported successfully");
      setExportingId(null);

    } catch (e) {
      console.error(e);
      toast.error("Failed to export attendance");
    } finally {
      setIsExportPending(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject?.branch_abbrivation && subject.branch_abbrivation.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (subject?.abbrivation && subject.abbrivation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">Dashboard & Subjects</h1>
            <p className="text-muted-foreground">Manage your classes and attendances.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search subjects..."
              className="w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2"><Plus className="w-5 h-5" /> Add New Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='text-accent-foreground'>Add New Subject</DialogTitle>
                <DialogDescription>
                  Enter the details for the new subject below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2 text-accent-foreground">
                  <Label>Subject Name</Label>
                  <Input
                    placeholder="e.g. Data Structures"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-accent-foreground">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      placeholder="e.g. 22316"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 ">
                    <Label>Abbreviation</Label>
                    <Input
                      placeholder="e.g. DSU"
                      value={newSubject.abbrivation}
                      onChange={(e) => setNewSubject({ ...newSubject, abbrivation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-accent-foreground">
                  <Label>Class</Label>
                  <Select value={newSubject.class_id} onValueChange={(val) => setNewSubject({ ...newSubject, class_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.year} Year {cls.division} - {cls.branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className='text-accent-foreground' onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create Subject"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Sr. No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading subjects...</TableCell></TableRow>
              ) : filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => (
                  <TableRow key={subject._id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/attendance-logs/${subject._id}/${subject.name}`)}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                        {subject.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subject.abbrivation && (
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                          {subject.abbrivation}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {getClassName(subject.year || 0, subject.branch_abbrivation || '', subject.division || '')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setExportingId(subject._id); }}>
                        <Download className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingId(subject._id); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No subjects found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={!!exportingId} onOpenChange={(open) => !open && setExportingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Attendance</DialogTitle>
            <DialogDescription>
              Select the type of attendance to export for "{subjects.find(s => s._id === exportingId)?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Attendance Type</Label>
              <Select value={exportType} onValueChange={(val: any) => setExportType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture / Theory</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportingId(null)}>Cancel</Button>
            <Button onClick={handleExport} disabled={isExportPending}>
              {isExportPending ? "Exporting..." : "Export Excel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Are you sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete the subject "{subjects.find(s => s._id === deletingId)?.name}".
          </>
        }
        verificationText={subjects.find(s => s._id === deletingId)?.name || ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}