import Login from "@/components/shop/Login";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  return <Login message={(await searchParams).message || ""} />;
}
