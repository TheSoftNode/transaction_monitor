import { api } from "@/lib/redux/api"
import type { Alert, AuditLog, PaginatedResponse } from "@/types"

export const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<
      PaginatedResponse<Alert>,
      { page?: number; resolved?: boolean }
    >({
      query: (params) => ({
        url: "/alerts/",
        params,
      }),
      providesTags: ["Alert"],
    }),
    getAuditLogs: builder.query<
      PaginatedResponse<AuditLog>,
      { page?: number; transaction?: string }
    >({
      query: (params) => ({
        url: "/audit-logs/",
        params,
      }),
      providesTags: ["AuditLog"],
    }),
  }),
})

export const { useGetAlertsQuery, useGetAuditLogsQuery } = alertsApi
