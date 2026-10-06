import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
export const metadata: Metadata = {
  title: { default: "EloFit", template: "%s · EloFit" },
  description: "Treino, acompanhamento e gestão em um só lugar.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
