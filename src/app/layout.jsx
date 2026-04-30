import { Toaster } from 'sonner';
import './globals.css';

export const metadata = {
  title: 'SendFlow',
  description: 'Cold email outreach, automated.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
