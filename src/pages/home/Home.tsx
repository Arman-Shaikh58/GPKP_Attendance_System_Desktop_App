import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";
import MyBreadCrumb from "@/components/App_Components/MyBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClassesinfo, IClassInfo } from "@/api/class.service";
import { getClassName } from "@/utils/getClassName";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<IClassInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getClassesinfo();
        setClasses(res);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return loading ? (
    <div>
      <h1>Loading...</h1>
    </div>
  ) : (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <MyBreadCrumb />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of your institute.</p>
          </div>
        </div>
        <Button onClick={() => navigate("/create-class")}>
          <Plus className="w-4 h-4 mr-2" /> Create Class
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr. No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>No. of Students</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {classes.map((cls, idx) => (
                <TableRow key={cls._id} onClick={() => navigate(`/class/${cls._id}`)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">
                    {getClassName(cls.year, cls.branch.abbrivation, cls.division)}
                  </TableCell>
                  <TableCell>{cls.year}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="underline cursor-help decoration-dotted underline-offset-4">
                          {cls.branch.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p>Code: <span className="font-mono">{cls.branch.code}</span></p>
                          <p>Abbr: <span className="font-medium">{cls.branch.abbrivation}</span></p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{cls.studentCount}</TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No classes found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
