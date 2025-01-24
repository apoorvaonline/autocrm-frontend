import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SLAStatusIndicatorProps {
  responseDeadline?: string | null;
  resolutionDeadline?: string | null;
  firstResponseAt?: string | null;
  status: string;
  showDetails?: boolean;
}

export const SLAStatusIndicator = ({
  responseDeadline,
  resolutionDeadline,
  firstResponseAt,
  status,
  showDetails = false
}: SLAStatusIndicatorProps) => {
  const now = new Date();
  const isResolved = status === 'resolved' || status === 'closed';

  // Calculate SLA status
  const responseBreached = responseDeadline && !firstResponseAt && new Date(responseDeadline) < now;
  const resolutionBreached = resolutionDeadline && !isResolved && new Date(resolutionDeadline) < now;
  const isBreached = responseBreached || resolutionBreached;

  // Calculate time remaining or overdue
  const getTimeStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const isPast = deadlineDate < now;
    const timeDistance = formatDistanceToNow(deadlineDate, { addSuffix: true });
    return { isPast, timeDistance };
  };

  // If no SLA policy is set
  if (!responseDeadline && !resolutionDeadline) {
    return null;
  }

  // If ticket is resolved/closed
  if (isResolved) {
    return (
      <div className="flex items-center text-green-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="text-sm">SLA Met</span>
      </div>
    );
  }

  // If SLA is breached
  if (isBreached) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">SLA Breached</span>
        </div>
        {showDetails && (
          <div className="text-xs text-gray-500 mt-1">
            {responseBreached && (
              <div>
                Response: {getTimeStatus(responseDeadline).timeDistance}
              </div>
            )}
            {resolutionBreached && (
              <div>
                Resolution: {getTimeStatus(resolutionDeadline).timeDistance}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // If SLA is active but not breached
  return (
    <div className="flex flex-col">
      <div className="flex items-center text-blue-600">
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">SLA Active</span>
      </div>
      {showDetails && (
        <div className="text-xs text-gray-500 mt-1">
          {responseDeadline && !firstResponseAt && (
            <div>
              Response due {getTimeStatus(responseDeadline).timeDistance}
            </div>
          )}
          {resolutionDeadline && (
            <div>
              Resolution due {getTimeStatus(resolutionDeadline).timeDistance}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 