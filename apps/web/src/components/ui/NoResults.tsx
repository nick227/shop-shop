import React from 'react'

interface NoResultsProps {
  title?: string;
  message?: string;
  onSearchAgain?: () => void;
  onExpandSearch?: () => void;
  expandSearchText?: string;
}

export function NoResults({ 
  title = "No Results Found",
  message = "No results found for your search criteria.",
  onSearchAgain,
  onExpandSearch,
  expandSearchText = "Expand Search"
}: NoResultsProps) {
  // Determine if this is a database empty state vs search no results;
  const isDatabaseEmpty = title.includes("No Stores Available")
  
  return (
    <div className={'text-center py-12 px-6 rounded-xl my-6 ' + 
      (isDatabaseEmpty
        ? 'bg-blue-50 text-blue-800 border border-blue-200' 
        : 'bg-yellow-100 text-yellow-800')}>
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">
          {isDatabaseEmpty ? '🏪' : '🔍'}
        </div>
        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-base mb-6 leading-relaxed">{message}</p>
        
        {isDatabaseEmpty && (
          <div className="bg-blue-100 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-700">
              <strong>For Developers:</strong> The database is currently empty. 
              Consider adding sample store data for development.
            </p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center flex-wrap">
          {onSearchAgain && (
            <button
              onClick={onSearchAgain}
              className={'px-6 py-3 rounded-lg font-medium transition-colors ' + 
                (isDatabaseEmpty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700')}
            >
              {isDatabaseEmpty ? 'Refresh Page' : 'Search Again'}
            </button>
          )}
          {onExpandSearch && (
            <button
              onClick={onExpandSearch}
              className={'px-6 py-3 rounded-lg font-medium transition-colors ' + 
                (isDatabaseEmpty
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700')}
            >
              {expandSearchText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
