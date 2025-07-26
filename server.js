// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose'); // Importuje Mongoose

const app = express();
const port = 3000;

// --- Konfiguracja połączenia z MongoDB ---
// ZASTĄP TEN CIĄG SWOIM URI POŁĄCZENIA Z MONGODB ATLAS
const MONGODB_URI = 'mongodb+srv://sebastianruman1:2N3Njqm7FClSo6pr@cluster0.aiyuhcp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true, // Opcja już niepotrzebna w nowszych wersjach Mongoose
    // useFindAndModify: false // Opcja już niepotrzebna w nowszych wersjach Mongoose
})
.then(() => console.log('Połączono z MongoDB Atlas!'))
.catch(err => console.error('Błąd połączenia z MongoDB Atlas:', err));

// --- Definicja Schematu i Modelu Mongoose ---
// Schemat definiuje strukturę dokumentów w kolekcji
const inventoryItemSchema = new mongoose.Schema({
    itemId: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    description: String,
    category: String,
    quantity: { type: Number, required: true, min: 0 },
    unit: String,
    location: String,
    supplier: String,
    reorderLevel: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

// Model to klasa, której używamy do interakcji z kolekcją 'inventoryitems'
// Mongoose automatycznie tworzy nazwę kolekcji w liczbie mnogiej i małych liter (inventoryitems)
const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Udostępnij pliki statyczne z katalogu 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- Endpointy API ---

// Endpoint do pobierania wszystkich elementów magazynowych
app.get('/api/inventory', async (req, res) => {
    try {
        const items = await InventoryItem.find(); // Pobiera wszystkie dokumenty z kolekcji
        res.json(items);
    } catch (error) {
        console.error('Błąd podczas pobierania danych z MongoDB:', error);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania danych.' });
    }
});

// Endpoint do dodawania nowego elementu magazynowego
app.post('/api/inventory', async (req, res) => {
    const newItemData = req.body;
    try {
        // Sprawdź, czy element o danym ID już istnieje
        const existingItem = await InventoryItem.findOne({ itemId: newItemData.itemId });
        if (existingItem) {
            return res.status(409).json({ message: 'Element o tym ID już istnieje.' });
        }

        const newItem = new InventoryItem(newItemData); // Tworzy nowy dokument Mongoose
        await newItem.save(); // Zapisuje dokument w bazie danych
        res.status(201).json({ message: 'Element dodany pomyślnie!', item: newItem });
    } catch (error) {
        console.error('Błąd podczas dodawania elementu do MongoDB:', error);
        res.status(500).json({ message: 'Błąd serwera podczas dodawania elementu.' });
    }
});

// Endpoint do usuwania elementu magazynowego
app.delete('/api/inventory/:itemId', async (req, res) => {
    const itemIdToDelete = req.params.itemId;
    try {
        const result = await InventoryItem.deleteOne({ itemId: itemIdToDelete }); // Usuwa dokument
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: `Element o ID ${itemIdToDelete} nie znaleziono.` });
        }
        res.status(200).json({ message: `Element o ID ${itemIdToDelete} usunięty pomyślnie.` });
    } catch (error) {
        console.error('Błąd podczas usuwania elementu z MongoDB:', error);
        res.status(500).json({ message: 'Błąd serwera podczas usuwania elementu.' });
    }
});

// Uruchomienie serwera
app.listen(port, () => {
    console.log(`Serwer działa na http://localhost:${port}`);
    console.log(`Otwórz http://localhost:${port}/magazyn_produkcyjny.html w przeglądarce.`);
});
