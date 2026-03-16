export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {children}
    </div>
  );
}
