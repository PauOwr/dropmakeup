import { Heading, Text } from "@modules/common/components/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          Solicitud de transferencia del pedido {id}
        </Heading>
        <Text className="text-zinc-600">
          Has recibido una solicitud para transferir tu pedido ({id}) a otra cuenta.
          Si estás de acuerdo, apruébala con el botón de abajo.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          Si la aceptas, la nueva cuenta pasará a gestionar este pedido.
        </Text>
        <Text className="text-zinc-600">
          Si no reconoces esta solicitud o quieres conservar el pedido, no tienes
          que hacer nada.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
