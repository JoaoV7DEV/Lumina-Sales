import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumina Sales | Sistema Privado de CRM & Prospecção',
  description: 'Sistema privado de prospecção, CRM, experimentação comercial e gestão financeira para a Lumina Studio.',
  openGraph: {
    title: 'Lumina Sales | Sistema Privado de CRM & Prospecção',
    description: 'Sistema privado de prospecção, CRM, experimentação comercial e gestão financeira para a Lumina Studio.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumina Sales | Sistema Privado de CRM & Prospecção',
    description: 'Sistema privado de prospecção, CRM, experimentação comercial e gestão financeira para a Lumina Studio.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#111827] text-slate-100 antialiased font-sans selection:bg-[#C9A46B]/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
