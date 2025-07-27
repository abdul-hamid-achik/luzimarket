interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}