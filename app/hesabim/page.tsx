import AccountCenter from "./AccountCenter";
import { readHeaderSettings } from "../../lib/header-storage";
import { readManagedPages } from "../../lib/page-storage";

export const metadata = {
  title: "Hesabım | İyilik Adresim",
  description: "İyilik Adresim üyelik bilgilerinizi ve işlemlerinizi yönetin.",
};
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [settings, pages] = await Promise.all([readHeaderSettings(), readManagedPages()]);
  return <AccountCenter settings={settings} pages={pages} />;
}
