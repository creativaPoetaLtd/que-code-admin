import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import adminAPI from "@/services/adminService";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Wallet {
  id: string;
  ownerName: string;
  ownerType: "user" | "organization" | "action";
  balance: number;
}

interface Restriction {
  id?: string;
  walletId?: string;
  walletOwner?: string;
  walletOwnerType?: "user" | "organization" | "action";
  categoryId?: string;
  categoryName?: string;
  amount?: number;
}

interface RestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restriction?: Restriction | null;
  wallets: Wallet[];
  categories: Category[];
}

export default function RestrictionModal({
  isOpen,
  onClose,
  onSuccess,
  restriction,
  wallets,
  categories,
}: RestrictionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    walletId: "",
    categoryId: "",
    amount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (restriction) {
      setFormData({
        walletId: restriction.walletId || "",
        categoryId: restriction.categoryId || "",
        amount: restriction.amount?.toString() || "",
      });
    } else {
      setFormData({
        walletId: "",
        categoryId: "",
        amount: "",
      });
    }
    setErrors({});
  }, [restriction, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.walletId.trim()) {
      newErrors.walletId = "Wallet is required";
    }

    if (!formData.categoryId.trim()) {
      newErrors.categoryId = "Category is required";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const amountNum = parseFloat(formData.amount);

      if (restriction && restriction.id) {
        // Update existing restriction (only amount can be changed)
        await adminAPI.updateRestriction(restriction.id, {
          amount: amountNum,
        });
      } else {
        // Create new restriction
        await adminAPI.createRestriction({
          walletId: formData.walletId,
          categoryId: formData.categoryId,
          amount: amountNum,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "An error occurred. Please try again.";
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedWallet = wallets.find((w) => w.id === formData.walletId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={restriction ? "Edit Restriction" : "Create New Restriction"}
      size="md"
      footer={
        <>
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Saving..."
              : restriction
                ? "Update Restriction"
                : "Create Restriction"}
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

        {!restriction && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <strong>Info:</strong> Restrictions limit how much a wallet can
            spend in a specific category.
          </div>
        )}

        <div className="space-y-4">
          {/* Wallet Selection - disabled when editing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet *
            </label>
            <select
              value={formData.walletId}
              onChange={(e) =>
                setFormData({ ...formData, walletId: e.target.value })
              }
              disabled={!!restriction}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.walletId ? "border-red-500" : "border-gray-300"
              } ${restriction ? "bg-gray-100 cursor-not-allowed" : ""}`}
            >
              <option value="">Select a wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.ownerName} ({wallet.ownerType}) - Balance:{" "}
                  {wallet.balance.toLocaleString()} RWF
                </option>
              ))}
            </select>
            {errors.walletId && (
              <p className="text-red-500 text-xs mt-1">{errors.walletId}</p>
            )}
            {restriction && (
              <p className="text-gray-500 text-xs mt-1">
                Wallet cannot be changed when editing
              </p>
            )}
          </div>

          {/* Category Selection - disabled when editing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              disabled={!!restriction}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.categoryId ? "border-red-500" : "border-gray-300"
              } ${restriction ? "bg-gray-100 cursor-not-allowed" : ""}`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.description && ` - ${category.description}`}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
            )}
            {restriction && (
              <p className="text-gray-500 text-xs mt-1">
                Category cannot be changed when editing
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Limit (RWF) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.amount ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter amount limit"
            />
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
            {selectedWallet && (
              <p className="text-gray-500 text-xs mt-1">
                Wallet balance: {selectedWallet.balance.toLocaleString()} RWF
              </p>
            )}
          </div>
        </div>

        {restriction && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <strong>Note:</strong> You can only modify the amount limit. To
            change the wallet or category, delete this restriction and create a
            new one.
          </div>
        )}
      </form>
    </Modal>
  );
}
