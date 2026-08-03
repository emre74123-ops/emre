import AccountCenter from "./AccountCenter";
import { readHeaderSettings } from "../../lib/header-storage";

export const metadata = {
  title: "Hesabım | İyilik Adresim",
  description: "İyilik Adresim üyelik bilgilerinizi ve işlemlerinizi yönetin.",
};
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  return <AccountCenter settings={await readHeaderSettings()} />;
}
