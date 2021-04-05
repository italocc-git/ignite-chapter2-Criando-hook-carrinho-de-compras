import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart')

     if (storagedCart) {
        return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart];
      const productExists = cart.find( item => item.id === productId)

      const stock = await api.get(`stock/${productId}`)

      const stockAmount = stock.data.amount;
      
      const currentAmount = productExists ? productExists.amount : 0;

      const desiredAmount = currentAmount+1;
      
      if(desiredAmount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if(productExists){
        productExists.amount = desiredAmount
      }else {
        const product = await api.get(`products/${productId}`)

        const newProduct = {
          ...product.data , 
          amount : 1
        }
        updatedCart.push(newProduct);


      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart' , JSON.stringify(updatedCart))
      

    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const findProductInCart = cart.find(item => item.id === productId)

      if(!findProductInCart) {
        
        throw Error('Product does not exists');
      }else {
        const newCart = cart.filter(item => item.id !== findProductInCart.id) 
        setCart(newCart)
        
        localStorage.setItem('@RocketShoes:cart' , JSON.stringify(newCart))
 
      }

    } catch {
      // TODO

      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      if(amount <= 0) return;

      
      const stockProduct =  await api.get<Stock>(`stock/${productId}`).then(response => response.data.amount)

      if(amount > stockProduct) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
      }
        //code
        const findProduct = cart.find(itemCart => itemCart.id === productId)
      
        if(findProduct){
          setCart([...cart , {...findProduct , amount : amount}])
        
          localStorage.setItem('@RocketShoes:cart' , JSON.stringify([...cart , {...findProduct , amount : amount}]))
        }
        else {
          
          throw Error();
        }

      
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
