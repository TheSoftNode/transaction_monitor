import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "./store"
import { API_URL } from "@/types"

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }
    return headers
  },
})

export const api = createApi({
  baseQuery,
  tagTypes: ["Transaction", "Customer", "Alert", "AuditLog", "User"],
  endpoints: () => ({}),
})
