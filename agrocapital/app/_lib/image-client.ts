export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export async function compressProductImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) throw new Error("Image invalide ou trop lourde (5 Mo maximum).");
  const source = await createImageBitmap(file); const ratio = Math.min(1, 800 / source.width);
  const canvas = document.createElement("canvas"); canvas.width = Math.round(source.width * ratio); canvas.height = Math.round(source.height * ratio);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height); source.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .78));
  if (!blob) throw new Error("Impossible de pr?parer l'image."); return new File([blob], "produit.webp", { type: "image/webp" });
}
