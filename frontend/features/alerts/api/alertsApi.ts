import { api } from "@/lib/redux/api"
import type { Alert, AlertListItem, AuditLog, PaginatedResponse } from "@/types"

export const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<
      PaginatedResponse<AlertListItem>,
      {
        page?: number
        search?: string
        severity?: string
        status?: string
        ordering?: string
      }
    >({
      query: (params) => ({
        url: "/alerts/",
        params: {
          page: params.page,
          search: params.search,
          severity: params.severity,
          status: params.status,
          ordering: params.ordering || "-triggered_at",
        },
      }),
      providesTags: ["Alert"],
    }),
    getAlert: builder.query<Alert, string>({
      query: (id) => `/alerts/${id}/`,
      providesTags: (_result, _error, id) => [{ type: "Alert", id }],
    }),
    resolveAlert: builder.mutation<
      Alert,
      { id: string; status: "resolved" | "false_positive" }
    >({
      query: ({ id, status }) => ({
        url: `/alerts/${id}/resolve/`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Alert", id },
        "Alert",
      ],
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

export const {
  useGetAlertsQuery,
  useGetAlertQuery,
  useResolveAlertMutation,
  useGetAuditLogsQuery,
} = alertsApi
