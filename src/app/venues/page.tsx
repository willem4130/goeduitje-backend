export default function VenuesPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b bg-background">
        <h1 className="text-2xl font-bold">Festival Venue Database</h1>
        <p className="text-sm text-muted-foreground">
          Browse and search festival venues across the Netherlands
        </p>
      </div>
      <iframe
        src="https://willem4130.github.io/FestivalScrapeTribute/"
        className="flex-1 w-full border-0"
        title="Festival Venue Database"
        allow="fullscreen"
      />
    </div>
  )
}
