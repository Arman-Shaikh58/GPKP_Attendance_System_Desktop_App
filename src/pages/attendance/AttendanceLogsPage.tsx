import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAttendanceLogs,
  deleteAttendanceLog,
  updateAttendanceLog,
  AttendanceData,
} from "@/api/attendance.service";
import {
  getStudentsByClass,
  getStudentsByBatch,
  Student,
} from "@/api/student.service";
import AbsenteeInput from "@/components/attendance/AbsenteeInput";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

export default function AttendanceLogsTable() {
  const [logs, setLogs] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const { subjectId, subjectName } = useParams();
  const [editingLog, setEditingLog] = useState<AttendanceData | null>(null);
  const [editStudents, setEditStudents] = useState<Student[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editAbsentees, setEditAbsentees] = useState<string[]>([]);
  const [editFromHour, setEditFromHour] = useState("09");
  const [editFromMinute, setEditFromMinute] = useState("00");
  const [editToHour, setEditToHour] = useState("10");
  const [editToMinute, setEditToMinute] = useState("00");

  const [loadingEditStudents, setLoadingEditStudents] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [subjectId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAttendanceLogs(subjectId);
      setLogs(data);
    } catch (error) {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAttendanceLog(deletingId);
      toast.success("Log deleted successfully");
      fetchLogs();
    } catch (error) {
      toast.error("Failed to delete log");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = async (log: AttendanceData) => {
    setEditingLog(log);
    setEditDate(new Date(log.date));
    setEditAbsentees([...log.absentees]);

    // Parse timeslot
    const from = log.timeslot.from.toFixed(2).split(".");
    const to = log.timeslot.to.toFixed(2).split(".");
    setEditFromHour(from[0].padStart(2, "0"));
    setEditFromMinute(from[1].padEnd(2, "0"));
    setEditToHour(to[0].padStart(2, "0"));
    setEditToMinute(to[1].padEnd(2, "0"));

    setIsEditOpen(true);

    // Fetch students for this log context
    setLoadingEditStudents(true);
    try {
      let data: Student[] = [];
      // We use the batch_id from the log if available (and if it's an object populated or string)
      const batchId =
        typeof log.batch_id === "object"
          ? (log.batch_id as any)._id
          : log.batch_id;

      if (log.a_type === "practical" && batchId) {
        data = await getStudentsByBatch(batchId);
      } else if (log.class_id) {
        // If the log response has class_id populated/available
        data = await getStudentsByClass(log.class_id);
      } else {
        // Fallback: If class_id missing in log, we might need to fetch subject details again or assume passed subjectId has it.
        // For now, assuming backend sends class_id in log as modelled.
        toast.error("Cannot load students: missing class info");
      }
      setEditStudents(data);
    } catch (e) {
      toast.error("Failed to load students for editing");
    } finally {
      setLoadingEditStudents(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingLog?._id || !editDate) return;

    setUpdating(true);
    try {
      const fromTime = parseFloat(
        `${parseInt(editFromHour)}.${editFromMinute}`
      );
      const toTime = parseFloat(`${parseInt(editToHour)}.${editToMinute}`);

      await updateAttendanceLog(editingLog._id, {
        date: editDate,
        absentees: editAbsentees,
        timeslot: { from: fromTime, to: toTime },
      });

      toast.success("Log updated successfully");
      setIsEditOpen(false);
      fetchLogs();
    } catch (error) {
      toast.error("Failed to update log");
    } finally {
      setUpdating(false);
    }
  };

  // Helper for times
  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    return {
      label: h.toString().padStart(2, "0"),
      value: h.toString().padStart(2, "0"),
    };
  });
  const minutes = [
    { label: "00", value: "00" },
    { label: "30", value: "30" },
  ];

  return (
    <div className="p-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-accent-foreground">
          <span className="text-bold">Subject:</span>{" "}
          {subjectName ?? "Attendance Logs"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Attendance records for this subject
        </p>
      </div>

      <div className="space-y-4">
        <Table>
          <TableCaption>
            {logs.length === 0
              ? "No logs found."
              : "Recent attendance records."}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Absentees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-4 text-muted-foreground"
                >
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium text-accent-foreground ">
                    {format(new Date(log.date), "PPP")}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.date), "EEE")}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-accent-foreground">{log.a_type}</TableCell>
                  <TableCell className="text-accent-foreground">
                    {typeof log.batch_id === "object"
                      ? (log.batch_id as any).name
                      : log.batch_id
                        ? "Batch " + log.batch_id.slice(-4)
                        : "-"}
                  </TableCell>
                  <TableCell className="flex gap-0.5">
                    <TooltipProvider>
                      <div className="flex flex-wrap gap-1">
                        {log.absentees.slice(0, 2).map((rollNo) => (
                          <p
                            key={rollNo}
                            className="bg-red-200 px-2 py-0.5 rounded-full border border-red-400 dark:border-red-800 dark:bg-red-500 dark:text-black text-xs"
                          >
                            {rollNo}
                          </p>
                        ))}
                        {log.absentees.length == 0 && (
                            <p className=" bg-green-200 px-2 rounded-full border border-green-500">
                                All students where present
                            </p>
                        )}
                        {log.absentees.length > 2 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="cursor-pointer bg-red-100 px-2 py-0.5 rounded-full border border-red-300 text-xs font-medium">
                                +{log.absentees.length - 2}
                              </p>
                            </TooltipTrigger>

                            <TooltipContent className="max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {log.absentees.map((rollNo) => (
                                  <span
                                    key={rollNo}
                                    className="bg-red-400 px-2 py-0.5 rounded-full border border-red-400 text-xs"
                                  >
                                    {rollNo}
                                  </span>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(log)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(log._id!)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {subjectId
                    ? "No attendance records found for this subject."
                    : "Select a subject to view logs."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deletingId}
          onOpenChange={() => setDeletingId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-accent-foreground">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                attendance record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-accent-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}  >
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-accent-foreground">Edit Attendance</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4 text-accent-foreground">
              <div className="space-y-2 ">
                <label className="text-sm font-medium">Date</label>
                <div className=" rounded-md p-2  flex flex-col justify-center items-center">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={setEditDate}
                    initialFocus
                    className="border rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time Slot
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1 items-center">
                    <Select
                      value={editFromHour}
                      onValueChange={setEditFromHour}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">:</span>
                    <Select
                      value={editFromMinute}
                      onValueChange={setEditFromMinute}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-muted-foreground font-medium">to</span>
                  <div className="flex-1 flex gap-1 items-center">
                    <Select value={editToHour} onValueChange={setEditToHour}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">:</span>
                    <Select
                      value={editToMinute}
                      onValueChange={setEditToMinute}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {minutes.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Absentees</label>
                {loadingEditStudents ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                    students...
                  </div>
                ) : (
                  <AbsenteeInput
                    students={editStudents}
                    absentees={editAbsentees}
                    onAddAbsentee={(roll) =>
                      !editAbsentees.includes(roll) &&
                      setEditAbsentees([...editAbsentees, roll])
                    }
                    removeAbsentee={(roll) =>
                      setEditAbsentees(editAbsentees.filter((a) => a !== roll))
                    }
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="text-accent-foreground" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
