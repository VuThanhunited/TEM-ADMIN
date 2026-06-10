/**
 * Template Selector Service
 * Chọn template type dựa trên product category
 */

/**
 * Select appropriate template based on product category
 * @param {Object} product - Product document from database
 * @param {Object} template - Template document from database (optional)
 * @returns {String} Template type identifier: 'food-agriculture' | 'existing'
 */
function selectTemplateType(product, template) {
  // Kiểm tra product category
  if (!product || !product.category) {
    return 'existing';
  }

  // Nếu category là "Thực phẩm và Nông nghiệp" → return 'food-agriculture'
  if (product.category === 'Thực phẩm và Nông nghiệp') {
    return 'food-agriculture';
  }

  // Các categories khác → return 'existing'
  return 'existing';
}

module.exports = {
  selectTemplateType
};
