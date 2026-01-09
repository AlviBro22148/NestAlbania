import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Trash2, Plus, Building2, MapPin, DollarSign, Filter, Download, MoreHorizontal, Edit } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/Modal';
import { Skeleton, SkeletonTableRow } from '../components/ui/Skeleton';
import { ActionsDropdown } from '../components/ui/Dropdown';
import { Select } from '../components/ui/Select';

export const PropertiesPage = ({ token, onViewProperty, onCreateProperty }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, title: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadProperties();
  }, [currentPage, pageSize]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await api.getProperties(token, currentPage, pageSize);
      setProperties(data.properties || data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || data.properties?.length || 0);
    } catch {
      toast.error(t('properties.loadError', 'Failed to load properties. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteProperty(token, deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null, title: '' });
      toast.success(t('properties.deleteSuccess', 'Property deleted successfully'));
      loadProperties();
    } catch {
      toast.error(t('properties.deleteError', 'Failed to delete property. Please try again.'));
    }
  };

  const filteredProperties = (properties || []).filter(p => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesType = !typeFilter || p.propertyType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusLabel = (status, listingType) => {
    // Normalize listingType for case-insensitive comparison
    const isRental = listingType?.toLowerCase() === 'rent';

    switch (status) {
      case 'Available':
        return isRental
          ? t('properties.statusOnRent', 'On Rent')
          : t('properties.statusOnSale', 'On Sale');
      case 'Sold': return t('properties.statusSold', 'Sold');
      case 'Pending': return t('properties.statusPending', 'Pending');
      case 'Rented': return t('properties.statusRented', 'Rented');
      default: return status || t('properties.statusUnknown', 'Unknown');
    }
  };

  const statusOptions = [
    { value: '', label: t('properties.allStatuses', 'All Statuses') },
    { value: 'Available', label: t('properties.statusAvailable', 'Available') },
    { value: 'Sold', label: t('properties.statusSold', 'Sold') },
    { value: 'Pending', label: t('properties.statusPending', 'Pending') },
    { value: 'Rented', label: t('properties.statusRented', 'Rented') },
  ];

  const typeOptions = [
    { value: '', label: t('properties.allTypes', 'All Types') },
    { value: 'House', label: t('properties.typeHouse', 'House') },
    { value: 'Apartment', label: t('properties.typeApartment', 'Apartment') },
    { value: 'Villa', label: t('properties.typeVilla', 'Villa') },
    { value: 'Land', label: t('properties.typeLand', 'Land') },
    { value: 'Commercial', label: t('properties.typeCommercial', 'Commercial') },
  ];

  const pageSizeOptions = [
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ];

  const getPropertyActions = (property) => [
    {
      label: t('properties.view', 'View Details'),
      icon: Eye,
      onClick: () => onViewProperty(property.id),
    },
    {
      label: t('properties.edit', 'Edit'),
      icon: Edit,
      onClick: () => onViewProperty(property.id),
    },
    { type: 'divider' },
    {
      label: t('properties.delete', 'Delete'),
      icon: Trash2,
      onClick: () => setDeleteDialog({ isOpen: true, id: property.id, title: property.title }),
      danger: true,
    },
  ];

  const handleExportCSV = () => {
    if (filteredProperties.length === 0) {
      toast.warning(t('properties.noPropertiesToExport', 'No properties to export'));
      return;
    }

    // Helper to get value from multiple possible field names (including nested objects)
    const getValue = (obj, ...keys) => {
      for (const key of keys) {
        // Check direct property
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
          return obj[key];
        }
      }
      // Check in common nested structures
      const nestedObjects = [obj.details, obj.specs, obj.features, obj.attributes, obj.info];
      for (const nested of nestedObjects) {
        if (nested) {
          for (const key of keys) {
            if (nested[key] !== undefined && nested[key] !== null && nested[key] !== '') {
              return nested[key];
            }
          }
        }
      }
      return '';
    };

    const headers = [
      'Title',
      'City',
      'Address',
      'Type',
      'Listing Type',
      'Bedrooms',
      'Bathrooms',
      'Area (m²)',
      'Price (€)',
      'Status',
      'Owner',
      'Created At'
    ];

    const rows = filteredProperties.map(p => {
      // Get listing type from multiple possible field names
      const listingType = getValue(p, 'listingType', 'ListingType', 'listing_type', 'saleType', 'SaleType', 'type', 'transactionType', 'offerType');
      // Get bedrooms from multiple possible field names
      const bedrooms = getValue(p, 'bedrooms', 'Bedrooms', 'numberOfBedrooms', 'bedroomCount', 'numBedrooms', 'rooms', 'dhoma');
      // Get bathrooms from multiple possible field names
      const bathrooms = getValue(p, 'bathrooms', 'Bathrooms', 'numberOfBathrooms', 'bathroomCount', 'numBathrooms', 'baths', 'tualete');
      // Get area from multiple possible field names
      const area = getValue(p, 'area', 'Area', 'size', 'Size', 'squareMeters', 'sqm', 'surface', 'siperfaqe', 'm2');

      return [
        `"${(p.title || p.Title || '').replace(/"/g, '""')}"`,
        `"${(p.city || p.City || p.location || '').replace(/"/g, '""')}"`,
        `"${(p.address || p.Address || '').replace(/"/g, '""')}"`,
        p.propertyType || p.PropertyType || p.type || '',
        listingType,
        bedrooms !== '' ? bedrooms : 'N/A',
        bathrooms !== '' ? bathrooms : 'N/A',
        area !== '' ? area : 'N/A',
        p.price || p.Price || 0,
        p.status || p.Status || '',
        `"${(p.owner?.username || p.ownerName || p.OwnerName || '').replace(/"/g, '""')}"`,
        p.createdAt || p.CreatedAt ? new Date(p.createdAt || p.CreatedAt).toLocaleDateString() : '',
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Create filename with filters applied
    let filename = 'properties';
    if (statusFilter) filename += `_${statusFilter.toLowerCase()}`;
    if (typeFilter) filename += `_${typeFilter.toLowerCase()}`;
    if (searchTerm) filename += `_search`;
    filename += `_${new Date().toISOString().split('T')[0]}.csv`;

    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('properties.exportSuccess', `${filteredProperties.length} properties exported successfully`));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('properties.title', 'Properties')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {t('properties.subtitle', 'Manage all property listings')}
          </p>
        </div>
        {onCreateProperty && (
          <Button onClick={onCreateProperty} icon={Plus}>
            {t('properties.createProperty', 'Add Property')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-200 dark:border-primary-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalCount}</p>
                <p className="text-sm text-[var(--text-secondary)]">{t('properties.totalProperties', 'Total Properties')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success-500/10 to-success-600/5 border-success-200 dark:border-success-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
                <Building2 className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {properties.filter(p => p.status === 'Available').length}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{t('properties.available', 'Available')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning-500/10 to-warning-600/5 border-warning-200 dark:border-warning-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
                <Building2 className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {properties.filter(p => p.status === 'Pending').length}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{t('properties.pending', 'Pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-error-500/10 to-error-600/5 border-error-200 dark:border-error-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error-100 dark:bg-error-900/30">
                <DollarSign className="w-5 h-5 text-error-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {properties.filter(p => p.status === 'Sold').length}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{t('properties.sold', 'Sold')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('properties.searchPlaceholder', 'Search properties by title or address...')}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
              <Select
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" icon={Download} onClick={handleExportCSV}>
                {t('properties.export', 'Export')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.property', 'Property')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.type', 'Type')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.city', 'City')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.price', 'Price')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.status', 'Status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.owner', 'Owner')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {t('properties.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {loading ? (
                  // Skeleton loading rows
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-lg" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                          <Building2 className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[var(--text-secondary)] font-medium">
                          {t('properties.noProperties', 'No properties found')}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                          {t('properties.noPropertiesHint', 'Try adjusting your search or filters')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property, index) => (
                    <tr
                      key={property.id}
                      className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => onViewProperty(property.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={property.images?.[0] || '/placeholder.jpg'}
                              alt={property.title || 'Property'}
                              className="w-12 h-12 rounded-lg object-cover border border-[var(--border-primary)]"
                              onError={(e) => {
                                e.target.src = '/placeholder.jpg';
                              }}
                            />
                            {property.featured && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning-500 rounded-full flex items-center justify-center">
                                <span className="text-[8px] text-white">★</span>
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                              {property.title || t('properties.untitled', 'Untitled')}
                            </p>
                            <p className="text-sm text-[var(--text-muted)] truncate max-w-[200px] flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {property.address || t('properties.noAddress', 'No address')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {property.propertyType || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {property.city ? (
                          <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                            <MapPin className="w-3 h-3" />
                            {property.city}
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[var(--text-primary)]">
                          €{(property.price || 0).toLocaleString()}
                        </span>
                        {property.listingType?.toLowerCase() === 'rent' && (
                          <span className="text-[var(--text-muted)] text-sm">/mo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={property.status}>
                          {getStatusLabel(property.status, property.listingType)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={property.owner?.username || property.ownerName || 'Unknown'}
                            size="sm"
                          />
                          <span className="text-[var(--text-secondary)] truncate max-w-[100px]">
                            {property.owner?.username || property.ownerName || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <ActionsDropdown items={getPropertyActions(property)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredProperties.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('properties.showing', 'Showing')} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} {t('properties.of', 'of')} {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">{t('properties.perPage', 'Per page')}:</span>
                  <Select
                    options={pageSizeOptions}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  {t('properties.first', 'First')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('properties.previous', 'Previous')}
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[36px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('properties.next', 'Next')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  {t('properties.last', 'Last')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, title: '' })}
        onConfirm={handleDelete}
        title={t('properties.deleteTitle', 'Delete Property')}
        message={t('properties.deleteMessage', 'Are you sure you want to delete "{{title}}"? This action cannot be undone.', { title: deleteDialog.title })}
        confirmText={t('properties.deleteConfirm', 'Delete')}
        cancelText={t('properties.deleteCancel', 'Cancel')}
        variant="danger"
      />
    </div>
  );
};

export default PropertiesPage;
