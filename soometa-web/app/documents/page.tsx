// app/documents/page.tsx
import DocumentBrowser from './components/DocumentBrowser'; // Import Client Component
import { Metadata } from 'next';
import { getAllDocuments, DocumentLinkItem } from '@/lib/documentDataCache'; // Use cached data loader

export const metadata: Metadata = {
  title: 'Kho Tài Liệu TOPIK - TopikGo',
  description: 'Tải xuống các đề thi TOPIK, tài liệu ngữ pháp, từ vựng và các tài liệu học tiếng Hàn hữu ích khác từ TopikGo.',
  // ... (metadata khác như trước)
};

export default async function DocumentsPageContainer() {
  const documents = await getAllDocuments(); // Use cached data loader

  return (
    <div className="container mx-auto p-6 md:p-10 lg:p-12 dark:bg-slate-900 min-h-screen">
      <header className="mb-10 text-center border-b pb-8 border-gray-200 dark:border-slate-700">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400 tracking-tight">
          Kho Tài Liệu
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Nguồn tài liệu PDF phong phú để hỗ trợ bạn trên hành trình chinh phục TOPIK.
        </p>
      </header>
      
      <DocumentBrowser initialDocuments={documents} />
    </div>
  );
}