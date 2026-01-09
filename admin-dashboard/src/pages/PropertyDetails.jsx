import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, X, AlertCircle, MapPin, Bed, Bath, Ruler,
  Calendar, Car, Home, Building2, Leaf, Award, Sun, Zap, Thermometer,
  Droplets, User, Mail, Phone, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';

export const PropertyDetailPage = ({ propertyId, token, onBack }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    price: '',
    propertyType: '',
    city: '',
    neighborhood: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    lotSize: '',
    parkingSpaces: '',
    yearBuilt: '',
    hasGarage: false,
    isPetFriendly: false,
    hasInUnitLaundry: false,
    hasPool: false,
    hasGym: false,
    hasAirConditioning: false,
    hasSolarPanels: false,
    hasEnergyEfficientAppliances: false,
    hasLEDLighting: false,
    hasSmartThermostats: false,
    hasDoubleGlazedWindows: false,
    hasRainwaterHarvesting: false,
    hasGreenRoof: false,
    hasEnergyStarCertification: false,
    hasLEEDCertification: false,
    leedLevel: '',
  });

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const data = await api.getPropertyById(token, propertyId);
      setProperty(data);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        address: data.address || '',
        price: data.price || '',
        propertyType: data.propertyType || '',
        city: data.city || '',
        neighborhood: data.neighborhood || '',
        zipCode: data.zipCode || '',
        bedrooms: data.bedrooms || '',
        bathrooms: data.bathrooms || '',
        area: data.area || '',
        lotSize: data.lotSize || '',
        parkingSpaces: data.parkingSpaces || '',
        yearBuilt: data.yearBuilt || '',
        hasGarage: data.hasGarage || false,
        isPetFriendly: data.isPetFriendly || false,
        hasInUnitLaundry: data.hasInUnitLaundry || false,
        hasPool: data.hasPool || false,
        hasGym: data.hasGym || false,
        hasAirConditioning: data.hasAirConditioning || false,
        hasSolarPanels: data.hasSolarPanels || false,
        hasEnergyEfficientAppliances: data.hasEnergyEfficientAppliances || false,
        hasLEDLighting: data.hasLEDLighting || false,
        hasSmartThermostats: data.hasSmartThermostats || false,
        hasDoubleGlazedWindows: data.hasDoubleGlazedWindows || false,
        hasRainwaterHarvesting: data.hasRainwaterHarvesting || false,
        hasGreenRoof: data.hasGreenRoof || false,
        hasEnergyStarCertification: data.hasEnergyStarCertification || false,
        hasLEEDCertification: data.hasLEEDCertification || false,
        leedLevel: data.leedLevel || '',
      });
    } catch {
      toast.error(t('propertyDetails.loadError', 'Failed to load property. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('propertyDetails.errors.titleRequired', 'Title is required');
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = t('propertyDetails.errors.priceRequired', 'Price must be greater than 0');
    }
    if (!formData.description.trim()) {
      newErrors.description = t('propertyDetails.errors.descriptionRequired', 'Description is required');
    }
    if (!formData.address.trim()) {
      newErrors.address = t('propertyDetails.errors.addressRequired', 'Address is required');
    }
    if (!formData.city.trim()) {
      newErrors.city = t('propertyDetails.errors.cityRequired', 'City is required');
    }
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = t('propertyDetails.errors.neighborhoodRequired', 'Neighborhood is required');
    }
    if (!formData.propertyType) {
      newErrors.propertyType = t('propertyDetails.errors.typeRequired', 'Property type is required');
    }
    if (!formData.bedrooms || Number(formData.bedrooms) < 0) {
      newErrors.bedrooms = t('propertyDetails.errors.bedroomsRequired', 'Bedrooms must be 0 or more');
    }
    if (!formData.bathrooms || Number(formData.bathrooms) < 0) {
      newErrors.bathrooms = t('propertyDetails.errors.bathroomsRequired', 'Bathrooms must be 0 or more');
    }
    if (!formData.area || Number(formData.area) <= 0) {
      newErrors.area = t('propertyDetails.errors.areaRequired', 'Area must be greater than 0');
    }
    if (formData.yearBuilt && (Number(formData.yearBuilt) < 1800 || Number(formData.yearBuilt) > new Date().getFullYear())) {
      newErrors.yearBuilt = t('propertyDetails.errors.yearBuiltInvalid', `Year must be between 1800 and ${new Date().getFullYear()}`);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t('propertyDetails.validationError', 'Please fix the validation errors before saving.'));
      return;
    }

    setSaving(true);
    try {
      const cleanedData = {
        ...formData,
        lotSize: formData.lotSize === '' || formData.lotSize === null ? null : Number(formData.lotSize),
        yearBuilt: formData.yearBuilt === '' || formData.yearBuilt === null ? null : Number(formData.yearBuilt),
        parkingSpaces: formData.parkingSpaces === '' ? 0 : Number(formData.parkingSpaces),
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
      };

      await api.updateProperty(token, propertyId, cleanedData);
      toast.success(t('propertyDetails.updateSuccess', 'Property updated successfully!'));
      setEditing(false);
      setErrors({});
      loadProperty();
    } catch {
      toast.error(t('propertyDetails.updateError', 'Failed to update property. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setFormData({
      title: property.title || '',
      description: property.description || '',
      address: property.address || '',
      price: property.price || '',
      propertyType: property.propertyType || '',
      city: property.city || '',
      neighborhood: property.neighborhood || '',
      zipCode: property.zipCode || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      area: property.area || '',
      lotSize: property.lotSize || '',
      parkingSpaces: property.parkingSpaces || '',
      yearBuilt: property.yearBuilt || '',
      hasGarage: property.hasGarage || false,
      isPetFriendly: property.isPetFriendly || false,
      hasInUnitLaundry: property.hasInUnitLaundry || false,
      hasPool: property.hasPool || false,
      hasGym: property.hasGym || false,
      hasAirConditioning: property.hasAirConditioning || false,
      hasSolarPanels: property.hasSolarPanels || false,
      hasEnergyEfficientAppliances: property.hasEnergyEfficientAppliances || false,
      hasLEDLighting: property.hasLEDLighting || false,
      hasSmartThermostats: property.hasSmartThermostats || false,
      hasDoubleGlazedWindows: property.hasDoubleGlazedWindows || false,
      hasRainwaterHarvesting: property.hasRainwaterHarvesting || false,
      hasGreenRoof: property.hasGreenRoof || false,
      hasEnergyStarCertification: property.hasEnergyStarCertification || false,
      hasLEEDCertification: property.hasLEEDCertification || false,
      leedLevel: property.leedLevel || '',
    });
  };

  const propertyTypeOptions = [
    { value: '', label: t('propertyDetails.selectType', 'Select type') },
    { value: 'House', label: t('propertyDetails.types.house', 'House') },
    { value: 'Apartment', label: t('propertyDetails.types.apartment', 'Apartment') },
    { value: 'Studio', label: t('propertyDetails.types.studio', 'Studio') },
    { value: 'Condo', label: t('propertyDetails.types.condo', 'Condo') },
    { value: 'Townhouse', label: t('propertyDetails.types.townhouse', 'Townhouse') },
    { value: 'Villa', label: t('propertyDetails.types.villa', 'Villa') },
    { value: 'Land', label: t('propertyDetails.types.land', 'Land') },
    { value: 'Office', label: t('propertyDetails.types.office', 'Office') },
  ];

  const leedLevelOptions = [
    { value: '', label: t('propertyDetails.selectLeedLevel', 'Select LEED Level') },
    { value: 'Certified', label: t('propertyDetails.leed.certified', 'Certified') },
    { value: 'Silver', label: t('propertyDetails.leed.silver', 'Silver') },
    { value: 'Gold', label: t('propertyDetails.leed.gold', 'Gold') },
    { value: 'Platinum', label: t('propertyDetails.leed.platinum', 'Platinum') },
  ];

  // Albanian cities list
  const albanianCities = [
    'Tirana', 'Durrës', 'Vlorë', 'Elbasan', 'Shkodër', 'Fier', 'Korçë', 'Berat',
    'Lezhë', 'Gjirokastër', 'Kukës', 'Peshkopi', 'Sarandë', 'Lushnjë', 'Pogradec',
    'Kavajë', 'Krujë', 'Laç', 'Kuçovë', 'Burrel', 'Patos', 'Librazhd', 'Shijak',
    'Kamëz', 'Tepelenë'
  ];

  const cityOptions = [
    { value: '', label: t('properties.selectCity', 'Select city') },
    ...albanianCities.map(city => ({ value: city, label: city }))
  ];

  const getStatusType = (status) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Sold': return 'error';
      case 'Pending': return 'warning';
      case 'Rented': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status, listingType) => {
    // Normalize listingType for case-insensitive comparison
    const isRental = listingType?.toLowerCase() === 'rent';

    switch (status) {
      case 'Available':
        return isRental
          ? t('propertyDetails.statusOnRent', 'On Rent')
          : t('propertyDetails.statusOnSale', 'On Sale');
      case 'Sold': return t('propertyDetails.statusSold', 'Sold');
      case 'Pending': return t('propertyDetails.statusPending', 'Pending');
      case 'Rented': return t('propertyDetails.statusRented', 'Rented');
      default: return status || t('propertyDetails.statusUnknown', 'Unknown');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <Building2 className="w-10 h-10 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {t('propertyDetails.notFound', 'Property not found')}
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          {t('propertyDetails.notFoundDescription', 'The property you are looking for does not exist.')}
        </p>
        <Button onClick={onBack} icon={ArrowLeft}>
          {t('propertyDetails.backToProperties', 'Back to Properties')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} icon={ArrowLeft}>
            {t('propertyDetails.back', 'Back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {editing ? t('propertyDetails.editTitle', 'Edit Property') : t('propertyDetails.viewTitle', 'Property Details')}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={getStatusType(property.status)}>
                {getStatusLabel(property.status, property.listingType)}
              </StatusBadge>
              <span className="text-[var(--text-muted)]">ID: {property.id}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              {t('propertyDetails.edit', 'Edit Property')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} icon={X}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button variant="success" onClick={handleSave} loading={saving} icon={Save}>
                {t('propertyDetails.save', 'Save Changes')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {property.images?.length > 0 ? (
                <div>
                  <div className="relative aspect-video">
                    <img
                      src={property.images[activeImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {activeImageIndex + 1} / {property.images.length}
                    </div>
                  </div>
                  {property.images.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {property.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`
                            flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                            ${idx === activeImageIndex ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-transparent opacity-70 hover:opacity-100'}
                          `}
                        >
                          <img src={img} alt={`${property.title} ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <div className="text-center">
                    <Building2 className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-[var(--text-muted)]">{t('propertyDetails.noImages', 'No images available')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('propertyDetails.basicInfo', 'Basic Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('propertyDetails.title', 'Title')}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.title}
                  required
                />
                <Input
                  label={t('propertyDetails.price', 'Price')}
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.price}
                  icon={({ className }) => <span className={className}>€</span>}
                  required
                />
              </div>

              <Textarea
                label={t('propertyDetails.description', 'Description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!editing}
                error={errors.description}
                rows={4}
                required
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('propertyDetails.location', 'Location')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t('propertyDetails.address', 'Address')}
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                error={errors.address}
                icon={MapPin}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label={t('propertyDetails.city', 'City')}
                  name="city"
                  options={cityOptions}
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.city}
                />
                <Input
                  label={t('propertyDetails.neighborhood', 'Neighborhood')}
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.neighborhood}
                  required
                />
                <Input
                  label={t('propertyDetails.zipCode', 'Zip Code')}
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                {t('propertyDetails.propertyDetails', 'Property Details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select
                  label={t('propertyDetails.propertyType', 'Property Type')}
                  name="propertyType"
                  options={propertyTypeOptions}
                  value={formData.propertyType}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.propertyType}
                />
                <Input
                  label={t('propertyDetails.bedrooms', 'Bedrooms')}
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.bedrooms}
                  icon={Bed}
                />
                <Input
                  label={t('propertyDetails.bathrooms', 'Bathrooms')}
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.bathrooms}
                  icon={Bath}
                />
                <Input
                  label={t('propertyDetails.area', 'Area (m²)')}
                  name="area"
                  type="number"
                  value={formData.area}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.area}
                  icon={Ruler}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label={t('propertyDetails.lotSize', 'Lot Size (m²)')}
                  name="lotSize"
                  type="number"
                  value={formData.lotSize}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label={t('propertyDetails.parkingSpaces', 'Parking Spaces')}
                  name="parkingSpaces"
                  type="number"
                  value={formData.parkingSpaces}
                  onChange={handleChange}
                  disabled={!editing}
                  icon={Car}
                />
                <Input
                  label={t('propertyDetails.yearBuilt', 'Year Built')}
                  name="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  disabled={!editing}
                  error={errors.yearBuilt}
                  icon={Calendar}
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>{t('propertyDetails.amenities', 'Amenities')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'hasGarage', label: t('propertyDetails.amenity.garage', 'Garage'), icon: Car },
                  { name: 'isPetFriendly', label: t('propertyDetails.amenity.petFriendly', 'Pet Friendly'), icon: null },
                  { name: 'hasInUnitLaundry', label: t('propertyDetails.amenity.laundry', 'In-unit Laundry'), icon: null },
                  { name: 'hasPool', label: t('propertyDetails.amenity.pool', 'Pool'), icon: null },
                  { name: 'hasGym', label: t('propertyDetails.amenity.gym', 'Gym'), icon: null },
                  { name: 'hasAirConditioning', label: t('propertyDetails.amenity.ac', 'Air Conditioning'), icon: null },
                ].map((amenity) => (
                  <div
                    key={amenity.name}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-colors
                      ${formData[amenity.name]
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {formData[amenity.name] && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                      <span className={`text-sm ${formData[amenity.name] ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-[var(--text-secondary)]'}`}>
                        {amenity.label}
                      </span>
                    </div>
                    <Toggle
                      checked={formData[amenity.name]}
                      onChange={() => handleToggle(amenity.name)}
                      disabled={!editing}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Green Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success-600" />
                {t('propertyDetails.greenFeatures', 'Green Features & Certifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Certifications */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  {t('propertyDetails.certifications', 'Certifications')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`
                    flex items-center justify-between p-4 rounded-xl border transition-colors
                    ${formData.hasLEEDCertification
                      ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                    }
                  `}>
                    <div className="flex items-center gap-3">
                      <Award className={`w-6 h-6 ${formData.hasLEEDCertification ? 'text-success-600' : 'text-[var(--text-muted)]'}`} />
                      <span className={`font-medium ${formData.hasLEEDCertification ? 'text-success-700 dark:text-success-300' : 'text-[var(--text-secondary)]'}`}>
                        {t('propertyDetails.leedCertification', 'LEED Certification')}
                      </span>
                    </div>
                    <Toggle
                      checked={formData.hasLEEDCertification}
                      onChange={() => handleToggle('hasLEEDCertification')}
                      disabled={!editing}
                    />
                  </div>

                  <div className={`
                    flex items-center justify-between p-4 rounded-xl border transition-colors
                    ${formData.hasEnergyStarCertification
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                    }
                  `}>
                    <div className="flex items-center gap-3">
                      <Sun className={`w-6 h-6 ${formData.hasEnergyStarCertification ? 'text-primary-600' : 'text-[var(--text-muted)]'}`} />
                      <span className={`font-medium ${formData.hasEnergyStarCertification ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-secondary)]'}`}>
                        {t('propertyDetails.energyStar', 'Energy Star')}
                      </span>
                    </div>
                    <Toggle
                      checked={formData.hasEnergyStarCertification}
                      onChange={() => handleToggle('hasEnergyStarCertification')}
                      disabled={!editing}
                    />
                  </div>
                </div>

                {formData.hasLEEDCertification && (
                  <div className="mt-4">
                    <Select
                      label={t('propertyDetails.leedLevel', 'LEED Level')}
                      name="leedLevel"
                      options={leedLevelOptions}
                      value={formData.leedLevel}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                )}
              </div>

              {/* Eco Features */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  {t('propertyDetails.ecoFeatures', 'Eco Features')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'hasSolarPanels', label: t('propertyDetails.eco.solarPanels', 'Solar Panels'), icon: Sun },
                    { name: 'hasEnergyEfficientAppliances', label: t('propertyDetails.eco.energyEfficient', 'Energy Efficient Appliances'), icon: Zap },
                    { name: 'hasLEDLighting', label: t('propertyDetails.eco.led', 'LED Lighting'), icon: Zap },
                    { name: 'hasSmartThermostats', label: t('propertyDetails.eco.smartThermostat', 'Smart Thermostats'), icon: Thermometer },
                    { name: 'hasDoubleGlazedWindows', label: t('propertyDetails.eco.doubleGlazed', 'Double Glazed Windows'), icon: null },
                    { name: 'hasRainwaterHarvesting', label: t('propertyDetails.eco.rainwater', 'Rainwater Harvesting'), icon: Droplets },
                    { name: 'hasGreenRoof', label: t('propertyDetails.eco.greenRoof', 'Green Roof'), icon: Leaf },
                  ].map((feature) => (
                    <div
                      key={feature.name}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border transition-colors
                        ${formData[feature.name]
                          ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {feature.icon && <feature.icon className={`w-4 h-4 ${formData[feature.name] ? 'text-success-600' : 'text-[var(--text-muted)]'}`} />}
                        <span className={`text-sm ${formData[feature.name] ? 'text-success-700 dark:text-success-300 font-medium' : 'text-[var(--text-secondary)]'}`}>
                          {feature.label}
                        </span>
                      </div>
                      <Toggle
                        checked={formData[feature.name]}
                        onChange={() => handleToggle(feature.name)}
                        disabled={!editing}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <CardContent className="p-6">
              <p className="text-sm text-white/70 mb-1">{t('propertyDetails.price', 'Price')}</p>
              <p className="text-3xl font-bold">
                €{Number(property.price).toLocaleString()}
                {property.listingType?.toLowerCase() === 'rent' && (
                  <span className="text-xl font-normal">/mo</span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <Bed className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{property.bedrooms || 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t('propertyDetails.bedrooms', 'Bedrooms')}</p>
                </div>
                <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <Bath className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{property.bathrooms || 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t('propertyDetails.bathrooms', 'Bathrooms')}</p>
                </div>
                <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <Ruler className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{property.area || 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">m²</p>
                </div>
                <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <Car className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{property.parkingSpaces || 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t('propertyDetails.parking', 'Parking')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('propertyDetails.ownerInfo', 'Owner Information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <Avatar name={property.ownerName || 'Unknown'} size="md" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{property.ownerName || 'N/A'}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t('propertyDetails.propertyOwner', 'Property Owner')}</p>
                </div>
              </div>

              {property.ownerEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-secondary)]">{property.ownerEmail}</span>
                </div>
              )}

              {property.ownerPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-secondary)]">{property.ownerPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Meta */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{t('propertyDetails.status', 'Status')}</span>
                <StatusBadge status={getStatusType(property.status)}>
                  {getStatusLabel(property.status, property.listingType)}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{t('propertyDetails.type', 'Type')}</span>
                <Badge variant="outline">{property.propertyType || 'N/A'}</Badge>
              </div>
              {property.yearBuilt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{t('propertyDetails.yearBuilt', 'Year Built')}</span>
                  <span className="text-[var(--text-primary)] font-medium">{property.yearBuilt}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{t('propertyDetails.created', 'Created')}</span>
                <span className="text-[var(--text-primary)]">
                  {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
