import { createSlice } from "@reduxjs/toolkit";

export const socketSlice = createSlice({
  name: "socket",
  initialState: {
    socket: null,
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
  },
});

export const { setSocket } = socketSlice.actions;

const socketReducer = socketSlice.reducer;

export default socketReducer;
