// app/practice-by-type/page.tsx
import PracticeByTypeClient from './PracticeByTypeClient';
import { Exam } from './types';
import { getAllExams } from '@/lib/examDataCache'; // Use cached data loader

// --- Use cached data loader (100-300ms faster!) ---
async function getFilteredExamData(): Promise<Exam[]> {
  const EXCLUDED_IDS_PREFIX = ["35-", "36-", "37-"]; // Các ID cần loại bỏ

  try {
    // Use cached data - MUCH faster than reading 2.3MB file every time
    const allExamsData = await getAllExams();

    if (!Array.isArray(allExamsData)) {
      console.error("Lỗi getFilteredExamData: Dữ liệu không phải là một mảng.");
      return [];
    }

    // Lọc bỏ các đề thi không mong muốn
    const filteredData = allExamsData.filter(exam =>
      exam && typeof exam.id === 'string' &&
      !EXCLUDED_IDS_PREFIX.some(prefix => exam.id.startsWith(prefix))
    );

    return filteredData as Exam[];
  } catch (error: any) {
    console.error("Lỗi trong getFilteredExamData:", error.message);
    return [];
  }
}


// --- Server Component chính ---
export default async function PracticeByTypePage() {
  // Lấy dữ liệu ĐÃ LỌC (từ file JSON)
  const filteredExams = await getFilteredExamData();

  if (!filteredExams || filteredExams.length === 0) {
    return (
        <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
            <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-4 text-xl font-semibold text-red-700">Không Tải Được Dữ Liệu Đề Thi</h3>
                <p className="mt-2 text-base text-gray-600">
                    Không thể tải hoặc không có dữ liệu đề thi phù hợp sau khi lọc.
                    Vui lòng kiểm tra lại file <code className="bg-gray-200 px-1 rounded">data/exams.json</code> hoặc thử lại sau.
                </p>
            </div>
        </div>
    );
  }

  // Truyền dữ liệu đã lọc sang Client Component
  return (
    <PracticeByTypeClient allExams={filteredExams} />
  );
}
// --- Kết thúc Server Component chính ---