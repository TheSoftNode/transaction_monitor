import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "./store"
import { API_URL } from "@/types"

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }
    return headers
  },
})

export const api = createApi({
  baseQuery,
  tagTypes: ["Transaction", "Customer", "Alert", "AuditLog", "User"],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<
      { access: string; refresh: string },
      { username: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/login/",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<
      { id: number; username: string; email: string },
      { username: string; email: string; first_name: string; last_name: string; password: string; password2: string }
    >({
      query: (userData) => ({
        url: "/auth/register/",
        method: "POST",
        body: userData,
      }),
    }),
    getCurrentUser: builder.query<
      { id: number; username: string; email: string },
      void
    >({
      query: () => "/auth/user/",
      providesTags: ["User"],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
} = api
