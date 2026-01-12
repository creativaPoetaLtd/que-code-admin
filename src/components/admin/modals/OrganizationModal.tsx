import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import organizationAPI from "@/services/organizationService";

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Organization {
  id?: string;
  name?: string;
  email?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  contactPhone?: string;
  tinNumber?: string;
  categoryId?: string;
  categoryName?: string;
  status?: "active" | "inactive" | "suspended" | "pending";
}

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organization?: Organization | null;
  categories: Category[];
}

export default function OrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  organization,
  categories,
}: OrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    contactPhone: "",
    tinNumber: "",
    password: "",
    categoryId: "",
    status: "pending", // Auto-approve admin-created organizations
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        email: organization.email || "",
        ownerName: organization.ownerName || "",
        ownerPhone: organization.ownerPhone || "",
        ownerEmail: organization.ownerEmail || "",
        contactPhone: organization.contactPhone || "",
        tinNumber: organization.tinNumber || "",
        password: "",
        categoryId: organization.categoryId || "",
        status: organization.status || "pending",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        ownerName: "",
        ownerPhone: "",
        ownerEmail: "",
        contactPhone: "",
        tinNumber: "",
        password: "",
        categoryId: "",
        status: "pending",
      });
    }
    setErrors({});
  }, [organization, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Organization name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.ownerName.trim())
      newErrors.ownerName = "Owner name is required";

    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = "Owner phone is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.ownerPhone)) {
      newErrors.ownerPhone = "Invalid phone format";
    }

    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = "Owner email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = "Owner email is invalid";
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = "Invalid phone format";
    }

    if (!formData.tinNumber.trim()) {
      newErrors.tinNumber = "TIN number is required";
    }

    if (!organization && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (organization && organization.id) {
        // Update existing organization
        await organizationAPI.updateOrganization(organization.id, {
          name: formData.name,
          email: formData.email,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          ownerEmail: formData.ownerEmail,
          contactPhone: formData.contactPhone,
          tinNumber: formData.tinNumber,
          categoryId: formData.categoryId,
          status: formData.status,
        });
      } else {
        // Create new organization
        await organizationAPI.createOrganization({
          name: formData.name,
          email: formData.email,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          ownerEmail: formData.ownerEmail,
          contactPhone: formData.contactPhone,
          tinNumber: formData.tinNumber,
          password: formData.password,
          type: formData.categoryId, // Backend expects 'type' field
          categoryId: formData.categoryId,
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

  // Filter active categories
  const activeCategories = categories.filter((cat) => cat.isActive);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={organization ? "Edit Organization" : "Create New Organization"}
      size="lg"
      footer={
        <>
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Saving..."
              : organization
                ? "Update Organization"
                : "Create Organization"}
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

        {!organization && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <strong>Admin Note:</strong> Creating an organization will
            automatically approve it and send a verification email to the owner.
          </div>
        )}

        {/* Organization Details Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
            Organization Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Email *
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
                placeholder="org@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.contactPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+250788000000"
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPhone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TIN Number *
              </label>
              <input
                type="text"
                value={formData.tinNumber}
                onChange={(e) =>
                  setFormData({ ...formData, tinNumber: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.tinNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter TIN number"
              />
              {errors.tinNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.tinNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.categoryId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a category</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Owner Details Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
            Owner Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Full Name *
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.ownerName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter owner full name"
              />
              {errors.ownerName && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Email *
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, ownerEmail: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.ownerEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="owner@example.com"
              />
              {errors.ownerEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Phone *
              </label>
              <input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, ownerPhone: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.ownerPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+250788000000"
              />
              {errors.ownerPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.ownerPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Password Section (only for new organizations) */}
        {!organization && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Login Credentials
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter initial password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This password will be sent to the owner via email
              </p>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
