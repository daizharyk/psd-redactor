import { RadioProvider } from "@/context/RadioProvider";
import "./globals.css";
import RadioList from "@/components/RadioList";

export const metadata = {
  title: "CMG Laboratory",
  description: "Document processing app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RadioProvider>
          <RadioList className={"radio"} />
          {children}
        </RadioProvider>
      </body>
    </html>
  );
}
