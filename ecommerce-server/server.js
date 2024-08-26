const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PRODUCTS_FILE = path.join(__dirname, 'productos.json');
const CARTS_FILE = path.join(__dirname, 'carrito.json');

// Utility function to read JSON files
const readJSONFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
};

// Utility function to write JSON files
const writeJSONFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Products router
const productsRouter = express.Router();

productsRouter.get('/', (req, res) => {
    const limit = parseInt(req.query.limit, 10);
    let products = readJSONFile(PRODUCTS_FILE);
    if (limit) {
        products = products.slice(0, limit);
    }
    res.json(products);
});

productsRouter.get('/:pid', (req, res) => {
    const products = readJSONFile(PRODUCTS_FILE);
    const product = products.find(p => p.id === parseInt(req.params.pid, 10));
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

productsRouter.put('/:pid', (req, res) => {
    const products = readJSONFile(PRODUCTS_FILE);
    const index = products.findIndex(p => p.id === parseInt(req.params.pid, 10));
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    const updatedProduct = { ...products[index], ...req.body };
    if (updatedProduct.id !== undefined) {
        return res.status(400).json({ error: 'Cannot update product ID' });
    }
    products[index] = updatedProduct;
    writeJSONFile(PRODUCTS_FILE, products);
    res.json(updatedProduct);
});

productsRouter.delete('/:pid', (req, res) => {
    let products = readJSONFile(PRODUCTS_FILE);
    const initialLength = products.length;
    products = products.filter(p => p.id !== parseInt(req.params.pid, 10));
    if (products.length === initialLength) {
        return res.status(404).json({ error: 'Product not found' });
    }
    writeJSONFile(PRODUCTS_FILE, products);
    res.status(204).end();
});

// Carts router
const cartsRouter = express.Router();

cartsRouter.post('/', (req, res) => {
    const carts = readJSONFile(CARTS_FILE);
    const newCart = {
        id: Date.now(),
        products: []
    };
    carts.push(newCart);
    writeJSONFile(CARTS_FILE, carts);
    res.status(201).json(newCart);
});

cartsRouter.get('/:cid', (req, res) => {
    const carts = readJSONFile(CARTS_FILE);
    const cart = carts.find(c => c.id === parseInt(req.params.cid, 10));
    if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
    }
    res.json(cart.products);
});

cartsRouter.post('/:cid/product/:pid', (req, res) => {
    const carts = readJSONFile(CARTS_FILE);
    const cart = carts.find(c => c.id === parseInt(req.params.cid, 10));
    if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
    }
    const productId = parseInt(req.params.pid, 10);
    const quantity = req.body.quantity || 1;
    const productInCart = cart.products.find(p => p.product === productId);
    if (productInCart) {
        productInCart.quantity += quantity;
    } else {
        cart.products.push({ product: productId, quantity });
    }
    writeJSONFile(CARTS_FILE, carts);
    res.json(cart.products);
});

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
