import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dri8kqa6g';
const CLOUDINARY_UPLOAD_PRESET = 'restate_unsigned'; // You need to create this preset in Cloudinary

export const ImageUpload = ({
  images = [],
  onChange,
  maxImages = 10,
  maxSizeInMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  folder = 'restate/properties',
  className = '',
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  };

  const validateFile = (file) => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return t('imageUpload.invalidFormat', 'Invalid file format. Allowed: JPG, PNG, WebP');
    }

    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeInMB) {
      return t('imageUpload.fileTooLarge', `File size must be less than ${maxSizeInMB}MB`);
    }

    return null;
  };

  const handleFiles = useCallback(async (files) => {
    setError(null);

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(t('imageUpload.maxImagesReached', `Maximum ${maxImages} images allowed`));
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    // Validate all files first
    for (const file of filesToUpload) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploading(true);
    const newImages = [...images];
    const progressMap = {};

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        progressMap[file.name] = 0;
        setUploadProgress({ ...progressMap });

        // Simulate progress (Cloudinary doesn't provide real progress for unsigned uploads)
        const progressInterval = setInterval(() => {
          progressMap[file.name] = Math.min((progressMap[file.name] || 0) + 10, 90);
          setUploadProgress({ ...progressMap });
        }, 200);

        try {
          const url = await uploadToCloudinary(file);
          newImages.push(url);
          progressMap[file.name] = 100;
          setUploadProgress({ ...progressMap });
        } catch (err) {
          setError(t('imageUpload.uploadFailed', `Failed to upload ${file.name}`));
        } finally {
          clearInterval(progressInterval);
        }
      }

      onChange(newImages);
    } catch (err) {
      console.error('Upload error:', err);
      setError(t('imageUpload.uploadError', 'Error uploading images'));
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [images, maxImages, onChange, t, folder]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          flex flex-col items-center justify-center gap-3
          cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-[var(--border-primary)] hover:border-primary-400 hover:bg-[var(--bg-hover)]'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">
              {t('imageUpload.uploading', 'Uploading images...')}
            </p>
          </>
        ) : (
          <>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t('imageUpload.dragDrop', 'Drag and drop images here')}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t('imageUpload.or', 'or')} <span className="text-primary-600 dark:text-primary-400">{t('imageUpload.browse', 'browse')}</span> {t('imageUpload.toUpload', 'to upload')}
              </p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {t('imageUpload.formats', 'JPG, PNG, WebP')} - {t('imageUpload.maxSize', `Max ${maxSizeInMB}MB`)} - {t('imageUpload.remaining', `${maxImages - images.length} remaining`)}
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-error-500" />
          <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-[var(--text-muted)]" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)] truncate max-w-[200px]">{filename}</span>
                  <span className="text-[var(--text-muted)]">{progress}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-tertiary)]"
            >
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text fill="%239ca3af" font-size="12" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Error</text></svg>';
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="
                  absolute top-2 right-2 p-1.5
                  bg-black/60 hover:bg-black/80
                  text-white rounded-full
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                "
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                  {t('imageUpload.cover', 'Cover')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      {images.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {t('imageUpload.coverHint', 'First image will be used as the cover photo')}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
