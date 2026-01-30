import InGameClient from "./InGameClient";
import { cookies } from "next/headers";

interface Props {
  searchParams: Promise<{
    gameId?: string;
  }>;
}

/* =========================================================
   Fetch current user (SERVER, CORRECT + PROD SAFE)
   - DO NOT use headers().get("host")
   - DO NOT use relative /api on server
   - ALWAYS hit backend directly
   - Manually forward cookies
========================================================= */
async function getMe() {
  const cookieStore = await cookies();

  const backendUrl =
    process.env.BACKEND_URL ?? "https://baizhan.renstoolbox.com";

  const res = await fetch(`${backendUrl}/api/auth/me`, {
    cache: "no-store",
    headers: {
      cookie: cookieStore.toString(),
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user as { uid: string; username: string };
}

/* =========================================================
   Page
========================================================= */
export default async function InGamePage({ searchParams }: Props) {
  const { gameId } = await searchParams;

  if (!gameId) {
    return <div>Missing gameId</div>;
  }

  const me = await getMe();
  if (!me) {
    return <div>Not logged in</div>;
  }

  return (
    <InGameClient
      gameId={gameId}
      selfUserId={me.uid}
      selfUsername={me.username}
    />
  );
}
