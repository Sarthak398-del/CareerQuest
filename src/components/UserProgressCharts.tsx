import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';
import { TRANSLATIONS } from '../constants';

interface UserProgressChartsProps {
  user: UserProfile;
  lang: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export const UserProgressCharts: React.FC<UserProgressChartsProps> = ({ user, lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  // XP History Data
  const xpData = user.xpHistory || [];

  // Skill Proficiency Data
  const skillData = Object.entries(user.skillProficiency || {}).map(([name, value]) => ({
    subject: name,
    A: value,
    fullMark: 100,
  }));

  // Badge Completion Data
  const totalBadges = 10; // Assume 10 total badges for now
  const earnedBadges = user.badges.length;
  const badgeData = [
    { name: 'Earned', value: earnedBadges },
    { name: 'Remaining', value: Math.max(0, totalBadges - earnedBadges) },
  ];

  return (
    <div className="space-y-12 mt-12">
      {/* XP Over Time */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
      >
        <h3 className="text-xl font-black text-gray-900 mb-6">{t.chart_xp_title}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={xpData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94A3B8' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="xp" 
                stroke="#3B82F6" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skill Radar */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
        >
          <h3 className="text-xl font-black text-gray-900 mb-6">{t.chart_skills_title}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="#F1F5F9" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="A"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Badge Completion */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
        >
          <h3 className="text-xl font-black text-gray-900 mb-6">{t.chart_badges_title}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={badgeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {badgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <p className="text-3xl font-black text-gray-900">{earnedBadges}/{totalBadges}</p>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.chart_badges_earned}</p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};
