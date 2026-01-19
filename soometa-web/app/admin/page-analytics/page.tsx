// app/admin/page-analytics/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PageViewStats {
  date: {
    year: number;
    month: number;
    day: number;
  };
  totalViews: number;
  uniqueSessionsCount: number;
  uniqueUsersCount: number;
  avgTimeOnPage: number; // milliseconds
  totalTimeOnPage: number;
}

interface PopularPage {
  pagePath: string;
  totalViews: number;
  uniqueSessionsCount: number;
  avgTimeOnPage: number;
}

interface RealtimeStats {
  totalSessions: number;
  totalUsers: number;
  activePages: any[];
}

export default function PageAnalyticsPage() {
  const { currentUser, token, _isLoadingAuth } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<PageViewStats[]>([]);
  const [popularPages, setPopularPages] = useState<PopularPage[]>([]);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7); // Last 7 days

  const API_BASE_URL = '';

  useEffect(() => {
    if (!_isLoadingAuth) {
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/');
      } else {
        fetchAllData();
        // Auto refresh realtime stats every 30s
        const interval = setInterval(fetchRealtimeStats, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [currentUser, _isLoadingAuth, router]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPageViewStats(),
        fetchPopularPages(),
        fetchRealtimeStats()
      ]);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageViewStats = async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const response = await fetch(
      `${API_BASE_URL}/pageviews/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=day`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error('Lỗi khi tải thống kê page views');
    }

    const data = await response.json();
    setStats(data);
  };

  const fetchPopularPages = async () => {
    const response = await fetch(
      `${API_BASE_URL}/pageviews/popular-pages?limit=10`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error('Lỗi khi tải trang phổ biến');
    }

    const data = await response.json();
    setPopularPages(data);
  };

  const fetchRealtimeStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/pageviews/realtime`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRealtimeStats(data);
      }
    } catch (err) {
      console.error('Error fetching realtime stats:', err);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const chartData = stats.map(s => ({
    name: `${s.date.day}/${s.date.month}`,
    'Lượt xem': s.totalViews,
    'Sessions': s.uniqueSessionsCount,
    'Users': s.uniqueUsersCount
  }));

  const timeChartData = stats.map(s => ({
    name: `${s.date.day}/${s.date.month}`,
    'Thời gian TB (phút)': Math.round(s.avgTimeOnPage / 60000)
  }));

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-700 dark:text-gray-300">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center text-red-600 dark:text-red-400">
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Thống Kê Chi Tiết Page Views
        </h1>
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(Number(e.target.value));
            setTimeout(fetchPageViewStats, 100);
          }}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
        >
          <option value={7}>7 ngày qua</option>
          <option value={14}>14 ngày qua</option>
          <option value={30}>30 ngày qua</option>
          <option value={90}>90 ngày qua</option>
        </select>
      </div>

      {/* Realtime Stats */}
      {realtimeStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Đang Online</p>
                <p className="text-4xl font-bold mt-2">{realtimeStats.totalSessions}</p>
                <p className="text-blue-100 text-xs mt-1">sessions hoạt động</p>
              </div>
              <div className="text-5xl opacity-20">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Users Online</p>
                <p className="text-4xl font-bold mt-2">{realtimeStats.totalUsers}</p>
                <p className="text-green-100 text-xs mt-1">người dùng đã đăng nhập</p>
              </div>
              <div className="text-5xl opacity-20">✓</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Tổng lượt xem</p>
                <p className="text-4xl font-bold mt-2">
                  {stats.reduce((sum, s) => sum + s.totalViews, 0)}
                </p>
                <p className="text-purple-100 text-xs mt-1">trong {dateRange} ngày qua</p>
              </div>
              <div className="text-5xl opacity-20">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Page Views Chart */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Biểu đồ lượt xem theo ngày
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Lượt xem" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="Sessions" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="Users" stroke="#ffc658" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time on Page Chart */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Thời gian trung bình trên trang
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Thời gian TB (phút)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Popular Pages */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Top 10 Trang Phổ Biến
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Trang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Lượt xem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Unique Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Thời gian TB
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
              {popularPages.map((page, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {page.pagePath}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {page.totalViews.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {page.uniqueSessionsCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatTime(page.avgTimeOnPage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Chi Tiết Theo Ngày
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Lượt xem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-300">
                  Thời gian TB
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
              {stats.slice().reverse().map((stat, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {stat.date.day}/{stat.date.month}/{stat.date.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {stat.totalViews.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {stat.uniqueSessionsCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {stat.uniqueUsersCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatTime(stat.avgTimeOnPage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
