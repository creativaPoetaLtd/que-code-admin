import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { AdminUser, Role } from "@/types/admin.types";
import adminAPI from "@/services/adminService";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: AdminUser | null;
  roles: Role[];
}

export default function UserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  roles,
}: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    password: "",
    roleId: "",
    isVerified: true,
    approvalStatus: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        phone: user.phone || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        password: "",
        roleId: user.userRoles?.[0]?.roleId || "",
        isVerified: user.isVerified ?? true,
        approvalStatus: user.approvalStatus ?? true,
      });
    } else {
      setFormData({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        password: "",
        roleId: "",
        isVerified: true,
        approvalStatus: true,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    // Password is optional - backend will generate one if not provided
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (user) {
        // Update existing user
        await adminAPI.updateUser(user.id, {
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isVerified: formData.isVerified,
          approvalStatus: formData.approvalStatus,
        });

        // Update role if changed
        if (
          formData.roleId &&
          formData.roleId !== user.userRoles?.[0]?.roleId
        ) {
          await adminAPI.assignUserRole(user.id, formData.roleId);
        }
      } else {
        // Create new user - backend will auto-approve and send credentials
        await adminAPI.createUser({
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password || "", // Backend generates if empty
          otp: "", // Not needed for admin creation
          otpExpires: new Date(), // Not needed for admin creation
          roleId: formData.roleId || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({
        submit:
          error.response?.data?.message ||
          "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? "Edit User" : "Create New User"}
      size="lg"
      footer={
        <>
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : user ? "Update User" : "Create User"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errors.submit}
          </div>
        )}

        {!user && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <strong>Admin Note:</strong> Creating a user will automatically
            approve and verify their account. Login credentials will be sent to
            their email address. If no password is provided, one will be
            generated automatically.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.phone ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        {!user && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password (optional - will be auto-generated if empty)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Leave empty to auto-generate"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              If left empty, a secure password will be generated and sent to the
              user's email
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={formData.roleId}
            onChange={(e) =>
              setFormData({ ...formData, roleId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isVerified}
                onChange={(e) =>
                  setFormData({ ...formData, isVerified: e.target.checked })
                }
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Verified</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.approvalStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    approvalStatus: e.target.checked,
                  })
                }
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Approved</span>
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
}
