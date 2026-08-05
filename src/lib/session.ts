import { auth } from "../auth";

/**
 * 현재 로그인된 사용자의 ID를 반환 (User.id 기준)
 * 로그인 안 됐거나 유효하지 않으면 null
 */
export async function getCurrentUserId(): Promise<number | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}