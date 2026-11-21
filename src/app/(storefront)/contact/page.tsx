import Contact from "@/components/shop/Contact";
export default function Page() {
  return <Contact email={process.env.BUSINESS_EMAIL} />;
}
