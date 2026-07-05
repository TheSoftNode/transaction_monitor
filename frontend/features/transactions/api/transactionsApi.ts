import { api } from "@/lib/redux/api"
import type {
  Transaction,
  TransactionListItem,
  PaginatedResponse,
} from "@/types"

export const transactionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<
      PaginatedResponse<TransactionListItem>,
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
    updateTransaction: builder.mutation<
      Transaction,
      { id: string; data: Partial<Transaction> }
    >({
      query: ({ id, data }) => ({
        url: `/transactions/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Transaction"],
    }),
    patchTransaction: builder.mutation<
      Transaction,
      { id: string; data: Partial<Transaction> }
    >({
      query: ({ id, data }) => ({
        url: `/transactions/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Transaction"],
    }),
    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}/`,
        method: "DELETE",
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
  useUpdateTransactionMutation,
  usePatchTransactionMutation,
  useDeleteTransactionMutation,
  useUpdateTransactionStatusMutation,
} = transactionsApi
