```javascript
const https = require('https');
const readline = require('readline');

// Crear interfaz de lectura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Objeto para almacenar tasas de cambio en caché
let exchangeRates = {};
let lastUpdateTime = 0;
const CACHE_DURATION = 3600000; // 1 hora en milisegundos

// Función para obtener tasas de cambio desde API
function fetchExchangeRates(baseCurrency = 'USD') {
  return new Promise((resolve, reject) => {
    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          exchangeRates = parsed.rates;
          lastUpdateTime = Date.now();
          resolve(parsed);
        } catch (error) {
          reject(new Error('Error al parsear respuesta: ' + error.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('Error en la solicitud: ' + error.message));
    });
  });
}

// Función para convertir monedas
function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!exchangeRates[fromCurrency]) {
    throw new Error(`Moneda origen no disponible: ${fromCurrency}`);
  }
  if (!exchangeRates[toCurrency]) {
    throw new Error(`Moneda destino no disponible: ${toCurrency}`);
  }
  
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Convertir a USD primero (moneda base)
  const amountInUSD = amount / exchangeRates[fromCurrency];
  // Luego convertir a la moneda destino
  const result = amountInUSD * exchangeRates[toCurrency];
  
  return parseFloat(result.toFixed(2));
}

// Función para obtener lista de monedas disponibles
function getAvailableCurrencies() {
  return Object.keys(exchangeRates).sort();
}

// Función para mostrar opciones del menú
function showMenu() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  CONVERTIDOR DE MONEDAS EN TIEMPO REAL  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\n1. Convertir moneda');
  console.log('2. Ver monedas disponibles');
  console.log('3. Actualizar tasas de cambio');
  console.log('4. Salir');
  console.log('\nSelecciona una opción (1-4):\n');
}

// Función para convertir interactivamente
function convertInteractive() {
  rl.question('Ingresa cantidad: ', (amount) => {
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      console.log('❌ Error: Ingresa una cantidad válida.');
      mainMenu();
      return;
    }
    
    rl.question('Ingresa moneda origen (ej: USD): ', (from) => {
      const fromCurrency = from.toUpperCase();
      
      rl.question('Ingresa moneda destino (ej: EUR): ', (to) => {
        const toCurrency = to.toUpperCase();
        
        try {
          const result = convertCurrency(parsedAmount, fromCurrency, toCurrency);
          console.log(`\n✅ ${parsedAmount} ${fromCurrency} = ${result} ${toCurrency}`);
          
          // Mostrar tasa de cambio
          const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
          console.log(`📊 Tasa de cambio: 1 ${fromCurrency} = ${parseFloat(rate.toFixed(4))} ${toCurrency}`);
          
        } catch (error) {
          console.log(`❌ ${error.message}`);
        }
        
        mainMenu();
      });
    });
  });
}

// Función para mostrar monedas disponibles
function showCurrencies() {
  const currencies = getAvailableCurrencies();
  console.log('\n📋 Monedas disponibles (' + currencies.length + '):\n');
  
  // Mostrar en columnas
  for (let i = 0; i < currencies.length; i += 4) {
    const row = currencies.slice(i, i + 4);
    console.log(row.map(c => c.padEnd(8)).join(''));
  }
  
  mainMenu();
}

// Función para actualizar tasas
function updateRates() {
  console.log('\n⏳ Actualizando tasas de cambio...');
  
  fetchExchangeRates('USD')
    .then((data) => {
      console.log('✅ Tasas actualizadas correctamente');
      console.log(`📅 Última actualización: ${new Date(lastUpdateTime).toLocaleString()}`);
      mainMenu();
    })
    .catch((error) => {
      console.log(`❌ Error: ${error.message}`);
      mainMenu();
    });
}

// Menú principal
function mainMenu() {
  showMenu();
  
  rl.question('Tu opción: ', (choice) => {
    switch (choice.trim()) {
      case '1':
        convertInteractive();
        break;
      