import imageCompression from "browser-image-compression";

export async function resizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,           // ไม่เกิน 1MB
    maxWidthOrHeight: 1600, // จำกัดความกว้าง/สูง
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Ensure the new file has the same name as the original
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Resize image error:", error);
    return file; // fallback
  }
}
