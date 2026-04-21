'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../../lib/auth-context';
import { AppApiError, sellerApi } from '../../../lib/api';
import { ArrowLeft, Upload, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const foundProduct: any = await sellerApi.getProduct(params.id as string);
        setProduct(foundProduct as Product);
        setFormData({
          name: foundProduct.name,
          description: foundProduct.description,
          price: foundProduct.price.toString(),
          category: foundProduct.category,
          stock: foundProduct.stock.toString(),
        });
        setExistingImages(foundProduct?.images || []);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        router.push('/seller/products');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'seller' && params.id) {
      fetchProduct();
    }
  }, [user, params.id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.stock) {
      alert('Please fill in all required fields');
      return;
    }

    setUpdating(true);

    try {
      let uploadedUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const fd = new FormData();
        newImageFiles.forEach((img) => fd.append('images', img));
        const res = await sellerApi.uploadImages(fd);
        uploadedUrls = res.images || [];
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
        images: [...existingImages, ...uploadedUrls],
      };

      await sellerApi.updateProduct(params.id as string, productData);
      router.push('/seller/products');
    } catch (error) {
      console.error('Failed to update product:', error);
      const message = error instanceof AppApiError
        ? `${error.message}${error.status ? ` (status ${error.status})` : ''}`
        : error instanceof Error ? error.message : 'Failed to update product.';
      alert(message);
    } finally {
      setUpdating(false);
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#64748b]">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-[#64748b]">The product you&apos;re trying to edit doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Automotive', 'Toys', 'Health', 'Other'];

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Link href="/seller/products" className="text-[#94a3b8] hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Product</h1>
            <p className="text-sm text-[#64748b] mt-1">Update your product information</p>
          </div>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} className="glass-card p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-dark"
                  placeholder="Enter product name"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="input-dark appearance-none cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="input-dark"
                  placeholder="0.00"
                />
              </div>

              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="input-dark"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="input-dark resize-none"
                  placeholder="Describe your product in detail..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center hover:border-[#7c3aed]/30 transition-colors">
                  <Upload className="mx-auto text-[#64748b] mb-2" size={36} />
                  <p className="text-[#64748b] text-sm mb-3">
                    Drop images or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="btn-gradient text-xs py-2 px-4 cursor-pointer"
                  >
                    Choose Images
                  </label>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-2">Current Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {existingImages.map((image, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-white/[0.06]"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-1.5 -right-1.5 bg-[#f43f5e] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Preview */}
                {newImageFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-2">New Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {newImageFiles.map((img, i) => (
                        <div key={`new-${i}`} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`New ${i + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-[#7c3aed]/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(i)}
                            className="absolute -top-1.5 -right-1.5 bg-[#f43f5e] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={updating}
              className="btn-gradient py-3 px-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} /> {updating ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <Link href="/seller/products" className="btn-outline-glass py-3 px-8 text-sm text-center">
              Cancel
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
