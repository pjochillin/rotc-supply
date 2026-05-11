import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserOcie } from "@/app/actions";
import { UserOcieClientPage } from './UserOcieClientPage';

export default async function MyOciePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <p>You must be logged in to view this page.</p>;
  }

  const ocieItems = await getUserOcie(session.user.id);

  return <UserOcieClientPage ocieItems={ocieItems} userName={session.user.name || ''} />;
}
