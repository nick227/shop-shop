import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { Download, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle } from 'lucide-react'

interface Payout {
  id: string
  affiliateId: string
  affiliate: {
    user: {
      name: string | null
      email: string
    }
    referralCode: string
  }
  amount: number
  method: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  periodStart: Date
  periodEnd: Date
  createdAt: Date
  reviewedAt?: Date
  approvedAt?: Date
  paidAt?: Date
  failureReason?: string
  reviewNotes?: string
}

interface PayoutEligibility {
  isEligible: boolean
  reason?: string
  pendingCommissionsCount: number
  totalPendingAmount: number
}

export default function PayoutManagementPage() {
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showPaidDialog, setShowPaidDialog] = useState(false)
  const [showReverseDialog, setShowReverseDialog] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [notes, setNotes] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [reverseReason, setReverseReason] = useState('')
  
  const queryClient = useQueryClient()

  // Fetch pending payouts
  const { data: pendingPayouts, isLoading } = useQuery({
    queryKey: ['admin-payouts', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/affiliates/payouts?status=PENDING')
      if (!response.ok) throw new Error('Failed to fetch payouts')
      const data = await response.json()
      return data.payouts as Payout[]
    },
  })

  // Fetch all payouts
  const { data: allPayouts } = useQuery({
    queryKey: ['admin-payouts', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/affiliates/payouts')
      if (!response.ok) throw new Error('Failed to fetch payouts')
      const data = await response.json()
      return data.payouts as Payout[]
    },
  })

  // Check payout eligibility
  const { data: eligibility } = useQuery({
    queryKey: ['payout-eligibility', selectedAffiliate],
    queryFn: async () => {
      if (!selectedAffiliate) return null
      const response = await fetch(`/api/affiliates/payouts/eligibility/${selectedAffiliate}`)
      if (!response.ok) throw new Error('Failed to check eligibility')
      const data = await response.json()
      return data.eligibility as PayoutEligibility
    },
    enabled: !!selectedAffiliate,
  })

  // Create payout mutation
  const createPayoutMutation = useMutation({
    mutationFn: async (data: {
      affiliateId: string
      periodStart: string
      periodEnd: string
      method: string
      reviewNotes?: string
      autoApprove?: boolean
    }) => {
      const response = await fetch('/api/affiliates/payouts/create-with-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create payout')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
      setShowCreateDialog(false)
    },
  })

  // Approve payout mutation
  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/affiliates/payouts/${payoutId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) throw new Error('Failed to approve payout')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
      setShowApproveDialog(false)
      setNotes('')
    },
  })

  // Mark paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/affiliates/payouts/${payoutId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference }),
      })
      if (!response.ok) throw new Error('Failed to mark payout as paid')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
      setShowPaidDialog(false)
      setPaymentReference('')
    },
  })

  // Reverse payout mutation
  const reversePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/affiliates/payouts/${payoutId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reverseReason }),
      })
      if (!response.ok) throw new Error('Failed to reverse payout')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
      setShowReverseDialog(false)
      setReverseReason('')
    },
  })

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    createPayoutMutation.mutate({
      affiliateId: formData.get('affiliateId') as string,
      periodStart: formData.get('periodStart') as string,
      periodEnd: formData.get('periodEnd') as string,
      method: formData.get('method') as string,
      reviewNotes: formData.get('reviewNotes') as string,
      autoApprove: formData.get('autoApprove') === 'true',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.PENDING}>
        {status}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'PROCESSING':
        return <AlertTriangle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'FAILED':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Create Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Payout</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePayout} className="space-y-4">
                <div>
                  <Label htmlFor="affiliateId">Affiliate ID</Label>
                  <Input
                    id="affiliateId"
                    name="affiliateId"
                    required
                    placeholder="Enter affiliate ID"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      name="periodStart"
                      type="datetime-local"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      name="periodEnd"
                      type="datetime-local"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Select name="method" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRIPE_TRANSFER">Stripe Transfer</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reviewNotes">Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    name="reviewNotes"
                    placeholder="Optional review notes"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="autoApprove" name="autoApprove" value="true" />
                  <Label htmlFor="autoApprove">Auto-approve payout</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createPayoutMutation.isPending}>
                    {createPayoutMutation.isPending ? 'Creating...' : 'Create Payout'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => window.open('/api/affiliates/payouts/export', '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Eligibility Check */}
      <Card>
        <CardHeader>
          <CardTitle>Check Payout Eligibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="affiliateIdCheck">Affiliate ID</Label>
              <Input
                id="affiliateIdCheck"
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
                placeholder="Enter affiliate ID to check eligibility"
              />
            </div>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['payout-eligibility', selectedAffiliate] })}
              disabled={!selectedAffiliate}
            >
              Check Eligibility
            </Button>
          </div>
          
          {eligibility && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                {eligibility.isEligible ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={eligibility.isEligible ? 'text-green-600' : 'text-red-600'}>
                  {eligibility.isEligible ? 'Eligible for payout' : 'Not eligible'}
                </span>
              </div>
              {eligibility.reason && (
                <Alert>
                  <AlertDescription>{eligibility.reason}</AlertDescription>
                </Alert>
              )}
              <div className="text-sm text-gray-600">
                <p>Pending commissions: {eligibility.pendingCommissionsCount}</p>
                <p>Total pending amount: ${(eligibility.totalPendingAmount / 100).toFixed(2)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : pendingPayouts?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending payouts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts?.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payout.affiliate.user.name}</p>
                        <p className="text-sm text-gray-500">{payout.affiliate.user.email}</p>
                        <p className="text-xs text-gray-400">Code: {payout.affiliate.referralCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>${payout.amount.toFixed(2)}</TableCell>
                    <TableCell>{payout.method}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(payout.periodStart), 'MMM d, yyyy')}</p>
                        <p className="text-gray-500">to {format(new Date(payout.periodEnd), 'MMM d, yyyy')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        {getStatusBadge(payout.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={showApproveDialog && selectedPayout?.id === payout.id} onOpenChange={setShowApproveDialog}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPayout(payout)}
                            >
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Payout</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="approveNotes">Approval Notes</Label>
                                <Textarea
                                  id="approveNotes"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Optional approval notes"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => selectedPayout && approvePayoutMutation.mutate(selectedPayout.id)}
                                  disabled={approvePayoutMutation.isPending}
                                >
                                  {approvePayoutMutation.isPending ? 'Approving...' : 'Approve'}
                                </Button>
                                <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={showReverseDialog && selectedPayout?.id === payout.id} onOpenChange={setShowReverseDialog}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedPayout(payout)}
                            >
                              Reverse
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reverse Payout</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Alert>
                                <AlertDescription>
                                  This will reverse the payout and return commissions to pending status.
                                </AlertDescription>
                              </Alert>
                              <div>
                                <Label htmlFor="reverseReason">Reason for reversal</Label>
                                <Textarea
                                  id="reverseReason"
                                  value={reverseReason}
                                  onChange={(e) => setReverseReason(e.target.value)}
                                  placeholder="Reason is required"
                                  required
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => selectedPayout && reversePayoutMutation.mutate(selectedPayout.id)}
                                  disabled={reversePayoutMutation.isPending}
                                >
                                  {reversePayoutMutation.isPending ? 'Reversing...' : 'Reverse'}
                                </Button>
                                <Button variant="outline" onClick={() => setShowReverseDialog(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>All Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayouts?.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payout.affiliate.user.name}</p>
                      <p className="text-sm text-gray-500">{payout.affiliate.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>${payout.amount.toFixed(2)}</TableCell>
                  <TableCell>{payout.method}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payout.status)}
                      {getStatusBadge(payout.status)}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(payout.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {payout.status === 'PROCESSING' && (
                      <Dialog open={showPaidDialog && selectedPayout?.id === payout.id} onOpenChange={setShowPaidDialog}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedPayout(payout)}
                          >
                            Mark Paid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark Payout as Paid</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="paymentReference">Payment Reference</Label>
                              <Input
                                id="paymentReference"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                placeholder="Transaction ID or reference"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => selectedPayout && markPaidMutation.mutate(selectedPayout.id)}
                                disabled={markPaidMutation.isPending}
                              >
                                {markPaidMutation.isPending ? 'Marking...' : 'Mark as Paid'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowPaidDialog(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
