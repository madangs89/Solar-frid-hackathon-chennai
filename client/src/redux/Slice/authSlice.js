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
    setArrayForPerticularData: (state, action) => {
      console.log("called");

      const { deviceId, socketData } = action.payload;

      console.log("Called for update");

      state.array = state.array.map((item) => {
        if (item.id == deviceId) {
          return {
            ...item,
            ...socketData,
          };
        }
        return item;
      });
    },
  },
});

export const {
  setAuth,
  setUser,
  setCurrentWorkingId,
  setArray,
  setArrayForPerticularData,
} = authSlice.actions;

const authReducer = authSlice.reducer;

export default authReducer;
