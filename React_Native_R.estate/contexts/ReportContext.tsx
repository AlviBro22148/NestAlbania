import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-config';
import { useAuth } from './AuthContext';

export interface ReportProperty {
  id: number;
  propertyId: number;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: string;
  image?: string;
  addedAt: string;
  notes?: string;
}

export interface Report {
  id: number;
  name: string;
  description?: string;
  properties: ReportProperty[];
  createdAt: string;
  updatedAt: string;
}

interface ReportContextType {
  reports: Report[];
  loading: boolean;
  createReport: (name: string, description?: string) => Promise<Report>;
  updateReport: (reportId: number, updates: Partial<Pick<Report, 'name' | 'description'>>) => Promise<void>;
  deleteReport: (reportId: number) => Promise<void>;
  addPropertyToReport: (reportId: number, property: {
    id: number;
    title: string;
    price: number;
    address: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    propertyType: string;
    images: string[];
    notes?: string;
  }) => Promise<void>;
  removePropertyFromReport: (reportId: number, propertyId: number) => Promise<void>;
  updatePropertyNotes: (reportId: number, propertyId: number, notes: string) => Promise<void>;
  getReport: (reportId: number) => Report | undefined;
  isPropertyInReport: (reportId: number, propertyId: number) => boolean;
  isPropertyInAnyReport: (propertyId: number) => boolean;
  getReportsContainingProperty: (propertyId: number) => Report[];
  refreshReports: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Invalidate React Query reports cache
  const invalidateReportsCache = () => {
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  // Fetch reports from API
  const fetchReports = async () => {
    if (!isAuthenticated || !user) {
      setReports([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/api/reports');
      const reportsData = response.data || [];

      // Transform API response to match our interface
      const transformedReports: Report[] = reportsData.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        properties: (r.properties || []).map((rp: any) => ({
          id: rp.id,
          propertyId: rp.propertyId,
          title: rp.property?.title || 'Unknown Property',
          price: rp.property?.price || 0,
          address: rp.property?.address || '',
          bedrooms: rp.property?.bedrooms || 0,
          bathrooms: rp.property?.bathrooms || 0,
          area: rp.property?.area || 0,
          propertyType: rp.property?.propertyType || '',
          status: rp.property?.status || '',
          image: rp.property?.image,
          addedAt: rp.addedAt,
          notes: rp.notes,
        })),
      }));

      setReports(transformedReports);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Reports API not implemented yet');
      } else {
        console.error('Error fetching reports:', error);
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Load reports when user changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    } else {
      setReports([]);
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  // Create a new report
  const createReport = async (name: string, description?: string): Promise<Report> => {
    try {
      const response = await api.post('/api/reports', { name, description });
      const newReport: Report = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        properties: [],
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };

      setReports(prev => [...prev, newReport]);
      invalidateReportsCache(); // Sync React Query cache
      return newReport;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  };

  // Update report name/description
  const updateReport = async (reportId: number, updates: Partial<Pick<Report, 'name' | 'description'>>) => {
    try {
      await api.put(`/api/reports/${reportId}`, updates);

      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, ...updates, updatedAt: new Date().toISOString() }
            : report
        )
      );
      invalidateReportsCache(); // Sync React Query cache
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  };

  // Delete a report
  const deleteReport = async (reportId: number) => {
    try {
      await api.delete(`/api/reports/${reportId}`);
      setReports(prev => prev.filter(report => report.id !== reportId));
      invalidateReportsCache(); // Sync React Query cache
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  };

  // Add property to a report
  const addPropertyToReport = async (
    reportId: number,
    property: {
      id: number;
      title: string;
      price: number;
      address: string;
      bedrooms: number;
      bathrooms: number;
      area: number;
      propertyType: string;
      images: string[];
      notes?: string;
    }
  ) => {
    try {
      const response = await api.post(`/api/reports/${reportId}/properties`, {
        propertyId: property.id,
        notes: property.notes,
      });

      // Update local state
      const reportProperty: ReportProperty = {
        id: response.data.reportProperty.id,
        propertyId: property.id,
        title: property.title,
        price: property.price,
        address: property.address,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        propertyType: property.propertyType,
        status: '',
        image: property.images?.[0],
        addedAt: response.data.reportProperty.addedAt,
        notes: property.notes,
      };

      setReports(prev =>
        prev.map(report => {
          if (report.id !== reportId) return report;
          return {
            ...report,
            properties: [...report.properties, reportProperty],
            updatedAt: new Date().toISOString(),
          };
        })
      );
      invalidateReportsCache(); // Sync React Query cache
    } catch (error: any) {
      console.error('Error adding property to report:', error);
      throw error;
    }
  };

  // Remove property from a report
  const removePropertyFromReport = async (reportId: number, propertyId: number) => {
    try {
      await api.delete(`/api/reports/${reportId}/properties/${propertyId}`);

      setReports(prev =>
        prev.map(report => {
          if (report.id !== reportId) return report;
          return {
            ...report,
            properties: report.properties.filter(p => p.propertyId !== propertyId),
            updatedAt: new Date().toISOString(),
          };
        })
      );
      invalidateReportsCache(); // Sync React Query cache
    } catch (error) {
      console.error('Error removing property from report:', error);
      throw error;
    }
  };

  // Update notes for a property in a report
  const updatePropertyNotes = async (reportId: number, propertyId: number, notes: string) => {
    try {
      await api.put(`/api/reports/${reportId}/properties/${propertyId}`, { notes });

      setReports(prev =>
        prev.map(report => {
          if (report.id !== reportId) return report;
          return {
            ...report,
            properties: report.properties.map(p =>
              p.propertyId === propertyId ? { ...p, notes } : p
            ),
            updatedAt: new Date().toISOString(),
          };
        })
      );
      invalidateReportsCache(); // Sync React Query cache
    } catch (error) {
      console.error('Error updating property notes:', error);
      throw error;
    }
  };

  // Get a single report by ID
  const getReport = (reportId: number) => {
    return reports.find(report => report.id === reportId);
  };

  // Check if property is in a specific report
  const isPropertyInReport = (reportId: number, propertyId: number) => {
    const report = reports.find(r => r.id === reportId);
    return report?.properties.some(p => p.propertyId === propertyId) || false;
  };

  // Check if property is in any report
  const isPropertyInAnyReport = (propertyId: number) => {
    return reports.some(report => report.properties.some(p => p.propertyId === propertyId));
  };

  // Get all reports containing a specific property
  const getReportsContainingProperty = (propertyId: number) => {
    return reports.filter(report => report.properties.some(p => p.propertyId === propertyId));
  };

  // Refresh reports from API
  const refreshReports = async () => {
    await fetchReports();
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        loading,
        createReport,
        updateReport,
        deleteReport,
        addPropertyToReport,
        removePropertyFromReport,
        updatePropertyNotes,
        getReport,
        isPropertyInReport,
        isPropertyInAnyReport,
        getReportsContainingProperty,
        refreshReports,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
