import { Suspense } from "react";
import { redirect } from "next/navigation";

export default function EditStudioAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Suspense fallback={null}><EditStudioRedirect params={params} /></Suspense>;
}

async function EditStudioRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/my-studios/${encodeURIComponent(id)}/edit`);
  return null;
}
