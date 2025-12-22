import React, { useEffect, useState } from 'react';
import { getTeacherSubjects, Subject } from '@/api/subject.service';
import { getBatchesByClass, Batch } from '@/api/batch.service';
import { getStudentsByClass, getStudentsByBatch, Student } from '@/api/student.service';
import { markAttendance } from '@/api/attendance.service';
import AbsenteeInput from '@/components/attendance/AbsenteeInput';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns"
import { Calendar as CalendarIcon, BookOpen, Users, Clock, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getClassName } from '@/utils/getClassName';


export default function Attendance() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [attendanceType, setAttendanceType] = useState<'lecture' | 'practical'>('lecture');

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [fromHour, setFromHour] = useState<string>('09');
  const [fromMinute, setFromMinute] = useState<string>('00');

  const [toHour, setToHour] = useState<string>('10');
  const [toMinute, setToMinute] = useState<string>('00');

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [absentees, setAbsentees] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (attendanceType === 'practical' && selectedSubject) {
      const subject = subjects.find(s => s._id === selectedSubject);
      if (subject) {
        fetchBatches(subject.class_id);
      }
    } else {
      setBatches([]);
      setSelectedBatch(''); // Clear batch if switching to lecture
    }
  }, [attendanceType, selectedSubject]);

  useEffect(() => {
    setAbsentees([]);
    setStudents([]);

    const fetchStudentData = async () => {
      if (!selectedSubject) return;

      setLoadingStudents(true);
      try {
        if (attendanceType === 'lecture') {
          const subject = subjects.find(s => s._id === selectedSubject);
          if (subject) {
            const data = await getStudentsByClass(subject.class_id);
            setStudents(data);
          }
        } else if (attendanceType === 'practical' && selectedBatch) {
          const data = await getStudentsByBatch(selectedBatch);
          setStudents(data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load students");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentData();

  }, [selectedSubject, selectedBatch, attendanceType]);


  const fetchSubjects = async () => {
    try {
      const data = await getTeacherSubjects();
      setSubjects(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchBatches = async (classId: string) => {
    setLoadingBatches(true);
    try {
      const data = await getBatchesByClass(classId);
      setBatches(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleAddAbsentee = (rollNum: string) => {
    if (!absentees.includes(rollNum)) {
      setAbsentees([...absentees, rollNum]);
    }
  };

  const handleRemoveAbsentee = (rollNum: string) => {
    setAbsentees(absentees.filter(a => a !== rollNum));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }
    if (attendanceType === 'practical' && !selectedBatch) {
      toast.error("Please select a batch");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    setSubmitting(true);
    try {
      const fromTime = parseFloat(`${parseInt(fromHour)}.${fromMinute}`);
      const toTime = parseFloat(`${parseInt(toHour)}.${toMinute}`);

      await markAttendance({
        subject_id: selectedSubject,
        a_type: attendanceType,
        batch_id: selectedBatch || undefined,
        absentees,
        date,
        timeslot: {
          from: fromTime,
          to: toTime
        }
      });

      toast.success("Attendance marked successfully!");
      setAbsentees([]);

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    return { label: h.toString().padStart(2, '0'), value: h.toString().padStart(2, '0') };
  });

  const minutes = [
    { label: '00', value: '00' },
    { label: '30', value: '30' },
  ];



  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">Attendance</h1>
          <p className="text-muted-foreground">Mark attendance for your class or practical sessions.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 w-full">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className='w-full'>
                  {subjects.map((sub) => (
                    <SelectItem key={sub._id} value={sub._id}>{sub.name} - {getClassName(sub.year, sub.branch_abbrivation, sub.division)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setAttendanceType('lecture')}
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${attendanceType === 'lecture' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                >
                  Lecture
                </button>
                <button
                  onClick={() => setAttendanceType('practical')}
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${attendanceType === 'practical' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                >
                  Practical
                </button>
              </div>
            </div>

            {attendanceType === 'practical' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="text-sm font-medium">Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={loadingBatches}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBatches ? "Loading batches..." : "Select Batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch._id} value={batch._id}>{batch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full pl-3 text-left font-normal ${!date && "text-muted-foreground"}`}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-auto p-0" >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time Slot
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1 items-center">
                  <Select value={fromHour} onValueChange={setFromHour}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{hours.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <span className="text-muted-foreground">:</span>
                  <Select value={fromMinute} onValueChange={setFromMinute}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{minutes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <span className="text-muted-foreground font-medium">to</span>
                <div className="flex-1 flex gap-1 items-center">
                  <Select value={toHour} onValueChange={setToHour}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{hours.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <span className="text-muted-foreground">:</span>
                  <Select value={toMinute} onValueChange={setToMinute}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{minutes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Students
              </CardTitle>
              <CardDescription>
                {loadingStudents ? "Loading..." : selectedSubject ? `Total Students: ${students.length}` : "Select a subject to view students"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2 text-sm font-medium">
                      <span className="text-primary">Present: {students.length - absentees.length}</span>
                      <span className="text-red-500">Absent: {absentees.length}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${((students.length - absentees.length) / students.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <AbsenteeInput
                    students={students}
                    absentees={absentees}
                    onAddAbsentee={handleAddAbsentee}
                    removeAbsentee={handleRemoveAbsentee}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50 border-2 border-dashed rounded-xl">
                  <Users className="w-12 h-12 mb-2" />
                  <p>No students loaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          className="w-full md:w-auto min-w-[200px]"
          onClick={handleSubmit}
          disabled={submitting || students.length === 0}
        >
          {submitting ? "Submitting..." : "Submit Attendance"}
        </Button>
      </div>


    </div>
  );
}