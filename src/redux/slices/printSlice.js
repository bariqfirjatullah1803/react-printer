import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    device: null,
    isConnected: false,
    lastConnectedDevice: null // Store device info for reconnection
};

export const printerSlice = createSlice({
    name: 'printer',
    initialState,
    reducers: {
        setPrinterDevice: (state, action) => {
            state.device = action.payload;
            state.isConnected = true;
            // Save minimal device info for reconnection
            state.lastConnectedDevice = action.payload ? {
                name: action.payload.name,
                id: action.payload.id
            } : null;
        },
        disconnectPrinter: (state) => {
            state.device = null;
            state.isConnected = false;
        }
    }
});

export const { setPrinterDevice, disconnectPrinter } = printerSlice.actions;
export default printerSlice.reducer;