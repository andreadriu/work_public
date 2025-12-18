import React from 'react';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

import { TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';



export function StatisticsPanel() {
  const [attendees, setAttendees] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('http://localhost:4000/api/guests')
      .then(res => res.json())
      .then(data => setAttendees(data));
  }, []);
  // If no attendees, show empty state
  if (attendees.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg mb-2">No statistics available yet</p>
        <p className="text-gray-500 text-sm">Statistics will appear once guests are added</p>
      </div>
    );
  }

  // Gender Distribution
  const genderData = [
    { 
      name: 'Female', 
      value: attendees.filter(a => a.gender === 'Female').length,
      color: '#ec4899'
    },
    { 
      name: 'Male', 
      value: attendees.filter(a => a.gender === 'Male').length,
      color: '#8b5cf6'
    },
  ];

  // Age Distribution
  const ageGroups = [
    { range: '18-22', min: 18, max: 22 },
    { range: '23-26', min: 23, max: 26 },
    { range: '27-30', min: 27, max: 30 },
    { range: '31+', min: 31, max: 100 },
  ];

  const ageData = ageGroups.map(group => ({
    range: group.range,
    count: attendees.filter(a => a.age >= group.min && a.age <= group.max).length,
  }));

  // Status Distribution
  const statusData = [
    {
      name: 'Confirmed',
      value: attendees.filter(a => a.status === 'Confirmed').length,
      color: '#10b981'
    },
    {
      name: 'Tentative',
      value: attendees.filter(a => a.status === 'Tentative').length,
      color: '#f59e0b'
    },
  ];

  const totalConfirmed = attendees.filter(a => a.status === 'Confirmed').length;
  const totalTentative = attendees.filter(a => a.status === 'Tentative').length;
  const confirmationRate = attendees.length > 0 ? ((totalConfirmed / attendees.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/50 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-300">Confirmation Rate</span>
          </div>
          <p className="text-3xl text-white">{confirmationRate}%</p>
          <p className="text-sm text-green-400 mt-1">
            {totalConfirmed} confirmed guests
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/50 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-300">Total Attendees</span>
          </div>
          <p className="text-3xl text-white">{attendees.length}</p>
          <p className="text-sm text-purple-400 mt-1">
            Across all tables
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm border border-yellow-500/50 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-300">Pending Responses</span>
          </div>
          <p className="text-3xl text-white">{totalTentative}</p>
          <p className="text-sm text-yellow-400 mt-1">
            Awaiting confirmation
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg mb-4 text-white">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => (
                  <tspan style={{
                    fontWeight: 'bold',
                    fontSize: 18,
                    fill: name === 'Female' ? '#ec4899' : name === 'Male' ? '#8b5cf6' : '#06b6d4',
                    textShadow: '0 0 8px #fff, 0 0 16px #a21caf',
                  }}>{`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}</tspan>
                )}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #a855f7',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg mb-4 text-white">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => (
                  <tspan style={{
                    fontWeight: 'bold',
                    fontSize: 18,
                    fill: name === 'Confirmed' ? '#10b981' : '#f59e0b',
                    textShadow: '0 0 8px #fff, 0 0 16px #a21caf',
                  }}>{`${name}: ${value}`}</tspan>
                )}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #a855f7',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg mb-4 text-white">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #a855f7',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}