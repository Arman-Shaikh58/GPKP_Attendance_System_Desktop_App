import React, { useEffect, useState } from "react";
import MyBreadCrumb from "@/components/App_Components/MyBreadCrumb";
import { useParams, useNavigate } from "react-router-dom";
import { ClassData, getClassInfo, deleteClass } from "@/api/class.service";
import { removeStudentFromClass, editStudent, addStudentToClass } from "@/api/student.service";
import { getClassName } from "@/utils/getClassName";
import { School, Info, RemoveFormattingIcon, Delete, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Student } from "@/api/student.service";
import { toast } from "sonner";

const Class = () => {
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassData>();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
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
      // Don't set loading to true here to avoid full page flicker on refresh
      const res = await getClassInfo(id);
      setClassInfo(res);

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
      await addStudentToClass(classInfo._id, newStudentName, newStudentRoll);
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

      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <School className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">Class Details</h1>
          <p className="text-muted-foreground">Manage students and class information.</p>
        </div>
        <div className="ml-auto">
          <Button
            variant="destructive"
            onClick={() => setIsDeleteClassOpen(true)}
          >
            Delete Class
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Class Info Card - Takes 1 column on wide screens, full on mobile */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-muted-foreground" />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class Name</p>
              <h2 className="text-2xl font-bold">
                {getClassName(
                  classInfo.year,
                  classInfo.branch.abbrivation,
                  classInfo.division
                )}
              </h2>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Branch</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium underline decoration-dotted underline-offset-4 cursor-help">
                      {classInfo.branch.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Code: {classInfo.branch.code}</p>
                    <p>Abbr: {classInfo.branch.abbrivation}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Year</p>
                <p className="font-medium">{classInfo.year} Year</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Division</p>
                <p className="font-medium">{classInfo.division}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List - Takes 2 columns */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Students</CardTitle>
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
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.length ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.roll_num}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="flex gap-2">
                        <Delete
                          onClick={() => handleDeleteClick(student)}
                          className="text-red-600 h-5 w-5 cursor-pointer hover:opacity-80"
                        />
                        <Edit
                          onClick={() => handleEditClick(student)}
                          className="text-primary h -5 w-5 cursor-pointer hover:opacity-80"
                        />

                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student{" "}
              <span className="font-semibold text-foreground">
                {selectedStudent?.name}
              </span>{" "}
              from this class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Class Confirmation Dialog */}
      <AlertDialog open={isDeleteClassOpen} onOpenChange={setIsDeleteClassOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class{" "}
              <span className="font-semibold text-foreground">
                {classInfo && getClassName(
                  classInfo.year,
                  classInfo.branch.abbrivation,
                  classInfo.division
                )}
              </span>{" "}
              and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default Class;
