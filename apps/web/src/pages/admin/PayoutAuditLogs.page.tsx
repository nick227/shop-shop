import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { Button } from '@shared/ui/primitives/ui/Button/Button'
import { Input } from '@shared/ui/primitives/ui/Input/Input'
import { Badge } from '@shared/ui/primitives'
import { Search, Download, Filter, User, Calendar, Activity } from 'lucide-react'
import { Search, Download, Filter, User, Calendar, Activity } from 'lucide-react'

interface PayoutAuditLog {
  id: string
  affiliateId: string
  affiliatePayoutId: string
  action: 'CREATED' | 'APPROVED' | 'PAID' | 'REVERSED' | 'MODIFIED'
  performedBy: string | null
  performedAt: Date
  details: Record<string, any> | null
  ipAddress?: string
  performedByUser?: {
    id: string
    name: string | null
    email: string
  }
  affiliate?: {
    id: string
    user: {
      name: string | null
      email: string
    }
  }
}

const actionColors: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  REVERSED: 'bg-red-100 text-red-800',
  MODIFIED: 'bg-yellow-100 text-yellow-800',
}

export default function PayoutAuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [affiliateFilter, setAffiliateFilter] = useState<string>('')
  const [limit, setLimit] = useState('50')

  // Fetch audit logs
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['payout-audit-logs', { affiliateId: affiliateFilter, limit }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (affiliateFilter) params.append('affiliateId', affiliateFilter)
      params.append('limit', limit)
      
      const response = await fetch(`/api/affiliates/payouts/audit-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      const data = await response.json()
      return data.auditLogs as PayoutAuditLog[]
    },
  })

  // Filter logs based on search and action
  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.performedByUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByUser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.affiliate?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.affiliate?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.affiliatePayoutId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = !actionFilter || log.action === actionFilter
    
    return matchesSearch && matchesAction
  }) || []

  const handleExportCSV = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Performed By', 'Affiliate', 'Payout ID', 'IP Address', 'Details'],
      ...filteredLogs.map(log => [
        new Date(log.performedAt).toLocaleString(),
        log.action,
        log.performedByUser ? `${log.performedByUser.name || log.performedByUser.email}` : 'System',
        log.affiliate ? `${log.affiliate.user.name || log.affiliate.user.email}` : 'N/A',
        log.affiliatePayoutId,
        log.ipAddress || 'N/A',
        log.details ? JSON.stringify(log.details) : ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payout-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details) return 'No details'
    
    const entries = Object.entries(details)
      .filter(([key]) => key !== 'autoApprove' && key !== 'commissionCount') // Exclude internal fields
      .map(([key, value]) => `${key}: ${value}`)
    
    return entries.length > 0 ? entries.join(', ') : 'No details'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payout Audit Logs</h1>
        <Button onClick={handleExportCSV} disabled={filteredLogs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by user, email, or payout ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REVERSED">Reversed</SelectItem>
                  <SelectItem value="MODIFIED">Modified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="affiliate">Affiliate ID</Label>
              <Input
                id="affiliate"
                placeholder="Filter by affiliate ID"
                value={affiliateFilter}
                onChange={(e) => setAffiliateFilter(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={() => refetch()} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => {
              setSearchTerm('')
              setActionFilter('')
              setAffiliateFilter('')
            }} variant="outline">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredLogs.filter(log => log.action === 'CREATED').length}
            </div>
            <div className="text-sm text-muted-foreground">Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(log => log.action === 'APPROVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {filteredLogs.filter(log => log.action === 'PAID').length}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.action === 'REVERSED').length}
            </div>
            <div className="text-sm text-muted-foreground">Reversed</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(log.performedAt).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {log.performedByUser?.name || log.performedByUser?.email || 'System'}
                            </div>
                            {log.performedByUser?.email && log.performedByUser?.name && (
                              <div className="text-xs text-muted-foreground">
                                {log.performedByUser.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.affiliate?.user?.name || log.affiliate?.user?.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {log.affiliatePayoutId.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.ipAddress || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs truncate" title={formatDetails(log.details)}>
                          {formatDetails(log.details)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
