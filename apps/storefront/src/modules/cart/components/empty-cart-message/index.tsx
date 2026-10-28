import { Heading, Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Heading
        level="h1"
        className="text-display flex flex-row gap-x-2 items-baseline text-3xl"
      >
        Tu cesta está vacía
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-lg">
        Todavía no has añadido ningún producto. Descubre nuestros labiales,
        bases e iluminadores.
      </Text>
      <div>
        <InteractiveLink href="/store">Ver productos</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
