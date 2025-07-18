import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Trophy, CreditCard, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Dashboard: React.FC = () => {
  const { club } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const stats = useMemo(() => {
    if (!club) return { totalAthletes: 0, totalSports: 0, monthlyPayments: 0, totalRevenue: 0 };

    // Only count active athletes
    const totalAthletes = Object.values(club.athletes || {}).filter(athlete => athlete.status === 'active').length;
    const totalSports = Object.keys(club.sports || {}).length;
    
    // Calculate payments for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    let monthlyPayments = 0;
    let totalRevenue = 0;

    Object.values(club.athletes || {}).forEach(athlete => {
      // Only include payments from active athletes
      if (athlete.status !== 'active') return;
      
      Object.values(athlete.sports || {}).forEach(sport => {
        Object.values(sport.paiements || {}).forEach(payment => {
          if (payment.status === 'paid') {
            totalRevenue += payment.montant;
            if (payment.mois === currentMonth) {
              monthlyPayments += payment.montant;
            }
          }
        });
      });
    });

    return { totalAthletes, totalSports, monthlyPayments, totalRevenue };
  }, [club]);

  const chartData = useMemo(() => {
    if (!club) return { monthlyData: [], sportsData: [], sportsRevenueData: [], paymentStatusData: [], availableMonths: [] };

    // Monthly revenue data (last 6 months)
    const monthlyRevenue: Record<string, number> = {};
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
      monthlyRevenue[monthKey] = 0;
    }

    // Sports distribution data
    const sportsCount: Record<string, number> = {};
    
    // Revenue per sport data (for all time and selected month)
    const sportsRevenue: Record<string, number> = {};
    const sportsRevenueForMonth: Record<string, number> = {};
    
    // Payment status data
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    Object.values(club.athletes || {}).forEach(athlete => {
      Object.values(athlete.sports || {}).forEach(sport => {
        // Count athletes per sport
        sportsCount[sport.sportName] = (sportsCount[sport.sportName] || 0) + 1;
        
        // Initialize sport revenue for all time and selected month
        if (!sportsRevenue[sport.sportName]) {
          sportsRevenue[sport.sportName] = 0;
        }
        if (!sportsRevenueForMonth[sport.sportName]) {
          sportsRevenueForMonth[sport.sportName] = 0;
        }
        
        Object.values(sport.paiements || {}).forEach(payment => {
          // Monthly revenue
          if (payment.status === 'paid' && monthlyRevenue.hasOwnProperty(payment.mois)) {
            monthlyRevenue[payment.mois] += payment.montant;
          }
          
          // Revenue per sport (all time)
          if (payment.status === 'paid') {
            sportsRevenue[sport.sportName] += payment.montant;
            
            // Revenue per sport for selected month
            if (payment.mois === selectedMonth) {
              sportsRevenueForMonth[sport.sportName] += payment.montant;
            }
          }
          
          // Payment status counts
          if (payment.status === 'paid') paidCount++;
          else if (payment.status === 'pending') pendingCount++;
          else if (payment.status === 'overdue') overdueCount++;
        });
      });
    });

    const monthlyData = months.map(month => ({
      month: month.label,
      revenue: monthlyRevenue[month.key]
    }));

    const sportsData = Object.entries(sportsCount).map(([name, count]) => ({
      name,
      value: count
    }));
    
    const sportsRevenueData = Object.entries(sportsRevenueForMonth).map(([name, revenue]) => ({
      name,
      revenue
    }));

    const paymentStatusData = [
      { name: 'Payés', value: paidCount, color: '#10B981' },
      { name: 'En attente', value: pendingCount, color: '#F59E0B' },
      { name: 'En retard', value: overdueCount, color: '#EF4444' }
    ];

    // Generate available months for selector
    const availableMonths = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      availableMonths.push({ key: monthKey, label: monthLabel });
    }

    return { monthlyData, sportsData, sportsRevenueData, paymentStatusData, availableMonths };
  }, [club, selectedMonth]);

  const statCards = [
    {
      name: 'Total Athlètes',
      value: stats.totalAthletes,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Sports Disponibles',
      value: stats.totalSports,
      icon: Trophy,
      color: 'bg-green-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      name: 'Revenus ce mois',
      value: `${stats.monthlyPayments} DH`,
      icon: CreditCard,
      color: 'bg-yellow-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Revenus Totaux',
      value: `${stats.totalRevenue} DH`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center space-x-4">
          {club?.imageUrl ? (
            <img
              src={club.imageUrl}
              alt={club.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              Bienvenue, {club?.name}
            </h1>
            <p className="text-blue-100">
              Gérez votre club efficacement depuis ce tableau de bord
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenus Mensuels</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} DH`, 'Revenus']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Statut des Paiements</h2>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {chartData.paymentStatusData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue and Sports Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Revenue per Sport Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenus par Sport</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {chartData.availableMonths.map(month => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.sportsRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} DH`, 'Revenus']} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">{Object.keys(club?.sports || {}).length}</span> sport(s) disponible(s)
          </div>
        </div>

        {/* Sports Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Répartition par Sport</h2>
            <Trophy className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.sportsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}`, 'Athlètes']} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;