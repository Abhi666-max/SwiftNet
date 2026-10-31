import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SwiftNet — Advanced Network Diagnostics Suite',
  description:
    'Network diagnostics platform. Measure bandwidth, analyze DNS, calculate subnets, visualize OSI layers, simulate protocols and firewall rules.',
  keywords: [
    'network diagnostics', 'speed test', 'DNS inspector', 'subnet calculator',
    'OSI layers', 'packet journey', 'TCP handshake', 'firewall simulator',
    'CIDR calculator',
  ],
  authors: [{ name: 'SwiftNet Engineering' }],
};

export const viewport: Viewport = {
  themeColor: '#FAFAF7',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-cream-100 text-ink-400 antialiased">
        {children}
      </body>
    </html>
  );
}
