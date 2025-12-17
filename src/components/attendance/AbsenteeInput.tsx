import React, { useState, useEffect, useRef } from 'react';
import { Student } from '@/api/student.service';
import { X, Plus, UserX, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AbsenteeInputProps {
    students: Student[];
    onAddAbsentee: (rollNum: string) => void;
    removeAbsentee: (rollNum: string) => void;
    absentees: string[];
}

export default function AbsenteeInput({ students, onAddAbsentee, removeAbsentee, absentees }: AbsenteeInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Student[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (inputValue.trim()) {
            const filtered = students.filter(
                (s) =>
                    s.roll_num.includes(inputValue) &&
                    !absentees.includes(s.roll_num)
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    }, [inputValue, students, absentees]);

    // Click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSubmit = () => {
        if (!inputValue) return;

        const isValidStudent = students.find(s => s.roll_num === inputValue);

        if (isValidStudent && !absentees.includes(inputValue)) {
            onAddAbsentee(inputValue);
            setInputValue('');
            setSuggestions([]);
            // Keep focus on input? Maybe.
        }
    };

    const handleSuggestionPress = (student: Student) => {
        onAddAbsentee(student.roll_num);
        setInputValue('');
        setSuggestions([]);
    };

    return (
        <div className="mb-6 relative z-50 transition-all" ref={wrapperRef}>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Mark Absentee</label>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <UserX className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        className="pl-9"
                        placeholder="Enter Roll No."
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                </div>
                {inputValue.length > 0 && (
                    <Button size="icon" variant="destructive" onClick={handleSubmit} className="h-10 w-10 shrink-0 rounded-full">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 shadow-lg z-50 max-h-48 overflow-y-auto w-full">
                    {suggestions.map((item) => (
                        <div
                            key={item._id}
                            className="px-4 py-3 border-b border-gray-100 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleSuggestionPress(item)}
                        >
                            <div>
                                <div className="font-semibold text-gray-900">{item.roll_num}</div>
                                <div className="text-xs text-gray-500">{item.name}</div>
                            </div>
                            <PlusCircle className="h-4 w-4 text-gray-400" />
                        </div>
                    ))}
                </div>
            )}

            {/* Chips for Absentees */}
            <div className="flex flex-wrap gap-2 mt-3">
                {absentees.map((rollNum) => (
                    <div key={rollNum} className="bg-red-50 border border-red-100 flex items-center pl-3 pr-2 py-1 rounded-full animate-in fade-in zoom-in duration-200">
                        <span className="text-red-700 font-medium mr-1">{rollNum}</span>
                        <button onClick={() => removeAbsentee(rollNum)} className="hover:bg-red-200 rounded-full p-0.5 transition-colors">
                            <X className="h-4 w-4 text-red-500" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
