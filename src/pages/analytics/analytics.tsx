import React, { useEffect, useState } from 'react';
import { getTeacherSubjects, Subject } from '@/api/subject.service';
import { getSubjectAnalytics, SubjectAnalyticsData, StudentAnalytics } from '@/api/analytics.service';
import { getBatchesByClass, Batch } from '@/api/batch.service';
import { getClassName } from '@/utils/getClassName';
import { toast } from 'sonner';
import {
    BarChart2,
    Search,
    X,
    ArrowUp,
    ArrowDown,
    Clock,
    Users,
    AlertCircle,
    TrendingUp
} from "lucide-react";
import { Pie, PieChart, Label } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Analytics() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    const [selectedSubject, setSelectedSubject] = useState<string>('');

    const [analyticsData, setAnalyticsData] = useState<SubjectAnalyticsData | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [batches, setBatches] = useState<Batch[]>([]);

    const [sortBy, setSortBy] = useState<'roll' | 'absent_lec' | 'absent_prac' | 'percent'>('roll');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [searchQuery, setSearchQuery] = useState('');

    const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchAnalytics(selectedSubject);
            const subject = subjects.find(s => s._id === selectedSubject);
            if (subject) {
                fetchBatches(subject.class_id);
            }
        } else {
            setAnalyticsData(null);
            setBatches([]);
        }
    }, [selectedSubject]);

    const fetchSubjects = async () => {
        try {
            const data = await getTeacherSubjects();
            setSubjects(data);
            console.log(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load subjects");
        } finally {
            setLoadingSubjects(false);
        }
    };

    const fetchBatches = async (classId: string) => {
        try {
            const data = await getBatchesByClass(classId);
            setBatches(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAnalytics = async (subjectId: string) => {
        setLoadingAnalytics(true);
        try {
            const data = await getSubjectAnalytics(subjectId);
            setAnalyticsData(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load analytics");
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const getSortedStudents = () => {
        if (!analyticsData?.students) return [];

        let filtered = analyticsData.students;

        if (searchQuery) {
            filtered = filtered.filter(s => s.roll_num.includes(searchQuery));
        }

        return [...filtered].sort((a, b) => {
            let valA: any, valB: any;

            switch (sortBy) {
                case 'roll':
                    valA = parseInt(a.roll_num) || a.roll_num;
                    valB = parseInt(b.roll_num) || b.roll_num;
                    break;
                case 'absent_lec':
                    valA = a.lectures.absent;
                    valB = b.lectures.absent;
                    break;
                case 'absent_prac':
                    valA = a.practicals.absent;
                    valB = b.practicals.absent;
                    break;
                case 'percent':
                    valA = a.overall.percentage;
                    valB = b.overall.percentage;
                    break;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const toggleSort = (field: 'roll' | 'absent_lec' | 'absent_prac' | 'percent') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getBatchName = (batchId: string) => {
        const batch = batches.find(b => b._id === batchId);
        return batch ? batch.name : 'Unknown';
    };

    const AttendancePieChart = ({ title, present, absent }: { title: string, present: number, absent: number }) => {
        const chartData = [
            { browser: "present", visitors: present, fill: "var(--color-present)" },
            { browser: "absent", visitors: absent, fill: "var(--color-absent)" },
        ];

        const chartConfig = {
            visitors: { label: "Attendance" },
            present: { label: "Present", color: "#16a34a" },
            absent: { label: "Absent", color: "#ef4444" },
        } satisfies ChartConfig;

        const total = present + absent;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return (
            <div className="flex flex-col">
                <div className="items-center pb-0 text-center">
                    <h4 className="text-sm font-semibold text-accent-foreground">{title}</h4>
                    <span className="text-xs text-muted-foreground">Attendance Overview</span>
                </div>
                <div className="flex-1 pb-0">
                    <ChartContainer
                        config={chartConfig}
                        className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
                    >
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={chartData} dataKey="visitors" label nameKey="browser" />
                        </PieChart>
                    </ChartContainer>
                </div>
            </div>
        );
    };

    const SortHeader = ({ label, field }: { label: string, field: typeof sortBy }) => (
        <button
            onClick={() => toggleSort(field)}
            className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${sortBy === field ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            {label}
            {sortBy === field && (
                sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
            )}
        </button>
    );

    return (
        <div className="p-6 max-w-12xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl text-accent-foreground font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">Detailed attendance report and student performance.</p>
                </div>
            </div>

            <div className="flex gap-4 items-end">
                <div className="w-full md:w-1/3 space-y-2">
                    <label className="text-sm text-accent-foreground font-medium">Select Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={loadingSubjects}>
                        <SelectTrigger className='text-accent-foreground'>
                            <SelectValue placeholder={loadingSubjects ? "Loading..." : "Choose a subject"} />
                        </SelectTrigger>
                        <SelectContent >
                            {subjects.map((sub) => (
                                <SelectItem className='text-accent-foreground' key={sub._id} value={sub._id}>{sub.name} - {getClassName(sub.year, sub.branch_abbrivation, sub.division)} </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loadingAnalytics ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : analyticsData ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Lectures</p>
                                    <h2 className="text-3xl font-bold">{analyticsData.total_lectures}</h2>
                                </div>
                                <Clock className="h-8 w-8 text-muted-foreground/30" />
                            </CardContent>
                        </Card>

                        {/* Batch Wise Practicals */}
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Practicals per Batch</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4 overflow-x-auto pb-4">
                                {Object.entries(analyticsData.batch_wise_practicals).map(([batchId, count]) => (
                                    <div key={batchId} className="flex-1 min-w-[100px] bg-secondary/50 p-3 rounded-xl border border-border items-center text-center">
                                        <div className="text-xl font-bold">{count}</div>
                                        <div className="text-xs text-muted-foreground font-medium truncate">{getBatchName(batchId)}</div>
                                    </div>
                                ))}
                                {Object.keys(analyticsData.batch_wise_practicals).length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No practicals recorded yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Student List & Search */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    Student Performance
                                </CardTitle>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search Roll No..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Table Header */}
                            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg mb-2">
                                <div className="w-16"><SortHeader label="Roll No" field="roll" /></div>
                                <div className="flex-1 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name / Batch</div>
                                <div className="w-48 flex justify-between pr-4">
                                    <SortHeader label="Lec Abs" field="absent_lec" />
                                    <SortHeader label="Prac Abs" field="absent_prac" />
                                    <SortHeader label="Overall %" field="percent" />
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {getSortedStudents().map((student) => {
                                    const lecColor = student.lectures.percentage >= 75 ? 'text-green-600' : 'text-red-500';
                                    const pracColor = student.practicals.percentage >= 75 ? 'text-green-600' : 'text-red-500';

                                    return (
                                        <div
                                            key={student.student_id}
                                            className="group flex flex-row items-center justify-between bg-card hover:bg-accent/50 border border-border rounded-lg p-3 transition-all cursor-pointer"
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setIsDetailOpen(true);
                                            }}
                                        >
                                            <div className="w-16 flex justify-center">
                                                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-sm">
                                                    {student.roll_num}
                                                </div>
                                            </div>
                                            <div className="flex-1 px-4 min-w-0">
                                                <div className="font-medium truncate">{student.name}</div>
                                                <div className="text-xs text-muted-foreground bg-secondary inline-block px-1.5 py-0.5 rounded mt-1">
                                                    {student.batch_name || 'No Batch'}
                                                </div>
                                            </div>
                                            <div className="w-48 flex justify-between items-center pr-4">
                                                <div className="text-sm font-medium w-12 text-center text-muted-foreground group-hover:text-foreground">{student.lectures.absent}</div>
                                                <div className="text-sm font-medium w-12 text-center text-muted-foreground group-hover:text-foreground">{student.practicals.absent}</div>
                                                <div className={`text-sm font-bold w-12 text-center ${student.overall.percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {student.overall.percentage}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {getSortedStudents().length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No students found matching your search.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground border-2 border-dashed rounded-xl">
                    <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                    <p>Select a subject to view analytics</p>
                </div>
            )}

            {/* Student Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className='text-accent-foreground'>Student Details</DialogTitle>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                    {selectedStudent.roll_num}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-none text-accent-foreground">{selectedStudent.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Batch: {selectedStudent.batch_name || 'N/A'}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-accent-foreground">
                                    <AlertCircle className="w-4 h-4" /> Attendance Performance
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <AttendancePieChart
                                        title="Lectures"
                                        present={selectedStudent.lectures.present}
                                        absent={selectedStudent.lectures.absent}
                                    />
                                    <AttendancePieChart
                                        title="Practicals"
                                        present={selectedStudent.practicals.present}
                                        absent={selectedStudent.practicals.absent}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary/20 p-4 rounded-xl text-center border border-border">
                                    <div className="text-sm font-semibold text-muted-foreground mb-2">Lectures</div>
                                    <div className="flex justify-center gap-4">
                                        <div>
                                            <div className="text-xl font-bold text-green-600">{selectedStudent.lectures.present}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Pres</div>
                                        </div>
                                        <div className="w-px bg-border"></div>
                                        <div>
                                            <div className="text-xl font-bold text-red-500">{selectedStudent.lectures.absent}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Abs</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-secondary/20 p-4 rounded-xl text-center border border-border">
                                    <div className="text-sm font-semibold text-muted-foreground mb-2">Practicals</div>
                                    <div className="flex justify-center gap-4">
                                        <div>
                                            <div className="text-xl font-bold text-green-600">{selectedStudent.practicals.present}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Pres</div>
                                        </div>
                                        <div className="w-px bg-border"></div>
                                        <div>
                                            <div className="text-xl font-bold text-red-500">{selectedStudent.practicals.absent}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Abs</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}