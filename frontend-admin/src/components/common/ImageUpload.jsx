import React, { useState, useRef } from 'react';
import { storage } from '../../firebase/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Plus,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export const ImageUpload = ({
  value = [],
  onChange,
  folder = 'catalog',
  maxFiles = 8,
  maxSizeMB = 5,
  label = 'Photos & Images',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef(null);

  // Parse value into a clean array of URLs
  const urlList = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string'
    ? value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const updateUrls = (newList) => {
    if (onChange) {
      onChange(newList);
    }
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setErrorMessage('');

    const filesToUpload = Array.from(files);

    if (urlList.length + filesToUpload.length > maxFiles) {
      setErrorMessage(`Maximum of ${maxFiles} images allowed. Please select fewer files.`);
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(`"${file.name}" is not an image. Only PNG, JPEG, and WebP files are allowed.`);
        return;
      }
      if (file.size > maxBytes) {
        setErrorMessage(`"${file.name}" exceeds the ${maxSizeMB}MB file size limit.`);
        return;
      }
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const uploadedUrls = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${folder}/${Date.now()}_${cleanName}`;
        const fileRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(fileRef, file, {
          contentType: file.type,
        });

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const filePct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              const overallPct = Math.round(((i + filePct / 100) / filesToUpload.length) * 100);
              setUploadProgress(overallPct);
            },
            (error) => {
              console.error('Firebase Storage upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                uploadedUrls.push(downloadUrl);
                resolve();
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        });
      }

      updateUrls([...urlList, ...uploadedUrls]);
    } catch (err) {
      console.error('Upload processing error:', err);
      setErrorMessage(
        err.message || 'Failed to upload image to storage. You may also paste an image URL directly.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = urlList.filter((_, idx) => idx !== indexToRemove);
    updateUrls(updated);
  };

  const handleAddManualUrl = (e) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    if (urlList.length >= maxFiles) {
      setErrorMessage(`Maximum of ${maxFiles} images allowed.`);
      return;
    }

    const clean = manualUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setErrorMessage('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }

    updateUrls([...urlList, clean]);
    setManualUrl('');
    setShowUrlInput(false);
    setErrorMessage('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <ImageIcon className="h-4 w-4 text-slate-400" />
          <span>{label}</span>
          <span className="text-xs font-normal tabular-nums text-muted-foreground">
            ({urlList.length}/{maxFiles})
          </span>
        </label>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          {showUrlInput ? 'Hide URL input' : 'Paste Image URL'}
        </button>
      </div>

      {/* Manual URL Input Bar */}
      {showUrlInput && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-slate-50 p-2 sm:flex-row sm:items-center">
          <Input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="h-9"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddManualUrl}
            className="w-full shrink-0 sm:w-auto"
          >
            Add URL
          </Button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {urlList.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
            isDragging
              ? 'cursor-pointer border-primary bg-primary/5'
              : uploading
              ? 'cursor-not-allowed border-border bg-slate-50'
              : 'cursor-pointer border-slate-300 bg-card hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
              <div className="text-sm font-medium text-slate-700">
                Uploading to Firebase Storage ({uploadProgress}%)...
              </div>
              <div className="mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card">
                <UploadCloud className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-medium text-primary hover:underline">Click to browse</span> or drag and drop photos here
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPEG, WebP up to {maxSizeMB}MB each. Uploads directly to Firebase Storage.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Thumbnails Preview Grid */}
      {urlList.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urlList.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-video overflow-hidden rounded-md border border-border bg-slate-100"
            >
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=80';
                }}
              />

              {/* Cover Photo Badge on first item */}
              {idx === 0 && (
                <div className="absolute left-1.5 top-1.5">
                  <Badge className="bg-slate-900/80 text-[10px] text-white ring-0">
                    Cover Photo
                  </Badge>
                </div>
              )}

              {/* Remove Button Overlay */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 ring-1 ring-slate-900/10 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                title="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* External preview link */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 ring-1 ring-slate-900/10 transition-opacity hover:text-foreground focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Open full image"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
