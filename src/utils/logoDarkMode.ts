/**
 * Utility to create a dark version of a logo for dark mode
 * This function creates a simple inverted version of the logo
 */

export function createDarkLogo(base64Logo: string): string {
  // For now, we'll create a simple placeholder dark logo
  // In a real implementation, you would want to properly invert the colors
  // or use a pre-designed dark logo
  
  // This is a simple dark version with white text/light elements
  // You should replace this with your actual dark logo
  const darkLogoPlaceholder = `data:image/svg+xml;base64,${btoa(`
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" fill="#1f2937" rx="8"/>
      <text x="60" y="25" font-family="Arial, sans-serif" font-size="16" 
            font-weight="bold" text-anchor="middle" fill="#ffffff">
        TRIPOEX
      </text>
    </svg>
  `)}`;
  
  return darkLogoPlaceholder;
}

/**
 * Alternative: Create a simple inverted version of the current logo
 * This would require more complex image processing
 */
export function invertLogoColors(base64Logo: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(createDarkLogo(base64Logo));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Invert colors (but keep alpha channel)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];     // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
        // Keep alpha channel (data[i + 3]) unchanged
      }
      
      // Put the inverted image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to base64
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      // If image loading fails, return the placeholder
      resolve(createDarkLogo(base64Logo));
    };
    
    img.src = base64Logo;
  });
}