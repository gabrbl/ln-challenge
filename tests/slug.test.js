const { generateSlug } = require('../src/utils/slug');

describe('Slug Utility', () => {
  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      const result = generateSlug('Televisor Samsung QLED');
      expect(result).toBe('televisor-samsung-qled');
    });
    
    it('should replace spaces with hyphens', () => {
      const result = generateSlug('Test Product Name');
      expect(result).toBe('test-product-name');
    });
    
    it('should handle special characters', () => {
      const result = generateSlug('Producto con ñ y acentos: áéíóú');
      expect(result).toBe('producto-con-n-y-acentos-aeiou');
    });
    
    it('should remove invalid characters in strict mode', () => {
      const result = generateSlug('Product@123!#$%');
      // Slugify mantiene algunos caracteres, solo verificamos que se convierte a slug válido
      expect(result).toMatch(/^[a-z0-9-]+$/);
      expect(result).toContain('product');
    });
    
    it('should handle empty string', () => {
      const result = generateSlug('');
      expect(result).toBe('');
    });
    
    it('should handle null or undefined', () => {
      expect(generateSlug(null)).toBe('');
      expect(generateSlug(undefined)).toBe('');
    });
    
    it('should handle multiple consecutive spaces', () => {
      const result = generateSlug('Multiple     Spaces     Here');
      expect(result).toBe('multiple-spaces-here');
    });
    
    it('should generate slug from long description', () => {
      const longText = 'Televisor Samsung QLED 55 pulgadas 4K Ultra HD Smart TV con AI';
      const result = generateSlug(longText);
      expect(result).toBe('televisor-samsung-qled-55-pulgadas-4k-ultra-hd-smart-tv-con-ai');
    });
  });
});
