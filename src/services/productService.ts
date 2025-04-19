import productModel from "../../src/models/productModel";

export const getAllProducts = async ()=>{
    return  await productModel.find();
}

export const seedInitialProducts = async () => {
    const products= [
        {title:"Dell labtop ",image:"https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/dell-client-products/notebooks/latitude-notebooks/13-3320/media-gallery/peripherals_laptop_latitude_3320_gallery_1.psd?fmt=pjpg&pscan=auto&scl=1&wid=3337&hei=2417&qlt=100,1&resMode=sharp2&size=3337,2417&chrss=full&imwidth=5000",
        price:10,stock:100},
        // {title:"product 2 ",Image:"image2.jpg",price:20,stock:200},
        // {title:"product 3",Image:"image3.jpg",price:30,stock:300},
        // {title:"product 4 ",Image:"image4.jpg",price:40,stock:400},
        // {title:"product 5 ",Image:"image5.jpg",price:50,stock:500},
        // {title:"product 6 ",Image:"image6.jpg",price:60,stock:600},
        // {title:"product 7 ",Image:"image7.jpg",price:70,stock:700},
        // {title:"product 8 ",Image:"image8.jpg",price:80,stock:800},
        // {title:"product 9 ",Image:"image9.jpg",price:90,stock:900},
        // {title:"product 10 ",Image:"image10.jpg",price:100,stock:1000},

    ];

    const products_ = await getAllProducts();

    if(products_.length===0){
        await productModel.insertMany(products);
    }
};


// Open src/services/productService.ts and add a new function without tests:
export const searchProducts = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return await getAllProducts();
    }
    
    // This code adds a branch that won't be covered by tests
    return await productModel.find({
      title: { $regex: searchTerm, $options: 'i' }
    });
  };