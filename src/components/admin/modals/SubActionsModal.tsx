import React from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { X, List } from "lucide-react";
import { AdminAction } from "@/types/admin.types";

interface SubAction {
  id: string;
  actionId: string;
  name: string;
  description?: string;
  price: string;
  stock: number | null;
  stockReserved: number;
  variants?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  coverImage?: string;
  dedicatedQrCodeData?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: AdminAction | null;
  subActions: SubAction[];
  subActionsStats: {
    total: number;
    active: number;
    inactive: number;
    withStock: number;
    unlimited: number;
    soldOut: number;
  } | null;
  loading: boolean;
}

const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

export default function SubActionsModal({
  isOpen,
  onClose,
  action,
  subActions,
  subActionsStats,
  loading,
}: SubActionsModalProps) {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-[100] w-full max-w-4xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Sub-Actions for {action.name}
              </h2>
              <p className="text-gray-600 mt-1">
                Ticket tiers, variants, and options
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Statistics */}
              {subActionsStats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">
                      Total
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {subActionsStats.total}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-600 font-medium">
                      Active
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {subActionsStats.active}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 font-medium">
                      Inactive
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {subActionsStats.inactive}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-purple-600 font-medium">
                      With Stock
                    </div>
                    <div className="text-xl font-bold text-purple-900">
                      {subActionsStats.withStock}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-xs text-yellow-600 font-medium">
                      Unlimited
                    </div>
                    <div className="text-xl font-bold text-yellow-900">
                      {subActionsStats.unlimited}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-red-600 font-medium">
                      Sold Out
                    </div>
                    <div className="text-xl font-bold text-red-900">
                      {subActionsStats.soldOut}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Actions List */}
              {subActions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <List className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-1">
                    No sub-actions found
                  </p>
                  <p className="text-sm">
                    This action doesn't have any ticket tiers or variants
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subActions.map((subAction: SubAction, index: number) => (
                    <div
                      key={subAction.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-gray-500">
                              #{index + 1}
                            </span>
                            <h3 className="font-semibold text-gray-900">
                              {subAction.name}
                            </h3>
                            <Badge
                              variant={
                                subAction.isActive ? "success" : "default"
                              }
                            >
                              {subAction.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {subAction.stock !== null &&
                              subAction.stock <= subAction.stockReserved && (
                                <Badge variant="danger">Sold Out</Badge>
                              )}
                          </div>
                          {subAction.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {subAction.description}
                            </p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Price</span>
                              <p className="font-medium">
                                {formatCurrency(subAction.price)} RWF
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Stock</span>
                              <p className="font-medium">
                                {subAction.stock === null
                                  ? "Unlimited"
                                  : `${subAction.stock - subAction.stockReserved} / ${subAction.stock}`}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Reserved</span>
                              <p className="font-medium">
                                {subAction.stockReserved}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Sort Order</span>
                              <p className="font-medium">
                                {subAction.sortOrder}
                              </p>
                            </div>
                          </div>
                          {subAction.metadata &&
                            Object.keys(subAction.metadata).length > 0 && (
                              <div className="mt-3">
                                <span className="text-xs text-gray-500">
                                  Metadata:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {Object.entries(subAction.metadata).map(
                                    ([key, value]) => (
                                      <Badge
                                        key={key}
                                        variant="default"
                                        size="sm"
                                      >
                                        {key}: {String(value)}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          {subAction.variants &&
                            Object.keys(subAction.variants).length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">
                                  Variants:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {Object.entries(subAction.variants).map(
                                    ([key, value]) => (
                                      <Badge
                                        key={key}
                                        variant="warning"
                                        size="sm"
                                      >
                                        {key}: {String(value)}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                        {subAction.coverImage && (
                          <img
                            src={subAction.coverImage}
                            alt={subAction.name}
                            className="w-20 h-20 rounded object-cover"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
