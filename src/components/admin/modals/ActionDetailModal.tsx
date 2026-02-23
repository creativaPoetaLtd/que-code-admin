import React from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { X, Building } from "lucide-react";
import { AdminAction, ActionType } from "@/types/admin.types";

interface ActionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: AdminAction | null;
}

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  ticket: "Ticket",
  transport: "Transport",
  service: "Service",
  subscription: "Subscription",
  payment: "Payment",
  donation: "Donation",
  vote: "Vote",
  booking: "Booking",
  license: "License",
  membership: "Membership",
  rental: "Rental",
  group: "Group",
};

const getStatusBadgeVariant = (
  status: string,
): "success" | "warning" | "danger" | "default" => {
  switch (status.toLowerCase()) {
    case "published":
      return "success";
    case "draft":
      return "warning";
    case "archived":
      return "default";
    default:
      return "default";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number, currency: string = "RWF") => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ActionDetailModal({
  isOpen,
  onClose,
  action,
}: ActionDetailModalProps) {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-[100] w-full max-w-3xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {action.name}
              </h2>
              <p className="text-gray-600 mt-1">/{action.slug}</p>
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
          {action.coverImage && (
            <img
              src={action.coverImage}
              alt={action.name}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Type</span>
                  <p className="font-medium">
                    {ACTION_TYPE_LABELS[action.type]}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(action.status)}>
                      {action.status.charAt(0).toUpperCase() +
                        action.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Display Layout</span>
                  <p className="font-medium capitalize">
                    {action.displayLayout}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Currency</span>
                  <p className="font-medium">{action.currency}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {action.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {action.description}
                </p>
              </div>
            )}

            {/* Short Description */}
            {action.shortDescription && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Short Description
                </h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {action.shortDescription}
                </p>
              </div>
            )}

            {/* Organization */}
            {action.organization && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Organization
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{action.organization.name}</p>
                  <p className="text-sm text-gray-600">
                    {action.organization.email}
                  </p>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pricing
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Mode:
                    </span>
                    <Badge variant="default" size="sm">
                      {action.pricing.mode}
                    </Badge>
                  </div>
                  {action.pricing.mode === "free" && (
                    <p className="text-sm text-gray-700">Free of charge</p>
                  )}
                  {action.pricing.mode === "fixed" && (
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(action.pricing.amount || 0)}{" "}
                      {action.currency}
                    </p>
                  )}
                  {action.pricing.mode === "range" && (
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(action.pricing.min || 0)} -{" "}
                      {formatCurrency(action.pricing.max || 0)}{" "}
                      {action.currency}
                    </p>
                  )}
                  {action.pricing.mode === "tiered" && (
                    <p className="text-sm text-gray-700">
                      Multiple price tiers available (see sub-actions)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility & Availability */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Visibility & Availability
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Visibility</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        action.visibility?.mode === "public"
                          ? "success"
                          : "warning"
                      }
                      size="sm"
                    >
                      {action.visibility?.mode || "N/A"}
                    </Badge>
                  </div>
                </div>
                {action.availability?.timezone && (
                  <div>
                    <span className="text-sm text-gray-600">Timezone</span>
                    <p className="font-medium text-sm">
                      {action.availability.timezone}
                    </p>
                  </div>
                )}
                {action.availability?.startsAt && (
                  <div>
                    <span className="text-sm text-gray-600">Starts At</span>
                    <p className="font-medium text-sm">
                      {formatDate(action.availability.startsAt)}
                    </p>
                  </div>
                )}
                {action.availability?.endsAt && (
                  <div>
                    <span className="text-sm text-gray-600">Ends At</span>
                    <p className="font-medium text-sm">
                      {formatDate(action.availability.endsAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Fields */}
            {action.buyerFields && action.buyerFields.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Buyer Fields Required
                </h3>
                <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg">
                  {action.buyerFields.map((field: string) => (
                    <Badge key={field} variant="default" size="sm">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fulfillment */}
            {action.fulfillment && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Fulfillment
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  {action.fulfillment.objectType && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Type:</span>
                      <Badge variant="default" size="sm">
                        {action.fulfillment.objectType}
                      </Badge>
                    </div>
                  )}
                  {action.fulfillment.storeOnBuyerQR !== undefined && (
                    <div className="text-xs text-gray-700">
                      Store on QR:{" "}
                      {action.fulfillment.storeOnBuyerQR ? "Yes" : "No"}
                    </div>
                  )}
                  {action.fulfillment.postPurchaseMessage && (
                    <div>
                      <span className="text-xs text-gray-600">
                        Post-purchase message:
                      </span>
                      <p className="text-sm text-gray-800 mt-1">
                        {action.fulfillment.postPurchaseMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Timestamps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <p className="font-medium">{formatDate(action.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <p className="font-medium">{formatDate(action.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
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
