import { configureStore } from '@reduxjs/toolkit';
import printerReducer from './slices/printSlice';

export const store = configureStore({
    reducer: {
        printer: printerReducer
    }
});