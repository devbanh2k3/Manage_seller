const data = {
    "bearhubs1-https://xorinax.com/products/kitty-kurlzmagic-foldable-scratcher--cat-bed-1": {
        "productLink": "https://xorinax.com/products/kitty-kurlzmagic-foldable-scratcher--cat-bed-1",
        "store": "bearhubs1",
        "rev": 34.98
    },
    "HieuHung-https://Ralivax.com/products/hot-sale-50-off-felt-learning-board-busy-board-2": {
        "productLink": "https://Ralivax.com/products/hot-sale-50-off-felt-learning-board-busy-board-2",
        "store": "HieuHung",
        "rev": 124.94
    },
    "ASun-https://Viloraz.com/products/kitty-kurlzmagic-foldable-scratcher--cat-bed": {
        "productLink": "https://Viloraz.com/products/kitty-kurlzmagic-foldable-scratcher--cat-bed",
        "store": "ASun",
        "rev": 189.90999999999997
    },
    "Hoamii-https://Raviron.com/products/kitchen-sink-faucet-organizer": {
        "productLink": "https://Raviron.com/products/kitchen-sink-faucet-organizer",
        "store": "Hoamii",
        "rev": 98.94
    }
};

for (const key in data) {
    if (data.hasOwnProperty(key)) {
        console.log(`Store: ${data[key].store}`);
        console.log(`Product Link: ${data[key].productLink}`);
        console.log(`Revenue: ${data[key].rev}`);
        console.log('---------------------------');
    }
}
