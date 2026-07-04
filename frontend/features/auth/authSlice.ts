import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ access: string; refresh: string }>
    ) => {
      state.token = action.payload.access
      state.refreshToken = action.payload.refresh
      state.isAuthenticated = true
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.access)
        localStorage.setItem("refreshToken", action.payload.refresh)
      }
    },
    logout: (state) => {
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
      }
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
