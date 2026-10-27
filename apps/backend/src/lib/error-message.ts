// Los errores que lanza un workflow llegan serializados (objetos planos con `message`), no como instancias de Error
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message
  }
  return String(error)
}
