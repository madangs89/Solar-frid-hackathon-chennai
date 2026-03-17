import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuth: false,
    user: null,
    currentWorkinId: null,
    array: [],
  },
  reducers: {
    setAuth: (state, action) => {
      state.isAuth = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setCurrentWorkingId: (state, action) => {
      state.currentWorkinId = action.payload;
    },
    setArray: (state, action) => {
      state.array = action.payload;
    },
  },
});

export const { setAuth, setUser, setCurrentWorkingId, setArray } =
  authSlice.actions;

const authReducer = authSlice.reducer;

export default authReducer;
