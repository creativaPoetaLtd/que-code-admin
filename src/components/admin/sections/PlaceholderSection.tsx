interface PlaceholderSectionProps {
  title: string;
}

export default function PlaceholderSection({ title }: PlaceholderSectionProps) {
  return (
    <div className="flex items-center justify-center min-h-96 bg-white/50 rounded-2xl border border-gray-200">
      <div className="text-center text-gray-600">
        <div className="text-xl font-semibold mb-2 text-gray-900">{title}</div>
        <div className="text-sm">This section will be implemented soon.</div>
      </div>
    </div>
  );
}
