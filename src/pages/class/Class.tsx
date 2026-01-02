import React, { useEffect, useState } from "react";
import MyBreadCrumb from "@/components/App_Components/MyBreadCrumb";
import { useParams, useNavigate } from "react-router-dom";
import { ClassData, getClassInfo, deleteClass, getClassDefaulters, Defaulter } from "@/api/class.service";
import { removeStudentFromClass, editStudent, addStudentToClass } from "@/api/student.service";
import { getClassName } from "@/utils/getClassName";
import { School, Info, Delete, Edit, AlertTriangle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { Label } from "@/components/ui/label";
import { Student } from "@/api/student.service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Class = () => {
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassData>();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [expandedDefaulterId, setExpandedDefaulterId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { id } = useParams();
  const navigate = useNavigate();

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);

  // Data States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form States
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [editStudentName, setEditStudentName] = useState("");

  const [editStudentRoll, setEditStudentRoll] = useState("");

  const fetchData = async () => {
    try {
      if (!id) return;
      // Don't set loading to true here to avoid full page flicker on refresh
      const [res, defaultersRes] = await Promise.all([
        getClassInfo(id),
        getClassDefaulters(id)
      ]);

      setClassInfo(res);
      setDefaulters(defaultersRes);

      // Preserve selected batch if it exists, otherwise select first
      if (res.batches?.length > 0 && !selectedBatchId) {
        setSelectedBatchId(res.batches[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch class info", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [id]);

  const handleAddStudent = async () => {
    if (!newStudentRoll) {
      toast.error("Student Roll No can't be empty");
      return;
    }
    if (!newStudentName) {
      toast.error("Student Name can't be empty");
      return;
    }

    try {
      await addStudentToClass(classInfo!._id, newStudentName, newStudentRoll);
      setNewStudentName("");
      setNewStudentRoll("");
      setIsAddOpen(false);
      fetchData();
      toast.success("Student added successfully");
    } catch (error) {
      toast.error("Failed to add student");
      console.error("Error adding student", error);
    }
  };

  const handleEditClick = (student: any) => {
    setSelectedStudent(student);
    setEditStudentName(student.name);
    setEditStudentRoll(student.roll_num.toString());
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedStudent) return;
    if (!editStudentRoll) {
      toast.error("Student Roll No can't be empty");
      return;
    }
    if (!editStudentName) {
      toast.error("Student Name can't be empty");
      return;
    }
    try {
      await editStudent(selectedStudent._id, editStudentName, editStudentRoll);
      setIsEditOpen(false);
      setSelectedStudent(null);
      fetchData();
      toast.success("Student edited successfully");
    } catch (error) {
      toast.error("Failed to edit student");
      console.error("Error editing student", error);
    }
  };

  const handleDeleteClick = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    try {
      await removeStudentFromClass(selectedStudent._id);
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
      toast.success("Student deleted successfully");
    } catch (error) {
      toast.error("Failed to delete student");
      console.error("Error deleting student", error);
    }
  };

  const handleDeleteClass = async () => {
    if (!classInfo?._id) return;
    try {
      await deleteClass(classInfo._id);
      setIsDeleteClassOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting class", error);
    }
  };

  if (loading || !classInfo) {
    return <h1>Loading...</h1>;
  }

  const currentBatch = classInfo.batches.find((b) => b._id === selectedBatchId);

  const filteredStudents = currentBatch?.students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.roll_num.toString().includes(term) ||
      student.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <MyBreadCrumb />

      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <School className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">
              {getClassName(
                classInfo.year,
                classInfo.branch.abbrivation,
                classInfo.division
              )}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {classInfo.branch.name} • {classInfo.year} Year • Div {classInfo.division}
            </p>
          </div>
        </div>
        <div>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteClassOpen(true)}
          >
            Delete Class
          </Button>
        </div>
      </div>

      <Card className="min-h-[600px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Management</CardTitle>
              <CardDescription>Manage students and view attendance reports.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="students">Students List</TabsTrigger>
              <TabsTrigger value="defaulters">Defaulters List</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Students</h3>
                  <Badge variant="secondary">{currentBatch?.students.length || 0} Students</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedBatchId}
                    onValueChange={(value) => setSelectedBatchId(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {classInfo.batches.map((batch) => (
                        <SelectItem key={batch._id} value={batch._id}>
                          {batch.name} ({batch.from}-{batch.to})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="ml-2 bg-primary text-primary-foreground"
                    onClick={() => setIsAddOpen(true)}
                  >
                    Add Student
                  </Button>

                  <Input
                    placeholder="Search students..."
                    className="w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents?.length ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">{student.roll_num}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(student)}>
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(student)}>
                              <Delete className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No students found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="defaulters" className="mt-4 space-y-4">
              <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-medium">Attendance Alert</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  The following students have less than 75% aggregate attendance. Click on a row to view detailed breakdown.
                </p>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Conducted</TableHead>
                      <TableHead>Total Present</TableHead>
                      <TableHead className="text-right">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaulters.length > 0 ? (
                      defaulters.map((student) => (
                        <React.Fragment key={student._id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedDefaulterId(expandedDefaulterId === student._id ? null : student._id)}
                          >
                            <TableCell>
                              {expandedDefaulterId === student._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </TableCell>
                            <TableCell className="font-medium">{student.roll_num}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.totalConducted}</TableCell>
                            <TableCell>{student.totalPresent}</TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              {student.percentage}%
                            </TableCell>
                          </TableRow>
                          {expandedDefaulterId === student._id && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={6} className="p-4">
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Conducted</TableHead>
                                        <TableHead>Present</TableHead>
                                        <TableHead>Percentage</TableHead>
                                        <TableHead>Absent Info</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {student.details?.map((stat, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">
                                            {stat.subjectName}
                                            <span className="text-xs text-muted-foreground block">{stat.subjectCode}</span>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="capitalize">{stat.type}</Badge>
                                          </TableCell>
                                          <TableCell>{stat.conducted}</TableCell>
                                          <TableCell>{stat.present}</TableCell>
                                          <TableCell>
                                            <span className={stat.percentage < 75 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                              {stat.percentage}%
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            {stat.absentDates.length > 0 ? (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Badge variant="secondary" className="cursor-help gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {stat.absentDates.length} Days Absent
                                                  </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px]">
                                                  <p className="font-medium mb-2">Absent Dates:</p>
                                                  <div className="flex flex-wrap gap-2">
                                                    {stat.absentDates.map((date, i) => (
                                                      <span key={i} className="text-xs bg-primary bg-muted px-1.5 py-0.5 rounded">
                                                        {new Date(date).toLocaleDateString()}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            ) : (
                                              <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No defaulters found! One happy class 🎉
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the details of the student to add to this class.
              <br />
              <span className="text-muted-foreground">
                Batch will be selected automatically based on the roll number.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left">
                Name:
              </Label>
              <Input
                id="name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roll" className="text-left">
                Roll No:
              </Label>
              <Input
                id="roll"
                value={newStudentRoll}
                onChange={(e) => setNewStudentRoll(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddStudent}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update the student&apos;s information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-roll" className="text-right">
                Roll No:
              </Label>
              <Input
                id="edit-roll"
                value={editStudentRoll}
                onChange={(e) => setEditStudentRoll(e.target.value)}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name:
              </Label>
              <Input
                id="edit-name"
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete the student{" "}
            <span className="font-semibold text-foreground">
              {selectedStudent?.name}
            </span>{" "}
            from this class.
          </>
        }
        verificationText={selectedStudent?.name || ""}
        onConfirm={handleDeleteConfirm}
      />

      {/* Delete Class Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteClassOpen}
        onOpenChange={setIsDeleteClassOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This action cannot be undone. This will permanently delete the class{" "}
            <span className="font-semibold text-foreground">
              {classInfo && getClassName(
                classInfo.year,
                classInfo.branch.abbrivation,
                classInfo.division
              )}
            </span>{" "}
            and all its associated data.
          </>
        }
        verificationText={
          classInfo
            ? getClassName(
              classInfo.year,
              classInfo.branch.abbrivation,
              classInfo.division
            )
            : ""
        }
        onConfirm={handleDeleteClass}
      />
    </div >
  );
};

export default Class;
