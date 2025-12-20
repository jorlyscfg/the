/**
 * Convierte una URL de imagen a una cadena Base64
 * @param url - URL de la imagen a convertir
 * @returns Promesa que resuelve a la cadena Base64
 */
export async function urlToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error al convertir imagen a Base64:', error);
        return '';
    }
}
