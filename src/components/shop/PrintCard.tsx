import Link from "next/link";
import Image from "./ProductImage";
import { dimensions, money, type Print } from "@/lib/shop/catalog";
export default function PrintCard({ item }: { item: Print }) {
  return (
    <article className="print-card">
      <Link href={"/products/" + item.slug}>
        <Image
          width={520}
          height={520}
          sizes="(max-width: 479px) 92vw, (max-width: 800px) 45vw, 400px"
          loading="lazy"
          src={item.photos[0].url}
          alt={item.photos[0].alt}
        />
        <div>
          <h2>{item.name}</h2>
          <strong>{money(item.pricePaise)}</strong>
        </div>
      </Link>
      <p>
        {item.material} · {dimensions(item)}
      </p>
    </article>
  );
}
