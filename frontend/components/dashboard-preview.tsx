"use client"

import { motion } from "framer-motion"
import { TrendingUp, AlertTriangle } from "lucide-react"

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="w-full"
    >
      <div className="relative">
        {/* Dashboard Window */}
        <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-2xl p-1 shadow-2xl border border-slate-700/50 backdrop-blur-sm">
          <div className="bg-slate-950 rounded-xl overflow-hidden">
            {/* Browser Bar */}
            <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 bg-slate-800 rounded px-3 py-1 text-[10px] text-slate-400">
                secureguard.app/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-3 space-y-2">
              {/* Stats Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-2"
              >
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <p className="text-[8px] text-slate-400 mb-0.5">Total Volume</p>
                  <p className="text-sm font-bold text-white">$2.4M</p>
                  <p className="text-[8px] text-green-500">↑ 42.8%</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <p className="text-[8px] text-slate-400 mb-0.5">Transactions</p>
                  <p className="text-sm font-bold text-white">1,847</p>
                  <p className="text-[8px] text-violet-400">↑ 12.3%</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <p className="text-[8px] text-slate-400 mb-0.5">Risk Score</p>
                  <p className="text-sm font-bold text-white">94.2</p>
                  <p className="text-[8px] text-green-500">Excellent</p>
                </div>
              </motion.div>

              {/* Recent Transactions Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
              >
                <div className="px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                  <p className="text-[9px] font-semibold text-white">Recent Transactions</p>
                  <div className="flex gap-0.5 items-center">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    <p className="text-[8px] text-slate-400">Live</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-800">
                  {[
                    { ref: "TXN-8471", customer: "John Doe", amount: "$2,450", status: "approved", risk: 12 },
                    { ref: "TXN-8472", customer: "Jane Smith", amount: "$890", status: "pending", risk: 45 },
                    { ref: "TXN-8473", customer: "Bob Wilson", amount: "$5,120", status: "approved", risk: 8 },
                  ].map((tx, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="px-2 py-1 flex items-center justify-between text-[8px]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{tx.ref}</p>
                        <p className="text-slate-500 truncate">{tx.customer}</p>
                      </div>
                      <div className="text-right mx-2">
                        <p className="text-white font-medium">{tx.amount}</p>
                        <p className={tx.status === "approved" ? "text-green-500" : "text-violet-400"}>
                          {tx.status}
                        </p>
                      </div>
                      <div className={`px-1 py-0.5 rounded text-[8px] ${tx.risk > 30 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                        {tx.risk}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Alert Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-800/50 rounded-lg p-2"
              >
                <div className="flex items-start gap-1.5">
                  <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-red-400">High-Risk Transaction</p>
                    <p className="text-[8px] text-slate-400 truncate">TXN-8492: $15,320 flagged</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"
                  />
                </div>
              </motion.div>

              {/* Active Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
              >
                <div className="px-2 py-1 border-b border-slate-800">
                  <p className="text-[9px] font-semibold text-white">Active Alerts</p>
                </div>
                <div className="p-2 space-y-1">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex items-start gap-1 bg-red-900/20 border border-red-800/30 rounded p-1.5"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-semibold text-red-400">High Risk Transaction</p>
                      <p className="text-[7px] text-slate-400">TXN-8492 • $15,320 flagged</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                    className="flex items-start gap-1 bg-violet-900/20 border border-violet-800/30 rounded p-1.5"
                  >
                    <AlertTriangle className="h-2.5 w-2.5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-semibold text-violet-400">Unusual Pattern</p>
                      <p className="text-[7px] text-slate-400">Customer #4821 • 5 rapid transactions</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-violet-600/20 blur-3xl -z-10 rounded-full" />
      </div>
    </motion.div>
  )
}
