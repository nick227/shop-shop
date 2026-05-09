/**
 * ApplicationStatusPage - Check vendor application status
 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Alert, Badge } from '@shared/ui/primitives'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
import { authGet } from '@shared/lib/auth/authFetch'

interface VendorApplication {
  id: string
  status: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  businessName: string
  businessType: string
  createdAt: string
  reviewedAt?: string
  rejectionReason?: string
  reviewNotes?: string
}

export default function ApplicationStatusPage() {
  const navigate = useNavigate()

  const { data: application, isLoading, error } = useQuery({
    queryKey: ['vendor-application-status'],
    queryFn: async () => {
      const response = await authGet('/vendor/application-status')
      if (!response.ok) {
        throw new Error('Failed to fetch application status')
      }
      return response.json()
    },
  })

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'warning',
          title: 'Application Draft',
          description: 'Complete your application and submit it for review.'
        }
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return {
          icon: Clock,
          color: 'info',
          title: 'Under Review',
          description: 'Your application is being reviewed by our team.'
        }
      case 'APPROVED':
        return {
          icon: CheckCircle,
          color: 'success',
          title: 'Approved!',
          description: 'Congratulations! Your vendor application has been approved.'
        }
      case 'REJECTED':
        return {
          icon: XCircle,
          color: 'destructive',
          title: 'Application Rejected',
          description: 'Your application was not approved at this time.'
        }
      default:
        return {
          icon: Clock,
          color: 'warning',
          title: 'Unknown Status',
          description: 'Please contact support for assistance.'
        }
    }
  }

  if (isLoading) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-2xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading application status...</p>
        </div>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-2xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <Alert variant="error">
            Failed to load application status. Please try again later.
          </Alert>
        </div>
      </PageShell>
    )
  }

  if (!application) {
    return (
      <PageShell className="bg-background" containerClassName="max-w-2xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <Alert variant="info">
            No vendor application found. 
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/vendor/apply')}
            >
              Apply Now
            </Button>
          </Alert>
        </div>
      </PageShell>
    )
  }

  const statusInfo = getStatusInfo(application.status)
  const StatusIcon = statusInfo.icon

  return (
    <PageShell className="bg-background" containerClassName="max-w-2xl" contentClassName="py-6 md:py-6">
      <PageHeader
        title="Application Status"
        description="Track your vendor application progress"
      />

      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-4 mb-4">
            <StatusIcon className={`h-8 w-8 text-${statusInfo.color}`} />
            <div>
              <h2 className="text-xl font-semibold">{statusInfo.title}</h2>
              <Badge variant={statusInfo.color as any} className="ml-2">
                {application.status}
              </Badge>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4">{statusInfo.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Business Name:</span>
              <p className="text-muted-foreground">{application.businessName}</p>
            </div>
            <div>
              <span className="font-medium">Business Type:</span>
              <p className="text-muted-foreground">{application.businessType}</p>
            </div>
            <div>
              <span className="font-medium">Submitted:</span>
              <p className="text-muted-foreground">
                {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
            {application.reviewedAt && (
              <div>
                <span className="font-medium">Reviewed:</span>
                <p className="text-muted-foreground">
                  {new Date(application.reviewedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          {application.status === 'REJECTED' && application.rejectionReason && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <h3 className="font-medium text-destructive mb-2">Reason for Rejection</h3>
              <p className="text-destructive/80">{application.rejectionReason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {application.status === 'PENDING' && (
              <Button 
                variant="primary" 
                onClick={() => navigate('/vendor/apply')}
              >
                Complete Application
              </Button>
            )}
            
            {application.status === 'APPROVED' && (
              <Button 
                variant="primary" 
                onClick={() => navigate('/vendor/dashboard')}
              >
                Go to Vendor Dashboard
              </Button>
            )}
            
            {application.status === 'REJECTED' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/vendor/apply')}
              >
                Submit New Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
