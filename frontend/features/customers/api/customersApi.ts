import { api } from "@/lib/redux/api"
import type { Customer, PaginatedResponse } from "@/types"

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      PaginatedResponse<Customer>,
      { page?: number; search?: string }
    >({
      query: (params) => ({
        url: "/customers/",
        params,
      }),
      providesTags: ["Customer"],
    }),
    getCustomer: builder.query<Customer, string>({
      query: (id) => `/customers/${id}/`,
      providesTags: ["Customer"],
    }),
    createCustomer: builder.mutation<Customer, Partial<Customer>>({
      query: (body) => ({
        url: "/customers/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer"],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
} = customersApi
