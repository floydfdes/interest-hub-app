// lib/imageUtils.ts

// Resize & convert uploaded image to base64
export const resizeImageToBase64 = (
    file: File,
    maxWidth = 400,
    maxHeight = 250
): Promise<string | null> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = maxWidth;
                canvas.height = maxHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(null);

                ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
                const base64 = canvas.toDataURL("image/jpeg");
                resolve(base64);
            };

            if (event.target?.result) {
                img.src = event.target.result as string;
            }
        };

        reader.readAsDataURL(file);
    });
};

// Convert remote image URL to base64
export const convertImageURLToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error("URL to base64 failed", err);
        return null;
    }
};


// 🌟 Universal Compressor + Converter
export const compressAndConvertToBase64 = async (
    input: File | string
): Promise<string | null> => {
    try {
        let file: File;

        if (typeof input === "string") {
            const res = await fetch(input);
            const blob = await res.blob();
            file = new File([blob], "image.jpg", { type: blob.type });
        } else {
            file = input;
        }

        const resized = await resizeImageToBase64(file, 400, 250);
        return resized;
    } catch (err) {
        console.error("Compression error:", err);
        return null;
    }
};