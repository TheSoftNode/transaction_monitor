import { api } from "@/lib/redux/api"
import type { Transaction, PaginatedResponse } from "@/types"

export const transactionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<
      PaginatedResponse<Transaction>,
      {
        page?: number
        search?: string
        status?: string
        ordering?: string
      }
    >({
      query: (params) => ({
        url: "/transactions/",
        params,
      }),
      providesTags: ["Transaction"],
    }),
    getTransaction: builder.query<Transaction, string>({
      query: (id) => `/transactions/${id}/`,
      providesTags: ["Transaction"],
    }),
    createTransaction: builder.mutation<Transaction, Partial<Transaction>>({
      query: (body) => ({
        url: "/transactions/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Transaction"],
    }),
    updateTransactionStatus: builder.mutation<
      Transaction,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/transactions/${id}/status/`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Transaction"],
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionStatusMutation,
} = transactionsApi
