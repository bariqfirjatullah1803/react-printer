import React, { useState, useEffect } from 'react';
import { AlertCircle, Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDispatch, useSelector } from 'react-redux';
import { setPrinterDevice, disconnectPrinter } from './redux/slices/printSlice';


const App = () => {
  const dispatch = useDispatch();
  const { device, isConnected, lastConnectedDevice } = useSelector((state) => state.printer);

  useEffect(() => {
    // Try to reconnect to last known device on component mount
    const reconnectPrinter = async () => {
      if (lastConnectedDevice && !device) {
        try {
          const devices = await navigator.bluetooth.getDevices();
          const savedDevice = devices.find(d => d.id === lastConnectedDevice.id);

          if (savedDevice) {
            await savedDevice.gatt.connect();
            dispatch(setPrinterDevice(savedDevice));

            savedDevice.addEventListener('gattserverdisconnected', () => {
              dispatch(disconnectPrinter());
            });
          }
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    };

    reconnectPrinter();
  }, [dispatch, lastConnectedDevice]);

  const [printerDevice, setPrinterDevice] = useState(null);
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Item 1', price: 10 },
    { id: 2, name: 'Item 2', price: 15 },
    { id: 3, name: 'Item 3', price: 20 }
  ]);
  const [customerInfo, setCustomerInfo] = useState({
    name: 'John Doe',
    phone: '082230558365',
    paymentMethod: 'cash'
  });


  const receiptData = {
    date: new Date().toLocaleDateString(),
    orderId: Math.random().toString(36).substr(2, 9),
    customerName: customerInfo.name,
    cashier: 'Admin',
    items: cartItems,
    total: cartItems.reduce((sum, item) => sum + item.price, 0)
  };

  const formatReceipt = (data) => {
    const header = [
      '\x1B\x40',     // Initialize printer
      '\x1B\x61\x01', // Center alignment
      '\x1B\x45\x01', // Bold on
      'Warung DeCozzy\n',
      '\x1B\x45\x00', // Bold off
      'Jl. Watu Gong No.18 Malang\n',
      '082230558365\n',
      '================================\n',
      `Tanggal\t: ${data.date}\n`,
      `Order\t: ${data.orderId}\n`,
      `Nama\t: ${data.customerName}\n`,
      `Kasir\t: ${data.cashier}\n`,
      '================================\n',
      '\x1B\x61\x00'  // Left alignment
    ].join('');

    const items = data.items.map(item => {
      const price = item.price.toFixed(2);
      const paddedPrice = price.padStart(8);
      return `${item.name}${' '.repeat(32 - item.name.length - paddedPrice.length)}${paddedPrice}\n`;
    }).join('');
    console.log(items);


    const footer = [
      '--------------------------------\n',
      `${' '.repeat(10)}Total: $${data.total.toFixed(2)}\n`,
      '\n',
      '\x1B\x61\x01', // Center alignment
      'Thank you for your purchase!\n',
      '\n\n\n',       // Feed lines
      '\x1B\x69'      // Cut paper
    ].join('');

    return header + items + footer;
  };



  const printReceipt = async () => {
    if (!printerDevice?.gatt.connected) {
      alert('Printer not connected');
      return;
    }

    try {
      const server = await printerDevice.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const formattedReceipt = formatReceipt(receiptData);
      await characteristic.writeValue(new TextEncoder().encode(formattedReceipt));
    } catch (error) {
      console.error('Print Error:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  const scanForPrinters = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
      });

      await device.gatt.connect();
      setPrinterDevice(device);

      device.addEventListener('gattserverdisconnected', () => {
        setPrinterDevice(null);
      });
    } catch (error) {
      console.error('Bluetooth Error:', error);
      alert('Failed to connect: ' + error.message);
    }
  };

  const previewReceipt = () => {
    return formatReceipt(receiptData)
      .replace(/\x1B\x40/g, '') // Remove initialize printer command
      .replace(/\x1B\x61\x01/g, '') // Remove center alignment command
      .replace(/\x1B\x61\x00/g, '') // Remove left alignment command
      .replace(/\x1B\x45\x01/g, '') // Remove bold on command
      .replace(/\x1B\x45\x00/g, '') // Remove bold off command
      .replace(/\x1B\x69/g, ''); // Remove cut paper command
  };

  const handleCheckout = async () => {
    if (!printerDevice) {
      alert('Please connect a printer first');
      return;
    }
    await printReceipt();
    setCartItems([]);
  };

  const addToCart = (item) => {
    setCartItems([...cartItems, item]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">POS System</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Printer className={printerDevice ? 'text-green-400' : 'text-red-400'} />
              <span>{printerDevice ? 'Connected' : 'Disconnected'}</span>
            </div>
            {printerDevice && (
              <span className="text-sm">{printerDevice.name}</span>
            )}
            <Button onClick={scanForPrinters}>
              {printerDevice ? 'Change Printer' : 'Connect Printer'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Left Side - Customer Form */}
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Customer Name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            />
            <Input
              placeholder="Phone Number"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            />
            <Select
              value={customerInfo.paymentMethod}
              onValueChange={(value) => setCustomerInfo({ ...customerInfo, paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              Checkout
            </Button>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg font-mono text-sm whitespace-pre">
              <h3 className="font-semibold mb-2">Receipt Preview:</h3>
              {previewReceipt()}
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Items List */}
        <Card className="w-2/3">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p>${item.price}</p>
                  <Button
                    className="w-full mt-2"
                    onClick={() => addToCart(item)}
                  >
                    Add to Cart
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default App;