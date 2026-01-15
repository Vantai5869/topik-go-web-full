import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { usePracticeStatistics } from '../practice/StatisticPieChart';

interface Props {
  userId: string;
  hardcodedInstructions: Record<string, Record<string, string[]>>;
  selectedLevel: string;
  selectedSkill: string;
}

const InstructionStatsChart: React.FC<Props> = ({
  userId,
  hardcodedInstructions,
  selectedLevel,
  selectedSkill,
}) => {
  const { loading, instructionStats, filteredInstructions, practiceHistory } = usePracticeStatistics(
    userId,
    hardcodedInstructions,
    selectedLevel,
    selectedSkill
  );

  // Debug: log props and fetched data
  console.log('[InstructionStatsChart]', { userId, selectedLevel, selectedSkill, practiceHistory });

  const COLORS = [
    '#3b82f6', '#10b981', '#f59e42', '#ef4444', '#a78bfa', '#f472b6', '#facc15', '#38bdf8',
    '#34d399', '#fb7185', '#6366f1', '#fbbf24', '#eab308', '#14b8a6', '#8b5cf6', '#f87171',
    '#f472b6', '#fcd34d', '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a3e635', '#f472b6',
    '#f59e42', '#fbbf24', '#f472b6', '#f87171', '#a78bfa', '#f59e42'
  ];

  const pieData = filteredInstructions.map((instr, index) => ({
    name: instr,
    value: instructionStats[instr].total,
    fill: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = pieData.reduce((sum, item) => sum + item.value, 0);
      const percent = total > 0 ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{`${data.value} câu (${percent}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="my-12">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-slate-200 mb-6 text-center sm:text-left">
        Thống kê theo từng dạng
      </h2>
      {loading ? (
        <div className="text-center py-8">Đang tải thống kê...</div>
      ) : filteredInstructions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-500 py-12">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#f3f4f6" />
            <path d="M8 12h4m0 0h4m-4 0v4m0-4V8" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-3 text-lg font-medium">Chưa có dữ liệu thống kê. Hãy luyện tập để xem thống kê!</div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div className="w-full md:w-1/2 flex justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '15px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 overflow-x-auto">
            <table className="w-full text-sm mb-6 border rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left">Dạng</th>
                  <th className="py-2 px-2 text-left">Số câu đã làm</th>
                  <th className="py-2 px-2 text-left">Tỉ lệ đúng</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructions.map(instruction => {
                  const stat = instructionStats[instruction];
                  const percent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  let percentClass = 'text-gray-700';
                  if (percent >= 70) percentClass = 'text-green-600 font-semibold';
                  else if (percent >= 40) percentClass = 'text-yellow-600 font-semibold';
                  else percentClass = 'text-red-600 font-semibold';
                  return (
                    <tr key={instruction} className="border-b last:border-0 hover:bg-blue-50/30 transition">
                      <td className="py-2 px-2 font-medium text-gray-700">{instruction}</td>
                      <td className="py-2 px-2">{stat.total}</td>
                      <td className={`py-2 px-2 ${percentClass}`}>{stat.total > 0 ? `${percent}%` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default InstructionStatsChart; 