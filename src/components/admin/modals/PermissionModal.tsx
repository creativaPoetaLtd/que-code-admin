import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Permission } from '@/types/admin.types';
import adminAPI from '@/services/adminService';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  permission?: Permission | null;
}

export default function PermissionModal({
  isOpen,
  onClose,
  onSuccess,
  permission,
}: PermissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name || '',
        description: permission.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
    setErrors({});
  }, [permission, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Permission name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (permission) {
        await adminAPI.updatePermission(permission.id, formData);
      } else {
        await adminAPI.createPermission(formData);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({
        submit:
          error.response?.data?.message ||
          'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={permission ? 'Edit Permission' : 'Create New Permission'}
      size='md'
      footer={
        <>
          <Button variant='default' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSubmit} disabled={loading}>
            {loading
              ? 'Saving...'
              : permission
                ? 'Update Permission'
                : 'Create Permission'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        {errors.submit && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
            {errors.submit}
          </div>
        )}

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Permission Name *
          </label>
          <input
            type='text'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder='e.g., view_users, edit_roles'
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className='text-red-500 text-xs mt-1'>{errors.name}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder='Describe what this permission allows'
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
          />
        </div>
      </form>
    </Modal>
  );
}
