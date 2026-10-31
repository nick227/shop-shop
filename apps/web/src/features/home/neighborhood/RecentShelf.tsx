import { useRecentViews } from './recentViews'
import { ViewShelf } from './ViewShelf'

export function RecentShelf() {
  const views = useRecentViews()
  return <ViewShelf title="Recently viewed" views={views} />
}
