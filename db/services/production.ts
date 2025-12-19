import { getDatabase } from '../database';
import { ProductService } from './product';
import { StockService } from './stock';

export interface ProductionResult {
  success: boolean;
  message: string;
  productId?: number;
  quantityProduced?: number;
}

export class ProductionService {
  /**
   * Produce a product by deducting stock items based on recipes
   */
  static async produceProduct(
    productId: number,
    quantity: number
  ): Promise<ProductionResult> {
    const db = await getDatabase();

    try {
      // Get product details
      const product = await ProductService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      // Check if product has recipes
      if (!product.isHaveRecipes) {
        return {
          success: false,
          message: 'Product does not have recipes. Cannot produce without recipe.',
        };
      }

      // Get product recipes with details
      const recipes = await ProductService.getProductRecipesWithDetails(productId);
      if (recipes.length === 0) {
        return {
          success: false,
          message: 'No recipes found for this product',
        };
      }

      // Check if we have enough stock for all ingredients
      const insufficientStock: string[] = [];
      for (const recipe of recipes) {
        const requiredAmount = recipe.amount * quantity;
        if (recipe.stockQuantity < requiredAmount) {
          insufficientStock.push(
            `${recipe.stockName}: need ${requiredAmount} ${recipe.stockSymbol}, have ${recipe.stockQuantity} ${recipe.stockSymbol}`
          );
        }
      }

      if (insufficientStock.length > 0) {
        return {
          success: false,
          message: `Insufficient stock:\n${insufficientStock.join('\n')}`,
        };
      }

      // All checks passed, start production
      // Begin transaction
      await db.execAsync('BEGIN TRANSACTION');

      try {
        // Deduct stock items
        for (const recipe of recipes) {
          const requiredAmount = recipe.amount * quantity;
          await StockService.updateStockQuantity(
            recipe.StockId,
            -requiredAmount,
            'OUT',
            `Production: ${product.name} x${quantity}`
          );
        }

        // Add to product stock
        const newStock = product.stock + quantity;
        await ProductService.updateProduct(productId, {
          stock: newStock,
        });

        // Commit transaction
        await db.execAsync('COMMIT');

        return {
          success: true,
          message: `Successfully produced ${quantity} ${product.name}`,
          productId: productId,
          quantityProduced: quantity,
        };
      } catch (error) {
        // Rollback on error
        await db.execAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error producing product:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to produce product',
      };
    }
  }

  /**
   * Check if a product can be produced
   */
  static async canProduceProduct(
    productId: number,
    quantity: number
  ): Promise<{
    canProduce: boolean;
    missingIngredients: string[];
  }> {
    const result = await ProductService.canMakeProduct(productId, quantity);
    return {
      canProduce: result.canMake,
      missingIngredients: result.missingIngredients,
    };
  }
}
