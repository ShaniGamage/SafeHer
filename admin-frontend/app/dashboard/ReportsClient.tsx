'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export default function ReportsClient() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the Clerk session token (MUST be awaited)
      const token = await getToken();
      console.log("Token retrieved:", token ? "✅ Token exists" : "❌ No token");
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Calling API:', `${process.env.NEXT_PUBLIC_API_URL}/reports/mine`);

      // Call your NestJS backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/mine`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      setReports(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reports</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchReports}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">My Reports</h2>
        <button 
          onClick={fetchReports}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
        <pre className="text-sm text-gray-700">
          {JSON.stringify(reports, null, 2)}
        </pre>
      </div>

      {reports?.user && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">User ID</p>
            <p className="font-semibold text-gray-900">{reports.user.id}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-gray-900">{reports.user.email}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="font-semibold text-gray-900 uppercase">{reports.user.role}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Name</p>
            <p className="font-semibold text-gray-900">
              {reports.user.firstName} {reports.user.lastName}
            </p>
          </div>
        </div>
      )}

      {reports?.message && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ {reports.message}</p>
        </div>
      )}
    </div>
  );
}