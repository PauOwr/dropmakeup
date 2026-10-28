"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import { DELIVERY_TIMES } from "@/lib/brand"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Información del producto",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Envíos y devoluciones",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Material</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">País de origen</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Tipo</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Peso</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Dimensiones</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length} × ${product.width} × ${product.height}`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Envío</span>
            <p className="max-w-sm">
              Envío estándar en {DELIVERY_TIMES.standard} y exprés en{" "}
              {DELIVERY_TIMES.express}, con seguimiento. Tienes todos los
              detalles en nuestra{" "}
              <LocalizedClientLink href="/shipping" className="underline">
                página de envíos
              </LocalizedClientLink>
              .
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Devoluciones</span>
            <p className="max-w-sm">
              Tienes {DELIVERY_TIMES.returnDays} días naturales desde la entrega
              para devolver tu pedido (los cosméticos, solo si siguen
              precintados).
              Consulta cómo hacerlo en la{" "}
              <LocalizedClientLink href="/returns" className="underline">
                política de devoluciones
              </LocalizedClientLink>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
