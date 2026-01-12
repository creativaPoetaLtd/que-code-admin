import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Role, Permission } from '@/types/admin.types';
import adminAPI from '@/services/adminService';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: Role | null;
  permissions: Permission[];
}

export default function RoleModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  permissions,
}: RoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) {
      loadRoleWithPermissions();
    } else {
      setFormData({
        name: '',
        description: '',
        permissionIds: [],
      });
    }
    setErrors({});
  }, [role, isOpen]);

  const loadRoleWithPermissions = async () => {
    if (!role) return;

    try {
      const response = await adminAPI.getRoleWithPermissions(role.id);
      const roleData = response.data;

      setFormData({
        name: roleData.name || '',
        description: roleData.description || '',
        permissionIds:
          roleData.rolePermissions?.map((rp: any) => rp.permissionId) || [],
      });
    } catch (error) {
      console.error('Error loading role permissions:', error);
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissionIds: [],
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Role name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (role) {
        await adminAPI.updateRole(role.id, formData);
      } else {
        await adminAPI.createRole(formData);
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

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? 'Edit Role' : 'Create New Role'}
      size='xl'
      footer={
        <>
          <Button variant='default' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-6'>
        {errors.submit && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
            {errors.submit}
          </div>
        )}

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Role Name *
          </label>
          <input
            type='text'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            disabled={
              role
                ? ['super_admin', 'admin', 'user'].includes(role.name)
                : false
            }
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
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            Permissions
          </label>
          <div className='border border-gray-200 rounded-lg max-h-96 overflow-y-auto p-4 space-y-2'>
            {permissions.map(permission => (
              <label
                key={permission.id}
                className='flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded'
              >
                <input
                  type='checkbox'
                  checked={formData.permissionIds.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                  className='mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                />
                <div className='flex-1'>
                  <div className='text-sm font-medium text-gray-900'>
                    {permission.name}
                  </div>
                  {permission.description && (
                    <div className='text-xs text-gray-500'>
                      {permission.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <p className='text-sm text-gray-500 mt-2'>
            {formData.permissionIds.length} permission(s) selected
          </p>
        </div>
      </form>
    </Modal>
  );
}
