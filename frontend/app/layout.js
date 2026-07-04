import './globals.css';

export const metadata = {
  title: 'HRMS — Human Resource Management System',
  description: 'Every workday, perfectly aligned.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
