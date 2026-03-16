import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./Slice/authSlice";
import socketReducer from "./Slice/socketSlice";

export default configureStore({
  reducer: {
    auth: authReducer,
    socket: socketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["socket/setSocket"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload"],
        // Ignore these paths in the state
        ignoredPaths: ["socket.socketInstance"],
      },
    }),
});
