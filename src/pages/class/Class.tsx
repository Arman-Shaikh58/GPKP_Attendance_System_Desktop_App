import React, { useEffect, useState } from "react";
import MyBreadCrumb from "@/components/App_Components/MyBreadCrumb";
import { useParams } from "react-router-dom";
import { ClassData, getClassInfo } from "@/api/class.service";
import { getClassName } from "@/utils/getClassName";
import { School, Info } from "lucide-react";

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

const Class = () => {
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<ClassData>();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getClassInfo(id);
        setClassInfo(res);

        if (res.batches?.length > 0) {
          setSelectedBatchId(res.batches[0]._id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">Class Details</h1>
          <p className="text-muted-foreground">Manage students and class information.</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.length ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.roll_num}</TableCell>
                      <TableCell>{student.name}</TableCell>
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
    </div>
  );
};

export default Class;
