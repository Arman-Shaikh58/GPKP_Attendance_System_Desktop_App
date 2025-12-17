import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import logo from "../../assets/images/logo-invert.png";
import apiClient from "../../api/axios";
import { getYearLabel } from "../../utils/returnYear";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MyBreadCrumb from "@/components/App_Components/MyBreadCrumb";

interface Branch {
  _id: string;
  code: string;
  abbrivation: string;
  name: string;
}

interface Student {
  rollNumber: string | number;
  name: string;
}

interface Batch {
  name: string;
  from: string | number;
  to: string | number;
}

const CreateClass = () => {
  const navigate = useNavigate();
  const [branchData, setBranchData] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    class_name: "",
    year: new Date().getFullYear(),
    division: "A",
    branch: "",
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentBatch, setCurrentBatch] = useState<Batch>({
    name: "",
    from: "",
    to: "",
  });
  const [loading, setLoading] = useState(false);

  const getBranches = async () => {
    try {
      const res = await apiClient.get(`/branch/get-branches`);

      if (res.data.success) {
        setBranchData(res.data.branches);
      }
    } catch (error: any) {
      console.error("Error Loading branches:", error);
      toast.error(error.response?.data?.message || "Failed to load branches");
    }
  };
  useEffect(() => {
    getBranches();
  }, []);

  useEffect(() => {
    const selectedBranch = branchData.find((b) => b._id === formData.branch);

    const branchAbbr = selectedBranch?.abbrivation || "Select Branch";
    const division = formData.division || "Select Division";
    const year = getYearLabel(formData.year).toUpperCase() || "Year";

    // Final classname logic (progressive)
    const autoClassName = `${year} - ${branchAbbr} - ${division}`;

    setFormData((prev) => ({ ...prev, class_name: autoClassName }));
  }, [formData.branch, formData.division, formData.year]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" ? parseInt(value) || "" : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentBatch((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchSelectChange = (name: string, value: string) => {
    setCurrentBatch((prev) => ({ ...prev, [name]: value }));
  };

  const addBatch = () => {
    if (!currentBatch.name || !currentBatch.from || !currentBatch.to) {
      toast.error("Please fill all batch fields");
      return;
    }

    const newFrom = parseInt(String(currentBatch.from));
    const newTo = parseInt(String(currentBatch.to));

    if (newFrom > newTo) {
      toast.error("Start roll number cannot be greater than end roll number");
      return;
    }

    const isOverlap = batches.some((batch) => {
      const from = parseInt(String(batch.from));
      const to = parseInt(String(batch.to));

      // If ranges overlap
      return newFrom <= to && newTo >= from;
    });

    if (isOverlap) {
      toast.error("Batch range overlaps with an existing batch!");
      return;
    }

    // If no overlap → add batch
    setBatches([...batches, currentBatch]);
    setCurrentBatch({ name: "", from: "", to: "" });
  };

  const removeBatch = (index: number) => {
    setBatches(batches.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      let headerRowIndex = -1;
      let rollColIndex = -1;
      let nameColIndex = -1;

      for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j]).toLowerCase().trim();

          if (
            (cell.includes("roll") ||
              cell.includes("seat") ||
              cell.includes("enroll")) &&
            !cell.includes("program") &&
            !cell.includes("course")
          ) {
            rollColIndex = j;
          }

          if (
            cell === "name" ||
            cell === "student name" ||
            cell === "student_name"
          ) {
            nameColIndex = j;
          } else if (nameColIndex === -1 && cell.includes("name")) {
            if (
              !cell.includes("program") &&
              !cell.includes("course") &&
              !cell.includes("term") &&
              !cell.includes("semester")
            ) {
              nameColIndex = j;
            }
          }
        }

        if (rollColIndex !== -1 && nameColIndex !== -1) {
          headerRowIndex = i;
          break;
        }

        rollColIndex = -1;
        nameColIndex = -1;
      }

      if (headerRowIndex !== -1) {
        const parsedStudents: Student[] = [];
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (row[rollColIndex] && row[nameColIndex]) {
            parsedStudents.push({
              rollNumber: row[rollColIndex],
              name: row[nameColIndex],
            });
          }
        }
        setStudents(parsedStudents);
      } else {
        const parsedStudents: Student[] = data
          .slice(1)
          .map((row) => ({
            rollNumber: row[0],
            name: row[1],
          }))
          .filter((s) => s.rollNumber && s.name);
        setStudents(parsedStudents);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all students have a batch assigned
    const unassignedStudents = studentsWithBatches.filter(
      (s) => s.batchName === "-"
    );
    if (unassignedStudents.length > 0) {
      toast.error(
        "All students must be assigned to a batch. Please create batches that cover all roll numbers."
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        batches,
        students: studentsWithBatches,
      };
      console.log(payload);

      const response = await apiClient.post("/admin/create-class", payload);

      if (response.data.success) {
        toast.success("Class created successfully!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast.error(error.response?.data?.message || "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  // Calculate student batches for preview
  const studentsWithBatches = useMemo(() => {
    return students.map((student) => {
      const studentRoll = parseInt(String(student.rollNumber));
      const assignedBatch = batches.find((batch) => {
        const from = parseInt(String(batch.from));
        const to = parseInt(String(batch.to));
        return studentRoll >= from && studentRoll <= to;
      });
      return {
        ...student,
        batchName: assignedBatch ? assignedBatch.name : "-",
      };
    });
  }, [students, batches]);

  return (
    <div className="min-h-full bg-background text-foreground py-10">
      <div className="container mx-auto max-w-6xl">
        <div>
          <MyBreadCrumb />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Create New Class
          </h1>
          <p className="text-muted-foreground mt-2">
            Add a new class with students and batches
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-xl -mt-6">
              <div className="flex flex-col items-center">
                <img
                  src={logo}
                  alt="GPKP Attendance System"
                  className="h-20 w-fit mb-2"
                />
                <CardTitle className="text-xl text-background">
                  Class Details
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="class_name"
                    className="text-sm font-medium text-foreground"
                  >
                    Classname
                  </label>
                  <Input
                    id="class_name"
                    name="class_name"
                    value={formData.class_name}
                    readOnly
                    placeholder="Classname will be Autogenerated"
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="year"
                      className="text-sm font-medium text-foreground"
                    >
                      Year
                    </label>
                    <Input
                      type="number"
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={(e) => {
                        const inputYear = Number(e.target.value);
                        const currentYear = new Date().getFullYear();

                        if (inputYear > currentYear) {
                          toast.error("You can't admit future student");
                          e.target.value = new Date().getFullYear().toString();
                        }
                        handleChange(e);
                      }}
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="division"
                      className="text-sm font-medium text-foreground"
                    >
                      Division
                    </label>
                    <Select
                      value={formData.division}
                      onValueChange={(value) =>
                        handleSelectChange("division", value)
                      }
                    >
                      <SelectTrigger id="division" className="w-full">
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C"].map((divi, idx) => (
                          <SelectItem key={idx} value={divi} >
                            {divi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="branch"
                    className="text-sm font-medium text-foreground"
                  >
                    Branch
                  </label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) =>
                      handleSelectChange("branch", value)
                    }
                  >
                    <SelectTrigger id="branch" className="w-full">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchData.map((branch: Branch, idx: number) => (
                        <SelectItem key={idx} value={branch._id}>
                          {branch.abbrivation} - {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="file"
                    className="text-sm font-medium text-foreground"
                  >
                    Upload Students (Excel)
                  </label>
                  <Input
                    type="file"
                    id="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Batch Creation Section */}
                {students.length > 0 && (
                  <div className="p-4 border border-border rounded-md bg-muted/20">
                    <h4 className="text-sm font-bold mb-3">Add Batches</h4>
                    <div className="space-y-3">
                      <Input
                        type="text"
                        name="name"
                        value={currentBatch.name}
                        onChange={handleBatchChange}
                        placeholder="Batch Name (e.g., Batch-1)"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={String(currentBatch.from)}
                          onValueChange={(value) =>
                            handleBatchSelectChange("from", value)
                          }
                        >
                          <SelectTrigger className="w-1/2">
                            <SelectValue placeholder="From Roll No" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((s) => (
                              <SelectItem
                                key={`from-${s.rollNumber}`}
                                value={String(s.rollNumber)}
                              >
                                {s.rollNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(currentBatch.to)}
                          onValueChange={(value) =>
                            handleBatchSelectChange("to", value)
                          }
                        >
                          <SelectTrigger className="w-1/2">
                            <SelectValue placeholder="To Roll No" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((s) => (
                              <SelectItem
                                key={`to-${s.rollNumber}`}
                                value={String(s.rollNumber)}
                              >
                                {s.rollNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        onClick={addBatch}
                        className="w-full"
                      >
                        Add Batch
                      </Button>
                    </div>

                    {/* List of added batches */}
                    {batches.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {batches.map((batch, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs bg-background p-2 rounded border border-border"
                          >
                            <span>
                              {batch.name}: {batch.from} - {batch.to}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBatch(idx)}
                              className="text-destructive hover:text-destructive h-auto p-0 text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="w-1/2">
                    {loading ? "Creating..." : "Create Class"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Student Preview</CardTitle>
              <CardDescription>
                {students.length > 0
                  ? `Total Students: ${students.length}`
                  : "Upload an Excel file to see preview"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Batch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithBatches.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {student.batchName}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <p>No students uploaded yet.</p>
                  <p className="text-xs mt-1">
                    Upload an Excel file to see preview.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateClass;
