import React, { useEffect, useState } from 'react';
import { getAllTeachers, deleteTeacher, Teacher as ITeacher } from '@/api/teacher.service';
import { register } from '@/api/auth.service';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Mail, UserPlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Badge } from "../../components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

export default function Teachers() {
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<ITeacher | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (error) {
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteTeacher(deletingId);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to delete teacher");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-accent-foreground">Teachers</h1>
            <p className="text-muted-foreground">Manage faculty accounts and permissions.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading teachers...</TableCell></TableRow>
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow
                    key={teacher._id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <TableCell className="font-semibold">{teacher.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {teacher.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.isVerified ?
                        <Badge variant="default" className="bg-green-500/15 text-green-700 dark:text-green-500 hover:bg-green-500/25 border-green-200">Verified</Badge> :
                        <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Pending</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingId(teacher._id); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No teachers found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Details Dialog */}
      <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Username</Label>
              <div className="col-span-3 font-medium">{selectedTeacher?.username}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Email</Label>
              <div className="col-span-3 font-medium">{selectedTeacher?.email}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">User ID</Label>
              <div className="col-span-3 font-mono text-sm text-muted-foreground">{selectedTeacher?._id}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Status</Label>
              <div className="col-span-3">
                {selectedTeacher?.isVerified ?
                  <Badge className="bg-green-500/15 text-green-700 border-green-200">Verified Account</Badge> :
                  <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Verification Pending</Badge>
                }
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground">Joined</Label>
              <div className="col-span-3 font-medium">
                {selectedTeacher?.createdAt && new Date(selectedTeacher.createdAt).toLocaleString()}
              </div>
            </div>
            {selectedTeacher?.lastDevice && (
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right text-muted-foreground">Last Device</Label>
                <div className="col-span-3">
                  <div className="font-sm capitalize">{selectedTeacher.lastDevice.brand} {selectedTeacher.lastDevice.model}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-col">
                    <div>
                      {selectedTeacher.lastDevice.deviceId}
                    </div>
                    <div>
                      {selectedTeacher.lastDevice.brand}
                    </div>
                    <div>
                      {selectedTeacher.lastDevice.model}
                    </div>
                    <div>
                      {selectedTeacher.lastDevice.systemName}
                    </div>
                    <div>
                      {selectedTeacher.lastDevice.systemVersion}
                    </div>
                    <div>
                      {new Date(selectedTeacher.lastDevice.lastSeenAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher account "{teachers.find(t => t._id === deletingId)?.username}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}