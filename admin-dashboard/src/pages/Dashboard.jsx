import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, TrendingUp, DollarSign, Calendar, Award, MessageSquare, FileText, ArrowUpRight, ArrowDownRight, Key, Home, MapPin } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { StatsCard, Card, CardHeader, CardTitle } from '../components/ui/Card';
import { SkeletonStatsCard, SkeletonCard } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../contexts/ThemeContext';

// Theme-aware chart colors
const CHART_COLORS = {
  light: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'],
  dark: ['#818cf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#a3e635', '#f472b6']
};

export const DashboardPage = ({ token, auth }) => {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is CityAdmin
  const isCityAdmin = auth?.role === 'CityAdmin';
  const adminCity = auth?.city;

  const COLORS = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  // Chart styling based on theme
  const chartTheme = {
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#94a3b8' : '#64748b',
    tooltip: {
      bg: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '#334155' : '#e2e8f0',
      text: isDark ? '#f1f5f9' : '#0f172a'
    }
  };

  const translatePropertyType = (type) => {
    const typeMap = {
      'Apartment': t('properties.types.apartment'),
      'House': t('properties.types.house'),
      'Villa': t('properties.types.villa'),
      'Studio': t('properties.types.studio'),
      'Office': t('properties.types.office'),
      'Condo': t('properties.types.condo'),
      'Townhouse': t('properties.types.townhouse'),
      'Land': t('properties.types.land'),
      'Other': t('common.all')
    };
    return typeMap[type] || type;
  };

  const translateStatus = (status) => {
    const statusMap = {
      'Available': t('properties.available'),
      'Sold': t('properties.sold'),
      'Rented': t('properties.statusRented'),
      'Pending': t('common.pending')
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const processUserGrowth = (users) => {
    if (!users || !Array.isArray(users)) return [];
    const monthlyData = {};
    const now = new Date();
    const locale = i18n.language === 'sq' ? 'sq-AL' : 'en-US';

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
      monthlyData[key] = { month: monthName, users: 0 };
    }

    users.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].users++;
        }
      }
    });

    return Object.values(monthlyData);
  };

  const processPropertyTypes = (properties) => {
    if (!properties || !Array.isArray(properties)) return [];
    const typeCount = {};
    properties.forEach(prop => {
      const type = prop.propertyType || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        translatedType: translatePropertyType(type),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await api.getDashboardStats(token);
      setStats(statsData);

      const chartsData = await api.getCharts(token);
      setCharts(chartsData);

      try {
        const feedbackStatsData = await api.getFeedbackStats(token);
        setFeedbackStats(feedbackStatsData);
      } catch (e) {
        console.error('Could not load feedback stats:', e);
      }

      try {
        const usersData = await api.getUsers(token, 1, 500);
        const growthData = processUserGrowth(usersData);
        setUserGrowth(growthData);
      } catch (e) {
        console.error('Could not load user growth data:', e);
      }

      try {
        const propertiesData = await api.getProperties(token, 1, 500);
        const properties = propertiesData.properties || propertiesData || [];
        const typeData = processPropertyTypes(properties);
        setPropertyTypeData(typeData);
      } catch (e) {
        console.error('Could not load property type data:', e);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-[var(--text-secondary)]" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-48 bg-[var(--bg-tertiary)] rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <SkeletonStatsCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <SkeletonCard key={i} lines={0} className="h-80" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('dashboard.totalProperties'),
      value: stats?.totalProperties || 0,
      icon: Building2,
      variant: 'primary',
      trend: 12,
      trendLabel: t('dashboard.vsLastMonth', 'vs last month')
    },
    {
      title: t('dashboard.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: Users,
      variant: 'success',
      trend: 8,
      trendLabel: t('dashboard.vsLastMonth', 'vs last month')
    },
    {
      title: t('dashboard.activeProperties'),
      value: stats?.activeProperties || 0,
      icon: TrendingUp,
      variant: 'warning',
      trend: -3,
      trendLabel: t('dashboard.vsLastMonth', 'vs last month')
    },
    {
      title: t('dashboard.totalValue'),
      value: `$${((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      variant: 'accent',
      trend: 15,
      trendLabel: t('dashboard.vsLastMonth', 'vs last month')
    }
  ];

  const getFeedbackChartData = () => {
    if (!feedbackStats) return [];
    return [
      { name: t('dashboard.pending'), value: feedbackStats.pendingCount || 0 },
      { name: t('dashboard.inReview'), value: feedbackStats.reviewedCount || 0 },
      { name: t('dashboard.resolved'), value: feedbackStats.resolvedCount || 0 }
    ].filter(d => d.value > 0);
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('dashboard.summary')}</h1>
          {isCityAdmin && adminCity && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              {adminCity}
            </span>
          )}
        </div>
        <p className="text-[var(--text-secondary)] mt-1">
          {isCityAdmin
            ? t('dashboard.cityAdminWelcome', `Managing properties and users in ${adminCity}`, { city: adminCity })
            : t('dashboard.welcomeBack', 'Welcome back! Here\'s what\'s happening.')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            trend={stat.trend}
            trendLabel={stat.trendLabel}
            className="stagger-item"
          />
        ))}
      </div>

      {charts && (
        <>
          {/* Row 1: Status & Price Range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card padding="md" className="stagger-item">
              <CardHeader>
                <CardTitle>{t('dashboard.propertiesByStatus')}</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.propertiesByStatus?.map(item => ({
                      ...item,
                      translatedStatus: translateStatus(item.status)
                    }))}
                    dataKey="count"
                    nameKey="translatedStatus"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ translatedStatus, count }) => `${translatedStatus}: ${count}`}
                  >
                    {charts.propertiesByStatus?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="md" className="stagger-item">
              <CardHeader>
                <CardTitle>{t('dashboard.propertiesByPriceRange')}</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.propertiesByPriceRange}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="range" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Row 2: Sales per Month */}
          <Card padding="md" className="mb-6 stagger-item">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                <CardTitle>{t('dashboard.propertiesSoldPerMonth')}</CardTitle>
              </div>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.propertiesSoldPerMonth}>
                <defs>
                  <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="month" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  fill="url(#colorSold)"
                  name={t('dashboard.propertiesSold')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Row 3: Price Trends & Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card padding="md" className="stagger-item">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success-500" />
                  <CardTitle>{t('dashboard.avgPricePerMonth')}</CardTitle>
                </div>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.avgPricePerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="month" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} tickFormatter={(v) => `$${(v/1000)}k`} />
                  <Tooltip content={<CustomTooltip />} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Line type="monotone" dataKey="avgPrice" stroke={COLORS[1]} strokeWidth={2} dot={{ fill: COLORS[1] }} name={t('dashboard.avgPrice')} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="md" className="stagger-item">
              <CardHeader>
                <CardTitle>{t('dashboard.topCitiesSold')}</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.propertiesSoldByCity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis type="number" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <YAxis type="category" dataKey="city" width={100} tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Row 4: Sales Volume & Days to Sell */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card padding="md" className="lg:col-span-2 stagger-item">
              <CardHeader>
                <CardTitle>{t('dashboard.topPropertyTypesBySales')}</CardTitle>
              </CardHeader>
              {charts.topPropertyTypesBySalesVolume && charts.topPropertyTypesBySalesVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.topPropertyTypesBySalesVolume?.map(item => ({
                    ...item,
                    translatedType: translatePropertyType(item.propertyType)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="translatedType" angle={-45} textAnchor="end" height={80} tick={{ fill: chartTheme.text, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Bar dataKey="totalSalesVolume" fill={COLORS[4]} radius={[4, 4, 0, 0]} name={t('dashboard.totalSalesVolume')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-[var(--text-muted)]">{t('dashboard.noSalesData')}</p>
                </div>
              )}
            </Card>

            <Card padding="md" className="flex flex-col items-center justify-center stagger-item">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-4 shadow-lg">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-2">{t('dashboard.avgDaysToSell')}</p>
              <p className="text-5xl font-bold text-[var(--text-primary)]">{charts.avgDaysToSell}</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">{t('dashboard.days')}</p>
            </Card>
          </div>

          {/* Row 5: Rentals per Month */}
          {charts.propertiesRentedPerMonth && charts.propertiesRentedPerMonth.length > 0 && (
            <Card padding="md" className="mb-6 stagger-item">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-500" />
                  <CardTitle>{t('dashboard.propertiesRentedPerMonth')}</CardTitle>
                </div>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.propertiesRentedPerMonth}>
                  <defs>
                    <linearGradient id="colorRented" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[4]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[4]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="month" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS[4]}
                    strokeWidth={2}
                    fill="url(#colorRented)"
                    name={t('dashboard.propertiesRented')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Row 6: Rental Stats - Avg Rent & Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {charts.avgRentPerMonth && charts.avgRentPerMonth.length > 0 && (
              <Card padding="md" className="stagger-item">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-500" />
                    <CardTitle>{t('dashboard.avgRentPerMonth')}</CardTitle>
                  </div>
                </CardHeader>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.avgRentPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="month" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Line type="monotone" dataKey="avgRent" stroke={COLORS[4]} strokeWidth={2} dot={{ fill: COLORS[4] }} name={t('dashboard.avgRent')} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {charts.propertiesRentedByCity && charts.propertiesRentedByCity.length > 0 && (
              <Card padding="md" className="stagger-item">
                <CardHeader>
                  <CardTitle>{t('dashboard.topCitiesRented')}</CardTitle>
                </CardHeader>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.propertiesRentedByCity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis type="number" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <YAxis type="category" dataKey="city" width={100} tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={COLORS[4]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Row 7: Rental Volume & Days to Rent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {charts.topPropertyTypesByRentalVolume && charts.topPropertyTypesByRentalVolume.length > 0 && (
              <Card padding="md" className="lg:col-span-2 stagger-item">
                <CardHeader>
                  <CardTitle>{t('dashboard.topPropertyTypesByRentals')}</CardTitle>
                </CardHeader>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.topPropertyTypesByRentalVolume?.map(item => ({
                    ...item,
                    translatedType: translatePropertyType(item.propertyType)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="translatedType" angle={-45} textAnchor="end" height={80} tick={{ fill: chartTheme.text, fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} formatter={(value) => `$${Number(value).toLocaleString()}/yr`} />
                    <Bar dataKey="totalRentalVolume" fill={COLORS[4]} radius={[4, 4, 0, 0]} name={t('dashboard.annualRentalVolume')} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            <Card padding="md" className="flex flex-col items-center justify-center stagger-item">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                <Key className="w-10 h-10 text-white" />
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-2">{t('dashboard.avgDaysToRent')}</p>
              <p className="text-5xl font-bold text-[var(--text-primary)]">{charts.avgDaysToRent || 0}</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">{t('dashboard.days')}</p>
            </Card>
          </div>

          {/* Row 8: Top Agents - Rentals */}
          {charts.topAgentsRented && charts.topAgentsRented.length > 0 && (
            <Card padding="md" className="mb-6 stagger-item">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <CardTitle>{t('dashboard.topAgentsRented')}</CardTitle>
                </div>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.topAgentsRented}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="username" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rentedCount" fill={COLORS[4]} radius={[4, 4, 0, 0]} name={t('dashboard.propertiesRented')} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Row 9: User Growth & Property Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {userGrowth.length > 0 && (
              <Card padding="md" className="stagger-item">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-500" />
                    <CardTitle>{t('dashboard.userGrowth')}</CardTitle>
                  </div>
                </CardHeader>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[4]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[4]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="month" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: chartTheme.text, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="users" stroke={COLORS[4]} strokeWidth={2} fill="url(#colorUsers)" name={t('dashboard.registeredUsers')} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )}

            {propertyTypeData.length > 0 && (
              <Card padding="md" className="stagger-item">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-warning-500" />
                    <CardTitle>{t('dashboard.propertyTypeDistribution')}</CardTitle>
                  </div>
                </CardHeader>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={propertyTypeData} dataKey="count" nameKey="translatedType" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} label={({ translatedType, count }) => `${translatedType}: ${count}`}>
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Row 6: Feedback Stats */}
          {feedbackStats && (feedbackStats.pendingCount > 0 || feedbackStats.reviewedCount > 0 || feedbackStats.resolvedCount > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card padding="md" className="stagger-item">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-warning-500" />
                    <CardTitle>{t('dashboard.feedbackByStatus')}</CardTitle>
                  </div>
                </CardHeader>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={getFeedbackChartData()} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} label>
                      <Cell fill={COLORS[2]} />
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card padding="md" className="stagger-item">
                <CardHeader>
                  <CardTitle>{t('dashboard.feedbackSummary')}</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl">
                    <span className="text-warning-700 dark:text-warning-400 font-medium">{t('dashboard.pending')}</span>
                    <span className="text-2xl font-bold text-warning-600 dark:text-warning-400">{feedbackStats.pendingCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                    <span className="text-accent-700 dark:text-accent-400 font-medium">{t('dashboard.inReview')}</span>
                    <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">{feedbackStats.reviewedCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-success-50 dark:bg-success-900/20 rounded-xl">
                    <span className="text-success-700 dark:text-success-400 font-medium">{t('dashboard.resolved')}</span>
                    <span className="text-2xl font-bold text-success-600 dark:text-success-400">{feedbackStats.resolvedCount || 0}</span>
                  </div>
                </div>
              </Card>

              <Card padding="md" className="flex flex-col items-center justify-center stagger-item">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-lg">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <p className="text-[var(--text-secondary)] text-sm mb-2">{t('dashboard.totalFeedback')}</p>
                <p className="text-5xl font-bold text-[var(--text-primary)]">{feedbackStats.totalFeedback || 0}</p>
              </Card>
            </div>
          )}

          {/* Row 7: Top Agents */}
          {charts.topAgents && charts.topAgents.length > 0 && (
            <Card padding="md" className="mb-6 stagger-item">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-warning-500" />
                  <CardTitle>{t('dashboard.topAgents')}</CardTitle>
                </div>
              </CardHeader>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.topAgents}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="username" tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="soldCount" fill={COLORS[2]} radius={[4, 4, 0, 0]} name={t('dashboard.propertiesSold')} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Row 8: Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="md" className="stagger-item">
              <CardHeader>
                <CardTitle>{t('dashboard.recentUsers')}</CardTitle>
                <Badge variant="primary">{stats.recentUsers?.length || 0} {t('common.new', 'new')}</Badge>
              </CardHeader>
              <div className="space-y-3">
                {stats.recentUsers?.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.username} size="sm" />
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{user.username}</p>
                        <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString(i18n.language === 'sq' ? 'sq-AL' : 'en-US')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md" className="stagger-item">
              <CardHeader>
                <CardTitle>{t('dashboard.recentProperties')}</CardTitle>
                <Badge variant="success">{stats.recentProperties?.length || 0} {t('common.new', 'new')}</Badge>
              </CardHeader>
              <div className="space-y-3">
                {stats.recentProperties?.map(property => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] line-clamp-1">{property.title}</p>
                        <p className="text-sm font-semibold text-success-600 dark:text-success-400">
                          ${property.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(property.createdAt).toLocaleDateString(i18n.language === 'sq' ? 'sq-AL' : 'en-US')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
