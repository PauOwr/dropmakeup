import BrandVisual from "@/components/brand-visual"
import { HOME } from "@/lib/brand"
import SectionHeading from "../section-heading"

export default function Community() {
  const { eyebrow, title, text, looks } = HOME.community

  return (
    <section className="content-container py-20 small:py-28">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <p className="-mt-2 mb-10 max-w-md text-muted-foreground small:-mt-6">
        {text}
      </p>
      <ul className="grid grid-cols-2 gap-3 small:grid-cols-4">
        {looks.map((look) => (
          <li
            key={look.caption}
            className="group relative aspect-square overflow-hidden"
          >
            <BrandVisual
              media={look.media}
              tone={look.tone}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            {/* En móvil el pie se ve siempre; en escritorio aparece al pasar el ratón */}
            <div className="absolute inset-0 flex items-end bg-linear-to-t from-ink/60 via-transparent to-transparent p-4 transition-opacity duration-300 small:opacity-0 small:group-hover:opacity-100">
              <span className="text-eyebrow text-white">{look.caption}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
