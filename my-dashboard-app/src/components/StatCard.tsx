import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  change?: string;
}

export function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-5 hover:border-purple-500/60 transition-all group hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-6 h-6 text-purple-300" />
      </div>
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-3xl text-white mb-1">{value}</p>
        {change && <p className="text-xs text-purple-400">{change}</p>}
      </div>
    </div>
  );
}