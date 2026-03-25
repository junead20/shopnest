// client/src/store/slices/groupSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeGroupToken: localStorage.getItem('activeGroupToken') || null,
  activeGroupName: localStorage.getItem('activeGroupName') || null,
};

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setActiveGroup: (state, action) => {
      state.activeGroupToken = action.payload.token;
      state.activeGroupName = action.payload.name;
      localStorage.setItem('activeGroupToken', action.payload.token);
      localStorage.setItem('activeGroupName', action.payload.name);
    },
    clearActiveGroup: (state) => {
      state.activeGroupToken = null;
      state.activeGroupName = null;
      localStorage.removeItem('activeGroupToken');
      localStorage.removeItem('activeGroupName');
    },
  },
});

export const { setActiveGroup, clearActiveGroup } = groupSlice.actions;
export default groupSlice.reducer;
