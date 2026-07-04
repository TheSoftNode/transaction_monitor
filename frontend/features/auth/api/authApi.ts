import { api } from "@/lib/redux/api"
import type { AuthResponse } from "@/types"

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      AuthResponse,
      { username: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/login/",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<
      AuthResponse,
      { username: string; email: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/register/",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation } = authApi
