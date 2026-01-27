'use client';

import React, { useMemo } from 'react';
import Select, { MultiValue } from 'react-select';
import { Exam, ReactSelectOption } from './types';
import { normalizeInstruction } from './utils';

interface PracticeFiltersProps {
    selectedLevel: string;
    setSelectedLevel: (level: string) => void;
    selectedSkill: string;
    setSelectedSkill: (skill: string) => void;
    selectedExamId: string;
    setSelectedExamId: (examId: string) => void;
    selectedInstructions: string[];
    setSelectedInstructions: (instructions: string[]) => void;
    filteredExamsByLevelSkill: Exam[];
    instructionTypeOptions: ReactSelectOption[];
}

const PracticeFilters: React.FC<PracticeFiltersProps> = ({
    selectedLevel,
    setSelectedLevel,
    selectedSkill,
    setSelectedSkill,
    selectedExamId,
    setSelectedExamId,
    selectedInstructions,
    setSelectedInstructions,
    filteredExamsByLevelSkill,
    instructionTypeOptions,
}) => {
    // --- Options for react-select ---
    const levelOptions = [
        { value: 'TOPIK Ⅰ', label: 'TOPIK I' },
        { value: 'TOPIK Ⅱ', label: 'TOPIK II' }
    ];

    const skillOptions = [
        { value: '듣기', label: 'Nghe (듣기)' },
        { value: '읽기', label: 'Đọc (읽기)' }
    ];

    const examOptions = useMemo(() => [
        { value: 'all', label: '-- Tất cả phù hợp --' },
        ...filteredExamsByLevelSkill.map((exam) => ({
            value: exam.id,
            label: `(${exam.id}) ${exam.year_description} ${exam.exam_number_description}`
        }))
    ], [filteredExamsByLevelSkill]);

    // --- Handlers for react-select ---
    const handleLevelChange = (selectedOption: any) => {
        const newLevel = selectedOption?.value;
        if (!newLevel) return;
        setSelectedLevel(newLevel);
        setSelectedSkill(newLevel === 'TOPIK Ⅰ' ? '듣기' : selectedSkill);
        setSelectedExamId('all');
        setSelectedInstructions([]);
    };

    const handleSkillChange = (selectedOption: any) => {
        const newSkill = selectedOption?.value;
        if (!newSkill) return;
        setSelectedSkill(newSkill);
        setSelectedExamId('all');
        setSelectedInstructions([]);
    };

    const handleExamChange = (selectedOption: any) => {
        const newExamId = selectedOption?.value;
        if (!newExamId) return;
        setSelectedExamId(newExamId);
    };

    const handleMultiInstructionChange = (selectedOptions: MultiValue<ReactSelectOption>) => {
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setSelectedInstructions(selectedValues);
    };

    const commonStyles = {
        control: (base: any, state: any) => ({
            ...base,
            minHeight: '42px',
            borderColor: state.isFocused ? '#93c5fd' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 1px #bfdbfe' : 'none',
            '&:hover': {
                borderColor: '#93c5fd',
            },
            borderRadius: '0.375rem',
            backgroundColor: 'white',
        }),
        menu: (base: any) => ({ ...base, zIndex: 20 }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused ? '#eef2ff' : state.isSelected ? '#bfdbfe' : null,
            color: state.isSelected ? '#1e3a8a' : '#374151',
            cursor: 'pointer',
        }),
    };

    return (
        <div className="bg-white md:p-8 md:rounded-lg md:shadow-sm mb-8 space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="filter-item">
                <label htmlFor="level-select-react" className="block mb-1.5 text-sm font-medium text-gray-700">Cấp độ:</label>
                <Select
                    inputId="level-select-react"
                    options={levelOptions}
                    value={levelOptions.find(opt => opt.value === selectedLevel)}
                    onChange={handleLevelChange}
                    styles={commonStyles}
                    isSearchable={false}
                    classNamePrefix="react-select"
                />
            </div>
            <div className="filter-item">
                <label htmlFor="skill-select-react" className="block mb-1.5 text-sm font-medium text-gray-700">Kỹ năng:</label>
                <Select
                    inputId="skill-select-react"
                    options={skillOptions}
                    value={skillOptions.find(opt => opt.value === selectedSkill)}
                    onChange={handleSkillChange}
                    styles={commonStyles}
                    isSearchable={false}
                    classNamePrefix="react-select"
                />
            </div>
            <div className="filter-item">
                <label htmlFor="exam-select-react" className="block mb-1.5 text-sm font-medium text-gray-700">Kỳ thi ({filteredExamsByLevelSkill.length}):</label>
                <Select
                    inputId="exam-select-react"
                    options={examOptions}
                    value={examOptions.find(opt => opt.value === selectedExamId)}
                    onChange={handleExamChange}
                    styles={commonStyles}
                    classNamePrefix="react-select"
                    noOptionsMessage={() => "Không có kỳ thi nào"}
                    placeholder="Chọn kỳ thi..."
                />
            </div>

            <div className="md:col-span-3 bg-gray-50 md:p-6 md:rounded-md md:border md:border-gray-200">
                <label htmlFor="instruction-select-react" className="block mb-2 text-base font-medium text-gray-700"> Chọn dạng yêu cầu (có thể chọn nhiều): </label>
                <Select
                    inputId="instruction-select-react"
                    instanceId="instruction-select-instance"
                    isMulti
                    options={instructionTypeOptions}
                    value={instructionTypeOptions.filter(option => selectedInstructions.includes(option.value))}
                    onChange={handleMultiInstructionChange}
                    placeholder="Tìm hoặc chọn dạng yêu cầu..."
                    noOptionsMessage={() => "Không có dạng nào"}
                    isDisabled={instructionTypeOptions.length === 0}
                    className="text-base react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                        ...commonStyles,
                        multiValue: (base) => ({ ...base, backgroundColor: '#eef2ff', borderRadius: '0.25rem' }),
                        multiValueLabel: (base) => ({ ...base, color: '#4338ca', fontSize: '0.875rem' }),
                        multiValueRemove: (base) => ({ ...base, color: '#6366f1', ':hover': { backgroundColor: '#c7d2fe', color: '#3730a3' } }),
                    }}
                />
                {instructionTypeOptions.length === 0 && (
                    <div className="text-gray-500 italic mt-2 text-sm">
                        Không tìm thấy dạng yêu cầu cho "{selectedLevel} - {selectedSkill}". Vui lòng chọn cấp độ hoặc kỹ năng khác.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeFilters;