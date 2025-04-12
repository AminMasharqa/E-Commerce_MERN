import { cartModel } from "../models/cartModel";
import productModel from "../models/productModel";

interface CreateCartForUser {
  userId: string;
}

const createCartForUser = async ({ userId }: CreateCartForUser) => {
  const cart = await cartModel.create({ userId, totalAmount: 0 });
  await cart.save();
  return cart;
};

interface GetActiveCartForUser {
  userId: string;
}

export const getActiveCartForUser = async ({
  userId,
}: GetActiveCartForUser) => {
  let cart = await cartModel.findOne({ userId, status: "active" });
  if (!cart) {
    cart = await createCartForUser({ userId });
  }
  return cart;
};

interface AddItemToCart {
  productId: string;
  quantity: number;
  userId: string;
}

export const addItemToCart = async ({
  productId,
  quantity,
  userId,
}: AddItemToCart) => {
  try {
    const cart = await getActiveCartForUser({ userId });

    // Check if the item exists in the cart
    const existsInCart = cart.items.find((p) => 
      p.product && p.product._id && p.product._id.toString() === productId
    );

    if (existsInCart) {
      return { 
        data: "Item already exists in cart!", 
        statusCode: 400 
      };
    }

    // Fetch the product
    const product = await productModel.findById(productId);

    if (!product) {
      return { 
        data: "Product not found", 
        statusCode: 404 
      };
    }

    if(product.stock <quantity){
        return{
            data:"low stock for this product ",
            statusCode:400
        };
    }

    // Add the full product object to the cart
    cart.items.push({
      product: product, // Store the entire product object
      unitPrice: product.price,
      quantity
    });

    // Update the total amount of the cart 
    cart.totalAmount=cart.totalAmount+(product.price*quantity);

    const updatedCart = await cart.save();

    return {
      data: updatedCart,
      statusCode: 200
    };
  } catch (error: any) { // Type assertion for error
    console.error("Error in addItemToCart:", error);
    return {
      data: { 
        message: "Failed to add item to cart", 
        error: error.message || String(error) 
      },
      statusCode: 500
    };
  }
};