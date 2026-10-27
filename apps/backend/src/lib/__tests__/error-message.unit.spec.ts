import { errorMessage } from "../error-message"

describe("errorMessage", () => {
  it("lee el mensaje de una instancia de Error", () => {
    expect(errorMessage(new Error("fallo"))).toBe("fallo")
  })

  it("lee el mensaje de un error serializado por un workflow", () => {
    expect(errorMessage({ message: "Saldo insuficiente", name: "MedusaError", type: "not_allowed" })).toBe(
      "Saldo insuficiente"
    )
  })

  it("convierte a texto cualquier otro valor", () => {
    expect(errorMessage("fallo")).toBe("fallo")
    expect(errorMessage(null)).toBe("null")
  })
})
