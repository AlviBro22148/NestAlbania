import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, ArrowLeft, Save, MapPin, Home, Bed, Bath,
  Car, Leaf, Image, DollarSign, Calendar, Ruler, User
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { ImageUpload } from '../components/ui/ImageUpload';

export const PropertyCreatePage = ({ token, onBack, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [images, setImages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getUsers(token);
        setUsers(data || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [token]);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    price: '',
    propertyType: 'Apartment',
    listingType: 'Sale',
    status: 'Available',
    ownerId: '', // Selected user ID

    // Location
    address: '',
    city: '',
    neighborhood: '',
    zipCode: '',

    // Size & Rooms
    bedrooms: '',
    bathrooms: '',
    area: '',
    lotSize: '',
    yearBuilt: '',
    parkingSpaces: '',

    // Amenities
    hasGarage: false,
    petFriendly: false,
    hasPool: false,
    hasGym: false,
    hasAC: false,
    hasLaundry: false,

    // Green Features
    hasSolarPanels: false,
    energyEfficient: false,
    hasLED: false,
    smartThermostat: false,
    doubleGlazed: false,
    rainwaterHarvesting: false,
    greenRoof: false,
    energyStar: false,
    leedCertified: false,
    leedLevel: '',
    ecoScore: '',

    // Rental Details (if listingType is Rent)
    monthlyRent: '',
    securityDeposit: '',
    leaseTerm: '',
    utilitiesIncluded: false,
    furnished: 'Unfurnished'
  });

  const propertyTypes = ['Apartment', 'House', 'Villa', 'Studio', 'Office', 'Condo', 'Townhouse', 'Land'];
  const leedLevels = ['', 'Certified', 'Silver', 'Gold', 'Platinum'];
  const furnishedOptions = ['Unfurnished', 'Semi-Furnished', 'Fully-Furnished'];

  const sections = [
    { id: 'basic', label: t('properties.basicInfo'), icon: Home },
    { id: 'location', label: t('properties.location') || 'Location', icon: MapPin },
    { id: 'size', label: t('properties.area'), icon: Ruler },
    { id: 'amenities', label: t('properties.amenities'), icon: Building2 },
    { id: 'green', label: t('properties.greenFeatures'), icon: Leaf },
    { id: 'photos', label: t('properties.photos'), icon: Image },
  ];

  if (formData.listingType === 'Rent') {
    sections.splice(5, 0, { id: 'rental', label: t('properties.rentalDetails'), icon: DollarSign });
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error(t('validation.required'));
      setActiveSection('basic');
      return;
    }

    if (!formData.ownerId) {
      toast.error(t('properties.ownerRequired', 'Please select a property owner'));
      setActiveSection('basic');
      return;
    }

    if (!formData.price && formData.listingType === 'Sale') {
      toast.error(t('validation.invalidPrice'));
      setActiveSection('basic');
      return;
    }

    if (!formData.monthlyRent && formData.listingType === 'Rent') {
      toast.error(t('validation.required'));
      setActiveSection('rental');
      return;
    }

    // Check if at least one image is uploaded
    if (images.length === 0) {
      toast.error(t('imageUpload.required', 'At least one image is required'));
      setActiveSection('photos');
      return;
    }

    setProcessing(true);
    try {
      // Map frontend field names to backend DTO field names
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        price: parseFloat(formData.price) || 0.01,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseFloat(formData.area) || 1,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        city: formData.city,
        neighborhood: formData.neighborhood,
        zipCode: formData.zipCode,
        lotSize: parseFloat(formData.lotSize) || null,
        parkingSpaces: parseInt(formData.parkingSpaces) || 0,
        yearBuilt: parseInt(formData.yearBuilt) || null,
        // Amenities - map to backend field names
        hasGarage: formData.hasGarage,
        isPetFriendly: formData.petFriendly,
        hasInUnitLaundry: formData.hasLaundry,
        hasPool: formData.hasPool,
        hasGym: formData.hasGym,
        hasAirConditioning: formData.hasAC,
        // Green features - map to backend field names
        hasSolarPanels: formData.hasSolarPanels,
        hasEnergyEfficientAppliances: formData.energyEfficient,
        hasLEDLighting: formData.hasLED,
        hasSmartThermostats: formData.smartThermostat,
        hasDoubleGlazedWindows: formData.doubleGlazed,
        hasRainwaterHarvesting: formData.rainwaterHarvesting,
        hasGreenRoof: formData.greenRoof,
        hasEnergyStarCertification: formData.energyStar,
        hasLEEDCertification: formData.leedCertified,
        leedLevel: formData.leedLevel || null,
        // Rental details
        monthlyRent: parseFloat(formData.monthlyRent) || null,
        leaseTermMonths: parseInt(formData.leaseTerm) || null,
        securityDeposit: parseFloat(formData.securityDeposit) || null,
        utilitiesIncluded: formData.utilitiesIncluded,
        furnishedStatus: formData.furnished,
        // Owner
        userId: formData.ownerId,
        // Images
        images: images
      };

      await api.createProperty(token, propertyData);
      toast.success(t('properties.propertyCreated'));
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error(t('properties.createError', 'Failed to create property. Please try again.'));
    } finally {
      setProcessing(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('properties.propertyTitle')} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Luxury 3-Bedroom Apartment in Downtown"
                className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('properties.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your property in detail..."
                className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.propertyType')}
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                >
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{t(`properties.types.${type.toLowerCase()}`) || type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.listingType')}
                </label>
                <select
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                >
                  <option value="Sale">{t('properties.forSale')}</option>
                  <option value="Rent">{t('properties.forRent')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {formData.listingType === 'Rent' ? t('properties.monthlyRent') : t('properties.price')} *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    name={formData.listingType === 'Rent' ? 'monthlyRent' : 'price'}
                    value={formData.listingType === 'Rent' ? formData.monthlyRent : formData.price}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.status')}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                >
                  <option value="Available">{t('properties.available')}</option>
                  <option value="Sold">{t('properties.sold')}</option>
                  <option value="Pending">{t('common.pending')}</option>
                </select>
              </div>
            </div>

            {/* Property Owner Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('properties.propertyOwner', 'Property Owner')} *
                </div>
              </label>
              <select
                name="ownerId"
                value={formData.ownerId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                required
              >
                <option value="">{loadingUsers ? t('common.loading', 'Loading...') : t('properties.selectOwner', 'Select property owner')}</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.email} {user.role ? `(${user.role})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {t('properties.ownerHint', 'Select which user this property belongs to')}
              </p>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('properties.address')}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, Floor 5, Apt 502"
                className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.city')}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Tirana"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.neighborhood')}
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Blloku"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('properties.zipCode')}
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="1001"
                className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        );

      case 'size':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  <Bed className="inline w-4 h-4 mr-1" />
                  {t('properties.bedrooms')}
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  <Bath className="inline w-4 h-4 mr-1" />
                  {t('properties.bathrooms')}
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.area')}
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.lotSize')}
                </label>
                <input
                  type="number"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  {t('properties.yearBuilt')}
                </label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  <Car className="inline w-4 h-4 mr-1" />
                  {t('properties.parkingSpaces')}
                </label>
                <input
                  type="number"
                  name="parkingSpaces"
                  value={formData.parkingSpaces}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>
        );

      case 'amenities':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'hasGarage', label: t('properties.hasGarage') },
              { name: 'petFriendly', label: t('properties.petFriendly') },
              { name: 'hasPool', label: t('properties.hasPool') },
              { name: 'hasGym', label: t('properties.hasGym') },
              { name: 'hasAC', label: t('properties.hasAC') },
              { name: 'hasLaundry', label: t('properties.hasLaundry') },
            ].map(amenity => (
              <label
                key={amenity.name}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                  formData[amenity.name]
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-[var(--border-primary)] hover:border-[var(--border-primary)]'
                }`}
              >
                <input
                  type="checkbox"
                  name={amenity.name}
                  checked={formData[amenity.name]}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="font-medium text-[var(--text-primary)]">{amenity.label}</span>
              </label>
            ))}
          </div>
        );

      case 'green':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'hasSolarPanels', label: t('properties.hasSolarPanels') },
                { name: 'energyEfficient', label: t('properties.energyEfficient') },
                { name: 'hasLED', label: t('properties.hasLED') },
                { name: 'smartThermostat', label: t('properties.smartThermostat') },
                { name: 'doubleGlazed', label: t('properties.doubleGlazed') },
                { name: 'rainwaterHarvesting', label: t('properties.rainwaterHarvesting') },
                { name: 'greenRoof', label: t('properties.greenRoof') },
                { name: 'energyStar', label: t('properties.energyStar') },
                { name: 'leedCertified', label: t('properties.leedCertified') },
              ].map(feature => (
                <label
                  key={feature.name}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    formData[feature.name]
                      ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                      : 'border-[var(--border-primary)] hover:border-[var(--border-primary)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    name={feature.name}
                    checked={formData[feature.name]}
                    onChange={handleChange}
                    className="w-5 h-5 text-success-600 rounded focus:ring-success-500"
                  />
                  <span className="font-medium text-[var(--text-primary)]">{feature.label}</span>
                </label>
              ))}
            </div>

            {formData.leedCertified && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.leedLevel')}
                </label>
                <select
                  name="leedLevel"
                  value={formData.leedLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                >
                  {leedLevels.map(level => (
                    <option key={level} value={level}>{level || 'Select Level'}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('properties.ecoScore')} (0-100)
              </label>
              <input
                type="number"
                name="ecoScore"
                value={formData.ecoScore}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        );

      case 'rental':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.monthlyRent')} *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.securityDeposit')}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.leaseTerm')}
                </label>
                <input
                  type="number"
                  name="leaseTerm"
                  value={formData.leaseTerm}
                  onChange={handleChange}
                  placeholder="12"
                  min="1"
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('properties.furnished')}
                </label>
                <select
                  name="furnished"
                  value={formData.furnished}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[var(--border-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-[var(--text-muted)]"
                >
                  {furnishedOptions.map(option => (
                    <option key={option} value={option}>
                      {t(`properties.${option.toLowerCase().replace('-', '')}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition border-[var(--border-primary)] hover:border-[var(--border-primary)]">
              <input
                type="checkbox"
                name="utilitiesIncluded"
                checked={formData.utilitiesIncluded}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="font-medium text-[var(--text-primary)]">{t('properties.utilitiesIncluded')}</span>
            </label>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              {t('imageUpload.description', 'Upload up to 10 images for your property. The first image will be used as the cover.')}
            </p>
            <ImageUpload
              images={images}
              onChange={handleImagesChange}
              maxImages={10}
              maxSizeInMB={5}
              folder="restate/properties"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-[var(--text-secondary)]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary-600" />
            {t('properties.createProperty')}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-4 sticky top-6">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeSection === section.id
                      ? 'bg-primary-600 text-white'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit}>
            <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
              {renderSection()}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {processing ? t('common.loading') : t('properties.createProperty')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyCreatePage;
