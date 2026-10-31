'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BarChart2 } from 'lucide-react'

interface ChartData {
  name: string
  commission: number
}

export default function CommissionChart({ refreshKey, role, currentAgent }: { 
  refreshKey: number
  role: 'admin' | 'agent'
  currentAgent: string 
}) {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
  async function fetchChartData() {
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, name')

    const { data: commissionsData } = await supabase
      .from('commissions')
      .select('amount, agent_id')

    const grouped: Record<string, number> = {}

    commissionsData?.forEach((c) => {
      const agentName = agentsData?.find(a => a.id === c.agent_id)?.name || 'Unknown'
      
      // If agent view, only show current agent's data
      if (role === 'agent' && agentName !== currentAgent) return
      
      grouped[agentName] = (grouped[agentName] || 0) + c.amount
    })

    const chartData = Object.entries(grouped).map(([name, commission]) => ({
      name,
      commission,
    }))

    setData(chartData)
    setIsLoading(false)
  }

  fetchChartData()
}, [refreshKey, role, currentAgent])

  if (isLoading) return <p className="text-gray-400">Loading chart...</p>

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">
          Commissions by Agent
        </h2>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
          <YAxis
            width={60}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
          />
        <Tooltip
  formatter={(value) =>
    [`$${Number(value).toLocaleString()}`, 'Commission']
  }
/>
          <Bar dataKey="commission" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}